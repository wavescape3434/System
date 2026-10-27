import { useState } from "react";
import type { Character } from "./domain";
import type { FieldActions } from "./CareerToolPanels";
import { PLACES, WORLD_CONTRACTS, RESOURCE_NAMES } from "./world-catalog";
import { campaign } from "./rpg";
import { exportData } from "./file-export";
import {
  routePlan,
  fieldRecord,
  fieldRecordText,
  recoveryTriage,
  battlePrimer,
  contractWrit,
  companionServices,
} from "./career-service-tools";

export default function CareerServicePanels({
  c,
  tool,
  placeId,
  onArea,
  onRequests,
  onShop,
  onParty,
  onLoadout,
}: { c: Character; tool: string; placeId: string } & FieldActions) {
  const [area, setArea] = useState(placeId),
    [contract, setContract] = useState(""),
    [companion, setCompanion] = useState(""),
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
  if (tool === "route-plan") {
    const report = routePlan(c, area);
    if (!report) return null;
    return (
      <>
        <label className="field-tool-filter">
          Destination
          <select
            aria-label="Route destination"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <article>
          <b>
            {report.target} · {report.open ? "Open" : "Locked"}
          </b>
          <p>
            {report.remaining} prerequisite stage battles ·{" "}
            {report.targetRemaining} stages in destination
          </p>
          {report.steps.map((p, i) => (
            <div className="field-route" key={p.id}>
              <span>
                {i + 1}. {p.name}
                <small className="field-line">
                  {p.remaining} stages remaining ·{" "}
                  {p.open ? "Reachable now" : "After earlier routes"}
                </small>
              </span>
            </div>
          ))}
          {report.next && (
            <div className="field-route">
              <span>
                Next route: {PLACES.find((p) => p.id === report.next)!.name}
              </span>
              {areaButton(report.next)}
            </div>
          )}
        </article>
      </>
    );
  }
  if (tool === "field-record") {
    const report = fieldRecord(c, area === "all" ? undefined : area);
    if (!report) return null;
    return (
      <>
        <label className="field-tool-filter">
          Area
          <select
            aria-label="Field record area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            <option value="all">All recorded areas</option>
            {PLACES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <article>
          <b>
            {report.total} recorded exploration{report.total === 1 ? "" : "s"}
          </b>
          <small className="field-line">
            Matching entries from the last {report.recordLimit} journal records.
            Observed counts, not drop probabilities.
          </small>
          <div className="field-stat-deltas">
            {Object.entries(report.outcomes).map(([kind, count]) => (
              <span key={kind}>
                {kind}: {count}
              </span>
            ))}
          </div>
        </article>
        <article>
          <b>Confirmed defeats · Lifetime</b>
          {report.creatures.length ? (
            report.creatures.map((e) => (
              <p key={`${e.placeId}:${e.id}`}>
                {e.name}: {e.count}
                <small className="field-line">{e.place}</small>
              </p>
            ))
          ) : (
            <p>No confirmed defeats in this area.</p>
          )}
        </article>
        <article>
          <b>Materials · Journal records</b>
          {report.gathered.length ? (
            report.gathered.map((g) => (
              <p key={g.id}>
                {g.name}: {g.count}
              </p>
            ))
          ) : (
            <p>No material finds recorded.</p>
          )}
        </article>
        <button
          className="field-action"
          onClick={async () => {
            try {
              await exportData(
                fieldRecordText(c, area === "all" ? undefined : area)!,
                "guild-field-record.txt",
                "Guild field record",
              );
              setNotice("Field record exported.");
            } catch {
              setNotice("Export failed. Try again.");
            }
          }}
        >
          Export field record
        </button>
        {notice && <p role="status">{notice}</p>}
      </>
    );
  }
  if (tool === "triage") {
    const report = recoveryTriage(c);
    if (!report) return null;
    return (
      <>
        <p>
          {report.inventory.potion} potions · {report.inventory.ether} ethers
          carried
        </p>
        {report.brewed.map((item) => (
          <p key={item.id}>
            {item.name} ×{item.carried}
          </p>
        ))}
        <p>
          Next full rest:{" "}
          <time dateTime={report.nextRest}>
            {new Date(report.nextRest).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
        </p>
        {report.members.map((u) => (
          <article key={u.id}>
            <b>
              {u.name} · {u.alive ? "Active" : "Fallen"}
            </b>
            <p>
              HP {u.hp}/{u.maxHp} · MP {u.mp}/{u.maxMp}
            </p>
            {u.alive ? (
              <>
                <p>
                  One potion: +{u.potion} HP · {u.potionWaste} unused
                </p>
                <p>
                  One ether: +{u.ether} MP · {u.etherWaste} unused
                </p>
                {u.brewed.map((item) => (
                  <p key={item.id}>
                    {item.name}: +{item.recovery} {item.resource} ·{" "}
                    {item.unused} unused
                  </p>
                ))}
              </>
            ) : (
              <p>Potions and ethers cannot revive. Recovers at midnight.</p>
            )}
          </article>
        ))}
        <div className="field-route">
          <button
            className="field-action"
            onClick={onParty}
            disabled={!onParty}
          >
            Open party
          </button>
          <button className="field-action" onClick={onShop} disabled={!onShop}>
            Open general store
          </button>
        </div>
      </>
    );
  }
  if (tool === "battle-primer") {
    const report = battlePrimer(c, placeId);
    if (!report) return <p>No uncleared stage available in this area.</p>;
    const ability = (a: (typeof report.breakers)[number]) => (
      <p key={`${a.actor}:${a.id}`}>
        {a.name} · {a.actor}
        <small className="field-line">
          {a.mp} MP ·{" "}
          {!a.alive
            ? "Actor fallen"
            : a.available
              ? "Ready"
              : a.shortfall
                ? `${a.shortfall} MP short`
                : "Actor fallen"}
        </small>
      </p>
    );
    return (
      <>
        <article>
          <b>{report.name}</b>
          {report.enemies.map((e) => (
            <p key={e.id}>
              {e.name}
              <small className="field-line">
                {e.shell ? `${e.shell} shell layers` : "No shell"} ·{" "}
                {e.heavyEvery
                  ? `Heavy attack every ${e.heavyEvery} rounds`
                  : "No scheduled heavy attack"}
                {e.cleave ? " · Heavy attack hits whole party" : ""}
              </small>
            </p>
          ))}
        </article>
        <article>
          <b>Equipped shell breakers</b>
          {report.breakers.length ? (
            report.breakers.map(ability)
          ) : (
            <p>None equipped. Ordinary hits chip one layer.</p>
          )}
        </article>
        <article>
          <b>Equipped defenses</b>
          {report.guards.map(ability)}
          <p>
            Guard · Every living party member
            <small className="field-line">
              Reduces damage during the next enemy volley; restores 3 MP.
            </small>
          </p>
        </article>
        <button
          className="field-action"
          onClick={onLoadout}
          disabled={!onLoadout}
        >
          Open skill loadout
        </button>
      </>
    );
  }
  if (tool === "writ") {
    const data = campaign(c),
      available = WORLD_CONTRACTS.filter(
        (r) =>
          r.town === data.world!.townId ||
          data.world!.taken.some((t) => t.id === r.id),
      ),
      selected = available.find((r) => r.id === contract) || available[0],
      report = selected && contractWrit(c, selected.id);
    if (!report) return null;
    return (
      <>
        <label className="field-tool-filter">
          Commission
          <select
            aria-label="Writ commission"
            value={report.id}
            onChange={(e) => setContract(e.target.value)}
          >
            {available.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        <article>
          <b>{report.title}</b>
          <p>{report.description}</p>
          <p>
            {report.gold} gold · Report at {report.townName}
          </p>
          <small className="field-line">
            {report.once ? "One-time commission" : "Repeatable commission"} ·{" "}
            {report.taken
              ? `${report.progress}/${report.quantity} complete`
              : report.once && report.alreadyPaid
                ? "Already paid"
                : "Not taken"}
          </small>
          {report.kind === "hunt" && (
            <p>
              Only defeats after taking this commission count.
              {report.taken ? ` Acceptance baseline: ${report.baseline}.` : ""}
            </p>
          )}
          {report.consumes && (
            <p>
              Turn-in consumes {report.consumes.quantity}{" "}
              {RESOURCE_NAMES[report.consumes.resource]}. Carried:{" "}
              {report.consumes.carried} · Remaining after turn-in:{" "}
              {report.consumes.carried >= report.consumes.quantity
                ? report.consumes.after
                : "insufficient materials"}
              .
            </p>
          )}
          {report.kind === "dungeon" && (
            <p>Cleared stages count even if completed before acceptance.</p>
          )}
          {report.taken && (
            <p>
              {report.canReport
                ? "Ready to report here"
                : report.progress >= report.quantity
                  ? `Travel to ${report.townName} to report`
                  : "Requirements incomplete"}
            </p>
          )}
        </article>
        {!!report.links.length && (
          <article>
            <b>Linked real-world requests</b>
            {report.links.map((o) => (
              <p key={o.id}>
                {o.title}
                <small className="field-line">
                  {o.kind} adventure condition · {o.cadence} ·{" "}
                  {o.met
                    ? "Turn-in recorded this period"
                    : "Turn-in needed this period"}
                </small>
              </p>
            ))}
            <small className="field-line">
              Real-world work and request acceptance are still required.
            </small>
          </article>
        )}
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
  if (tool === "service-roster") {
    const rows = companionServices(c);
    if (!rows) return null;
    const selected =
      rows.find((n) => n.id === companion) ||
      rows.find((n) => !n.recruited) ||
      rows[0];
    return (
      <>
        <label className="field-tool-filter">
          Companion
          <select
            aria-label="Service companion"
            value={selected.id}
            onChange={(e) => setCompanion(e.target.value)}
          >
            {rows.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ·{" "}
                {n.active
                  ? "In party"
                  : n.recruited
                    ? "Recruited"
                    : n.eligible
                      ? "Ready to recruit"
                      : "Locked"}
              </option>
            ))}
          </select>
        </label>
        <article>
          <b>
            {selected.name} · {selected.role}
          </b>
          <p>
            {selected.active
              ? "In active party"
              : selected.recruited
                ? "Recruited · Available in Party"
                : selected.eligible
                  ? "Recruitment available in Party"
                  : `Clear ${selected.stageName} to recruit`}
          </p>
          {selected.placeName && (
            <p>
              {selected.placeName}
              <small className="field-line">
                {selected.eligible
                  ? "Recruitment requirement cleared"
                  : selected.encounterReady
                    ? "Recruitment stage reachable now"
                    : selected.reachable
                      ? "Complete earlier stages in this area"
                      : "Route not yet open"}
              </small>
            </p>
          )}
          {!selected.eligible &&
            selected.reachable &&
            selected.placeId &&
            areaButton(selected.placeId)}
        </article>
        <button className="field-action" onClick={onParty} disabled={!onParty}>
          Open party
        </button>
      </>
    );
  }
  return null;
}
