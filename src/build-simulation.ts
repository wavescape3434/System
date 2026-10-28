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
import { PLACES, WORLD_ENCOUNTERS } from "./world-catalog";
import { campaign, startBattle, act, claimVictory, takeAction } from "./rpg";
import type { Action } from "./rpg";
import { chargedAttack } from "./enemy-tactics";
import { validateCharacter } from "./storage";
import { xpForLevel } from "./progression";

export interface BuildProbe {
  classId: string;
  focus: number;
  encounter: string;
  loadout:
    | "signature"
    | "shared"
    | "focus"
    | "sword"
    | "spear"
    | "axe"
    | "unarmed"
    | "fire"
    | "ice"
    | "storm";
  party: "solo" | "trio";
}
export function simulateBuild(o: BuildProbe) {
  let c = createCharacter(
    "Build fixture",
    { ...EMPTY_BASELINE, assessment: { ...EMPTY_ASSESSMENT } },
    o.classId,
    "Explorer",
  );
  const cls = CLASSES.find((p) => p.id === o.classId)!;
  // Promotion gates are deliberately outside this combat-only fixture. createCharacter
  // permits starting classes only, so explicitly select the inspected earned-class snapshot.
  c.activeClass = cls.id;
  c.unlockedClasses = [cls.id];
  const primary = Object.entries(cls.mix).sort((a, b) => b[1]! - a[1]!)[0][0];
  c.baseStats = Object.fromEntries(
    Object.keys(c.baseStats).map((s) => [
      s,
      s === cls.stat ? o.focus : s === "CON" ? 30 : 10,
    ]),
  ) as Stats;
  c.legacyProgress = {
    adventurerXP: xpForLevel(10, 250),
    classes: {},
    professions: {},
    stats: {},
    skillPoints: {},
  };
  c.campaign = campaign(c);
  c.campaign.cleared = PLACES.flatMap((p) => p.stages);
  c.campaign.roster = ["mira", "orin"];
  c.campaign.party = o.party === "trio" ? ["mira", "orin"] : [];
  c.campaign.inventory.potion = c.campaign.inventory.ether = 0;
  const shared = [1, 2, 3, 6].map((n) => `arc-${primary}-${n}`);
  const ids =
    o.loadout === "signature"
      ? []
      : o.loadout === "shared"
        ? shared
        : o.loadout === "focus"
          ? [`focus-${cls.id}-3`, ...shared.slice(0, 3)]
          : ["fire", "ice", "storm"].includes(o.loadout)
            ? [
                `element-${o.loadout}-2`,
                "arc-mage-4",
                "arc-mage-5",
                "arc-mage-6",
              ]
            : [1, 2, 3, 4].map((n) => `martial-${o.loadout}-${n}`);
  if (ids.some((id) => !SKILLS.some((s) => s.id === id)))
    throw Error(`Missing probe skill: ${o.loadout}`);
  c.earnedSkills = [...new Set([...c.earnedSkills, ...ids])];
  c.campaign.equippedSkills = ids;
  const beforeStats = stats(c),
    xp = totalXP(c),
    gold = c.campaign.gold;
  c = startBattle(c, o.encounter);
  if (!c.campaign?.battle) throw Error(`Probe inaccessible: ${o.encounter}`);
  if (c.campaign.battle.party[0].abilities[0].id !== `signature-${cls.id}`)
    throw Error("Wrong class signature in build fixture");
  const opening = c.campaign.battle.party.map((u) => ({
    id: u.id,
    hp: u.hp,
    mp: u.mp,
    attack: u.attack,
    magic: u.magic,
    defense: u.defense,
  }));
  const used = new Set<string>(),
    commands: Record<string, number> = {};
  let steps = 0;
  while (c.campaign!.battle!.phase === "player" && steps < 180) {
    const b = c.campaign!.battle!,
      actor = b.party[b.actor];
    const living = b.party.filter((u) => u.hp > 0);
    const low = [...living].sort((a, z) => a.hp / a.maxHp - z.hp / z.maxHp)[0];
    const target = b.enemies.findIndex((e) => e.hp > 0);
    const known = actor.abilities.filter((a) => a.cost <= actor.mp);
    const healing = known.find(
      (a) =>
        ["heal", "heal-all"].includes(a.type) ||
        (a.type === "heal-self" && low.id === actor.id),
    );
    const ward = known.find((a) =>
      ["ward", "guard", "bulwark"].includes(a.type),
    );
    const buff = known.find(
      (a) =>
        ["rally", "formation"].includes(a.type) &&
        !used.has(`${actor.id}:${a.id}`),
    );
    const scan = known.find(
      (a) =>
        a.type === "scan" &&
        !used.has(`${actor.id}:${b.enemies[target].id}:scan`),
    );
    const focus = known.find((a) => ["focus", "focus-all"].includes(a.type));
    let action: Action = { kind: "attack", target };
    if (low.hp / low.maxHp < 0.55 && healing)
      action = {
        kind: "ability",
        abilityId: healing.id,
        target: healing.type === "heal" ? b.party.indexOf(low) : target,
      };
    else if (b.enemies.some((e) => e.hp > 0 && chargedAttack(e, b.round)))
      action = ward
        ? { kind: "ability", abilityId: ward.id, target }
        : { kind: "guard", target };
    else if (buff) {
      action = { kind: "ability", abilityId: buff.id, target };
      used.add(`${actor.id}:${buff.id}`);
    } else if (scan && b.enemies[target].defense > 0) {
      action = { kind: "ability", abilityId: scan.id, target };
      used.add(`${actor.id}:${b.enemies[target].id}:scan`);
    } else if (actor.mp / actor.maxMp < 0.25 && focus)
      action = { kind: "ability", abilityId: focus.id, target };
    else {
      const choices: Action[] = [
        action,
        ...known
          .filter((a) =>
            [
              "power",
              "quick",
              "fire",
              "area",
              "pierce",
              "flurry",
              "bash",
              "hybrid",
              "coordinated",
              "burn",
              "ice",
              "storm",
            ].includes(a.type),
          )
          .map((a) => ({ kind: "ability" as const, abilityId: a.id, target })),
      ];
      action = choices
        .map((a) => {
          const next = takeAction(b, a);
          const output = b.enemies.reduce(
            (n, e, i) => n + e.hp - next.enemies[i].hp,
            0,
          );
          const burn = b.enemies.reduce(
            (n, e, i) =>
              n +
              (next.enemies[i].hp > 0
                ? Math.max(
                    0,
                    (next.enemies[i].burnDamage || 0) - (e.burnDamage || 0),
                  ) * 2
                : 0),
            0,
          );
          const protection = next.enemies.some(
            (e, i) => e.chill && !b.enemies[i].chill,
          )
            ? 12
            : 0;
          const cost = a.abilityId
            ? known.find((s) => s.id === a.abilityId)!.cost
            : 0;
          return { a, score: (output + burn + protection) / (1 + cost * 0.04) };
        })
        .sort((a, z) => z.score - a.score)[0].a;
    }
    const next = act(c, action);
    if (next === c)
      throw Error(
        `Invalid probe action: ${JSON.stringify({ o, action, actor: actor.id, round: b.round })}`,
      );
    const key = action.abilityId || action.kind;
    commands[key] = (commands[key] || 0) + 1;
    c = next;
    steps++;
  }
  const b = c.campaign!.battle!,
    phase = b.phase;
  if (phase === "won") c = claimVictory(c);
  if (
    totalXP(c) !== xp ||
    JSON.stringify(stats(c)) !== JSON.stringify(beforeStats)
  )
    throw Error("Combat progression leak");
  if (!validateCharacter(JSON.parse(JSON.stringify(c))))
    throw Error("Invalid build save");
  const reward = WORLD_ENCOUNTERS.find((e) => e.id === o.encounter)!.gold;
  if (campaign(c).gold !== gold + (phase === "won" ? reward : 0))
    throw Error("Payout mismatch");
  return {
    options: o,
    phase,
    actions: steps,
    rounds: b.round,
    opening,
    commands,
    loadout: campaign(c).equippedSkills,
    remaining: b.party.map((u) => ({ id: u.id, hp: u.hp, mp: u.mp })),
  };
}
