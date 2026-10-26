import type { Character } from "./domain";
import { adventureParty } from "./rpg";
export default function PartyResources({ c }: { c: Character }) {
  const party = adventureParty(c);
  return (
    <section className="party-resources" aria-label="Expedition resources">
      <div className="resource-heading">
        <b>Party reserves</b>
        <span>Full recovery at 12:00 AM · local time</span>
      </div>
      <div className="resource-members">
        {party.map((u) => (
          <div key={u.id}>
            <b>{u.name}</b>
            <span className={u.hp === 0 ? "resource-down" : ""}>
              {u.hp}/{u.maxHp} HP
            </span>
            <span>
              {u.mp}/{u.maxMp} MP
            </span>
          </div>
        ))}
      </div>
      {party.every((u) => u.hp === 0) && (
        <p role="status">
          Party exhausted. Recover at midnight or bring a rested companion.
        </p>
      )}
    </section>
  );
}
