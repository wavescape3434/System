export const CAREER_RUBRICS: Record<string, [string, string, string, string]> =
  {
    business: [
      "Answer the stakeholder's actual question",
      "Verify inputs and calculations",
      "Compare options with explicit uncertainty",
      "Retain a reproducible recommendation",
    ],
    technology: [
      "Define and reproduce expected behavior",
      "Pass a normal-case test",
      "Test an edge case or reversible fault",
      "Retain configuration, checks and rollback steps",
    ],
    management: [
      "State scope and acceptance criteria",
      "Show owners and dependencies",
      "Evaluate a risk and trade-off",
      "Set a measurable follow-up",
    ],
    finance: [
      "Reconcile the sample figures",
      "Trace inputs and assumptions to sources",
      "Check calculations and units",
      "Retain an auditable explanation and control",
    ],
    engineering: [
      "State measurable requirements and units",
      "Account for relevant constraints",
      "Verify against a tolerance or test",
      "Document assumptions and possible failure",
    ],
    science: [
      "Define a testable question and method",
      "Retain data provenance and controls",
      "Use analysis that answers the question",
      "State uncertainty and limits on the conclusion",
    ],
    healthcare: [
      "Use a fictional case within the learning role",
      "Separate observations from assumptions",
      "Use a named guideline and protect privacy",
      "Confirm priorities and the next handoff action",
    ],
    education: [
      "State an observable learning outcome",
      "Align the example and practice to it",
      "Check for a specific misconception",
      "Revise the lesson from evidence of understanding",
    ],
    law: [
      "Identify jurisdiction and relevant authority",
      "Separate material facts and assumptions",
      "Support the reasoning with sources",
      "State limits and unresolved questions",
    ],
    community: [
      "Identify a practical need respectfully",
      "Keep role boundaries and avoid assumed motives",
      "Check the proposed action against reliable guidance",
      "State outcomes, limits and follow-up",
    ],
    creative: [
      "Meet the stated brief and audience",
      "Use the intended technique deliberately",
      "Compare the output against explicit design criteria",
      "Retain an original artifact and a targeted revision",
    ],
    sales: [
      "Identify the need without inventing it",
      "Make accurate and supported value claims",
      "Check understanding rather than assume agreement",
      "State an ethical and specific next step",
    ],
    administration: [
      "Keep complete and accurate records",
      "Prioritize against stated requirements",
      "Check dates, dependencies and resources",
      "Produce a source-linked handoff or completed output",
    ],
    hospitality: [
      "State the service and quality requirement",
      "Keep preparation within training and safety guidance",
      "Account for materials, timing and cost",
      "Verify the finished service against the criterion",
    ],
    trades: [
      "Use correct measurements and tolerances",
      "Plan safely within training and role limits",
      "Inspect the practice result against the specification",
      "Retain diagnosis, test and correction records",
    ],
    manufacturing: [
      "Use a repeatable measurement/process setup",
      "Verify quality data and calculations",
      "Distinguish a symptom from a supported cause",
      "Compare a proposed change against the baseline",
    ],
    logistics: [
      "Reconcile inventory or demand inputs",
      "Check route, capacity and timing constraints",
      "Include a workable contingency",
      "Explain the service, cost and risk trade-off",
    ],
    "public-safety": [
      "Use a safe fictional/tabletop scenario",
      "Separate facts, hazards and uncertainty",
      "Choose a supported mitigation within role limits",
      "Confirm communication and follow-up responsibilities",
    ],
    agriculture: [
      "Record comparable site and seasonal conditions",
      "Track relevant inputs and observations",
      "Use a suitable care or resource plan",
      "Compare outcomes over an appropriate timeframe",
    ],
    general: [
      "State a concrete goal and criterion",
      "Produce a usable work sample",
      "Verify its outcome against a named source",
      "Make a targeted correction and next-step plan",
    ],
  };
export const SPECIAL_PRACTICE: Record<
  string,
  [string, string, string, string]
> = {
  language: [
    "Recall five useful words, then understand and produce one original sentence at the same source level.",
    "Listen to a short beginner passage without its transcript, summarize its meaning, then correct against the source.",
    "Use an unfamiliar passage at your current course level. Answer comprehension questions and record a one-minute original response.",
    "Use the next source difficulty: summarize an unfamiliar passage, infer a meaning from context, and produce a coherent response without a script.",
  ],
  writing: [
    "Write a five-point outline answering one concrete question; check that each point serves the question.",
    "Write a paragraph from memory, verify factual claims and revise one unclear transition.",
    "Write an original explanation using two named sources; distinguish evidence, inference and uncertainty, then revise the weakest claim.",
    "Write a decision brief for a defined audience, compare two alternatives, answer the strongest objection and verify the supporting claims.",
  ],
  "listening-lab": [
    "Listen once to a 30-second recording and state its main point before checking the transcript.",
    "Summarize a one-minute recording with two supporting details; check for omissions and invented claims.",
    "Compare two unfamiliar recorded accounts, summarize each fairly and identify what would resolve their disagreement.",
    "Analyze a complex unfamiliar recorded discussion, distinguish explicit claims from inference, and defend a concise synthesis against the transcript.",
  ],
  "message-craft": [
    "Draft one message with a clear purpose and specific request.",
    "Revise a familiar message so its context, request and next action are explicit.",
    "Draft a difficult message separating observation, impact, request and room for a response; revise against that four-part rubric.",
    "Write two audience-specific versions of a difficult message, anticipate a plausible objection, and compare accuracy, clarity and tone.",
  ],
  hands: [
    "At a table, alternate fingertip touches between two marked targets 30 cm apart for three 20-second rounds. Count correct touches and misses separately.",
    "Practice a four-finger opposition sequence for three 30-second rounds on each hand. Keep order and target spacing fixed; record correct sequences and errors.",
    "Perform a mirrored two-hand sequence for three 45-second rounds. Keep speed fixed and correct the least accurate transition.",
    "Perform different four-step patterns with the two hands for three 45-second rounds. Compare errors at the same speed before adding complexity.",
  ],
  footwork: [
    "Beside stable support, step forward and back over a floor line for three 30-second rounds. Count accurate placements and errors.",
    "Use four floor targets for forward, side and back steps. Complete three controlled one-minute rounds with fixed spacing.",
    "Link three footwork patterns in three one-minute rounds, preserving spacing and placement accuracy. Correct the weakest transition.",
    "Link several directional patterns in three 90-second rounds under a precision target. Keep the same pace while reducing placement errors.",
  ],
  "joint-control": [
    "Complete one easy circuit of 10 supported ankle rocks per side, five shoulder circles each way and eight comfortable hip hinges.",
    "Repeat two controlled circuits at the same comfortable range; identify one movement that needs less assistance.",
    "Practice a three-movement sequence for three equal rounds. Compare alignment and comfortable control on video at the same range.",
    "Integrate the sequence into a relevant movement skill. Compare control and assistance across three repeatable trials; do not force extra range to earn a harder tier.",
  ],
};
