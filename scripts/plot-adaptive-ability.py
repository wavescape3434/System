"""Plot declared software scenarios; these curves are not observed human gains."""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

folder = Path("docs/adaptive-1.27")
data = json.loads((folder / "results.json").read_text())
fig, axes = plt.subplots(1, 2, figsize=(11, 4), constrained_layout=True)
colors = ["#285c4b", "#a46129"]
for color, scenario in zip(colors, ["experienced", "rebuilding"]):
    run = next(r for r in data["runs"] if r["scenario"] == scenario)
    axes[0].step(
        [p["day"] for p in run["trace"]],
        [["F", "E", "D", "C"].index(p["rank"]) for p in run["trace"]],
        where="post", label=scenario.capitalize(), color=color,
    )
axes[0].set(yticks=range(4), yticklabels=["F", "E", "D", "C"], xlabel="Simulated day", ylabel="Offered daily tier", title="Same declared outcomes in 55 contexts")
for day in [15, 30]:
    axes[0].axvline(day + 1, color="#999999", linestyle=":", linewidth=1)
axes[0].legend(frameon=False)
for color, scenario in zip(colors, ["progress", "variable-effort"]):
    run = next(r for r in data["workouts"] if r["environment"] == "gym" and r["scenario"] == scenario)
    axes[1].plot(
        [p["day"] for p in run["trace"]],
        [next(m["load"] for m in p["movements"] if m["id"] == "push") for p in run["trace"]],
        marker="o", markersize=3, color=color,
        label="Consistent top range" if scenario == "progress" else "Variable effort",
    )
axes[1].set(xlabel="Simulated day", ylabel="Suggested press load used (kg)", title="Two weekly gym sessions, logged effort")
axes[1].legend(frameon=False)
for ax in axes:
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", alpha=.2)
fig.suptitle("Adaptive task selection — scripted software outcomes", fontsize=13)
fig.savefig(folder / "selection-and-loads.png", dpi=160)
fig.savefig(folder / "selection-and-loads.svg")
svg = folder / "selection-and-loads.svg"
svg.write_text("\n".join(line.rstrip() for line in svg.read_text().splitlines()) + "\n")
