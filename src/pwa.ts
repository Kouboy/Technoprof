type InstallPrompt = Event & {
  prompt(): Promise<unknown>;
};

type OfflineMessage =
  | {
      type: "status";
      ready: boolean;
      previous: boolean;
      bytes: number;
      total: number;
    }
  | { type: "progress"; downloaded: number }
  | { type: "done" | "error" };

export function installPwa() {
  if (
    !window.isSecureContext ||
    window.top !== window ||
    !navigator.serviceWorker
  )
    return;
  const manifest = document.querySelector<HTMLLinkElement>(
    'link[rel="manifest"]',
  );
  if (!manifest) return;

  const controls = document.createElement("section");
  controls.setAttribute("aria-label", "Installation et jeu hors connexion");
  const actions = document.createElement("div");
  actions.className = "player-actions";
  const install = document.createElement("button");
  install.textContent = "Installer Technoprof";
  const download = document.createElement("button");
  download.textContent = "Préparer le jeu hors connexion";
  download.disabled = true;
  const installHelp = document.createElement("p");
  installHelp.hidden = true;
  installHelp.setAttribute("role", "status");
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const progress = document.createElement("progress");
  progress.hidden = true;
  progress.setAttribute("aria-label", "Téléchargement du jeu hors connexion");
  actions.append(install, download);
  controls.append(actions, installHelp, progress, status);

  let prompt: InstallPrompt | undefined;
  const installedDisplay = window.matchMedia(
    "(display-mode: fullscreen), (display-mode: standalone)",
  );
  install.hidden =
    installedDisplay.matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    prompt = event as InstallPrompt;
  });
  window.addEventListener("appinstalled", () => {
    prompt = undefined;
    install.hidden = installHelp.hidden = true;
  });
  install.onclick = async () => {
    const pending = prompt;
    prompt = undefined;
    if (pending) {
      try {
        await pending.prompt();
        return;
      } catch {
        // Browser menus remain available if the in-page prompt is declined or blocked.
      }
    }
    installHelp.textContent =
      "Dans le menu du navigateur, choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ». Sur iPhone, ouvre Technoprof dans Safari et utilise le menu Partager.";
    installHelp.hidden = false;
  };

  const tellWorker = (
    worker: ServiceWorker,
    command: string,
    onMessage: (message: OfflineMessage) => void,
  ) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event: MessageEvent<OfflineMessage>) => {
      const message = event.data;
      if (message.type !== "progress") channel.port1.close();
      onMessage(message);
    };
    worker.postMessage(command, [channel.port2]);
  };

  const error = () => {
    progress.hidden = true;
    status.textContent =
      "Impossible de préparer le hors connexion. Vérifie la connexion et l’espace de stockage, puis réessaie.";
  };
  void navigator.serviceWorker
    .register(new URL("sw.js", manifest.href), { updateViaCache: "none" })
    .then(() => navigator.serviceWorker.ready)
    .then((registration) => {
      const worker = registration.active;
      if (!worker) return;
      tellWorker(worker, "offline-status", (message) => {
        if (message.type !== "status") return error();
        download.disabled = message.ready;
        download.textContent = message.ready
          ? "Jeu disponible hors connexion"
          : message.previous
            ? "Actualiser le jeu hors connexion"
            : "Préparer le jeu hors connexion";
        status.textContent = message.ready
          ? "Le jeu complet est téléchargé sur cet appareil."
          : `Téléchargement facultatif d’environ ${Math.ceil(message.bytes / 1_000_000)} Mo.`;
        progress.max = message.total;
      });
      download.onclick = () => {
        download.disabled = true;
        progress.value = 0;
        progress.hidden = false;
        status.textContent =
          "Téléchargement en cours. Garde cette fenêtre ouverte.";
        tellWorker(worker, "prepare-offline", (message) => {
          if (message.type === "progress") {
            progress.value = message.downloaded;
          } else if (message.type === "done") {
            progress.hidden = true;
            download.textContent = "Jeu disponible hors connexion";
            status.textContent =
              "Le jeu complet est téléchargé sur cet appareil.";
          } else {
            download.disabled = false;
            error();
          }
        });
      };
    })
    .catch(error);
  return controls;
}
