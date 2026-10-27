import { useState } from "react";
import { Trees, Compass, Castle } from "lucide-react";
import type { Character } from "./domain";
import type { FieldActions } from "./CareerToolPanels";
import { campaign } from "./rpg";
import { PLACES, WORLD_REGIONS, TOWNS, RESOURCE_NAMES } from "./world-catalog";
import {
  routeFolio,
  deliveryExchange,
  receiptRegister,
  receiptRegisterText,
  townServices,
  forgeOrder,
  departureCheck,
} from "./career-town-tools";
import { exportData } from "./file-export";
import { regionOpen } from "./world-state";
const counted = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;
export default function CareerTownPanels({
  c,
  tool,
  placeId,
  onArea,
  onRequests,
  onShop,
  onTown,
  onParty,
  onLoadout,
}: { c: Character; tool: string; placeId: string } & FieldActions) {
  const [region, setRegion] = useState(
      PLACES.find((p) => p.id === placeId)?.region || "mossfall",
    ),
    [area, setArea] = useState(placeId),
    [town, setTown] = useState(campaign(c).world!.townId),
    [resource, setResource] = useState("all"),
    [days, setDays] = useState<7 | 30 | "all">(30),
    [basket, setBasket] = useState<string[]>([]),
    [notice, setNotice] = useState("");
  const areaButton = (id: string) => (
    <button
      className="field-action"
      onClick={() => onArea?.(id)}
      disabled={!onArea}
    >
      View area
    </button>
  );
  if (tool === "folio") {
    const r = routeFolio(c, region);
    if (!r) return null;
    const selected = r.places.find((p) => p.id === area) || r.places[0];
    return (
      <>
        <label className="field-tool-filter">
          Region
          <select
            aria-label="Folio region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {WORLD_REGIONS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <div
          className={`field-folio biome-${r.biome}`}
          aria-label={`${r.region} route folio`}
        >
          <div className="folio-path" role="group" aria-label="Area sketches">
            {r.places.map((p) => {
              const Icon =
                p.kind === "dungeon"
                  ? Castle
                  : p.kind === "wilds"
                    ? Trees
                    : Compass;
              return (
                <button
                  key={p.id}
                  aria-pressed={p.id === selected.id}
                  className={`folio-node ${p.open ? "open" : "locked"} ${p.cleared ? "cleared" : ""}`}
                  onClick={() => setArea(p.id)}
                >
                  <Icon aria-hidden="true" size={28} />
                  <b>{p.name}</b>
                  <span>
                    {p.cleared
                      ? "Exploration ready"
                      : p.open
                        ? "Route open"
                        : "Locked"}
                  </span>
                  <span>
                    {p.stages}/{p.total} stages
                  </span>
                  <div className="folio-stage-marks" aria-hidden="true">
                    {Array.from({ length: p.total }, (_, i) => (
                      <i key={i} className={i < p.stages ? "complete" : ""} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <article>
          <b>{selected.name}</b>
          <p>
            {counted(selected.visits, "exploration")} ·{" "}
            {counted(selected.landmarks, "landmark")} in retained journal
          </p>
          {selected.open ? (
            areaButton(selected.id)
          ) : (
            <p>
              {r.open
                ? "Clear the preceding route to enter."
                : "Region not yet open."}
            </p>
          )}
        </article>
      </>
    );
  }
  if (tool === "exchange") {
    const services = townServicesForPicker(c),
      r = deliveryExchange(c, town);
    if (!r) return null;
    const resources = [...new Set(r.offers.map((o) => o.resource))];
    return (
      <>
        <label className="field-tool-filter">
          Town
          <select
            aria-label="Exchange town"
            value={town}
            onChange={(e) => {
              setTown(e.target.value);
              setResource("all");
            }}
          >
            {services.map((t) => (
              <option key={t.id} value={t.id} disabled={!t.open}>
                {t.name}
                {!t.open ? " · Locked" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="field-tool-filter">
          Material
          <select
            aria-label="Exchange material"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          >
            <option value="all">All delivery materials</option>
            {resources.map((id) => (
              <option key={id} value={id}>
                {RESOURCE_NAMES[id]}
              </option>
            ))}
          </select>
        </label>
        <small className="field-line">
          Highest gold per required material first. Offers are alternatives; the
          same materials cannot fund every turn-in.
        </small>
        {r.offers
          .filter((o) => resource === "all" || o.resource === resource)
          .map((o) => (
            <article key={o.id}>
              <b>
                {o.title}
                {o.taken ? " · Taken" : ""}
              </b>
              <p>
                {o.gold} gold for {o.quantity} {RESOURCE_NAMES[o.resource]}
                <small className="field-line">
                  {Number(o.perUnit.toFixed(2))} gold per material · {o.carried}{" "}
                  carried · {o.shortfall} short
                </small>
              </p>
              <small className="field-line">
                {o.place} ·{" "}
                {o.sourceOpen ? "Source route open" : "Source route locked"}
              </small>
              {o.restock && (
                <p>
                  Restocks{" "}
                  {Object.entries(o.restock)
                    .map(
                      ([id, n]) =>
                        `${n} ${id === "potion" ? "potions" : "ethers"}`,
                    )
                    .join(", ")}
                </p>
              )}
            </article>
          ))}
        {town === campaign(c).world!.townId ? (
          <button
            className="field-action"
            onClick={onRequests}
            disabled={!onRequests}
          >
            Open guild requests
          </button>
        ) : (
          <button
            className="field-action"
            onClick={() => onTown?.(town, "requests")}
            disabled={!onTown}
          >
            Visit {r.town} guild
          </button>
        )}
      </>
    );
  }
  if (tool === "register") {
    const r = receiptRegister(c, days);
    if (!r) return null;
    return (
      <>
        <label className="field-tool-filter">
          Receipt period
          <select
            aria-label="Register period"
            value={String(days)}
            onChange={(e) =>
              setDays(
                e.target.value === "all"
                  ? "all"
                  : (Number(e.target.value) as 7 | 30),
              )
            }
          >
            <option value="7">Last 7 calendar days</option>
            <option value="30">Last 30 calendar days</option>
            <option value="all">All retained receipts</option>
          </select>
        </label>
        <article>
          <b>{r.total} gold received</b>
          <p>
            {counted(r.entries.length, "turn-in")} ·{" "}
            {counted(r.commissions, "commission type")}
          </p>
          <small className="field-line">
            Adventure commission income. Spending and other rewards are
            excluded.
          </small>
          {r.towns.map((t) => (
            <p key={t.id}>
              {t.name}: {t.gold} gold · {counted(t.count, "turn-in")}
            </p>
          ))}
        </article>
        {r.entries.slice(0, 10).map((e) => (
          <article key={e.id}>
            <b>{e.title}</b>
            <p>
              {e.gold} gold · {e.town}
              <small className="field-line">
                <time dateTime={e.at}>{new Date(e.at).toLocaleString()}</time>
              </small>
            </p>
            <small className="field-line">Receipt {e.id}</small>
          </article>
        ))}
        {!r.entries.length && <p>No commission receipts in this period.</p>}
        {r.entries.length > 10 && (
          <p>
            Showing 10 of {r.entries.length}. Export includes this entire
            period.
          </p>
        )}
        <button
          className="field-action"
          disabled={!r.entries.length}
          onClick={async () => {
            try {
              await exportData(
                receiptRegisterText(c, days)!,
                "guild-commission-receipts.txt",
                "Guild commission receipts",
              );
              setNotice("Receipt register exported.");
            } catch {
              setNotice("Export failed. Try again.");
            }
          }}
        >
          Export receipts
        </button>
        {notice && <p role="status">{notice}</p>}
      </>
    );
  }
  if (tool === "concierge") {
    const rows = townServices(c);
    if (!rows) return null;
    const selected = rows.find((t) => t.id === town) || rows[0];
    return (
      <>
        <label className="field-tool-filter">
          Town
          <select
            aria-label="Concierge town"
            value={selected.id}
            onChange={(e) => setTown(e.target.value)}
          >
            {rows.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.current ? " · Here" : !t.open ? " · Locked" : ""}
              </option>
            ))}
          </select>
        </label>
        <article>
          <b>
            {selected.name} ·{" "}
            {selected.open
              ? selected.current
                ? "Here"
                : "Travel open"
              : "Locked"}
          </b>
          <p>{selected.description}</p>
          <p>
            General store
            <small className="field-line">
              {selected.stock.potion || 0} potions · {selected.prices.potion}{" "}
              gold each
            </small>
            <small className="field-line">
              {selected.stock.ether || 0} ethers · {selected.prices.ether} gold
              each
            </small>
          </p>
          <p>
            Blacksmith · Tier {selected.smith}
            <small className="field-line">
              {selected.crafts.length} recipes · Uses{" "}
              {RESOURCE_NAMES[selected.ore]}
            </small>
          </p>
        </article>
        <details>
          <summary>
            Store restocking commissions · {selected.restocking.length}
          </summary>
          {selected.restocking.map((r) => (
            <p key={r.id}>
              {r.title}
              <small className="field-line">
                {Object.entries(r.restock)
                  .map(
                    ([id, n]) =>
                      `${n} ${id === "potion" ? "potions" : "ethers"}`,
                  )
                  .join(", ")}
              </small>
            </p>
          ))}
        </details>
        <button
          className="field-action"
          disabled={!selected.open || !onTown}
          onClick={() => onTown?.(selected.id)}
        >
          {selected.current ? "Open town shops" : `Visit ${selected.name}`}
        </button>
      </>
    );
  }
  if (tool === "work-order") {
    const r = forgeOrder(c, basket);
    if (!r) return null;
    return (
      <>
        <p>
          {r.town} · {r.gold} gold
        </p>
        <fieldset className="forge-options">
          <legend>Crafting basket</legend>
          {r.options.map((g) => (
            <label key={g.id}>
              <input
                type="checkbox"
                aria-label={`Plan ${g.name}`}
                checked={basket.includes(g.id)}
                disabled={g.owned}
                onChange={(e) =>
                  setBasket(
                    e.target.checked
                      ? [...basket, g.id]
                      : basket.filter((id) => id !== g.id),
                  )
                }
              />
              <span>
                {g.name}
                {g.owned ? " · Owned" : ""}
                <small className="field-line">
                  {g.price} gold · {g.quantity} {RESOURCE_NAMES[g.material]}
                </small>
              </span>
            </label>
          ))}
        </fieldset>
        <article aria-live="polite">
          <b>
            {counted(r.items.length, "planned craft")} · {r.total} gold
          </b>
          <p>
            {r.shortfall
              ? `${r.shortfall} gold short`
              : `${r.remaining} gold remaining`}
          </p>
          {r.materials.map((m) => (
            <p key={m.id}>
              {RESOURCE_NAMES[m.id]}: {m.needed} required · {m.carried} carried
              · {m.shortfall} short
            </p>
          ))}
          <small className="field-line">
            {!r.items.length
              ? "Select equipment to total its costs."
              : r.ready
                ? "All planned costs covered"
                : "More gold or materials needed"}
          </small>
        </article>
        {r.materials
          .filter((m) => m.shortfall > 0)
          .map((m) => (
            <details key={m.id}>
              <summary>{RESOURCE_NAMES[m.id]} sources</summary>
              {m.routes.map((p) => (
                <div className="field-route" key={p.id}>
                  <span>
                    {p.name}
                    <small className="field-line">
                      {p.ready
                        ? "Exploration ready"
                        : `${p.stages}/${p.total} stages cleared`}
                    </small>
                  </span>
                  {areaButton(p.id)}
                </div>
              ))}
              {!m.routes.length && <p>No accessible source.</p>}
            </details>
          ))}
        <button className="field-action" onClick={onShop} disabled={!onShop}>
          Open blacksmith
        </button>
      </>
    );
  }
  if (tool === "departure") {
    const r = departureCheck(c, placeId);
    if (!r) return null;
    return (
      <>
        <article>
          <b>
            {r.name} · {r.mode}
          </b>
          <p>
            {r.remaining} stages remaining · {counted(r.potion, "potion")} ·{" "}
            {counted(r.ether, "ether")}
          </p>
          <p>
            {r.canDepart
              ? "Living party member available"
              : "Party cannot depart"}
          </p>
          {r.fallen.length > 0 && <p>Fallen: {r.fallen.join(", ")}</p>}
          {r.lowHp.length > 0 && <p>Below 25% HP: {r.lowHp.join(", ")}</p>}
          {r.unusable.length > 0 && (
            <p>
              Insufficient MP for at least one ability: {r.unusable.join(", ")}
            </p>
          )}
          <p>
            {r.skillCount} learned skills equipped
            <small className="field-line">
              Class signature is available separately. Check loadout for learned
              combat skills.
            </small>
          </p>
          {r.pendingBoss && <p>Roaming boss nearby · Ambush risk remains.</p>}
        </article>
        <article>
          <b>{counted(r.taken.length, "accepted local commission")}</b>
          {r.taken.map((q) => (
            <p key={q.id}>
              {q.title}
              <small className="field-line">
                {q.progress}/{q.quantity}
              </small>
            </p>
          ))}
          {!r.taken.length && <p>No local commission taken.</p>}
        </article>
        <div className="field-route">
          {areaButton(r.id)}
          <button
            className="field-action"
            onClick={onParty}
            disabled={!onParty}
          >
            Open party
          </button>
          <button
            className="field-action"
            onClick={onLoadout}
            disabled={!onLoadout}
          >
            Open skill loadout
          </button>
          <button
            className="field-action"
            onClick={onRequests}
            disabled={!onRequests}
          >
            Open guild requests
          </button>
        </div>
      </>
    );
  }
  return null;
}
// The exchange’s picker does not require ownership of the separate Hospitality tool.
function townServicesForPicker(c: Character) {
  const data = campaign(c);
  return TOWNS.map((t) => ({ ...t, open: regionOpen(data, t.region) }));
}
