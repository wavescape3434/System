import {
  planLocation,
  activeTreeKey,
  setPlanLocation,
  setPlanGoal,
  setPlanView,
  skillTreeKey,
} from "./skill-plans";
import type { TreeCategory } from "./skill-plans";
import { CLASSES } from "./class-catalog";
import { ARCHETYPES } from "./class-catalog";
import { useViewState } from "./useViewState";
import { CAREER_CATEGORIES, careerCategory } from "./careers";
import { levelFromXP } from "./progression";
import SkillInspector from "./SkillInspector";
import {
  constellation,
  skillStyle,
  styleSkills,
  skillAncestors,
} from "./skill-atlas";
import { useState, useEffect, useRef } from "react";
import {
  LockKeyhole,
  Check,
  ZoomIn,
  ZoomOut,
  Scan,
  Plus,
  Star,
  X,
} from "lucide-react";
import type { Character, Skill } from "./domain";
import {
  SKILLS,
  currentPath,
  archetypeXP,
  activeVocation,
  hasSkill,
  skillRequirements,
  skillPointsAvailable,
  walletLevel,
  classLevel,
  skillTier,
} from "./domain";
import { Icon } from "./ui";
export default function SkillTree({
  c,
  update,
  onCertificate,
  onFieldwork,
}: {
  c: Character;
  update: (c: Character) => Promise<boolean>;
  onCertificate: () => void;
  onFieldwork?: (id: string) => void;
}) {
  const key = `${c.id}.${c.activeClass}.tree`;
  const location = planLocation(c),
    { category, branch } = location,
    treeKey = activeTreeKey(c);
  const view = c.skillPlans?.views[treeKey];
  const listMode = view?.listMode || false,
    style = view?.style || "all",
    goal = c.skillPlans?.goals[treeKey] || "";
  const setLocation = (category: TreeCategory, branch: string) =>
    update(setPlanLocation(c, { category, branch }));
  const setListMode = (listMode: boolean) =>
    update(setPlanView(c, treeKey, { listMode }));
  const setStyle = (style: string) =>
    update(setPlanView(c, treeKey, { style }));
  const setGoal = (id: string) => update(setPlanGoal(c, treeKey, id));
  const [search, setSearch] = useViewState<string>(`${key}.search`, "");
  const [selected, setSelected] = useState<Skill | null>(null),
    [zoom, setZoom] = useState(1),
    [status, setStatus] = useState("all");
  const treeRef = useRef<HTMLDivElement>(null),
    zoomRef = useRef(1),
    pointers = useRef(new Map<number, { x: number; y: number }>()),
    gesture = useRef<{
      distance: number;
      zoom: number;
      wx: number;
      wy: number;
    } | null>(null),
    drag = useRef<{ x: number; y: number; left: number; top: number } | null>(
      null,
    ),
    moved = useRef(false);
  const zoomAt = (value: number, clientX?: number, clientY?: number) => {
    const el = treeRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect(),
      x = clientX === undefined ? el.clientWidth / 2 : clientX - rect.left,
      y = clientY === undefined ? el.clientHeight / 2 : clientY - rect.top;
    const wx = (el.scrollLeft + x) / zoomRef.current,
      wy = (el.scrollTop + y) / zoomRef.current,
      next = Math.max(0.12, Math.min(1.6, value));
    zoomRef.current = next;
    setZoom(next);
    requestAnimationFrame(() => {
      el.scrollLeft = wx * next - x;
      el.scrollTop = wy * next - y;
    });
  };
  const p = currentPath(c),
    primary = Object.entries(p.mix).sort((a, b) => b[1]! - a[1]!)[0][0];
  const owner =
    treeKey === "universal"
      ? "universal"
      : treeKey.slice(treeKey.indexOf(":") + 1);
  const focus = treeKey.startsWith("focus:"),
    treePath = focus ? CLASSES.find((p) => p.id === owner)! : p;
  const list = SKILLS.filter(
    (s) =>
      !s.legacy &&
      s.category === category &&
      (category === "universal" || category === "class"
        ? category === "universal" ||
          (focus ? s.owner === owner && !s.archetype : s.archetype === owner)
        : s.owner === owner),
  );
  const styles = [...new Set(list.map((s) => skillStyle(s, list)))],
    focused = styleSkills(list, style),
    atlas = constellation(focused),
    worldHeight = atlas.height,
    worldWidth = atlas.width,
    goalSkill = list.find((s) => s.id === goal),
    route = new Set(
      goalSkill && !hasSkill(c, goalSkill)
        ? [goal, ...skillAncestors(goal, list)]
        : [],
    );
  const matches = (s: Skill) =>
    (!search ||
      `${s.name} ${s.description} ${skillStyle(s, list)}`
        .toLowerCase()
        .includes(search.toLowerCase())) &&
    (status === "all" ||
      (status === "learned"
        ? hasSkill(c, s)
        : status === "available"
          ? !s.automatic && !hasSkill(c, s) && !skillRequirements(c, s).length
          : !hasSkill(c, s) && !!skillRequirements(c, s).length));
  const locate = (s: Skill) => {
    const node = atlas.nodes.find((n) => n.skill.id === s.id),
      el = treeRef.current;
    if (node && el)
      el.scrollTo({
        left: Math.max(0, node.x * zoomRef.current - el.clientWidth / 2),
        top: Math.max(
          0,
          node.y * zoomRef.current -
            (innerWidth <= 800
              ? Math.max(
                  120,
                  Math.min(
                    el.clientHeight,
                    (document
                      .querySelector(".skill-inspector")
                      ?.getBoundingClientRect().top ||
                      innerHeight * 0.47 - 70) -
                      el.getBoundingClientRect().top -
                      12,
                  ),
                ) / 2
              : el.clientHeight / 2),
        ),
        behavior: innerWidth <= 800 ? "instant" : "smooth",
      });
  };
  const inspect = (s: Skill) => {
    setSelected(s);
    if (innerWidth <= 800 && !listMode)
      treeRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
    requestAnimationFrame(() => locate(s));
  };
  const closeInspector = () => {
    setSelected(null);
    treeRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (
        selected &&
        e.key === "Escape" &&
        !document.querySelector('[role="dialog"]')
      )
        closeInspector();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [selected]);
  useEffect(() => {
    if (selected)
      document
        .querySelector<HTMLElement>(".skill-inspector")
        ?.focus({ preventScroll: true });
  }, [selected?.id]);
  const fitTree = () => {
    const el = treeRef.current;
    if (!el) return;
    const next = Math.max(
      0.12,
      Math.min(
        0.65,
        (el.clientWidth - 24) / worldWidth,
        (el.clientHeight - 24) / worldHeight,
      ),
    );
    zoomRef.current = next;
    setZoom(next);
    requestAnimationFrame(() => el.scrollTo({ left: 0, top: 0 }));
  };
  const centerAvailable = () => {
    const el = treeRef.current;
    if (!el) return;
    const next = el.clientWidth < 700 ? 1 : 0.9;
    const node =
      [...focused]
        .filter((s) => !hasSkill(c, s))
        .sort(
          (a, b) =>
            skillRequirements(c, a).length - skillRequirements(c, b).length ||
            skillTier(a) - skillTier(b) ||
            a.cost - b.cost,
        )[0] || list[0];
    zoomRef.current = next;
    setZoom(next);
    requestAnimationFrame(() =>
      el.scrollTo({
        left: Math.max(
          0,
          (atlas.nodes.find((n) => n.skill.id === node?.id)?.x || 0) * next -
            el.clientWidth / 2,
        ),
        top: Math.max(
          0,
          (atlas.nodes.find((n) => n.skill.id === node?.id)?.y || 0) * next -
            el.clientHeight / 2,
        ),
      }),
    );
  };
  useEffect(() => {
    setSelected(null);
    setSearch("");
    setStatus("all");
  }, [category, branch]);
  const positionKey = `guild.view.${key}.constellation-position.${category}.${branch}.${style}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(positionKey) || "null");
      if (
        saved &&
        [saved.zoom, saved.left, saved.top].every(Number.isFinite) &&
        saved.zoom >= 0.12 &&
        saved.zoom <= 1.6
      ) {
        zoomRef.current = saved.zoom;
        setZoom(saved.zoom);
        requestAnimationFrame(() =>
          treeRef.current?.scrollTo({ left: saved.left, top: saved.top }),
        );
        return;
      }
    } catch {
      /* A fresh readable view is always available. */
    }
    centerAvailable();
  }, [category, branch, style, worldHeight, worldWidth]);
  useEffect(() => {
    const el = treeRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAt(
          zoomRef.current * Math.exp(-e.deltaY * 0.005),
          e.clientX,
          e.clientY,
        );
      }
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);
  const wallet =
    category === "universal"
      ? "universal"
      : category === "class"
        ? "combat"
        : `profession:${owner === "networking" ? "technology" : owner === "analysis" ? "business" : owner}`;
  const lv =
      category === "class"
        ? focus
          ? classLevel(c, owner)
          : levelFromXP(archetypeXP(c, owner))
        : walletLevel(c, wallet),
    shards = skillPointsAvailable(c, wallet);
  const treeName =
    category === "universal"
      ? "Universal skills"
      : category === "class"
        ? focus
          ? `${treePath.name} Focus`
          : `${ARCHETYPES.find((a) => a.id === owner)?.name} Arts`
        : owner === "networking"
          ? "Networking · Credential Path"
          : owner === "analysis"
            ? "Data Analysis · Focus"
            : CAREER_CATEGORIES.find((g) => g.id === owner)?.name ||
              c.profession;
  return (
    <section className="skill-atlas">
      {Object.keys(c.skillPlans?.goals || {}).length > 0 && (
        <details className="planner-goals">
          <summary>
            Planned skills ({Object.keys(c.skillPlans!.goals).length})
          </summary>
          <div>
            {Object.values(c.skillPlans!.goals).map((id) => {
              const skill = SKILLS.find((s) => s.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => {
                    const key = skillTreeKey(skill);
                    setLocation(
                      skill.category as TreeCategory,
                      key.startsWith("focus:")
                        ? key
                        : key === "universal"
                          ? "current"
                          : key.slice(key.indexOf(":") + 1),
                    );
                  }}
                >
                  <Star size={16} />
                  <span>
                    <b>{skill.name}</b>
                    <small>
                      {hasSkill(c, skill) ? "Learned" : "Planned"} ·{" "}
                      {skill.category === "class"
                        ? skill.archetype ||
                          CLASSES.find((p) => p.id === skill.owner)?.name
                        : skill.category === "universal"
                          ? "Universal"
                          : CAREER_CATEGORIES.find((g) => g.id === skill.owner)
                              ?.name || skill.owner}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </details>
      )}
      <div className="tree-toolbar">
        <div
          className="tree-categories"
          role="tablist"
          aria-label="Skill tree categories"
        >
          {["universal", "class", "profession"].map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={category === id}
              className={category === id ? "active" : ""}
              onClick={() => {
                setLocation(id as TreeCategory, "current");
              }}
            >
              {id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
        <button
          className="button secondary tree-credential"
          aria-label="Record credential"
          onClick={onCertificate}
        >
          <Plus size={15} />
          <span>Record credential</span>
        </button>
      </div>
      <div className="tree-info">
        <div>
          <h3>{treeName}</h3>
          <p>
            Level {lv} · {shards} unspent{" "}
            {category === "class" ? "combat" : category} skill points
          </p>
        </div>
        {category === "class" && (
          <label className="field">
            Class tree
            <select
              aria-label="Class tree"
              value={branch}
              onChange={(e) => setLocation(category, e.target.value)}
            >
              <option value="current">
                {ARCHETYPES.find((a) => a.id === primary)?.name} · Primary
              </option>
              {ARCHETYPES.filter((a) => a.id !== primary).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {p.mix[a.id as keyof typeof p.mix]
                    ? ` · ${p.mix[a.id as keyof typeof p.mix]}%`
                    : ""}
                </option>
              ))}
              <option value="focus">{p.name} · Unique focus</option>
              {CLASSES.filter(
                (path) =>
                  path.id !== p.id &&
                  ((c.unlockedClasses || []).includes(path.id) ||
                    Object.keys(c.skillPlans?.goals || {}).includes(
                      `focus:${path.id}`,
                    )),
              ).map((path) => (
                <option key={path.id} value={`focus:${path.id}`}>
                  {path.name} · Unique focus
                </option>
              ))}
            </select>
          </label>
        )}
        {category === "profession" && (
          <label className="field">
            Career tree
            <select
              aria-label="Profession tree"
              value={branch}
              onChange={(e) => setLocation(category, e.target.value)}
            >
              <option value="current">
                {careerCategory(c.profession).name} · Current profession
              </option>
              {CAREER_CATEGORIES.filter(
                (g) => g.id !== careerCategory(c.profession).id,
              ).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                  {activeVocation(c)?.category === g.id ? " · Vocation" : ""}
                </option>
              ))}
              <option value="networking">Networking · Credential path</option>
              <option value="analysis">Data Analysis · Focus</option>
            </select>
          </label>
        )}
        <div className="tree-zoom">
          <button
            aria-label="Zoom out skill tree"
            onClick={() => zoomAt(zoomRef.current / 1.25)}
          >
            <ZoomOut size={18} />
          </button>
          <button aria-label="Fit skill tree" onClick={fitTree}>
            <Scan size={18} />
            Fit
          </button>
          <span aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in skill tree"
            onClick={() => zoomAt(zoomRef.current * 1.25)}
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>
      <div className="atlas-progress">
        <span>
          {list.filter((s) => hasSkill(c, s)).length} / {list.length} learned
        </span>
        <span>
          {
            list.filter(
              (s) =>
                !s.automatic &&
                !hasSkill(c, s) &&
                !skillRequirements(c, s).length,
            ).length
          }{" "}
          available
        </span>
        <span>
          Lv. {lv} · {shards} points
        </span>
      </div>
      <div className="atlas-styles" aria-label="Skill styles">
        <button aria-pressed={style === "all"} onClick={() => setStyle("all")}>
          All paths
        </button>
        {styles.map((name) => (
          <button
            key={name}
            aria-label={`Find ${name}`}
            aria-pressed={style === name}
            onClick={() => setStyle(name)}
          >
            {name}
            <small>
              {
                list.filter(
                  (s) => skillStyle(s, list) === name && hasSkill(c, s),
                ).length
              }
              /{list.filter((s) => skillStyle(s, list) === name).length}
            </small>
          </button>
        ))}
      </div>
      {goalSkill && (
        <div className="atlas-goal">
          <Star size={17} />
          <button
            onClick={() => {
              setStyle("all");
              setSelected(goalSkill);
            }}
          >
            <b>
              {hasSkill(c, goalSkill) ? "Goal reached" : "Goal"}:{" "}
              {goalSkill.name}
            </b>
            <small>
              {hasSkill(c, goalSkill)
                ? "Learned"
                : `Lv. ${skillTier(goalSkill)} · ${goalSkill.cost} points`}
            </small>
          </button>
          <button
            className="icon-button"
            aria-label="Clear skill goal"
            onClick={() => setGoal("")}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <div className="tree-view-switch">
        <button
          onClick={() => {
            setListMode(false);
            centerAvailable();
          }}
        >
          Available skills
        </button>
        <button aria-pressed={!listMode} onClick={() => setListMode(false)}>
          Tree
        </button>
        <button aria-pressed={listMode} onClick={() => setListMode(true)}>
          Skill list
        </button>
        <input
          type="search"
          aria-label="Search skills"
          placeholder="Search skills"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Skill status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All skills</option>
          <option value="available">Available</option>
          <option value="learned">Learned</option>
          <option value="locked">Locked</option>
        </select>
      </div>
      <div className="skill-atlas-layout">
        <div className="atlas-main">
          {listMode && (
            <div className="accessible-skill-list">
              {[...focused]
                .filter(matches)
                .sort((a, b) => skillTier(a) - skillTier(b) || a.cost - b.cost)
                .map((s) => (
                  <button key={s.id} onClick={() => inspect(s)}>
                    <Icon name={s.stat} size={20} />
                    <span>
                      <b>{s.name}</b>
                      <small>
                        Lv. {skillTier(s)} · {s.cost} point
                        {s.cost === 1 ? "" : "s"} ·{" "}
                        {hasSkill(c, s)
                          ? "Learned"
                          : skillRequirements(c, s).length
                            ? "Locked"
                            : "Available"}
                      </small>
                    </span>
                    {hasSkill(c, s) ? <Check size={16} /> : <Plus size={16} />}
                  </button>
                ))}
            </div>
          )}
          <div
            style={listMode ? { display: "none" } : undefined}
            ref={treeRef}
            onScroll={(e) => {
              try {
                sessionStorage.setItem(
                  positionKey,
                  JSON.stringify({
                    zoom: zoomRef.current,
                    left: e.currentTarget.scrollLeft,
                    top: e.currentTarget.scrollTop,
                  }),
                );
              } catch {
                /* Optional view state. */
              }
            }}
            onClickCapture={(e) => {
              if (moved.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onPointerDown={(e) => {
              const el = treeRef.current!;
              pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              if (pointers.current.size === 1) {
                moved.current = false;
                drag.current = {
                  x: e.clientX,
                  y: e.clientY,
                  left: el.scrollLeft,
                  top: el.scrollTop,
                };
              }
              if (pointers.current.size === 2) {
                const [a, b] = [...pointers.current.values()],
                  r = el.getBoundingClientRect();
                gesture.current = {
                  distance: Math.hypot(a.x - b.x, a.y - b.y),
                  zoom: zoomRef.current,
                  wx:
                    (el.scrollLeft + (a.x + b.x) / 2 - r.left) /
                    zoomRef.current,
                  wy:
                    (el.scrollTop + (a.y + b.y) / 2 - r.top) / zoomRef.current,
                };
                moved.current = true;
                for (const id of pointers.current.keys())
                  el.setPointerCapture(id);
              }
            }}
            onPointerMove={(e) => {
              if (!pointers.current.has(e.pointerId)) return;
              pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
              const el = treeRef.current!;
              if (pointers.current.size >= 2 && gesture.current) {
                const [a, b] = [...pointers.current.values()],
                  g = gesture.current,
                  r = el.getBoundingClientRect(),
                  next = Math.max(
                    0.12,
                    Math.min(
                      1.6,
                      (g.zoom * Math.hypot(a.x - b.x, a.y - b.y)) /
                        Math.max(1, g.distance),
                    ),
                  );
                zoomRef.current = next;
                setZoom(next);
                requestAnimationFrame(() => {
                  el.scrollLeft = g.wx * next - ((a.x + b.x) / 2 - r.left);
                  el.scrollTop = g.wy * next - ((a.y + b.y) / 2 - r.top);
                });
              } else if (drag.current) {
                const d = drag.current;
                if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) {
                  moved.current = true;
                  el.setPointerCapture(e.pointerId);
                }
                if (moved.current) {
                  el.scrollLeft = d.left - (e.clientX - d.x);
                  el.scrollTop = d.top - (e.clientY - d.y);
                }
              }
            }}
            onPointerUp={(e) => {
              pointers.current.delete(e.pointerId);
              gesture.current = null;
              const remaining = [...pointers.current.values()][0],
                el = treeRef.current!;
              drag.current = remaining
                ? {
                    x: remaining.x,
                    y: remaining.y,
                    left: el.scrollLeft,
                    top: el.scrollTop,
                  }
                : null;
            }}
            onPointerCancel={(e) => {
              pointers.current.delete(e.pointerId);
              gesture.current = null;
              drag.current = null;
            }}
            className="skill-tree-window"
            tabIndex={0}
            aria-label={`${treeName} branching skill tree. Drag to pan. Pinch or use zoom controls.`}
          >
            <div
              className="skill-tree-world"
              style={{ width: worldWidth * zoom, height: worldHeight * zoom }}
            >
              <div
                className="skill-tree-canvas"
                style={{
                  transform: `scale(${zoom})`,
                  height: worldHeight,
                  width: worldWidth,
                }}
              >
                <svg
                  className="skill-connections"
                  viewBox={`0 0 ${worldWidth} ${worldHeight}`}
                  style={{ height: worldHeight, width: worldWidth }}
                  aria-hidden="true"
                >
                  <defs>
                    <pattern
                      id="starfield"
                      width="110"
                      height="90"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle
                        cx="14"
                        cy="20"
                        r="1"
                        fill="#b9c89a"
                        opacity=".28"
                      />
                      <circle
                        cx="78"
                        cy="63"
                        r=".7"
                        fill="#c8c4a2"
                        opacity=".35"
                      />
                    </pattern>
                  </defs>
                  <rect
                    width={worldWidth}
                    height={worldHeight}
                    fill="url(#starfield)"
                  />
                  {atlas.nodes.flatMap(({ skill: s, x, y }) =>
                    [...s.parents, ...(s.anyParents || [])].map((id) => {
                      const parent = atlas.nodes.find((n) => n.skill.id === id);
                      return parent ? (
                        <path
                          key={`${s.id}-${id}`}
                          data-parent={id}
                          data-child={s.id}
                          d={`M ${parent.x} ${parent.y} Q ${(parent.x + x) / 2 + 45} ${(parent.y + y) / 2 - 45}, ${x} ${y}`}
                          className={`${hasSkill(c, s) && hasSkill(c, parent.skill) ? "learned" : hasSkill(c, parent.skill) ? "open" : ""} ${s.anyParents?.includes(id) ? "alternative" : ""} ${route.has(s.id) && route.has(id) ? "goal-route" : ""}`}
                        />
                      ) : null;
                    }),
                  )}
                </svg>
                {atlas.nodes.map(({ skill: s, x, y, color }) => {
                  const learned = hasSkill(c, s),
                    missing = skillRequirements(c, s),
                    tierLocked = lv < skillTier(s) && !s.automatic;
                  return (
                    <button
                      key={s.id}
                      className={`skill-node ${learned ? "learned" : missing.length ? "locked" : "available"} ${tierLocked ? "tier-locked" : ""} ${selected?.id === s.id ? "selected" : ""} ${route.has(s.id) ? "on-route" : ""} ${matches(s) ? "" : "dimmed"}`}
                      style={
                        {
                          left: x - 65,
                          top: y - 35,
                          "--node-color": color,
                        } as React.CSSProperties
                      }
                      onClick={() => inspect(s)}
                      aria-label={`${s.name}: ${learned ? "learned" : missing.length ? "locked" : "available"}`}
                    >
                      <span className="skill-star">
                        {learned ? (
                          <Check size={24} />
                        ) : tierLocked ? (
                          <LockKeyhole size={21} />
                        ) : (
                          <Icon name={s.stat} size={25} />
                        )}
                      </span>
                      <strong>{s.name}</strong>
                      <small>
                        {s.automatic
                          ? "Credential"
                          : `Lv ${skillTier(s)} · ${s.cost} point${s.cost === 1 ? "" : "s"}`}
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="tree-legend">
            <span>
              <i className="learned" />
              Learned
            </span>
            <span>
              <i className="available" />
              Available
            </span>
            <span>
              <i />
              Locked
            </span>
            <span>
              <i className="alternative" />
              One-of prerequisite
            </span>
            <span>Drag to pan · Pinch to zoom</span>
          </div>
        </div>
        {selected ? (
          <SkillInspector
            c={c}
            skill={selected}
            style={skillStyle(selected, list)}
            update={update}
            onFieldwork={onFieldwork}
            onSelect={inspect}
            onClose={closeInspector}
            onCertificate={() => {
              setSelected(null);
              onCertificate();
            }}
            goal={goal}
            setGoal={setGoal}
          />
        ) : (
          <aside className="atlas-empty-inspector">
            <Star size={30} />
            <h3>Select a skill</h3>
            <div>
              {[...focused]
                .filter(
                  (s) =>
                    !hasSkill(c, s) &&
                    !skillRequirements(c, s).length &&
                    !s.automatic,
                )
                .slice(0, 3)
                .map((s) => (
                  <button key={s.id} onClick={() => inspect(s)}>
                    {s.name}
                    <small>{s.cost} points · Available</small>
                  </button>
                ))}
            </div>
          </aside>
        )}
      </div>
      <details className="atlas-level-gates">
        <summary>Level gates</summary>
        <div className="tree-ranks">
          <h3>Tree sections</h3>
          {[...new Set(list.filter((s) => !s.automatic).map(skillTier))]
            .sort((a, b) => a - b)
            .map((required) => (
              <div key={required}>
                <span className={lv >= required ? "open" : ""}>
                  {lv >= required ? (
                    <Check size={14} />
                  ) : (
                    <LockKeyhole size={14} />
                  )}
                </span>
                <b>Level {required}</b>
                <small>
                  {lv >= required
                    ? "Section unlocked"
                    : `Requires ${category === "class" && !focus ? "archetype" : category} level ${required}`}
                </small>
              </div>
            ))}
        </div>
      </details>
      {c.earnedSkills.some((id) => SKILLS.find((s) => s.id === id)?.legacy) && (
        <details className="legacy-skill-record">
          <summary>Earlier earned skills</summary>
          <div className="legacy-badges">
            {c.earnedSkills
              .filter((id) => SKILLS.find((s) => s.id === id)?.legacy)
              .map((id) => (
                <span key={id}>{SKILLS.find((s) => s.id === id)?.name}</span>
              ))}
          </div>
        </details>
      )}
    </section>
  );
}
