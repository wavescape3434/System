import type { Character, ClassPath } from "./domain";

const PRACTICE: Record<
  string,
  { activity: string; technique: string; short: string }
> = {
  fighter: {
    activity:
      "Warm up, then complete 3 sets of 6–12 controlled pushing repetitions and 3 sets of 6–12 squats. Choose a wall, incline, floor, or weighted variation that leaves about two clean repetitions in reserve. Rest 60–120 seconds between sets; record variation, load and repetitions. Allow recovery before another hard session.",
    technique:
      "Review one short recording of your pushup, squat or usual lift. Check range, control and alignment against a reliable technique guide. Make one correction and repeat an easy set; record the change.",
    short:
      "Add one easy technique set of a pushup or squat variation; record control and range.",
  },
  guardian: {
    activity:
      "Walk at a sustainable, conversational pace for 20 minutes. Record distance and effort. Finish with two easy sets of controlled sit-to-stands or squats; keep the same variation for comparison. Increase duration or load gradually after recovery.",
    technique:
      "Check your walking or carry posture on an easy five-minute route. Keep a relaxed breathing rhythm and stable steps. Record one change that makes the movement more controlled.",
    short: "Add five minutes of comfortable walking and record effort.",
  },
  ranger: {
    activity:
      "Practice 5 minutes of comfortable ankle and hip mobility, then 10 minutes of controlled stepping between marked floor targets beside stable support. Finish with three short supported balance attempts per side. Record accurate steps and your best controlled hold.",
    technique:
      "Use the same safe floor targets for three easy stepping rounds. Review accuracy, control and balance, then repeat one round after a correction. Record correct placements rather than speed alone.",
    short:
      "Add five minutes of controlled stepping or supported balance practice.",
  },
  rogue: {
    activity:
      "Mark two safe targets on a table or floor. Complete five short coordination rounds with full control, resting between rounds. Add five minutes of gentle mobility. Record correct touches or placements and one technique adjustment; avoid rushing to improve the count.",
    technique:
      "Record a slow coordination drill. Count accurate placements, identify one repeated error, and practice three easy rounds correcting it. Keep target size and spacing unchanged.",
    short:
      "Add five minutes of slow coordination practice with a count of accurate placements.",
  },
  mage: {
    activity:
      "Study one defined topic for 15 minutes. Close the source, answer five retrieval questions, and check each answer against the source. Correct mistakes and schedule a short review for another day. Record the topic and correct-answer count.",
    technique:
      "Choose a concept you recently studied. Explain it from memory, check the original source, and correct one specific misunderstanding. Answer a new example to verify the correction.",
    short:
      "Close a study source and answer three recall questions, then check them.",
  },
  cleric: {
    activity:
      "Read a short Bible passage in its chapter context. Write its main point in your own words, identify who is speaking and to whom, then check your summary against the text. Finish with prayer and one practical application to revisit. Record the passage and summary.",
    technique:
      "Review a recent Scripture summary against the surrounding chapter. Identify one unsupported assumption or missing context, then rewrite the summary with a verse reference supporting it.",
    short:
      "Read a short Bible passage in context, summarize its main point, and pray.",
  },
  bard: {
    activity:
      "Record a two-minute explanation of a familiar topic. Listen back and mark clarity, structure and pace. Rewrite one unclear section, then record again. Compare the two versions and record one concrete improvement; this task is completed independently.",
    technique:
      "Listen to one of your recorded explanations. Remove filler, state the main point early, and replace one vague example with a concrete one. Record the revised version and compare it.",
    short:
      "Record a one-minute explanation and revise one unclear sentence after listening.",
  },
  artificer: {
    activity:
      "Build or repair one small item, spreadsheet formula, script or simulated system. Define an expected result, test a normal case and an edge case, and record the outcome. Correct one failure and save a repeatable demonstration.",
    technique:
      "Reproduce one fault in a safe sample or personal project. Change one variable, test the result, and document the cause and fix. Use a simulation where real equipment is unavailable.",
    short:
      "Test one practical example against an expected result and correct an error.",
  },
};
export function classPractice(
  path: ClassPath,
  _c: Character,
  technique = false,
) {
  const mix = Object.entries(path.mix).sort((a, b) => b[1]! - a[1]!);
  const primary = PRACTICE[mix[0][0]];
  const secondary = mix[1] && mix[1][1]! >= 25 ? PRACTICE[mix[1][0]] : null;
  return `${technique ? primary.technique : primary.activity}${!technique && secondary ? ` ${secondary.short}` : ""}`;
}

export function classSecondaryPractice(path: ClassPath): string | undefined {
  const mix = Object.entries(path.mix).sort((a, b) => b[1]! - a[1]!);
  return mix[1] && mix[1][1]! >= 25 ? PRACTICE[mix[1][0]].short : undefined;
}
