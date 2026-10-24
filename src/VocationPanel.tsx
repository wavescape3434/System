import { useState } from "react";
import type { Character } from "./domain";
import { activeVocation } from "./domain";
import { CAREER_CATEGORIES, VOCATIONS, careerCategory } from "./careers";
import ProfessionPicker from "./ProfessionPicker";
import { Icon, Tag } from "./ui";
export default function VocationPanel({
  c,
  update,
}: {
  c: Character;
  update: (c: Character) => boolean;
}) {
  const current = activeVocation(c),
    [category, setCategory] = useState(
      current?.category || careerCategory(c.profession).id,
    );
  const group = CAREER_CATEGORIES.find((g) => g.id === category)!;
  return (
    <section className="vocation-panel panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">VOCATION REGISTER</span>
          <h2>
            {c.profession}
            {current ? ` → ${current.name}` : ""}
          </h2>
        </div>
        <Icon name="book" size={30} />
      </div>
      <p>
        Your profession is your role. Your vocation is the career focus you are
        training toward. Both are independent of your combat class.
      </p>
      <ProfessionPicker
        value={c.profession}
        onChange={(profession) => update({ ...c, profession })}
      />
      <label className="field">
        Career discipline
        <select
          aria-label="Career discipline"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CAREER_CATEGORIES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      <div className="vocation-options">
        {VOCATIONS.filter((v) => v.category === category).map((v) => (
          <button
            className={c.vocation === v.id ? "selected" : ""}
            key={v.id}
            onClick={() => update({ ...c, vocation: v.id })}
          >
            <b>{v.name}</b>
            <p>{v.practice}</p>
            <Tag>
              {c.vocation === v.id ? "Current vocation" : "Choose vocation"}
            </Tag>
          </button>
        ))}
      </div>
      <p className="helper">
        {group.name} has one shared career tree with ten competencies. Vocation
        adds focused daily, weekly, and monthly requests. These skills are
        non-combat; future exploration uses are not implemented yet.
      </p>
      {current && (
        <button
          className="text-button"
          onClick={() => update({ ...c, vocation: null })}
        >
          Clear vocation focus
        </button>
      )}
      {c.subclass && (
        <details className="legacy-specialization">
          <summary>Earlier specialization retained in your record</summary>
          <p>
            {c.subclass.replaceAll("-", " ")}. Previous objectives, earned
            skills, and purchases are preserved. Combat specialization now
            advances through class paths.
          </p>
        </details>
      )}
    </section>
  );
}
