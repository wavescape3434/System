import {
  createCharacter,
  EMPTY_BASELINE,
  CLASSES,
  stats,
  totalXP,
} from "./domain";
import type { Stats } from "./domain";
import { EMPTY_ASSESSMENT } from "./metrics";
import { SKILLS } from "./skill-catalog";
import { PLACES, ELITE_HUNTS } from "./world-catalog";
import {
  campaign,
  startBattle,
  act,
  claimVictory,
  takeAction,
  adventureParty,
} from "./rpg";
import type { Action } from "./rpg";
import { chargedAttack } from "./enemy-tactics";
import { SUPPLIES, SUPPLY_IDS, supplyPower } from "./supplies";
import { xpForLevel } from "./progression";
import { validateCharacter } from "./storage";
export interface HuntProbe {
  classId: string;
  base: number;
  region: string;
  grade: number;
  style: "attack" | "tactical";
  party: "solo" | "mira" | "trio";
  supplies: boolean;
  playerLevel: number;
  learned?: boolean;
  focused?: boolean;
}
export function simulateHunt(o: HuntProbe) {
  let c = createCharacter(
    "Hunt fixture",
    { ...EMPTY_BASELINE, assessment: { ...EMPTY_ASSESSMENT } },
    o.classId,
    "Explorer",
  );
  const cls = CLASSES.find((p) => p.id === o.classId)!;
  c.baseStats = Object.fromEntries(
    Object.keys(c.baseStats).map((s) => [
      s,
      o.focused ? (s === cls.stat ? o.base : s === "CON" ? 30 : 10) : o.base,
    ]),
  ) as Stats;
  c.legacyProgress = {
    adventurerXP: xpForLevel(o.playerLevel, 250),
    classes: {},
    professions: {},
    stats: {},
    skillPoints: {},
  };
  c.campaign = campaign(c);
  c.campaign.cleared = PLACES.flatMap((p) => p.stages);
  c.campaign.roster = ["mira", "orin"];
  c.campaign.party =
    o.party === "trio" ? ["mira", "orin"] : o.party === "mira" ? ["mira"] : [];
  // Explicit synthetic loadout/stock; these fixtures do not simulate acquiring skills or supplies.
  if (o.learned) {
    const chosen = SKILLS.filter(
      (s) =>
        !s.nonCombat &&
        !s.automatic &&
        s.combat &&
        (s.archetype
          ? cls.mix[s.archetype as keyof typeof cls.mix]
          : s.category === "universal") &&
        (!s.combatRank || s.combatRank === 1),
    );
    const select = [
      chosen.find((s) =>
        ["fire", "power", "pierce", "quick", "area", "flurry"].includes(
          s.combat!,
        ),
      ),
      chosen.find((s) => ["ward", "bulwark"].includes(s.combat!)),
      chosen.find((s) =>
        ["heal", "heal-self", "regeneration"].includes(s.combat!),
      ),
      chosen.find((s) => s.combat === "burn"),
    ].filter((s): s is (typeof SKILLS)[number] => !!s);
    c.earnedSkills = [
      ...new Set([...c.earnedSkills, ...select.map((s) => s.id)]),
    ];
    c.campaign.equippedSkills = [...new Set(select.map((s) => s.id))];
  }
  for (const id of SUPPLY_IDS)
    c.campaign.inventory[id] = o.supplies
      ? id.startsWith("royal")
        ? 4
        : 2
      : 0;
  const hunt = ELITE_HUNTS.find(
    (h) => h.region === o.region && h.huntGrade === o.grade,
  )!;
  const base = stats(c),
    xp = totalXP(c),
    gold = c.campaign.gold,
    before = { ...c.campaign.inventory };
  c = startBattle(c, hunt.id);
  if (!campaign(c).battle) throw Error("Hunt did not start");
  const opening = adventureParty(c).map((u) => ({
    id: u.id,
    hp: u.maxHp,
    mp: u.maxMp,
    attack: u.attack,
    magic: u.magic,
  }));
  let steps = 0,
    guards = 0,
    abilities = 0;
  const usedScans = new Set<string>();
  while (campaign(c).battle!.phase === "player" && steps++ < 160) {
    const b = campaign(c).battle!,
      actor = b.party[b.actor],
      living = b.party.filter((u) => u.hp > 0),
      low = [...living].sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp)[0],
      target = b.enemies.findIndex((e) => e.hp > 0);
    let action: Action = { kind: "attack", target };
    if (o.style === "tactical") {
      const known = actor.abilities.filter((a) => a.cost <= actor.mp),
        ward = known.find((a) => ["ward", "bulwark"].includes(a.type)),
        heal = known.find(
          (a) =>
            ["heal", "heal-all", "regeneration"].includes(a.type) ||
            (a.type === "heal-self" && actor.id === low.id),
        ),
        offense = known.find((a) =>
          [
            "fire",
            "power",
            "pierce",
            "quick",
            "area",
            "flurry",
            "hybrid",
            "coordinated",
            "burn",
          ].includes(a.type),
        ),
        buff = known.find((a) => ["rally", "formation"].includes(a.type)),
        scan = known.find((a) => a.type === "scan"),
        charged = b.enemies.some((e) => e.hp > 0 && chargedAttack(e, b.round));
      const pick = (resource: "hp" | "mp", u: typeof actor) =>
        SUPPLY_IDS.filter(
          (id) => SUPPLIES[id].resource === resource && b.items[id] > 0,
        ).sort(
          (a, z) =>
            Math.abs(
              supplyPower(u, a) -
                ((resource === "hp" ? u.maxHp : u.maxMp) - u[resource]),
            ) -
            Math.abs(
              supplyPower(u, z) -
                ((resource === "hp" ? u.maxHp : u.maxMp) - u[resource]),
            ),
        )[0];
      const offensiveChoices = known.filter((a) =>
        [
          "fire",
          "power",
          "pierce",
          "quick",
          "area",
          "flurry",
          "hybrid",
          "coordinated",
          "burn",
        ].includes(a.type),
      );
      const bestOffense = offensiveChoices
        .map((a) => {
          const projected = takeAction(b, {
            kind: "ability",
            abilityId: a.id,
            target,
          });
          const damage = b.enemies.reduce(
            (n, e, i) => n + e.hp - projected.enemies[i].hp,
            0,
          );
          return { a, score: damage / (1 + a.cost * 0.04) };
        })
        .sort((a, z) => z.score - a.score)[0]?.a;
      const hpItem = pick("hp", low),
        mpItem = pick("mp", actor);
      if (low.hp / low.maxHp < 0.35 && hpItem)
        action = { kind: hpItem, target: b.party.indexOf(low) };
      else if (charged)
        action = ward
          ? { kind: "ability", abilityId: ward.id, target }
          : { kind: "guard", target };
      else if (low.hp / low.maxHp < 0.6 && heal)
        action = {
          kind: "ability",
          abilityId: heal.id,
          target: b.party.indexOf(low),
        };
      else if (scan && !usedScans.has(b.enemies[target].id)) {
        usedScans.add(b.enemies[target].id);
        action = { kind: "ability", abilityId: scan.id, target };
      } else if (buff && b.round === 1)
        action = { kind: "ability", abilityId: buff.id, target };
      else if (bestOffense || offense)
        action = {
          kind: "ability",
          abilityId: (bestOffense || offense)!.id,
          target,
        };
      else if (actor.mp < 5 && mpItem)
        action = { kind: mpItem, target: b.actor };
    }
    if (action.kind === "guard") guards++;
    if (action.kind === "ability") abilities++;
    const next = act(c, action);
    if (next === c) throw Error("No-effect hunt action");
    c = next;
  }
  const b = campaign(c).battle!,
    phase = b.phase;
  if (phase === "won") c = claimVictory(c);
  if (totalXP(c) !== xp || JSON.stringify(stats(c)) !== JSON.stringify(base))
    throw Error("Hunt awarded real progression");
  if (!validateCharacter(JSON.parse(JSON.stringify(c))))
    throw Error("Invalid hunt save");
  if (campaign(c).gold !== gold + (phase === "won" ? hunt.gold : 0))
    throw Error("Incorrect hunt payout");
  return {
    options: o,
    phase,
    rounds: b.round,
    actions: Math.min(steps, 160),
    guards,
    abilities,
    gold: campaign(c).gold - gold,
    opening,
    remaining: b.party.map((u) => ({ id: u.id, hp: u.hp, mp: u.mp })),
    itemsUsed: Object.fromEntries(
      SUPPLY_IDS.map((id) => [
        id,
        (before[id] || 0) - (campaign(c).inventory[id] || 0),
      ]),
    ),
    loadout: c.campaign!.equippedSkills,
    realXp: totalXP(c),
    baseStats: stats(c),
  };
}
