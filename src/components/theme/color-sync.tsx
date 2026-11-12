"use client";

import { useLayoutEffect } from "react";

import { applyStoredColor } from "./color-store";

/**
 * Keeps <html data-color> in sync with the stored preference. The inline
 * script in the root layout already applies it before first paint; this
 * re-applies it when React resets the attribute (Strict Mode remounts in
 * development) and when another tab changes the color.
 */
export function ColorSync() {
  useLayoutEffect(() => {
    applyStoredColor();
    window.addEventListener("storage", applyStoredColor);
    return () => window.removeEventListener("storage", applyStoredColor);
  }, []);
  return null;
}
