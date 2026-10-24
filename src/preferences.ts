export interface Preferences {
  units: "metric" | "imperial";
  textSize: "standard" | "large";
  reduceMotion: boolean;
  equipment: ("bodyweight" | "pullup-bar" | "weights" | "gym")[];
  showLockedRequests: boolean;
  defaultPage: "guild" | "objectives" | "journey";
}
export const DEFAULT_PREFERENCES: Preferences = {
  units: "metric",
  textSize: "standard",
  reduceMotion: false,
  equipment: ["bodyweight"],
  showLockedRequests: true,
  defaultPage: "guild",
};

export const hasEquipment = (
  equipment: Preferences["equipment"] | undefined,
  needed: string,
) =>
  needed === "bodyweight" ||
  !!equipment?.includes(needed as Preferences["equipment"][number]) ||
  (!!equipment?.includes("gym") && ["weights", "pullup-bar"].includes(needed));
