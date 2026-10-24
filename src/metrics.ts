import { mentalForm, formScore, validMentalFormId } from "./exam-bank";
import type { MentalResult } from "./exam-bank";
import type { Attribute, Baseline, Stats } from "./domain";
export type ReferenceSex = "male" | "female" | "unspecified";
export interface Assessment {
  version: 2;
  age: number | null;
  sex: ReferenceSex;
  strengthTest: "pushups" | "chair" | "weighted" | "grip";
  pushupStyle: "floor" | "knee" | "incline" | "wall";
  pushups: number | null;
  chairStands: number | null;
  balanceSeconds: number | null;
  walkMetres: number | null;
  heightCm: number | null;
  massKg: number | null;
  liftKg: number | null;
  liftReps: number | null;
  pullups: number | null;
  gripKg?: number | null;
  chairAssisted?: boolean;
  mental?: Partial<Record<"INT" | "WIS" | "CHA", MentalResult>>;
}
export const EMPTY_ASSESSMENT: Assessment = {
  version: 2,
  age: null,
  sex: "unspecified",
  strengthTest: "pushups",
  pushupStyle: "floor",
  pushups: null,
  chairStands: null,
  balanceSeconds: null,
  walkMetres: null,
  heightCm: null,
  massKg: null,
  liftKg: null,
  liftReps: null,
  pullups: null,
};
export interface MetricResult {
  stat: Attribute;
  value: number;
  measured: boolean;
  raw: string;
  reference: string;
  evidence: "published" | "provisional";
  source?: string;
}
export const METRIC_SOURCES = [
  {
    id: "chair-young",
    title: "Lein et al. (2022): 30-second chair stand in healthy young adults",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9340829/",
    note: "81 campus volunteers aged 18–35; pooled mean 33.0 repetitions (SD 5.4). A convenience sample, not a national average. 45 cm chair, arms crossed, mean of two trials.",
  },
  {
    id: "walk-general",
    title:
      "Cazzoletti et al. (2022): Six-minute walk, general population reference",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8985335/",
    note: "530 healthy Italian adults. Younger-adult equation uses age, sex, height and mass with the cohort average activity term. Sample-specific prediction, not a universal norm.",
  },
  {
    id: "chair-cdc",
    title: "CDC STEADI: 30-second chair stand",
    url: "https://www.cdc.gov/steadi/media/pdfs/STEADI-Assessment-30Sec-508.pdf",
    note: "Age/sex lower cutoffs for adults 60–94 identify below-average performance; these cutoffs are not means and are not scored as average 10.",
  },
  {
    id: "enright",
    title: "Enright & Sherrill (1998): Six-minute walk reference equations",
    url: "https://pubmed.ncbi.nlm.nih.gov/9817683/",
    note: "117 men and 173 women aged 40–80. Predictions use age, sex, height and mass; do not extrapolate outside that range.",
  },
  {
    id: "springer",
    title: "Springer et al. (2007): Unipedal stance, eyes open and closed",
    url: "https://doi.org/10.1519/00139143-200704000-00003",
    note: "Age-group balance references. A one-leg stand measures static balance, not every aspect of dexterity.",
  },
  {
    id: "mayo",
    title: "Mayo Clinic: Fitness assessment protocols",
    url: "https://www.mayoclinic.org/healthy-lifestyle/fitness/in-depth/fitness/art-20046433",
    note: "Good-fitness targets are not population averages.",
  },
  {
    id: "cdc",
    title: "CDC: Adult physical activity recommendations",
    url: "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
    note: "150 minutes of moderate activity weekly and muscle-strengthening activity at least two days weekly.",
  },
  {
    id: "who",
    title: "WHO guidelines on physical activity and sedentary behaviour",
    url: "https://www.who.int/publications/i/item/9789240015128",
    note: "Build activity gradually; greater task volume is not automatically a better training prescription.",
  },
  {
    id: "learning",
    title: "Dunlosky et al. (2013): Effective learning techniques",
    url: "https://doi.org/10.1177/1529100612453266",
    note: "Practice testing and distributed practice support learning better than passive rereading alone.",
  },
  {
    id: "grip",
    title: "Dodds et al. (2014): Grip strength across the life course",
    url: "https://doi.org/10.1371/journal.pone.0113637",
    note: "British normative grip data; requires a dynamometer and cannot calibrate a squat or push-up count.",
  },
];
// This function has no upper clamp. Reference ratios describe game indexes, not physical units.
export const referenceIndex = (observed: number, reference: number) =>
  Math.max(
    1,
    Math.round((10 * Math.max(0, observed)) / Math.max(0.01, reference)),
  );
// Table 2 means, Dodds et al. (2014), CC BY. Interpolation between published
// five-year ages is a game approximation, not an additional published norm.
const GRIP_MEANS: Record<"male" | "female", [number, number][]> = {
  male: [
    [20, 41.5],
    [25, 48.8],
    [30, 51.6],
    [35, 51.6],
    [40, 50.3],
    [45, 48.8],
    [50, 47.6],
    [55, 46.2],
    [60, 44.6],
    [65, 42.3],
    [70, 39.1],
    [75, 35.6],
    [80, 32.2],
    [85, 28.5],
    [90, 24.7],
  ],
  female: [
    [20, 28.4],
    [25, 30.6],
    [30, 31.4],
    [35, 31.3],
    [40, 30.7],
    [45, 29.9],
    [50, 28.7],
    [55, 27.5],
    [60, 26.5],
    [65, 25.3],
    [70, 23.5],
    [75, 21.4],
    [80, 19.1],
    [85, 16.6],
    [90, 14.2],
  ],
};
export function gripReference(a: Assessment): number | null {
  if (a.age === null || a.age < 20 || a.age > 90 || a.sex === "unspecified")
    return null;
  const rows = GRIP_MEANS[a.sex];
  const upper = rows.findIndex(([age]) => age >= a.age!);
  if (upper === 0) return rows[0][1];
  const [loAge, lo] = rows[upper - 1],
    [hiAge, hi] = rows[upper];
  return lo + ((hi - lo) * (a.age - loAge)) / (hiAge - loAge);
}
export function predictedWalk(a: Assessment): number | null {
  if (a.age === null || !a.heightCm || !a.massKg || a.sex === "unspecified")
    return null;
  // Younger adults: published equivalent uncentered equations, Table 5.
  // Use the sample's sex-specific proportion active to estimate its mean,
  // rather than assuming every user is sedentary or already well trained.
  if (a.age >= 22 && a.age < 40) {
    const male = a.sex === "male";
    if (
      a.heightCm < (male ? 156 : 146) ||
      a.heightCm > (male ? 192 : 186) ||
      a.massKg < (male ? 57 : 41) ||
      a.massKg > (male ? 107 : 106)
    )
      return null;
    return male
      ? 26.8 * a.age +
          8.46 * a.heightCm -
          0.45 * a.massKg -
          2.54 * 0.461 -
          0.06 * a.age ** 2 -
          0.13 * a.age * a.heightCm -
          890.18
      : 8.1 * a.age +
          1.61 * a.heightCm -
          0.99 * a.massKg +
          22.58 * 0.415 -
          0.1 * a.age ** 2 +
          222.55;
  }
  if (
    a.age < 40 ||
    a.age > 80 ||
    a.heightCm < 140 ||
    a.heightCm > 200 ||
    a.massKg < 40 ||
    a.massKg > 150
  )
    return null;
  const result =
    a.sex === "male"
      ? 7.57 * a.heightCm - 5.02 * a.age - 1.76 * a.massKg - 309
      : 2.11 * a.heightCm - 2.29 * a.massKg - 5.78 * a.age + 667;
  return result > 0 ? result : null;
}
export const MIND_CHECKS = {
  INT: mentalForm("INT"),
  WIS: mentalForm("WIS"),
  CHA: mentalForm("CHA"),
};
const LEGACY_ANSWERS = {
  INT: [1, 2, 0, 3, 1],
  WIS: [2, 0, 1, 3, 1],
  CHA: [1, 2, 0, 3, 2],
};
export function checkScore(
  stat: "INT" | "WIS" | "CHA",
  answers: number[],
  formId?: string,
) {
  return formId
    ? formScore(mentalForm(stat, formId), answers)
    : LEGACY_ANSWERS[stat].reduce(
        (n, a, i) => n + (answers[i] === a ? 1 : 0),
        0,
      );
}
export function assessmentResults(a: Assessment): MetricResult[] {
  const results: MetricResult[] = [];
  const add = (
    stat: Attribute,
    observed: number | null,
    ref: number,
    raw: string,
    reference: string,
    evidence: "published" | "provisional" = "provisional",
    source?: string,
  ) =>
    results.push({
      stat,
      value: observed === null ? 10 : referenceIndex(observed, ref),
      measured: observed !== null,
      raw: observed === null ? "Not assessed" : raw,
      reference,
      evidence,
      source,
    });
  // Provisional anchors remain explicitly labelled until the primary norm tables are verified.
  if (a.strengthTest === "grip") {
    const ref = gripReference(a);
    add(
      "STR",
      a.gripKg ?? null,
      ref || 40,
      `${a.gripKg} kg · maximum grip`,
      ref
        ? `${ref.toFixed(1)} kg · age/sex mean (British cohorts; interpolated between table ages)`
        : "40 kg · provisional reference; age/sex norm unavailable",
      ref ? "published" : "provisional",
      ref ? "grip" : undefined,
    );
  } else if (a.strengthTest === "weighted") {
    const estimate =
      a.liftKg !== null &&
      a.liftReps !== null &&
      a.liftReps >= 4 &&
      a.liftReps <= 10 &&
      a.massKg
        ? a.liftKg / (1.0278 - 0.0278 * a.liftReps) / a.massKg
        : null;
    add(
      "STR",
      estimate,
      0.75,
      estimate === null
        ? ""
        : `${estimate.toFixed(2)} × body mass estimated bench press`,
      "0.75 × body mass · provisional training reference",
    );
  } else if (a.strengthTest === "chair") {
    const published =
      a.age !== null && a.age >= 18 && a.age <= 35 && !a.chairAssisted;
    add(
      "STR",
      a.chairStands,
      published ? 33 : 15,
      `${a.chairStands} stands / 30 s${a.chairAssisted ? " · assisted" : ""}`,
      published
        ? "33 stands · age 18–35 sample mean; sexes pooled"
        : "15 stands · provisional reference; no matched mean",
      published ? "published" : "provisional",
      published ? "chair-young" : undefined,
    );
  } else
    add(
      "STR",
      a.pushups,
      a.pushupStyle === "floor"
        ? 20
        : a.pushupStyle === "knee"
          ? 15
          : a.pushupStyle === "incline"
            ? 15
            : 20,
      `${a.pushups} ${a.pushupStyle} pushups`,
      "Protocol-specific provisional reference; variants are not treated as equivalent",
    );
  add(
    "DEX",
    a.balanceSeconds,
    30,
    `${a.balanceSeconds} s · one-leg stand`,
    "30 s · provisional balance reference",
  );
  const prediction = predictedWalk(a);
  add(
    "CON",
    a.walkMetres,
    prediction || 550,
    `${a.walkMetres} m / 6 min`,
    prediction
      ? `${Math.round(prediction)} m · age/sex/height/mass prediction`
      : "550 m · provisional adult reference",
    prediction ? "published" : "provisional",
    prediction ? (a.age! < 40 ? "walk-general" : "enright") : undefined,
  );
  for (const stat of ["INT", "WIS", "CHA"] as const) {
    const check = a.mental?.[stat];
    const score = check ? checkScore(stat, check.answers, check.formId) : null;
    add(
      stat,
      score,
      3,
      score === null ? "" : `${score}/5 · ${MIND_CHECKS[stat].name}`,
      "3/5 · provisional game reference; not a population or clinical score",
    );
  }
  return results;
}
export const assessedStats = (a: Assessment): Stats =>
  Object.fromEntries(
    assessmentResults(a).map((r) => [r.stat, r.value]),
  ) as Stats;
export const hasNewAssessment = (b: Baseline) => b.assessment?.version === 2;
export function assessmentErrors(a: Assessment): string[] {
  const errors: string[] = [];
  if (a.age !== null && (a.age < 18 || a.age > 100))
    errors.push("Adult reference age: 18–100 years");
  if (
    a.strengthTest === "weighted" &&
    a.liftReps !== null &&
    (a.liftReps < 4 || a.liftReps > 10)
  )
    errors.push("Use a recent set of 4–10 repetitions for the bench estimate");
  if (a.balanceSeconds !== null && a.balanceSeconds > 45)
    errors.push("The balance protocol stops at 45 seconds");
  if (a.massKg !== null && a.massKg <= 0)
    errors.push("Body mass must be greater than zero");
  if (a.heightCm !== null && a.heightCm <= 0)
    errors.push("Height must be greater than zero");
  if (
    a.strengthTest === "weighted" &&
    a.liftKg !== null &&
    a.liftReps !== null &&
    !a.massKg
  )
    errors.push("Enter body mass for the bench estimate");
  for (const key of ["age", "pushups", "pullups", "liftReps"] as const)
    if (a[key] !== null && !Number.isInteger(a[key]))
      errors.push(
        `${key === "age" ? "Age" : "Repetition counts"} must be a whole number`,
      );
  return [...new Set(errors)];
}
export function validAssessment(input: unknown): input is Assessment {
  if (!input || typeof input !== "object") return false;
  const a = input as Assessment;
  return (
    a.version === 2 &&
    ["male", "female", "unspecified"].includes(a.sex) &&
    ["pushups", "chair", "weighted", "grip"].includes(a.strengthTest) &&
    ["floor", "knee", "incline", "wall"].includes(a.pushupStyle) &&
    [
      "age",
      "pushups",
      "chairStands",
      "balanceSeconds",
      "walkMetres",
      "heightCm",
      "massKg",
      "liftKg",
      "liftReps",
      "pullups",
    ].every((key) => {
      const n = a[key as keyof Assessment];
      return (
        n === null || (typeof n === "number" && Number.isFinite(n) && n >= 0)
      );
    }) &&
    (a.gripKg === undefined ||
      a.gripKg === null ||
      (Number.isFinite(a.gripKg) && a.gripKg >= 0)) &&
    (a.chairAssisted === undefined || typeof a.chairAssisted === "boolean") &&
    (a.mental === undefined ||
      (a.mental !== null &&
        typeof a.mental === "object" &&
        Object.entries(a.mental).every(
          ([stat, result]) =>
            ["INT", "WIS", "CHA"].includes(stat) &&
            !!result &&
            Array.isArray(result.answers) &&
            result.answers.length === 5 &&
            result.answers.every(
              (n) => Number.isInteger(n) && n >= 0 && n <= 3,
            ) &&
            Number.isFinite(Date.parse(result.completedAt)) &&
            (result.formId === undefined ||
              (validMentalFormId(result.formId) &&
                result.formId.startsWith(stat.toLowerCase() + "-"))) &&
            (result.durationMs === undefined ||
              (Number.isFinite(result.durationMs) &&
                result.durationMs >= 1000)) &&
            (result.challenge === undefined ||
              (Number.isInteger(result.challenge) && result.challenge >= 1)),
        )))
  );
}

export function displayAssessmentResults(
  a: Assessment,
  units: "metric" | "imperial" = "metric",
): MetricResult[] {
  const results = assessmentResults(a);
  if (units === "metric") return results;
  const format = (value: string) =>
    value
      .replace(
        /(\d+(?:\.\d+)?) kg\b/g,
        (_, n) => `${Math.round(Number(n) * 2.2046226218 * 10) / 10} lb`,
      )
      .replace(
        /(\d+(?:\.\d+)?) m\b/g,
        (_, n) => `${Math.round(Number(n) * 1.0936132983 * 10) / 10} yd`,
      );
  return results.map((r) => ({
    ...r,
    raw: format(r.raw),
    reference: format(r.reference),
  }));
}
