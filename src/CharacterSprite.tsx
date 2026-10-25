import { useId } from "react";
import type { CharacterAppearance } from "./appearance-catalog";
import { SPRITE_ATLAS } from "./appearance-catalog";
import atlas from "./character-frames.json";
export default function CharacterSprite({
  appearance,
  label,
  className = "",
}: {
  appearance: CharacterAppearance;
  label?: string;
  className?: string;
}) {
  const clip = useId().replaceAll(":", ""),
    frame = atlas.frames[appearance.cell];
  return (
    <svg
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      className={`character-sprite ${className}`}
      role="img"
      aria-label={label || appearance.name}
      data-appearance={appearance.id}
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <clipPath id={clip}>
          <path d={frame.clip} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <image
          href={SPRITE_ATLAS.src}
          x={-frame.x}
          y={-frame.y}
          width={atlas.width}
          height={atlas.height}
          preserveAspectRatio="none"
        />
      </g>
    </svg>
  );
}
