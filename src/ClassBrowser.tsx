import { useState } from "react";
import {
  Search,
  Check,
  LockKeyhole,
  ArrowRight,
  X,
  GitCompareArrows,
} from "lucide-react";
import type { Character, Stats, ClassPath } from "./domain";
import {
  CLASSES,
  available,
  classRequirements,
  classLevel,
  totalXP,
  stats,
} from "./domain";
import { ARCHETYPES, classPower } from "./class-catalog";
import { COMBAT_EFFECTS } from "./class-roles";
import { Icon, Modal, Tag } from "./ui";
export default function ClassBrowser({
  c,
  baseline,
  selected,
  onSelect,
}: {
  c?: Character;
  baseline?: Stats;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [tier, setTier] = useState("all"),
    [family, setFamily] = useState("all"),
    [eligibility, setEligibility] = useState("all"),
    [page, setPage] = useState(0),
    [detail, setDetail] = useState<string | null>(null),
    [compare, setCompare] = useState<string[]>([]),
    [comparing, setComparing] = useState(false);
  const s = c ? stats(c) : baseline!,
    xp = c ? totalXP(c) : 0;
  const eligible = (p: ClassPath) => available(p, s, xp, c);
  const filtered = CLASSES.filter(
    (p) =>
      (tier === "all" || p.tier === tier) &&
      (family === "all" || p.mix[family as keyof ClassPath["mix"]]) &&
      (eligibility === "all" ||
        (eligibility === "available" ? eligible(p) : !eligible(p))) &&
      `${p.name} ${p.goal} ${p.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 18)),
    safePage = Math.min(page, pages - 1);
  const reset = () => setPage(0);
  const requirements = (p: ClassPath) => classRequirements(p, s, xp, c);
  const select = (p: ClassPath) => {
    onSelect(p.id);
    setDetail(null);
    setComparing(false);
  };
  function Details({ p }: { p: ClassPath }) {
    return (
      <>
        <div className="class-detail-heading">
          <span className={`path-icon ${p.color}`}>
            <Icon name={p.icon} size={30} />
          </span>
          <div>
            <Tag tone="gold">{p.tier}</Tag>
            <h2>{p.name}</h2>
          </div>
        </div>
        <p className="fantasy-role">{p.description}</p>
        <div className="class-real-goal">
          <b>Real-world goal</b>
          <p>{p.goal}</p>
        </div>
        <div className="archetype-composition">
          {Object.entries(p.mix).map(([id, weight]) => (
            <span key={id}>
              <Icon
                name={ARCHETYPES.find((a) => a.id === id)!.icon}
                size={15}
              />
              {weight}% {ARCHETYPES.find((a) => a.id === id)!.name}
            </span>
          ))}
        </div>
        <div className="signature-preview">
          <Icon name="sword" />
          <div>
            <small>ACTIVE CLASS SIGNATURE</small>
            <h3>{p.signature.name}</h3>
            <p>{p.signature.description}</p>
            <small>
              {COMBAT_EFFECTS[p.signature.effect]?.mp} MP ·{" "}
              {classPower(p) > 1
                ? `${Math.round((classPower(p) - 1) * 100)}% increased signature potency`
                : "Class signature"}
            </small>
          </div>
        </div>
        <div className="class-gates">
          <b>Entry requirements</b>
          {!requirements(p).length ? (
            <span>
              <Check size={14} /> Open to every guild member
            </span>
          ) : (
            requirements(p).map((r) => (
              <span className={r.met ? "met" : ""} key={r.label}>
                {r.met ? <Check size={14} /> : <LockKeyhole size={14} />}{" "}
                {r.label}
              </span>
            ))
          )}
          {c?.unlockedClasses?.includes(p.id) && (
            <Tag>Unlocked permanently</Tag>
          )}
        </div>
        <button
          className="button primary full"
          disabled={!eligible(p) || selected === p.id}
          onClick={() => select(p)}
        >
          {selected === p.id
            ? "Selected class"
            : eligible(p)
              ? `Choose ${p.name}`
              : "Requirements not met"}
          <ArrowRight size={16} />
        </button>
      </>
    );
  }
  return (
    <section className="class-browser">
      <div className="class-browser-summary">
        <div>
          <span className="eyebrow">GUILD CLASS REGISTER</span>
          <h3>
            {CLASSES.length} classes · {CLASSES.filter(eligible).length}{" "}
            available
          </h3>
        </div>
        <button
          className="button secondary"
          disabled={compare.length < 2}
          onClick={() => setComparing(true)}
        >
          <GitCompareArrows size={16} />
          Compare {compare.length}/3
        </button>
      </div>
      <div className="class-filters">
        <label className="class-search">
          <Search size={17} />
          <input
            aria-label="Search classes"
            placeholder="Search classes or real-world goals"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              reset();
            }}
          />
        </label>
        <select
          aria-label="Class archetype"
          value={family}
          onChange={(e) => {
            setFamily(e.target.value);
            reset();
          }}
        >
          <option value="all">All archetypes</option>
          {ARCHETYPES.map((a) => (
            <option value={a.id} key={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Class availability"
          value={eligibility}
          onChange={(e) => {
            setEligibility(e.target.value);
            reset();
          }}
        >
          <option value="all">All requirements</option>
          <option value="available">Available now</option>
          <option value="locked">Locked paths</option>
        </select>
      </div>
      <div className="class-tier-tabs" aria-label="Class tiers">
        {["all", "Basic", "Advanced", "Prestige", "Ascendant"].map((t) => (
          <button
            className={tier === t ? "active" : ""}
            key={t}
            onClick={() => {
              setTier(t);
              reset();
            }}
          >
            {t === "all" ? "All tiers" : t}
            <span>
              {CLASSES.filter((p) => t === "all" || p.tier === t).length}
            </span>
          </button>
        ))}
      </div>
      <div className="class-index">
        {filtered.slice(safePage * 18, safePage * 18 + 18).map((p) => (
          <article
            key={p.id}
            className={`class-index-entry ${selected === p.id ? "current" : ""} ${eligible(p) ? "eligible" : "locked"}`}
          >
            <button
              className="class-inspect"
              onClick={() => setDetail(p.id)}
              aria-label={`Inspect ${p.name}`}
            >
              <span className={`mini-class-icon ${p.color}`}>
                <Icon name={p.icon} size={21} />
              </span>
              <span>
                <b>{p.name}</b>
                <small>
                  {p.tier}
                  {c && classLevel(c, p.id) > 1
                    ? ` · Lv. ${classLevel(c, p.id)}`
                    : ""}
                </small>
              </span>
              {selected === p.id ? (
                <Check size={15} />
              ) : !eligible(p) ? (
                <LockKeyhole size={13} />
              ) : (
                <ArrowRight size={14} />
              )}
            </button>
            <button
              className={`compare-toggle ${compare.includes(p.id) ? "chosen" : ""}`}
              onClick={() =>
                setCompare(
                  compare.includes(p.id)
                    ? compare.filter((id) => id !== p.id)
                    : compare.length < 3
                      ? [...compare, p.id]
                      : compare,
                )
              }
              disabled={!compare.includes(p.id) && compare.length >= 3}
              aria-label={`${compare.includes(p.id) ? "Remove" : "Add"} ${p.name} ${compare.includes(p.id) ? "from" : "to"} comparison`}
            >
              {compare.includes(p.id) ? <Check size={12} /> : <PlusMark />}{" "}
              Compare
            </button>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="notice">No classes match these filters.</p>
      )}
      <div className="class-pagination">
        <span>{filtered.length} matches · Select a class to inspect</span>
        <div>
          <button
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            Previous
          </button>
          <b>
            {safePage + 1} / {pages}
          </b>
          <button
            disabled={safePage === pages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </button>
        </div>
      </div>
      {compare.length > 0 && (
        <div className="comparison-tray">
          {compare.map((id) => (
            <button
              key={id}
              onClick={() => setCompare(compare.filter((x) => x !== id))}
            >
              {CLASSES.find((p) => p.id === id)?.name}
              <X size={12} />
            </button>
          ))}
          <small>Choose up to three classes</small>
        </div>
      )}
      {detail && (
        <Modal title="Class dossier" onClose={() => setDetail(null)}>
          <Details p={CLASSES.find((p) => p.id === detail)!} />
        </Modal>
      )}
      {comparing && (
        <Modal
          title="Compare class paths"
          wide
          onClose={() => setComparing(false)}
        >
          <div className="class-comparison">
            {compare.map((id) => (
              <article key={id}>
                <Details p={CLASSES.find((p) => p.id === id)!} />
              </article>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}
function PlusMark() {
  return <span aria-hidden="true">+</span>;
}
