"""Render the saved simulation results as a report and standalone charts."""
from pathlib import Path
import json, os
os.environ.setdefault('MPLCONFIGDIR', '/tmp/guild-matplotlib')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
root = Path(__file__).resolve().parents[1]
data = json.loads((root/'docs/balance/simulation-results.json').read_text())
accounts = data['accounts']
colors = {'light':'#8c914a','moderate':'#275847','intensive':'#ae7832','intermittent':'#7c7191'}
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False})
fig, (ax, bx) = plt.subplots(2,1,figsize=(10,9),gridspec_kw={'height_ratios':[1.4,1]})
fig.patch.set_facecolor('#fbf8f0')
for r in accounts:
    h = r['history']
    ax.plot([0]+[d['day'] for d in h],[0]+[d['xp'] for d in h],label=r['profile'].capitalize(),color=colors[r['profile']],linewidth=2.4)
for rank in data['ranks'][1:4]:
    ax.axhline(rank['xp'],color='#aaa38b',linestyle='--',linewidth=.8)
    ax.text(.5,rank['xp']+400,f"{rank['name']} · {rank['metal'].title()} · {rank['xp']:,} XP",color='#686455',fontsize=8)
ax.set(title='30-day account simulations',xlabel='Day after registration',ylabel='Earned player / guild XP',xlim=(0,30))
ax.yaxis.set_major_formatter(FuncFormatter(lambda n,_: f'{n:,.0f}'))
ax.legend(loc='upper left',frameon=False,ncol=2)
ax.text(1,1.025,'A · Gold requires 161,094 XP',transform=ax.transAxes,ha='right',fontsize=10)
ax.grid(axis='y',alpha=.12)
labels=[r['profile'].capitalize() for r in accounts]
bottom=[0]*len(accounts)
for cadence,color in [('daily','#779381'),('weekly','#a5b88b'),('monthly','#cbac66')]:
    values=[r['byCadence'][cadence]['gold'] for r in accounts]
    bx.bar(labels,values,bottom=bottom,label=cadence.capitalize(),color=color,width=.62)
    bottom=[a+b for a,b in zip(bottom,values)]
for i,total in enumerate(bottom):bx.text(i,total+150,f'{total:,}',ha='center')
bx.set(title='Gold earned before spending',ylabel='Gold',ylim=(0,max(bottom)*1.22))
bx.legend(frameon=False,ncol=3,loc='upper left')
bx.yaxis.set_major_formatter(FuncFormatter(lambda n,_:f'{n:,.0f}'))
bx.grid(axis='y',alpha=.12)
fig.tight_layout(pad=2)
fig.savefig(root/'docs/balance/progression-30-days.png',dpi=170,facecolor=fig.get_facecolor())
plt.close(fig)
fig,ax=plt.subplots(figsize=(10,4.8))
rows=data['ranks'][1:]
ax.plot([r['name'] for r in rows],[r['xp'] for r in rows],marker='o',linewidth=2.3,color='#275847')
ax.set_yscale('log')
for r in rows:ax.annotate(f"{r['xp']:,}",(r['name'],r['xp']),xytext=(0,10),textcoords='offset points',ha='center',fontsize=8)
ax.set(title='Guild promotion thresholds',xlabel='Guild rank',ylabel='Cumulative guild XP · logarithmic scale')
ax.yaxis.set_major_formatter(FuncFormatter(lambda n,_:f'{n:,.0f}'))
ax.grid(axis='y',alpha=.2)
ax.set_ylim(1500,rows[-1]['xp']*2)
fig.tight_layout(pad=2)
fig.savefig(root/'docs/balance/rank-thresholds.png',dpi=170)
plt.close(fig)
fmt=lambda n:f'{n:,}'
summary='\n'.join(f"| {r['profile'].capitalize()} | {fmt(r['day7']['xp'])} | {r['day7']['rank']} | {fmt(r['day7']['gold'])} | {fmt(r['day30']['xp'])} | {r['day30']['rank']} | {fmt(r['day30']['gold'])} | {r['day30']['playerLevel']} |" for r in accounts)
rewards='\n'.join('| '+rank+' | '+' | '.join(f"{fmt(data['rewards'][c][rank]['xp'])} / {fmt(data['rewards'][c][rank]['gold'])}" if rank in data['rewards'][c] else '—' for c in ['daily','weekly','monthly'])+' |' for rank in ['F','E','D','C','B','A','S','SS','SSS'])
thresholds='\n'.join(f"| {r['name']} | {r['metal'].title()} | {fmt(r['xp'])} | {fmt(r['xp']-(data['ranks'][i-1]['xp'] if i else 0))} |" for i,r in enumerate(data['ranks']))
breakdown='\n'.join(f"| {r['profile'].capitalize()} | {fmt(r['byCadence']['daily']['xp'])} | {fmt(r['byCadence']['weekly']['xp'])} | {fmt(r['byCadence']['monthly']['xp'])} | {r['byCadence']['daily']['completed']} / {r['byCadence']['weekly']['completed']} / {r['byCadence']['monthly']['completed']} |" for r in accounts)
moderate=next(r for r in accounts if r['profile']=='moderate')
early=data['earlyClaims']
report=f'''# Request and guild-rank balance report — 1.6.0

The moderate test account reached **E after 7 days and D after 30 days**, earning **{fmt(moderate['last']['xp'])} XP** and **{fmt(moderate['last']['gold'])} gold**. Repeating that earning rate projects A (Gold) at **{moderate['projectedDaysToGold']} days, about {moderate['projectedDaysToGold']/30.4375:.1f} months**, matching the requested 9–12 month target. The intensive account reached C at 30 days. None of these four accounts reached A in its first month.

These are simulated local accounts using the app's real request, reward, progression, and save-validation functions. The fictional test window runs **25 January–23 February 2027**, deliberately crossing a month boundary. No live Google accounts or real-world fitness improvements were created. All accounts begin at F with six stats of 10, the Warrior class, Analyst profession, and Networking vocation. Varying the routines against this shared starting point isolates request and reward behavior.

## 7-day and 30-day results

| Routine | Day 7 XP | Rank | Day 7 gold | Day 30 XP | Rank | Day 30 gold | Player level |
| --- | ---: | :---: | ---: | ---: | :---: | ---: | ---: |
{summary}

![Cumulative XP and gold earned by the four simulated routines](balance/progression-30-days.png)

### Account schedules

- **Light:** five short daily habits: a five-minute walk, mobility, reading, a Bible passage, and a thoughtful-message draft. Five F weekly habit goals and five F monthly habit goals use those dated practices. Approximately 25–35 minutes a day, with occasional reviews.
- **Moderate:** a brisk walk and Scripture comprehension each day; active recall and networking practice six days a week; Warrior practice three days a week. Two C weekly quests and one B Warrior training adventure. Roughly 60–110 minutes on training days; lower workload on the rest day.
- **Intensive:** focused application, chapter study, presentation rehearsal, job/portfolio work, and networking practice six days a week; strength three days a week; additional pushup/running sessions twice a week; and a weekly group hike replacing that day's ordinary walk. Two C preparation quests, one B teaching project, the C hike, and two B monthly projects. This assumes several hours of distinct work on busy days, existing capacity for the exercise, and suitable recovery.
- **Intermittent:** walking, active recall, and Scripture comprehension on three days a week, with one F weekly walking goal and one F monthly walking adventure. Approximately 60–75 minutes on active days.

A daily session can supply dated evidence for a longer goal. The weekly/monthly reward is its completion bonus; each accepted period or adventure run pays once. Work requirements, recovery intervals, practice dates, and checklists are evaluated by the program. Failed or unavailable claims are not added to balances.

| Routine | Daily XP | Weekly XP | Monthly XP | Completions: daily / weekly / monthly |
| --- | ---: | ---: | ---: | --- |
{breakdown}

Class and profession milestones remain pending in these fixtures, so trained paths stop at level 4 until their improvement exam is passed. Player levels and guild XP continue independently. No assumed improvement was inserted into an assessment to force those gates open.

## Reward changes

Daily tasks stop at **C**, weekly quests at **A**, and monthly adventures at **SSS**. Difficulty and commitment length both set rewards. Daily rewards use the base rank price; weekly quests pay **4×**, and monthly adventures pay **18×**. Gold follows the same multipliers.

| Request rank | Daily XP / gold | Weekly XP / gold | Monthly XP / gold |
| --- | ---: | ---: | ---: |
{rewards}

Examples:

- A C daily pushup session pays **150 XP / 30 gold**.
- A C multi-session weekly quest pays **600 XP / 120 gold**.
- A B training adventure pays **6,300 XP / 1,260 gold** after at least 28 days and 12 relevant practice dates.
- A low-difficulty F walking adventure pays **180 XP / 36 gold** for eight separate practice dates across at least 28 days.
- The S pullup target has moved into a preparation adventure: **32,400 XP / 6,480 gold**, at least 56 days and 24 practice dates, plus its existing capacity, equipment, recovery, and outcome requirements. It cannot pay as a day-one daily task.

Demanding B/A single-session targets now belong to prepared weekly quests. Multiweek assessed outcomes belong to adventures. Basic habits have F/E weekly and F/E/D monthly options. Variants of the same weekly habit cannot pay repeatedly in one week, and concurrent monthly variants from the same training family cannot be accepted.

## Monthly persistence and completion gates

Monthly adventures now have individual saved runs. Their start date, relevant practice, checklist, and original class/profession/vocation credit survive a month boundary. Completion pays once for that run. **Take again** explicitly starts new preparation; checklists and accumulated dates do not carry into the next run. Releasing an unfinished adventure also restarts preparation if it is accepted later. SS/SSS one-time commitments stay one-time.

| Monthly rank | Minimum elapsed days | Minimum dated practice days |
| --- | ---: | ---: |
| F | 28 | 8 |
| E | 28 | 10 |
| D | 28 | 12 |
| C | 28 | 12 |
| B | 28 | 12 |
| A | 42 | 18 |
| S | 56 | 24 |
| SS | 84 | 36 |
| SSS | 168 | 72 |

The start date is elapsed day zero: a 28-day commitment first qualifies on the 29th calendar date. Actual completion still requires the named outcome and checklist. Class adventures count that class's practice; career adventures count the relevant career discipline; specific habit adventures count their named training family. Several completions on one day supply one practice date. SS/SSS also require the listed independent assessment; time by itself never qualifies.

In the early-claim stress check, **{early['monthlyAvailable']} monthly options** were inspected. **{early['accepted']} compatible adventures** could be accepted; all **{early['blocked']}** accepted day-one claims were blocked even after checking every box and supplying forged reward fields. Total earned: **0 XP / 0 gold**, remaining F.

## Guild promotion curve

Each promotion price grows approximately **2.5×**, beginning at 2,500 XP. The exact cumulative threshold for rank index `i` is `round(2500 × (2.5^i − 1) / 1.5)`.

| Rank | Metal | Cumulative guild XP | XP since previous rank |
| --- | --- | ---: | ---: |
{thresholds}

![Exponential cumulative guild XP thresholds](balance/rank-thresholds.png)

Player level, class level, and guild rank remain separate. Existing characters retain their earned guild rank and fraction of progress toward the next promotion through a one-time guild credit. That credit adds no player/class/profession XP, gold, or stat points. Existing accepted monthly checklists and start dates are retained during migration.

## Interpretation and limits

The moderate routine's roughly nine-month Gold projection uses the observed 30-day earning rate. It is an estimate; breaks, future request choices, class changes, longer project durations, or multiple difficult projects will change it. The intensive schedule can progress faster because it assumes substantially more distinct work. Rare SSS outcomes can award large rewards after sustained preparation; the curve does not impose a universal calendar lock on rank.

Gold totals are earnings before spending. Existing shop prices are unchanged; the combat economy needs its own playtesting. These simulations evaluate request rewards, persistence, and rank pace. They do not establish actual adherence, exercise outcomes, or the truth of self-reported achievement evidence.

## Reproduce and inspect

Run `npm run simulate:balance`, then `MPLCONFIGDIR=/tmp/guild-matplotlib python3 scripts/write-balance-report.py` to regenerate the report and charts. The chart step uses Matplotlib.

- [Full results and action logs](balance/simulation-results.json)
- [Daily CSV](balance/daily-progress.csv)
- Synthetic account snapshots: [Light](balance/account-light.json), [Moderate](balance/account-moderate.json), [Intensive](balance/account-intensive.json), [Intermittent](balance/account-intermittent.json)
- [Build and workflow verification](verification-1.6.md)
'''
(root/'docs/balance-report-1.6.md').write_text(report)
print('Wrote balance report and two charts.')
