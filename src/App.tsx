import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import {
  CreditCard,
  Target,
  Route,
  Sparkles,
  Compass,
  BookOpen,
  Settings2,
  ChevronDown,
  ArrowRight,
  Download,
  Upload,
  Globe,
  LogOut,
  Check,
  Menu,
  X,
  Cloud,
  CheckCircle2,
} from "lucide-react";
import type { Character, Objective } from "./domain";
import {
  complete,
  isComplete,
  currentPath,
  totalXP,
  classLevel,
  awardSkills,
  period,
} from "./domain";
import {
  loadCharacter,
  saveCharacter,
  validateCharacter,
  STORAGE_KEY,
} from "./storage";
import {
  auth,
  loginGoogle,
  logoutGoogle,
  uploadCharacter,
  downloadCharacter,
  googleConfigured,
} from "./auth";
import { Crest, Modal, Tag, CheckList } from "./ui";
import Onboarding from "./Onboarding";
import {
  Guild,
  Objectives,
  Paths,
  Skills,
  Adventures,
  Journal,
} from "./screens";
import type { Page } from "./screens";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
const PAGES = [
  {
    id: "guild",
    name: "Guild Card",
    icon: CreditCard,
    title: "Guild Card",
    description: "Character, rank, class history, and recent progress.",
  },
  {
    id: "objectives",
    name: "Objectives",
    icon: Target,
    title: "Objectives",
    description:
      "Complete tasks, quests, and monthly goals to earn real-world XP.",
  },
  {
    id: "paths",
    name: "Class Paths",
    icon: Route,
    title: "Classes & Subclasses",
    description:
      "View requirements, select a class, and manage specializations.",
  },
  {
    id: "skills",
    name: "Skills & Stats",
    icon: Sparkles,
    title: "Skills & Stats",
    description:
      "Universal, class, and profession skill trees; attributes and credentials.",
  },
  {
    id: "adventures",
    name: "Adventures",
    icon: Compass,
    title: "Adventures",
    description:
      "Explore regions, manage your party, and fight turn-based battles.",
  },
  {
    id: "journal",
    name: "Journal",
    icon: BookOpen,
    title: "Journal",
    description: "Reflections and objective completion history.",
  },
] as const;
type Dialog = "account" | "certificate" | "reset" | null;
async function exportData(data: string, name: string) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const { Encoding } = await import("@capacitor/filesystem");
    const file = await Filesystem.writeFile({
      path: name,
      data,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({
      title: "The Guild character backup",
      url: file.uri,
      dialogTitle: "Save your guild character",
    });
  } else {
    const url = URL.createObjectURL(
        new Blob([data], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
export default function App() {
  const [initial] = useState(() => {
    try {
      return { character: loadCharacter(), error: "" };
    } catch (e) {
      return {
        character: null,
        error:
          e instanceof Error
            ? e.message
            : "Saved data could not be read. Your data has been kept.",
      };
    }
  });
  const [c, setC] = useState<Character | null>(initial.character),
    [recovery, setRecovery] = useState(initial.error),
    [page, setPage] = useState<Page>("guild"),
    [dialog, setDialog] = useState<Dialog>(null),
    [objective, setObjective] = useState<Objective | null>(null),
    [checked, setChecked] = useState<number[]>([]),
    [toast, setToast] = useState(""),
    [user, setUser] = useState<User | null>(null),
    [menu, setMenu] = useState(false),
    [busy, setBusy] = useState(false),
    [cloudCandidate, setCloudCandidate] = useState<Character | null>(null),
    [importCandidate, setImportCandidate] = useState<Character | null>(null);
  const [, tick] = useState(0),
    inputRef = useRef<HTMLInputElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((s: string) => {
    setToast(s);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6000);
  }, []);
  const close = useCallback(() => {
    setDialog(null);
    setObjective(null);
    setCloudCandidate(null);
    setImportCandidate(null);
  }, []);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener("backButton", () => {
      if (dialog || objective || cloudCandidate || importCandidate) close();
      else if (menu) setMenu(false);
      else if (page !== "guild") setPage("guild");
      else void NativeApp.minimizeApp();
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [dialog, objective, cloudCandidate, importCandidate, menu, page, close]);
  const update = useCallback(
    (next: Character) => {
      try {
        const awarded = awardSkills(next);
        saveCharacter(awarded);
        setC(awarded);
        return true;
      } catch {
        notify(
          "Could not save progress. Device storage may be full. Your current character is unchanged; export a backup.",
        );
        return false;
      }
    },
    [notify],
  );
  const navigate = (p: Page) => {
    setPage(p);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openObjective = (o: Objective) => {
    setChecked(c?.milestones[`${o.id}:${period(o.cadence)}`] || []);
    setObjective(o);
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      notify(
        e instanceof Error
          ? e.message
          : "That operation did not complete. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const exportBackup = () =>
    run(async () => {
      await exportData(
        JSON.stringify(c, null, 2),
        `the-guild-${new Date().toISOString().slice(0, 10)}.json`,
      );
      notify("Character backup prepared. Keep it somewhere safe.");
    });
  const props = c ? { c, update, navigate, openObjective, notify } : null;
  const active = PAGES.find((p) => p.id === page)!;
  return (
    <>
      {recovery ? (
        <main className="recovery panel">
          <Crest />
          <h1>Saved data needs recovery.</h1>
          <p>{recovery}</p>
          <button
            className="button primary"
            onClick={() =>
              run(async () => {
                await exportData(
                  localStorage.getItem(STORAGE_KEY) || "",
                  "the-guild-recovery.json",
                );
                notify("Recovery file prepared.");
              })
            }
          >
            Export original saved data
          </button>
          <button
            className="button secondary"
            onClick={() => inputRef.current?.click()}
          >
            Restore a valid backup
          </button>
          <button className="text-button" onClick={() => setDialog("reset")}>
            Create a new character
          </button>
        </main>
      ) : !c ? (
        <Onboarding
          onCreate={(next) => {
            update(next);
            navigate("guild");
          }}
          onGoogle={() => setDialog("account")}
        />
      ) : (
        <div className="app-shell">
          {menu && <div className="nav-scrim" onClick={() => setMenu(false)} />}
          <aside className={`sidebar ${menu ? "open" : ""}`}>
            <a
              className="brand"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("guild");
              }}
            >
              <Crest small />
              <span>
                THE GUILD<small>PERSONAL DEVELOPMENT</small>
              </span>
            </a>
            <div className="sidebar-divider" />
            <span className="nav-label">YOUR ADVENTURE</span>
            <nav aria-label="Main navigation">
              {PAGES.map((p) => (
                <button
                  key={p.id}
                  className={page === p.id ? "active" : ""}
                  aria-current={page === p.id ? "page" : undefined}
                  onClick={() => navigate(p.id)}
                >
                  <p.icon size={19} />
                  <span>{p.name}</span>
                  {page === p.id && <span className="nav-active-dot" />}
                </button>
              ))}
            </nav>
            <div className="sidebar-note">
              <span>✦</span>
              <p>
                Track objectives.
                <br />
                Develop your character.
              </p>
              <small>REAL-WORLD PROGRESS</small>
            </div>
            <div className="sidebar-bottom">
              <button onClick={() => setDialog("account")}>
                <Settings2 size={18} /> Guild settings
              </button>
              <button
                className="sidebar-profile"
                onClick={() => setDialog("account")}
              >
                <span className="profile-initial">
                  {c.name[0].toUpperCase()}
                </span>
                <span>
                  <b>{c.name}</b>
                  <small>
                    {user
                      ? "Google linked"
                      : c.demo
                        ? "Sample adventurer"
                        : "Local adventurer"}
                  </small>
                </span>
                <ChevronDown size={15} />
              </button>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="mobile-brand">
                <button
                  className="icon-button"
                  aria-label={menu ? "Close navigation" : "Open navigation"}
                  onClick={() => setMenu(!menu)}
                >
                  {menu ? <X size={21} /> : <Menu size={21} />}
                </button>
                <Crest small />
                <b>THE GUILD</b>
              </div>
              <span className="breadcrumb">
                Your adventure <span>/</span> <b>{active.name}</b>
              </span>
              <div className="topbar-right">
                <span className="local-status">
                  <span className="status-dot" />
                  {user
                    ? "Google linked · local changes"
                    : "Progress saved on this device"}
                </span>
                <button
                  className="profile-initial"
                  aria-label="Open account settings"
                  onClick={() => setDialog("account")}
                >
                  {c.name[0].toUpperCase()}
                </button>
              </div>
            </header>
            <main
              className={`main-content ${page === "adventures" && c.campaign?.battle ? "in-battle" : ""}`}
              id="main"
            >
              <div className="page-heading">
                <div>
                  <h1>{active.title}</h1>
                  <p>{active.description}</p>
                </div>
                <div className="date-block">
                  <span>
                    {new Date().toLocaleDateString(undefined, {
                      weekday: "long",
                    })}
                  </span>
                  <b>
                    {new Date().toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </b>
                </div>
              </div>
              {c.demo && (
                <div className="demo-banner">
                  <span>
                    Sample character. Creating your own character starts a
                    separate record.
                  </span>
                  <button onClick={() => setDialog("reset")}>
                    Create your character <ArrowRight size={15} />
                  </button>
                </div>
              )}
              {props && (
                <div className="page-content" key={page}>
                  {page === "guild" ? (
                    <Guild {...props} />
                  ) : page === "objectives" ? (
                    <Objectives {...props} />
                  ) : page === "paths" ? (
                    <Paths {...props} />
                  ) : page === "skills" ? (
                    <Skills
                      c={c}
                      update={update}
                      onCertificate={() => setDialog("certificate")}
                    />
                  ) : page === "adventures" ? (
                    <Adventures {...props} />
                  ) : (
                    <Journal {...props} />
                  )}
                </div>
              )}
              <footer className="main-footer">
                <span>✦ &nbsp; THE GUILD</span>
                <span>BODY. MIND. HEART.</span>
              </footer>
            </main>
          </div>
          <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
            {PAGES.filter((p) => p.id !== "paths").map((p) => (
              <button
                key={p.id}
                className={page === p.id ? "active" : ""}
                onClick={() => navigate(p.id)}
                aria-label={p.name}
              >
                <p.icon size={20} />
                <span>
                  {p.id === "guild"
                    ? "Guild"
                    : p.id === "skills"
                      ? "Skills"
                      : p.name}
                </span>
              </button>
            ))}
          </nav>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5_000_000) {
            notify("Choose a character backup smaller than 5 MB.");
            return;
          }
          void file
            .text()
            .then((text) => {
              const data: unknown = JSON.parse(text);
              if (!validateCharacter(data))
                throw new Error(
                  "This file is not a valid Guild character backup. Your character is unchanged.",
                );
              setImportCandidate(data);
            })
            .catch((e) =>
              notify(e instanceof Error ? e.message : "Could not read backup."),
            );
          e.target.value = "";
        }}
      />
      {objective && c && (
        <Modal title={objective.title} onClose={close}>
          <div className="objective-modal-meta">
            <Tag>{objective.category}</Tag>
            <Tag tone="gold">
              +{objective.xp} {objective.scope || "class"} XP
            </Tag>
            <span>{objective.minutes}</span>
          </div>
          <p>{objective.description}</p>
          {objective.statReward && (
            <div className="notice">
              Special reward: +{objective.statReward.amount} base{" "}
              {objective.statReward.stat} on completion.
            </div>
          )}
          {objective.kind === "fitness" && (
            <div className="notice">
              Choose a variation and effort that suit you. Rest as needed and
              stop if movement causes pain. Consistency matters more than
              intensity.
            </div>
          )}
          {!isComplete(c, objective) && objective.checklist && (
            <CheckList
              items={objective.checklist}
              checked={checked}
              setChecked={(items) => {
                if (
                  update({
                    ...c,
                    milestones: {
                      ...c.milestones,
                      [`${objective.id}:${period(objective.cadence)}`]: items,
                    },
                  })
                )
                  setChecked(items);
              }}
            />
          )}
          <p className="helper">
            Rewards are self-reported. Claim this objective after completing the
            real-world action. Each objective rewards XP once per{" "}
            {objective.cadence === "daily"
              ? "day"
              : objective.cadence === "weekly"
                ? "week"
                : "month"}
            .
          </p>
          <button
            className="button primary full"
            disabled={
              isComplete(c, objective) ||
              (!!objective.checklist &&
                checked.length < objective.checklist.length)
            }
            onClick={() => {
              if (!update(complete(c, objective))) return;
              notify(`+${objective.xp} XP earned. Progress saved.`);
              close();
            }}
          >
            {isComplete(c, objective) ? (
              <>
                <CheckCircle2 size={18} /> Already completed this period
              </>
            ) : (
              <>
                I completed this objective <Check size={18} />
              </>
            )}
          </button>
        </Modal>
      )}
      {dialog === "account" && (
        <Modal title="Account & Backups" onClose={close}>
          <div className="account-status">
            <span className="objective-icon wis">
              <Cloud size={25} />
            </span>
            <div>
              <b>
                {user
                  ? user.displayName || "Google account connected"
                  : "Local character storage"}
              </b>
              <p>
                {user
                  ? user.email
                  : "Keep your character on this device, or link Google for a private cloud backup."}
              </p>
            </div>
          </div>
          {!user ? (
            <>
              <button
                className="button secondary full"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await loginGoogle();
                    notify(
                      "Google account linked. You can now upload or restore your character.",
                    );
                  })
                }
              >
                <Globe size={18} />
                {busy ? "Connecting…" : "Continue with Google"}
              </button>
              {!googleConfigured && (
                <div className="notice">
                  Google linking is not configured for this build yet. Your
                  local character works in full. The project README explains the
                  Firebase and Google OAuth setup.
                </div>
              )}
            </>
          ) : (
            <>
              <p className="helper">
                Cloud backups are manual. Upload replaces this account’s cloud
                copy. Restore lets you review before replacing the character on
                this device.
              </p>
              <div className="account-actions">
                <button
                  className="button primary"
                  disabled={busy || !c || c.demo}
                  onClick={() =>
                    run(async () => {
                      if (c) {
                        await uploadCharacter(c);
                        notify(
                          "Cloud backup saved to your Google-linked account.",
                        );
                      }
                    })
                  }
                >
                  <Upload size={16} />
                  {busy ? "Working…" : "Upload cloud backup"}
                </button>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    run(async () =>
                      setCloudCandidate(await downloadCharacter()),
                    )
                  }
                >
                  <Download size={16} />
                  Restore cloud copy
                </button>
              </div>
              {c?.demo && (
                <p className="helper">
                  Create your own character to upload a cloud backup.
                </p>
              )}
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await logoutGoogle();
                    notify(
                      "Google disconnected. Local progress is still on this device.",
                    );
                  })
                }
              >
                <LogOut size={15} />
                Disconnect Google
              </button>
            </>
          )}
          <div className="modal-divider" />
          <h3>Keep a copy</h3>
          <p>
            Export a JSON backup before changing devices or starting fresh. It
            includes your personal reflections.
          </p>
          <div className="account-actions">
            <button
              className="button secondary"
              disabled={!c || busy}
              onClick={exportBackup}
            >
              <Download size={16} />
              Export character
            </button>
            <button
              className="button secondary"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={16} />
              Import backup
            </button>
          </div>
          {c && (
            <>
              <div className="modal-divider" />
              <h3>Your guild record</h3>
              <p>
                {currentPath(c).name} · Level {classLevel(c, c.activeClass)}
                <br />
                Adventurer ID: <span className="record-id">{c.id}</span>
              </p>
              <button
                className="text-button danger"
                onClick={() => setDialog("reset")}
              >
                {c.demo ? "Create your own character" : "Start a new character"}
              </button>
            </>
          )}
        </Modal>
      )}
      {dialog === "certificate" && c && (
        <CertificateDialog
          c={c}
          onSave={(next) => {
            if (!update(next)) return;
            notify(
              "Credential recorded. Any qualifying skill is now part of your character.",
            );
            close();
          }}
          onClose={close}
        />
      )}
      {dialog === "reset" && (
        <Modal title="Create a new character?" onClose={close}>
          <p>
            {c?.demo
              ? "Your sample character will be replaced with your own guild application."
              : "Starting a new character replaces the progress and reflections on this device. Export a backup first if you want to keep this character."}
          </p>
          <div className="account-actions">
            {c && !c.demo && (
              <button className="button secondary" onClick={exportBackup}>
                <Download size={16} />
                Export backup
              </button>
            )}
            <button
              className="button primary"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setC(null);
                setRecovery("");
                setPage("guild");
                close();
              }}
            >
              Create character <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {(cloudCandidate || importCandidate) && (
        <Modal title="Restore this character?" onClose={close}>
          <p>
            You’re about to replace the character on this device with{" "}
            <strong>{(cloudCandidate || importCandidate)!.name}</strong>, with{" "}
            {totalXP((cloudCandidate || importCandidate)!)} lifetime XP. Export
            your current character first if you want to keep both.
          </p>
          <div className="account-actions">
            {c && (
              <button className="button secondary" onClick={exportBackup}>
                Export current character
              </button>
            )}
            <button
              className="button primary"
              onClick={() => {
                if (!update((cloudCandidate || importCandidate)!)) return;
                setRecovery("");
                navigate("guild");
                close();
                notify("Character restored. Character restored.");
              }}
            >
              Restore character
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>✦</span>
          <p>{toast}</p>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
function CertificateDialog({
  c,
  onSave,
  onClose,
}: {
  c: Character;
  onSave: (c: Character) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("CCNA"),
    [issuer, setIssuer] = useState("Cisco"),
    [date, setDate] = useState(new Date().toLocaleDateString("en-CA")),
    [reference, setReference] = useState("");
  const options: Record<string, string> = {
    CCNA: "Cisco",
    "CompTIA Network+": "CompTIA",
    "Juniper JNCIA-Junos": "Juniper",
    "CCNP Enterprise": "Cisco",
    "Juniper JNCIP-ENT": "Juniper",
  };
  return (
    <Modal title="Record a certification" onClose={onClose}>
      <p>
        Record a credential you have earned. Your ledger is self-reported; this
        app does not verify certifications with issuers.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...c,
            certificates: [
              ...c.certificates,
              {
                id: crypto.randomUUID(),
                name,
                issuer: issuer.trim(),
                date,
                reference: reference.trim(),
              },
            ],
          });
        }}
      >
        <label className="field">
          Certification
          <select
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setIssuer(options[e.target.value]);
            }}
          >
            {Object.keys(options).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Issuer
          <input
            required
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            maxLength={100}
          />
        </label>
        <label className="field">
          Date earned
          <input
            type="date"
            required
            value={date}
            max={new Date().toLocaleDateString("en-CA")}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="field">
          Credential reference (optional)
          <input
            value={reference}
            maxLength={250}
            placeholder="Credential ID or verification URL"
            onChange={(e) => setReference(e.target.value)}
          />
        </label>
        <button
          className="button primary full"
          disabled={
            !issuer.trim() ||
            !date ||
            c.certificates.some((x) => x.name === name)
          }
        >
          Record earned credential <Check size={17} />
        </button>
        {c.certificates.some((x) => x.name === name) && (
          <p className="helper">
            This certification is already in your ledger.
          </p>
        )}
      </form>
    </Modal>
  );
}
