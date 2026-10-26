import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173");
  const data = await page.evaluate(async () => {
    const d = await import("/src/domain.ts"),
      r = await import("/src/rpg.ts"),
      world = await import("/src/world-catalog.ts"),
      w = await import("/src/world.ts"),
      t = await import("/src/enemy-tactics.ts");
    const results = [];
    for (const p of d.CLASSES.filter((c) => c.tier === "Basic"))
      for (const style of ["attack", "tactical"]) {
        let c = d.demoCharacter();
        c.activeClass = p.id;
        c.campaign = { ...r.campaign(c), party: ["mira"], roster: ["mira"] };
        let actions = 0,
          skills = 0,
          guards = 0;
        const stages = [];
        for (const id of world.PLACES[0].stages) {
          c = r.startBattle(c, id);
          let n = 0;
          while (r.campaign(c).battle?.phase === "player" && n < 160) {
            const b = r.campaign(c).battle,
              actor = b.party[b.actor],
              alive = b.enemies.findIndex((e) => e.hp > 0),
              low = b.party
                .filter((u) => u.hp > 0)
                .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
            let action = { kind: "attack", target: alive };
            if (style === "tactical") {
              const charged = b.enemies.some(
                (e) => e.hp > 0 && t.chargedAttack(e, b.round),
              );
              const endangered = b.party
                .filter((u) => u.hp > 0)
                .find(
                  (u) =>
                    b.enemies
                      .filter((e) => e.hp > 0 && t.chargedAttack(e, b.round))
                      .reduce(
                        (sum, e) =>
                          sum +
                          Math.max(
                            1,
                            ((e.attack * (e.chargeMultiplier || 1.6) -
                              u.defense) *
                              0.45) /
                              (u.guardPower || 1),
                          ),
                        0,
                      ) >= u.hp,
                );
              const a = actor.abilities,
                healing = a.find(
                  (s) =>
                    ["heal", "heal-all", "heal-self"].includes(s.type) &&
                    actor.mp >= s.cost,
                ),
                ward = a.find(
                  (s) =>
                    ["ward", "guard", "bulwark"].includes(s.type) &&
                    actor.mp >= s.cost,
                ),
                offense = a.find(
                  (s) =>
                    [
                      "power",
                      "quick",
                      "fire",
                      "area",
                      "pierce",
                      "flurry",
                      "bash",
                      "hybrid",
                      "coordinated",
                      "burn",
                    ].includes(s.type) &&
                    actor.mp >= s.cost &&
                    (s.type !== "quick" ||
                      b.enemies.filter((e) => e.hp > 0).length > 1),
                ),
                buff = a.find(
                  (s) =>
                    ["rally", "formation"].includes(s.type) &&
                    actor.mp >= s.cost,
                );
              if (charged && endangered && b.items.potion && !ward)
                action = {
                  kind: "potion",
                  target: b.party.indexOf(endangered),
                };
              else if (charged)
                action = ward
                  ? { kind: "ability", abilityId: ward.id, target: alive }
                  : { kind: "guard", target: alive };
              else if (low.hp / low.maxHp < 0.55 && healing)
                action = {
                  kind: "ability",
                  abilityId: healing.id,
                  target: b.party.indexOf(low),
                };
              else if (low.hp / low.maxHp < 0.4 && b.items.potion)
                action = { kind: "potion", target: b.party.indexOf(low) };
              else if (buff && b.round === 1)
                action = { kind: "ability", abilityId: buff.id, target: alive };
              else if (offense)
                action = {
                  kind: "ability",
                  abilityId: offense.id,
                  target: alive,
                };
            }
            if (action.kind === "ability") skills++;
            if (action.kind === "guard") guards++;
            c = r.act(c, action);
            n++;
            actions++;
          }
          const b = r.campaign(c).battle;
          stages.push({
            id,
            phase: b?.phase,
            actions: n,
            heroHp: b?.party[0].hp,
          });
          if (b?.phase !== "won") break;
          c = w.leaveBattle(r.claimVictory(c));
        }
        results.push({
          class: p.name,
          style,
          cleared: stages.filter((s) => s.phase === "won").length,
          actions,
          skills,
          guards,
          potionsUsed: 3 - r.campaign(c).inventory.potion,
          last: stages.at(-1),
          realXp: d.totalXP(c),
          stages,
        });
      }
    return results;
  });
  await mkdir("docs/combat-1.14", { recursive: true });
  await writeFile(
    "docs/combat-1.14/opening-results.json",
    JSON.stringify(data, null, 2) + "\n",
  );
  if (
    data.some(
      (row) =>
        row.realXp !== 0 || (row.style === "tactical" && row.cleared !== 10),
    )
  )
    throw Error(
      "Opening combat regression: tactical clear or XP invariant failed",
    );
  console.log(
    JSON.stringify(
      data.map(({ stages, ...x }) => x),
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
