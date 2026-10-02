/**
 * Tiny two-language dictionary for the plugin panel.
 *
 * Chinese is the default (as requested); the choice is remembered in
 * localStorage under a plugin-private key. Everything is wrapped in
 * try/catch because the Steam UI context can deny storage access.
 */

export type Lang = "zh" | "en";

const STORAGE_KEY = "reboot-to-windows.lang";

export const LANGS: { data: Lang; label: string }[] = [
  { data: "zh", label: "中文" },
  { data: "en", label: "English" },
];

export function loadLang(): Lang {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") {
      return saved;
    }
  } catch {
    /* storage unavailable — fall through to the default */
  }
  return "zh";
}

export function saveLang(lang: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

export interface Strings {
  panelTitle: string;
  languageLabel: string;
  checking: string;
  ready: string;
  noWindows: string;
  pending: (entry: string) => string;
  buttonSwitch: string;
  buttonSwitching: string;
  buttonCancel: string;
  cancelled: string;
  nothingPending: string;
  confirmTitle: string;
  confirmBody: string;
  confirmOk: string;
  confirmCancel: string;
  errorPrefix: string;
  errRead: string;
  errNeedsPrivileges: string;
  errSet: string;
  errNoEntry: string;
  errClear: string;
  errUnexpected: string;
  footer: string;
}

export const strings: Record<Lang, Strings> = {
  zh: {
    panelTitle: "切到 Windows",
    languageLabel: "语言 / Language",
    checking: "正在查询引导状态…",
    ready: "Windows 引导条目就绪。点击下方按钮重启切换 —— 仅本次生效，下次开机自动回到 SteamOS。",
    noWindows: "未检测到 Windows 引导条目（Boot0000）。",
    pending: (entry: string) => `已排队：下次启动进入引导条目 ${entry}。`,
    buttonSwitch: "重启进 Windows",
    buttonSwitching: "重启中…",
    buttonCancel: "取消已排队的切换",
    cancelled: "已清除排队的启动项，下次开机仍是 SteamOS。",
    nothingPending: "当前没有排队的启动项。",
    confirmTitle: "重启进入 Windows 11？",
    confirmBody:
      "系统会立即重启并进入 Windows 11。这是一次性设置，下次开机仍会自动回到 SteamOS。请先保存正在进行的游戏进度。",
    confirmOk: "立即重启",
    confirmCancel: "取消",
    errorPrefix: "⚠ ",
    errRead: "读取 UEFI 引导项失败",
    errNeedsPrivileges:
      "插件后端没有 root 权限，无法读写 UEFI 引导项。请确认 plugin.json 里有 \"flags\": [\"root\"]，或在终端里以 root 身份安装 /etc/sudoers.d/zz-steamos-switch。",
    errSet: "设置下次启动项失败",
    errNoEntry: "没有找到 Windows 引导条目，已取消操作",
    errClear: "清除排队的启动项失败",
    errUnexpected: "操作失败",
    footer:
      "原理：插件通过 efibootmgr 把 UEFI 的一次性启动项（BootNext）指向 Windows 引导条目，然后重启；该设置只生效一次，之后固件自动回到正常的启动顺序。",
  },
  en: {
    panelTitle: "Switch to Windows",
    languageLabel: "语言 / Language",
    checking: "Checking the boot configuration…",
    ready:
      "Windows boot entry is ready. Press the button below to restart into it — this is a one-shot switch, the next boot returns to SteamOS.",
    noWindows: "No Windows boot entry found (Boot0000).",
    pending: (entry: string) => `Queued: the next boot will use entry ${entry}.`,
    buttonSwitch: "Restart into Windows",
    buttonSwitching: "Restarting…",
    buttonCancel: "Cancel the queued switch",
    cancelled: "Queued boot entry cleared — the next boot stays on SteamOS.",
    nothingPending: "Nothing is queued right now.",
    confirmTitle: "Restart into Windows 11?",
    confirmBody:
      "The system restarts immediately into Windows 11. This is a one-shot setting: the following boot returns to SteamOS automatically. Save any unsaved game progress first.",
    confirmOk: "Restart now",
    confirmCancel: "Cancel",
    errorPrefix: "⚠ ",
    errRead: "Could not read the UEFI boot entries",
    errNeedsPrivileges:
      "The plugin backend is not running as root, so it cannot read or write the UEFI boot variables. Make sure plugin.json declares \"flags\": [\"root\"], or install /etc/sudoers.d/zz-steamos-switch as root.",
    errSet: "Could not set the next boot entry",
    errNoEntry: "No Windows boot entry was found, nothing was changed",
    errClear: "Could not clear the queued boot entry",
    errUnexpected: "Operation failed",
    footer:
      "How it works: the plugin points the UEFI one-shot boot variable (BootNext) at the Windows entry with efibootmgr, then reboots. The setting applies once; the firmware then falls back to the normal boot order.",
  },
};
