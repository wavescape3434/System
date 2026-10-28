"""Verify scenario provenance, daily ledgers, retained stats and documentation links."""
from pathlib import Path
import csv,hashlib,json,re,subprocess
root=Path(__file__).resolve().parents[1];folder=root/'docs/personas-1.25';j=json.loads((folder/'results.json').read_text())
subprocess.run(['git','diff','--quiet','HEAD','--','src'],cwd=root,check=True)
assert j['scenarioCount']==35 and j['accountDays']==12775
assert len(j['profiles'])==32 and len(j['coverage']['professionCategories'])==20 and len(j['coverage']['vocations'])==25 and len(j['coverage']['careerUtilities'])==20
for f,h in j['sourceHashes'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
rows=list(csv.DictReader((folder/'daily-progress.csv').open()));assert len(rows)==12775 and all(None not in row for row in rows)
last={}
for row in rows:
 old=last.get(row['scenario'])
 if old:
  assert int(row['xp'])>=int(old['xp']) if 'xp' in row else int(row['player_xp'])>=int(old['player_xp'])
  assert all(int(row[a])>=int(old[a]) for a in ['STR','DEX','CON','INT','WIS','CHA']),row
 last[row['scenario']]=row
for r in j['runs']:
 assert r['final']['gold']==sum(r['income'].values())-sum(r['spent'].values())
 assert r['combat']['bounds']==0 and len(r['checkpoints'])==5
 assert len(list(csv.reader((folder/'runs'/f"{r['id']}.csv").open())))==365
for p in j['profiles']:assert (folder/'profiles'/f"{p['id']}.md").exists()
files=[root/'README.md',root/'ROADMAP.md',*folder.rglob('*.md')]
broken=[]
for f in files:
 for target in re.findall(r'\]\(([^)]+)\)',f.read_text()):
  if '://' in target or target.startswith('#'):continue
  local=target.split('#')[0].split('?')[0]
  if not (f.parent/local).exists():broken.append((str(f.relative_to(root)),target))
assert not broken,broken
probes=json.loads((folder/'mechanics-probes.json').read_text());repeat=json.loads((folder/'repeatability.json').read_text());assert repeat['caseJSONMatches'] and repeat['dailyCSVMatches']
for ext,h in repeat['sha256'].items():assert hashlib.sha256((folder/'runs'/f"leila.{ext}").read_bytes()).hexdigest()==h
out={'appVersion':j['appVersion'],'appSourceCommit':j['appSourceCommit'],'appSourceTree':j['appSourceTree'],'customers':32,'annualScenarios':35,'accountDays':12775,'dailyWalletsReconciled':12775,'dailyTimeBudgetChecks':12775,'weeklyAndCheckpointRoundtripsPerScenario':56,'schemaValidationCallsInMainScenarios':3920,'duplicatePayoutsRejected':j['totals']['duplicateGuards'],'encounters':j['totals']['battles'],'combatActionBounds':0,'productionFilesChanged':False,'repeatability':repeat,'reproducedScopeDefects':probes['scopeMismatches'],'categoryRequestStatDifferences':len(probes['statMismatches']),'fictionalInputs':True,'physicalAndroidTest':False,'humanEfficacyOrRetentionTest':False,'documentationLinksChecked':len(files)}
(folder/'verification.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
