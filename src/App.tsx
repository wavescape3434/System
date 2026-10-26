import { refreshAdventure } from "./rpg";
import ActivityResultForm from "./ActivityResultForm";
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
import {
  loadCharacter,
  saveCharacter,
  validateCharacter,
  STORAGE_KEY,
  localRecovery,
} from "./storage";
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
      title: "The Adventurers Guild character backup",
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
    [page, setPage] = useState<Page>(
      initial.character?.preferences?.defaultPage || "guild",
    ),
    [section, setSection] = useState<string | undefined>(),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [dialog, setDialog] = useState<Dialog>(null),
    [objective, setObjective] = useState<Objective | null>(null),
    [checked, setChecked] = useState<number[]>([]),
    [resultsOpen, setResultsOpen] = useState(false),
    [draft, setDraft] = useState({ ...EMPTY_RESULT }),
    [toast, setToast] = useState(""),
    [user, setUser] = useState<User | null>(null),
    [menu, setMenu] = useState(false),
    [busy, setBusy] = useState(false),
    [cloudCandidate, setCloudCandidate] = useState<Character | null>(null),
    [importCandidate, setImportCandidate] = useState<Character | null>(null);
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
      watchGoogleAccount(setUser, () =>
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
        const rested = refreshAdventure(migrated);
        const prepared = progressionChanged(characterRef.current, rested)
          ? awardSkills(rested)
          : rested;
        const awarded = track
          ? recordJourney(characterRef.current, prepared)
          : prepared;
        saveCharacter(awarded);
        characterRef.current = awarded;
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
  useEffect(() => {
    const check = () => {
      const current = characterRef.current;
      if (!current) return;
      const refreshed = refreshAdventure(current);
      if (refreshed !== current) update(refreshed, false);
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
  }, [update]);
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
      await exportData(
        JSON.stringify(c, null, 2),
        `the-guild-${new Date().toISOString().slice(0, 10)}.json`,
      );
      notify("Backup exported.");
    });
  const offerLocalRecovery = () => {
    const snapshot = localRecovery();
    if (!snapshot) {
      notify("No valid local recovery snapshot is available.");
      return;
    }
    setDialog(null);
    setImportCandidate(snapshot.character);
  };
  const props = c
    ? { c, update, navigate, openObjective, notify, section }
    : null;
  const active = PAGES.find((p) => p.id === page)!;
  const parsedResult = parseResult(draft, preferences.units === "imperial");
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
          onHelp={() => navigate("help")}
          onCreate={(next) => {
            const saved = update(next);
            if (saved) navigate("guild");
            return saved;
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
            {objectiveTaken && !objectiveDone && (
              <>
                <button
                  className="text-button result-toggle"
                  aria-expanded={resultsOpen}
                  onClick={() => setResultsOpen(!resultsOpen)}
                >
                  {resultsOpen ? "Hide results" : "Add results (optional)"}
                </button>
                {resultsOpen && (
                  <ActivityResultForm
                    o={objective}
                    draft={draft}
                    onChange={setDraft}
                    imperial={preferences.units === "imperial"}
                    error={parsedResult.error}
                  />
                )}
              </>
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
                setChecked={(items) => {
                  if (
                    update({
                      ...c,
                      milestones: {
                        ...c.milestones,
                        [`${objective.id}:${objectivePeriod(objective)}`]:
                          items,
                      },
                    })
                  )
                    setChecked(items);
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
                onClick={() => {
                  const next = takeRequest(c, objective.id);
                  if (update(next)) {
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
            {(isTaken(c, objective) || isComplete(c, objective)) && (
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
                onClick={() => {
                  const next = completeWithResult(
                    c,
                    objective,
                    parsedResult.result,
                  );
                  if (next === c || !update(next)) return;
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
                onClick={() => {
                  if (update(releaseRequest(c, objective.id))) close();
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
                if (!update((cloudCandidate || importCandidate)!, false))
                  return;
                setRecovery("");
                navigate("guild");
                close();
                notify("Character restored.");
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
