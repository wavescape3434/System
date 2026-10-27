import { useState } from "react";
import type { Character } from "./domain";
import { RESOURCE_NAMES } from "./world-catalog";
import {
  guildDocket,
  deliveryManifest,
  resourceAtlas,
  equipmentAppraisal,
  dangerWatch,
  supplyPlan,
} from "./career-field-tools";
export interface FieldActions {
  onArea?: (id: string) => void;
  onRequests?: () => void;
  onShop?: () => void;
}
export default function CareerToolPanels({
  c,
  tool,
  onArea,
  onRequests,
  onShop,
}: { c: Character; tool: string } & FieldActions) {
  const [resource, setResource] = useState("all"),
    [gearSelection, setGearSelection] = useState(""),
    [counts, setCounts] = useState({ potion: "0", ether: "0" });
  const areaButton = (id: string) => (
    <button
      className="field-action"
      onClick={() => onArea?.(id)}
      disabled={!onArea}
    >
      View area
    </button>
  );
  const route = (r: {
    id: string;
    name: string;
    ready: boolean;
    stages: number;
    total: number;
  }) => (
    <div className="field-route" key={r.id}>
      <span>
        {r.name}
        <small>
          {r.ready
            ? "Exploration ready"
            : `${r.stages}/${r.total} stages · Clear route to explore`}
        </small>
      </span>
      {areaButton(r.id)}
    </div>
  );
  if (tool === "docket") {
    const rows = guildDocket(c);
    if (!rows) return null;
    return (
      <>
        <p>{rows.length} accepted commissions</p>
        {!rows.length && <p>No adventure commissions taken.</p>}
        {rows.map((r) => (
          <article key={r.id}>
            <b>{r.title}</b>
            <p>{r.description}</p>
            <p>
              {r.progress}/{r.quantity} · {r.gold} gold on turn-in
            </p>
            <small>
              {r.canReport
                ? "Ready to report here"
                : r.remaining === 0
                  ? `Report at ${r.townName}`
                  : `${r.remaining} remaining · ${r.placeName}`}{" "}
              · {r.townName}
            </small>
          </article>
        ))}
        <button
          className="field-action"
          onClick={onRequests}
          disabled={!onRequests}
        >
          Open guild requests
        </button>
      </>
    );
  }
  if (tool === "manifest") {
    const rows = deliveryManifest(c);
    if (!rows) return null;
    return (
      <>
        {!rows.length && <p>No accepted delivery commissions.</p>}
        {rows.map((r) => (
          <article key={r.resource}>
            <b>{RESOURCE_NAMES[r.resource]}</b>
            <p>
              {r.carried} carried · {r.needed} needed · {r.shortfall} short
            </p>
            {r.requests.map((q) => (
              <small className="field-line" key={q.id}>
                {q.title} · {q.town}
              </small>
            ))}
            {r.routes.map(route)}
            {!r.routes.length && <p>No accessible source recorded.</p>}
          </article>
        ))}
        <button
          className="field-action"
          onClick={onRequests}
          disabled={!onRequests}
        >
          Open guild requests
        </button>
      </>
    );
  }
  if (tool === "atlas") {
    const rows = resourceAtlas(c);
    if (!rows) return null;
    return (
      <>
        <label className="field-tool-filter">
          Resource
          <select
            aria-label="Atlas resource"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          >
            <option value="all">All accessible resources</option>
            {rows.map((r) => (
              <option key={r.resource} value={r.resource}>
                {RESOURCE_NAMES[r.resource]}
              </option>
            ))}
          </select>
        </label>
        {rows
          .filter((r) => resource === "all" || resource === r.resource)
          .map((r) => (
            <article key={r.resource}>
              <b>
                {RESOURCE_NAMES[r.resource]} · {r.carried} carried
              </b>
              {r.routes.map(route)}
            </article>
          ))}
      </>
    );
  }
  if (tool === "appraisal") {
    const report = equipmentAppraisal(c);
    if (!report) return null;
    const selected =
      report.items.find((g) => g.id === gearSelection) ||
      report.items.find((g) => !g.equipped) ||
      report.items[0];
    return (
      <>
        <p>
          {report.town} · Smith tier {report.smith}
        </p>
        <label className="field-tool-filter">
          Equipment
          <select
            aria-label="Appraisal equipment"
            value={selected.id}
            onChange={(e) => setGearSelection(e.target.value)}
          >
            {report.items.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.equipped ? " · Equipped" : g.owned ? " · Owned" : ""}
              </option>
            ))}
          </select>
        </label>
        {[selected].map((g) => (
          <article key={g.id}>
            <b>
              {g.name}
              {g.equipped ? " · Equipped" : g.owned ? " · Owned" : ""}
            </b>
            <p>Replaces: {g.replaces}</p>
            <div className="field-stat-deltas">
              {Object.entries(g.changes)
                .filter(([, n]) => n !== 0)
                .map(([stat, n]) => (
                  <span className={n < 0 ? "negative" : "positive"} key={stat}>
                    {n > 0 ? "+" : ""}
                    {n} {stat}
                  </span>
                ))}
            </div>
            <small>Combat modifiers only</small>
            {!g.owned && (
              <p>
                {g.price} gold · {g.quantity} {RESOURCE_NAMES[g.material]}
                <br />
                {g.goldShortfall} gold short · {g.materialShortfall}{" "}
                {RESOURCE_NAMES[g.material]} short
              </p>
            )}
          </article>
        ))}
        <button className="field-action" onClick={onShop} disabled={!onShop}>
          Open blacksmith
        </button>
      </>
    );
  }
  if (tool === "watch") {
    const rows = dangerWatch(c);
    if (!rows) return null;
    return (
      <>
        {!rows.length && <p>No cleared exploration routes.</p>}
        {rows.map((r) => (
          <article key={r.id}>
            <b>{r.name}</b>
            <p>
              {r.pending
                ? "Boss nearby · Next exploration ambush"
                : "Next exploration boss discovery"}
              : {Math.round(r.chance * 100)}%
            </p>
            <small>
              {r.chance === 1
                ? "Guaranteed on the next exploration"
                : `Guaranteed within ${r.untilGuaranteed} more explorations if no earlier boss`}
            </small>
            <p>
              {r.visits} explorations
              {r.pending ? ` · ${r.ignored} ignored visits` : ""}
            </p>
            {areaButton(r.id)}
          </article>
        ))}
      </>
    );
  }
  if (tool === "treasury") {
    const parsed = {
        potion: counts.potion.trim() ? Number(counts.potion) : NaN,
        ether: counts.ether.trim() ? Number(counts.ether) : NaN,
      },
      plan = supplyPlan(c, parsed);
    if (!plan) return null;
    return (
      <>
        <p>
          {plan.town} · {plan.gold} gold
        </p>
        <div className="field-budget-inputs">
          {(["potion", "ether"] as const).map((id) => (
            <label key={id}>
              {id === "potion" ? "Healing potions" : "Ethers"}
              <input
                aria-label={
                  id === "potion" ? "Planned potions" : "Planned ethers"
                }
                type="number"
                inputMode="numeric"
                min="0"
                max="9999"
                step="1"
                value={counts[id]}
                onChange={(e) => setCounts({ ...counts, [id]: e.target.value })}
              />
              <small>
                {plan.prices[id]} gold each · {plan.stock[id] || 0} in stock
              </small>
            </label>
          ))}
        </div>
        {!plan.valid ? (
          <p role="alert">Enter whole quantities from 0 to 9999.</p>
        ) : (
          <article aria-live="polite">
            <b>Basket: {plan.total} gold</b>
            <p>
              {plan.shortfall
                ? `${plan.shortfall} gold short`
                : `${plan.remaining} gold remaining`}
            </p>
            <p>
              {plan.stockShortage.length
                ? `Insufficient stock: ${plan.stockShortage.map((id) => (id === "potion" ? "healing potions" : "ethers")).join(", ")}`
                : plan.available
                  ? "Within budget and current stock"
                  : ""}
            </p>
          </article>
        )}
        <button className="field-action" onClick={onShop} disabled={!onShop}>
          Open general store
        </button>
      </>
    );
  }
  return null;
}
