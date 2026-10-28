import { createServer } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { PROFILES, CONTROLS } from "./persona-profiles.mjs";
const NativeDate = Date;
let time = new NativeDate("2027-02-01T19:00:00Z").getTime();
globalThis.Date = class extends NativeDate {
  constructor(...args) {
    super(...(args.length ? args : [time]));
  }
  static now() {
    return time;
  }
};
const smoke = process.argv.includes("--smoke"),
  days = Number(
    process.argv.find((x) => x.startsWith("--days="))?.split("=")[1] ||
      (smoke ? 35 : 365),
  );
const pick = process.argv
  .find((x) => x.startsWith("--profile="))
  ?.split("=")[1];
const folder = smoke ? "/tmp/guild-persona-smoke" : "docs/personas-1.25";
const batchArg = process.argv
  .find((x) => x.startsWith("--batch="))
  ?.split("=")[1];
const [batchIndex, batchCount] = batchArg
  ? batchArg.split("/").map(Number)
  : [0, 1];
const resume = process.argv.includes("--resume");
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const hash = (s) => {
  let n = 2166136261;
  for (const x of s) n = Math.imul(n ^ x.charCodeAt(0), 16777619);
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
};
const roll = (id, key) => hash(`${id}:${key}`) / 4294967296;
try {
  const modules = await Promise.all(
    [
      "domain",
      "metrics",
      "exam-bank",
      "exams",
      "activity-results",
      "storage",
      "training-regimen",
      "careers",
      "rpg",
      "world",
      "world-state",
      "world-catalog",
      "economy-simulation",
      "login-rewards",
      "workshop",
      "equipment-progression",
      "supplies",
      "career-payoffs",
    ].map((x) => server.ssrLoadModule(`/src/${x}.ts`)),
  );
  const [
    d,
    m,
    bank,
    exam,
    a,
    store,
    t,
    k,
    r,
    w,
    ws,
    wc,
    eco,
    login,
    shop,
    gear,
    supply,
    career,
  ] = modules;
  const workshop = {
    temper: shop.temper,
    quote: shop.temperQuote,
    brew: shop.brew,
    use: r.useSupply,
    modifiers: gear.gearModifiers,
    supplies: supply.SUPPLIES,
  };
  await mkdir(`${folder}/runs`, { recursive: true });
  await mkdir(`${folder}/accounts`, { recursive: true });
  const seedProfiles = smoke
    ? PROFILES.filter((p) => ["maya", "priya", "theo", "quinn"].includes(p.id))
    : PROFILES;
  const matrix = [
    ...seedProfiles.map((profile) => ({
      profile,
      variant: "primary",
      id: profile.id,
    })),
    ...(!smoke && !pick
      ? CONTROLS.map((q) => ({
          profile: {
            ...PROFILES.find((p) => p.id === q.profile),
            ...q.overrides,
          },
          variant: q.label,
          id: q.id,
        }))
      : []),
  ].filter(
    (q, i) => (!pick || q.profile.id === pick) && i % batchCount === batchIndex,
  );
  const sourceHashes = {};
  for (const file of [
    "src/domain.ts",
    "src/careers.ts",
    "src/professions.ts",
    "src/progression.ts",
    "src/progression-ledger.ts",
    "src/class-catalog.ts",
    "src/exams.ts",
    "src/exam-rules.ts",
    "src/exam-bank.ts",
    "src/metrics.ts",
    "src/training-tasks.ts",
    "src/training-prescriptions.ts",
    "src/training-regimen.ts",
    "src/calendar-goals.ts",
    "src/adventure-requests.ts",
    "src/skill-catalog.ts",
    "src/expanded-skills.ts",
    "src/career-payoffs.ts",
    "src/rpg.ts",
    "src/world.ts",
    "src/world-state.ts",
    "src/world-catalog.ts",
    "src/economy-simulation.ts",
    "src/request-balance.ts",
    "src/login-rewards.ts",
    "src/workshop.ts",
    "src/supplies.ts",
    "src/storage.ts",
    "scripts/persona-profiles.mjs",
    "scripts/simulate-personas.mjs",
  ])
    sourceHashes[file] = createHash("sha256")
      .update(await readFile(file))
      .digest("hex");
  const signature = createHash("sha256")
    .update(JSON.stringify(sourceHashes) + days)
    .digest("hex");
  const runs = [];
  const dailyRows = [];
  for (const item of matrix) {
    const wallStarted = performance.now(),
      rowStart = dailyRows.length;
    if (resume) {
      try {
        const cached = JSON.parse(
          await readFile(`${folder}/runs/${item.id}.json`, "utf8"),
        );
        if (cached.signature === signature && cached.days === days) {
          runs.push(cached);
          dailyRows.push(
            ...(await readFile(`${folder}/runs/${item.id}.csv`, "utf8"))
              .trim()
              .split("\n"),
          );
          console.log(JSON.stringify({ resumed: item.id }));
          continue;
        }
      } catch {
        /* No matching completed case. */
      }
    }
    const p = item.profile;
    process.env.TZ = p.timezone;
    time = new NativeDate(2027, 1, 1, 12).getTime();
    const origin = new NativeDate(time),
      events = [],
      history = [],
      blocks = {},
      income = {
        requests: 0,
        login: 0,
        battles: 0,
        exploration: 0,
        commissions: 0,
      },
      spent = { supplies: 0, equipment: 0, tempering: 0, brewing: 0 };
    const fixture = {
      ...{
        starter: { style: "wall", push: 6, balance: 14, walk: 430 },
        steady: { style: "floor", push: 18, balance: 30, walk: 545 },
        trained: { style: "floor", push: 36, balance: 45, walk: 680 },
        chair: { style: "wall", chair: 15, balance: 22, walk: 450 },
        unmeasured: { style: "floor", push: null, balance: null, walk: null },
      }[p.fitness],
      ...p.fitnessOverrides,
    };
    const assessment = {
      ...m.EMPTY_ASSESSMENT,
      age: p.age,
      sex: p.sex || "unspecified",
      heightCm: 170,
      massKg: 75,
      pushupStyle: fixture.style,
      pushups: fixture.push ?? null,
      balanceSeconds: fixture.balance,
      walkMetres: fixture.walk,
      strengthTest: fixture.chair ? "chair" : "pushups",
      chairStands: fixture.chair ?? null,
      mental: {},
    };
    for (const [i, stat] of ["INT", "WIS", "CHA"].entries()) {
      if (p.fitness === "unmeasured") continue;
      const form = bank.mentalForm(stat),
        score = p.mentalScores[i];
      assessment.mental[stat] = {
        formId: form.id,
        answers: form.questions.map((q, i) =>
          i < score ? q.answer : (q.answer + 1) % 4,
        ),
        completedAt: new NativeDate(time - 86400000).toISOString(),
        durationMs: 210000,
        challenge: 1,
      };
    }
    let c = d.awardSkills(
      d.createCharacter(
        p.name,
        { ...d.EMPTY_BASELINE, assessment },
        p.startClass,
        p.profession,
      ),
    );
    c = {
      ...c,
      vocation: p.vocation,
      preferences: {
        ...c.preferences,
        units: p.units,
        equipment: [
          "bodyweight",
          ...(p.equipment === "home" ? [] : [p.equipment]),
        ],
      },
      trainingPlan: {
        version: 1,
        rank: p.fitness === "trained" ? "D" : "F",
        environment: p.equipment,
        startedOn: t.localDate(),
        walkMinutes: p.fitness === "trained" ? 30 : 5,
      },
    };
    c = { ...c, campaign: r.campaign(c) };
    const initial = {
      stats: d.stats(c),
      rank: d.characterRank(c).name,
      classId: c.activeClass,
      profession: c.profession,
      vocation: c.vocation,
    };
    if (c.activeClass !== p.startClass)
      events.push({
        day: 0,
        type: "starting-class-rejected",
        wanted: p.startClass,
        actual: c.activeClass,
      });
    let activeDays = 0,
      requests = 0,
      minutes = 0,
      expired = 0,
      examDays = 0,
      partial = 0,
      failedAttempts = 0,
      duplicateGuards = 0,
      level4Days = 0,
      profession4Days = 0,
      careerChangeDone = false,
      certificateDone = false,
      trialTracker = {},
      rankChanges = 0,
      lastSkillReview = -14;
    let combat = {
      attempts: 0,
      wins: 0,
      losses: 0,
      actions: 0,
      bounds: 0,
      explorations: 0,
      hunts: 0,
      huntWins: 0,
      ambushes: 0,
      heroAbilities: 0,
      companionAbilities: 0,
      suppliesUsed: 0,
    };
    const record = (day, type, detail = {}) =>
      events.push({ day: day + 1, type, ...detail });
    const missing = (name, reasons) => {
      for (const reason of reasons) {
        const key = `${name}: ${reason.replace(/\d+(\.\d+)?/g, "#")}`;
        blocks[key] = (blocks[key] || 0) + 1;
      }
    };
    const requestMap = () => new Map(d.objectives(c).map((o) => [o.id, o]));
    let remaining = 0,
      now = new NativeDate(time),
      day = 0;
    const getTaken = (id) => {
      const receipt = c.takenRequests?.find((o) => o.id === id);
      return receipt && d.isTaken(c, receipt, now)
        ? d.resolveTakenRequest(c, receipt)
        : undefined;
    };
    const take = (id) => {
      const next = d.takeRequest(c, id, now);
      if (next !== c) c = next;
      return getTaken(id);
    };
    const submit = (id, result, cost = 0) => {
      let o = getTaken(id);
      if (!o) o = take(id);
      if (!o || d.isComplete(c, o, now)) return false;
      const reasons = d.taskRequirements(c, o, now);
      if (reasons.length) {
        missing(o.cadence, reasons);
        return false;
      }
      if (remaining < cost) {
        blocks["Time budget"] = (blocks["Time budget"] || 0) + 1;
        return false;
      }
      if (o.checklist)
        c = {
          ...c,
          milestones: {
            ...c.milestones,
            [`${id}:${d.objectivePeriod(o, now)}`]: o.checklist.map(
              (_, i) => i,
            ),
          },
        };
      const before = c,
        next = a.completeWithResult(c, o, result, now);
      if (next === c) {
        failedAttempts++;
        return false;
      }
      c = d.awardSkills(next);
      const receipt = c.completions.at(-1);
      income.requests += receipt.gold || 0;
      requests++;
      remaining -= cost;
      minutes += cost;
      if (o.cadence !== "daily" || o.kind === "class-trial")
        record(day, "request", {
          id,
          title: o.title,
          cadence: o.cadence,
          xp: receipt.xp,
          gold: receipt.gold,
        });
      if (requests % 47 === 0) {
        const again = a.completeWithResult(c, o, result, now);
        if (again !== c) throw Error("Duplicate request paid");
        duplicateGuards++;
      }
      return true;
    };
    const goalAtDay = () =>
      p.nextGoalClass && day >= (p.nextGoalDay || 180)
        ? p.nextGoalClass
        : p.goalClass;
    const desiredClass = () => {
      if (p.classDetour && day >= p.classDetour.from && day < p.classDetour.to)
        return p.classDetour.classId;
      const goal = d.CLASSES.find((x) => x.id === goalAtDay());
      if (c.activeClass === goal.id) return goal.id;
      const parent = goal.classRequirements?.find(
        (x) => d.classLevel(c, x.id) < x.level,
      );
      if (parent) return parent.id;
      const deficit = Object.entries(goal.requirements)
        .map(([stat, n]) => ({ stat, n: n - d.stats(c)[stat] }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n)[0];
      if (deficit) {
        if (d.currentPath(c).stat === deficit.stat) return c.activeClass;
        const base = {
          STR: "warrior",
          DEX: "rogue",
          CON: "sentinel",
          INT: "scholar",
          WIS: "disciple",
          CHA: "bard",
        }[deficit.stat];
        return base;
      }
      return goal.id;
    };
    const purchaseSkills = () => {
      let added = 0;
      const cat = k.careerCategory(c.profession).id,
        voc = d.activeVocation(c)?.category;
      const goal = d.CLASSES.find((x) => x.id === goalAtDay()),
        wanted = new Set(goal.requiredSkills || []);
      const closure = (id) => {
        const skill = d.SKILLS.find((s) => s.id === id);
        if (!skill) return;
        for (const parent of skill.parents) {
          if (!wanted.has(parent)) {
            wanted.add(parent);
            closure(parent);
          }
        }
      };
      [...wanted].forEach(closure);
      const score = (s) =>
        (wanted.has(s.id) ? -100 : 0) +
        (s.id === `profession-${cat}-0` || s.id === `profession-${voc}-0`
          ? -80
          : 0) +
        (s.id.startsWith(`focus-${c.activeClass}-`) ? -60 : 0) +
        (s.id.includes(p.combatStyle) ? -50 : 0) +
        (s.category === "profession" ? -20 : 0) +
        s.cost / 100;
      const candidates = d.SKILLS.filter(
        (s) =>
          !s.legacy &&
          !s.automatic &&
          !c.earnedSkills.includes(s.id) &&
          (s.category === "universal" ||
            (s.category === "class" &&
              (s.archetype
                ? d.currentPath(c).mix[s.archetype]
                : s.owner === c.activeClass)) ||
            (s.category === "profession" &&
              [cat, voc].includes(d.skillWallet(c, s).slice(11)))),
      ).sort((x, y) => score(x) - score(y));
      for (const s of candidates) {
        if (added >= 3) break;
        if (d.skillRequirements(c, s).length) continue;
        const next = d.learnSkill(c, s.id);
        if (next !== c) {
          c = next;
          added++;
          record(day, "skill", {
            id: s.id,
            name: s.name,
            wallet: d.skillWallet(c, s),
          });
        }
      }
      // Explicit slot choices retain one technique per family and leave room for the signature.
      const learned = d.SKILLS.filter(
        (s) => c.earnedSkills.includes(s.id) && s.combat && !s.nonCombat,
      ).sort((x, y) => score(x) - score(y));
      const selected = [];
      for (const s of learned) {
        if (selected.length >= 4) break;
        const family = s.combatFamily || s.id;
        if (
          !selected.some(
            (id) =>
              (d.SKILLS.find((x) => x.id === id)?.combatFamily || id) ===
              family,
          )
        )
          selected.push(s.id);
      }
      for (const id of [...r.campaign(c).equippedSkills])
        if (!selected.includes(id)) c = r.toggleEquippedSkill(c, id);
      for (const id of selected)
        if (!r.campaign(c).equippedSkills.includes(id))
          c = r.toggleEquippedSkill(c, id);
    };
    const doExam = () => {
      if (p.examPolicy === "avoid" || remaining < 10) return;
      const candidates = exam
        .examTargets(c)
        .filter((t) => t.ready)
        .sort(
          (x, y) =>
            (x.owner === c.activeClass
              ? -2
              : x.scope === "profession"
                ? -1
                : 0) -
            (y.owner === c.activeClass
              ? -2
              : y.scope === "profession"
                ? -1
                : 0),
        );
      for (const target of candidates) {
        const old = (c.exams || []).filter(
            (e) => e.scope === target.scope && e.owner === target.owner,
          ),
          last = old.at(-1);
        if (last && (now - new NativeDate(last.at)) / 86400000 < 14) continue;
        const physical = ["STR", "DEX", "CON"].includes(target.stat),
          work = !physical && p.examMode === "work";
        let next;
        if (physical || work) {
          const protocol = physical
            ? target.stat === "STR"
              ? fixture.chair
                ? "chair"
                : `push-${fixture.style}`
              : target.stat === "CON"
                ? "walk6"
                : fixture.balance >= 42
                  ? "target-taps"
                  : "balance"
            : exam.workProtocolId(
                target.stat,
                `${target.owner}: same fictional ${target.stat} work-sample rubric; evidence and scoring anchors fixed.`,
              );
          const note = physical
            ? "Scripted same-protocol performance; no real-world outcome prediction."
            : `${target.owner}: same fictional ${target.stat} work-sample rubric; evidence and scoring anchors fixed.`;
          const pract = c.completions.filter((x) =>
            work
              ? target.scope === "profession"
                ? x.scope === "profession" &&
                  x.profession === target.owner &&
                  x.careerCategory === k.careerCategory(target.owner).id
                : x.scope === "class" &&
                  x.classId === target.owner &&
                  !x.trialClass
              : x.stat === target.stat,
          ).length;
          const start = work
            ? 50
            : target.stat === "STR"
              ? fixture.chair || fixture.push || 5
              : target.stat === "CON"
                ? fixture.walk || 450
                : protocol === "balance"
                  ? fixture.balance || 15
                  : 35;
          const gain = work
            ? 22
            : target.stat === "STR"
              ? Math.max(8, start * 0.4)
              : target.stat === "CON"
                ? 90
                : protocol === "balance"
                  ? 12
                  : 18;
          const value = Math.min(
            protocol === "balance" ? 45 : 1e6,
            Math.round(start + gain * (1 - Math.exp(-pract / 55))),
          );
          const route = exam.masteryStandard(c, target, protocol).eligible
            ? "mastery"
            : "improvement";
          next = exam.submitFitnessExam(
            c,
            target,
            protocol,
            value,
            note,
            now,
            route,
          );
        } else {
          const previous = exam.previousMental(c, target),
            mastered = exam.masteryStandard(c, target),
            passed = old.filter((x) => x.status === "passed").length;
          const form = bank.nextMentalForm(
            target.stat,
            exam.usedExamForms(c),
            mastered.challenge || 1,
          );
          const score = passed < 1 ? 4 : 5;
          const result = {
            formId: form.id,
            answers: form.questions.map((q, i) =>
              i < score ? q.answer : (q.answer + 1) % 4,
            ),
            completedAt: now.toISOString(),
            durationMs: passed < 2 ? 150000 : 140000,
            challenge: form.challenge,
          };
          next = exam.submitMentalExam(
            exam.beginExam(c, target, form, now),
            target,
            result,
            now,
            mastered.eligible ? "mastery" : "improvement",
          );
        }
        if (next !== c) {
          c = d.awardSkills(next);
          remaining -= 10;
          minutes += 10;
          examDays++;
          const e = c.exams.at(-1);
          record(day, "exam", {
            scope: target.scope,
            owner: target.owner,
            milestone: target.milestone,
            status: e.status,
            route: e.route,
            value: e.value,
          });
        }
        break;
      }
    };
    const trade = () => {
      let data = r.campaign(c),
        town = data.world.townId;
      const desired = wc.TOWN_GEAR.filter(
        (g) =>
          g.town === town &&
          (g.slot === "armor" || g.mod[d.currentPath(c).stat]),
      );
      for (const g of desired) {
        const old = data.equipment
          .map((id) => r.EQUIPMENT.find((x) => x.id === id))
          .find((x) => x?.slot === g.slot);
        const better = Object.entries(g.mod).some(
          ([s, n]) => n > ((old && gear.gearModifiers(c, old)[s]) || 0),
        );
        if (!data.inventory[g.id] && better && data.gold >= g.price + 100) {
          const before = data.gold,
            next = r.buy(c, g.id);
          if (next !== c) {
            c = r.equip(next, g.id);
            spent.equipment += before - r.campaign(c).gold;
            data = r.campaign(c);
          }
        }
      }
      for (const g of desired.filter((g) =>
        r.campaign(c).equipment.includes(g.id),
      )) {
        const q = shop.temperQuote(c, g.id);
        if (q && q.rank < 2 && r.campaign(c).gold >= q.gold + 100) {
          const before = r.campaign(c).gold,
            next = shop.temper(c, g.id);
          if (next !== c) {
            c = next;
            spent.tempering += before - r.campaign(c).gold;
          }
        }
      }
      for (const id of ["potion", "ether"]) {
        data = r.campaign(c);
        if ((data.inventory[id] || 0) < 4) {
          const before = data.gold,
            next = r.buy(c, id, Math.min(3, 4 - (data.inventory[id] || 0)));
          if (next !== c) {
            c = next;
            spent.supplies += before - r.campaign(c).gold;
          }
        }
      }
      for (const id of ["greater-potion", "greater-ether"]) {
        data = r.campaign(c);
        if ((data.inventory[id] || 0) < 2) {
          const before = data.gold,
            next = shop.brew(c, id);
          if (next !== c) {
            c = next;
            spent.brewing += before - r.campaign(c).gold;
          }
        }
      }
    };
    const adventures = () => {
      if (!p.encounters || !p.adventureDays.includes(day % 7)) return;
      for (
        let slot = 0, outings = 0;
        slot < p.encounters && outings < p.encounters * 3;
        outings++
      ) {
        c = w.returnToMap(c);
        trade();
        let data = r.campaign(c);
        // Recruit only after the exact UI unlock, then select at most two companions.
        for (const npc of r.COMPANIONS)
          if (
            (!npc.requires || data.cleared.includes(npc.requires)) &&
            !data.roster.includes(npc.id)
          )
            data = { ...data, roster: [...data.roster, npc.id] };
        const available = p.companions.filter((id) => data.roster.includes(id));
        if (available.length) data = { ...data, party: available.slice(0, 2) };
        c = { ...c, campaign: data };
        for (const q of wc.WORLD_CONTRACTS.filter(
          (q) => q.town === data.world.townId,
        )) {
          if (
            q.kind === "delivery" &&
            (data.inventory[q.resource] || 0) < q.quantity + 8
          )
            continue;
          c = w.takeWorldContract(c, q.id, now);
          if (w.contractProgress(c, q.id) >= q.quantity) {
            const before = r.campaign(c).gold;
            c = w.completeWorldContract(c, q.id, now);
            income.commissions += r.campaign(c).gold - before;
          }
        }
        const places = wc.PLACES.filter((x) =>
          ws.placeOpen(r.campaign(c), x.id),
        );
        const next = places.flatMap((x) =>
          x.stages.filter((id) => !r.campaign(c).cleared.includes(id)),
        )[0];
        const explorePlace = places
          .filter((x) => ws.placeCleared(r.campaign(c), x.id))
          .at(-1);
        // Occasionally revisit a cleared place for materials; no artificial encounters or loot.
        if (
          explorePlace &&
          (!next || roll(p.id, `explore-${day}-${outings}`) < 0.25)
        ) {
          const before = r.campaign(c).gold;
          let eventDraw = 0;
          c = w.explore(
            c,
            explorePlace.id,
            () => roll(p.id, `event-${day}-${outings}-${eventDraw++}`),
            now,
          );
          income.exploration += r.campaign(c).gold - before;
          combat.explorations++;
          const event = r.campaign(c).world.areas[explorePlace.id]?.last;
          if (event?.kind === "boss") c = w.challengeBoss(c, explorePlace.id);
          if (event?.kind === "ambush") combat.ambushes++;
        } else if (next) c = r.startBattle(c, next, now);
        if (!r.campaign(c).battle) {
          if (r.adventureParty(c, now).every((x) => x.hp === 0)) break;
          continue;
        }
        slot++;
        combat.attempts++;
        let actions = 0;
        while (r.campaign(c).battle?.phase === "player" && actions++ < 180) {
          const battle = r.campaign(c).battle,
            actor = battle.party[battle.actor],
            action = eco.economyAction(c, workshop),
            before = r.campaign(c).inventory;
          c = r.act(c, action, now);
          combat.actions++;
          if (action.kind === "ability")
            combat[
              actor.id === "hero" ? "heroAbilities" : "companionAbilities"
            ]++;
          for (const id of Object.keys(supply.SUPPLIES))
            combat.suppliesUsed += Math.max(
              0,
              (before[id] || 0) - (r.campaign(c).inventory[id] || 0),
            );
        }
        if (r.campaign(c).battle.phase === "won") {
          const before = r.campaign(c).gold;
          c = r.claimVictory(c);
          income.battles += r.campaign(c).gold - before;
          combat.wins++;
          c = w.leaveBattle(c);
        } else {
          if (r.campaign(c).battle.phase === "player") {
            combat.bounds++;
            c = r.act(c, { kind: "flee", target: 0 }, now);
          }
          combat.losses++;
          c = w.returnToMap(c);
          break;
        }
      }
      c = w.returnToMap(c);
    };
    const snapshot = () => ({
      day: day + 1,
      active: activeDays,
      playerLevel: d.level(d.adventurerXP(c)),
      guildRank: d.characterRank(c).name,
      xp: d.totalXP(c),
      classId: c.activeClass,
      classLevel: d.classLevel(c, c.activeClass),
      classPotential: d.classTrainingLevel(c, c.activeClass),
      profession: c.profession,
      professionLevel: d.professionLevel(c),
      professionPotential: d.professionTrainingLevel(c),
      vocation: c.vocation,
      vocationLevel: d.vocationLevel(c),
      stats: d.stats(c),
      requests,
      gold: r.campaign(c).gold,
      skills: c.earnedSkills.length,
      careerUtilities: career.CAREER_UTILITIES.filter((u) =>
        career.hasCareerUtility(c, u.id),
      ).length,
      examPasses: (c.exams || []).filter((e) => e.status === "passed").length,
      stages: r
        .campaign(c)
        .cleared.filter((id) =>
          wc.WORLD_ENCOUNTERS.some((e) => e.id === id && e.kind === "stage"),
        ).length,
      wins: combat.wins,
      losses: combat.losses,
      minutes,
    });
    const seenAcceptances = new Set(),
      seenExpired = new Set();
    for (day = 0; day < days; day++) {
      now = new NativeDate(origin);
      now.setDate(origin.getDate() + day);
      time = now.getTime();
      for (const old of c.takenRequests || []) {
        const key = `${old.id}:${old.takenPeriod}`;
        if (
          old.calendarBound &&
          old.takenPeriod !== d.period(old.cadence, now) &&
          !seenExpired.has(key) &&
          !c.completions.some(
            (x) => x.id === old.id && x.period === old.takenPeriod,
          )
        ) {
          seenExpired.add(key);
          expired++;
          record(day, "expired", {
            id: old.id,
            cadence: old.cadence,
            period: old.takenPeriod,
          });
        }
      }
      const absent = p.breaks.some(([lo, hi]) => day >= lo && day <= hi),
        active =
          !absent &&
          p.activeDays.includes(day % 7) &&
          roll(p.id, `attendance-${day}`) < p.adherence;
      remaining = day % 7 >= 5 ? p.weekendBudget || p.budget : p.budget;
      const startMinutes = minutes,
        dayBudget = remaining;
      if (active) {
        activeDays++;
        c = { ...c, campaign: r.campaign(c, now) };
        const before = r.campaign(c).gold;
        c = login.claimLoginReward(c, now);
        income.login += r.campaign(c).gold - before;
        if (!careerChangeDone && p.careerChange && day >= p.careerChange.day) {
          const old = c.profession;
          c = {
            ...c,
            profession: p.careerChange.profession,
            vocation: p.careerChange.vocation,
          };
          careerChangeDone = true;
          record(day, "career-change", {
            from: old,
            to: c.profession,
            vocation: c.vocation,
          });
        }
        if (!certificateDone && p.certificate && day >= p.certificate.day) {
          c = d.awardSkills({
            ...c,
            certificates: [
              ...c.certificates,
              {
                id: crypto.randomUUID(),
                name: p.certificate.name,
                issuer: p.certificate.issuer,
                date: t.localDate(now),
                reference:
                  "Explicit fictional scenario input; not externally verified.",
              },
            ],
          });
          certificateDone = true;
          record(day, "certificate", { name: p.certificate.name });
        }
        const readiness = t.planProgress(c, c.trainingPlan);
        if (
          readiness.ready &&
          readiness.next &&
          day >= (rankChanges + 1) * 56 &&
          { F: 15, E: 30, D: 40, C: 50 }[readiness.next] <= p.budget
        ) {
          const old = c.trainingPlan.rank;
          c = {
            ...c,
            trainingPlan: { ...c.trainingPlan, rank: readiness.next },
          };
          rankChanges++;
          record(day, "training-rank", { from: old, to: readiness.next });
        }
        const map = requestMap();
        const wantsCareer = p.priority === "career";
        const weekly = [
          ...(wantsCareer
            ? ["profession-weekly", `vocation-${c.vocation}-weekly`]
            : [`${c.activeClass}-weekly`, `vocation-${c.vocation}-weekly`]),
          "habit-walk-weekly-f",
        ];
        const monthly = [
          ...(wantsCareer
            ? ["profession-monthly", `vocation-${c.vocation}-monthly`]
            : [`${c.activeClass}-monthly`, `vocation-${c.vocation}-monthly`]),
          "habit-walk-monthly-f",
        ];
        const commitments =
          p.priority === "minimal"
            ? ["habit-walk-weekly-f", "habit-walk-monthly-f"]
            : [
                ...weekly.filter((id) => map.has(id)).slice(0, 2),
                ...monthly.filter((id) => map.has(id)).slice(0, 2),
              ];
        for (const id of commitments) {
          const o = map.get(id);
          if (!o) continue;
          const period = d.objectivePeriod(o, now),
            key = `${id}:${period}`;
          if (roll(p.id, `consent-${period}`) > p.calendarConsent) continue;
          if (!seenAcceptances.has(key)) {
            const taken = take(id);
            if (taken) {
              seenAcceptances.add(key);
              record(day, "take", { id, cadence: o.cadence, period });
            }
          }
        }
        const desired = desiredClass();
        let trialWorked = false;
        if (desired !== c.activeClass) {
          if (c.unlockedClasses.includes(desired)) {
            const old = c.activeClass;
            c = d.switchClass(c, desired);
            if (c.activeClass !== old)
              record(day, "class-change", {
                from: old,
                to: c.activeClass,
                playerLevel: d.level(d.adventurerXP(c)),
                classLevel: d.classLevel(c, c.activeClass),
              });
          } else {
            const trial = map.get(`trial-${desired}-entry`);
            const trialCost = trial?.cadence === "weekly" ? 15 : 25;
            if (trial && remaining >= trialCost) {
              const staged = take(trial.id);
              if (staged) {
                const prep = trialTracker[trial.id] || [];
                if (!prep.includes(day)) {
                  trialTracker[trial.id] = [...prep, day];
                  remaining -= trialCost;
                  minutes += trialCost;
                  trialWorked = true;
                }
                const count = trial.cadence === "weekly" ? 3 : 1;
                if (
                  trialTracker[trial.id].length >= count &&
                  submit(
                    trial.id,
                    {
                      output: `Completed the declared ${count}-session ${desired} trial; scripted practice evidence.`,
                    },
                    0,
                  )
                ) {
                  const old = c.activeClass;
                  c = d.switchClass(d.awardSkills(c), desired);
                  record(day, "class-change", {
                    from: old,
                    to: c.activeClass,
                    playerLevel: d.level(d.adventurerXP(c)),
                    classLevel: d.classLevel(c, c.activeClass),
                  });
                }
              }
            }
          }
        }
        if (p.socialQuest && day % 28 === (p.socialDay ?? 5)) {
          submit(
            p.socialQuest,
            {
              topic: p.learningTopic,
              output:
                "Explicit fictional group activity with the described preparation and feedback.",
            },
            p.socialMinutes || 60,
          );
        }
        if (day % 7 === p.activeDays.at(-1)) doExam();
        const workMap = requestMap();
        const physicalStrength = d.currentPath(c).stat === "STR",
          strengthDay = [0, 3].includes(day % 7),
          classDue = physicalStrength
            ? strengthDay
            : p.classDays.includes(day % 7);
        const priorities =
          p.priority === "career"
            ? ["profession", "vocation", "class", "walk"]
            : p.priority === "minimal"
              ? ["walk", "class", "profession", "vocation"]
              : day % 2
                ? ["profession", "class", "vocation", "walk"]
                : ["class", "vocation", "profession", "walk"];
        for (const kind of priorities) {
          if (kind === "class" && classDue && !trialWorked) {
            const o = workMap.get(`${c.activeClass}-daily`);
            if (!o) continue;
            const cost = o.workout
              ? { F: 15, E: 30, D: 40, C: 50 }[o.workout.rank] +
                (o.checklist?.length ? 5 : 0)
              : 20;
            if (remaining < cost) {
              blocks["Time budget"] = (blocks["Time budget"] || 0) + 1;
              continue;
            }
            if (o.workout) {
              if (partial < (p.partialWorkouts || 0)) {
                partial++;
                remaining -= cost;
                minutes += cost;
                record(day, "partial-workout", {
                  id: o.id,
                  reason: "Below prescribed minimum; no receipt or XP.",
                });
                continue;
              }
              const n = c.completions.filter(
                  (x) => x.workout?.rank === o.workout.rank,
                ).length,
                top = n >= 3;
              submit(
                o.id,
                {
                  workout: {
                    prescription: o.workout,
                    exercises: o.workout.exercises.map((e) => ({
                      id: e.id,
                      variation: e.name,
                      reps: Array(e.sets).fill(top ? e.max : e.min),
                      rir: 3,
                      ...(e.load
                        ? {
                            loadKg:
                              (p.initialLoads?.[e.id] ||
                                (p.equipment === "gym"
                                  ? {
                                      squat: 80,
                                      push: 25,
                                      row: 30,
                                      hinge: 30,
                                      "split-squat": 12,
                                    }[e.id]
                                  : {
                                      squat: 12,
                                      push: 16,
                                      row: 10,
                                      hinge: 20,
                                      "split-squat": 8,
                                    }[e.id]) ||
                                10) * (o.workout.rank === "C" ? 1.05 : 1),
                          }
                        : {}),
                    })),
                  },
                },
                cost,
              );
            } else
              submit(
                o.id,
                { topic: p.learningTopic, output: p.deliverable },
                cost,
              );
          }
          if (kind === "profession" && p.careerDays.includes(day % 7))
            submit(
              "profession-daily",
              { topic: p.learningTopic, output: p.deliverable },
              20,
            );
          if (
            kind === "vocation" &&
            p.vocationDays.includes(day % 7) &&
            c.vocation
          )
            submit(
              `vocation-${c.vocation}-daily`,
              {
                topic: p.learningTopic,
                output: `Separate focused vocation block: ${p.deliverable}`,
              },
              20,
            );
          if (kind === "walk" && remaining >= 5) {
            const id =
                c.trainingPlan.walkMinutes >= 30 ? "u-walk-brisk" : "u-walk-5",
              cost = c.trainingPlan.walkMinutes >= 30 ? 35 : 5;
            submit(
              id,
              {
                exercise: "Walking block",
                minutes: c.trainingPlan.walkMinutes,
              },
              cost,
            );
          }
        }
        for (const o of d
          .takenObjectives(c, now)
          .filter((o) => o.cadence !== "daily" && o.kind !== "class-trial"))
          submit(
            o.id,
            {
              output: `Reviewed dated practice and completed a separate ${p.learningTopic} deliverable.`,
            },
            3,
          );
        if (day - lastSkillReview >= 7) {
          purchaseSkills();
          lastSkillReview = day;
        }
        const xpBeforeAdventure = d.totalXP(c),
          statsBeforeAdventure = JSON.stringify(d.stats(c));
        adventures();
        if (
          d.totalXP(c) !== xpBeforeAdventure ||
          JSON.stringify(d.stats(c)) !== statsBeforeAdventure
        )
          throw Error("Adventure changed real-world progression");
        c = { ...c, campaign: r.campaign(c, now) };
      }
      if (remaining < 0 || minutes - startMinutes > dayBudget)
        throw Error("Daily time budget exceeded");
      const lv = d.classLevel(c, c.activeClass),
        pl = d.professionLevel(c);
      if (lv === 4 && d.classTrainingLevel(c, c.activeClass) >= 5) level4Days++;
      if (pl === 4 && d.professionTrainingLevel(c) >= 5) profession4Days++;
      if (day % 7 === 6 || [6, 29, 89, 179].includes(day) || day === days - 1) {
        if (!store.validateCharacter(c))
          throw Error(`${item.id}: invalid save at day ${day + 1}`);
        c = JSON.parse(JSON.stringify(c));
        if (!store.validateCharacter(c)) throw Error("Roundtrip invalid");
      }
      const wallet = r.campaign(c, now).gold,
        earned = Object.values(income).reduce((n, x) => n + x, 0),
        paid = Object.values(spent).reduce((n, x) => n + x, 0);
      if (wallet !== earned - paid)
        throw Error(
          `${item.id}: gold mismatch ${day + 1}: ${wallet} != ${earned - paid}`,
        );
      const s = snapshot();
      history.push(s);
      dailyRows.push(
        [
          item.id,
          day + 1,
          active ? 1 : 0,
          s.playerLevel,
          s.guildRank,
          s.xp,
          s.classId,
          s.classLevel,
          s.classPotential,
          s.profession,
          s.professionLevel,
          s.professionPotential,
          s.vocation || "",
          s.vocationLevel,
          ...d.ATTRIBUTES.map((a) => s.stats[a]),
          s.requests,
          s.gold,
          s.skills,
          s.careerUtilities,
          s.examPasses,
          s.stages,
          s.wins,
          s.losses,
          s.minutes,
        ].join(","),
      );
    }
    const target = d.CLASSES.find((x) => x.id === goalAtDay()),
      final = snapshot();
    final.day = days;
    const result = {
      id: item.id,
      signature,
      profileId: p.id,
      variant: item.variant,
      days,
      initial,
      final,
      checkpoints: history.filter((s) =>
        [7, 30, 90, 180, 365, days].includes(s.day),
      ),
      income,
      spent,
      combat,
      requestsByCadence: Object.fromEntries(
        ["daily", "weekly", "monthly"].map((cad) => [
          cad,
          c.completions.filter((x) => x.cadence === cad).length,
        ]),
      ),
      requestsByScope: Object.fromEntries(
        ["universal", "class", "profession"].map((scope) => [
          scope,
          c.completions.filter((x) => x.scope === scope).length,
        ]),
      ),
      classHistory: c.unlockedClasses.map((id) => ({
        id,
        level: d.classLevel(c, id),
        potential: d.classTrainingLevel(c, id),
        xp: d.classXP(c, id),
      })),
      professionHistory: [
        ...new Set([
          p.profession,
          c.profession,
          ...c.completions.map((x) => x.profession).filter(Boolean),
        ]),
      ].map((name) => ({
        name,
        level: d.professionLevel(c, name),
        xp: d.professionXP(c, name),
      })),
      vocationHistory: [
        ...new Set(
          c.completions
            .flatMap((x) => [x.vocationId, x.vocationCredit?.id])
            .filter(Boolean),
        ),
      ].map((id) => ({
        id,
        level: d.vocationLevel(c, id),
        xp: d.vocationXP(c, id),
      })),
      goalRequirements: d.classRequirements(
        target,
        d.stats(c),
        d.totalXP(c),
        c,
      ),
      activeDays,
      minutes,
      partialWorkouts: partial,
      expiredCommitments: expired,
      crossCategoryProfessionXP: c.completions
        .filter(
          (x) =>
            x.scope === "profession" &&
            x.careerCategory &&
            x.careerCategory !== k.careerCategory(x.profession).id,
        )
        .reduce((n, x) => n + x.xp, 0),
      socialRequests: c.completions.filter((x) => x.participants === "group")
        .length,
      directVocationRequests: c.completions.filter((x) =>
        x.id.startsWith("vocation-"),
      ).length,
      finalGoal: goalAtDay(),
      failedAttempts,
      duplicateGuards,
      level4Days,
      profession4Days,
      careerChangeDone,
      certificateDone,
      blocks,
      examDays,
      events,
      earnedSkills: c.earnedSkills,
      skillPurchases: c.skillPurchases,
      utilities: career.CAREER_UTILITIES.filter((u) =>
        career.hasCareerUtility(c, u.id),
      ),
      firstGoldDay: history.find((x) => x.guildRank === "A")?.day || null,
      firstPrestigeDay:
        events.find(
          (x) =>
            x.type === "class-change" &&
            ["Prestige", "Ascendant"].includes(
              d.CLASSES.find((p) => p.id === x.to)?.tier,
            ),
        )?.day || null,
      finalCharacterBytes: Buffer.byteLength(JSON.stringify(c)),
    };
    runs.push(result);
    await writeFile(
      `${folder}/runs/${item.id}.csv`,
      dailyRows.slice(rowStart).join("\n") + "\n",
    );
    await writeFile(
      `${folder}/runs/${item.id}.json`,
      JSON.stringify(result, null, 2) + "\n",
    );
    if (
      [
        "maya",
        "priya",
        "quinn",
        "theo",
        "theo-with-exams",
        "elena",
        "noah",
      ].includes(item.id)
    )
      await writeFile(
        `${folder}/accounts/${item.id}.json`,
        JSON.stringify(c, null, 2) + "\n",
      );
    console.log(
      JSON.stringify({
        n: runs.length,
        wallSeconds: Math.round((performance.now() - wallStarted) / 1000),
        id: item.id,
        activeDays,
        player: final.playerLevel,
        rank: final.guildRank,
        class: final.classId,
        classLevel: final.classLevel,
        profession: final.professionLevel,
        vocation: final.vocationLevel,
        gold: final.gold,
        wins: combat.wins,
        losses: combat.losses,
        goal: result.firstPrestigeDay,
        bytes: result.finalCharacterBytes,
        expired: result.expiredCommitments,
      }),
    );
  }
  const coverage = {
    profiles: PROFILES.length,
    professionCategories: [
      ...new Set(PROFILES.map((p) => k.careerCategory(p.profession).id)),
    ],
    vocations: [...new Set(PROFILES.map((p) => p.vocation))],
    professions: [...new Set(PROFILES.map((p) => p.profession))],
    startingClasses: [
      ...new Set(
        runs
          .filter((x) => x.variant === "primary")
          .map((p) => p.initial.classId),
      ),
    ],
    classesUsed: [
      ...new Set(
        runs.flatMap((r) =>
          r.events
            .filter((e) => e.type === "class-change")
            .map((e) => e.to)
            .concat(r.initial.classId),
        ),
      ),
    ],
  };
  if (
    !smoke &&
    !pick &&
    (coverage.professionCategories.length !== 20 ||
      coverage.vocations.length !== k.VOCATIONS.length)
  )
    throw Error("Incomplete career/vocation coverage");
  if (batchIndex === 0)
    await writeFile(
      `${folder}/catalog.json`,
      JSON.stringify(
        {
          classes: d.CLASSES,
          careers: k.CAREER_CATEGORIES,
          vocations: k.VOCATIONS,
          skills: Object.fromEntries(
            d.SKILLS.map((s) => [
              s.id,
              {
                name: s.name,
                category: s.category,
                combat: s.combat,
                archetype: s.archetype,
                cost: s.cost,
                requiredLevel: d.skillTier(s),
              },
            ]),
          ),
        },
        null,
        2,
      ) + "\n",
    );
  await writeFile(
    `${folder}/${batchArg ? `daily-batch-${batchIndex}` : "daily-progress"}.csv`,
    "scenario,day,opened,player_level,guild_rank,player_xp,class,class_level,class_potential,profession,profession_level,profession_potential,vocation,vocation_level,STR,DEX,CON,INT,WIS,CHA,requests,gold,skills,career_utilities,exam_passes,stages,wins,losses,real_world_minutes\n" +
      dailyRows.join("\n") +
      "\n",
  );
  const report = {
    appVersion: JSON.parse(await readFile("package.json")).version,
    note: "Fictional scenario assumptions, not real customers, predicted fitness/career gains, retention evidence or UI usability sessions. All rewards, gates, stats, skills and battles run through app APIs. Calendar acceptance and work/exam outcomes are explicit policy inputs.",
    coverage,
    sourceHashes,
    scenarioCount: runs.length,
    accountDays: runs.reduce((n, x) => n + x.days, 0),
    profiles: PROFILES,
    controls: CONTROLS,
    runs,
  };
  await writeFile(
    `${folder}/${batchArg ? `results-batch-${batchIndex}` : "results"}.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      completed: runs.length,
      accountDays: report.accountDays,
      coverage,
    }),
  );
} finally {
  await server.close();
  globalThis.Date = NativeDate;
}
