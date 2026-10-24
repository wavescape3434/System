import { useState } from "react";
import { Search, ChevronRight, ExternalLink } from "lucide-react";
import { METRIC_SOURCES } from "./metrics";
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
        "A taken request keeps the class, profession, and vocation it had when accepted. Finish it from Taken to credit that original path. Its commitment expires when its daily, weekly, or monthly period ends. One-time class trials and long commitments remain in Taken until completed or released.",
      ],
    ],
  },
  {
    title: "Assessment calibration",
    page: "settings",
    sections: [
      [
        "Reference level 10",
        "A reference-level result maps to 10. Missing tests remain neutral at 10 and are labelled unassessed. Different characters can start above or below that reference; each account is not forced to total 60. Stats have no numeric ceiling.",
      ],
      [
        "Published and provisional references",
        "Grip strength uses published age/sex means for adults 20–90, with interpolation between five-year ages. Unassisted chair stands use a pooled mean for ages 18–35. Walking uses age/sex/height/mass equations where supported. These are sample-specific references, not universal averages. Pushups, bench estimates, balance, and the original mental checks use explicitly provisional game anchors.",
      ],
      [
        "What the checks measure",
        "Pushups and chair stands measure muscular endurance/function, a bench estimate measures a different aspect of strength, and one-leg stance measures static balance. INT checks learning and reasoning; WIS checks Scripture comprehension and practical judgment; CHA checks listening and communication choices. These brief checks are not global intelligence, spiritual, or personality tests.",
      ],
      [
        "Rechecking progress",
        "Save performance checks in Settings to compare actual results over time. Recalibrating starting stats is a separate confirmed action and retains earned training points. Repeating the same mental questions can improve familiarity; use real-world application and feedback to assess broader progress.",
      ],
    ],
  },
  {
    title: "Task ranks & transfer",
    page: "objectives",
    sections: [
      [
        "Difficulty and rewards",
        "Ranks F, E, D, C, B, A, S, SS and SSS award 10, 25, 60, 150, 350, 800, 1800, 4200 and 10000 player XP. These are game-design prices, not physiological conversion factors. SS and SSS commitments require many weeks, dated practice, and an independently assessed advanced or rare expert outcome. Time alone does not qualify.",
      ],
      [
        "Universal training",
        "Universal work awards its full player XP once. It gives a related active class 50% credit weighted by its focus and other unlocked related classes 25%. Relevant professions receive 25% credit. These credits do not add a second player XP reward.",
      ],
      [
        "Class trials and mastery",
        "An entry trial is required before activating a new class. It receives 25% of relevant prior training as transferable XP. The class begins at level 1, then class-specific commissions certify further levels. Stored XP cannot bypass the class-work requirement. Prior class progress is retained.",
      ],
      [
        "Stat milestones",
        "Every fifth class or profession level awards increasing game stat points: 2 at level 5, 3 at level 10, 4 at level 15, and so on. Hybrid classes divide these points by their focus. Game growth rewards sustained practice and exceeds real-world change; it does not predict extra kilograms lifted or a medical improvement. Actual performance checks remain visible separately.",
      ],
      [
        "Training groups and recovery",
        "Alternative requests for the same movement group do not pay repeatedly for the same day. Strength and high-volume endurance requests include recovery intervals. Equipment and recent ability checks gate advanced pull-up tasks. Difficulty is not a recommendation to exceed your current capacity.",
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
        "Every fifth class or profession level grants increasing base stat points. Hybrid class milestones follow their archetype balance. Some weekly and monthly requests list a separate stat reward. Purchased skills, equipment, and class stances apply modifiers only during adventures.",
      ],
      [
        "Starting assessment",
        "Use recent repeatable test results. Blank fields stay unassessed at 10; an entered zero is a measured result. Walking records distance in six minutes, balance uses seconds, and bench estimates require load, 4–10 repetitions, and body mass. Stats have no numeric ceiling.",
      ],
    ],
  },
  {
    title: "Levels & guild ranks",
    page: "skills",
    sections: [
      [
        "Experience",
        "All completed requests add adventurer XP. Class requests train their class, profession requests train the recorded role and career discipline, and universal requests earn universal points and partial related training credit.",
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
        "Every 100 source path XP earns a point. Class points pool across combat classes, career points pool by discipline, and universal points use universal requests. Nodes cost multiple points and require level, practice, and prerequisites.",
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
      <details className="panel research-sources">
        <summary>Assessment & training sources</summary>
        {METRIC_SOURCES.map((s) => (
          <p key={s.id}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title} <ExternalLink size={12} />
            </a>
            <small>{s.note}</small>
          </p>
        ))}
      </details>
    </div>
  );
}
