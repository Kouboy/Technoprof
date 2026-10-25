// The public campaign is one continuous attempt. Historical fixtures opt in explicitly.
export type RunPolicy = "three-required" | "legacy-two";
export const REQUIRED_ASSIGNMENTS = 3;
export function requiredAssignments(policy: RunPolicy = "three-required") {
  return policy === "legacy-two" ? 2 : REQUIRED_ASSIGNMENTS;
}
export function campaignWon(won: number, policy: RunPolicy = "three-required") {
  return won >= requiredAssignments(policy);
}
