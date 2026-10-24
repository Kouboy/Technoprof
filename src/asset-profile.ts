declare const __TECHNOPROF_DAY__: boolean;
declare const __TECHNOPROF_PUBLIC__: boolean;
// Vite replaces the flag at compilation; the complete workshop is the default.
export const DAY_ONLY =
  typeof __TECHNOPROF_DAY__ !== "undefined" && __TECHNOPROF_DAY__;
export const PUBLIC_PLAYTEST =
  typeof __TECHNOPROF_PUBLIC__ !== "undefined" && __TECHNOPROF_PUBLIC__;
