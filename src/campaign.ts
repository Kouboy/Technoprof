// Three successes are mandatory; the shared life budget controls retries.
export type RunPolicy = "three-required" | "legacy-two";
export const REQUIRED_ASSIGNMENTS = 3;
export function requiredAssignments(policy: RunPolicy = "three-required") {
  return policy === "legacy-two" ? 2 : REQUIRED_ASSIGNMENTS;
}
export function campaignWon(won: number, policy: RunPolicy = "three-required") {
  return won >= requiredAssignments(policy);
}
