import { useState } from "react";
import type { Character } from "./domain";
import { campaign, buy } from "./rpg";
import { SUPPLY_RESTORE, supplyQuote } from "./supplies";
import type { SupplyId } from "./supplies";
import { Tag } from "./ui";
function Offer({
  c,
  update,
  id,
}: {
  c: Character;
  update: (c: Character) => Promise<boolean>;
  id: SupplyId;
}) {
  const [quantity, setQuantity] = useState("1"),
    [busy, setBusy] = useState(false),
    data = campaign(c),
    stock = data.world!.stock[data.world!.townId][id] || 0,
    n = quantity.trim() ? Number(quantity) : NaN,
    quote = supplyQuote(data.gold, stock, id, n),
    name = id === "potion" ? "Healing potion" : "Ether";
  return (
    <article className="pixel-window" aria-label={`${name} shop`}>
      <h3>{name}</h3>
      <p>
        Restore {SUPPLY_RESTORE[id]} {id === "potion" ? "HP" : "MP"}.
      </p>
      <p>
        Store stock: {stock} · Carried: {data.inventory[id] || 0}
      </p>
      {!stock && <Tag>Out of stock · Guild supplies needed</Tag>}
      <label className="supply-purchase">
        Quantity
        <input
          aria-label={id === "potion" ? "Potion quantity" : "Ether quantity"}
          type="number"
          inputMode="numeric"
          min="1"
          max="99"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>
      {!quote.valid ? (
        <p role="alert">Enter a whole quantity from 1 to 99.</p>
      ) : (
        <>
          {quote.goldShortfall > 0 && <p>{quote.goldShortfall} gold short</p>}
          {stock > 0 && quote.stockShortfall > 0 && (
            <p>{quote.stockShortfall} more needed in stock</p>
          )}
        </>
      )}
      <button
        disabled={busy || !!data.battle || !quote.canBuy}
        onClick={async () => {
          if (busy) return;
          const next = buy(c, id, n);
          if (next === c) return;
          setBusy(true);
          try {
            await update(next);
          } finally {
            setBusy(false);
          }
        }}
      >
        {!quote.valid
          ? "Choose quantity"
          : n === 1
            ? `Buy · ${quote.total} gold`
            : `Buy ${n} · ${quote.total} gold`}
      </button>
    </article>
  );
}
export default function SupplyShop({
  c,
  update,
}: {
  c: Character;
  update: (c: Character) => Promise<boolean>;
}) {
  return (
    <div className="pixel-shop-grid">
      {(["potion", "ether"] as const).map((id) => (
        <Offer key={id} c={c} update={update} id={id} />
      ))}
    </div>
  );
}
