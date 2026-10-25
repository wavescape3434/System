import { ARCHETYPES } from "./class-catalog";
import { CAREER_CATEGORIES, careerCategory } from "./careers";
import { levelFromXP } from "./progression";
import { COMBAT_EFFECTS } from "./class-roles";
import { useState, useEffect, useRef } from "react";
import {
  LockKeyhole,
  Check,
  ZoomIn,
  ZoomOut,
  Scan,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Character, Skill } from "./domain";
import {
  SKILLS,
  currentPath,
  archetypeXP,
  activeVocation,
  hasSkill,
  learnSkill,
  skillRequirements,
  skillWallet,
  skillPointsAvailable,
  walletLevel,
  skillTier,
} from "./domain";
import { Icon, Modal, Progress, Tag } from "./ui";
export default function SkillTree({
  c,
  update,
  onCertificate,
}: {
  c: Character;
  update: (c: Character) => boolean;
  onCertificate: () => void;
}) {
  const [category, setCategory] = useState("universal"),
    [listMode, setListMode] = useState(false),
    [search, setSearch] = useState(""),
    [branch, setBranch] = useState("current"),
    [selected, setSelected] = useState<Skill | null>(null),
    [zoom, setZoom] = useState(0.4);
  const treeRef = useRef<HTMLDivElement>(null),
    zoomRef = useRef(0.4),
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
    category === "class"
      ? branch === "current"
        ? primary
        : branch
      : branch === "current"
        ? careerCategory(c.profession).id
        : branch;
  const focus = owner === "focus";
  const list = SKILLS.filter(
    (s) =>
      !s.legacy &&
      s.category === category &&
      (category === "universal" || category === "class"
        ? category === "universal" ||
          (focus
            ? s.owner === c.activeClass && !s.archetype
            : s.archetype === owner)
        : s.owner === owner),
  );
  const worldHeight = Math.max(810, ...list.map((s) => s.y + 125)),
    worldWidth = Math.max(1100, ...list.map((s) => s.x + 170));
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
  useEffect(() => {
    fitTree();
  }, [category, branch, worldHeight, worldWidth]);
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
      category === "class" && !focus
        ? levelFromXP(archetypeXP(c, owner))
        : walletLevel(c, wallet),
    shards = skillPointsAvailable(c, wallet);
  const treeName =
    category === "universal"
      ? "Universal skills"
      : category === "class"
        ? focus
          ? `${p.name} Focus`
          : `${ARCHETYPES.find((a) => a.id === owner)?.name} Arts`
        : owner === "networking"
          ? "Networking · Credential Path"
          : owner === "analysis"
            ? "Data Analysis · Focus"
            : CAREER_CATEGORIES.find((g) => g.id === owner)?.name ||
              c.profession;
  return (
    <>
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
                setCategory(id);
                setBranch("current");
              }}
            >
              {id[0].toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
        <button className="button secondary" onClick={onCertificate}>
          <Plus size={15} />
          Record credential
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
              onChange={(e) => setBranch(e.target.value)}
            >
              <option value="current">
                {ARCHETYPES.find((a) => a.id === primary)?.name} · Primary
              </option>
              {Object.entries(p.mix)
                .filter(([id]) => id !== primary)
                .map(([id, weight]) => (
                  <option key={id} value={id}>
                    {ARCHETYPES.find((a) => a.id === id)?.name} · {weight}%
                  </option>
                ))}
              <option value="focus">{p.name} · Unique focus</option>
            </select>
          </label>
        )}
        {category === "profession" && (
          <label className="field">
            Career tree
            <select
              aria-label="Profession tree"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
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
      {category === "class" && owner === "fighter" && (
        <div className="tree-specializations">
          {[
            ["sword", "Swordsmanship"],
            ["spear", "Spearcraft"],
            ["axe", "Axe Fighting"],
            ["unarmed", "Unarmed Combat"],
          ].map(([id, name]) => (
            <button
              key={id}
              onClick={() => {
                const node = list.find((s) => s.id === `martial-${id}-1`),
                  el = treeRef.current;
                if (node && el)
                  el.scrollTo({
                    left: Math.max(0, node.x * zoom - el.clientWidth / 2),
                    top: Math.max(0, node.y * zoom - el.clientHeight / 2),
                    behavior: "smooth",
                  });
              }}
            >
              Find {name}
            </button>
          ))}
        </div>
      )}
      <div className="tree-view-switch">
        <button aria-pressed={!listMode} onClick={() => setListMode(false)}>
          Tree
        </button>
        <button aria-pressed={listMode} onClick={() => setListMode(true)}>
          Skill list
        </button>
        {listMode && (
          <input
            type="search"
            aria-label="Search skills"
            placeholder="Search skills"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
      </div>
      {listMode && (
        <div className="accessible-skill-list">
          {[...list]
            .filter(
              (s) =>
                !search ||
                `${s.name} ${s.description}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            )
            .sort((a, b) => skillTier(a) - skillTier(b) || a.cost - b.cost)
            .map((s) => (
              <button key={s.id} onClick={() => setSelected(s)}>
                <Icon name={s.stat} size={20} />
                <span>
                  <b>{s.name}</b>
                  <small>
                    Lv. {skillTier(s)} · {s.cost} point{s.cost === 1 ? "" : "s"}{" "}
                    ·{" "}
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
              wx: (el.scrollLeft + (a.x + b.x) / 2 - r.left) / zoomRef.current,
              wy: (el.scrollTop + (a.y + b.y) / 2 - r.top) / zoomRef.current,
            };
            moved.current = true;
            for (const id of pointers.current.keys()) el.setPointerCapture(id);
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
                  <circle cx="14" cy="20" r="1" fill="#b9c89a" opacity=".28" />
                  <circle cx="78" cy="63" r=".7" fill="#c8c4a2" opacity=".35" />
                </pattern>
              </defs>
              <rect
                width={worldWidth}
                height={worldHeight}
                fill="url(#starfield)"
              />
              {list.flatMap((s) =>
                [...s.parents, ...(s.anyParents || [])].map((id) => {
                  const parent = list.find((p) => p.id === id);
                  return parent ? (
                    <path
                      key={`${s.id}-${id}`}
                      d={`M ${parent.x} ${parent.y} C ${parent.x} ${(parent.y + s.y) / 2}, ${s.x} ${(parent.y + s.y) / 2}, ${s.x} ${s.y}`}
                      className={
                        hasSkill(c, s)
                          ? "learned"
                          : hasSkill(c, parent)
                            ? "open"
                            : ""
                      }
                    />
                  ) : null;
                }),
              )}
            </svg>
            {list.map((s) => {
              const learned = hasSkill(c, s),
                missing = skillRequirements(c, s),
                tierLocked = lv < skillTier(s) && !s.automatic;
              return (
                <button
                  key={s.id}
                  className={`skill-node ${learned ? "learned" : missing.length ? "locked" : "available"} ${tierLocked ? "tier-locked" : ""}`}
                  style={{ left: s.x - 65, top: s.y - 35 }}
                  onClick={() => setSelected(s)}
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
        <span>Drag to pan · Pinch to zoom</span>
      </div>
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
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="skill-detail-meta">
            <Tag>{selected.category}</Tag>
            <Tag tone="gold">
              {selected.automatic
                ? "Credential milestone"
                : `${selected.cost} points`}
            </Tag>
          </div>
          <p>{selected.description}</p>
          {selected.nonCombat && <Tag>Non-combat</Tag>}
          {!selected.automatic &&
            selected.id !== "universal-root" &&
            !selected.nonCombat && (
              <div className="notice">
                Equipped: +{selected.cost >= 2 ? 2 : 1} {selected.stat}.
                {selected.combat && COMBAT_EFFECTS[selected.combat] && (
                  <>
                    <br />
                    {COMBAT_EFFECTS[selected.combat].description} MP cost:{" "}
                    {COMBAT_EFFECTS[selected.combat].mp}.
                  </>
                )}
              </div>
            )}
          <Progress
            value={Math.min(selected.current(c), selected.target)}
            max={Math.max(1, selected.target)}
          />
          <p className="helper">{selected.proof}</p>
          {!hasSkill(c, selected) && (
            <ul className="skill-requirements">
              {skillRequirements(c, selected).map((text) => (
                <li key={text}>
                  <LockKeyhole size={13} />
                  {text}
                </li>
              ))}
            </ul>
          )}
          <button
            className="button primary full"
            disabled={
              hasSkill(c, selected) ||
              selected.automatic ||
              skillRequirements(c, selected).length > 0
            }
            onClick={() => {
              const next = learnSkill(c, selected.id);
              if (next !== c && update(next)) setSelected(null);
            }}
          >
            {hasSkill(c, selected) ? (
              <>
                <Check size={16} />
                Learned
              </>
            ) : selected.automatic ? (
              "Record the required credential"
            ) : (
              <>
                Purchase skill ·{" "}
                {skillPointsAvailable(c, skillWallet(c, selected))} points
                available <Sparkles size={16} />
              </>
            )}
          </button>
        </Modal>
      )}
    </>
  );
}
