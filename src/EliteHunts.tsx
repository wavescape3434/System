import BattleSprite from "./BattleSprite";
import { useState } from "react";
import type { Character } from "./domain";
import { campaign, startBattle, encounterEnemies, adventureParty } from "./rpg";
import {
  ELITE_HUNTS,
  HUNT_GRADES,
  WORLD_REGIONS,
  PLACES,
  RESOURCE_NAMES,
} from "./world-catalog";
import { placeCleared, placeOpen } from "./world-state";
import { TACTIC_NAMES, TACTIC_DETAILS } from "./enemy-tactics";
export default function EliteHunts({
  c,
  update,
}: {
  c: Character;
  update: (c: Character) => Promise<boolean>;
}) {
  const data = campaign(c),
    [region, setRegion] = useState(
      ELITE_HUNTS.find((h) => h.id === data.world!.lastHunt)?.region ||
        PLACES.find((p) => p.id === data.world!.placeId)?.region ||
        "mossfall",
    ),
    [grade, setGrade] = useState(
      ELITE_HUNTS.find((h) => h.id === data.world!.lastHunt)?.huntGrade || 1,
    ),
    [busy, setBusy] = useState(false),
    hunt = ELITE_HUNTS.find(
      (h) => h.region === region && h.huntGrade === grade,
    )!,
    enemies = encounterEnemies(hunt.id),
    place = PLACES.find((p) => p.id === hunt.placeId)!,
    open = placeOpen(data, place.id) && placeCleared(data, place.id),
    defeated = data.cleared.includes(hunt.id);
  return (
    <section className="pixel-world elite-hunts" aria-label="Elite hunts">
      <label className="hunt-region">
        Region
        <select
          aria-label="Hunt region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          {WORLD_REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <div className="hunt-grades" role="group" aria-label="Hunt difficulty">
        {HUNT_GRADES.map((g, i) => (
          <button
            key={g.name}
            className={grade === i + 1 ? "selected" : ""}
            aria-pressed={grade === i + 1}
            onClick={() => setGrade(i + 1)}
          >
            {g.name}
            {data.cleared.includes(`${region}-hunt-${i + 1}`) && (
              <span aria-label="Cleared"> ✓</span>
            )}
          </button>
        ))}
      </div>
      <article className="pixel-window hunt-writ">
        <span>
          ELITE HUNT · {HUNT_GRADES[grade - 1].name.toUpperCase()}
          {defeated ? " · CLEARED" : ""}
        </span>
        <h2>{hunt.name}</h2>
        <p>{place.name}</p>
        <div className="hunt-enemies">
          {enemies.map((e) => (
            <div key={e.id}>
              <span className="hunt-enemy-sprite" aria-hidden="true">
                <BattleSprite unit={e} />
              </span>
              <h3>{e.name}</h3>
              <p>
                {e.maxHp} HP · {e.attack} attack · {e.defense} defense
              </p>
              {e.tactic && (
                <p>
                  <b>{TACTIC_NAMES[e.tactic]}</b> · {TACTIC_DETAILS[e.tactic]}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="pixel-gold">
          {hunt.gold} gold ·{" "}
          {Object.entries(hunt.loot)
            .map(([id, n]) => `${n} ${RESOURCE_NAMES[id]}`)
            .join(" · ")}
        </p>
        {!open && (
          <p>
            Requires: clear all {place.stages.length} stages of {place.name}.
          </p>
        )}
        <button
          className="pixel-primary"
          disabled={
            busy ||
            !open ||
            !!data.battle ||
            adventureParty(c).every((u) => u.hp === 0)
          }
          onClick={async () => {
            if (busy) return;
            const next = startBattle(c, hunt.id);
            if (next === c) return;
            setBusy(true);
            try {
              await update(next);
            } finally {
              setBusy(false);
            }
          }}
        >
          Begin hunt
        </button>
      </article>
    </section>
  );
}
