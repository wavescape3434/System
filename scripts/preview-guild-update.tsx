// Development-only visual fixtures. They never enter the production application bundle.
import React from "react";
import { createRoot } from "react-dom/client";
import GuildCard from "../src/GuildCard";
import SkillTree from "../src/SkillTree";
import { demoCharacter, RANKS, learnSkill } from "../src/domain";
function mount() {
  document.getElementById("root")?.remove();
  const root = document.createElement("div");
  root.id = "visual-fixture";
  document.body.appendChild(root);
  return createRoot(root);
}
export function renderRankGallery() {
  const root = mount();
  root.render(
    <main className="rank-preview-gallery">
      <header>
        <h1>The Adventurers Guild</h1>
        <p>Rank metals · Sample cards</p>
      </header>
      <section>
        {RANKS.map((rank) => {
          const c = demoCharacter();
          c.name = `${rank.name} · ${rank.metal}`;
          let left = rank.xp;
          while (left > 0) {
            const xp = Math.min(10000, left);
            c.completions.push({
              id: `sample-${left}`,
              period: "once",
              at: c.createdAt,
              xp,
              stat: "CON",
              classId: "warrior",
              scope: "universal",
              title: "Sample progress",
            });
            left -= xp;
          }
          return <GuildCard key={rank.name} c={c} onSkills={() => {}} />;
        })}
      </section>
    </main>,
  );
  const style = document.createElement("style");
  style.textContent =
    ".rank-preview-gallery{padding:35px;width:1800px;max-width:100%;margin:auto}.rank-preview-gallery header{padding:15px 5px 30px}.rank-preview-gallery h1{font:600 46px var(--serif)}.rank-preview-gallery p{font-size:14px;margin-top:8px}.rank-preview-gallery>section{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:25px}.rank-preview-gallery .engraved-card{width:100%;align-self:stretch}.rank-preview-gallery .engraved-name h2{font-size:37px}";
  document.head.appendChild(style);
}
export function renderFighterWeb() {
  const root = mount();
  let c = demoCharacter();
  c.createdAt = "2026-09-01T12:00:00Z";
  c.completions = Array.from({ length: 12 }, (_, i) => ({
    id: "warrior-daily",
    period: `2026-09-${i + 1}`,
    at: c.createdAt,
    xp: 150,
    stat: "STR",
    classId: "warrior",
    scope: "class",
    rank: "C",
    title: "Sample Warrior training",
  }));
  c = learnSkill(c, "arc-fighter-1");
  root.render(
    <main className="fighter-preview">
      <h1>Fighter skill web</h1>
      <p>
        Sample character · Swordsmanship · Spearcraft · Axe Fighting · Unarmed
        Combat
      </p>
      <SkillTree c={c} update={() => false} onCertificate={() => {}} />
    </main>,
  );
  const style = document.createElement("style");
  style.textContent =
    ".fighter-preview{width:1350px;max-width:100%;margin:auto;padding:30px}.fighter-preview h1{font:600 45px var(--serif)}.fighter-preview>p{font-size:14px;margin:12px 0 25px}.fighter-preview .skill-tree-window{height:1500px;max-height:none}.fighter-preview .skill-tree-world{margin:auto}.fighter-preview .tree-legend{padding:20px 0}";
  document.head.appendChild(style);
}
