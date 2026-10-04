"""Reboot to Windows — Decky backend.

One-shot reboot from SteamOS into Windows 11 through the UEFI ``BootNext``
variable (Windows Boot Manager is normally ``Boot0000``). Because it is a
one-shot variable, the firmware falls back to the normal ``BootOrder`` on the
following boot, which is SteamOS.

Privileges: Decky 3.x starts plugin backends as the desktop user by default
(``uid 1000``), which cannot write the UEFI boot variables. This plugin
therefore declares ``"flags": ["root"]`` in ``plugin.json``, so the loader
starts the backend as ``uid 0``. Two independent paths then guarantee that no
password is ever needed:

1. As root, ``efibootmgr`` and ``systemctl reboot`` are called directly.
2. On load (and before every switch) the backend re-installs the NOPASSWD
   drop-in ``/etc/sudoers.d/zz-steamos-switch``, which keeps the ``sudo -n``
   fallback working even if the plugin is ever started unprivileged. SteamOS
   rebuilds the ``/etc`` overlay on image updates and drops custom files there,
   so this self-heals automatically after an update.

If neither path is available the backend reports ``error_code
"needs_privileges"`` instead of failing with a raw sudo message.

The backend never returns localized prose: it returns ``error_code`` values
that the frontend translates, plus the raw tool output as a fallback.
"""

import asyncio
import os
import subprocess

import decky

WINDOWS_BOOT_ENTRY = "0000"  # Boot0000 = Windows Boot Manager
EFIBOOTMGR = "/usr/bin/efibootmgr"
SYSTEMCTL = "/usr/bin/systemctl"

SUDOERS_PATH = "/etc/sudoers.d/zz-steamos-switch"
SUDOERS_BODY = (
    "# One-shot dual-boot switch to Windows 11 (Decky \"Reboot to Windows\" plugin).\n"
    "# Auto-managed by the plugin backend; safe to delete, it is re-created on load.\n"
    "deck ALL=(root) NOPASSWD: /usr/bin/efibootmgr\n"
    "deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot\n"
    "deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot *\n"
)


def _is_root():
    try:
        return os.geteuid() == 0
    except AttributeError:
        return False


# Decky's loader is a PyInstaller one-file build: it exports LD_LIBRARY_PATH
# pointing at its own /tmp/_MEIxxxx bundle, which ships an older libcrypto.so.3.
# Plugin backends inherit that environment, and /usr/bin/systemctl links against
# libsystemd-shared, which needs OPENSSL_3.4.0, so systemctl dies inside the
# dynamic loader before logind is ever contacted:
#
#   /usr/bin/systemctl: /tmp/_MEI.../libcrypto.so.3: version `OPENSSL_3.4.0'
#   not found (required by /usr/lib/systemd/libsystemd-shared-257.7-*.so)
#
# efibootmgr does not use OpenSSL, which is why setting BootNext kept working
# while the reboot silently did nothing (the panel then looked like it had
# "queued" the switch). Strip the injected library paths from every child.
_ENV_DROP = ("LD_LIBRARY_PATH", "LD_PRELOAD", "LD_AUDIT", "LD_DEBUG")


def _child_env():
    env = dict(os.environ)
    for key in _ENV_DROP:
        env.pop(key, None)
    return env


def _install_sudoers_rule(force=False):
    """Re-create the NOPASSWD drop-in. Only meaningful when running as root."""
    if not _is_root():
        return "skipped: not root"
    try:
        try:
            with open(SUDOERS_PATH, "r", encoding="utf-8") as fh:
                if not force and fh.read() == SUDOERS_BODY:
                    return "already present"
        except OSError:
            pass
        if not os.path.isdir(os.path.dirname(SUDOERS_PATH)):
            return "skipped: no /etc/sudoers.d"
        tmp = SUDOERS_PATH + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            fh.write(SUDOERS_BODY)
        os.chmod(tmp, 0o440)
        try:
            os.chown(tmp, 0, 0)
        except OSError:
            pass
        os.replace(tmp, SUDOERS_PATH)
        return "installed"
    except Exception as e:
        return "failed: %s" % e


def _run_sync(argv, timeout=5):
    if _is_root():
        cmd = argv
    else:
        cmd = ["sudo", "-n"] + argv
    return subprocess.run(
        cmd, capture_output=True, text=True, timeout=timeout, env=_child_env(),
    )


def _parse_boot_next(text):
    for line in text.splitlines():
        if line.startswith("BootNext:"):
            return line.split(":", 1)[1].strip()
    return None


def _error_code_for(stderr):
    """Map raw efibootmgr/sudo output to a stable code the UI can translate."""
    if not _is_root() and "password is required" in (stderr or ""):
        return "needs_privileges"
    return "efibootmgr_read_failed"


def _reboot_argvs():
    """Candidate reboot commands, best first. ``sudo`` sanitizes the environment
    on its own, so it stays a valid fallback if the direct exec ever breaks."""
    if _is_root():
        return [[SYSTEMCTL, "reboot"], ["sudo", "-n", SYSTEMCTL, "reboot"]]
    return [["sudo", "-n", SYSTEMCTL, "reboot"]]


def _dispatch_reboot(timeout=8):
    """Fire the reboot and report whether it was actually accepted.

    A bare ``Popen`` used to hide the failure completely: the child aborted in
    the dynamic loader and the panel still claimed success. Now the command is
    reaped, its exit status is checked, and a failing direct exec is retried
    through ``sudo -n``.
    """
    last = ""
    for argv in _reboot_argvs():
        try:
            proc = subprocess.Popen(
                argv, env=_child_env(),
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            )
            try:
                _, err = proc.communicate(timeout=timeout)
            except subprocess.TimeoutExpired:
                # Still running after the grace period: the shutdown is under way.
                return {"ok": True}
            if proc.returncode == 0:
                return {"ok": True}
            last = (err or "").strip() or "rc=%s" % proc.returncode
        except Exception as e:  # noqa: BLE001 - reported to the frontend
            last = str(e)
        decky.logger.error("reboot via %s failed: %s", argv, last)
    return {"ok": False, "error": last or "reboot command failed"}


class Plugin:
    async def _main(self):
        decky.logger.info(
            "Reboot to Windows loaded (euid=%s, sudoers=%s, rule=%s)",
            os.geteuid(), SUDOERS_PATH, _install_sudoers_rule(),
        )

    async def _unload(self):
        decky.logger.info("Reboot to Windows unloaded")

    async def _uninstall(self):
        pass

    async def _migration(self):
        pass

    async def status(self):
        """Report whether a Windows boot entry exists and what BootNext is."""
        try:
            out = await asyncio.to_thread(_run_sync, [EFIBOOTMGR])
            text = out.stdout or ""
            if out.returncode != 0:
                stderr = (out.stderr or "").strip()
                decky.logger.error("efibootmgr rc=%s stderr=%s", out.returncode, stderr)
                return {
                    "ok": False,
                    "error_code": _error_code_for(stderr),
                    "error": stderr,
                }
            has_windows = "Windows Boot Manager" in text and "Boot0000" in text
            boot_next = _parse_boot_next(text)
            decky.logger.info(
                "status ok: has_windows=%s boot_next=%s", has_windows, boot_next,
            )
            return {
                "ok": True,
                "has_windows": has_windows,
                "boot_next": boot_next,
                "is_root": _is_root(),
            }
        except Exception as e:
            decky.logger.error("status exception: %s", e)
            return {"ok": False, "error_code": "unexpected", "error": str(e)}

    async def switch(self):
        """Set BootNext to the Windows entry and reboot immediately."""
        try:
            # Self-heal in case the /etc overlay was rebuilt since load.
            decky.logger.info("switch: sudoers rule -> %s", _install_sudoers_rule())

            # Refuse to reboot blindly if the Windows entry is not there.
            probe = await asyncio.to_thread(_run_sync, [EFIBOOTMGR])
            text = probe.stdout or ""
            if probe.returncode != 0:
                return {
                    "ok": False,
                    "error_code": _error_code_for(probe.stderr),
                    "error": (probe.stderr or "").strip(),
                }
            if "Windows Boot Manager" not in text or "Boot0000" not in text:
                return {"ok": False, "error_code": "no_windows_entry"}

            r = await asyncio.to_thread(
                _run_sync, [EFIBOOTMGR, "-n", WINDOWS_BOOT_ENTRY],
            )
            decky.logger.info(
                "switch: efibootmgr rc=%s stderr=%s",
                r.returncode, (r.stderr or "").strip(),
            )
            if r.returncode != 0:
                return {
                    "ok": False,
                    "error_code": "efibootmgr_set_failed",
                    "error": (r.stderr or "").strip(),
                }
            result = await asyncio.to_thread(_dispatch_reboot)
            decky.logger.info("switch: reboot dispatch -> %s", result)
            if not result.get("ok"):
                return {
                    "ok": False,
                    "error_code": "reboot_failed",
                    "error": result.get("error", ""),
                }
            return {"ok": True}
        except Exception as e:
            decky.logger.error("switch exception: %s", e)
            return {"ok": False, "error_code": "unexpected", "error": str(e)}

    async def cancel(self):
        """Drop a pending one-shot BootNext so the next boot stays on SteamOS."""
        try:
            decky.logger.info("cancel: sudoers rule -> %s", _install_sudoers_rule())
            probe = await asyncio.to_thread(_run_sync, [EFIBOOTMGR])
            if probe.returncode != 0:
                return {
                    "ok": False,
                    "error_code": _error_code_for(probe.stderr),
                    "error": (probe.stderr or "").strip(),
                }
            entry = _parse_boot_next(probe.stdout or "")
            if not entry:
                return {"ok": True, "pending": False}
            r = await asyncio.to_thread(_run_sync, [EFIBOOTMGR, "-N", entry])
            decky.logger.info(
                "cancel: cleared BootNext=%s rc=%s stderr=%s",
                entry, r.returncode, (r.stderr or "").strip(),
            )
            if r.returncode != 0:
                return {
                    "ok": False,
                    "error_code": "efibootmgr_clear_failed",
                    "error": (r.stderr or "").strip(),
                }
            return {"ok": True, "pending": True, "cleared": entry}
        except Exception as e:
            decky.logger.error("cancel exception: %s", e)
            return {"ok": False, "error_code": "unexpected", "error": str(e)}
