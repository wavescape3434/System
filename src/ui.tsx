import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Sword,
  Compass,
  BookOpen,
  Music2,
  Cross,
  Shield,
  Sparkles,
  X,
  Heart,
  Brain,
  Footprints,
  MessageCircle,
  Dumbbell,
  Check,
} from "lucide-react";
import type { Attribute, Stats } from "./domain";
import { ATTRIBUTES } from "./domain";
export const STAT_NAMES: Record<Attribute, string> = {
  STR: "Strength",
  DEX: "Dexterity",
  CON: "Constitution",
  INT: "Intelligence",
  WIS: "Wisdom",
  CHA: "Charisma",
};
export function Icon({
  name,
  size = 20,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Component =
    (
      {
        sword: Sword,
        compass: Compass,
        book: BookOpen,
        music: Music2,
        cross: Cross,
        shield: Shield,
        sparkles: Sparkles,
        STR: Dumbbell,
        DEX: Footprints,
        CON: Heart,
        INT: Brain,
        WIS: BookOpen,
        CHA: MessageCircle,
      } as Record<string, typeof Sword>
    )[name] || Sparkles;
  return <Component size={size} strokeWidth={1.6} {...props} />;
}
export function Progress({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label || "Progress"}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(max, value)}
    >
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}
export function Crest({ small = false }: { small?: boolean }) {
  return (
    <div className={`crest ${small ? "small" : ""}`}>
      <img src="/crest.svg" alt="The Guild crest" />
    </div>
  );
}
export function StatRadar({ values }: { values: Stats }) {
  const scale = Math.max(30, ...Object.values(values));
  const at = (i: number, r: number) => [
    140 + Math.sin((i * Math.PI) / 3) * r,
    125 - Math.cos((i * Math.PI) / 3) * r,
  ];
  const points = (r: number) =>
    ATTRIBUTES.map((_, i) => at(i, r).join(",")).join(" ");
  return (
    <svg
      className="radar"
      viewBox="0 0 280 255"
      role="img"
      aria-label={ATTRIBUTES.map((a) => `${STAT_NAMES[a]} ${values[a]}`).join(
        ", ",
      )}
    >
      {[25, 50, 75, 100].map((r) => (
        <polygon
          key={r}
          points={points(r)}
          fill={r === 100 ? "#f1f2e9" : "none"}
          stroke="#d9dfd4"
        />
      ))}
      {ATTRIBUTES.map((a, i) => (
        <line
          key={a}
          x1="140"
          y1="125"
          x2={at(i, 100)[0]}
          y2={at(i, 100)[1]}
          stroke="#d9dfd4"
        />
      ))}
      <polygon
        points={ATTRIBUTES.map((a, i) =>
          at(i, Math.min(100, (values[a] / scale) * 100)).join(","),
        ).join(" ")}
        fill="#3d786249"
        stroke="#447d65"
        strokeWidth="2"
      />
      {ATTRIBUTES.map((a, i) => (
        <g key={a}>
          <circle
            cx={at(i, Math.min(100, (values[a] / scale) * 100))[0]}
            cy={at(i, Math.min(100, (values[a] / scale) * 100))[1]}
            r="3"
            fill="#2d624e"
          />
          <text
            x={at(i, 120)[0]}
            y={at(i, 115)[1] + 4}
            textAnchor="middle"
            fill="#64716a"
            fontSize="11"
            fontFamily="sans-serif"
          >
            {a}
          </text>
        </g>
      ))}
    </svg>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  wide?: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,textarea,a[href]",
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", listener);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">THE ADVENTURERS’ GUILD</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Tag({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
export function Empty({
  icon = "book",
  title,
  children,
}: {
  icon?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={30} />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}
export function CheckList({
  items,
  checked,
  setChecked,
}: {
  items: string[];
  checked: number[];
  setChecked: (x: number[]) => void;
}) {
  return (
    <div className="checklist">
      {items.map((item, i) => (
        <button
          key={item}
          className={checked.includes(i) ? "checked" : ""}
          onClick={() =>
            setChecked(
              checked.includes(i)
                ? checked.filter((x) => x !== i)
                : [...checked, i],
            )
          }
        >
          <span>{checked.includes(i) && <Check size={14} />}</span>
          {item}
        </button>
      ))}
    </div>
  );
}
