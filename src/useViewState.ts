import { useEffect, useState } from "react";

// Navigation preferences stay separate from character progression and backups.
export function useViewState<T extends string | number | boolean>(
  key: string,
  initial: T,
  fresh = false,
  allowed?: readonly T[],
) {
  const [value, setValue] = useState<T>(() => {
    if (fresh) return initial;
    try {
      const saved: unknown = JSON.parse(
        sessionStorage.getItem(`guild.view.${key}`) || "null",
      );
      return typeof saved === typeof initial &&
        (!allowed || allowed.includes(saved as T))
        ? (saved as T)
        : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(`guild.view.${key}`, JSON.stringify(value));
    } catch {
      /* Optional UI state must never block progress. */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
