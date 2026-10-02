# Reboot to Windows

**English** · [简体中文](README.md)

A [Decky Loader](https://decky.xyz) plugin that reboots a SteamOS machine **into Windows 11 with a
single click** — as a *one-shot* switch, so the next boot returns to SteamOS automatically and the
machine is never left stranded in Windows.

Built for Steam Deck / SteamOS machines that dual-boot Windows 11 from the same drive and EFI
system partition.

## Features

- One click in the Decky side panel (QAM): sets the UEFI **one-shot** boot variable (`BootNext`) to
  the Windows entry with `efibootmgr -n 0000`, then reboots straight into Windows Boot Manager
- **One-shot by design**: `BootNext` is volatile and is consumed on that very boot, so the following
  power-on uses the normal boot order (SteamOS)
- The panel reports the current state: whether a Windows entry exists and whether a switch is queued
- **Cancel** a queued switch (`efibootmgr -N`) if you pressed the button by accident
- A confirmation dialog before rebooting, so a stray press cannot kill a running game
- **Bilingual panel** (Chinese / English) with Chinese as the default, switchable in the panel and
  remembered locally
- Self-healing: the backend re-installs its passwordless sudo rule on every load, so a SteamOS image
  update wiping `/etc/sudoers.d/*` no longer breaks it
- Pure Python backend, no bundled binaries, no Steam files touched

## Interface language

The dropdown at the bottom of the panel offers **中文** (default) and **English**; the choice is
stored locally.

## Install

- **Manual**: download `RebootToWindows.zip` from the
  [Releases](https://github.com/branchingjade/reboot-to-windows/releases) page and use
  *Decky → Settings → General → Install Plugin from file*, or unzip it into `~/homebrew/plugins/`.
- **From source**: copy `plugin.json`, `main.py` and `dist/` into
  `~/homebrew/plugins/reboot-to-windows/`, then reload the plugin (or Decky) from the panel.

## How it works

1. The backend reads the boot entries with `efibootmgr` and checks that `Boot0000`
   (Windows Boot Manager) exists.
2. After you confirm, it runs `efibootmgr -n 0000`, pointing the UEFI **one-shot** boot variable at
   Windows.
3. It then runs `systemctl reboot`. The firmware boots Windows and clears `BootNext`.
4. The next power-on uses the normal `BootOrder` and returns to SteamOS.

## Privileges: why no password is needed

Decky 3.x starts plugin backends as the **desktop user** (`uid 1000`) by default, and that identity can
neither read nor write the UEFI boot variables. This plugin therefore declares:

```json
"flags": ["root"]
```

Decky then starts the backend as **`uid 0`** (verified on-device: the backend process runs as `root`).
On top of that there are two independent working paths, and either one alone needs no password:

1. Running as root, it calls `efibootmgr` and `systemctl reboot` directly — no `sudo` at all.
2. On load, and before every switch, it recreates the passwordless drop-in
   `/etc/sudoers.d/zz-steamos-switch` (0440 root:root):

```
deck ALL=(root) NOPASSWD: /usr/bin/efibootmgr
deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot
deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot *
```

SteamOS keeps `/etc` on an overlay and rebuilds its upper directory on image updates, dropping custom
files. The plugin writes the rule back on its next load, so that failure does not come back. If the
backend were ever *not* root (for example if the `flags` entry were removed by hand), the `sudo -n`
fallback still works; and if neither path is available the panel reports `needs_privileges` instead of
a bare `sudo: a password is required`.

> One-off manual repair (only needed if the root flag stops working):
>
> ```bash
> sudo install -m 0440 -o root -g root /dev/stdin /etc/sudoers.d/zz-steamos-switch <<'EOF'
> deck ALL=(root) NOPASSWD: /usr/bin/efibootmgr
> deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot
> deck ALL=(root) NOPASSWD: /usr/bin/systemctl reboot *
> EOF
> ```

## Requirements

- A Windows + SteamOS dual-boot machine where the Windows entry is `Boot0000` (usually created by the
  Windows installer as `Boot0000* Windows Boot Manager`).
- If your Windows entry has a different number, change `WINDOWS_BOOT_ENTRY` in `main.py`.

## Troubleshooting

Logs: `~/homebrew/logs/Reboot to Windows/*.log`

- **"No Windows boot entry found"** — `efibootmgr` printed no `Boot0000* Windows Boot Manager`. Run
  `efibootmgr -v` and check the real number.
- **"Could not read the UEFI boot entries" / `sudo: a password is required`** — the backend is not
  root *and* the passwordless rule is gone. Check that `"flags": ["root"]` is still in `plugin.json`
  and whether `/etc/sudoers.d/zz-steamos-switch` exists (repair command above).
- **The button rebooted back into SteamOS** — something else cleared `BootNext`. Right after pressing
  the button, `efibootmgr | head -2` should show `BootNext: 0000`.

## Build from source

```bash
pnpm install
pnpm run build      # produces dist/index.js
```

The folder Decky loads needs `plugin.json`, `main.py` and `dist/`.

## Changelog

### 1.0.0

- First public release
- One-shot `BootNext` switch with an immediate reboot and a confirmation dialog
- Bilingual panel (Chinese default, English available)
- Cancel a queued switch from the panel
- Declares `"flags": ["root"]`; the backend runs as root and self-heals its passwordless sudo rule
- Backend returns `error_code` values that the frontend localizes

## Credits

- Based on the [Decky plugin template](https://github.com/SteamDeckHomebrew/decky-plugin-template).
- The self-healing sudoers idea comes from the author's own SteamOS field notes.

## License

BSD-3-Clause, see [LICENSE](LICENSE).
