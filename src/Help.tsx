import { useState } from "react";
import { Search, ChevronRight, ExternalLink } from "lucide-react";
import { METRIC_SOURCES } from "./metrics";
import type { Page } from "./screens";
const TOPICS: { title: string; page?: Page; sections: [string, string][] }[] = [
  {
    title: "Character appearance",
    page: "settings",
    sections: [
      [
        "Choosing a look",
        "Choose one of 24 original adult character designs during registration, in Settings → Appearance, or in Adventures → Party → Character appearance. Filter by style or silhouette, switch between Full sprites and Portraits, preview a design, then press Use to save it. All appearances are available without a cost or class requirement.",
      ],
      [
        "Class and appearance",
        "A chosen appearance stays with you when you change class. It changes your full-body battle sprite and close-up turn-order portrait, including an ongoing battle. It does not change base stats, combat stats, equipment, class signatures, skills, or the assessment reference group. Existing characters without a saved choice use a design matching their class family.",
      ],
      [
        "Sprite poses",
        "The current roster uses full-body standing battle sprites. Existing battle hit, damage, and defeat effects apply to them. Separate walking and attack-animation frame sets are not part of this roster.",
      ],
    ],
  },

  {
    title: "Continuing an expedition",
    page: "adventures",
    sections: [
      [
        "Victory and continuation",
        "Continue adventure claims rewards once and begins the next uncleared stage in that place. After the tenth stage, Continue exploring enters repeatable exploration. Discoveries and boss choices stay in the field; Return to map ends the expedition view. It also claims any outstanding victory reward.",
      ],
      [
        "Expanded routes and existing saves",
        "Every place now has ten stages. Only the next uncleared encounter is shown in its route panel. Older character saves retain cleared encounter IDs, companions, regional access and already-unlocked exploration. The newly added stages remain available to complete; they are not marked cleared automatically.",
      ],
      [
        "Battle turns",
        "The turn queue follows the current combat rules: living party members act, then living enemies. Select an enemy for attacks or an ally for healing. HP and MP stay visible in the party panel. Skills learned in the tree must be equipped in the adventure loadout; the active class signature is always available.",
      ],
      [
        "Briar Road enemy tactics",
        "The first two stages stay simple. Later stages introduce shells and winding-up attacks. Ordinary hits wear a shell down and deal reduced damage; power attacks, sweeping techniques, magic, piercing attacks and shield bashes break it immediately. Analysis also breaks a shell. A winding-up enemy telegraphs a heavy strike. The area guardian prepares a cleave that hits all living allies every third round: guard, use a party barrier, heal or use a supply before it lands. Mira can heal or cast Glimmer. Other regions retain their current encounters while further tactics are developed.",
      ],
      [
        "Recovery",
        "HP and MP carry between encounters, retreats, retries and party changes. All party members recover at 12:00 AM in your device’s local time, including when you next reopen the app. Healing skills and supplies still work. A defeated member stays down until midnight; a rested companion can join. Defeat awards no rewards.",
      ],
    ],
  },

  {
    title: "Guild hub & rewards",
    page: "guild",
    sections: [
      [
        "Guild card links",
        "Select class, profession, vocation, attributes, rank, or the skill register on your Guild Card to open that section. Profession and vocation levels are independent of player level. Vocation XP comes from requests and related universal practice credited to that vocation.",
      ],
      [
        "Login allowance",
        "Claim gold and supplies once per local calendar day. Seven claims complete a reward cycle. A missed day pauses the cycle without resetting it. Login rewards never increase XP, base stats, or guild rank. Gold and supplies can be used in Adventures.",
      ],
      [
        "Taken requests",
        "The Guild shows unfinished taken requests for today, this week, and this month. Select a request to review progress and submit completed work.",
      ],
    ],
  },
  {
    title: "Notifications & reminders",
    page: "settings",
    sections: [
      [
        "Notification bell",
        "The bell shows claimable login rewards, ready examinations, and approaching weekly or monthly deadlines. Completed requests and recent actions belong in Journey.",
      ],
      [
        "Android reminders",
        "Enable Android notifications under Settings, then choose a local reminder time (9pm by default). Evening reminders prompt request submission. Pending weekly and monthly requests receive a consolidated deadline reminder the evening before the final calendar day. Completion, release, or changed settings refresh the schedule. Android may delay delivery during battery saving. Permission is required; browser previews do not send device notifications.",
      ],
      [
        "Request icons",
        "The large icon and STR/DEX/CON/INT/WIS/CHA code identify a request's primary attribute. The small badge identifies universal (group), class (shield), profession (briefcase), or vocation (compass). A globe means real-world work, linked circles mean real-world work with adventure requirements or bonuses, and crossed swords on Adventure guild requests mean adventure-only activity. Expand a request to inspect its rewards and requirements.",
      ],
    ],
  },

  {
    title: "Requests & Taken",
    page: "objectives",
    sections: [
      [
        "Universal boards",
        "Choose Strength, Dexterity, Constitution, Intelligence, Wisdom or Charisma to browse universal requests. Search and cadence filters update each board's count. All boards returns to the hall. Class, profession and vocation requests stay directly listed. Taken shows accepted requests together without the board-selection step; Pinned and Suggested group their universal options into stat boards.",
      ],
      [
        "Taking a request",
        "Search by activity or topic, filter by focus and rank, and pin useful requests. Related difficulty variants share one card. Choose rank, inspect its work and reward, then press Take request. Only one rank of a group can reward each period. Release removes an unfinished commitment; completed rewards stay in your history.",
      ],
      [
        "Recurring requests",
        "Daily tasks reset at local midnight, weekly quests on Monday, and monthly adventures on the first. Weekly and monthly goals count relevant activity already logged during that calendar period, even before acceptance. Acceptance and checklists expire at the boundary. A new period requires an explicit Take request; suggestions never accept themselves.",
      ],
      [
        "Completing requests",
        "Mark completed real-world work to claim its listed XP and gold. Weekly and monthly goals check distinct relevant practice dates in the current period. Several completions on one date count as one practice day. Each rank group pays once per period. One-time achievements remain one-time.",
      ],
      [
        "Changing focus",
        "A taken request keeps the class, profession, and vocation it had when accepted. Finish it from Taken to credit that original path. Weekly and monthly commitments expire at their calendar boundary. Logged activity and earned rewards remain in your history. Daily one-time class trials remain until completed or released.",
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
        "Pushups and chair stands measure muscular endurance/function, a bench estimate measures a different aspect of strength, and one-leg stance measures static balance. INT checks learning and reasoning; WIS checks evidence, planning, and practical judgment; CHA checks listening and communication choices. These brief checks are not global intelligence, spiritual, or personality tests.",
      ],
      [
        "Rechecking progress",
        "Save performance checks in Settings to compare actual results over time. Recalibrating starting stats is a separate confirmed action and retains earned training points. New checks rotate through 24 scenario sets per attribute and keep previous form IDs, scores, and timing. The checks are game assessments, not psychometrically validated trait tests. No assessment includes Bible verses.",
      ],
    ],
  },
  {
    title: "Task ranks & transfer",
    page: "objectives",
    sections: [
      [
        "Difficulty and rewards",
        "Daily tasks use F–C ranks and pay 10, 25, 60, or 150 XP. Weekly quests use F–A and pay four times the base rank reward. Monthly adventures use F–SSS and pay eighteen times the base reward. Gold scales by the same cadence multiplier. Monthly goals must finish within their calendar month. Expert S/SS/SSS achievements additionally require prior preparation of 56/84/168 days and 24/36/72 practice dates across history, plus their assessed outcome. Their current-month goals and acceptance still expire at month end. Time alone does not qualify. These are game reward rules.",
      ],
      [
        "Universal training",
        "Universal work awards its full player XP once. It gives a related active class 50% credit weighted by its focus and other unlocked related classes 25%. Relevant professions receive 25% credit. These credits do not add a second player XP reward.",
      ],
      [
        "Class trials and mastery",
        "An entry trial is required before activating a new class. It receives 25% of relevant prior training as transferable XP. The class begins at level 1, then class-specific commissions certify further levels. Stored XP cannot bypass class work or milestone examinations. Prior class progress is retained.",
      ],
      [
        "Stat milestones",
        "Every fifth class or profession level awards increasing game stat points: 2 at level 5, 3 at level 10, 4 at level 15, and so on. Hybrid classes divide these points by their focus. Game growth rewards sustained practice and exceeds real-world change; it does not predict extra kilograms lifted or a medical improvement. Actual performance checks remain visible separately.",
      ],
      [
        "Recording results",
        "After taking a request, choose Add results (optional). Record sets and reps per set, or total reps without sets, plus exercise/variation, load, duration or distance. Mental and career work can record minutes, completed items and a short outcome. Blank fields are allowed. Results are saved with the submitted request and appear in Journey’s chronicle and separate Practice results charts. They do not add XP, change the request’s rank, update starting stats or pass a class exam. Keep different exercise variations named consistently for comparison. Repetition totals describe work volume, not maximum strength. Results are included in character backups.",
      ],
      [
        "Practice credit and stacking",
        "A completed daily request can add one qualifying practice day to each matching accepted weekly/monthly goal. Family, class or career requirements still apply. Several sessions on one day count as one practice day per goal. Calendar goals can also include earlier qualifying submissions in the same week/month, but must be taken and submitted manually before their own deadline and meet their full outcome/checklist. Adding measurements creates no extra completion or payout. Alternate ranks of one request group still pay once per period.",
      ],
      [
        "Training groups and recovery",
        "Alternative requests for the same movement group do not pay repeatedly for the same day. Strength and high-volume endurance requests include recovery intervals. Equipment and recent ability checks gate advanced pull-up tasks. Difficulty is not a recommendation to exceed your current capacity.",
      ],
    ],
  },
  {
    title: "Milestone examinations",
    page: "paths",
    sections: [
      [
        "Maintaining mastery",
        "After two passed improvement milestones using the same physical test or repeatable work sample, Maintain mastery unlocks for that test. Match or exceed your best certified performance on a later day. For mental checks, two passed improvement milestones unlock a new-form mastery attempt at your best score (at least 4/5), without a speed requirement. Alternate tests start their own comparison history; XP and previous progress remain retained.",
      ],
      [
        "Level 5, 10, 15…",
        "Open Class Paths → Examinations. Both training XP and class/profession work must qualify first. Pending exams hold the milestone level and stat reward; XP is retained. Earlier earned levels are preserved on update.",
      ],
      [
        "Physical improvement",
        "Use the same protocol and improve on its recorded baseline by at least 5%, with at least one extra counted repetition where applicable. Lower times use a 5% reduction. Repeat on a later calendar day. Alternate tests are available; a new test first records its own baseline. These are game gates, not clinical change thresholds.",
      ],
      [
        "Mental improvement",
        "Complete a fresh five-question form, score at least 4/5, and improve accuracy; alternatively retain accuracy and improve completion time by at least 5%. Fixed-form scores and times are approximate practice indicators, not proof of global ability. An alternate ten-minute work sample can use a documented task and marking guide, followed by a later-day improvement check.",
      ],
      [
        "Gold and notifications",
        "Completed real-world requests pay their listed gold once into the same wallet used for adventure supplies and equipment. Open the header bell for saved rewards, progression, and ready examinations. Adventures → Guild requests offers gathering deliveries, area patrols, named-monster hunts, roaming-boss bounties, and first-clear dungeon commissions. Delivery stock changes are saved.",
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
        "Every fifth class or profession level requires a passed examination before that level and its increasing base stat points are awarded. Hybrid class milestones follow their archetype balance. Some weekly and monthly requests list a separate stat reward. Purchased skills, equipment, and class stances apply modifiers only during adventures.",
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
        "Ranks run F, E, D, C, B, A, S, SS, SSS. Promotion prices grow 2.5 times each step, beginning at 2,500 XP. A (Gold) requires 161,094 cumulative guild XP. Earlier earned ranks and fractional progress are preserved by a separate migration credit. Rank is separate from level. Most characters register at F; exceptional assessments can start at E or D. Starting placement grants rank credit, without progression XP.",
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
        "Every 100 source path XP earns a point. Class points pool across combat classes, career points pool by discipline, and universal points use universal requests. Entry nodes cost one point and offer early combat choices; advanced nodes cost more points and require higher levels, practice, and prerequisites. Earlier purchases retain their original recorded cost.",
      ],
      [
        "Using the tree",
        "Constellations show connected skill paths. Choose a named style to focus its skills and prerequisite routes. Solid connections require the parent skill; dashed connections are alternatives where one qualifies. Select a star for its effects, MP cost, practice, point cost and requirements. Select a prerequisite name to inspect it. Drag to pan, pinch to zoom, use Fit for an overview or Available skills for a readable starting point. Search and status controls highlight map matches and filter the skill list. Shared archetype levels include training from all contributing classes. Learned skills remain yours after switching paths.",
      ],
      [
        "Skill goals",
        "Set skill goal highlights that skill and its prerequisite network, including alternative routes. A goal does not purchase skills or reserve points. Goals and viewport preferences survive reload within the current session and are separate from character backups.",
      ],
      [
        "Combat loadout",
        "Equip up to four purchased combat skills from the selected-skill panel or Adventures → Skill loadout. Combat modifiers apply while equipped, with no change to base stats. Loadout changes are blocked during an active fight. The active class signature uses no slot and is available automatically. Prestige signatures have greater potency.",
      ],
      [
        "Technique upgrades",
        "Repeated ranks of a combat technique share one loadout slot. If a lower rank is equipped, learning a stronger rank automatically uses the strongest owned version. Earlier skill IDs and point-spending records stay in the skill history; no points are refunded or charged by the upgrade itself. The selected-skill panel and loadout show rank, MP, strength and equipped combat modifiers. Ranked damage, healing, barriers, counters and utility effects scale. Existing active battles keep their saved abilities until the next encounter.",
      ],
    ],
  },
  {
    title: "Adventures & combat",
    page: "adventures",
    sections: [
      [
        "World and stages",
        "Eight regions contain 24 places: outer fields, remote wilds, and dungeons. Each place has ten stages. The map shows only the next uncleared stage, with its enemies, loot and route progress. Clear them to unlock repeatable exploration there. Later places and regions have stage requirements. The map shows local materials, towns, and cleared stages.",
      ],
      [
        "Exploration",
        "A free exploration can reveal monsters, materials, gold caches, landmarks, or a roaming boss. Rewards are saved immediately for findings; battle loot requires Claim rewards. Exploration never awards real-world XP or base stats.",
      ],
      [
        "Boss appearance",
        "Each place has its own base chance. Fields begin at 4%, wilds at 7%, and dungeons at 10%; each unsuccessful exploration adds 2.5, 3, or 4 percentage points. Normal chance caps at 85%; a boss is guaranteed after 24, 20, or 16 unsuccessful explorations respectively. Defeating it resets the counter.",
      ],
      [
        "Leaving and ambushes",
        "A discovered boss offers fight or leave. Leaving adds a deferral, and each later exploration adds another. Ambush chance begins at 8%, 10%, or 14%, adds 8 percentage points per deferral, and is guaranteed at ten deferrals. An ambush gives enemies an opening turn. Pending bosses and danger persist after travel or reload.",
      ],
      [
        "Hybrid objectives",
        "Adventure required means the named guild commission must also be completed during this period before claiming the real-world request. Adventure bonus keeps the base reward available and adds the displayed XP/gold if the commission is complete when you claim. A claimed reward cannot receive the bonus later.",
      ],
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
        "Every town has a general store and smith. Store stock is local; medicinal-herb deliveries replenish healing potions, and supply-route commissions replenish ether. Smith quality doubles in power by tier; forging needs gold and local materials. Equipment and equipped skill modifiers affect combat attributes only.",
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
