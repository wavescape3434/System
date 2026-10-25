import { useId } from "react";
import type { CharacterAppearance } from "./appearance-catalog";
import { SPRITE_ATLAS, spriteViewport } from "./appearance-catalog";
import atlas from "./character-frames.json";
export default function CharacterSprite({
  appearance,
  label,
  className = "",
  portrait = false,
}: {
  appearance: CharacterAppearance;
  label?: string;
  className?: string;
  portrait?: boolean;
}) {
  const clip = useId().replaceAll(":", ""),
    frame = atlas.frames[appearance.cell],
    viewport = spriteViewport(appearance, frame, portrait);
  return (
    <svg
      viewBox={`${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`}
      className={`character-sprite ${portrait ? "character-portrait" : ""} ${className}`}
      role="img"
      aria-label={label || appearance.name}
      data-appearance={appearance.id}
      data-portrait={portrait ? "true" : undefined}
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
