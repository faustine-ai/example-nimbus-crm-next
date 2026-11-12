// Primary color presets. The CSS for each preset lives in app/globals.css
// under [data-color="<id>"]; `primary` here is only used to paint the swatches.

export const COLOR_STORAGE_KEY = "nimbus.primaryColor";
export const DEFAULT_COLOR_ID = "sky";

export const COLOR_PRESETS = [
  { id: "sky", name: "Sky", primary: "199 89% 56%" },
  { id: "blue", name: "Blue", primary: "217 91% 60%" },
  { id: "indigo", name: "Indigo", primary: "243 75% 59%" },
  { id: "violet", name: "Violet", primary: "262 83% 58%" },
  { id: "teal", name: "Teal", primary: "173 80% 36%" },
  { id: "emerald", name: "Emerald", primary: "160 84% 39%" },
  { id: "amber", name: "Amber", primary: "38 92% 50%" },
  { id: "orange", name: "Orange", primary: "25 95% 53%" },
  { id: "rose", name: "Rose", primary: "346 77% 50%" },
] as const;

export type ColorId = (typeof COLOR_PRESETS)[number]["id"];

export function isColorId(value: unknown): value is ColorId {
  return COLOR_PRESETS.some((p) => p.id === value);
}

/**
 * Runs in <head> before the first paint: applies the stored primary color so
 * the page never flashes the default one.
 */
export const COLOR_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  COLOR_STORAGE_KEY,
)});if(c&&${JSON.stringify(COLOR_PRESETS.map((p) => p.id))}.indexOf(c)>-1)document.documentElement.setAttribute("data-color",c)}catch(e){}})()`;
