// Companion commands complement their retained signature; growth remains tied to player level.
export const COMPANION_TACTICS: Record<
  string,
  { id: string; name: string; effect: string; description: string }
> = {
  mira: {
    id: "mira-glimmer",
    name: "Glimmer",
    effect: "fire",
    description: "Light magic breaks shells when healing is not needed.",
  },
  orin: {
    id: "orin-hold-line",
    name: "Hold the Line",
    effect: "bulwark",
    description:
      "Guard all living allies this round and draw attacks for two rounds.",
  },
  lyra: {
    id: "lyra-piercing-arrow",
    name: "Piercing Arrow",
    effect: "pierce",
    description: "An armor-piercing shot that breaks shells.",
  },
  gideon: {
    id: "gideon-expose-fault",
    name: "Expose Fault",
    effect: "scan",
    description: "Break an enemy shell and lower its defense for the battle.",
  },
  nessa: {
    id: "nessa-renewal",
    name: "Tidal Renewal",
    effect: "heal-all",
    description: "Restore HP to all living allies. Does not revive.",
  },
  toma: {
    id: "toma-fenfire",
    name: "Fenfire Dart",
    effect: "burn",
    description: "Break a shell and inflict burning for three enemy rounds.",
  },
  elara: {
    id: "elara-riposte",
    name: "Winter Riposte",
    effect: "counter",
    description: "Guard this round and counter attacks while still standing.",
  },
};
