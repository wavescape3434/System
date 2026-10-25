import type { Character, Objective } from "./domain";
import { requestBrief } from "./request-brief";
export default function RequestInstructions({
  objective,
  c,
}: {
  objective: Objective;
  c: Character;
}) {
  const brief = requestBrief(objective, c);
  return (
    <section className="request-instructions">
      <h3>Commission</h3>
      <p>{objective.description}</p>
      <h3>Instructions</h3>
      <ol>
        {brief.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="request-record">
        <h3>Suggested record</h3>
        <p>{brief.record}</p>
      </div>
      <h3>Completion</h3>
      <p>{brief.finish}</p>
    </section>
  );
}
