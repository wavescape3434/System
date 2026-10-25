import { ArrowUpRight } from "lucide-react";
import type { Character } from "./domain";
import {
  ATTRIBUTES,
  activeVocation,
  currentPath,
  stats,
  classLevel,
  professionLevel,
  vocationLevel,
  characterRank,
  level,
  adventurerXP,
  totalXP,
} from "./domain";
import { levelProgress } from "./progression";
import { Icon } from "./ui";
export function GuildSigil() {
  return (
    <svg className="guild-sigil" viewBox="0 0 180 240" aria-hidden="true">
      <defs>
        <pattern
          id="engraved-hatch"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 5 5 0" stroke="currentColor" strokeWidth=".5" />
        </pattern>
      </defs>
      <path
        d="M12 18h156v174l-78 35-78-35Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M18 24h144v164l-72 32-72-32Z"
        fill="url(#engraved-hatch)"
        opacity=".4"
      />
      <path
        d="m90 35 10 22 32 8-21 17 18 20-27-2-12 27-12-27-27 2 18-20-21-17 32-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M90 42v151m-9-39h18m-9-37-9 36 9 37 9-37Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="m79 118-24-10-24-39 29 13 17 23m24 13 24-10 24-39-29 13-17 23M76 132l-24-12-20-25 26 11m46 26 24-12 20-25-26 11M74 146l-28-13-12-21m72 34 28-13 12-21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="90" cy="153" r="46" fill="none" stroke="currentColor" />
      <circle
        cx="90"
        cy="153"
        r="40"
        fill="none"
        stroke="currentColor"
        strokeDasharray="1 4"
      />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path
          key={i}
          d="m90 109 3 6-3 6-3-6Z"
          fill="currentColor"
          transform={`rotate(${45 * i} 90 153)`}
        />
      ))}
      <path
        d="m47 194 43 20 43-20M34 32h32m48 0h32"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  );
}
export default function GuildCard({
  c,
  onSkills,
  onSection,
}: {
  c: Character;
  onSkills: () => void;
  onSection?: (section: string) => void;
}) {
  const p = currentPath(c),
    s = stats(c),
    v = activeVocation(c),
    progress = levelProgress(adventurerXP(c), 250);
  return (
    <section
      className="engraved-card"
      data-metal={characterRank(c).metal.toLowerCase()}
      aria-label="Engraved adventurer guild card"
    >
      <div className="engraved-runes" aria-hidden="true">
        ◇ ⟐ △ ✧ ◇ ⟐ △ ✧ ◇ ⟐ △ ✧ ◇ ⟐ △ ✧ ◇ ⟐ △ ✧ ◇ ⟐ △ ✧
      </div>
      <div className="engraved-header">
        <span>THE ADVENTURERS GUILD</span>
        <b>REGISTER OF THE REALM</b>
      </div>
      <div className="engraved-body">
        <div className="engraved-information">
          <div className="engraved-name">
            <small>REGISTERED NAME</small>
            <h2>{c.name}</h2>
          </div>
          <button
            className="engraved-line engraved-link"
            onClick={() => onSection?.("class")}
            aria-label="Open class register"
          >
            <small>CLASS</small>
            <b>
              <Icon name={p.icon} size={15} />
              {p.name}
            </b>
            <span>Lv. {classLevel(c, p.id)}</span>
          </button>
          <button
            className="engraved-line engraved-link"
            onClick={() => onSection?.("profession")}
            aria-label="Open profession"
          >
            <small>PROFESSION</small>
            <b>{c.profession}</b>
            <span>Lv. {professionLevel(c)}</span>
          </button>
          <button
            className="engraved-line engraved-link"
            onClick={() => onSection?.("vocation")}
            aria-label="Open vocation"
          >
            <small>VOCATION</small>
            <b>{v?.name || "Undeclared"}</b>
            {v && <span>Lv. {vocationLevel(c)}</span>}
          </button>
          <div className="engraved-stats">
            {ATTRIBUTES.map((a) => (
              <button
                className="engraved-link"
                key={a}
                onClick={() => onSection?.("attributes")}
                aria-label={`Open ${a} stats`}
              >
                <Icon name={a} size={13} />
                <span>{a}</span>
                <b>{s[a]}</b>
                <i>✧</i>
              </button>
            ))}
          </div>
          <button className="engraved-skills-link" onClick={onSkills}>
            OPEN SKILL REGISTER <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="engraved-seal-column">
          <GuildSigil />
          <button
            className="engraved-rank engraved-link"
            onClick={() => onSection?.("rank")}
            aria-label="Open guild rank progression"
          >
            <small>GUILD RANK</small>
            <strong>{characterRank(c).name}</strong>
            <span>{characterRank(c).metal.toUpperCase()}</span>
          </button>
          <button
            className="engraved-level engraved-link"
            onClick={() => onSection?.("rank")}
            aria-label="Open player progression"
          >
            <small>PLAYER LEVEL</small>
            <strong>{level(adventurerXP(c))}</strong>
          </button>
        </div>
      </div>
      <div className="engraved-experience">
        <span>EXPERIENCE</span>
        <b>
          {Math.round(progress.current).toLocaleString()} /{" "}
          {progress.needed.toLocaleString()} XP
        </b>
        <div>
          <i
            style={{ width: `${(progress.current / progress.needed) * 100}%` }}
          />
        </div>
      </div>
      <div className="engraved-footer">
        <span>SEAL · {c.id.replaceAll("-", "").slice(0, 8).toUpperCase()}</span>
        <span>{totalXP(c).toLocaleString()} LIFETIME XP</span>
      </div>
      <div className="engraved-runes bottom" aria-hidden="true">
        ◇ ⟐ △ ✧ ◇ ⟐ △ ✧ ◇ ⟐ △ ✧ ◇ ⟐ △ ✧ ◇ ⟐ △ ✧ ◇ ⟐ △ ✧
      </div>
    </section>
  );
}
