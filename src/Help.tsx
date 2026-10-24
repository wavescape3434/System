import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import type { Page } from "./screens";
const TOPICS: { title: string; page?: Page; sections: [string, string][] }[] = [
  {
    title: "Requests & Taken",
    page: "objectives",
    sections: [
      [
        "Taking a request",
        "Choose Take request on the board or in its details. Taken lists your current commitments. Release removes a commitment; completed rewards stay in your history.",
      ],
      [
        "Recurring requests",
        "Daily requests reset at local midnight, weekly on Monday, and monthly on the first. A new period requires taking the request again. Suggestions include requests you previously took or completed. They are never accepted automatically.",
      ],
      [
        "Completing requests",
        "Mark the real-world action complete to claim its listed XP. Monthly requests require all checklist items. Each request pays once per period, even if released, retaken, or completed under another class.",
      ],
      [
        "Changing focus",
        "A taken request keeps the class, profession, and vocation it had when accepted. Finish it from Taken to credit that original path. Its commitment expires when its daily, weekly, or monthly period ends.",
      ],
    ],
  },
  {
    title: "Attributes",
    page: "skills",
    sections: [
      [
        "The six attributes",
        "STR: muscular strength. DEX: coordination and mobility. CON: endurance and conditioning. INT: study and reasoning. WIS: Christian Scripture, reflection, and service. CHA: communication and relationships.",
      ],
      [
        "Base attribute gains",
        "Every fifth class or profession level grants a base stat point. Hybrid class milestones follow their archetype balance. Some weekly and monthly requests list a separate stat reward. Purchased skills, equipment, and class stances apply modifiers only during adventures.",
      ],
      [
        "Starting assessment",
        "Use recent results or estimates. Blank fields count as zero practice. Walking uses minutes, balance seconds, and study minutes per week. Weighted strength requires body weight for scaling. Baselines are guild game scores from 3–30.",
      ],
    ],
  },
  {
    title: "Levels & guild ranks",
    page: "skills",
    sections: [
      [
        "Experience",
        "All completed requests add adventurer XP. Class requests train their class, profession requests train the recorded role and career discipline, and universal requests earn universal points.",
      ],
      [
        "Level costs",
        "Levels have no configured ceiling. Each following level costs more XP. Adventurer levels use a larger XP scale than class and profession levels. A new class begins at level 1; returning to a trained class resumes its existing level.",
      ],
      [
        "Guild ranks",
        "Ranks run F, E, D, C, B, A, S, SS, SSS. Promotion costs double each time, beginning at 500 XP. Rank is separate from level. Most characters register at F; exceptional assessments can start at E or D. Starting placement grants rank credit, without progression XP.",
      ],
      [
        "Existing characters",
        "Updates preserve earlier levels, attributes, skills, and objective history. Progression credits honor gains earned under an older leveling curve.",
      ],
    ],
  },
  {
    title: "Classes & prestige",
    page: "paths",
    sections: [
      [
        "Class register",
        "Search classes by name or real-world goal. Filter by tier, archetype, or availability. Inspect a dossier or compare up to three classes before selecting one.",
      ],
      [
        "Archetypes",
        "Fighter, Guardian, Ranger, Rogue, Mage, Cleric, Bard, and Artificer provide shared trees. A hybrid contributes class XP in its displayed proportions: Paladin trains 70% Fighter and 30% Cleric. Each class also has focused nodes.",
      ],
      [
        "Prestige promotion",
        "Prestige and Ascendant classes require prior class experience, sometimes combined with attributes, skills, or profession requirements. Promotion retains your adventurer level and all previous records. Unlocked classes remain available.",
      ],
    ],
  },
  {
    title: "Professions & vocation",
    page: "paths",
    sections: [
      [
        "Profession",
        "Your profession is your job role. Roles share one of 20 career trees. Role levels remain separate; career points carry across roles within the same discipline.",
      ],
      [
        "Vocation",
        "Vocation is an independent career focus, such as Analyst → Networking. It adds focused requests and can train a different career discipline from your selected job role. Combat class changes do not change vocation.",
      ],
      [
        "Career competencies",
        "Career tree competencies are non-combat. Additional exploration and utility uses are planned. Recorded credentials such as CCNA can earn their named milestone skills. Credentials are self-reported.",
      ],
    ],
  },
  {
    title: "Skills & points",
    page: "skills",
    sections: [
      [
        "Learning skills",
        "Every 100 path XP earns a point. Class points pool across combat classes, career points pool by discipline, and universal points use universal requests. Nodes cost multiple points and require level, practice, and prerequisites.",
      ],
      [
        "Using the tree",
        "Drag or scroll to pan, use zoom controls, and select a node for its exact requirements and effect. Shared archetype levels include training from all contributing classes. Learned skills remain yours after switching paths.",
      ],
      [
        "Combat loadout",
        "Equip up to four purchased combat skills in Adventures → Skill loadout. The active class signature uses no slot and is available automatically. Prestige signatures have greater potency.",
      ],
    ],
  },
  {
    title: "Adventures & combat",
    page: "adventures",
    sections: [
      [
        "Party turns",
        "Your character and up to two companions act before the enemy round. Select an enemy for attacks and an ally for healing or items. Guard restores 3 MP and reduces incoming damage.",
      ],
      [
        "Effects",
        "Skills can pierce armor, hit groups, stun regular enemies, taunt, counter, guard allies, heal, restore MP, or inflict burning. Bosses resist stun and use a heavy strike every third round.",
      ],
      [
        "Rewards & recovery",
        "Victories award gold, supplies, encounter access, and recruitment. They do not award real-world XP or base attributes. Retreat and defeat keep your training progress. Items spent in battle remain spent.",
      ],
      [
        "Equipment",
        "Buy supplies and gear with adventure gold. Equipment and equipped skill modifiers change combat attributes. Character base attributes are shown separately.",
      ],
    ],
  },
  {
    title: "Journey & reports",
    page: "journey",
    sections: [
      [
        "Chronicle",
        "Journey records completed requests automatically. New actions also record class and vocation changes, skill unlocks, level gains, stat gains, and adventure results. Filter events, choose a timeframe, and change chronological order.",
      ],
      [
        "Timeframe summaries",
        "The summary totals XP, completed requests, active days, newly learned skills, and recorded stat gains in the selected period. XP comparison uses the preceding period of equal length.",
      ],
      [
        "Reports",
        "Experience over time shows cumulative objective XP. Completed requests shows activity by day, week, or month, depending on the selected range. Select a point to inspect it or open View data. The calendar shows the last 12 weeks.",
      ],
      [
        "Earlier history",
        "Completed request dates, credentials, and archived notes remain available. Dates for older skill purchases, class switches, and adventure clears were not recorded, so those milestones appear only after this update. Attribute comparisons show registration scores against current totals. No new journal entry is needed.",
      ],
    ],
  },
  {
    title: "Accounts & backups",
    sections: [
      [
        "Local saves",
        "Progress saves on this device after each change. Export a character in Guild settings to keep a separate JSON backup. A backup includes activity and archived personal notes.",
      ],
      [
        "Google & cloud copies",
        "Google linking requires the owner’s Firebase and OAuth setup. Cloud backups are manual. Upload replaces the account’s cloud copy; Restore previews a copy before replacing local progress.",
      ],
      [
        "Restoring",
        "Import a valid Guild backup and confirm Restore character. Restoring a backup does not create new Journey milestones. Starting a new character replaces the local record.",
      ],
    ],
  },
];
export default function Help({ navigate }: { navigate?: (p: Page) => void }) {
  const [query, setQuery] = useState("");
  const list = TOPICS.filter((t) =>
    `${t.title} ${t.sections.flat().join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <div className="help-page">
      <label className="help-search">
        <Search size={19} />
        <input
          aria-label="Search help"
          type="search"
          placeholder="Search the handbook"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="help-topics">
        {list.map((topic) => (
          <details
            className="panel help-topic"
            key={topic.title}
            open={query.trim() ? true : undefined}
          >
            <summary>
              <h2>{topic.title}</h2>
              <ChevronRight size={18} />
            </summary>
            {topic.sections.map(([title, text]) => (
              <section key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </section>
            ))}
            {navigate && topic.page && (
              <button
                className="text-button"
                onClick={() => navigate(topic.page!)}
              >
                Open{" "}
                {topic.page === "paths"
                  ? "Class Register"
                  : topic.page === "objectives"
                    ? "Objectives"
                    : topic.page === "skills"
                      ? "Skills & Stats"
                      : topic.page[0].toUpperCase() + topic.page.slice(1)}
                <ChevronRight size={14} />
              </button>
            )}
          </details>
        ))}
      </div>
      {!list.length && <p className="panel">No matching help topics.</p>}
    </div>
  );
}
