// Browser presentation only. Opening a new window starts at its own title screen;
// the source run is paused, never silently transferred or restarted.
export function installGameWindow(
  pause: () => void,
  refreshLayout: () => void = () => {},
) {
  const toolbar = document.getElementById("player-toolbar")!;
  const game = document.getElementById("game")!;
  const body = document.body;
  let dedicated =
    new URL(window.location.href).searchParams.get("fenetre") === "1";
  let popup: Window | null = null;
  let resizePending = false;
  const status = document.createElement("span");
  status.id = "window-status";
  status.setAttribute("role", "status");
  status.hidden = true;
  const announce = (message: string) => {
    status.textContent = message;
    status.hidden = !message;
  };
  const fit = () => {
    if (!body.classList.contains("dedicated-window")) return;
    const style = getComputedStyle(body);
    const width =
      window.innerWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight);
    const height =
      window.innerHeight -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom) -
      toolbar.getBoundingClientRect().height -
      document.getElementById("player-feedback")!.getBoundingClientRect()
        .height;
    body.style.setProperty(
      "--window-game-width",
      Math.max(1, Math.floor(Math.min(width, (height * 4) / 3))) + "px",
    );
    if (!resizePending) {
      resizePending = true;
      requestAnimationFrame(() => {
        resizePending = false;
        // The title hides this parent. Do not send zero-sized bounds to Phaser;
        // observing the parent refreshes it as soon as gameplay becomes visible.
        if (game.clientWidth > 0 && game.clientHeight > 0) refreshLayout();
      });
    }
  };
  const apply = () => {
    body.classList.toggle(
      "dedicated-window",
      dedicated || !!document.fullscreenElement,
    );
    fit();
  };
  const button = (label: string, action: () => void) => {
    const element = document.createElement("button");
    element.textContent = label;
    element.onclick = action;
    toolbar.append(element);
    return element;
  };
  if (!dedicated) {
    const fallback = document.createElement("button");
    fallback.textContent = "Adapter cet onglet";
    fallback.hidden = true;
    fallback.onclick = () => {
      dedicated = true;
      announce("");
      launch.hidden = fallback.hidden = true;
      apply();
      game.focus();
    };
    const launch = button("Ouvrir dans une fenêtre", () => {
      pause();
      if (popup && !popup.closed) {
        popup.focus();
        return;
      }
      const url = new URL(window.location.href);
      url.searchParams.set("fenetre", "1");
      // Browsers may choose a tab instead. A real click is required by blockers.
      const width = Math.min(1000, window.screen.availWidth - 40);
      const height = Math.min(850, window.screen.availHeight - 80);
      try {
        popup = window.open(
          url.href,
          "technoprof-game",
          `popup,width=${width},height=${height},resizable=yes,scrollbars=yes`,
        );
        if (!popup) throw Error("blocked");
        popup.focus();
        announce(
          "Fenêtre ouverte. Cette partie reste en pause ; la nouvelle fenêtre démarre au titre.",
        );
        fallback.hidden = true;
      } catch {
        announce(
          "Le navigateur a bloqué la fenêtre. Autorisez-la ou adaptez cet onglet.",
        );
        fallback.hidden = false;
      }
    });
    launch.title =
      "Démarre au titre dans une nouvelle fenêtre ; la partie actuelle est mise en pause.";
    toolbar.append(fallback);
  }
  if (
    document.documentElement.requestFullscreen &&
    document.fullscreenEnabled !== false
  ) {
    const fullscreen = button("Plein écran", async () => {
      pause();
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
        announce("");
      } catch {
        announce(
          "Le plein écran est indisponible dans ce navigateur. Le jeu reste accessible dans cette fenêtre.",
        );
      }
      apply();
      game.focus();
    });
    document.addEventListener("fullscreenchange", () => {
      fullscreen.textContent = document.fullscreenElement
        ? "Quitter le plein écran"
        : "Plein écran";
      apply();
    });
  }
  toolbar.append(status);
  window.addEventListener("resize", fit);
  // Captions and buttons can wrap on small screens. Observe their actual height,
  // not a fixed allowance which would crop the frame or hide touch controls.
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(fit);
    observer.observe(toolbar);
    observer.observe(document.getElementById("player-feedback")!);
    observer.observe(game);
  }
  apply();
}
