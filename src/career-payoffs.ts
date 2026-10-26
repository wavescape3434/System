import type { Character } from "./domain";
import { CAREER_CATEGORIES, careerCategory, VOCATIONS } from "./careers";
import { campaign, encounterEnemies } from "./rpg";
import { PLACES, TOWNS, WORLD_CONTRACTS } from "./world-catalog";
import { placeOpen } from "./world-state";
export const CAREER_UTILITIES = [
  {
    id: "ledger",
    name: "Quartermaster’s Ledger",
    skills: ["profession-business-0", "career-opening-business-0"],
    effect:
      "In Adventures, inspect supply stock, restocking commissions and reachable gathering routes in the current town.",
  },
  {
    id: "diagnostics",
    name: "Warden’s Diagnostics",
    skills: ["profession-technology-0", "career-opening-technology-0"],
    effect:
      "In Adventures, inspect the next stage’s enemy HP, attack, defense and known tactics before entering.",
  },
] as const;
export function careerUtilityForSkill(id: string) {
  return CAREER_UTILITIES.find((u) =>
    (u.skills as readonly string[]).includes(id),
  );
}
export function hasCareerUtility(c: Character, id: string) {
  return !!CAREER_UTILITIES.find((u) => u.id === id)?.skills.some((s) =>
    c.earnedSkills.includes(s),
  );
}
export function supplyLedger(c: Character) {
  if (!hasCareerUtility(c, "ledger")) return null;
  const data = campaign(c),
    world = data.world!,
    town = TOWNS.find((t) => t.id === world.townId)!;
  return {
    town: town.name,
    stock: world.stock[town.id],
    deliveries: WORLD_CONTRACTS.filter(
      (r) => r.town === town.id && r.restock,
    ).map((r) => ({
      ...r,
      routes: PLACES.filter(
        (p) =>
          placeOpen(data, p.id) &&
          (r.kind === "delivery"
            ? p.resources.includes(r.resource || "")
            : p.id === r.placeId),
      ).map((p) => p.name),
    })),
  };
}
export function stageDiagnostics(c: Character, placeId: string) {
  const data = campaign(c),
    place = PLACES.find((p) => p.id === placeId);
  if (
    !hasCareerUtility(c, "diagnostics") ||
    !place ||
    !placeOpen(data, placeId)
  )
    return null;
  const stage = place.stages.find((id) => !data.cleared.includes(id));
  return stage ? { stage, enemies: encounterEnemies(stage) } : null;
}
export function careerWork(c: Character) {
  return c.completions
    .filter((o) => o.scope === "profession" && o.result?.output?.trim())
    .map((o) => ({
      key: `${o.id}:${o.period}`,
      at: o.at,
      title: o.title,
      output: o.result!.output!,
      minutes: o.result?.minutes,
      count: o.result?.count,
      profession: o.profession || "Profession not recorded",
      category:
        o.careerCategory ||
        o.professionCredit?.category ||
        (o.profession ? careerCategory(o.profession).id : "general"),
      vocation: VOCATIONS.find(
        (v) => v.id === (o.vocationId || o.vocationCredit?.id),
      )?.name,
    }))
    .sort((a, b) => b.at.localeCompare(a.at) || a.key.localeCompare(b.key));
}
export function workRecordText(c: Character) {
  return [
    `${c.name} — Career work record`,
    "Self-reported work from completed requests. Credentials are listed separately.",
    "",
    ...careerWork(c).flatMap((o) => [
      `${o.at.slice(0, 10)} | ${o.profession}${o.vocation ? " → " + o.vocation : ""} | ${CAREER_CATEGORIES.find((g) => g.id === o.category)?.name || o.category}`,
      o.title,
      o.output,
      [
        o.minutes ? `${o.minutes} minutes` : "",
        o.count ? `${o.count} items` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      "",
    ]),
  ].join("\n");
}
