// DOM only: visible before Phaser's synchronous texture preparation, no frame polling.
type Loader = {
  on(event: string, callback: (...args: any[]) => void): unknown;
};
let failed = false;
function stage(label: string, value?: number) {
  const text = document.getElementById("loading-stage");
  const meter = document.getElementById(
    "loading-progress",
  ) as HTMLProgressElement | null;
  if (text) text.textContent = label;
  if (meter) {
    if (value === undefined) meter.removeAttribute("value");
    else meter.value = Math.max(0, Math.min(1, value));
  }
}
export function installLoadingPresentation(loader: Loader) {
  failed = false;
  const retry = document.getElementById("loading-retry");
  if (retry) retry.hidden = true;
  stage("Chargement des images…", 0);
  loader.on("progress", (value: number) => {
    if (!failed) stage("Chargement des images…", value);
  });
  loader.on("complete", prepareLoadingPresentation);
  loader.on("loaderror", () => {
    failed = true;
    stage("Chargement interrompu. Réessayez.");
    const retry = document.getElementById("loading-retry");
    if (retry) {
      retry.hidden = false;
      retry.onclick = () => location.reload();
    }
  });
}
export function prepareLoadingPresentation() {
  // File completion does not mean that the prepared sprites are ready.
  if (failed) return false;
  stage("Préparation du service…");
  return true;
}
export function finishLoadingPresentation() {
  const loading = document.getElementById("loading");
  if (loading) loading.hidden = !failed;
  if (failed) {
    const menu = document.getElementById("player-panel");
    if (menu) {
      menu.hidden = true;
      menu.inert = true;
    }
  }
}
