import { Apothecary, TemperBench } from "./Workshop";
import {
  gearModifiers,
  modifierText,
  temperRank,
} from "./equipment-progression";
import SupplyShop from "./SupplyShop";
import DeliveryCost from "./DeliveryCost";
import { CAREER_UTILITIES, hasCareerUtility } from "./career-payoffs";
import CareerFieldwork from "./CareerFieldwork";
import { adventureParty } from "./rpg";
import { Swords } from "lucide-react";
import { useState } from "react";
import type { Character } from "./domain";
import {
  campaign,
  startBattle,
  buy,
  equip,
  EQUIPMENT,
  ENCOUNTERS,
} from "./rpg";
import {
  WORLD_REGIONS,
  PLACES,
  TOWNS,
  TOWN_GEAR,
  WORLD_CONTRACTS,
  RESOURCE_NAMES,
  MONSTER_NAMES,
} from "./world-catalog";
import {
  placeOpen,
  placeCleared,
  regionOpen,
  placeProgress,
  bossChance,
  ambushChance,
} from "./world-state";
import {
  explore,
  declineBoss,
  challengeBoss,
  travelTown,
  takeWorldContract,
  completeWorldContract,
  contractProgress,
} from "./world";
import { Progress } from "./ui";
import PixelScene from "./PixelScene";
export default function WorldMap({
  c,
  update,
  mode,
  initialTool,
  initialPlace,
  onMode,
}: {
  c: Character;
  update: (c: Character) => Promise<boolean>;
  mode: "map" | "requests" | "shop";
  initialTool?: string;
  initialPlace?: string;
  onMode?: (mode: "requests" | "equipment" | "party" | "loadout") => void;
}) {
  const data = campaign(c),
    world = data.world!,
    currentTown = TOWNS.find((t) => t.id === world.townId)!;
  const [regionId, setRegion] = useState(
      PLACES.find((p) => p.id === (initialPlace || world.placeId))?.region ||
        currentTown.region,
    ),
    [placeId, setPlace] = useState(
      initialPlace || world.placeId || `${currentTown.region}-path`,
    ),
    [focusOnly, setFocusOnly] = useState(!!initialTool),
    [query, setQuery] = useState(""),
    [requestView, setRequestView] = useState("town");
  const region = WORLD_REGIONS.find((r) => r.id === regionId)!,
    place =
      PLACES.find((p) => p.id === placeId) ||
      PLACES.find((p) => p.region === regionId)!,
    area = placeProgress(world, place.id),
    cleared = placeCleared(data, place.id),
    nextStageIndex = place.stages.findIndex((id) => !data.cleared.includes(id)),
    nextStage =
      nextStageIndex >= 0
        ? ENCOUNTERS.find((e) => e.id === place.stages[nextStageIndex])
        : undefined,
    clearedStages = place.stages.filter((id) =>
      data.cleared.includes(id),
    ).length,
    percent = (n: number) => `${Math.round(n * 100)}%`;
  const fieldwork = (
    <CareerFieldwork
      c={c}
      placeId={place.id}
      initialTool={initialTool}
      onArea={(id) => {
        const p = PLACES.find((p) => p.id === id);
        if (p && placeOpen(data, id)) {
          setRegion(p.region);
          setPlace(id);
          setFocusOnly(false);
          requestAnimationFrame(() =>
            document
              .querySelector(".pixel-place-heading")
              ?.scrollIntoView({ block: "center" }),
          );
        }
      }}
      onRequests={() => onMode?.("requests")}
      onShop={() => onMode?.("equipment")}
      onTown={async (id, destination = "equipment") => {
        const town = TOWNS.find((t) => t.id === id),
          next = travelTown(c, id);
        if (town && next !== c && (await update(next))) {
          setRegion(town.region);
          setPlace(`${town.region}-path`);
          setFocusOnly(false);
          onMode?.(destination);
        }
      }}
      onParty={() => onMode?.("party")}
      onLoadout={() => onMode?.("loadout")}
    />
  );
  if (mode === "map" && focusOnly)
    return (
      <div className="pixel-world">
        <button
          className="button secondary"
          onClick={() => setFocusOnly(false)}
        >
          World map
        </button>
        {fieldwork}
      </div>
    );
  const towns = (
    <div className="pixel-town-strip" aria-label="Towns">
      {TOWNS.map((t) => (
        <button
          key={t.id}
          disabled={!regionOpen(data, t.region)}
          className={t.id === world.townId ? "selected" : ""}
          onClick={async () => {
            if (await update(travelTown(c, t.id))) {
              setRegion(t.region);
              setPlace(`${t.region}-path`);
            }
          }}
        >
          {t.name}
          {!regionOpen(data, t.region) && " · Locked"}
        </button>
      ))}
    </div>
  );
  if (mode === "shop")
    return (
      <div className="pixel-world">
        {towns}
        <section className="pixel-window pixel-town-banner">
          <PixelScene
            biome={
              WORLD_REGIONS.find((r) => r.id === currentTown.region)!.biome
            }
            town
          />
          <div>
            <span>TOWN</span>
            <h2>{currentTown.name}</h2>
            <p>{currentTown.description}</p>
          </div>
        </section>
        <h3 className="pixel-section-title">General store</h3>
        <SupplyShop c={c} update={update} />
        <h3 className="pixel-section-title">
          Blacksmith ·{" "}
          {
            ["Apprentice", "Journeyman", "Adept", "Master", "Grandmaster"][
              currentTown.smith - 1
            ]
          }
        </h3>
        <div
          className="pixel-shop-grid"
          role="group"
          aria-label="Blacksmith recipes"
        >
          {TOWN_GEAR.filter((g) => g.town === currentTown.id).map((g) => (
            <article key={g.id} className="pixel-window">
              <span>{g.slot.toUpperCase()}</span>
              <h3>{g.name}</h3>
              <p>
                {modifierText(gearModifiers(c, g))}
                {temperRank(c, g.id) ? ` · Temper +${temperRank(c, g.id)}` : ""}
              </p>
              <p>
                {g.quantity} {RESOURCE_NAMES[g.material]} · {g.price} gold
              </p>
              <small>
                Carried: {data.inventory[g.material] || 0} / {g.quantity}{" "}
                {RESOURCE_NAMES[g.material]}
              </small>
              <button
                disabled={
                  data.equipment.includes(g.id) ||
                  (!data.inventory[g.id] &&
                    (data.gold < g.price ||
                      (data.inventory[g.material] || 0) < g.quantity))
                }
                onClick={() =>
                  update(data.inventory[g.id] ? equip(c, g.id) : buy(c, g.id))
                }
              >
                {data.equipment.includes(g.id)
                  ? "Equipped"
                  : data.inventory[g.id]
                    ? "Equip"
                    : `Forge · ${g.price} gold`}
              </button>
            </article>
          ))}
        </div>
        <TemperBench c={c} update={update} />
        <Apothecary c={c} update={update} />
        <h3 className="pixel-section-title">Equipment bag</h3>
        <div
          className="pixel-shop-grid"
          role="group"
          aria-label="Equipment bag"
        >
          {EQUIPMENT.filter((g) => data.inventory[g.id]).map((g) => (
            <article className="pixel-window" key={g.id}>
              <h3>{g.name}</h3>
              <p>
                {modifierText(gearModifiers(c, g))}
                {temperRank(c, g.id) ? ` · Temper +${temperRank(c, g.id)}` : ""}
              </p>
              <button
                disabled={data.equipment.includes(g.id)}
                onClick={() => update(equip(c, g.id))}
              >
                {data.equipment.includes(g.id) ? "Equipped" : "Equip"}
              </button>
            </article>
          ))}
        </div>
        <details className="pixel-window pixel-inventory">
          <summary>Materials</summary>
          <div>
            {Object.entries(RESOURCE_NAMES)
              .filter(([id]) => data.inventory[id])
              .map(([id, name]) => (
                <span key={id}>
                  {name} ×{data.inventory[id]}
                </span>
              ))}
          </div>
        </details>
      </div>
    );
  if (mode === "requests") {
    const contracts = WORLD_CONTRACTS.filter(
      (r) =>
        (requestView === "all" ||
          (requestView === "taken" && world.taken.some((t) => t.id === r.id)) ||
          (requestView === "town" && r.town === world.townId)) &&
        [r.title, r.description, TOWNS.find((t) => t.id === r.town)!.name]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return (
      <div className="pixel-world">
        {towns}
        <div className="pixel-request-tools">
          <input
            aria-label="Search adventure requests"
            placeholder="Search adventure requests"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Adventure request view"
            value={requestView}
            onChange={(e) => setRequestView(e.target.value)}
          >
            <option value="town">{currentTown.name}</option>
            <option value="taken">Taken requests</option>
            <option value="all">All towns</option>
          </select>
        </div>
        <h2 className="pixel-section-title">Guild requests</h2>
        <div className="pixel-contract-grid">
          {contracts.map((r) => {
            const taken = world.taken.some((t) => t.id === r.id),
              progress = contractProgress(c, r.id),
              town = TOWNS.find((t) => t.id === r.town)!,
              open = regionOpen(data, town.region),
              oneTime =
                r.kind === "dungeon" &&
                world.receipts.some((x) => x.contractId === r.id);
            return (
              <article className="pixel-window" key={r.id}>
                <span>
                  <Swords size={14} aria-label="Adventure only" />{" "}
                  {r.kind.toUpperCase()} · {town.name}
                </span>
                <h3>{r.title}</h3>
                <p>{r.description}</p>
                <p>{PLACES.find((p) => p.id === r.placeId)!.name}</p>
                {taken && (
                  <p>
                    {Math.min(progress, r.quantity)} / {r.quantity}
                    {r.kind === "delivery"
                      ? ` ${RESOURCE_NAMES[r.resource!]}`
                      : " completed"}
                  </p>
                )}
                {r.kind === "delivery" && <DeliveryCost c={c} id={r.id} />}
                <p className="pixel-gold">
                  {r.gold} gold
                  {r.restock
                    ? ` · Restock ${Object.keys(r.restock).join(", ")}`
                    : ""}
                </p>
                {taken ? (
                  <button
                    disabled={progress < r.quantity || world.townId !== r.town}
                    onClick={() => update(completeWorldContract(c, r.id))}
                  >
                    {world.townId !== r.town
                      ? `Report at ${town.name}`
                      : "Turn in request"}
                  </button>
                ) : (
                  <button
                    disabled={!open || oneTime}
                    onClick={() => update(takeWorldContract(c, r.id))}
                  >
                    {oneTime
                      ? "Completed"
                      : open
                        ? "Take request"
                        : "Town locked"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
        <details className="pixel-window">
          <summary>Completed commissions · {world.receipts.length}</summary>
          {world.receipts
            .slice(-12)
            .reverse()
            .map((r) => (
              <p key={r.id}>
                {WORLD_CONTRACTS.find((x) => x.id === r.contractId)!.title} ·{" "}
                {new Date(r.at).toLocaleDateString()} · {r.gold} gold
              </p>
            ))}
        </details>
      </div>
    );
  }
  return (
    <div className="pixel-world">
      {towns}
      <select
        className="pixel-region-select"
        aria-label="World region"
        value={regionId}
        onChange={(e) => {
          setRegion(e.target.value);
          setPlace(`${e.target.value}-path`);
        }}
      >
        {WORLD_REGIONS.map((r) => (
          <option key={r.id} value={r.id} disabled={!regionOpen(data, r.id)}>
            {r.name}
            {!regionOpen(data, r.id) ? " · Locked" : ""}
          </option>
        ))}
      </select>
      <div className="pixel-region-list">
        {WORLD_REGIONS.map((r, i) => (
          <button
            key={r.id}
            className={regionId === r.id ? "selected" : ""}
            disabled={!regionOpen(data, r.id)}
            onClick={() => {
              setRegion(r.id);
              setPlace(`${r.id}-path`);
            }}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <b>{r.name}</b>
            <small>
              {
                PLACES.filter(
                  (p) => p.region === r.id && placeCleared(data, p.id),
                ).length
              }{" "}
              / 3 places cleared
            </small>
          </button>
        ))}
      </div>
      <section className="pixel-window pixel-region-banner">
        <PixelScene biome={region.biome} />
        <div>
          <span>{TOWNS.find((t) => t.id === region.town)!.name} TERRITORY</span>
          <h2>{region.name}</h2>
          <p>{region.description}</p>
        </div>
      </section>
      <div className="pixel-place-list">
        {PLACES.filter((p) => p.region === regionId).map((p) => (
          <button
            key={p.id}
            disabled={!placeOpen(data, p.id)}
            className={p.id === place.id ? "selected" : ""}
            onClick={() => setPlace(p.id)}
          >
            <span>{p.kind.toUpperCase()}</span>
            <b>{p.name}</b>
            <small>
              {p.stages.filter((id) => data.cleared.includes(id)).length} /{" "}
              {p.stages.length} stages
            </small>
            <small>
              {p.resources.map((id) => RESOURCE_NAMES[id]).join(" · ")}
            </small>
          </button>
        ))}
      </div>
      {CAREER_UTILITIES.some((u) => hasCareerUtility(c, u.id)) && (
        <details className="pixel-window map-fieldwork">
          <summary>Fieldwork</summary>
          {fieldwork}
        </details>
      )}
      <section className="pixel-window">
        <div className="pixel-place-heading">
          <h2>{place.name}</h2>
          <span>
            {place.kind === "dungeon" ? "DUNGEON" : "EXPLORATION AREA"}
          </span>
        </div>
        <div className="pixel-current-stage">
          <div className="stage-progress-heading">
            <span>
              {clearedStages} / {place.stages.length} stages cleared
            </span>
            <span>
              {place.kind === "dungeon" ? "DUNGEON ROUTE" : "AREA ROUTE"}
            </span>
          </div>
          <Progress
            value={clearedStages}
            max={place.stages.length}
            label={`${place.name} stage progress`}
          />
          {nextStage ? (
            <button
              className="pixel-stage-enter"
              disabled={
                !placeOpen(data, place.id) ||
                adventureParty(c).every((u) => u.hp === 0)
              }
              onClick={() => update(startBattle(c, nextStage.id))}
            >
              <span>
                STAGE {nextStageIndex + 1} / {place.stages.length}
              </span>
              <b>{nextStage.name.slice(place.name.length + 2)}</b>
              <small>
                {nextStage.enemies
                  .map((id) => MONSTER_NAMES[id] || id)
                  .join(" · ")}
              </small>
              <span className="stage-payout">
                {nextStage.gold} gold ·{" "}
                {Object.entries(nextStage.loot)
                  .map(([id, n]) => `${n} ${RESOURCE_NAMES[id]}`)
                  .join(" · ")}
              </span>
              <strong>
                {placeOpen(data, place.id)
                  ? "Enter battle"
                  : "Complete the previous area"}
              </strong>
            </button>
          ) : (
            <div className="stage-route-complete">
              <b>Area route complete</b>
              <span>
                {place.stages.length} / {place.stages.length} cleared
              </span>
            </div>
          )}
        </div>
        {cleared ? (
          <div className="pixel-exploration">
            <h3>Free exploration</h3>
            <p>
              {area.visits} explorations · {area.bossVictories} roaming bosses
              defeated
            </p>
            <button
              className="pixel-primary"
              disabled={adventureParty(c).every((u) => u.hp === 0)}
              onClick={() => update(explore(c, place.id))}
            >
              Explore {place.name}
            </button>
            <div className="pixel-odds">
              <span>
                {area.pendingBoss
                  ? "Roaming boss nearby"
                  : `Boss appearance: ${percent(bossChance(place.id, area.sinceBoss))}`}
              </span>
              {area.pendingBoss && (
                <span>
                  Ambush danger: {percent(ambushChance(place.id, area.ignored))}
                </span>
              )}
            </div>
            {area.last && (
              <div className={`pixel-discovery ${area.last.kind}`}>
                <span>{area.last.kind.toUpperCase()}</span>
                <p>{area.last.text}</p>
                {area.last.kind === "boss" && !area.last.declined && (
                  <button onClick={() => update(declineBoss(c, place.id))}>
                    Leave the boss
                  </button>
                )}
              </div>
            )}
            {area.pendingBoss && (
              <button
                className="pixel-boss-button"
                onClick={() => update(challengeBoss(c, place.id))}
              >
                Challenge roaming boss
              </button>
            )}
          </div>
        ) : (
          <p className="pixel-stage-lock">
            Clear all {place.stages.length} stages to unlock free exploration.
          </p>
        )}
      </section>
      <details className="pixel-window">
        <summary>Exploration record · {world.journal.length}</summary>
        {world.journal
          .filter((e) => e.placeId === place.id)
          .slice(0, 8)
          .map((e) => (
            <p key={e.id}>{e.text}</p>
          ))}
      </details>
    </div>
  );
}
