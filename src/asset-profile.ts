declare const __TECHNOPROF_DAY__: boolean;
// Vite replaces the flag at compilation; the complete workshop is the default.
export const DAY_ONLY =
  typeof __TECHNOPROF_DAY__ !== "undefined" && __TECHNOPROF_DAY__;
