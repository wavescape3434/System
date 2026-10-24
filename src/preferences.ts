export interface Preferences {
  units: "metric" | "imperial";
  textSize: "standard" | "large";
  reduceMotion: boolean;
  equipment: ("bodyweight" | "pullup-bar" | "weights")[];
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
