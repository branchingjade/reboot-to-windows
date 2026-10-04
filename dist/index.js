const manifest = {"name":"Reboot to Windows"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const call = api.call;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaWindows (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"},"child":[]}]})(props);
}

/**
 * Tiny two-language dictionary for the plugin panel.
 *
 * Chinese is the default (as requested); the choice is remembered in
 * localStorage under a plugin-private key. Everything is wrapped in
 * try/catch because the Steam UI context can deny storage access.
 */
const STORAGE_KEY = "reboot-to-windows.lang";
const LANGS = [
    { data: "zh", label: "中文" },
    { data: "en", label: "English" },
];
function loadLang() {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === "zh" || saved === "en") {
            return saved;
        }
    }
    catch {
        /* storage unavailable — fall through to the default */
    }
    return "zh";
}
function saveLang(lang) {
    try {
        window.localStorage.setItem(STORAGE_KEY, lang);
    }
    catch {
        /* ignore */
    }
}
const strings = {
    zh: {
        panelTitle: "切到 Windows",
        languageLabel: "语言 / Language",
        checking: "正在查询引导状态…",
        ready: "Windows 引导条目就绪。点击下方按钮重启切换 —— 仅本次生效，下次开机自动回到 SteamOS。",
        noWindows: "未检测到 Windows 引导条目（Boot0000）。",
        pending: (entry) => `已排队：下次启动进入引导条目 ${entry}。`,
        buttonSwitch: "重启进 Windows",
        buttonSwitching: "重启中…",
        buttonCancel: "取消已排队的切换",
        cancelled: "已清除排队的启动项，下次开机仍是 SteamOS。",
        nothingPending: "当前没有排队的启动项。",
        confirmTitle: "重启进入 Windows 11？",
        confirmBody: "系统会立即重启并进入 Windows 11。这是一次性设置，下次开机仍会自动回到 SteamOS。请先保存正在进行的游戏进度。",
        confirmOk: "立即重启",
        confirmCancel: "取消",
        errorPrefix: "⚠ ",
        errRead: "读取 UEFI 引导项失败",
        errNeedsPrivileges: "插件后端没有 root 权限，无法读写 UEFI 引导项。请确认 plugin.json 里有 \"flags\": [\"root\"]，或在终端里以 root 身份安装 /etc/sudoers.d/zz-steamos-switch。",
        errSet: "设置下次启动项失败",
        errReboot: "重启命令没有生效，本次切换未完成",
        errNoEntry: "没有找到 Windows 引导条目，已取消操作",
        errClear: "清除排队的启动项失败",
        errUnexpected: "操作失败",
        footer: "原理：插件通过 efibootmgr 把 UEFI 的一次性启动项（BootNext）指向 Windows 引导条目，然后重启；该设置只生效一次，之后固件自动回到正常的启动顺序。",
    },
    en: {
        panelTitle: "Switch to Windows",
        languageLabel: "语言 / Language",
        checking: "Checking the boot configuration…",
        ready: "Windows boot entry is ready. Press the button below to restart into it — this is a one-shot switch, the next boot returns to SteamOS.",
        noWindows: "No Windows boot entry found (Boot0000).",
        pending: (entry) => `Queued: the next boot will use entry ${entry}.`,
        buttonSwitch: "Restart into Windows",
        buttonSwitching: "Restarting…",
        buttonCancel: "Cancel the queued switch",
        cancelled: "Queued boot entry cleared — the next boot stays on SteamOS.",
        nothingPending: "Nothing is queued right now.",
        confirmTitle: "Restart into Windows 11?",
        confirmBody: "The system restarts immediately into Windows 11. This is a one-shot setting: the following boot returns to SteamOS automatically. Save any unsaved game progress first.",
        confirmOk: "Restart now",
        confirmCancel: "Cancel",
        errorPrefix: "⚠ ",
        errRead: "Could not read the UEFI boot entries",
        errNeedsPrivileges: "The plugin backend is not running as root, so it cannot read or write the UEFI boot variables. Make sure plugin.json declares \"flags\": [\"root\"], or install /etc/sudoers.d/zz-steamos-switch as root.",
        errSet: "Could not set the next boot entry",
        errReboot: "The restart command did not take effect, nothing was switched",
        errNoEntry: "No Windows boot entry was found, nothing was changed",
        errClear: "Could not clear the queued boot entry",
        errUnexpected: "Operation failed",
        footer: "How it works: the plugin points the UEFI one-shot boot variable (BootNext) at the Windows entry with efibootmgr, then reboots. The setting applies once; the firmware then falls back to the normal boot order.",
    },
};

function RebootToWindowsPanel() {
    const [lang, setLang] = SP_REACT.useState(loadLang);
    const t = strings[lang];
    const [busy, setBusy] = SP_REACT.useState(null);
    const [status, setStatus] = SP_REACT.useState(null);
    const [note, setNote] = SP_REACT.useState(null);
    const [error, setError] = SP_REACT.useState(null);
    const localizeError = (code) => {
        switch (code) {
            case "efibootmgr_read_failed":
                return t.errRead;
            case "needs_privileges":
                return t.errNeedsPrivileges;
            case "efibootmgr_set_failed":
                return t.errSet;
            case "reboot_failed":
                return t.errReboot;
            case "no_windows_entry":
                return t.errNoEntry;
            case "efibootmgr_clear_failed":
                return t.errClear;
            default:
                return t.errUnexpected;
        }
    };
    const describeError = (r) => {
        const head = localizeError(r.error_code);
        return r.error ? `${head} (${r.error})` : head;
    };
    const refresh = () => {
        call("status")
            .then((s) => {
            setStatus(s);
            setError(null);
        })
            .catch((e) => setError(String(e)));
    };
    SP_REACT.useEffect(() => {
        refresh();
    }, []);
    const runSwitch = () => {
        setBusy("switch");
        setNote(null);
        setError(null);
        call("switch")
            .then((r) => {
            if (r && r.ok) {
                // The machine is going down; keep the panel in the busy state.
                setNote(t.buttonSwitching);
            }
            else {
                setBusy(null);
                setError(describeError(r ?? {}));
            }
        })
            .catch((e) => {
            setBusy(null);
            setError(String(e));
        });
    };
    const confirmSwitch = () => {
        DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: t.confirmTitle, strDescription: t.confirmBody, strOKButtonText: t.confirmOk, strCancelButtonText: t.confirmCancel, onOK: runSwitch }));
    };
    const runCancel = () => {
        setBusy("cancel");
        setNote(null);
        setError(null);
        call("cancel")
            .then((r) => {
            setBusy(null);
            if (r && r.ok) {
                setNote(r.pending ? t.cancelled : t.nothingPending);
                refresh();
            }
            else {
                setError(describeError(r ?? {}));
            }
        })
            .catch((e) => {
            setBusy(null);
            setError(String(e));
        });
    };
    let statusLine;
    if (busy === "switch") {
        statusLine = t.buttonSwitching;
    }
    else if (note) {
        statusLine = note;
    }
    else if (error) {
        statusLine = t.errorPrefix + error;
    }
    else if (!status) {
        statusLine = t.checking;
    }
    else if (status.ok === false) {
        statusLine = t.errorPrefix + describeError(status);
    }
    else if (status.has_windows) {
        statusLine = t.ready;
    }
    else {
        statusLine = t.noWindows;
    }
    const pending = status?.boot_next ?? null;
    const failed = Boolean(error) || status?.ok === false;
    return (SP_JSX.jsxs(DFL.PanelSection, { title: t.panelTitle, children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: {
                        padding: "8px",
                        color: failed ? "#ff6b6b" : "#8b9bb4",
                        fontSize: "13px",
                    }, children: statusLine }) }), pending && !error && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { padding: "0 8px 8px", color: "#e5b567", fontSize: "12px" }, children: t.pending(pending) }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy !== null || status?.has_windows === false, onClick: () => {
                        if (busy !== null)
                            return;
                        confirmSwitch();
                    }, children: busy === "switch" ? t.buttonSwitching : t.buttonSwitch }) }), pending && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy !== null, onClick: () => {
                        if (busy !== null)
                            return;
                        runCancel();
                    }, children: busy === "cancel" ? "…" : t.buttonCancel }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: t.languageLabel, rgOptions: LANGS, selectedOption: lang, onChange: (option) => {
                        const next = option.data;
                        setLang(next);
                        saveLang(next);
                    } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { fontSize: "0.75rem", opacity: 0.7, padding: "0 16px" }, children: t.footer }) })] }));
}
var index = definePlugin(() => ({
    name: "Reboot to Windows",
    content: SP_JSX.jsx(RebootToWindowsPanel, {}),
    icon: SP_JSX.jsx(FaWindows, {}),
    onDismount() { },
}));

export { index as default };
//# sourceMappingURL=index.js.map
