import os, json, csv, statistics
from pathlib import Path
os.environ.setdefault('MPLCONFIGDIR', '/tmp/guild-builds-mpl')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
out=Path('docs/builds-1.24')
b=json.loads((out/'baseline.json').read_text()); c=json.loads((out/'current.json').read_text())
key=lambda r:json.dumps(r['options'],sort_keys=True)
old={key(r):r for r in b['results']}
matched=[(old[key(r)],r) for r in c['results'] if key(r) in old]
assert len(matched)==2640 and b['sourceHashes']['src/build-simulation.ts']==c['sourceHashes']['src/build-simulation.ts']
with (out/'probes.csv').open('w', newline='') as f:
 w=csv.writer(f, lineterminator="\n");w.writerow(['phase','group','class','focus','encounter','loadout','party','result','actions','rounds','hero_hp','hero_mp'])
 for data in [b,c]:
  for r in data['results']:
   o=r['options'];hero=r['remaining'][0];w.writerow([data['phase'],r['group'],o['classId'],o['focus'],o['encounter'],o['loadout'],o['party'],r['phase'],r['actions'],r['rounds'],hero['hp'],hero['mp']])
plt.rcParams.update({'font.family':'DejaVu Sans','axes.spines.top':False,'axes.spines.right':False,'figure.facecolor':'#f7f4ec','axes.facecolor':'#f7f4ec'})
fig,axs=plt.subplots(1,2,figsize=(11,4),layout='constrained')
for ax,group,ids,title in [(axs[0],'martial',['sword','spear','axe','unarmed'],'Martial styles — same 48 fixtures each'),(axs[1],'elements',['fire','ice','storm'],'Elemental styles — same 48 fixtures each')]:
 vals=[sum(r['phase']=='won' for r in c['results'] if r['group']==group and r['options']['loadout']==id) for id in ids]
 ax.bar([s.title() for s in ids],vals,color=['#8b6745','#567f93','#8b6079','#6a8257'][:len(ids)])
 for i,v in enumerate(vals):ax.text(i,v+1,f'{v}/48',ha='center')
 ax.set_ylim(0,53);ax.set_ylabel('Wins');ax.set_title(title)
fig.suptitle('Focused builds: style choices have different outcomes',weight='bold')
fig.savefig(out/'style-results.png',dpi=160);fig.savefig(out/'style-results.svg');plt.close(fig)
improved=[(a,z) for a,z in matched if a['phase']!='won' and z['phase']=='won'];reversed=[(a,z) for a,z in matched if a['phase']=='won' and z['phase']!='won']
win=lambda data,g:sum(r['phase']=='won' for r in data['results'] if r['group']==g)
lines=['# Class and build identity report — 1.24.0','', 'Verified **27 October 2026**, America/Denver. These are synthetic combat snapshots, not observed users or earned-account simulations.','',
'The release gives four martial disciplines different rules, adds three early elemental paths with three ranks each, improves focused DEX/WIS scaling, and adds six prestige-effect families across twelve Prestige/Ascendant classes. Existing skill IDs, ownership, prices, prerequisite gates and recorded spending are retained. New elemental paths cost 1/3/6 points and open at levels 1/3/7; upgrades occupy one slot.','',
'## Delivered choices','', '| Route | Combat rule |','| --- | --- |','| Sword | Guard an enemy round, then gain 25% technique damage on the next turn; prepared counters are stronger. |','| Spear | Ignore half of remaining defense and deal 25% extra damage against charged attacks; counters also penetrate. An already armor-piercing thrust still bypasses armor rather than gaining damage from armor. |','| Axe | Damaging hits remove 20% of remaining defense, at least one, for the current battle. |','| Unarmed | Use higher physical/DEX technique power and pay one less MP, minimum one. |','| Pyromancy | Strong single-target fire; check the target’s affinity. |','| Frostcraft | Ice damage and 25% less enemy attack damage for two enemy rounds, including bosses. |','| Stormcalling | Main-target storm hit and half-strength arcs to other living enemies. |','',
'Weakness multiplies raw elemental damage by 1.3 and resistance by 0.8 before defense. New elemental burns also use the matchup. Neutral Aether Bolt/Spark/Glimmer remain neutral. Bandits have no authored affinity. Matchups are copied to new enemy snapshots; old fights keep their existing commands and affinities. Martial disciplines are learned techniques, without matching-equipment requirements.','',
'Paladin/Dawn Sovereign add party protection to a strike; High Cleric/Lightbearer protect while restoring. Eldritch Knight/Aether Blademaster leave an aether burn. Shadowblade/Phantom execute wounded targets, Archmage/Astral Savant recover part of area-spell MP, and Grand Artificer/World Forger spread burns. Their learned focus versions retain those effects when equipped after changing class. Other signatures retain their authored action and tier potency; this is not fifty-one bespoke new combat engines.','',
'## Method','',
'The same harness runs on release `2b216588b03359cdb44cc7ea903d342e8428860c` (1.23) and current source. Each snapshot uses a level-10 player, starter sword/clothes, no consumables, all route access explicitly granted and either a solo hero or Mira/Orin. The primary class stat is 30 or 100; other stats are 10, except CON is 30 when it is not primary. No class XP, exams, certification acquisition, promotions or skill purchases are simulated: catalog ownership is injected to isolate combat. The harness explicitly selects the intended class and asserts its signature, since normal registration correctly rejects unearned prestige classes.','',
'2,448 class fixtures cover all **51** classes × two focused-stat settings × four fights (Briar guardian, Ruins guardian, Mossfall Elite hunt and Frost Elite hunt) × signature-only/shared/focus loadouts × solo/trio. Another 192 fixtures compare four martial routes across Warrior, Monk, Berserker and Knight. The updated-only 144 cases compare three elemental routes across Scholar, Elementalist, Archmage and Astral Savant. Total: **5,424 fights** (2,640 before, 2,784 after).','',
'The deterministic policy heals at low HP, guards charges, uses buffs/analysis once, restores MP with learned focus, then scores immediate damage plus a limited burn/chill estimate. It does not plan multi-turn sword preparation, count future axe gains optimally, search all targets or represent an expert player. Maximum 180 actions. The fixed clock is 1 February 2027 local noon, America/Denver. Final saves validate, gold matches the actual encounter payout, and combat preserves real-world XP and base stats.','',
'## Results','', '| Fixture group | Before wins | Updated wins | Cases per phase |','| --- | --- | --- | --- |',f'| All-class builds | {win(b,"classes")} | {win(c,"classes")} | 2,448 |',f'| Martial comparisons | {win(b,"martial")} | {win(c,"martial")} | 192 |',f'| New elemental comparisons | — | {win(c,"elements")} | 144 updated only |','',
 f'Across the 2,640 matched cases, **{len(improved)} losses become wins and {len(reversed)} wins become losses**. None remain at the action bound. Overall wins are not a claim that every class should clear every encounter, or that the new rules always improve a bot’s choices. Some reversed outcomes involve fire-resistant targets or altered MP/action choices; stronger actions can change a greedy policy’s decisions.','',
'![Style comparison](style-results.png)','',
'## Practical limits and next work','',
'- Support and career-focused heroes can still rely on companions. Companion stats and player-level growth are unchanged. Solo healing/support builds still struggle in fixed damage races; that is visible in the raw results, not hidden by averaging only winning parties.',
'- The four martial routes finish within two wins of each other in these fixtures. Elemental outcomes vary by enemy composition and tactics. These checks establish working distinctions, not optimal balance across all equipment, stat distributions or party combinations.',
'- Class signatures and equipped focus variants use the new rules in newly started fights. Existing active battles are not rewritten. Skill ownership, base stats, real-world XP/ranks, midnight recovery, supply prices and hunt payouts remain.',
'- Broader campaign AI, the rest of the prestige roster, detailed weapon/armor loadouts, career-node builds and real-user combat choices remain P01/P02 work.',
'- The separate [90-day economy study](../economy-1.24/README.md) uses actual earning and purchases. Preloaded combat snapshots cannot establish supply affordability or long-term progression speed.','',
'## Reproduce','', '```sh','git worktree add --detach /tmp/guild-build-baseline-1.23 2b216588b03359cdb44cc7ea903d342e8428860c','ln -s "$PWD/node_modules" /tmp/guild-build-baseline-1.23/node_modules','cp src/build-simulation.ts /tmp/guild-build-baseline-1.23/src/build-simulation.ts','node scripts/simulate-builds.mjs /tmp/guild-build-baseline-1.23 baseline','npm run simulate:builds','python3 scripts/report-builds.py','```','', '[Baseline data](baseline.json) · [Updated data and source hashes](current.json) · [CSV](probes.csv) · [Changes](../update-1.24.md) · [Verification](../verification-1.24.md)']
(out/'README.md').write_text('\n'.join(lines)+'\n')
print({'matched':len(matched),'improved':len(improved),'reversed':len(reversed),'total':b['count']+c['count']})

for svg in out.glob('*.svg'):
 svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
