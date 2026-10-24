export type MentalStat = "INT" | "WIS" | "CHA";
export interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface MentalResult {
  answers: number[];
  completedAt: string;
  formId?: string;
  challenge?: number;
  durationMs?: number;
}
export interface MentalForm {
  id: string;
  stat: MentalStat;
  name: string;
  challenge: number;
  questions: ExamQuestion[];
}
// Each form contains new case data, not reordered copies of the original registration quiz.
// These are authored game assessments; the forms have not been psychometrically equated.
const contexts = [
  [
    "a community garden",
    "prepare six beds before Saturday",
    "soil delivery",
    "the delivery coordinator",
  ],
  [
    "a library project",
    "catalogue forty donated books",
    "the catalogue export",
    "the librarian",
  ],
  [
    "a walking group",
    "plan a route suitable for all participants",
    "the route survey",
    "the route leader",
  ],
  [
    "a repair workshop",
    "return a repaired bicycle safely",
    "a brake inspection",
    "the mechanic",
  ],
  [
    "a study project",
    "finish a practice assessment by Friday",
    "marked practice results",
    "the instructor",
  ],
  [
    "a food collection",
    "deliver twenty complete parcels",
    "the inventory count",
    "the collection organizer",
  ],
  [
    "a volunteer rota",
    "cover the weekend without double booking",
    "the availability sheet",
    "the rota coordinator",
  ],
  [
    "a software release",
    "publish a working update on Tuesday",
    "the test report",
    "the release owner",
  ],
  [
    "a household budget",
    "keep next month's essential bills covered",
    "the bank statement",
    "the account holder",
  ],
  [
    "a trail repair",
    "restore a damaged path before reopening",
    "a site inspection",
    "the trail supervisor",
  ],
  [
    "an archive project",
    "scan fifty records without losing originals",
    "the quality sample",
    "the archivist",
  ],
  [
    "a training plan",
    "complete four weeks of consistent practice",
    "the dated training log",
    "the coach",
  ],
  [
    "a school exhibition",
    "install twelve displays before opening",
    "the installation checklist",
    "the exhibition lead",
  ],
  [
    "a local newsletter",
    "publish a sourced article on Thursday",
    "the original interview notes",
    "the editor",
  ],
  [
    "a stockroom audit",
    "resolve an unexplained shortage",
    "the signed stock ledger",
    "the stockroom supervisor",
  ],
  [
    "an accessibility review",
    "make the entrance usable for visitors",
    "a measured access survey",
    "the access consultant",
  ],
  [
    "a rehearsal",
    "prepare a ten-minute performance",
    "the rehearsal recording",
    "the director",
  ],
  [
    "a transport plan",
    "arrange a reliable pickup for five people",
    "the confirmed timetable",
    "the dispatcher",
  ],
  [
    "a research summary",
    "compare three explanations fairly",
    "the original study methods",
    "the research supervisor",
  ],
  [
    "a maintenance schedule",
    "prevent a repeated equipment failure",
    "the fault history",
    "the maintenance lead",
  ],
  [
    "a job-search plan",
    "submit three well-matched applications",
    "the original role requirements",
    "the hiring contact",
  ],
  [
    "a team handover",
    "transfer work without losing open issues",
    "the current issue register",
    "the receiving lead",
  ],
  [
    "a public event",
    "keep the entrance orderly at opening",
    "the site capacity report",
    "the event coordinator",
  ],
  [
    "a design review",
    "choose a prototype that meets the brief",
    "the user-testing notes",
    "the design owner",
  ],
] as const;
function question(
  id: string,
  prompt: string,
  correct: string,
  wrong: string[],
  explanation: string,
  rotation: number,
): ExamQuestion {
  const answer = ((rotation % 4) + 4) % 4,
    options = [...wrong];
  options.splice(answer, 0, correct);
  return { id, prompt, options, answer, explanation };
}
export function mentalForm(
  stat: MentalStat,
  formId = `${stat.toLowerCase()}-v2-0-c1`,
): MentalForm {
  const match = /^(int|wis|cha)-v2-(\d+)-c(\d+)$/.exec(formId);
  const sequence = match ? Number(match[2]) : 0,
    challenge = match ? Number(match[3]) : 1;
  const index = sequence % contexts.length,
    [setting, goal, evidence, person] = contexts[index];
  const n = 3 + index + Math.floor(sequence / 24) * 2,
    hard = challenge > 1;
  const rows: [string, string, string[], string][] = [];
  if (stat === "INT") {
    const rate = n + 2,
      hours = hard ? 4 : 2,
      total = rate * hours;
    rows.push([
      `In ${setting}, one station processes ${rate} items per hour. ${hard ? "It pauses for one hour during a five-hour shift." : "It runs for two hours without a break."} How many items are processed?`,
      String(total),
      [String(total + rate), String(total - rate), String(rate + hours)],
      "Multiply the rate by actual working time; exclude the break.",
    ]);
    rows.push([
      `A relay for ${setting} uses this rule: ${hard ? "a valid destination AND a matching seal are required; a backup route does not replace either requirement" : "a valid destination is required even if a backup route exists"}. A packet has a backup route but no destination. What follows?`,
      "The packet cannot be sent under this rule",
      [
        "The backup route supplies its destination",
        "Every packet with a backup is valid",
        "A matching seal is unnecessary",
      ],
      "Apply every stated requirement; an alternative route does not supply missing information.",
    ]);
    rows.push([
      `A sequence begins ${n}, ${n * 2}, ${n * 4}, ${n * 8}. ${hard ? "A second sequence starts at twice that first value and follows the same rule. What is its fourth term?" : "What is the next term?"}`,
      String(n * 16),
      [String(n * 12), String(n * 10), String(n * 18)],
      "The multiplier is two at each step; use the specified starting point and position.",
    ]);
    const checked = (hard ? 40 : 20) + index * 2,
      errors = (hard ? 6 : 3) + (index % 4);
    rows.push([
      `A check of ${checked} records finds ${errors} errors. What fraction of these checked records is correct?`,
      `${checked - errors}/${checked}`,
      [
        `${errors}/${checked}`,
        `${checked}/${checked - errors}`,
        `${checked - errors}/${errors}`,
      ],
      "Subtract errors from the checked total; retain the original total as the denominator.",
    ]);
    rows.push([
      `For ${setting}, step A takes ${n} minutes. B takes ${n + 3} minutes and C takes ${n + 5} minutes. B and C can run together after A; D takes 2 minutes after both. What is the shortest completion time?`,
      `${2 * n + 7} minutes`,
      [`${3 * n + 10} minutes`, `${n + 7} minutes`, `${2 * n + 5} minutes`],
      "Use A plus the longer parallel step plus D, rather than adding both parallel durations.",
    ]);
  } else if (stat === "WIS") {
    rows.push([
      `You are helping with ${setting}. A confident message says ${goal} is impossible, but cites no source. What is the most useful first check?`,
      `Check ${evidence} and ask ${person} what is actually confirmed`,
      [
        "Treat confidence as evidence of accuracy",
        "Repeat the message to create urgency",
        "Ignore it because the conclusion is inconvenient",
      ],
      "Check relevant original evidence before acting on an unsupported conclusion.",
    ]);
    rows.push([
      `Your plan for ${setting} depends on an estimate. ${hard ? "Two reports disagree and one uses a different definition of completion." : "The estimate came from a single successful attempt."} What best represents the uncertainty?`,
      hard
        ? "Compare definitions, state a range, and identify what would resolve the disagreement"
        : "Use a range and test the estimate with further attempts",
      [
        "Present the most convenient number as certain",
        "Use extra decimal places to make the estimate reliable",
        "Assume no estimate is useful unless perfect",
      ],
      "Uncertainty should be stated and reduced through relevant evidence.",
    ]);
    rows.push([
      `You can make one small reversible trial or commit the entire budget to ${setting}. Evidence is limited. Which choice best supports a sound decision?`,
      "Run a small trial with a success measure and a review point",
      [
        "Commit everything to avoid looking uncertain",
        "Delay every decision until uncertainty disappears",
        "Choose whichever option is most popular without checking the goal",
      ],
      "A bounded reversible trial can obtain useful information at lower cost.",
    ]);
    rows.push([
      `In ${setting}, you promised more work than the remaining time allows. ${hard ? "Another person's work now depends on your deadline." : "You notice the problem before the deadline."} What should you do?`,
      `Tell ${person} promptly, explain the constraint, and agree on a realistic revised commitment`,
      [
        "Stay silent and hope the deadline moves",
        "Make a larger promise to restore confidence",
        "Blame the person waiting without discussing options",
      ],
      "Early honest communication lets people change a plan before the cost grows.",
    ]);
    rows.push([
      `After a change to ${setting}, the first result improves. What would best establish that the change helped?`,
      hard
        ? "Compare repeated results against the baseline, including alternative explanations and unintended effects"
        : "Repeat the measure against a recorded baseline under similar conditions",
      [
        "Count only the single best result",
        "Ask only people who supported the original decision",
        "Assume every later improvement has the same cause",
      ],
      "A repeatable comparison and consideration of other causes are stronger than one favorable observation.",
    ]);
  } else {
    rows.push([
      `${person} says they are overwhelmed by ${setting} and asks to be heard before receiving suggestions. What is a suitable opening?`,
      `Ask what has been hardest, listen, and check your understanding`,
      [
        "Give a full solution before they finish",
        "Explain that other people have harder problems",
        "Change the subject so they stop feeling concerned",
      ],
      "Match the requested conversation before switching to advice.",
    ]);
    rows.push([
      `A teammate says, “I want to ${goal}, but the deadline changed and I do not know what to prioritize.” Which summary checks understanding?`,
      `“The changed deadline makes the priorities unclear; have I understood that correctly?”`,
      [
        "“You do not care about finishing.”",
        "“The entire project is impossible.”",
        "“You want me to decide everything permanently.”",
      ],
      "Summarize the stated concern tentatively; do not add motives or judgments.",
    ]);
    rows.push([
      `You need ${person} to review ${evidence}. Which request is clearest?`,
      `“Please review ${evidence} by Friday and tell me which two issues need action first.”`,
      [
        "“Deal with it soon.”",
        "“You know what I need.”",
        "“Everything is a disaster; fix all of it.”",
      ],
      "Specify the action, time, and expected response.",
    ]);
    rows.push([
      `During a disagreement about ${setting}, ${hard ? "two people interrupt each other and one colleague has stopped contributing" : "a teammate states a different interpretation"}. What should you do next?`,
      hard
        ? "Pause the interruptions, invite each view in turn, and confirm the shared decision criteria"
        : "Ask them to explain their interpretation, then compare both views against the shared goal",
      [
        "Treat disagreement as disloyalty",
        "Repeat your position more loudly",
        "Announce agreement without resolving the different interpretations",
      ],
      "Create enough space to understand the disagreement and use shared criteria.",
    ]);
    rows.push([
      `You explained a plan for ${setting}. What is the most useful way to check whether it was clear?`,
      hard
        ? "Ask the listener to explain their next action and flag anything that remains unclear"
        : "Ask what the listener understood and clarify any mismatch",
      [
        "Ask only whether your wording sounded impressive",
        "Assume silence proves agreement and understanding",
        "Repeat exactly the same words without checking the source of confusion",
      ],
      "Check the listener's understanding and usable next action, not just your intention.",
    ]);
  }
  return {
    id: formId,
    stat,
    challenge,
    name:
      stat === "INT"
        ? "Learning & reasoning"
        : stat === "WIS"
          ? "Judgment & decisions"
          : "Listening & communication",
    questions: rows.map((r, i) =>
      question(`${formId}-q${i + 1}`, ...r, sequence + i * 3 + challenge),
    ),
  };
}
export function nextMentalForm(
  stat: MentalStat,
  used: string[],
  challenge = 1,
): MentalForm {
  const usedIndexes = new Set(
    used
      .map((id) =>
        new RegExp(`^${stat.toLowerCase()}-v2-(\\d+)-c\\d+$`).exec(id),
      )
      .filter(Boolean)
      .map((m) => Number(m![1])),
  );
  let n = 0;
  while (usedIndexes.has(n)) n++;
  return mentalForm(stat, `${stat.toLowerCase()}-v2-${n}-c${challenge}`);
}
export const formScore = (form: MentalForm, answers: number[]) =>
  form.questions.reduce(
    (sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0),
    0,
  );
export const validMentalFormId = (id: unknown) =>
  typeof id === "string" && /^(int|wis|cha)-v2-\d{1,7}-c\d{1,4}$/.test(id);
