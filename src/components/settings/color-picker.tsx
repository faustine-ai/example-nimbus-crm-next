"use client";

import { setColor, useColorId } from "@/components/theme/color-store";
import { COLOR_PRESETS } from "@/lib/theme";

/** Swatches to choose the primary color used across the app. */
export function ColorPicker() {
  const colorId = useColorId();

  return (
    <div className="flex flex-wrap gap-3">
      {COLOR_PRESETS.map((preset) => {
        const selected = preset.id === colorId;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => setColor(preset.id)}
            aria-pressed={selected}
            title={preset.name}
            className={`flex h-10 w-10 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${
              selected ? "ring-2 ring-ring" : "ring-1 ring-border hover:scale-105"
            }`}
            style={{ backgroundColor: `hsl(${preset.primary})` }}
          >
            {selected && (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            <span className="sr-only">{preset.name}</span>
          </button>
        );
      })}
    </div>
  );
}
