import { useId, useState } from "react";
import { Search } from "lucide-react";
import { PROFESSION_GROUPS, PROFESSIONS } from "./professions";
export default function ProfessionPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const id = useId();
  const groups = PROFESSION_GROUPS.map((g) => ({
    ...g,
    roles: g.roles.filter((role) =>
      `${role} ${g.name}`.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  })).filter((g) => g.roles.length);
  return (
    <div className="profession-picker">
      <label className="field" htmlFor={`${id}-search`}>
        Find a profession
        <div className="profession-search">
          <Search size={16} />
          <input
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search analyst, network, healthcare…"
          />
        </div>
      </label>
      <label className="field" htmlFor={`${id}-select`}>
        Your profession
        <select
          aria-label="Your profession"
          id={`${id}-select`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value={value}>{value} (selected)</option>
          {groups.map((g) => (
            <optgroup
              key={g.code}
              label={`${g.code === "personal" ? "" : `${g.code} · `}${g.name}`}
            >
              {g.roles
                .filter((r) => r !== value)
                .map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <small className="profession-count" role="status">
        {query
          ? groups.reduce((n, g) => n + g.roles.length, 0)
          : PROFESSIONS.length}{" "}
        roles · SOC occupation groups with common job titles
      </small>
    </div>
  );
}
