import type { Objective } from "./domain";
const DETAILS: Record<string, string> = {
  "u-walk-brisk":
    "Walk easily for 2–3 minutes, then complete a 30-minute brisk block at a pace where conversation is possible but singing is difficult. Finish with 2–3 easy minutes. Record brisk minutes separately from the warm-up and cool-down; five completed brisk blocks provide 150 moderate minutes.",
  "u-run-walk":
    "Walk easily for 5 minutes. Complete 6 rounds of 1 minute of comfortable jogging followed by 2 minutes walking (18 minutes), then walk easily for 5 minutes to finish: 28 minutes total. Use nonconsecutive running days and repeat the same intervals until they feel controlled before extending the jogging portions.",

  "u-wall-push":
    "Complete 2 sets of 5 controlled wall pushups; rest 60–90 seconds. Use a fixed wall, keep the trunk aligned and lower toward the same point. Move the feet closer to make the exercise easier. Finish with at least 2–4 clean reps left; progress the incline after consistent top-range sessions.",
  "u-incline-push":
    "Complete 3 sets of 8 incline pushups on a fixed sturdy counter or bench, resting 90 seconds. Keep a straight trunk and chest moving toward the same target; leave 2–3 clean reps in reserve. Record surface height and reps in every set before lowering the incline.",
  "u-floor-push-8":
    "Complete 3 sets of 8 controlled full-range floor pushups, resting 90–120 seconds. Keep trunk alignment and a consistent chest target. Stop before form changes and retain about 2 clean reps. Build repetitions at the same setup before using a harder variation.",
  "u-floor-push-20":
    "Complete 3 sets of 6–12 harder pushups, resting 2–3 minutes. Start with a three-second lowering phase or feet on a low stable step. Choose a setup where the target leaves 2–3 clean reps possible; reduce the elevation or use ordinary floor pushups if six controlled reps are not possible. Record tempo/elevation and each set. After two top-range sessions, change one difficulty variable and rebuild from six reps. This is pushing practice; use Regimen for full-body work.",
  "u-chair-squat":
    "Complete 2 sets of 8 sit-to-stands from a stable chair against a wall, resting 60–90 seconds. Keep feet planted and lower under control. Hand assistance is allowed when needed; record the chair height and assistance and keep them consistent for comparison.",
  "u-bodyweight-squat":
    "Complete 3 sets of 12 bodyweight squats to a repeatable comfortable depth, resting 90–120 seconds. Keep feet planted and lower under control. Retain about 2 clean reps; after two top-range sessions, add a small load or use a harder controlled variation instead of endlessly adding repetitions.",
  "u-split-squat":
    "Complete 3 sets of 10 supported split squats on each side. Hold a fixed support, lower straight down through a controlled comfortable range and rest 90–120 seconds between sets. Keep stance length and depth consistent and record the lower side's completed reps if counts differ.",
  "u-weighted-strength":
    "Warm up for 5 minutes. Complete 2–3 work sets of 6–12 reps each of a familiar goblet squat or leg press, chest press or dumbbell floor press, supported row and Romanian deadlift or glute bridge; add 2 sets of 6–10 dead bugs per side. Rest 2 minutes between compound sets and leave about 2 clean reps in reserve. Choose loads you can control; record each exercise, set, load and range. For the guided A/B version with per-set logging, use Regimen.",
  "u-pullup-8":
    "After the dated preparation, complete 4 sets of 8 strict pullups with 2–3 minutes rest and consistent full range. This is a prepared muscular-endurance assessment; keep ordinary training submaximal and record every set.",
  "u-pullup-12":
    "After the dated preparation, complete 5 sets of 12 strict pullups with 3 minutes rest and consistent full range. This high-volume muscular-endurance challenge is not the default way to build strength. Use progressive resistance or a harder variation for lower-repetition strength goals.",
  "u-pullup-20":
    "After the required long preparation, complete the declared 5-set, 20-strict-repetition muscular-endurance challenge with 3–5 minutes rest and a consistent recorded technique standard. This is an optional exceptional volume achievement, not a routine workout or a population strength percentile. Record each set; do not add repetitions after technique changes.",
  "u-mobility-5":
    "Complete one comfortable circuit: 10 supported ankle rocks per side, 5 slow shoulder circles in each direction and 8 gentle hip hinges. Move under control for about 5 minutes; use a comfortable range without forcing it.",
  "u-balance-practice":
    "Beside a stable counter, complete 3 single-leg stands per side, holding up to 20 seconds with eyes open. Rest 30–45 seconds. Touch the support as needed and record hold time and touches. Improve control at the same setup before increasing hold duration.",
  "practice-core-f":
    "Complete 1 set of 5 slow dead bugs per side. Keep the trunk still and shorten the reach if needed; rest 45 seconds between sides.",
  "practice-core-e":
    "Complete 2 sets of 6 dead bugs per side; rest 45–60 seconds. Use the same controlled reach each set.",
  "practice-core-d":
    "Complete 3 sets of 8 controlled dead bugs per side, resting 60 seconds. Keep the lower trunk stable throughout.",
  "practice-core-c":
    "Complete 3 rounds: 8 dead bugs per side, a 20-second side plank per side and 6 bird dogs per side. Rest 45 seconds between movements and 90 seconds between rounds. Use a knee-supported plank if needed and record the variation.",
  "practice-hinge-f":
    "Complete 1 set of 8 unloaded wall-touch hip hinges. Stand a short step from a wall, soften the knees and send the hips back to touch it without rounding the back; rest as needed.",
  "practice-hinge-e":
    "Complete 2 sets of 8 controlled unloaded hip hinges, resting 60 seconds. Use the same wall target and record one alignment correction.",
  "practice-hinge-d":
    "Complete 3 sets of 10 glute bridges with a two-second top pause, resting 60–90 seconds. Keep ribs and trunk controlled without arching the lower back.",
  "practice-hinge-c":
    "Complete 3 sets of 8 controlled staggered-stance glute bridges per side, then 2 sets of 10 slow hip hinges. Rest 90 seconds; keep pelvis control and a repeatable range.",
  "practice-carry-f":
    "Carry a familiar light load in two hands for 3 rounds of 15 seconds on a clear flat route. Rest 60 seconds; stand tall without leaning.",
  "practice-carry-e":
    "Complete 3 carries of 20 seconds at a familiar light load, resting 60 seconds. Record load, grip and distance.",
  "practice-carry-d":
    "Complete 4 carries of 30 seconds with a controlled upright posture, resting 90 seconds. Keep the route and load consistent for comparison.",
  "practice-carry-c":
    "Complete 4 carries of 40 seconds at a challenging controlled load, resting 90–120 seconds. Finish before posture or grip fails. Progress a small amount of load or duration, one variable at a time.",
};
export function refineTrainingGuidance(o: Objective): Objective {
  const description = DETAILS[o.id];
  const durations: Record<string, string> = {
    core: "3–5,5–10,8–12,15–25",
    hinge: "3–5,5–8,8–12,15–25",
    carry: "3–5,4–6,6–10,8–12",
  };
  const match = /^practice-(core|hinge|carry)-([fedc])$/.exec(o.id);
  const minutes =
    o.id === "u-floor-push-20"
      ? "3 sets × 6–12"
      : o.id === "u-run-walk"
        ? "28 min total"
        : o.id === "u-walk-brisk"
          ? "34–36 min · 30 brisk"
          : match
            ? `${durations[match[1]].split(",")["fedc".indexOf(match[2])]} min`
            : o.minutes;
  return description
    ? {
        ...o,
        ...(o.id === "u-floor-push-20"
          ? { title: "Progressive pushup strength" }
          : {}),
        description,
        minutes,
      }
    : o;
}
