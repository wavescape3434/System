import type { ExamQuestion, MentalForm, MentalStat } from "./exam-bank";

// Original items informed by reasoning, judgment and teach-back research.
// Neither norms nor parallel-form equivalence have been established.
export function abilityForm(stat: MentalStat, id: string): MentalForm {
  const match = /-v3-(\d+)-c(\d+)$/.exec(id)!;
  const sequence = Number(match[1]),
    challenge = Number(match[2]);
  const questions: ExamQuestion[] = [];
  const add = (
    prompt: string,
    correct: string,
    wrong: string[],
    explanation: string,
  ) => {
    const answer = (sequence * 7 + questions.length * 3 + challenge) % 4;
    const options = [...wrong];
    options.splice(answer, 0, correct);
    questions.push({
      id: `${id}-q${questions.length + 1}`,
      prompt,
      options,
      answer,
      explanation,
    });
  };
  for (let i = 0; i < 5; i++) {
    const seed = sequence * 5 + i,
      n = 4 + (seed % 17) + Math.min(challenge - 1, 8),
      type = seed % 10;
    if (stat === "INT") {
      switch (type) {
        case 0:
          add(
            `Every object in group K${n} is in L${n}. No object in L${n} is in M${n}. At least one object is in K${n}. Which must be true?`,
            `Some L${n} objects are not in M${n}`,
            [
              `Every L${n} object is in K${n}`,
              `Some M${n} objects are in K${n}`,
              `No L${n} objects exist`,
            ],
            "The existing K object is also L and cannot be M. The converse does not follow.",
          );
          break;
        case 1:
          add(
            `A device opens only if both a blue token and code ${n} are present. You observe that it did not open. Which conclusion is justified?`,
            "At least one requirement may be missing, but the observation alone does not identify which",
            [
              "The blue token is definitely missing",
              `Code ${n} is definitely wrong`,
              "Both requirements are definitely missing",
            ],
            "A necessary condition is not a complete diagnosis of a failed outcome; 'only if' does not promise that meeting both conditions is sufficient.",
          );
          break;
        case 2:
          add(
            `Four runners A, B, C and D finish without ties. B is ahead of C; A is immediately behind D; C is not last. How many finishing orders satisfy all the clues? (Puzzle ${n})`,
            "1",
            ["2", "3", "4"],
            "Treat the adjacent D,A pair as one block. Its three possible placements relative to B,C give D,A,B,C; B,D,A,C; or B,C,D,A. Only the last keeps C out of last place.",
          );
          break;
        case 3:
          add(
            `A rule changes (${n}, ${n + 2}) into ${n * (n + 2) + n} and (${n + 1}, ${n + 3}) into ${(n + 1) * (n + 3) + n + 1}. The rule is multiply the two inputs, then add the first input. What is the output for (${n + 2}, ${n + 4})?`,
            String((n + 2) * (n + 4) + n + 2),
            [
              String((n + 2) * (n + 4)),
              String((n + 2) * (n + 4) + n + 4),
              String(2 * n + 6),
            ],
            "Apply the stated operation in order; do not add the second input or stop after multiplication.",
          );
          break;
        case 4:
          add(
            `Exactly ${n} of ${n + 7} boxes contain a red seal. Exactly 9 contain a silver seal. What is the minimum number containing both?`,
            "2",
            ["0", "1", String(n)],
            `Inclusion-exclusion gives ${n} + 9 − ${n + 7} = 2. This is a lower bound, not the exact overlap.`,
          );
          break;
        case 5:
          add(
            `Two workers independently verify a code. Worker A has probability 1/2 of finding an error; worker B has probability 1/3. What is the probability that at least one finds it? (Batch ${n})`,
            "2/3",
            ["5/6", "1/6", "1/3"],
            "Both miss with probability (1/2)(2/3)=1/3. Subtract from one; adding detection probabilities double-counts the overlap.",
          );
          break;
        case 6:
          add(
            `A key is in box A, B, or C. Labels say A: 'The key is in B'; B: 'The key is not in B'; C: 'The key is not in A'. Exactly one label is true. Where is the key? (Set ${n})`,
            "A",
            ["B", "C", "The clues do not determine a box"],
            "A and B's labels are opposites, so exactly one is always true. C's label must be false, placing the key in A.",
          );
          break;
        case 7:
          add(
            `A train covers the outward journey at ${n * 2} mph and the identical distance back at ${n} mph. Ignoring stops, what is its average speed over both legs?`,
            `${((4 * n) / 3).toFixed(2)} mph`,
            [
              `${(1.5 * n).toFixed(2)} mph`,
              `${n.toFixed(2)} mph`,
              `${(2 * n).toFixed(2)} mph`,
            ],
            "Equal distances take unequal times. Average speed is total distance divided by total time: 2/(1/(2n)+1/n)=4n/3.",
          );
          break;
        case 8:
          add(
            `All valid passes have a date. Some dated items are expired. Pass ${n} has a date. Which conclusion follows?`,
            "The information does not establish whether this pass is valid or expired",
            [
              "The pass is valid",
              "The pass is expired",
              "Every expired item is a valid pass",
            ],
            "A date is necessary for validity, not sufficient. 'Some' supplies no conclusion about this particular item.",
          );
          break;
        default:
          add(
            `You must test the rule 'If a card has a vowel on one side, it has an even number on the other.' The four visible faces are A, K, ${2 * n}, and ${2 * n + 1}. Which must you turn over?`,
            `A and ${2 * n + 1}`,
            [`A and ${2 * n}`, `K and ${2 * n}`, "All four cards"],
            "Look for a vowel paired with an odd number. A and the odd-number card could disprove the rule; the rule says nothing about consonants.",
          );
      }
    } else if (stat === "WIS") {
      switch (type) {
        case 0:
          add(
            `A rare fault affects ${n} of 1,000 units. A sensor flags all faulty units and also 100 healthy units. A flagged unit is selected at random. Roughly how likely is a real fault?`,
            `${Math.round((100 * n) / (100 + n))}%`,
            ["About 90%", "100%", "50%"],
            `Among ${n + 100} flags, only ${n} are faults. Intuition often overlooks the much larger healthy group.`,
          );
          break;
        case 1:
          add(
            `A lake's covered area doubles daily. It is fully covered on day ${n + 20}. On which day was it half covered?`,
            `Day ${n + 19}`,
            [
              `Day ${Math.floor((n + 20) / 2)}`,
              `Day ${n + 18}`,
              `Day ${n + 20}`,
            ],
            "Work backward one doubling. The half-way area is not reached halfway through elapsed time.",
          );
          break;
        case 2:
          add(
            `A method worked in ${n} of ${n} tries. A second worked in ${n * 10 - 1} of ${n * 10} tries on comparable cases. Which conclusion best fits the evidence?`,
            "The second has much more evidence; neither small difference nor a perfect small sample proves superiority",
            [
              "The first is certainly better because it is perfect",
              "The second cannot work because it failed once",
              "Both true success rates are known exactly",
            ],
            "A perfect small sample does not establish a perfect underlying process. Sample size matters alongside the observed rate.",
          );
          break;
        case 3:
          add(
            `You predicted a 70% chance of success on ${n * 10} independent, comparable occasions. About 70% succeeded. What does that say about the forecasts?`,
            "They are well calibrated at this probability, even though some individual predictions did not happen",
            [
              "Every unsuccessful case proves the forecast was wrong",
              "The forecasts should have said 100%",
              "Calibration requires every event to succeed",
            ],
            "Calibration concerns how frequently events occur across comparable forecasts, not certainty on a single case.",
          );
          break;
        case 4:
          add(
            `You spent $${n * 100} on an unusable plan. From today, replacing it costs $${n * 10} and works; repairing costs $${n * 20} and has no other benefit. Which cost comparison should drive the decision?`,
            "Compare future costs and benefits; the already spent money is unrecoverable",
            [
              "Choose repair to make the original expense worthwhile",
              "Always replace because new things are better",
              "Double the original expense to show commitment",
            ],
            "The previous expense is sunk. It does not make the more expensive future option beneficial.",
          );
          break;
        case 5:
          add(
            `A practice group improves from ${n} to ${n + 8} after changing its method. There is no comparison group, and the same test was repeated. What can you conclude?`,
            "Performance improved; practice effects and other causes remain possible",
            [
              "The new method caused all eight points",
              "The change definitely had no effect",
              "Repeating a test cannot affect its result",
            ],
            "Separate the observation from its cause. Familiarity, practice and selection can also improve scores.",
          );
          break;
        case 6:
          add(
            `A familiar machine sounds wrong. You have years of accurate feedback with this exact model; a novice has a strong hunch from a film. Whose intuition deserves more weight? (Machine ${n})`,
            "The experienced operator's, followed by a safe diagnostic check",
            [
              "Both equally because intuition is always reliable",
              "The novice's because confidence predicts accuracy",
              "Neither because expertise can never aid intuition",
            ],
            "Reliable intuitive expertise depends on a learnable environment and repeated valid feedback. It still benefits from verification.",
          );
          break;
        case 7:
          add(
            `A sample has ${n * 10} ordinary values and one extremely high value. You want to describe a typical member without the outlier dominating. Which first summary is most useful?`,
            "Median, alongside the spread and sample details",
            [
              "Maximum only",
              "Mean only, without mentioning the outlier",
              "The outlier treated as the usual result",
            ],
            "The median resists a single extreme value. It is one description, not a substitute for seeing the distribution.",
          );
          break;
        case 8:
          add(
            `A sealed envelope contains a report from either team A or B. You see only its length: ${n} pages. Both teams routinely write reports of that length. What is justified?`,
            "The length provides no distinguishing evidence; more information is needed",
            [
              "It must be A because A was mentioned first",
              "It must be B because the report is long",
              "The teams are now equally likely regardless of prior evidence",
            ],
            "A clue equally likely under both explanations does not distinguish them or erase the prior evidence.",
          );
          break;
        default:
          add(
            `A forecast model gives a ${n + 60}% chance of rain on the same day that a confident stranger says it will definitely be dry. The stranger supplies no new observations. Which update is justified?`,
            "Keep the model estimate pending relevant new evidence, while planning for both outcomes",
            [
              "Set rain probability to zero",
              "Treat the stranger's confidence as a measurement",
              "Set rain probability to 100% because they disagree",
            ],
            "Confidence alone is not new evidence. Good judgment combines a calibrated estimate with the consequences of being wrong.",
          );
      }
    } else {
      const topics = [
        "a skill you use at work",
        "a tool you know well",
        "a hobby you practice",
        "a decision you made",
        "a process you understand",
        "a place you know",
        "a lesson you learned",
        "a task you recently completed",
        "a recipe you can prepare",
        "a game rule you understand",
        "a safety check you routinely perform",
        "a piece of equipment you use",
        "a learning method you tried",
        "a route you travel",
        "a budget choice you made",
        "a design you like",
        "a repair you understand",
        "a scientific idea you can explain",
        "a planning method you use",
        "an exercise technique you know",
        "a book idea you remember",
        "a comparison you recently made",
        "a common mistake you corrected",
        "a useful routine you follow",
      ];
      const topic = topics[seed % topics.length];
      const tasks = [
        {
          prompt: `Explain ${topic} aloud to a complete beginner in 60 seconds. Do not read a script. Then replay a recording or recall your exact explanation.`,
          criteria: [
            "State the main point first",
            "Explain one unfamiliar term",
            "Give one concrete example",
            "Finish with a usable next step",
          ],
        },
        {
          prompt: `Give a 45-second spoken introduction to ${topic}. Repeat it in 20 seconds without losing the main point.`,
          criteria: [
            "Identify the subject",
            "Keep the main point in both versions",
            "Remove filler rather than essential information",
            "Finish within the chosen time",
          ],
        },
        {
          prompt: `Explain ${topic} aloud twice: once to a beginner and once to an experienced peer. Allow 45 seconds each.`,
          criteria: [
            "Preserve factual accuracy",
            "Use different assumed knowledge",
            "Change the example or level of detail",
            "State why it matters to that listener",
          ],
        },
        {
          prompt: `Choose a 30–60 second recording about ${topic} that you have not memorized. Listen once, pause it, and summarize aloud. Then replay it to check.`,
          criteria: [
            "Capture the main claim",
            "Retain two supporting details",
            "Do not add an unstated motive or fact",
            "Correct an omission after replay",
          ],
        },
        {
          prompt: `Teach a three-step part of ${topic} aloud, without notes. After a short pause, reconstruct only the instructions you actually said.`,
          criteria: [
            "Name the goal",
            "Give the steps in order",
            "Include a way to check the result",
            "Make the instructions usable without guessing missing steps",
          ],
        },
      ];
      const task = tasks[i];
      questions.push({
        id: `${id}-q${i + 1}`,
        prompt: task.prompt,
        answer: 3,
        options: [
          "0 · Did not complete the exercise",
          "1 · Completed it; met 0–1 criteria",
          "2 · Met 2–3 criteria",
          "3 · Met all 4 criteria",
        ],
        explanation:
          "Self-reviewed performance rubric. Use the recording, source or reconstruction as evidence; this does not measure attractiveness, extroversion or personality.",
        performance: {
          seconds: i === 1 ? 65 : i === 2 ? 90 : 60,
          criteria: task.criteria,
        },
      });
    }
  }
  return {
    id,
    stat,
    challenge,
    name:
      stat === "INT"
        ? "Reasoning & logic"
        : stat === "WIS"
          ? "Insight & judgment"
          : "Communication trials",
    questions,
  };
}
