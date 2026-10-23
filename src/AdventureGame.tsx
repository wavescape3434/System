import { CLASS_ROLES } from "./class-roles";
import { useState } from "react";
import {
  Sword,
  Shield,
  FlaskConical,
  Sparkles,
  Users,
  Backpack,
  Map,
  Coins,
  LockKeyhole,
  Check,
  Flag,
  ArrowLeft,
} from "lucide-react";
import type { Character } from "./domain";
import { stats, SKILLS, hasSkill } from "./domain";
import {
  campaign,
  REGIONS,
  ENCOUNTERS,
  COMPANIONS,
  EQUIPMENT,
  encounterAvailable,
  startBattle,
  combatAttributes,
  act,
  buy,
  equip,
  claimVictory,
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
    [region, setRegion] = useState("mossfall"),
    [enemyTarget, setEnemyTarget] = useState(0),
    [allyTarget, setAllyTarget] = useState(0),
    [actionError, setActionError] = useState("");
  const change = (next: Campaign) => update({ ...c, campaign: next });
  const battle = data.battle;
  const selectedRegion = REGIONS.find((r) => r.id === region)!;
  const command = (action: Action) => {
    if (!battle) return;
    const next = act(c, action);
    if (next === c) {
      setActionError("Select a living target and check MP or item stock.");
      return;
    }
    setActionError("");
    update(next);
  };
  const skills = SKILLS.filter(
    (s) => hasSkill(c, s) && !s.automatic && s.id !== "universal-root",
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
      biome = REGIONS.find((r) => r.id === encounter.region)!.biome;
    const fighter = (unit: Unit, index: number, enemy: boolean) => (
      <button
        className={`fighter ${unit.hp === 0 ? "down" : ""} ${enemy && index === target ? "targeted" : ""} ${!enemy && index === battle.actor ? "acting" : ""} ${!enemy && index === ally ? "ally-targeted" : ""}`}
        key={unit.id}
        onClick={() => (enemy ? setEnemyTarget(index) : setAllyTarget(index))}
        aria-label={`Target ${unit.name}, ${unit.hp} HP`}
      >
        <div className="fighter-label">
          <b>{unit.name}</b>
          {unit.guard && <Shield size={12} />}
        </div>
        <Progress value={unit.hp} max={unit.maxHp} label={`${unit.name} HP`} />
        <small>
          {unit.hp}/{unit.maxHp} HP{!enemy && ` · ${unit.mp}/${unit.maxMp} MP`}
        </small>
        <div className="sprite-area" key={`${unit.id}-${unit.hp}`}>
          <BattleSprite unit={unit} />
        </div>
      </button>
    );
    return (
      <section className="jrpg-battle">
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
        <div className={`battlefield biome-${biome}`}>
          <div className="battle-moon" />
          <div className="battle-hills" />
          <div className="enemy-line">
            {battle.enemies.map((unit, i) => fighter(unit, i, true))}
          </div>
          <div className="party-line">
            {battle.party.map((unit, i) => fighter(unit, i, false))}
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
            <p className="battle-help">
              Select enemies to target attacks; select allies to target healing
              or items. Enemies act after all living party members. Guard
              reduces incoming damage. Bosses use Heavy Strike every third
              round.
            </p>
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
                ? `${encounter.gold} gold · 1 potion · ${encounter.recruit ? "Companion recruitment unlocked · " : ""}No real-world XP or base stat changes.`
                : "No real-world progress was lost. Review equipment and skills, or train your classes before retrying."}
            </p>
            {battle.phase === "won" && !battle.claimed ? (
              <button
                className="button primary"
                onClick={() => update(claimVictory(c))}
              >
                Claim rewards <Coins size={16} />
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() => {
                  const next = { ...data };
                  delete next.battle;
                  change(next);
                }}
              >
                Return to map <Map size={16} />
              </button>
            )}
          </div>
        )}
        <details className="combat-log" open>
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
  return (
    <>
      <div className="jrpg-summary">
        <span>
          <Flag size={18} />
          {data.cleared.length}/{ENCOUNTERS.length} encounters cleared
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
      {tab === "map" && (
        <>
          <div className="region-list">
            {REGIONS.map((r, i) => (
              <button
                className={r.id === region ? "selected" : ""}
                key={r.id}
                onClick={() => setRegion(r.id)}
              >
                <small>REGION {i + 1}</small>
                <b>{r.name}</b>
                <span>
                  {data.cleared.filter((id) => id.startsWith(r.id)).length}/3
                  cleared
                </span>
              </button>
            ))}
          </div>
          <div className={`world-map biome-${selectedRegion.biome}`}>
            <div className="map-heading">
              <h2>{selectedRegion.name}</h2>
              <p>Approach → Patrol → Boss</p>
            </div>
            <svg viewBox="0 0 900 300" aria-hidden="true">
              <path
                d="M100 230Q250 0 450 160T790 90"
                fill="none"
                stroke="#ddd1a1"
                strokeWidth="3"
                strokeDasharray="9 9"
              />
              <path
                d="m0 280 160-230 170 220 90-130 130 140 140-225 200 220v100H0Z"
                fill="#163e31"
                opacity=".4"
              />
            </svg>
            <div className="encounter-nodes">
              {ENCOUNTERS.filter((e) => e.region === region).map((e, i) => {
                const unlocked = encounterAvailable(c, e.id),
                  cleared = data.cleared.includes(e.id);
                return (
                  <button
                    key={e.id}
                    className={`${unlocked ? "open" : "locked"} ${cleared ? "cleared" : ""}`}
                    disabled={!unlocked}
                    onClick={() => update(startBattle(c, e.id))}
                  >
                    <span>
                      {cleared ? (
                        <Check size={24} />
                      ) : !unlocked ? (
                        <LockKeyhole size={23} />
                      ) : i === 2 ? (
                        <Icon name="shield" size={26} />
                      ) : (
                        <Sword size={25} />
                      )}
                    </span>
                    <b>{i === 2 ? "Boss" : i === 0 ? "Approach" : "Patrol"}</b>
                    <small>
                      {e.enemies
                        .map((id) => id.replaceAll("-", " "))
                        .join(" + ")}
                    </small>
                    <Tag tone="gold">{e.gold} gold</Tag>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="helper">
            Clear encounters in order to unlock the next region. Replays earn
            combat gold and supplies. Your character and companions take
            individual turns; enemies act at the end of the party round.
          </p>
        </>
      )}
      {tab === "party" && (
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
      )}
      {tab === "equipment" && (
        <>
          <div className="combat-attribute-panel panel">
            <h3>Base and combat attributes</h3>
            <p>
              Class stance, equipped gear, and up to four equipped skills modify
              combat only. Subclass selection adds no modifier.
              <br />
              Current stance: {CLASS_ROLES[c.activeClass]?.stance}.
            </p>
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
          <div className="shop-grid">
            {EQUIPMENT.map((item) => (
              <article className="panel shop-item" key={item.id}>
                <Icon
                  name={
                    item.slot === "armor"
                      ? "shield"
                      : item.slot === "weapon"
                        ? "sword"
                        : "sparkles"
                  }
                  size={30}
                />
                <Tag tone="neutral">{item.slot}</Tag>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <button
                  className={`button full ${data.equipment.includes(item.id) ? "secondary" : "primary"}`}
                  disabled={
                    data.equipment.includes(item.id) ||
                    (!data.inventory[item.id] && data.gold < item.price)
                  }
                  onClick={() =>
                    update(
                      data.inventory[item.id]
                        ? equip(c, item.id)
                        : buy(c, item.id),
                    )
                  }
                >
                  {data.equipment.includes(item.id)
                    ? "Equipped"
                    : data.inventory[item.id]
                      ? "Equip"
                      : `Buy · ${item.price} gold`}
                </button>
              </article>
            ))}
            {["potion", "ether"].map((id) => (
              <article className="panel shop-item" key={id}>
                <FlaskConical size={30} />
                <h3>{id === "potion" ? "Potion" : "Ether"}</h3>
                <p>
                  {id === "potion"
                    ? "Restore 50 HP to a living ally."
                    : "Restore 20 MP to a living ally."}{" "}
                  Stock: {data.inventory[id] || 0}
                </p>
                <button
                  className="button primary full"
                  disabled={data.gold < (id === "potion" ? 20 : 25)}
                  onClick={() => update(buy(c, id))}
                >
                  Buy · {id === "potion" ? 20 : 25} gold
                </button>
              </article>
            ))}
          </div>
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
          <div className="panel loadout-header">
            <h3>Equipped skills · {data.equippedSkills.length}/4</h3>
            <p>
              Purchase skills in the skill trees, then equip them here. Equipped
              skills apply combat attribute modifiers; action skills also add a
              battle command.
            </p>
          </div>
          {!skills.length && (
            <div className="notice">
              No purchased skills yet. Complete objectives to earn skill shards,
              unlock tree sections through levels, and purchase nodes in Skills
              & Stats.
            </div>
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
                  onClick={() =>
                    change({
                      ...data,
                      equippedSkills: data.equippedSkills.includes(s.id)
                        ? data.equippedSkills.filter((id) => id !== s.id)
                        : [...data.equippedSkills, s.id],
                    })
                  }
                >
                  {data.equippedSkills.includes(s.id) ? "Unequip" : "Equip"}
                </button>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
