import { useState } from "react";
import { Check, Search } from "lucide-react";
import {
  CHARACTER_APPEARANCES,
  APPEARANCE_GROUPS,
  findAppearance,
  classAppearance,
} from "./appearance-catalog";
import CharacterSprite from "./CharacterSprite";
import { Modal } from "./ui";
export default function AppearancePicker({
  value,
  classId,
  onChoose,
  onClose,
  embedded = false,
}: {
  value?: string;
  classId: string;
  onChoose: (id: string) => boolean;
  onClose: () => void;
  embedded?: boolean;
}) {
  const current = findAppearance(value) || classAppearance(classId);
  const [selected, setSelected] = useState(current.id),
    [group, setGroup] = useState("All"),
    [silhouette, setSilhouette] = useState("All"),
    [query, setQuery] = useState(""),
    [portraitView, setPortraitView] = useState(false);
  const preview = findAppearance(selected)!;
  const list = CHARACTER_APPEARANCES.filter(
    (a) =>
      (group === "All" || a.group === group) &&
      (silhouette === "All" || a.silhouette === silhouette) &&
      (!query ||
        `${a.name} ${a.detail}`.toLowerCase().includes(query.toLowerCase())),
  );
  const content = (
    <div className="appearance-layout">
      <section className="appearance-preview">
        <div className="appearance-stage">
          <CharacterSprite appearance={preview} portrait={portraitView} />
          <span className="appearance-floor" />
        </div>
        <span className="appearance-category">{preview.group}</span>
        <h3>{preview.name}</h3>
        <p>{preview.detail}</p>
        <button
          className="button primary full"
          onClick={() => {
            if (onChoose(selected)) onClose();
          }}
        >
          Use {preview.name}
          <Check size={16} />
        </button>
        <span className="appearance-cosmetic">Cosmetic</span>
      </section>
      <section className="appearance-options">
        <div
          className="appearance-preview-mode"
          role="group"
          aria-label="Appearance preview mode"
        >
          <button
            aria-pressed={!portraitView}
            onClick={() => setPortraitView(false)}
          >
            Full sprites
          </button>
          <button
            aria-pressed={portraitView}
            onClick={() => setPortraitView(true)}
          >
            Portraits
          </button>
        </div>
        <div className="appearance-filters">
          <label className="appearance-search">
            <Search size={16} />
            <input
              type="search"
              aria-label="Search appearances"
              placeholder="Search appearances"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Style
            <select
              aria-label="Appearance style"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              {["All", ...APPEARANCE_GROUPS].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label>
            Silhouette
            <select
              aria-label="Appearance silhouette"
              value={silhouette}
              onChange={(e) => setSilhouette(e.target.value)}
            >
              {["All", "Feminine", "Masculine"].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="appearance-roster" aria-label="Character roster">
          {list.map((a) => (
            <button
              className={`appearance-choice ${a.id === selected ? "selected" : ""}`}
              key={a.id}
              aria-label={`Preview ${a.name}`}
              aria-pressed={a.id === selected}
              onClick={() => setSelected(a.id)}
            >
              <CharacterSprite appearance={a} portrait={portraitView} />
              <b>{a.name}</b>
              {a.id === current.id && <small>Current</small>}
              {a.id === selected && (
                <Check className="appearance-check" size={14} />
              )}
            </button>
          ))}
        </div>
        {!list.length && <p>No matching appearances.</p>}
      </section>
    </div>
  );
  return embedded ? (
    content
  ) : (
    <Modal title="Character appearance" onClose={onClose} wide>
      {content}
    </Modal>
  );
}
