import { useState } from "react";
import type { Character } from "./domain";
import { brew, brewQuote, temper, temperQuote } from "./workshop";
import { SUPPLIES, supplyEffect } from "./supplies";
import type { SupplyId } from "./supplies";
import { TOWN_GEAR, RESOURCE_NAMES } from "./world-catalog";
import { campaign } from "./rpg";
import { MAX_TEMPER, modifierText } from "./equipment-progression";
type Props = { c: Character; update: (c: Character) => Promise<boolean> };
function BrewOffer({
  c,
  update,
  resource,
}: Props & { resource: "potion" | "ether" }) {
  const [grade, setGrade] = useState("greater"),
    [quantity, setQuantity] = useState("1"),
    [busy, setBusy] = useState(false),
    id = `${grade}-${resource}` as SupplyId,
    n = quantity.trim() ? Number(quantity) : NaN,
    q = brewQuote(c, id, n)!,
    name = SUPPLIES[id].name;
  return (
    <article
      className="pixel-window"
      aria-label={`${resource === "potion" ? "Potion" : "Ether"} brewing`}
    >
      <h3>{name}</h3>
      <label className="form-field">
        Grade
        <select
          aria-label={`${resource} brew grade`}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="greater">Greater</option>
          <option value="royal">Royal · Adept apothecary</option>
        </select>
      </label>
      <p>{supplyEffect(id)}</p>
      <p>Carried: {campaign(c).inventory[id] || 0}</p>
      {!q.unlocked && <p>Requires an Adept or better apothecary.</p>}
      <label className="supply-purchase">
        Quantity
        <input
          type="number"
          inputMode="numeric"
          min="1"
          max="99"
          step="1"
          aria-label={`${resource} brew quantity`}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>
      {!q.valid ? (
        <p role="alert">Enter a whole quantity from 1 to 99.</p>
      ) : (
        <>
          <p>
            {q.gold} gold{q.goldShortfall ? ` · ${q.goldShortfall} short` : ""}
          </p>
          {q.materials.map((m) => (
            <p key={m.id}>
              {m.quantity} {RESOURCE_NAMES[m.id]} · {m.carried} carried
              {m.shortfall
                ? ` · ${m.shortfall} short`
                : ` → ${m.carried - m.quantity} remaining`}
            </p>
          ))}
        </>
      )}
      <button
        disabled={busy || !q.canBrew}
        onClick={async () => {
          if (busy) return;
          const next = brew(c, id, n);
          if (next === c) return;
          setBusy(true);
          try {
            await update(next);
          } finally {
            setBusy(false);
          }
        }}
      >
        Brew{q.valid ? ` ${n} · ${q.gold} gold` : ""}
      </button>
    </article>
  );
}
export function Apothecary(props: Props) {
  return (
    <section aria-label="Apothecary">
      <h3 className="pixel-section-title">Apothecary</h3>
      <div className="pixel-shop-grid">
        <BrewOffer {...props} resource="potion" />
        <BrewOffer {...props} resource="ether" />
      </div>
    </section>
  );
}
export function TemperBench({ c, update }: Props) {
  const data = campaign(c),
    options = TOWN_GEAR.filter(
      (g) => g.town === data.world!.townId && data.inventory[g.id],
    ),
    [selection, setSelection] = useState(""),
    [busy, setBusy] = useState(false),
    selected = options.find((g) => g.id === selection) || options[0],
    q = selected ? temperQuote(c, selected.id)! : null;
  return (
    <section className="pixel-window temper-bench" aria-label="Tempering bench">
      <h3>Tempering</h3>
      {!q ? (
        <p>No owned equipment from this smith.</p>
      ) : (
        <>
          <label className="form-field">
            Equipment
            <select
              aria-label="Temper equipment"
              value={q.gear.id}
              onChange={(e) => setSelection(e.target.value)}
              disabled={busy}
            >
              {options.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            Temper +{q.rank} / +{MAX_TEMPER} · {modifierText(q.current)}
          </p>
          {q.rank === MAX_TEMPER ? (
            <p>Fully tempered</p>
          ) : (
            <>
              <p>
                Next: +{q.next} · {modifierText(q.upgraded)}
              </p>
              <p>
                {q.gold} gold
                {q.goldShortfall ? ` · ${q.goldShortfall} short` : ""}
              </p>
              <p>
                {q.quantity} {RESOURCE_NAMES[q.gear.material]} · {q.carried}{" "}
                carried
                {q.materialShortfall
                  ? ` · ${q.materialShortfall} short`
                  : ` → ${q.carried - q.quantity} remaining`}
              </p>
              <button
                disabled={busy || !q.canTemper}
                onClick={async () => {
                  if (busy) return;
                  const next = temper(c, q.gear.id);
                  if (next === c) return;
                  setBusy(true);
                  try {
                    await update(next);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Temper +{q.next} · {q.gold} gold
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}
