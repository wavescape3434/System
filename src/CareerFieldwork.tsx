import { useState } from "react";
import { careerCategory } from "./careers";
import CareerTownPanels from "./CareerTownPanels";
import CareerServicePanels from "./CareerServicePanels";
import CareerToolPanels from "./CareerToolPanels";
import type { FieldActions } from "./CareerToolPanels";
import type { Character } from "./domain";
import {
  supplyLedger,
  stageDiagnostics,
  hasCareerUtility,
  CAREER_UTILITIES,
} from "./career-payoffs";
import { RESOURCE_NAMES } from "./world-catalog";
export default function CareerFieldwork({
  c,
  placeId,
  initialTool,
  onArea,
  onRequests,
  onShop,
  onTown,
  onParty,
  onLoadout,
}: {
  c: Character;
  placeId: string;
  initialTool?: string;
} & FieldActions) {
  const available = CAREER_UTILITIES.filter((u) => hasCareerUtility(c, u.id));
  const [selection, setSelection] = useState(
    initialTool ||
      available.find((u) => u.category === careerCategory(c.profession).id)
        ?.id ||
      available[0]?.id ||
      "",
  );
  const selected = available.find((u) => u.id === selection) || available[0];
  if (!selected) return null;
  const ledger = selected.id === "ledger" ? supplyLedger(c) : null,
    diagnostics =
      selected.id === "diagnostics" ? stageDiagnostics(c, placeId) : null;
  return (
    <section
      className="pixel-window career-fieldwork"
      aria-label="Career fieldwork"
    >
      <div className="field-desk-heading">
        <h3>Fieldwork</h3>
        <span>{available.length} learned</span>
      </div>
      <label className="field-tool-filter">
        Competency
        <select
          aria-label="Field competency"
          value={selected.id}
          onChange={(e) => setSelection(e.target.value)}
        >
          {available.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </label>
      <h4>{selected.name}</h4>
      {ledger && (
        <div className="field-tool-body">
          <p>{ledger.town}</p>
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
        </div>
      )}
      {selected.id === "diagnostics" && (
        <div className="field-tool-body">
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
        </div>
      )}
      <CareerTownPanels
        key={`town:${selected.id}`}
        c={c}
        tool={selected.id}
        placeId={placeId}
        onArea={onArea}
        onRequests={onRequests}
        onShop={onShop}
        onTown={onTown}
        onParty={onParty}
        onLoadout={onLoadout}
      />
      <CareerServicePanels
        key={`service:${selected.id}`}
        c={c}
        tool={selected.id}
        placeId={placeId}
        onArea={onArea}
        onRequests={onRequests}
        onShop={onShop}
        onParty={onParty}
        onLoadout={onLoadout}
      />
      <CareerToolPanels
        key={selected.id}
        c={c}
        tool={selected.id}
        onArea={onArea}
        onRequests={onRequests}
        onShop={onShop}
      />
    </section>
  );
}
