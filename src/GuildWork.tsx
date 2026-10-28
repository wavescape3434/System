import type { Character, Objective } from "./domain";
import {
  currentPath,
  takenObjectives,
  isComplete,
  taskRequirements,
  objectivePeriod,
  activeVocation,
  professionStat,
} from "./domain";
import { requestProgress } from "./training-tasks";
import { periodEnd } from "./calendar-goals";
import { ArrowRight, Plus, Check } from "lucide-react";
import { Icon } from "./ui";
import type { Page } from "./screens";
export default function GuildWork({
  c,
  navigate,
  openObjective,
}: {
  c: Character;
  navigate: (p: Page, section?: string) => void;
  openObjective: (o: Objective) => void;
}) {
  const ready = (o: Objective) =>
    !taskRequirements(c, o).length &&
    (!o.checklist ||
      (c.milestones[`${o.id}:${objectivePeriod(o)}`] || []).length ===
        o.checklist.length);
  const taken = takenObjectives(c)
    .filter((o) => !isComplete(c, o))
    .sort(
      (a, b) =>
        Number(ready(b)) - Number(ready(a)) ||
        periodEnd(a.cadence).getTime() - periodEnd(b.cadence).getTime(),
    );
  return (
    <section className="panel guild-work" aria-label="Current work">
      <div className="guild-work-links">
        <button onClick={() => navigate("objectives", "regimen")}>
          <Icon name="STR" size={19} />
          <span>Today’s regimen</span>
          <ArrowRight size={17} />
        </button>
        <button onClick={() => navigate("objectives", "board:daily:class")}>
          <Icon name={currentPath(c).stat} size={19} />
          <span>{currentPath(c).name} requests</span>
          <Plus size={17} />
        </button>
        <button onClick={() => navigate("objectives", "board:daily:career")}>
          <Icon name={professionStat(c.profession)} size={19} />
          <span>{activeVocation(c)?.name || c.profession} requests</span>
          <Plus size={17} />
        </button>
      </div>
      <div className="section-heading">
        <h3>
          Taken requests <span className="tag">{taken.length}</span>
        </h3>
        <button
          className="text-button"
          onClick={() => navigate("objectives", "taken:all")}
        >
          Open requests <ArrowRight size={15} />
        </button>
      </div>
      {taken.length ? (
        <div className="guild-work-list">
          {taken.slice(0, 4).map((o) => {
            const progress = requestProgress(c, o);
            return (
              <button
                className="guild-work-row"
                key={o.id}
                onClick={() => openObjective(o)}
              >
                <Icon name={o.stat} size={20} />
                <span>
                  <b>{o.title}</b>
                  <small>
                    {o.cadence === "daily"
                      ? "Today"
                      : `${o.cadence === "weekly" ? "Week" : "Month"} · Due ${new Date(periodEnd(o.cadence).getTime() - 1).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                    {o.minimumSessions
                      ? ` · ${progress.sessions}/${o.minimumSessions} practice days`
                      : ""}{" "}
                    · {o.xp} XP
                  </small>
                </span>
                <span className={`work-state ${ready(o) ? "ready" : ""}`}>
                  {ready(o) ? (
                    <>
                      <Check size={14} />
                      Submit
                    </>
                  ) : (
                    "Open"
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <button
          className="guild-work-empty"
          onClick={() => navigate("objectives", "board:daily")}
        >
          <Plus size={18} />
          Take a request
          <ArrowRight size={16} />
        </button>
      )}
    </section>
  );
}
