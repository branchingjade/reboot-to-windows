import { call, definePlugin } from "@decky/api";
import {
  ButtonItem,
  ConfirmModal,
  DropdownItem,
  PanelSection,
  PanelSectionRow,
  showModal,
} from "@decky/ui";
import { useEffect, useState } from "react";
import { FaWindows } from "react-icons/fa";
import { Lang, LANGS, loadLang, saveLang, strings } from "./i18n";

type StatusResult = {
  ok: boolean;
  has_windows?: boolean;
  boot_next?: string | null;
  is_root?: boolean;
  error_code?: string;
  error?: string;
};

type ActionResult = {
  ok: boolean;
  pending?: boolean;
  cleared?: string;
  error_code?: string;
  error?: string;
};

function RebootToWindowsPanel() {
  const [lang, setLang] = useState<Lang>(loadLang);
  const t = strings[lang];

  const [busy, setBusy] = useState<"switch" | "cancel" | null>(null);
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localizeError = (code?: string): string => {
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

  const describeError = (r: { error_code?: string; error?: string }): string => {
    const head = localizeError(r.error_code);
    return r.error ? `${head} (${r.error})` : head;
  };

  const refresh = (): void => {
    call<[], StatusResult>("status")
      .then((s) => {
        setStatus(s);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  };

  useEffect(() => {
    refresh();
  }, []);

  const runSwitch = (): void => {
    setBusy("switch");
    setNote(null);
    setError(null);
    call<[], ActionResult>("switch")
      .then((r) => {
        if (r && r.ok) {
          // The machine is going down; keep the panel in the busy state.
          setNote(t.buttonSwitching);
        } else {
          setBusy(null);
          setError(describeError(r ?? {}));
        }
      })
      .catch((e) => {
        setBusy(null);
        setError(String(e));
      });
  };

  const confirmSwitch = (): void => {
    showModal(
      <ConfirmModal
        strTitle={t.confirmTitle}
        strDescription={t.confirmBody}
        strOKButtonText={t.confirmOk}
        strCancelButtonText={t.confirmCancel}
        onOK={runSwitch}
      />
    );
  };

  const runCancel = (): void => {
    setBusy("cancel");
    setNote(null);
    setError(null);
    call<[], ActionResult>("cancel")
      .then((r) => {
        setBusy(null);
        if (r && r.ok) {
          setNote(r.pending ? t.cancelled : t.nothingPending);
          refresh();
        } else {
          setError(describeError(r ?? {}));
        }
      })
      .catch((e) => {
        setBusy(null);
        setError(String(e));
      });
  };

  let statusLine: string;
  if (busy === "switch") {
    statusLine = t.buttonSwitching;
  } else if (note) {
    statusLine = note;
  } else if (error) {
    statusLine = t.errorPrefix + error;
  } else if (!status) {
    statusLine = t.checking;
  } else if (status.ok === false) {
    statusLine = t.errorPrefix + describeError(status);
  } else if (status.has_windows) {
    statusLine = t.ready;
  } else {
    statusLine = t.noWindows;
  }

  const pending = status?.boot_next ?? null;
  const failed = Boolean(error) || status?.ok === false;

  return (
    <PanelSection title={t.panelTitle}>
      <PanelSectionRow>
        <div
          style={{
            padding: "8px",
            color: failed ? "#ff6b6b" : "#8b9bb4",
            fontSize: "13px",
          }}
        >
          {statusLine}
        </div>
      </PanelSectionRow>

      {pending && !error && (
        <PanelSectionRow>
          <div style={{ padding: "0 8px 8px", color: "#e5b567", fontSize: "12px" }}>
            {t.pending(pending)}
          </div>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          disabled={busy !== null || status?.has_windows === false}
          onClick={() => {
            if (busy !== null) return;
            confirmSwitch();
          }}
        >
          {busy === "switch" ? t.buttonSwitching : t.buttonSwitch}
        </ButtonItem>
      </PanelSectionRow>

      {pending && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            disabled={busy !== null}
            onClick={() => {
              if (busy !== null) return;
              runCancel();
            }}
          >
            {busy === "cancel" ? "…" : t.buttonCancel}
          </ButtonItem>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <DropdownItem
          label={t.languageLabel}
          rgOptions={LANGS}
          selectedOption={lang}
          onChange={(option) => {
            const next = option.data as Lang;
            setLang(next);
            saveLang(next);
          }}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <div style={{ fontSize: "0.75rem", opacity: 0.7, padding: "0 16px" }}>
          {t.footer}
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
}

export default definePlugin(() => ({
  name: "Reboot to Windows",
  content: <RebootToWindowsPanel />,
  icon: <FaWindows />,
  onDismount() {},
}));
