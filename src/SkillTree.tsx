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
  CLASSES,
  hasSkill,
  learnSkill,
  skillRequirements,
  skillWallet,
  skillPointsAvailable,
  walletLevel,
  skillTier,
} from "./domain";
import { professionGroup } from "./professions";
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
  useEffect(() => {
    const el = treeRef.current;
    if (el)
      el.scrollTo({
        left: Math.max(0, (1100 * zoom - el.clientWidth) / 2),
        top: Math.max(0, 800 * zoom - el.clientHeight),
      });
  }, [category, branch, zoom]);
  const group = professionGroup(c.profession);
  const owner =
    category === "class"
      ? c.activeClass
      : category === "subclass"
        ? c.subclass
        : branch === "current"
          ? group.code
          : branch;
  const list = SKILLS.filter(
    (s) =>
      s.category === category &&
      (category === "universal" || category === "class"
        ? category === "universal" || s.owner === owner
        : category === "subclass"
          ? s.subclass === owner
          : s.owner === owner),
  );
  const wallet =
    category === "universal"
      ? "universal"
      : category === "class"
        ? `class:${c.activeClass}`
        : category === "subclass"
          ? `subclass:${c.subclass}`
          : `profession:${c.profession}`;
  const lv = walletLevel(c, wallet),
    shards = skillPointsAvailable(c, wallet),
    treeName =
      category === "universal"
        ? "Universal skills"
        : category === "class"
          ? CLASSES.find((p) => p.id === c.activeClass)!.name
          : category === "subclass"
            ? CLASSES.flatMap((p) => p.subclasses).find(
                (s) => s.id === c.subclass,
              )?.name || "No subclass selected"
            : branch === "current"
              ? c.profession
              : branch === "networking"
                ? "Networking"
                : "Data Analysis";
  return (
    <>
      <div className="tree-toolbar">
        <div
          className="tree-categories"
          role="tablist"
          aria-label="Skill tree categories"
        >
          {["universal", "class", "subclass", "profession"].map((id) => (
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
            Level {lv} · {shards} unspent {category} skill shards
          </p>
        </div>
        {category === "profession" && (
          <label className="field">
            Profession tree
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="current">{c.profession}</option>
              <option value="networking">Networking</option>
              <option value="analysis">Data Analysis</option>
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
          style={{ width: 1100 * zoom, height: 800 * zoom }}
        >
          <div
            className="skill-tree-canvas"
            style={{ transform: `scale(${zoom})` }}
          >
            <svg
              className="skill-connections"
              viewBox="0 0 1100 800"
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
              <rect width="1100" height="800" fill="url(#starfield)" />
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
                      : `Lv ${skillTier(s)} · ${s.cost} shard${s.cost === 1 ? "" : "s"}`}
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
      {category === "subclass" && !c.subclass && (
        <div className="notice">
          Select a subclass in Classes & Subclasses to access its tree.
        </div>
      )}
      <div className="tree-ranks">
        <h3>Tree sections</h3>
        {(category === "class" || category === "subclass"
          ? [1, 3, 5, 10, 20]
          : [1, 3, 5]
        ).map((required) => (
          <div key={required}>
            <span className={lv >= required ? "open" : ""}>
              {lv >= required ? <Check size={14} /> : <LockKeyhole size={14} />}
            </span>
            <b>Level {required}</b>
            <small>
              {lv >= required
                ? "Section unlocked"
                : `Requires ${category} level ${required}`}
            </small>
          </div>
        ))}
      </div>
      <p className="helper">
        Objectives earn shards for their progression path: 1 per 25 XP, plus 2
        per level. Nodes require an unlocked section, prerequisite nodes, and
        the listed practice. Learned skills are permanent. Equip up to four
        skills in Adventures for combat modifiers and actions; buying one never
        changes base attributes.
      </p>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="skill-detail-meta">
            <Tag>{selected.category}</Tag>
            <Tag tone="gold">
              {selected.automatic
                ? "Credential milestone"
                : `${selected.cost} shards`}
            </Tag>
          </div>
          <p>{selected.description}</p>
          {!selected.automatic && selected.id !== "universal-root" && (
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
                {skillPointsAvailable(c, skillWallet(c, selected))} shards
                available <Sparkles size={16} />
              </>
            )}
          </button>
        </Modal>
      )}
    </>
  );
}
