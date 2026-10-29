import AbilityCheckForm, { PracticeQualityForm } from "./AbilityCheckForm";
import { validPracticeEvidence } from "./adaptive-ability";
import type { PracticeEvidence } from "./adaptive-ability";
import { exportData } from "./file-export";
import {
  loadPrimary,
  commitPrimary,
  primaryRevision,
  exportOriginalPrimary,
} from "./primary-store";
import { SaveQueue } from "./save-queue";
import DeviceRecovery from "./DeviceRecovery";
import {
  preserveBeforeReplacement,
  queueDailySnapshot,
} from "./device-backups";
import { migrateSkillPlans } from "./skill-plans";
import { refreshAdventure } from "./rpg";
import ActivityResultForm from "./ActivityResultForm";
import WorkoutRecordForm from "./WorkoutRecordForm";
import {
  EMPTY_RESULT,
  parseResult,
  resultDraft,
  resultSummary,
  completeWithResult,
  creditedGoals,
} from "./activity-results";
import { progressionChanged } from "./progression-ledger";
import { upgradeAdventureStages } from "./world-state";
import RequestInstructions from "./RequestInstructions";
import GuildMark from "./GuildMark";
import {
  syncReminders,
  forgetReminderSchedule,
  cancelReminders,
} from "./reminders";
import { LocalNotifications } from "@capacitor/local-notifications";
import { recommendedRequest } from "./proficiency";
import { groupRequests } from "./objective-catalog";
import {
  periodStart,
  periodEnd,
  adventureBonus,
  adventureConditionMet,
} from "./calendar-goals";
import { WORLD_CONTRACTS, TOWNS } from "./world-catalog";
import { requestProgress } from "./training-tasks";
import Notifications, {
  notificationFeed,
  notificationUnread,
} from "./Notifications";
import Settings from "./Settings";
import { DEFAULT_PREFERENCES } from "./preferences";
import Help from "./Help";
import Journey from "./Journey";
import { recordJourney } from "./journey-events";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import {
  Bell,
  Target,
  Route,
  Sparkles,
  Compass,
  History,
  CircleHelp,
  BookmarkPlus,
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
  takeRequest,
  releaseRequest,
  isTaken,
  isComplete,
  currentPath,
  totalXP,
  classLevel,
  awardSkills,
  objectivePeriod,
  upgradeTraining,
  upgradeExams,
  upgradeBalance,
  upgradeCalendar,
  taskRequirements,
  classCreditRewards,
  universalCareerCredits,
  takenObjectives,
  objectives,
} from "./domain";
import { validateCharacter, localRecovery } from "./storage";
import {
  watchGoogleAccount,
  loginGoogle,
  logoutGoogle,
  uploadCharacter,
  downloadCharacter,
  googleConfigured,
} from "./auth";
import { Crest, Modal, Tag, CheckList, Icon, STAT_NAMES } from "./ui";
import Onboarding from "./Onboarding";
import { Guild, Objectives, Paths, Skills, Adventures } from "./screens";
import type { Page } from "./screens";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
const PAGES = [
  {
    id: "guild",
    name: "Guild",
    icon: GuildMark,
    title: "Guild",
  },
  {
    id: "objectives",
    name: "Objectives",
    icon: Target,
    title: "Guild Requests",
  },
  {
    id: "paths",
    name: "Class Paths",
    icon: Route,
    title: "Class Register",
  },
  {
    id: "skills",
    name: "Skills & Stats",
    icon: Sparkles,
    title: "Skills & Stats",
  },
  {
    id: "adventures",
    name: "Adventures",
    icon: Compass,
    title: "Adventures",
  },
  {
    id: "journey",
    name: "Journey",
    icon: History,
    title: "Journey",
  },
  { id: "settings", name: "Settings", title: "Settings", icon: Settings2 },
  { id: "help", name: "Help", title: "Help", icon: CircleHelp },
] as const;
type Dialog = "account" | "certificate" | "reset" | "recovery" | null;
export default function App() {
  const [c, setC] = useState<Character | null>(null),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(""),
    [recovery, setRecovery] = useState(""),
    [page, setPage] = useState<Page>("guild"),
    [section, setSection] = useState<string | undefined>(),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [dialog, setDialog] = useState<Dialog>(null),
    [objective, setObjective] = useState<Objective | null>(null),
    [checked, setChecked] = useState<number[]>([]),
    [resultsOpen, setResultsOpen] = useState(false),
    [draft, setDraft] = useState({ ...EMPTY_RESULT }),
    [practice, setPractice] = useState<PracticeEvidence | undefined>(),
    [toast, setToast] = useState(""),
    [user, setUser] = useState<User | null>(null),
    [menu, setMenu] = useState(false),
    [busy, setBusy] = useState(false),
    [cloudCandidate, setCloudCandidate] = useState<Character | null>(null),
    [cloudUID, setCloudUID] = useState(""),
    [importCandidate, setImportCandidate] = useState<Character | null>(null);
  const accountRef = useRef<User | null>(null);
  const revisionRef = useRef(0);
  const saves = useRef<SaveQueue<Character | null> | null>(null);
  useEffect(() => {
    let disposed = false;
    const start = async () => {
      let character: Character | null = null,
        revision = 0,
        error = "";
      try {
        const loaded = await loadPrimary();
        character = loaded.character;
        revision = loaded.revision;
      } catch (e) {
        if (disposed) return;
        revision = await primaryRevision().catch(() => 0);
        error =
          e instanceof Error
            ? e.message
            : "Saved data could not be read. The original has been kept.";
      }
      if (disposed) return;
      revisionRef.current = revision;
      setRecovery(error);
      saves.current = new SaveQueue(
        character,
        async (next, previous) => {
          revisionRef.current = await commitPrimary(
            next,
            revisionRef.current,
            previous,
          );
          if (next) void queueDailySnapshot(next).catch(() => {});
        },
        (next, pending, error) => {
          characterRef.current = next;
          setC(next);
          setSaving(pending);
          if (error) setSaveError(error);
          else if (!pending) setSaveError("");
        },
      );
      characterRef.current = character;
      setC(character);
      setPage(character?.preferences?.defaultPage || "guild");
      setLoading(false);
    };
    void start();
    return () => {
      disposed = true;
    };
  }, []);
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => {
      if (!saves.current?.pending) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, []);
  const preferences = { ...DEFAULT_PREFERENCES, ...c?.preferences };
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const action = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        const extra = event.notification.extra;
        setPage("objectives");
        setSection(`taken:${extra?.cadence || "daily"}`);
        setMenu(false);
      },
    );
    const resume = NativeApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        window.dispatchEvent(new Event("focus"));
        forgetReminderSchedule();
        if (characterRef.current)
          void syncReminders(characterRef.current).catch(() => {
            if (!disposed)
              notify("Could not refresh Android reminders. Check Settings.");
          });
      }
    });
    return () => {
      disposed = true;
      void action.then((h) => h.remove());
      void resume.then((h) => h.remove());
    };
  }, []);
  useEffect(() => {
    void (c ? syncReminders(c) : cancelReminders()).catch(() =>
      notify("Could not update Android reminders. Check Settings."),
    );
  }, [c]);

  useEffect(() => {
    document.documentElement.dataset.textSize = preferences.textSize;
    document.documentElement.dataset.motion = preferences.reduceMotion
      ? "reduced"
      : "full";
  }, [preferences.textSize, preferences.reduceMotion]);
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
    setNotificationsOpen(false);
    setObjective(null);
    setCloudCandidate(null);
    setImportCandidate(null);
  }, []);
  useEffect(
    () =>
      watchGoogleAccount(
        (next) => {
          if (accountRef.current?.uid !== next?.uid) {
            setCloudCandidate(null);
            setCloudUID("");
          }
          accountRef.current = next;
          setUser(next);
        },
        () =>
          notify(
            "Google account status could not be refreshed. Your local character is saved.",
          ),
      ),
    [notify],
  );
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = NativeApp.addListener("backButton", () => {
      if (document.querySelector('[role="dialog"]'))
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
      else if (dialog || objective || cloudCandidate || importCandidate)
        close();
      else if (menu) setMenu(false);
      else if (page !== "guild") setPage("guild");
      else void NativeApp.minimizeApp();
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [dialog, objective, cloudCandidate, importCandidate, menu, page, close]);
  const characterRef = useRef(c);
  characterRef.current = c;
  const update = useCallback(
    (next: Character, track = true) => {
      try {
        const migrated = upgradeAdventureStages(
          upgradeCalendar(upgradeBalance(upgradeExams(upgradeTraining(next)))),
        );
        const rested = refreshAdventure(migrateSkillPlans(migrated));
        const prepared = progressionChanged(characterRef.current, rested)
          ? awardSkills(rested)
          : rested;
        const awarded = track
          ? recordJourney(characterRef.current, prepared)
          : prepared;
        if (!saves.current) return Promise.resolve(false);
        return saves.current.enqueue(awarded);
      } catch {
        notify(
          "Could not save progress. Device storage may be full. Your current character is unchanged; export a backup.",
        );
        return Promise.resolve(false);
      }
    },
    [notify],
  );
  useEffect(() => {
    const check = () => {
      const current = characterRef.current;
      if (!current) return;
      const refreshed = refreshAdventure(migrateSkillPlans(current));
      if (refreshed !== current) update(refreshed, false);
      else void queueDailySnapshot(current).catch(() => {});
      tick((n) => n + 1);
    };
    const schedule = () => {
      const now = new Date(),
        midnight = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        );
      return setTimeout(
        () => {
          check();
          timer = schedule();
        },
        midnight.getTime() - now.getTime() + 50,
      );
    };
    check();
    let timer = schedule();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [update, loading]);
  const navigate = (p: Page, target?: string) => {
    setSection(target);
    setPage(p);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openObjective = (input: Objective) => {
    const o = c
      ? takenObjectives(c).find(
          (o) =>
            o.id === input.id ||
            (!!input.requestGroup && o.requestGroup === input.requestGroup),
        ) || input
      : input;
    setChecked(c?.milestones[`${o.id}:${objectivePeriod(o)}`] || []);
    setObjective(o);
    const saved = c?.completions.find(
      (x) => x.id === o.id && x.period === objectivePeriod(o),
    )?.result;
    setDraft(resultDraft(saved, c?.preferences?.units === "imperial"));
    setPractice(saved?.practice);
    setResultsOpen(!!saved);
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
      await saves.current?.idle();
      await exportData(
        JSON.stringify(saves.current?.committed ?? c, null, 2),
        `the-guild-${new Date().toISOString().slice(0, 10)}.json`,
      );
      notify("Backup exported.");
    });
  const offerLocalRecovery = () => {
    const snapshot = localRecovery();
    if (snapshot) {
      setDialog(null);
      setImportCandidate(snapshot.character);
    } else setDialog("recovery");
  };
  const props = c
    ? { c, update, navigate, openObjective, notify, section }
    : null;
  const active = PAGES.find((p) => p.id === page)!;
  const baseResult = parseResult(draft, preferences.units === "imperial");
  const parsedResult = {
    result: practice
      ? { ...(baseResult.result || {}), practice }
      : baseResult.result,
    error:
      baseResult.error ||
      (practice && !validPracticeEvidence(practice)
        ? "Name the subject and comparison source for the ability result."
        : undefined),
  };
  const objectiveDone = !!(c && objective && isComplete(c, objective));
  const objectiveTaken = !!(c && objective && isTaken(c, objective));
  const objectiveBlocks =
    c && objective && !objectiveDone
      ? taskRequirements(
          c,
          objective,
          new Date(),
          objectiveTaken ? "complete" : "accept",
        )
      : [];
  const checklistRemaining = objective?.checklist
    ? objective.checklist.length - checked.length
    : 0;
  const goalCredits = c && objective ? creditedGoals(c, objective) : [];
  return (
    <>
      {saving && (
        <div className="save-state" role="status">
          Saving…
        </div>
      )}
      {saveError && (
        <div className="save-failure" role="alert">
          <span>
            Last change wasn’t saved. Previous progress retained. {saveError}
          </span>
          <button onClick={() => window.location.reload()}>Reload</button>
          <button onClick={() => setSaveError("")}>Dismiss</button>
        </div>
      )}
      {loading ? (
        <main className="recovery panel">
          <Crest />
          <h1>Opening guild record…</h1>
        </main>
      ) : recovery ? (
        <main className="recovery panel">
          <Crest />
          <h1>Saved data needs recovery.</h1>
          <p>{recovery}</p>
          <button
            className="button secondary"
            onClick={() => setDialog("account")}
          >
            Account & cloud backups
          </button>
          <button
            className="button primary"
            onClick={() =>
              run(async () => {
                await exportData(
                  await exportOriginalPrimary(),
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
          <button
            className="button secondary"
            onClick={() => setDialog("recovery")}
          >
            Browse device recovery copies
          </button>
          {localRecovery() && (
            <button className="button secondary" onClick={offerLocalRecovery}>
              Restore local recovery snapshot
            </button>
          )}
          <button className="text-button" onClick={() => setDialog("reset")}>
            Create a new character
          </button>
        </main>
      ) : !c && page === "help" ? (
        <main className="registration-help">
          <button
            className="button secondary"
            onClick={() => navigate("guild")}
          >
            Back to registration
          </button>
          <h1>Help</h1>
          <Help />
        </main>
      ) : !c ? (
        <Onboarding
          onRestore={() => setDialog("recovery")}
          onHelp={() => navigate("help")}
          onCreate={(next) => {
            navigate("guild");
            return update(next);
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
                THE ADVENTURERS GUILD<small>PERSONAL DEVELOPMENT</small>
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
            <div className="sidebar-bottom">
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
                <b>THE ADVENTURERS GUILD</b>
              </div>
              <span className="breadcrumb">
                Your adventure <span>/</span> <b>{active.name}</b>
              </span>
              <div className="topbar-right">
                <span className="local-status">
                  <span className="status-dot" />
                  {user ? "Google linked · local changes" : "Saved locally"}
                </span>
                <button
                  className="icon-button notification-trigger"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() => {
                    setNotificationsOpen(true);
                    update({
                      ...c,
                      notificationsReadAt: new Date().toISOString(),
                      notificationReads: [
                        ...new Set([
                          ...notificationFeed(c).map((n) => n.id),
                          ...(c.notificationReads || []),
                        ]),
                      ].slice(0, 500),
                    });
                  }}
                >
                  <Bell size={21} />
                  {notificationUnread(c).length > 0 && (
                    <span className="notification-count">
                      {notificationUnread(c).length}
                    </span>
                  )}
                </button>
                <button
                  className="icon-button help-shortcut"
                  aria-label="Open help"
                  onClick={() => navigate("help")}
                >
                  <CircleHelp size={21} />
                </button>
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
                  <span>Sample character</span>
                  <button onClick={() => setDialog("reset")}>
                    Create your character <ArrowRight size={15} />
                  </button>
                </div>
              )}
              {props && (
                <div className="page-content" key={`${page}:${section || ""}`}>
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
                      initialTab={section}
                      onFieldwork={(id) =>
                        navigate("adventures", `fieldwork:${id}`)
                      }
                    />
                  ) : page === "adventures" ? (
                    <Adventures {...props} />
                  ) : page === "journey" ? (
                    <Journey c={c} />
                  ) : page === "settings" ? (
                    <Settings
                      initialTab={section}
                      c={c}
                      update={update}
                      notify={notify}
                      onAccount={() => setDialog("account")}
                      onRecovery={offerLocalRecovery}
                    />
                  ) : (
                    <Help navigate={navigate} />
                  )}
                </div>
              )}
              <footer className="main-footer">
                <span>✦ &nbsp; THE ADVENTURERS GUILD</span>
              </footer>
            </main>
          </div>
          <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
            {PAGES.filter(
              (p) => p.id !== "paths" && p.id !== "help" && p.id !== "settings",
            ).map((p) => (
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
          if (file.size > 25_000_000) {
            notify("Choose a character backup smaller than 25 MB.");
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
              setDialog(null);
              setImportCandidate(data);
            })
            .catch((e) =>
              notify(e instanceof Error ? e.message : "Could not read backup."),
            );
          e.target.value = "";
        }}
      />
      {notificationsOpen && c && (
        <Notifications
          c={c}
          update={update}
          navigate={(p, target) => {
            setNotificationsOpen(false);
            navigate(p, target);
          }}
          onClose={() => setNotificationsOpen(false)}
        />
      )}
      {objective && c && (
        <Modal
          className="request-paper"
          title={objective.groupTitle || objective.title}
          onClose={close}
        >
          <div className="request-scroll">
            <div className="request-paper-heading">
              <Crest small />
              <span>
                {objective.cadence === "daily"
                  ? "DAILY TASK"
                  : objective.cadence === "weekly"
                    ? "WEEKLY QUEST"
                    : "MONTHLY ADVENTURE"}
                <b>{objective.category}</b>
              </span>
              <span className="request-wax-seal" aria-hidden="true">
                {objective.rank || "F"}
              </span>
            </div>
            {objective.groupTitle &&
              objective.groupTitle !== objective.title && (
                <p className="request-variant-title">{objective.title}</p>
              )}
            {(() => {
              const variants =
                groupRequests(objectives(c)).find(
                  (g) => g.id === objective.requestGroup,
                )?.variants || [];
              return variants.length > 1 ? (
                <div className="request-rank-picker">
                  <label>
                    Rank
                    <select
                      aria-label="Choose request rank"
                      value={objective.id}
                      disabled={
                        isTaken(c, objective) || isComplete(c, objective)
                      }
                      onChange={(e) => {
                        const o = variants.find(
                          (o) => o.id === e.target.value,
                        )!;
                        setObjective(o);
                        setChecked(
                          c.milestones[`${o.id}:${objectivePeriod(o)}`] || [],
                        );
                        setDraft({ ...EMPTY_RESULT });
                        setPractice(undefined);
                        setResultsOpen(false);
                      }}
                    >
                      {variants.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.rank} · {o.xp} XP · {o.gold} gold · {o.minutes}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null;
            })()}
            {!objectiveTaken && !objectiveDone && (
              <AbilityCheckForm
                key={objective.id}
                c={c}
                o={objective}
                update={update}
                onCalibrated={(next) => {
                  const group = groupRequests(objectives(next)).find((g) =>
                    g.variants.some((o) => o.id === objective.id),
                  );
                  if (group) {
                    const chosen = recommendedRequest(next, group.variants);
                    setObjective(chosen);
                    setChecked(
                      next.milestones[
                        `${chosen.id}:${objectivePeriod(chosen)}`
                      ] || [],
                    );
                    setDraft({ ...EMPTY_RESULT });
                    setPractice(undefined);
                  }
                }}
              />
            )}
            {objective.calendarBound && (
              <Tag>
                {periodStart(objective.cadence).toLocaleDateString()} –{" "}
                {new Date(
                  periodEnd(objective.cadence).getTime() - 1,
                ).toLocaleDateString()}
              </Tag>
            )}
            {(() => {
              const id =
                  objective.adventureRequirement ||
                  objective.adventureBonus?.contractId,
                contract = WORLD_CONTRACTS.find((r) => r.id === id);
              if (!contract) return null;
              const done = adventureConditionMet(
                c,
                contract.id,
                objective.cadence,
              );
              return (
                <div className="hybrid-requirement">
                  <b>
                    {objective.adventureRequirement
                      ? "Required adventure request"
                      : "Adventure bonus"}{" "}
                    · {done ? "Complete" : "Pending"}
                  </b>
                  <p>
                    {contract.title} ·{" "}
                    {TOWNS.find((t) => t.id === contract.town)!.name}
                  </p>
                  {objective.adventureBonus && (
                    <Tag>
                      +{objective.adventureBonus.xp} XP · +
                      {objective.adventureBonus.gold} gold
                      {adventureBonus(c, objective) ? " · Ready" : ""}
                    </Tag>
                  )}
                </div>
              );
            })()}
            <div className="objective-modal-meta">
              <Tag>
                <Icon name={objective.stat} size={16} /> {objective.stat} ·{" "}
                {STAT_NAMES[objective.stat]}
              </Tag>
              <Tag>{objective.category}</Tag>
              {objective.rank && <Tag tone="gold">{objective.rank} rank</Tag>}
              <Tag tone="gold">+{objective.xp} player XP</Tag>
              {objective.gold !== undefined && (
                <Tag tone="gold">+{objective.gold} gold</Tag>
              )}
              <span>{objective.minutes}</span>
            </div>
            {objectiveTaken && !objectiveDone && !objective.workout && (
              <>
                <button
                  className="text-button result-toggle"
                  aria-expanded={resultsOpen}
                  onClick={() => setResultsOpen(!resultsOpen)}
                >
                  {resultsOpen ? "Hide results" : "Add results (optional)"}
                </button>
                {resultsOpen && (
                  <>
                    <ActivityResultForm
                      o={objective}
                      draft={draft}
                      onChange={setDraft}
                      imperial={preferences.units === "imperial"}
                      error={parsedResult.error}
                    />
                    <PracticeQualityForm
                      c={c}
                      o={objective}
                      value={practice}
                      onChange={setPractice}
                    />
                  </>
                )}
              </>
            )}
            {objectiveTaken &&
              !objectiveDone &&
              objective.workout &&
              !objectiveBlocks.length && (
                <WorkoutRecordForm
                  key={`${c.id}:${objective.id}`}
                  receiptKey={`${objective.id}:${c.takenRequests?.find((r) => r.id === objective.id)?.takenAt}`}
                  c={c}
                  prescription={objective.workout}
                  ready={!checklistRemaining}
                  pending={false}
                  onSubmit={async (workout) => {
                    const next = completeWithResult(c, objective, { workout });
                    if (next === c || !(await update(next))) return false;
                    notify(
                      `+${next.completions.at(-1)!.xp} XP · Progress saved.`,
                    );
                    close();
                    return true;
                  }}
                />
              )}
            {objectiveDone &&
              c.completions.find(
                (x) =>
                  x.id === objective.id &&
                  x.period === objectivePeriod(objective),
              )?.result && (
                <div className="saved-result">
                  <b>Recorded results</b>
                  <p>
                    {resultSummary(
                      c.completions.find(
                        (x) =>
                          x.id === objective.id &&
                          x.period === objectivePeriod(objective),
                      )?.result,
                      preferences.units === "imperial",
                    )}
                  </p>
                </div>
              )}
            {!isComplete(c, objective) && objective.checklist && (
              <CheckList
                items={objective.checklist}
                checked={checked}
                setChecked={async (items) => {
                  const key = `${objective.id}:${objectivePeriod(objective)}`;
                  setChecked(items);
                  if (
                    !(await update({
                      ...c,
                      milestones: { ...c.milestones, [key]: items },
                    }))
                  )
                    setChecked(characterRef.current?.milestones[key] || []);
                }}
              />
            )}
            <RequestInstructions objective={objective} c={c} />
            {isTaken(c, objective) &&
              (objective.minimumDays || objective.minimumSessions) &&
              (() => {
                const progress = requestProgress(c, objective);
                return (
                  <div className="request-credit-preview">
                    {progress.startedAt && (
                      <Tag>
                        {objective.calendarBound ? "Period start " : "Started "}{" "}
                        {new Date(progress.startedAt).toLocaleDateString()}
                      </Tag>
                    )}
                    {objective.minimumDays && (
                      <Tag>
                        {Math.min(progress.days, objective.minimumDays)} /{" "}
                        {objective.minimumDays} days
                      </Tag>
                    )}
                    {objective.minimumSessions && (
                      <Tag>
                        {Math.min(progress.sessions, objective.minimumSessions)}{" "}
                        / {objective.minimumSessions} practice days
                      </Tag>
                    )}
                    {objective.calendarBound ? (
                      <Tag>
                        {objective.cadence === "weekly"
                          ? "This week"
                          : "This month"}
                      </Tag>
                    ) : (
                      objective.persistent && <Tag>Saved across months</Tag>
                    )}
                  </div>
                );
              })()}
            {objective.taskVersion === 2 && (
              <details className="request-credit-distribution">
                <summary>Progression credit</summary>
                <div className="request-credit-preview">
                  <Tag>
                    {objective.scope || "class"} +{objective.xp} XP
                  </Tag>
                  {Object.entries(
                    classCreditRewards(
                      c,
                      objective,
                      objective.targetClass ||
                        c.takenRequests?.find((r) => r.id === objective.id)
                          ?.classId ||
                        c.activeClass,
                    ),
                  ).map(([id, xp]) => (
                    <Tag key={id}>
                      {id.replaceAll("-", " ")} +{xp} XP
                    </Tag>
                  ))}
                  {(() => {
                    const request = c.takenRequests?.find(
                      (r) => r.id === objective.id,
                    );
                    const credit = universalCareerCredits(
                      c,
                      objective,
                      request?.profession || c.profession,
                      request ? request.vocationId : c.vocation,
                    );
                    return (
                      <>
                        {credit.professionCredit && (
                          <Tag>
                            {credit.professionCredit.name} +
                            {credit.professionCredit.xp} XP
                          </Tag>
                        )}
                        {credit.vocationCredit && (
                          <Tag>Vocation +{credit.vocationCredit.xp} XP</Tag>
                        )}
                      </>
                    );
                  })()}
                </div>
              </details>
            )}
            {objective.taskVersion === 2 &&
              taskRequirements(c, objective).length > 0 && (
                <ul className="skill-requirements">
                  {taskRequirements(c, objective).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
            {objective.statReward && (
              <div className="notice">
                Special reward: +{objective.statReward.amount} base{" "}
                {objective.statReward.stat} on completion.
              </div>
            )}
            {goalCredits.length > 0 && (
              <div className="practice-credit">
                <b>Practice credit</b>
                <ul>
                  {goalCredits.map((goal) => (
                    <li key={goal.id}>{goal.title} · +1 practice day</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <footer className="request-actions" aria-label="Request actions">
            {!objectiveDone && (
              <div className="request-action-status" role="status">
                {objectiveTaken
                  ? objectiveBlocks[0] ||
                    (checklistRemaining > 0
                      ? `Checklist: ${checked.length}/${objective.checklist!.length}`
                      : parsedResult.error || "Ready to submit")
                  : objectiveBlocks[0] ||
                    `${objective.xp} XP · ${objective.gold || 0} gold`}
              </div>
            )}
            {((!isTaken(c, objective) && !isComplete(c, objective)) ||
              (objective.persistent && isComplete(c, objective))) && (
              <button
                className="button primary full"
                disabled={
                  objective.taskVersion === 2 &&
                  taskRequirements(c, objective, new Date(), "accept").length >
                    0
                }
                onClick={async () => {
                  const next = takeRequest(c, objective.id);
                  if (await update(next)) {
                    const accepted = takenObjectives(next).find(
                      (o) => o.id === objective.id,
                    );
                    if (accepted) {
                      setObjective(accepted);
                      setChecked(
                        next.milestones[
                          `${accepted.id}:${objectivePeriod(accepted)}`
                        ] || [],
                      );
                    }
                    notify("Request taken.");
                  }
                }}
              >
                <BookmarkPlus size={17} />
                {objective.persistent && isComplete(c, objective)
                  ? "Take again"
                  : "Take request"}
              </button>
            )}
            {(isTaken(c, objective) || isComplete(c, objective)) &&
              (!objective.workout || objectiveDone) && (
                <button
                  className="button primary full"
                  disabled={
                    (objective.taskVersion === 2 &&
                      taskRequirements(c, objective).length > 0) ||
                    isComplete(c, objective) ||
                    !!parsedResult.error ||
                    (!!objective.checklist &&
                      checked.length < objective.checklist.length)
                  }
                  onClick={async () => {
                    const next = completeWithResult(
                      c,
                      objective,
                      parsedResult.result,
                    );
                    if (next === c || !(await update(next))) return;
                    const reward = next.completions.at(-1)!;
                    notify(
                      `+${reward.xp} XP · +${reward.gold || 0} gold. Progress saved.`,
                    );
                    close();
                  }}
                >
                  {isComplete(c, objective) ? (
                    <>
                      <CheckCircle2 size={18} /> Already completed this period
                    </>
                  ) : (
                    <>
                      Submit completed request <Check size={18} />
                    </>
                  )}
                </button>
              )}
            {isTaken(c, objective) && !isComplete(c, objective) && (
              <button
                className="text-button release-request"
                onClick={async () => {
                  if (await update(releaseRequest(c, objective.id))) close();
                }}
              >
                Release request
              </button>
            )}
          </footer>
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
              <p>{user ? user.email : "Saved on this device"}</p>
            </div>
          </div>
          <button
            className="button secondary full"
            onClick={() => setDialog("recovery")}
          >
            Device recovery copies
          </button>
          {!user ? (
            <>
              <button
                className="button secondary full"
                disabled={busy || !googleConfigured}
                onClick={() =>
                  run(async () => {
                    await loginGoogle();
                    notify("Google account linked.");
                  })
                }
              >
                <Globe size={18} />
                {busy ? "Connecting…" : "Continue with Google"}
              </button>
              {!googleConfigured && (
                <div className="notice">
                  Google linking is not configured for this build.
                </div>
              )}
            </>
          ) : (
            <>
              <div className="account-actions">
                <button
                  className="button primary"
                  disabled={busy || !c || c.demo}
                  onClick={() =>
                    run(async () => {
                      if (c) {
                        await saves.current?.idle();
                        if (!saves.current?.committed)
                          throw Error("No saved character to upload.");
                        await uploadCharacter(saves.current.committed);
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
                    run(async () => {
                      const uid = accountRef.current?.uid;
                      const candidate = await downloadCharacter();
                      if (!uid || uid !== accountRef.current?.uid)
                        throw Error(
                          "Your Google account changed. Reopen Account & backups and retry.",
                        );
                      setCloudUID(uid);
                      setDialog(null);
                      setCloudCandidate(candidate);
                    })
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
                    notify("Google disconnected.");
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
          onSave={async (next) => {
            if (!(await update(next))) return;
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
              : "Starting a new character replaces this device’s record. A recovery copy is saved first."}
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
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await saves.current?.idle();
                  if (characterRef.current)
                    await preserveBeforeReplacement(
                      characterRef.current,
                      "before-new-character",
                    );
                  if (!(await saves.current!.enqueue(null))) return;
                  setRecovery("");
                  setPage("guild");
                  close();
                })
              }
            >
              Create character <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {dialog === "recovery" && (
        <Modal title="Device recovery copies" onClose={close}>
          <button
            className="button secondary full"
            onClick={() => inputRef.current?.click()}
          >
            Import backup file
          </button>
          <DeviceRecovery
            onReview={(candidate) => {
              setDialog(null);
              setImportCandidate(candidate);
            }}
          />
        </Modal>
      )}
      {(cloudCandidate || importCandidate) && (
        <Modal title="Restore this character?" onClose={close}>
          <p>
            Restoring replaces this device’s character. A recovery copy is saved
            first.
          </p>
          <div className="restore-comparison" aria-label="Restore comparison">
            {[
              ["Current", c],
              [
                cloudCandidate ? "Cloud copy" : "Selected copy",
                cloudCandidate || importCandidate,
              ],
            ].map(([label, character]) => {
              const record = character as Character | null;
              return (
                <div key={String(label)}>
                  <small>{String(label)}</small>
                  <strong>{record?.name || "No character"}</strong>
                  <span>
                    {record
                      ? `${totalXP(record).toLocaleString()} XP · ${record.completions.length} request${record.completions.length === 1 ? "" : "s"}`
                      : "—"}
                  </span>
                  <span>
                    {Object.keys(record?.skillPlans?.goals || {}).length} skill
                    goals
                  </span>
                </div>
              );
            })}
          </div>
          <div className="account-actions">
            {c && (
              <button className="button secondary" onClick={exportBackup}>
                Export current character
              </button>
            )}
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  if (cloudCandidate && cloudUID !== accountRef.current?.uid)
                    throw Error(
                      "Your Google account changed. Reopen Account & backups and retry.",
                    );
                  await saves.current?.idle();
                  if (characterRef.current)
                    await preserveBeforeReplacement(
                      characterRef.current,
                      "before-restore",
                    );
                  if (cloudCandidate && cloudUID !== accountRef.current?.uid)
                    throw Error(
                      "Your Google account changed. Reopen Account & backups and retry.",
                    );
                  if (
                    !(await update((cloudCandidate || importCandidate)!, false))
                  )
                    return;
                  setRecovery("");
                  navigate("guild");
                  close();
                  notify("Character restored.");
                })
              }
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
