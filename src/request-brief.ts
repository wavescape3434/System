import type { Character, Objective } from "./domain";
import { careerCategory } from "./careers";
import { CAREER_GUIDES } from "./career-guides";
export interface RequestBrief {
  steps: string[];
  record: string;
  finish: string;
}
const protocol = (steps: string[], record: string) => ({ steps, record });
export function requestBrief(o: Objective, c: Character): RequestBrief {
  const topic =
    `${o.id} ${o.family || ""} ${o.groupTitle || ""} ${o.title} ${o.description}`.toLowerCase();
  const sessions = o.minimumSessions;
  const workload =
    o.cadence === "daily"
      ? o.minutes
      : "the target stated in the commission, with its qualifying practice days";
  let brief: Omit<RequestBrief, "finish">;
  if (o.workout)
    brief = protocol(
      [
        o.workout.warmup,
        ...o.workout.exercises.map(
          (e) =>
            `${e.name}: ${e.sets} sets of ${e.min}–${e.max}${e.perSide ? " per side" : ""}; rest ${e.restSeconds} seconds. ${e.cues}`,
        ),
        `Finish with ${o.workout.rir} clean repetitions in reserve. Keep setup and range consistent; progress after two comparable top-range sessions.`,
      ],
      "Every work set, exercise setup, external load where used, and clean reps left. A full session pays once; its component movements are not additional claims.",
    );
  else if (/pushup|push-up/.test(topic) && o.scope === "universal")
    brief = protocol(
      [
        "Use the variation named in the request: wall, incline, knee or floor. Set your hands on a stable surface and keep your trunk aligned.",
        `Complete the stated sets and repetitions: ${workload}. Lower under control and use the same range each repetition. Rest ${o.id === "u-floor-push-20" ? "2–3 minutes" : "60–120 seconds"} between sets; incomplete or shortened repetitions do not meet the target.`,
        "Record each set separately. Stop the set when form changes; the request is complete only when its prescribed volume is achieved.",
      ],
      "Variation, surface height if applicable, repetitions in each set, and rest used.",
    );
  else if (/pullup|pull-up/.test(topic))
    brief = protocol(
      [
        "Use a secure pull-up bar and the exact strict, assisted or weighted variation named in the request.",
        `Complete ${workload} using controlled full-range repetitions without kipping. Rest 2–3 minutes between demanding sets and log every set.`,
        "For a strict or weighted achievement, assistance or a different load does not count as the same outcome. Retain the dated preparation record for higher ranks.",
      ],
      "Grip, assistance or added load, repetitions per set, and the dated preparation sessions.",
    );
  else if (
    /core|dead bug|bird dog|plank/.test(topic) &&
    o.scope === "universal"
  )
    brief = protocol(
      [
        "Use a clear floor space. For a dead bug, lower the opposite arm and leg slowly while keeping the trunk stable; shorten the reach if control changes.",
        "Complete the listed repetitions or holds on both sides. Count only controlled repetitions; rest 30–60 seconds between sets or sides.",
        "For a circuit, finish each named movement before starting the next round. Record repetitions per side and hold duration separately.",
      ],
      "Movement variation, sets, repetitions per side or hold seconds, and a control/form note.",
    );
  else if (
    /hinge|squat|strength|carry|lift|warrior commission/.test(topic) &&
    ["STR", "CON"].includes(o.stat)
  )
    brief = protocol(
      [
        "Choose the exact movement or approved variation in the commission. Warm up with an easy version and keep the surface or load setup consistent.",
        "Complete the stated sets, repetition range or carry duration. Use controlled movement, rest between sets, and leave about two clean repetitions in reserve during ordinary training.",
        "Record the actual result for every set. Increase only one training variable at a time; a harder variation is a new comparison, not extra repetitions on the old one.",
      ],
      "Exercise/variation, load in your chosen units, sets × repetitions or carry distance/time, and effort.",
    );
  else if (
    /subnet|network|routing|switch|packet tracer|ccna/.test(topic) &&
    (o.scope === "profession" || o.careerCategory === "technology")
  ) {
    brief = /subnet/.test(topic)
      ? protocol(
          [
            "Pick practice networks at your current level. Work out the subnet mask, network address, broadcast address and usable host range without an answer key.",
            "Check each result against a subnet calculator or trusted answer key. Redo each incorrect problem from a blank page and explain which bit boundary was wrong.",
            "Complete the quantity or study duration stated in this request. Keep the original attempts and corrected answers together.",
          ],
          "Question set, correct/attempted count, corrections and the next subnet range to review.",
        )
      : protocol(
          [
            "Use a personal lab or simulator such as Packet Tracer. Write a small topology with two end hosts and the switching/routing feature named in the request.",
            "Configure the feature, then verify addressing, reachability and the relevant table or show-command output. Introduce one reversible fault and locate it with a test.",
            "Save the configuration and the successful verification output. For a credential milestone, record the earned certification and issuer as well as preparation.",
          ],
          "Topology/configuration file, verification commands and outputs, fault found and correction; credential details when required.",
        );
  } else if (
    /sql|spreadsheet|dataset|analysis|chart/.test(topic) &&
    o.scope === "profession"
  )
    brief = protocol(
      [
        "Use a public or fictional dataset and write the decision or question you are answering. Note the column meanings and expected output.",
        /sql/.test(topic)
          ? "Write the requested query, inspect a small manual sample, and verify row counts, missing values and any joins or aggregations."
          : /chart/.test(topic)
            ? "Choose a chart that answers the question. Label units, check the source values and write a conclusion supported by the plotted data."
            : "Complete the requested cleaning, formula or analysis step. Check at least a small manual sample and identify missing values or inconsistent units.",
        "Save the working file/query and a short result note. Include one limitation and one correction supported by your checks.",
      ],
      "Question, working dataset/query/file, validation result and a short finding with limitations.",
    );
  else if (o.scope === "profession") {
    const category = o.careerCategory || careerCategory(c.profession).id;
    const index = Number(/career-[a-z-]+-(\d+)/.exec(o.id)?.[1] || 0);
    const guide =
      CAREER_GUIDES[category]?.[index % 10] ||
      "Define a bounded work sample and the result it must produce.";
    brief = /application|job-search/.test(topic)
      ? protocol(
          [
            "Choose a specific open role and compare its required skills with your documented experience. Note any essential requirement you cannot honestly meet.",
            "Tailor one relevant resume section and example of work to that role, or make the portfolio improvement named in the request. Check names, dates and contact details.",
            "Submit the application when that is the requested outcome. Record the employer, role, posting link and submission date, or the finished portfolio revision.",
          ],
          "Role/employer and link, submitted document version, submission date or completed portfolio revision.",
        )
      : protocol(
          [
            guide,
            "Use the specific case, document or practical exercise named in the request. Define its expected output before beginning and work for the stated session length.",
            "Check the output against the source, rubric or test case. Save the deliverable with one corrected error and one next step; a timer alone does not demonstrate completion.",
          ],
          "Deliverable or case, expected result, check performed, correction and dated practice log.",
        );
  } else if (/bible|scripture|passage/.test(topic))
    brief = protocol(
      [
        "Choose the passage or reading amount named in the request. Read the surrounding paragraph or chapter; identify the speaker, audience and immediate context.",
        "Close the text and summarize its main point in your own words. Reopen it and attach verse references to the points you can support; correct any unsupported assumption.",
        "Complete the requested reflection or prayer, and write one practical application to revisit. For a multi-day goal, keep a dated passage/summary entry on each practice day.",
      ],
      "Book/chapter or passage, a brief checked summary, supporting references and one application.",
    );
  else if (/prayer/.test(topic))
    brief = protocol(
      [
        "Set aside the uninterrupted prayer time named in the commission. Choose a specific person, concern or point of thanksgiving to pray about.",
        "Complete the stated time in Christian prayer. If the commission also names an act of service, complete that action as part of the request.",
        "Briefly review the concern and any practical action you intend to take. For a repeated goal, complete each required practice day separately.",
      ],
      "Date, prayer duration and an optional private focus or follow-through action.",
    );
  else if (/walk|run|jog|cycling|stair|hike/.test(topic))
    brief = protocol(
      [
        "Use a familiar safe route or the equipment named in the request. Record the route or machine and begin with an easy warm-up.",
        `Complete the prescribed time, distance or intervals: ${workload}. For an ordinary aerobic session, keep a sustainable pace where conversation is possible; follow the exact interval or assessed-distance target when one is specified.`,
        o.participants === "group"
          ? "For a group quest, agree the route and pace together, check in with the group, and record your own participation and the shared result."
          : "Finish with easy movement, then record actual elapsed time, distance and effort. For a repeated goal, log each qualifying day rather than claiming a whole week from one long session.",
      ],
      "Route/activity, duration, distance, effort and date; group role/communication when required.",
    );
  else if (o.stat === "DEX")
    brief = protocol(
      [
        "Set up the named drill beside stable support. Keep target size, spacing, leg/hand choice and footwear consistent for comparison.",
        "Complete the stated rounds or duration slowly enough to preserve accurate placement. Count correct repetitions or controlled hold seconds; rest between attempts.",
        "Review one attempt, correct the least controlled part, and repeat an easy round. Record the setup so you can reproduce it next time.",
      ],
      "Drill/setup, accurate repetitions or hold time per round, and one technique correction.",
    );
  else if (o.stat === "CHA")
    brief = protocol(
      [
        o.participants === "group"
          ? "Agree on the specific conversation, shared activity or presentation and your part in it before beginning."
          : "Choose one topic and intended listener. Complete the named solo recording, listening or writing exercise; give the explanation a clear main point and example.",
        o.participants === "group"
          ? "Contribute the action named in the request. Ask an open question, listen without interrupting, and check that you understood the other person's point."
          : "Review the output for clarity, structure and pace. Identify a concrete unclear phrase or missing detail and produce a corrected version.",
        "Keep a short outcome note. Record the revised explanation or the agreed next action, rather than judging the session only by how confident you felt.",
      ],
      "Topic/context, your completed contribution, feedback or self-review, and one specific revision/next action.",
    );
  else if (o.stat === "WIS")
    brief = protocol(
      [
        "Name the decision, reflection prompt or practical action in the request. Separate what you observed from what you are assuming.",
        "Use a relevant primary source or a concrete recent example. Write the reasons for your choice and one plausible alternative or uncertainty.",
        "Complete the named action and record its outcome or review date. Revisit the result to see whether the reasoning held up.",
      ],
      "Question/situation, evidence, reasoning, action taken and a review date or outcome.",
    );
  else
    brief = protocol(
      [
        "Choose the exact topic or work sample named in the request and identify a source you can check against.",
        "Complete the stated study or practice block. Close the source and explain the main point or solve a fresh example from memory.",
        "Check your result, correct errors and save the explanation or worked example. Schedule another retrieval attempt on a later day for material that was difficult.",
      ],
      "Topic/source, recalled explanation or worked answers, corrections and next review date.",
    );
  const finish = o.once
    ? o.kind === "class-trial"
      ? "Complete the named entry trial and its checklist, then submit it. The trial pays once; the class becomes available when its other entry requirements are also met."
      : "Complete the full named achievement and required evidence/checklist. This request pays once."
    : o.cadence === "daily"
      ? "Finish the full named activity and its stated quantity. Take this request before submitting it; one request group pays once per day."
      : `Finish the stated outcome${sessions ? ` and log qualifying work on ${sessions} different practice days` : ""}${o.minimumDays ? ` across at least ${o.minimumDays} elapsed days in the period` : ""}. Complete its checklist and submit before the ${o.cadence === "weekly" ? "week" : "month"} ends. Existing qualifying work in this calendar period counts after taking the request.`;
  return { ...brief, finish };
}
