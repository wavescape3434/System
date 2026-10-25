export default function GuildMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 26"
      fill="none"
      aria-hidden="true"
      data-guild-mark="true"
    >
      <path
        d="M3 4.5 12 1l9 3.5v9c0 5-9 11-9 11s-9-6-9-11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="m5 5 13 15-1.2-4.5L7.8 5.4z" fill="currentColor" />
      <path
        d="m4 9 5-4M5.2 5.7 3.7 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5 21 17.5 7M16 4l2-2 3 3-2.5 2.5-2.5-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
