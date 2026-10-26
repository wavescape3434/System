import AppearancePicker from "./AppearancePicker";
import { selectAppearance } from "./appearance";
import WorldMap from "./WorldMap";
import PixelScene from "./PixelScene";
import {
  continueAdventure,
  returnToMap,
  explore,
  challengeBoss,
  declineBoss,
} from "./world";
import {
  placeProgress,
  placeCleared,
  bossChance,
  ambushChance,
} from "./world-state";
import { startBattle } from "./rpg";
import { RESOURCE_NAMES, PLACES } from "./world-catalog";
import { currentPath } from "./domain";
import { classPower } from "./class-catalog";
import { COMBAT_EFFECTS } from "./class-roles";
import { CLASS_ROLES } from "./class-roles";
import { useState, useEffect } from "react";
import {
  Sword,
  Shield,
  FlaskConical,
  Sparkles,
  Users,
  Backpack,
  Map,
  Coins,
  Flag,
  ArrowLeft,
} from "lucide-react";
import type { Character } from "./domain";
import { stats, SKILLS, hasSkill } from "./domain";
import {
  campaign,
  ENCOUNTERS,
  COMPANIONS,
  combatAttributes,
  act,
  claimVictory,
  toggleEquippedSkill,
} from "./rpg";
import type { Unit, Action, Campaign } from "./rpg";
import { Progress, Tag, Icon } from "./ui";
import BattleSprite from "./BattleSprite";
export default function AdventureGame({
  c,
  update,
}: {
  c: Character;
  update: (c: Character) => boolean;
}) {
  const data = campaign(c),
    [tab, setTab] = useState("map"),
    [appearanceOpen, setAppearanceOpen] = useState(false),
    [enemyTarget, setEnemyTarget] = useState(0),
    [allyTarget, setAllyTarget] = useState(0),
    [actionError, setActionError] = useState(""),
    [impact, setImpact] = useState<{
      key: number;
      name: string;
      units: { id: string; amount: number }[];
    } | null>(null);
  useEffect(() => {
    if (!impact) return;
    const timer = setTimeout(() => setImpact(null), 1300);
    return () => clearTimeout(timer);
  }, [impact]);
  const change = (next: Campaign) => update({ ...c, campaign: next });
  const battle = data.battle;
  const command = (action: Action) => {
    if (!battle) return;
    const next = act(c, action);
    if (next === c) {
      setActionError("Select a living target and check MP or item stock.");
      return;
    }
    setActionError("");
    const after = campaign(next).battle!;
    const name =
      action.kind === "ability"
        ? battle.party[battle.actor].abilities.find(
            (a) => a.id === action.abilityId,
          )?.name || "Skill"
        : action.kind[0].toUpperCase() + action.kind.slice(1);
    if (update(next))
      setImpact({
        key: Date.now(),
        name,
        units: [...battle.party, ...battle.enemies].flatMap((u) => {
          const v = [...after.party, ...after.enemies].find(
            (v) => v.id === u.id,
          );
          return v && v.hp !== u.hp ? [{ id: u.id, amount: v.hp - u.hp }] : [];
        }),
      });
  };
  const skills = SKILLS.filter(
    (s) =>
      hasSkill(c, s) &&
      !s.automatic &&
      !s.nonCombat &&
      s.id !== "universal-root",
  );
  const base = stats(c),
    combat = combatAttributes(c);
  if (battle) {
    const actor = battle.party[battle.actor],
      target =
        battle.enemies[enemyTarget]?.hp > 0
          ? enemyTarget
          : battle.enemies.findIndex((e) => e.hp > 0),
      ally =
        battle.party[allyTarget]?.hp > 0
          ? allyTarget
          : battle.party.findIndex((e) => e.hp > 0);
    const encounter = ENCOUNTERS.find((e) => e.id === battle.encounterId)!,
      biome = PLACES.find((p) => p.id === encounter.placeId)!.biome;
    const fighter = (unit: Unit, index: number, enemy: boolean) => (
      <button
        className={`fighter ${unit.hp === 0 ? "down" : ""} ${enemy && index === target ? "targeted" : ""} ${!enemy && index === battle.actor ? "acting" : ""} ${!enemy && index === ally ? "ally-targeted" : ""}`}
        key={unit.id}
        onClick={() => (enemy ? setEnemyTarget(index) : setAllyTarget(index))}
        aria-pressed={enemy ? index === target : index === ally}
        aria-label={`Target ${unit.name}, ${unit.hp} HP`}
      >
        <div className="fighter-label">
          <b>{unit.name}</b>
          {enemy &&
            unit.boss &&
            battle.phase === "player" &&
            battle.round % 3 === 0 && (
              <span className="enemy-intent">Heavy strike</span>
            )}
          {unit.guard && <Shield size={12} />}
        </div>
        <Progress value={unit.hp} max={unit.maxHp} label={`${unit.name} HP`} />
        <small>
          {unit.hp}/{unit.maxHp} HP{!enemy && ` · ${unit.mp}/${unit.maxMp} MP`}
        </small>
        {impact?.units
          .filter((u) => u.id === unit.id)
          .map((u) => (
            <span
              key={`${impact.key}-${u.id}`}
              className={`battle-number ${u.amount > 0 ? "healing" : "damage"}`}
            >
              {u.amount > 0 ? "+" : ""}
              {u.amount}
            </span>
          ))}
        <div
          className={`sprite-area ${impact?.units.some((u) => u.id === unit.id && u.amount < 0) ? "hit" : ""}`}
          key={`${unit.id}-${unit.hp}`}
        >
          <BattleSprite unit={unit} />
        </div>
      </button>
    );
    return (
      <section className="jrpg-battle pixel-adventure polished-battle">
        <div className="battle-title">
          <div>
            <Tag tone="gold">ROUND {battle.round}</Tag>
            <h3>{encounter.name}</h3>
          </div>
          <span>
            {battle.phase === "player"
              ? `${actor.name}'s turn`
              : battle.phase === "won"
                ? "Victory"
                : battle.phase === "lost"
                  ? "Defeat"
                  : "Retreated"}
          </span>
        </div>
        <div className="turn-queue" aria-label="Turn order">
          <small>NEXT TURN</small>
          {[
            ...battle.party.slice(battle.actor),
            ...battle.enemies,
            ...battle.party.slice(0, battle.actor),
          ]
            .filter((u) => u.hp > 0)
            .map((u, i) => (
              <span
                key={u.id}
                className={i === 0 ? "next-actor" : ""}
                title={u.name}
              >
                <BattleSprite unit={u} portrait />
                <small>{u.name}</small>
              </span>
            ))}
        </div>
        <div
          className={`battlefield biome-${biome} ${impact ? "battle-impact" : ""}`}
        >
          {["forest", "ruins", "swamp"].includes(biome) && (
            <img
              className="battle-backdrop"
              src="/art/forest-battle.png"
              alt=""
            />
          )}
          <div className="battle-atmosphere" aria-hidden="true" />
          {impact && (
            <div className="battle-action-banner" key={impact.key}>
              {impact.name}
            </div>
          )}
          {!["forest", "ruins", "swamp"].includes(biome) && (
            <PixelScene biome={biome} />
          )}
          <div className="enemy-line">
            {battle.enemies.map((unit, i) => fighter(unit, i, true))}
          </div>
          <div className="party-line">
            {battle.party.map((unit, i) => fighter(unit, i, false))}
          </div>
          <div className="battle-party-hud">
            {battle.party.map((u, i) => (
              <button
                key={u.id}
                className={
                  i === battle.actor && battle.phase === "player"
                    ? "active"
                    : ""
                }
                onClick={() => setAllyTarget(i)}
                aria-label={`Select ally ${u.name}`}
              >
                <b>
                  {u.name}
                  {u.guard && <Shield size={12} />}
                </b>
                <span>
                  <small>HP</small>
                  {u.hp}
                  <i>/{u.maxHp}</i>
                </span>
                <Progress value={u.hp} max={u.maxHp} />
                <span>
                  <small>MP</small>
                  {u.mp}
                  <i>/{u.maxMp}</i>
                </span>
                <Progress value={u.mp} max={u.maxMp} />
              </button>
            ))}
          </div>
        </div>
        {battle.phase === "player" ? (
          <div className="battle-controls">
            <div className="turn-status">
              <b>{actor.name}</b>
              <span>
                {actor.mp} MP · Target: {battle.enemies[target]?.name}
              </span>
            </div>
            <div className="battle-actions">
              <button onClick={() => command({ kind: "attack", target })}>
                <Sword size={19} />
                Attack
              </button>
              <button onClick={() => command({ kind: "guard", target })}>
                <Shield size={19} />
                Guard<small>+3 MP</small>
              </button>
              {actor.abilities.map((skill) => (
                <button
                  key={skill.id}
                  title={COMBAT_EFFECTS[skill.type]?.description}
                  disabled={actor.mp < skill.cost}
                  onClick={() =>
                    command({
                      kind: "ability",
                      abilityId: skill.id,
                      target: skill.type === "heal" ? ally : target,
                    })
                  }
                >
                  <Sparkles size={18} />
                  {skill.name}
                  <small>{skill.cost} MP</small>
                </button>
              ))}
              <button
                disabled={!battle.items.potion}
                onClick={() => command({ kind: "potion", target: ally })}
              >
                <FlaskConical size={18} />
                Potion ×{battle.items.potion || 0}
                <small>Ally: {battle.party[ally]?.name}</small>
              </button>
              <button
                disabled={!battle.items.ether}
                onClick={() => command({ kind: "ether", target: ally })}
              >
                <FlaskConical size={18} />
                Ether ×{battle.items.ether || 0}
              </button>
              <button onClick={() => command({ kind: "flee", target: 0 })}>
                Retreat
              </button>
            </div>
            {actionError && <p role="alert">{actionError}</p>}
          </div>
        ) : (
          <div className="battle-result">
            <h2>
              {battle.phase === "won"
                ? "Victory"
                : battle.phase === "lost"
                  ? "Party defeated"
                  : "Retreated"}
            </h2>
            <p>
              {battle.phase === "won"
                ? `${encounter.gold} gold · ${Object.entries(encounter.loot)
                    .map(([id, n]) => `${n} ${RESOURCE_NAMES[id]}`)
                    .join(
                      " · ",
                    )}${encounter.recruit ? " · Companion recruitment unlocked" : ""}`
                : ""}
            </p>
            <div className="battle-result-actions">
              {battle.phase === "won" && (
                <button
                  className="button primary"
                  onClick={() => {
                    setImpact(null);
                    setEnemyTarget(0);
                    setAllyTarget(0);
                    update(continueAdventure(c));
                  }}
                >
                  {encounter.kind === "stage" &&
                  PLACES.find((p) => p.id === encounter.placeId)!.stages.some(
                    (id) => !data.cleared.includes(id) && id !== encounter.id,
                  )
                    ? "Continue adventure"
                    : "Continue exploring"}{" "}
                  <ArrowLeft size={16} className="continue-arrow" />
                </button>
              )}
              {battle.phase === "won" && !battle.claimed && (
                <button
                  className="button secondary"
                  onClick={() => update(claimVictory(c))}
                >
                  Claim rewards <Coins size={16} />
                </button>
              )}
              {battle.phase === "lost" && (
                <button
                  className="button primary"
                  onClick={() =>
                    update(startBattle(returnToMap(c), encounter.id))
                  }
                >
                  Retry battle
                </button>
              )}
              <button
                className="button secondary"
                onClick={() => update(returnToMap(c))}
              >
                Return to map <Map size={16} />
              </button>
            </div>
          </div>
        )}
        <details className="combat-log">
          <summary>Combat log</summary>
          <div role="log" aria-live="polite">
            {battle.log.slice(-8).map((line, i) => (
              <p key={`${battle.round}-${i}-${line}`}>{line}</p>
            ))}
          </div>
        </details>
      </section>
    );
  }
  const place = PLACES.find((p) => p.id === data.world?.expedition);
  if (place && data.world) {
    const area = placeProgress(data.world, place.id),
      cleared = placeCleared(data, place.id),
      nextStage = place.stages.find((id) => !data.cleared.includes(id));
    return (
      <section className="pixel-adventure expedition-view">
        <div className="expedition-heading">
          <div>
            <small>EXPEDITION</small>
            <h2>{place.name}</h2>
          </div>
          <button
            className="button secondary"
            onClick={() => update(returnToMap(c))}
          >
            <Map size={16} />
            Return to map
          </button>
        </div>
        <div className={`expedition-scene biome-${place.biome}`}>
          <PixelScene biome={place.biome} />
          {place.biome === "forest" && (
            <img src="/art/forest-battle.png" alt="Forest clearing" />
          )}
          <div className="expedition-position">
            <span>
              {place.stages.filter((id) => data.cleared.includes(id)).length}/
              {place.stages.length} stages
            </span>
            <span>{area.visits} explorations</span>
          </div>
        </div>
        <div className="expedition-event pixel-window">
          <h3>
            {area.last?.kind === "gather"
              ? "Gathering"
              : area.last?.kind === "cache"
                ? "Treasure found"
                : area.pendingBoss
                  ? "Roaming boss nearby"
                  : "Expedition"}
          </h3>
          <p>{area.last?.text || "The trail continues."}</p>
          {area.pendingBoss && (
            <p>
              Ambush chance:{" "}
              {Math.round(ambushChance(place.id, area.ignored) * 100)}%
            </p>
          )}
          <div className="expedition-actions">
            {area.pendingBoss && (
              <>
                <button
                  className="button primary"
                  onClick={() => update(challengeBoss(c, place.id))}
                >
                  Challenge boss
                </button>
                {!area.last?.declined && (
                  <button
                    className="button secondary"
                    onClick={() => update(declineBoss(c, place.id))}
                  >
                    Leave the boss
                  </button>
                )}
              </>
            )}
            {cleared ? (
              <button
                className="button primary"
                onClick={() => update(explore(c, place.id))}
              >
                Continue exploring
              </button>
            ) : (
              nextStage && (
                <button
                  className="button primary"
                  onClick={() => update(startBattle(c, nextStage))}
                >
                  Continue adventure
                </button>
              )
            )}
          </div>
          {cleared && !area.pendingBoss && (
            <small>
              Boss discovery chance:{" "}
              {Math.round(bossChance(place.id, area.sinceBoss) * 100)}%
            </small>
          )}
        </div>
      </section>
    );
  }
  return (
    <section className="pixel-adventure">
      <div className="jrpg-summary">
        <span>
          <Flag size={18} />
          {
            data.cleared.filter(
              (id) => ENCOUNTERS.find((e) => e.id === id)?.kind === "stage",
            ).length
          }
          /{PLACES.reduce((n, p) => n + p.stages.length, 0)} stages cleared
        </span>
        <span>
          <Coins size={18} />
          {data.gold} gold
        </span>
        <span>
          <Users size={18} />
          {data.party.length + 1}/3 party members
        </span>
      </div>
      <div className="tabs">
        <button
          className={tab === "map" ? "active" : ""}
          onClick={() => setTab("map")}
        >
          <Map size={15} />
          World map
        </button>
        <button
          className={tab === "requests" ? "active" : ""}
          onClick={() => setTab("requests")}
        >
          <Flag size={15} />
          Guild requests
        </button>
        <button
          className={tab === "party" ? "active" : ""}
          onClick={() => setTab("party")}
        >
          <Users size={15} />
          Party
        </button>
        <button
          className={tab === "equipment" ? "active" : ""}
          onClick={() => setTab("equipment")}
        >
          <Backpack size={15} />
          Equipment & shop
        </button>
        <button
          className={tab === "loadout" ? "active" : ""}
          onClick={() => setTab("loadout")}
        >
          <Sparkles size={15} />
          Skill loadout
        </button>
      </div>
      {(tab === "map" || tab === "requests") && (
        <WorldMap c={c} update={update} mode={tab} />
      )}
      {tab === "party" && (
        <>
          <div className="party-appearance-action">
            <h3>Companions</h3>
            <button
              className="button secondary"
              onClick={() => setAppearanceOpen(true)}
            >
              Character appearance
            </button>
          </div>
          {appearanceOpen && (
            <AppearancePicker
              value={c.appearance}
              classId={c.activeClass}
              onChoose={(id) => update(selectAppearance(c, id))}
              onClose={() => setAppearanceOpen(false)}
            />
          )}
          <div className="companion-grid">
            {COMPANIONS.map((npc) => {
              const recruited = data.roster.includes(npc.id),
                eligible = !npc.requires || data.cleared.includes(npc.requires),
                active = data.party.includes(npc.id);
              const unit = {
                id: npc.id,
                name: npc.name,
                sprite: npc.id,
                hp: 1,
                maxHp: 1,
                mp: 1,
                maxMp: 1,
                attack: 1,
                magic: 1,
                defense: 1,
                speed: 1,
                guard: false,
                abilities: [],
              };
              return (
                <article className="panel companion-card" key={npc.id}>
                  <BattleSprite unit={unit} />
                  <h3>{npc.name}</h3>
                  <Tag>{npc.role}</Tag>
                  <p>{npc.description}</p>
                  <small>
                    {npc.requires
                      ? `Recruit after ${npc.requires.replaceAll("-", " ")}`
                      : "Starting companion"}
                  </small>
                  <button
                    className="button primary full"
                    disabled={
                      (!recruited && !eligible) ||
                      (recruited && !active && data.party.length >= 2)
                    }
                    onClick={() => {
                      if (!recruited) {
                        change({ ...data, roster: [...data.roster, npc.id] });
                      } else
                        change({
                          ...data,
                          party: active
                            ? data.party.filter((id) => id !== npc.id)
                            : [...data.party, npc.id],
                        });
                    }}
                  >
                    {!recruited
                      ? eligible
                        ? "Recruit"
                        : "Locked"
                      : active
                        ? "Remove from party"
                        : data.party.length >= 2
                          ? "Party full"
                          : "Add to party"}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
      {tab === "equipment" && (
        <>
          <div className="combat-attribute-panel panel">
            <h3>Base and combat attributes</h3>
            <Tag>{CLASS_ROLES[c.activeClass]?.stance}</Tag>
            <div>
              {Object.entries(base).map(([a, value]) => (
                <span key={a}>
                  <small>{a}</small>
                  <b>
                    {value}{" "}
                    <ArrowLeft
                      size={11}
                      style={{ transform: "rotate(180deg)" }}
                    />{" "}
                    {combat[a as keyof typeof combat]}
                  </b>
                </span>
              ))}
            </div>
          </div>
          <WorldMap c={c} update={update} mode="shop" />
        </>
      )}
      {tab === "equipment" && c.relics.length > 0 && (
        <section className="panel">
          <h3>Keepsakes</h3>
          <div className="legacy-badges">
            {c.relics.map((id) => (
              <span key={id}>
                <Sparkles size={15} />
                {id === "mossfall-lantern"
                  ? "Mossfall Lantern"
                  : id.replaceAll("-", " ")}
              </span>
            ))}
          </div>
        </section>
      )}
      {tab === "loadout" && (
        <>
          <section className="panel signature-loadout">
            <span className="path-icon gold">
              <Icon name={currentPath(c).icon} />
            </span>
            <div>
              <span className="eyebrow">
                ACTIVE CLASS SIGNATURE · NO SLOT REQUIRED
              </span>
              <h3>{currentPath(c).signature.name}</h3>
              <p>{currentPath(c).signature.description}</p>
              <Tag>
                {COMBAT_EFFECTS[currentPath(c).signature.effect]?.mp} MP ·{" "}
                {currentPath(c).name}
                {classPower(currentPath(c)) > 1
                  ? ` · +${Math.round((classPower(currentPath(c)) - 1) * 100)}% potency`
                  : ""}
              </Tag>
            </div>
          </section>
          <div className="panel loadout-header">
            <h3>Equipped skills · {data.equippedSkills.length}/4</h3>
          </div>
          {!skills.length && (
            <div className="notice">No purchased combat skills</div>
          )}
          <div className="skill-grid">
            {skills.map((s) => (
              <section className="panel skill-card" key={s.id}>
                <Icon name={s.stat} size={25} />
                <h3>{s.name}</h3>
                <p>
                  +{s.cost >= 2 ? 2 : 1} combat {s.stat}
                  {s.combat ? ` · Action: ${s.name}` : ""}
                </p>
                <button
                  className="button primary"
                  disabled={
                    !data.equippedSkills.includes(s.id) &&
                    data.equippedSkills.length >= 4
                  }
                  onClick={() => update(toggleEquippedSkill(c, s.id))}
                >
                  {data.equippedSkills.includes(s.id) ? "Unequip" : "Equip"}
                </button>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
