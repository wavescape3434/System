import type { Character } from "./domain";
import { deliveryCost } from "./delivery-cost";
import { RESOURCE_NAMES } from "./world-catalog";
export default function DeliveryCost({ c, id }: { c: Character; id: string }) {
  const cost = deliveryCost(c, id);
  if (!cost) return null;
  return (
    <div className="delivery-cost">
      <b>
        Turn-in: {cost.quantity} {RESOURCE_NAMES[cost.resource]}
      </b>
      <small>
        {cost.carried} carried → {cost.after} remaining
        {cost.shortfall ? ` · ${cost.shortfall} short` : ""}
      </small>
      {cost.affected.length > 0 && (
        <details>
          <summary>Smith recipes affected · {cost.affected.length}</summary>
          {cost.affected.map((g) => (
            <small key={g.id}>
              {g.name} · {g.quantity} {RESOURCE_NAMES[cost.resource]} required
            </small>
          ))}
        </details>
      )}
      {cost.workshopAffected.length > 0 && (
        <details>
          <summary>
            Workshop uses affected · {cost.workshopAffected.length}
          </summary>
          {cost.workshopAffected.map((g) => (
            <small key={g.id}>
              {g.name} · {g.quantity} {RESOURCE_NAMES[cost.resource]} required
            </small>
          ))}
        </details>
      )}
    </div>
  );
}
