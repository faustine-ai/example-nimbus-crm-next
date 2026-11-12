"use client";

import { useSyncExternalStore } from "react";

import { COLOR_STORAGE_KEY, DEFAULT_COLOR_ID, isColorId, type ColorId } from "@/lib/theme";

// The selected primary color lives in localStorage (it is a per-browser
// preference) and is mirrored on <html data-color="…">, which is what the CSS
// reads. This tiny store keeps React in sync with it.

const listeners = new Set<() => void>();

function read(): ColorId {
  try {
    const stored = localStorage.getItem(COLOR_STORAGE_KEY);
    return isColorId(stored) ? stored : DEFAULT_COLOR_ID;
  } catch {
    return DEFAULT_COLOR_ID;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Apply the stored color to the document. */
export function applyStoredColor() {
  document.documentElement.setAttribute("data-color", read());
}

/** Select a primary color: applied instantly and saved to this browser. */
export function setColor(id: ColorId) {
  try {
    localStorage.setItem(COLOR_STORAGE_KEY, id);
  } catch {
    /* ignore persistence errors (e.g. private mode) */
  }
  document.documentElement.setAttribute("data-color", id);
  listeners.forEach((listener) => listener());
}

/** The selected primary color id. Renders the default on the server. */
export function useColorId(): ColorId {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_COLOR_ID);
}
