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
    [branch, setBranch] = useState("current"),
    [selected, setSelected] = useState<Skill | null>(null),
    [zoom, setZoom] = useState(0.75);
  const treeRef = useRef<HTMLDivElement>(null),
    drag = useRef<{ x: number; y: number; left: number; top: number } | null>(
      null,
    );
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
  const worldHeight = Math.max(810, ...list.map((s) => s.y + 125));
  useEffect(() => {
    const el = treeRef.current;
    if (el)
      el.scrollTo({
        left: Math.max(0, (1100 * zoom - el.clientWidth) / 2),
        top: Math.max(0, worldHeight * zoom - el.clientHeight),
      });
  }, [category, branch, zoom, worldHeight]);
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
            onClick={() => setZoom(Math.max(0.5, zoom - 0.15))}
          >
            <ZoomOut size={18} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in skill tree"
            onClick={() => setZoom(Math.min(1.3, zoom + 0.15))}
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>
      <div
        ref={treeRef}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          const el = treeRef.current!;
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            left: el.scrollLeft,
            top: el.scrollTop,
          };
          el.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const el = treeRef.current!;
          el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
          el.scrollTop = drag.current.top - (e.clientY - drag.current.y);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="skill-tree-window"
        tabIndex={0}
        aria-label={`${treeName} branching skill tree. Scroll to pan.`}
      >
        <div
          className="skill-tree-world"
          style={{ width: 1100 * zoom, height: worldHeight * zoom }}
        >
          <div
            className="skill-tree-canvas"
            style={{ transform: `scale(${zoom})`, height: worldHeight }}
          >
            <svg
              className="skill-connections"
              viewBox={`0 0 1100 ${worldHeight}`}
              style={{ height: worldHeight }}
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
              <rect width="1100" height={worldHeight} fill="url(#starfield)" />
              {list.flatMap((s) =>
                s.parents.map((id) => {
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
        <span>Scroll to pan · Select a node to inspect</span>
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
          <p className="helper">
            Previous purchases remain learned. Combat skills can still be
            equipped in Adventures.
          </p>
        </details>
      )}
      <p className="helper">
        Every 100 objective XP earns one point for its path. Combat points are
        shared across classes; career points are shared within a career
        discipline. Shared archetype levels include training from every
        contributing class. Nodes require level, prerequisite skills, practice,
        and multiple points. Learned skills remain yours. Equip combat skills in
        Adventures. Career competencies are non-combat.
      </p>
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
          {selected.nonCombat && (
            <div className="notice">
              Non-combat competency. It grants no stat bonus or battle action.
              Future exploration uses are planned.
            </div>
          )}
          {!selected.automatic &&
            selected.id !== "universal-root" &&
            !selected.nonCombat && (
              <div className="notice">
                Combat modifier when equipped: +{selected.cost >= 2 ? 2 : 1}{" "}
                {selected.stat}.
                {selected.combat && COMBAT_EFFECTS[selected.combat] && (
                  <>
                    <br />
                    {COMBAT_EFFECTS[selected.combat].description} MP cost:{" "}
                    {COMBAT_EFFECTS[selected.combat].mp}.
                  </>
                )}
                <br />
                Base attributes are unchanged.
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
