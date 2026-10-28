"""Plot scripted XP ledgers; never infer physiological improvement from game XP."""
import json
import os
os.environ.setdefault("MPLCONFIGDIR", "/tmp/guild-matplotlib")
os.environ.setdefault("XDG_CACHE_HOME", "/tmp/guild-font-cache")
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parents[1]
folder = root / "docs/training-1.25"
data = json.loads((folder / "ledger-results.json").read_text())
runs = [r for r in data["runs"] if r["environment"] == "home" and r["credit"] == "class"]
fig, ax = plt.subplots(figsize=(10, 5.6), layout="constrained")
fig.set_facecolor("#faf7ed")
ax.set_facecolor("#faf7ed")
for run, color in zip(runs, ["#456c53", "#78639c", "#407e9a", "#aa5b28"]):
    ax.step([0] + [x["day"] for x in run["history"]], [0] + [x["xp"] for x in run["history"]], where="post", color=color, linewidth=2, label=f"{run['rank']} training requests")
ax.set(xlabel="Days in scripted routine", ylabel="Cumulative player XP", xlim=(0, 62), ylim=(0, 18000))
ax.set_title("Regimen rewards across 60 scripted days", loc="left", fontsize=17, pad=16)
ax.grid(axis="y", alpha=.2)
ax.spines[["top", "right"]].set_visible(False)
ax.legend(loc="upper left", frameon=False)
fig.supxlabel("Fixed request ranks; 2 strength days + 5 walking blocks weekly; manual calendar claims.\nNo Adventures, login rewards or spending. These are ledger inputs, not predicted fitness gains.", fontsize=9)
for ext in ["png", "svg"]:
    path = folder / f"scripted-xp.{ext}"
    fig.savefig(path, dpi=160)
    if ext == "svg":
        path.write_text("\n".join(line.rstrip() for line in path.read_text().splitlines()) + "\n")
