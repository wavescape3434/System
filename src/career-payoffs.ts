import type { Character } from "./domain";
import { CAREER_CATEGORIES, careerCategory, VOCATIONS } from "./careers";
import { campaign, encounterEnemies } from "./rpg";
import { PLACES, TOWNS, WORLD_CONTRACTS } from "./world-catalog";
import { placeOpen } from "./world-state";
export const CAREER_UTILITIES = [
  {
    id: "ledger",
    name: "Quartermaster’s Ledger",
    category: "business",
    learn: "Question Framing or Spreadsheet Craft: Primer",
    skills: ["profession-business-0", "career-opening-business-0"],
    effect:
      "In Adventures, inspect supply stock, restocking commissions and reachable gathering routes in the current town.",
  },
  {
    id: "diagnostics",
    name: "Warden’s Diagnostics",
    category: "technology",
    learn: "System Foundations or Command Line: Primer",
    skills: ["profession-technology-0", "career-opening-technology-0"],
    effect:
      "In Adventures, inspect the next stage’s enemy HP, attack, defense and known tactics before entering.",
  },
  {
    id: "docket",
    name: "Steward’s Docket",
    category: "management",
    learn: "Scope Charter or Work Breakdown: Primer",
    skills: ["profession-management-0", "career-opening-management-0"],
    effect:
      "In Adventures, review accepted guild commissions, remaining work and where to report each one.",
  },
  {
    id: "manifest",
    name: "Caravan Manifest",
    category: "logistics",
    learn: "Flow Mapping or Inventory Accuracy: Primer",
    skills: ["profession-logistics-0", "career-opening-logistics-0"],
    effect:
      "In Adventures, combine accepted delivery requirements, compare carried materials and find accessible supply routes.",
  },
  {
    id: "atlas",
    name: "Herbalist’s Atlas",
    category: "agriculture",
    learn: "Site Observation or Seasonal Planning: Primer",
    skills: ["profession-agriculture-0", "career-opening-agriculture-0"],
    effect:
      "In Adventures, find resources in accessible areas and see which routes are ready for repeat exploration.",
  },
  {
    id: "appraisal",
    name: "Artisan’s Appraisal",
    category: "trades",
    learn: "Tool Knowledge or Measurement: Primer",
    skills: ["profession-trades-0", "career-opening-trades-0"],
    effect:
      "In Adventures, compare current-town equipment with your loadout and check the gold and materials still needed.",
  },
  {
    id: "watch",
    name: "Sentinel’s Watch",
    category: "public-safety",
    learn: "Preparedness or Situation Reports: Primer",
    skills: ["profession-public-safety-0", "career-opening-public-safety-0"],
    effect:
      "In Adventures, review roaming-boss and ambush risks across cleared areas before another exploration.",
  },
  {
    id: "treasury",
    name: "Treasurer’s Plan",
    category: "finance",
    learn: "Ledger Foundations or Reconciliation: Primer",
    skills: ["profession-finance-0", "career-opening-finance-0"],
    effect:
      "In Adventures, plan a potion and ether purchase against live shop stock and your available gold.",
  },
  {
    id: "route-plan",
    name: "Pathwright’s Route Plan",
    category: "engineering",
    learn: "Design Requirements or Technical Drawing: Primer",
    skills: ["profession-engineering-0", "career-opening-engineering-0"],
    effect:
      "In Adventures, trace the stage prerequisites for a chosen area and open the next reachable route.",
  },
  {
    id: "field-record",
    name: "Naturalist’s Field Record",
    category: "science",
    learn: "Research Question or Literature Review: Primer",
    skills: ["profession-science-0", "career-opening-science-0"],
    effect:
      "In Adventures, review recorded exploration outcomes and confirmed defeats, then export a field report.",
  },
  {
    id: "triage",
    name: "Chirurgeon’s Triage",
    category: "healthcare",
    learn: "Care Foundations or Clear Handoffs: Primer",
    skills: ["profession-healthcare-0", "career-opening-healthcare-0"],
    effect:
      "In Adventures, compare party recovery needs with potion and ether effects before spending supplies.",
  },
  {
    id: "battle-primer",
    name: "Tutor’s Battle Primer",
    category: "education",
    learn: "Learning Objectives or Lesson Design: Primer",
    skills: ["profession-education-0", "career-opening-education-0"],
    effect:
      "In Adventures, prepare for the next stage using enemy patterns and your currently equipped party abilities.",
  },
  {
    id: "writ",
    name: "Guild Advocate’s Writ",
    category: "law",
    learn: "Source Hierarchy or Issue Spotting: Primer",
    skills: ["profession-law-0", "career-opening-law-0"],
    effect:
      "In Adventures, inspect commission terms, item costs, hunt credit and linked real-world request conditions.",
  },
  {
    id: "service-roster",
    name: "Companions’ Service Roster",
    category: "community",
    learn: "Needs Assessment or Active Listening: Primer",
    skills: ["profession-community-0", "career-opening-community-0"],
    effect:
      "In Adventures, review companion recruitment requirements and active-party coverage.",
  },
  {
    id: "folio",
    name: "Cartographer’s Folio",
    category: "creative",
    learn: "Creative Brief or Composition: Primer",
    skills: ["profession-creative-0", "career-opening-creative-0"],
    effect:
      "In Adventures, view a visual route folio with stage progress, exploration access and recorded landmarks.",
  },
  {
    id: "exchange",
    name: "Broker’s Exchange",
    category: "sales",
    learn: "Audience Research or Discovery Questions: Primer",
    skills: ["profession-sales-0", "career-opening-sales-0"],
    effect:
      "In Adventures, compare reachable towns’ delivery offers, gold per material and current shortages before taking a commission.",
  },
  {
    id: "register",
    name: "Archivist’s Register",
    category: "administration",
    learn: "Records & Accuracy or Calendar Planning: Primer",
    skills: ["profession-administration-0", "career-opening-administration-0"],
    effect:
      "In Adventures, reconcile and export adventure commission receipts by date and town, separately from other income.",
  },
  {
    id: "concierge",
    name: "Wayfarer’s Concierge",
    category: "hospitality",
    learn: "Service Standards or Guest Communication: Primer",
    skills: ["profession-hospitality-0", "career-opening-hospitality-0"],
    effect:
      "In Adventures, compare town stores, smiths and restocking requests, then visit an unlocked town’s shops.",
  },
  {
    id: "work-order",
    name: "Forge Work Order",
    category: "manufacturing",
    learn: "Process Steps or Measurement Records: Primer",
    skills: ["profession-manufacturing-0", "career-opening-manufacturing-0"],
    effect:
      "In Adventures, plan several current-town crafts against a combined gold and material bill before visiting the blacksmith.",
  },
  {
    id: "departure",
    name: "Adventurer’s Departure Check",
    category: "general",
    learn: "Goal Charter or Learning Log: Primer",
    skills: ["profession-general-0", "career-opening-general-0"],
    effect:
      "In Adventures, review a route, current party reserves, equipped-skill count and accepted local commissions before departing.",
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
