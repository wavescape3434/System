import { useState } from "react";
import { FlaskConical } from "lucide-react";
import type { Character } from "./domain";
import { adventureParty, campaign, useSupply } from "./rpg";
import { supplyRecovery } from "./supplies";
import type { SupplyId } from "./supplies";
import { Modal } from "./ui";
export default function SupplySatchel({
  c,
  update,
}: {
  c: Character;
  update: (c: Character) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false),
    [target, setTarget] = useState("hero"),
    [busy, setBusy] = useState(false),
    data = campaign(c),
    party = adventureParty(c),
    selected = party.find((u) => u.id === target) || party[0];
  const use = async (id: SupplyId) => {
    if (busy) return;
    const next = useSupply(c, selected.id, id);
    if (next === c) return;
    setBusy(true);
    try {
      await update(next);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        className="button secondary supply-satchel-button"
        onClick={() => setOpen(true)}
        disabled={!!data.battle}
      >
        <FlaskConical size={17} />
        Supplies · {data.inventory.potion || 0} potion
        {data.inventory.potion === 1 ? "" : "s"} · {data.inventory.ether || 0}{" "}
        ether{data.inventory.ether === 1 ? "" : "s"}
      </button>
      {open && (
        <Modal title="Supplies" onClose={() => setOpen(false)}>
          <div className="satchel-panel">
            <label className="form-field">
              Party member
              <select
                aria-label="Supply target"
                value={selected.id}
                onChange={(e) => setTarget(e.target.value)}
              >
                {party.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.hp === 0 ? " · Fallen" : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="satchel-reserves">
              <span>
                HP{" "}
                <b>
                  {selected.hp}/{selected.maxHp}
                </b>
              </span>
              <span>
                MP{" "}
                <b>
                  {selected.mp}/{selected.maxMp}
                </b>
              </span>
            </div>
            {selected.hp === 0 && (
              <p className="helper">Fallen · Full recovery at midnight.</p>
            )}
            <div className="satchel-items">
              {(["potion", "ether"] as const).map((id) => {
                const restored = supplyRecovery(selected, id);
                return (
                  <article key={id}>
                    <b>
                      {id === "potion" ? "Healing potion" : "Ether"} ×
                      {data.inventory[id] || 0}
                    </b>
                    <p>
                      Restore {restored} {id === "potion" ? "HP" : "MP"}
                    </p>
                    <button
                      className="button secondary"
                      disabled={
                        busy ||
                        !!data.battle ||
                        !data.inventory[id] ||
                        !restored
                      }
                      onClick={() => void use(id)}
                    >
                      Use {id === "potion" ? "potion" : "ether"}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
