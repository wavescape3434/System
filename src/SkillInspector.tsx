import { careerUtilityForSkill } from "./career-payoffs";
import { Check, LockKeyhole, X, Star } from "lucide-react";
import type { Character, Skill } from "./domain";
import {
  SKILLS,
  hasSkill,
  learnSkill,
  skillRequirements,
  skillWallet,
  skillPointsAvailable,
  skillTier,
} from "./domain";
import {
  combatProfile,
  combatFamily,
  bestCombatSkills,
} from "./combat-progression";
import { campaign, toggleEquippedSkill } from "./rpg";
import { Icon, Progress, Tag } from "./ui";

export default function SkillInspector({
  c,
  skill: s,
  style,
  update,
  onSelect,
  onClose,
  onCertificate,
  goal,
  setGoal,
}: {
  c: Character;
  skill: Skill;
  style: string;
  update: (c: Character) => Promise<boolean>;
  onSelect: (s: Skill) => void;
  onClose: () => void;
  onCertificate: () => void;
  goal: string;
  setGoal: (id: string) => void;
}) {
  const learned = hasSkill(c, s),
    missing = skillRequirements(c, s),
    points = skillPointsAvailable(c, skillWallet(c, s)),
    data = campaign(c),
    equipped = data.equippedSkills.some(
      (id) =>
        combatFamily(SKILLS.find((n) => n.id === id)!) === combatFamily(s),
    ),
    combat = !s.nonCombat && !s.automatic && s.id !== "universal-root",
    effect = s.combat ? combatProfile(s) : undefined,
    upgrade = bestCombatSkills(c.earnedSkills, SKILLS).find(
      (n) => combatFamily(n) === combatFamily(s),
    );
  const parents = (ids: string[]) =>
    ids
      .map((id) => SKILLS.find((n) => n.id === id))
      .filter((n): n is Skill => !!n)
      .map((parent) => (
        <button
          key={parent.id}
          onClick={() => onSelect(parent)}
          className={hasSkill(c, parent) ? "learned" : ""}
        >
          {hasSkill(c, parent) ? (
            <Check size={15} />
          ) : (
            <LockKeyhole size={15} />
          )}{" "}
          {parent.name}
        </button>
      ));
  return (
    <aside
      className="skill-inspector"
      aria-label="Selected skill"
      tabIndex={-1}
    >
      <div className="inspector-heading">
        <span>{style}</span>
        <button
          className="icon-button"
          aria-label="Close skill details"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      <div className="inspector-title">
        <Icon name={s.stat} size={29} />
        <h3>{s.name}</h3>
      </div>
      <div className="skill-detail-meta">
        <Tag>
          {learned
            ? "Learned"
            : s.automatic
              ? "Credential"
              : missing.length
                ? "Locked"
                : "Available"}
        </Tag>
        <Tag tone="gold">
          {s.automatic
            ? "Credential milestone"
            : `${s.cost} point${s.cost === 1 ? "" : "s"}`}{" "}
          · Lv. {skillTier(s)}
        </Tag>
      </div>
      <p>{s.description}</p>
      <section className="inspector-effect">
        <h4>{s.nonCombat ? "Professional competency" : "Adventure effect"}</h4>
        {s.nonCombat ? (
          <>
            <p>Non-combat skill · {s.proof}.</p>
            {careerUtilityForSkill(s.id) && (
              <p>
                <b>{careerUtilityForSkill(s.id)!.name}:</b>{" "}
                {careerUtilityForSkill(s.id)!.effect}
              </p>
            )}
          </>
        ) : combat ? (
          <>
            <p>
              While equipped: +{combatProfile(s).statBonus} combat {s.stat}.
            </p>
            {effect && (
              <p>
                Rank {effect.rank} · {effect.description} <b>{effect.mp} MP</b>
              </p>
            )}
          </>
        ) : (
          <p>
            {s.id === "universal-root"
              ? "Attack, guard, items and the active class signature."
              : s.proof}
          </p>
        )}
      </section>
      {upgrade && upgrade.id !== s.id && (
        <p className="technique-upgrade">
          {combatProfile(upgrade).rank < combatProfile(s).rank
            ? "Upgrades"
            : "Stronger owned version:"}{" "}
          <b>{upgrade.name}</b> · one loadout slot
          <button className="text-button" onClick={() => onSelect(upgrade)}>
            View technique
          </button>
        </p>
      )}
      {(s.parents.length > 0 || !!s.anyParents?.length) && (
        <section className="inspector-parents">
          {s.parents.length > 0 && (
            <>
              <h4>Required skills · all</h4>
              {parents(s.parents)}
            </>
          )}
          {!!s.anyParents?.length && (
            <>
              <h4>Alternative skills · choose one</h4>
              {parents(s.anyParents)}
            </>
          )}
        </section>
      )}
      <section className="inspector-practice">
        <h4>Practice</h4>
        <p>{s.proof}</p>
        <Progress
          value={Math.min(s.current(c), s.target)}
          max={Math.max(1, s.target)}
          label={`${s.name} practice progress`}
        />
        <small>
          {Math.min(s.current(c), s.target)} / {s.target}{" "}
          {s.automatic ? "credential" : "practice"}
        </small>
      </section>
      {!learned && missing.length > 0 && (
        <ul className="skill-requirements">
          {missing.map((text) => (
            <li key={text}>
              <LockKeyhole size={13} />
              {text}
            </li>
          ))}
        </ul>
      )}
      <div className="inspector-actions">
        {s.automatic && !learned ? (
          <button className="button primary full" onClick={onCertificate}>
            Record credential
          </button>
        ) : (
          <button
            className="button primary full"
            disabled={learned || s.automatic || missing.length > 0}
            onClick={() => {
              const next = learnSkill(c, s.id);
              if (next !== c) update(next);
            }}
          >
            {learned ? (
              <>
                <Check size={16} />
                Learned
              </>
            ) : (
              `Purchase skill · ${s.cost} point${s.cost === 1 ? "" : "s"}`
            )}
          </button>
        )}
        {!s.automatic && !learned && (
          <small>
            {points}{" "}
            {skillWallet(c, s) === "combat"
              ? "combat"
              : s.category === "profession"
                ? "career"
                : "universal"}{" "}
            points available
          </small>
        )}
        {learned && combat && (
          <button
            className="button secondary full"
            disabled={
              data.battle?.phase === "player" ||
              (!equipped && data.equippedSkills.length >= 4)
            }
            onClick={() => update(toggleEquippedSkill(c, s.id))}
          >
            {equipped
              ? "Unequip skill"
              : `Equip for adventures · ${data.equippedSkills.length}/4 slots`}
          </button>
        )}
        {!learned && s.id !== "universal-root" && (
          <button
            className="button secondary full"
            aria-pressed={goal === s.id}
            onClick={() => setGoal(goal === s.id ? "" : s.id)}
          >
            <Star size={15} />
            {goal === s.id ? "Clear skill goal" : "Set skill goal"}
          </button>
        )}
      </div>
    </aside>
  );
}
