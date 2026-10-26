import type { Character } from "./domain";
import {
  supplyLedger,
  stageDiagnostics,
  hasCareerUtility,
} from "./career-payoffs";
import { RESOURCE_NAMES } from "./world-catalog";
export default function CareerFieldwork({
  c,
  placeId,
}: {
  c: Character;
  placeId: string;
}) {
  const ledger = supplyLedger(c),
    diagnostics = stageDiagnostics(c, placeId);
  if (!ledger && !hasCareerUtility(c, "diagnostics")) return null;
  return (
    <section
      className="pixel-window career-fieldwork"
      aria-label="Career fieldwork"
    >
      <h3>Fieldwork</h3>
      {ledger && (
        <details>
          <summary>Quartermaster’s Ledger · {ledger.town}</summary>
          <p>
            Healing potions: {ledger.stock.potion || 0} · Ethers:{" "}
            {ledger.stock.ether || 0}
          </p>
          {ledger.deliveries.map((r) => (
            <article key={r.id}>
              <b>{r.title}</b>
              <p>
                {r.kind === "delivery"
                  ? `${r.quantity} ${RESOURCE_NAMES[r.resource!] || r.resource}`
                  : r.description}
              </p>
              <p>
                Restocks{" "}
                {Object.entries(r.restock!)
                  .map(
                    ([id, n]) =>
                      `${n} ${id === "potion" ? "potions" : "ethers"}`,
                  )
                  .join(", ")}
              </p>
              <small>
                {r.routes.length
                  ? `${r.kind === "delivery" ? "Gather" : r.kind === "hunt" ? "Hunt" : "Travel"} at ${r.routes.join(", ")}`
                  : "No route currently open."}
              </small>
            </article>
          ))}
        </details>
      )}
      {hasCareerUtility(c, "diagnostics") && (
        <details>
          <summary>Warden’s Diagnostics</summary>
          {diagnostics ? (
            <div className="diagnostic-grid">
              {diagnostics.enemies.map((e) => (
                <article key={e.id}>
                  <b>{e.name}</b>
                  <p>
                    HP {e.maxHp} · ATK {e.attack} · DEF {e.defense}
                  </p>
                  <small>
                    {[
                      e.shell ? `Shell: ${e.shell} hits` : "",
                      e.chargeEvery
                        ? `Heavy attack every ${e.chargeEvery} turns`
                        : "",
                      e.cleave ? "Party-wide strike" : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No special pattern recorded."}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <p>No uncleared stage available here.</p>
          )}
        </details>
      )}
    </section>
  );
}
