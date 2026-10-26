import type { AudioKit, SceneSoundContext } from "./audio";
import { campaignWon, type RunPolicy } from "./campaign";
import { mountTitleArt } from "./title-screen";
import { ENCOUNTERS, type Encounter, type DialogueState } from "./dialogue";
import type { PadUIAction } from "./gamepad-input";
export const RADIO_NAME = "Radio Educa France";
// Explicit pronunciation supplied with the approved dialogue rewrite.
export const RADIO_SPOKEN_NAME = "Radio Éduca-France";
export const RADIO_BULLETINS = [
  "La rentrée est prête : les postes vacants seront occupés par le mot priorité.",
  "Le ministère annonce plus d’autonomie. Chaque établissement pourra désormais choisir ce qu’il ne répare pas.",
  "Ce soir, débat sur les conditions de travail des professeurs. Aucun enseignant n'a pu venir : ils corrigent les copies des examens en retard.",
];

export const DAY_BRIEFS = [
  "07:00 — Prise de service. Le trafic laisse encore de la place.",
  "12:00 — Deuxième service. Deux fois plus de traversées et de rencontres.",
  "18:30 — Dernier service. Le périmètre double encore ; les dégâts restent.",
];
export function resultLine(
  ok: boolean,
  reason: string | null,
  onRoad: boolean,
) {
  if (ok) return "COURS ASSURE";
  if (reason === "breakdown") return "PANNE DU VEHICULE";
  if (reason === "exhausted") return "PROF EPUISE";
  return onRoad ? "RETARD SUR LA ROUTE" : "RETARD DANS LE COLLEGE";
}
export type PlayerContext = {
  phase: string;
  paused: boolean;
  mission: number;
  age: number;
  room: number;
  encounterTime: number;
  roomTransition?: unknown;
  roomEnteredAt: number;
  session: { elapsed: number };
  pointerMode?: boolean;
  gamepadMode?: boolean;
  dialogue?: DialogueState;
};
export function contextualHelp(s: PlayerContext) {
  if (s.paused) return "";
  if (s.phase === "home")
    return "La journée est assurée. Rentrez tranquillement : aucun délai. Freinez pour ralentir ; relâchez pour reprendre votre allure.";
  if (s.phase === "homeArrival") return "Vous êtes arrivé. Fin de service.";
  if (s.phase === "intro" || s.phase === "ending")
    return s.gamepadMode
      ? "Lecture automatique · Start pour passer la cinématique."
      : "Lecture automatique · Pause pour interrompre · Passer la cinématique pour poursuivre.";
  if (s.phase === "course" && s.age > 1)
    return s.gamepadMode
      ? "A/B/X pour poursuivre après le cours."
      : "Une touche ou un toucher pour poursuivre après le cours.";
  if (s.mission !== 0)
    return s.phase === "free" && s.age < 10
      ? DAY_BRIEFS[Math.min(2, s.mission)]
      : "";
  if (s.phase === "free" && s.age < 10)
    return s.gamepadMode
      ? "RT accélérer · LT freiner · stick gauche ou croix pour diriger."
      : s.pointerMode
        ? "Maintenez dans la scène pour accélérer. Glissez pour diriger ; vers le bas pour freiner. Relâchez pour laisser rouler."
        : "Z/↑ accélérer · S/↓ freiner · Q D/← → diriger. Souris/tactile : maintenir puis glisser dans la scène.";
  if (s.phase === "receive" || (s.phase === "road" && s.age < 8))
    return "Le délai a commencé : route et recherche de la salle partagent le même chronomètre.";
  if (s.phase === "arrival" || s.phase === "arrivalFade")
    return "Arrivée automatique : le délai est suspendu. Vous reprendrez la main dans la cour.";
  if (s.phase !== "school" || s.encounterTime > 0 || s.roomTransition)
    return "";
  const elapsed = s.session.elapsed - s.roomEnteredAt;
  // Legacy workshop rooms and the delivered Ormeaux H1 topology.
  if ([0, 200].includes(s.room) && elapsed < 10)
    return s.gamepadMode
      ? "Stick gauche ou croix pour marcher. Haut/bas pour les portes et les escaliers indiqués."
      : s.pointerMode
        ? "Touchez le sol pour marcher, une porte pour la rejoindre. Glissez vers le haut pour sauter, en diagonale pour sauter dans cette direction."
        : "Q D/← → marcher. Suivez les plaques ; les accès indiquent leur touche à proximité.";
  if ([1, 201].includes(s.room) && elapsed < 20)
    return s.gamepadMode
      ? "B/X : se défendre avec le livre. A : sauter les trous ou une charge. Vous pouvez aussi éviter l’adversaire."
      : s.pointerMode
        ? "Touchez l’adversaire pour aller le frapper. Touchez le sol pour vous placer ; glissez vers le haut pour sauter."
        : "F/X : se défendre avec le livre. ESPACE : sauter les trous ou une charge. Vous pouvez aussi éviter l’adversaire.";
  if ([4, 207].includes(s.room) && elapsed < 22)
    return "L’inspection bloque le livre. Évitez son attaque, puis frappez pendant son ouverture.";
  return "";
}
type Host = PlayerContext & {
  gamepadConnected?: boolean;
  gamepadMenu?: (action: PadUIAction) => void;
  pauseControl?: boolean;
  runPolicy?: RunPolicy;
  cinematic?: {
    index: number;
    count: number;
    kind: string;
  } | null;
  skipCinematic?(): void;
  sceneSoundContext?(): SceneSoundContext;
  validatedDay?: boolean;
  won: number;
  results: string[];
  reducedShake: boolean;
  pauseReason: string;
  audio: AudioKit;
  music?: { blocked: boolean; retry(): void };
  cinematicAudio?: { blocked: boolean; retry(): void };
  radioLines: string[];
  remaining: number;
  enemies?: { female?: boolean }[];
  encounter?(): Encounter | undefined;
  missionSpec?(): { school: string };
  startDay(): void;
  setPaused(value: boolean, reason?: string): void;
  setPlayerMenu(open: boolean): void;
  draw(): void;
  exportJournal(): void;
};
export function installPlayerExperience(s: Host) {
  const root = document.getElementById("player-panel")!;
  const toolbar = document.getElementById("player-toolbar")!;
  const help = document.getElementById("player-help")!;
  const captions = document.getElementById("radio-caption")!;
  const dialogueCaption = document.getElementById("dialogue-caption");
  const game = document.getElementById("game")!;
  const loading = document.getElementById("loading");
  if (loading) loading.hidden = true;
  toolbar.hidden = false;
  s.pauseControl = true;
  let hints = true,
    menuPage = "home",
    previous = "",
    currentMode = "";
  let previousStory = "";
  try {
    const saved = JSON.parse(
      localStorage.getItem("technoprof-player-options") || "null",
    );
    if (saved) {
      s.audio.effectsVolume = Number.isFinite(saved.effects)
        ? Math.max(0, Math.min(1, saved.effects))
        : 1;
      s.audio.voiceVolume = Number.isFinite(saved.voice)
        ? Math.max(0, Math.min(1, saved.voice))
        : 1;
      s.audio.ambienceVolume = Number.isFinite(saved.ambience)
        ? Math.max(0, Math.min(1, saved.ambience))
        : 1;
      s.audio.musicVolume = Number.isFinite(saved.music)
        ? Math.max(0, Math.min(1, saved.music))
        : 0.5;
      hints = saved.hints !== false;
      s.audio.muted = saved.muted === true;
    }
  } catch {
    /* Settings remain usable without storage. */
  }
  let lastMuted = s.audio.muted;
  const save = () => {
    try {
      localStorage.setItem(
        "technoprof-player-options",
        JSON.stringify({
          effects: s.audio.effectsVolume,
          voice: s.audio.voiceVolume,
          ambience: s.audio.ambienceVolume,
          music: s.audio.musicVolume,
          hints,
          muted: s.audio.muted,
        }),
      );
      localStorage.setItem("technoprof-reduced-shake", String(s.reducedShake));
    } catch {
      /* Offline/private browser fallback. */
    }
  };
  const button = (text: string, action: () => void, primary = false) => {
    const b = document.createElement("button");
    b.textContent = text;
    if (primary) b.className = "primary";
    b.onclick = () => {
      if (s.phase === "title") s.music?.retry();
      action();
    };
    return b;
  };
  const returnToGame = () => {
    s.audio.unlock();
    menuPage = "home";
    if (s.phase === "title" || s.phase === "report") s.startDay();
    else s.setPaused(false);
    s.setPlayerMenu(false);
    sync();
    game.focus();
  };
  const open = (page: string) => {
    if (!["title", "report"].includes(s.phase)) s.setPaused(true);
    menuPage = page;
    previous = "";
    sync();
  };
  const pauseButton = button("Pause / aide", () => open("home"));
  const pauseControl = button("Pause", () => open("home"));
  pauseControl.id = "cadre-pause";
  pauseControl.setAttribute("aria-label", "Pause / aide");
  pauseControl.title = "Pause / menu (P ou Échap)";
  document.getElementById("game-shell")?.append(pauseControl);
  const toggleMute = () => {
    s.audio.muted = !s.audio.muted;
    save();
    s.audio.radio(
      s.radioLines[Math.min(2, s.mission)],
      s.phase === "free",
      s.paused,
    );
    s.audio.scene(
      s.phase,
      s.paused,
      s.remaining,
      0,
      s.room,
      s.encounterTime > 0,
      s.sceneSoundContext?.(),
    );
    game.focus();
    sync();
  };
  const muteButton = button("Couper le son", toggleMute);
  toolbar.append(pauseButton, muteButton);
  const storySkip = button("Passer la cinématique", () => {
    if (s.paused) s.setPaused(false);
    s.setPlayerMenu(false);
    s.skipCinematic?.();
    sync();
    game.focus();
  });
  for (const b of [storySkip, pauseControl])
    b.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) b.click();
      }
    };
  storySkip.hidden = true;
  toolbar.append(storySkip);
  const musicRetry = s.music
    ? button("Relancer la musique", () => {
        s.music?.retry();
        s.cinematicAudio?.retry();
      })
    : undefined;
  if (musicRetry) {
    musicRetry.hidden = true;
    const label = document.createElement("span");
    label.textContent = "Journée musicale — essai";
    toolbar.append(label, musicRetry);
  }
  const paragraph = (text: string) => {
    const p = document.createElement("p");
    p.textContent = text;
    root.append(p);
  };
  const controls = () => {
    const dl = document.createElement("dl");
    for (const [key, action] of [
      ["Sur la route", "Z/↑ accélérer · S/↓ freiner · Q D/← → diriger"],
      [
        "Dans le collège",
        "Q D ou ← → marcher · ESPACE sauter · F ou X frapper",
      ],
      [
        "Pendant un dialogue",
        "F ou X afficher, puis poursuivre · délai suspendu",
      ],
      [
        "Portes / escaliers",
        "Z/↑ ou S/↓, selon la flèche affichée près du passage",
      ],
      [
        "Souris / tactile",
        "Touchez le sol pour marcher, un adversaire pour aller le frapper, un passage pour l’emprunter. Glissez vers le haut pour sauter ; en diagonale pour sauter dans cette direction.",
      ],
      [
        "Conduite directe",
        "Maintenez dans la scène pour accélérer. Glissez à gauche/droite pour diriger ; vers le bas pour freiner. Relâchez pour laisser rouler.",
      ],
      [
        "Dialogue / après le cours",
        "Un clic ou toucher révèle la réplique puis la poursuit. Après le cours ou un échec, touchez pour continuer.",
      ],
      ["À tout moment", "P ou Échap : pause / reprise · M : son"],
      [
        "Manette — route",
        "Stick gauche ou croix : diriger · RT : accélérer · LT : freiner",
      ],
      [
        "Manette — à pied",
        "Stick/croix : se déplacer et emprunter les accès · A : sauter · B/X : frapper / réplique",
      ],
      [
        "Manette — menus",
        "Croix/stick : naviguer · A : valider · B/X : retour · gauche/droite : ajuster un réglage",
      ],
      [
        "Start",
        "Commencer au titre · passer une cinématique · pause/reprise en jeu",
      ],
    ]) {
      const dt = document.createElement("dt"),
        dd = document.createElement("dd");
      dt.textContent = key;
      dd.textContent = action;
      dl.append(dt, dd);
    }
    root.append(dl);
  };
  function sync() {
    if (musicRetry) {
      musicRetry.hidden = !s.music?.blocked && !s.cinematicAudio?.blocked;
      const retryLabel =
        s.phase === "title" ? "Écouter le titre" : "Relancer la musique";
      if (musicRetry.textContent !== retryLabel)
        musicRetry.textContent = retryLabel;
    }
    if (lastMuted !== s.audio.muted) {
      lastMuted = s.audio.muted;
      save();
    }
    const mode =
      s.phase === "title"
        ? "title"
        : s.phase === "report"
          ? "report"
          : s.paused
            ? "pause"
            : "";
    if (mode !== currentMode) {
      menuPage = "home";
      currentMode = mode;
    }
    pauseButton.hidden = !mode ? false : true;
    pauseControl.hidden = !!mode;
    const inStory = s.phase === "intro" || s.phase === "ending";
    const storyKey = s.cinematic
      ? s.cinematic.kind + ":" + s.cinematic.index
      : "";
    if (storyKey !== previousStory) {
      previousStory = storyKey;
      game.setAttribute("data-sequence", storyKey);
    }
    storySkip.hidden = !inStory;
    const muteText = s.audio.muted ? "Activer le son (M)" : "Couper le son (M)";
    if (muteButton.textContent !== muteText) muteButton.textContent = muteText;
    const hint = hints ? contextualHelp(s) : "";
    if (help.textContent !== hint) help.textContent = hint;
    help.hidden = !hint || !!mode;
    const bulletin = s.phase === "free" && !mode ? s.mission : -1;
    const caption =
      bulletin >= 0
        ? RADIO_NAME + " — " + RADIO_BULLETINS[Math.min(2, bulletin)]
        : "";
    if (captions.textContent !== caption) captions.textContent = caption;
    captions.hidden = !caption;
    if (dialogueCaption) {
      const data =
        s.phase === "school" && s.encounterTime > 0 && !mode && s.dialogue
          ? (s.encounter?.() ?? ENCOUNTERS[s.room])
          : undefined;
      const page = data?.pages[s.dialogue?.page ?? 0];
      let chars = Math.floor(s.dialogue?.characters ?? 0);
      const speech =
        page
          ?.map((line) => {
            const shown = line.slice(0, Math.max(0, chars));
            chars -= line.length;
            return shown;
          })
          .filter(Boolean)
          .join(" ") ?? "";
      const name =
        s.room === 4 && s.enemies?.[0]?.female ? "INSPECTRICE" : data?.name;
      const text = speech ? name + " — " + speech : "";
      if (dialogueCaption.textContent !== text)
        dialogueCaption.textContent = text;
      dialogueCaption.hidden = !text;
    }
    root.hidden = !mode;
    root.className =
      menuPage === "home" && mode === "title"
        ? "title-home"
        : menuPage === "home" && mode === "report"
          ? "result-home " +
            (campaignWon(s.won, s.runPolicy)
              ? "result-maintained"
              : "result-radiated")
          : "";
    const key =
      mode +
      ":" +
      menuPage +
      ":" +
      s.results.join("|") +
      ":" +
      !!s.gamepadConnected;
    if (key === previous) return;
    previous = key;
    s.setPlayerMenu(!!mode);
    if (!mode) return;
    root.replaceChildren();
    root.scrollTop = 0;
    const eyebrow = document.createElement("small");
    eyebrow.textContent = "CADRE / PERSONNEL REMPLAÇANT";
    const heading = document.createElement("h1");
    heading.tabIndex = -1;
    heading.textContent =
      menuPage === "controls"
        ? "Commandes"
        : menuPage === "settings"
          ? "Réglages"
          : mode === "title"
            ? "TECHNOPROF"
            : mode === "report"
              ? campaignWon(s.won, s.runPolicy)
                ? "Maintien en poste"
                : "Radiation prononcée"
              : "Service suspendu";
    root.append(eyebrow, heading);
    if (menuPage !== "home" || mode !== "title") root.append(toolbar);
    if (menuPage === "controls") {
      paragraph(
        "Trois affectations à réussir. Au premier échec, la tentative se termine et vous repartez à la première affectation. Attendez l’ordre en voiture, rejoignez l’établissement puis trouvez la salle. Le délai est commun à la route et à la recherche ; l’arrivée automatique est gratuite.",
      );
      controls();
      if (s.gamepadConnected) paragraph("Manette standard détectée.");
      paragraph(
        "Les dégâts de la voiture restent entre les affectations réussies ; le professeur récupère. Recommencer restaure toute la journée.",
      );
    } else if (menuPage === "settings") {
      const sliders: [string, number, (v: number) => void][] = [
        [
          "Effets et moteur",
          s.audio.effectsVolume,
          (v) => (s.audio.effectsVolume = v),
        ],
        [
          "Voix de la radio",
          s.audio.voiceVolume,
          (v) => (s.audio.voiceVolume = v),
        ],
        [
          "Ambiances et bruit de route",
          s.audio.ambienceVolume,
          (v) => (s.audio.ambienceVolume = v),
        ],
      ];
      if (s.music)
        sliders.push([
          "Musique",
          s.audio.musicVolume,
          (v) => (s.audio.musicVolume = v),
        ]);
      for (const [label, value, change] of sliders) {
        const wrap = document.createElement("label"),
          input = document.createElement("input"),
          out = document.createElement("output");
        input.type = "range";
        input.min = "0";
        input.max = "100";
        input.value = String(Math.round(value * 100));
        input.setAttribute("aria-label", label);
        out.textContent = input.value + " %";
        input.oninput = () => {
          change(Number(input.value) / 100);
          out.textContent = input.value + " %";
          save();
        };
        wrap.className = "setting";
        wrap.append(label, input, out);
        root.append(wrap);
      }
      for (const [label, checked, change] of [
        [
          "Secousses réduites",
          s.reducedShake,
          (v: boolean) => (s.reducedShake = v),
        ],
        [
          "Aide contextuelle dans le menu pause",
          hints,
          (v: boolean) => (hints = v),
        ],
      ] as [string, boolean, (v: boolean) => void][]) {
        const wrap = document.createElement("label"),
          input = document.createElement("input");
        input.type = "checkbox";
        input.checked = checked;
        input.onchange = () => {
          change(input.checked);
          save();
        };
        wrap.className = "setting";
        wrap.append(input, label);
        root.append(wrap);
      }
      paragraph(
        "Le bulletin radio est consultable dans le menu pause pendant la croisière. Une voix française locale est utilisée si elle est disponible.",
      );
    } else if (mode === "title") {
      root.append(
        mountTitleArt(button("Prendre le service", returnToGame, true)),
      );
      paragraph("Trois affectations à assurer. Un échec termine la tentative.");
    } else if (mode === "report") {
      paragraph(
        `${s.won} cours assuré${s.won > 1 ? "s" : ""} sur 3 — trois réussites requises.`,
      );
      const list = document.createElement("ol");
      s.results.forEach((result, i) => {
        const item = document.createElement("li");
        item.textContent =
          [
            "07:00 — Collège des Ormeaux",
            "12:00 — Lycée Auguste-Berthelot",
            "18:30 — Lycée professionnel des Trois-Ponts",
          ][i] +
          " — " +
          result;
        list.append(item);
      });
      root.append(list);
      paragraph(
        campaignWon(s.won, s.runPolicy)
          ? "Le service a tenu. Les moyens sont donc déclarés suffisants."
          : "Les contraintes matérielles ne sauraient, selon le rapport, excuser les carences.",
      );
    } else {
      if (s.pauseReason === "MANETTE DECONNECTEE")
        paragraph(
          "Manette déconnectée. Rebranchez-la, puis reprenez avec Start, ou utilisez le clavier.",
        );
      paragraph(
        s.pauseReason
          ? "La partie est suspendue. Reprenez quand vous êtes prêt."
          : "Le délai est arrêté. Soufflez un instant.",
      );
      paragraph(DAY_BRIEFS[Math.min(2, s.mission)]);
      if (hints) {
        const hint = contextualHelp({ ...s, paused: false });
        if (hint) paragraph(hint);
      }
      if (s.phase === "free")
        paragraph(RADIO_NAME + " — " + RADIO_BULLETINS[Math.min(2, s.mission)]);
    }
    const actions = document.createElement("div");
    actions.className = "player-actions";
    if (menuPage === "home" && mode !== "title")
      actions.append(button("Exporter mon essai", () => s.exportJournal()));
    if (menuPage !== "home")
      actions.append(
        button(
          "Retour",
          () => {
            menuPage = "home";
            previous = "";
            sync();
          },
          true,
        ),
      );
    else {
      if (mode !== "title")
        actions.append(
          button(
            mode === "report" ? "Nouvelle journée" : "Reprendre",
            returnToGame,
            true,
          ),
        );
      actions.append(
        button("Commandes", () => open("controls")),
        button("Réglages", () => open("settings")),
      );
    }
    root.append(actions);
    const preferred =
      s.gamepadMode && root.querySelector
        ? root.querySelector<HTMLElement>(
            menuPage === "settings"
              ? 'input[type="range"]'
              : "button.primary, .title-start",
          )
        : null;
    (preferred ?? heading).focus({ preventScroll: true });
    preferred?.scrollIntoView?.({ block: "nearest" });
  }
  s.gamepadMenu = (action) => {
    if (action === "start") {
      if (["intro", "ending"].includes(s.phase)) {
        if (s.paused) s.setPaused(false);
        s.setPlayerMenu(false);
        s.skipCinematic?.();
        sync();
        game.focus();
      } else if (["title", "report"].includes(s.phase) || s.paused)
        returnToGame();
      else open("home");
      return;
    }
    if (!currentMode) return;
    if (action === "back") {
      if (menuPage !== "home") {
        menuPage = "home";
        previous = "";
        sync();
      } else if (s.paused) returnToGame();
      return;
    }
    const items = [
      ...root.querySelectorAll<HTMLElement>("button,input,select"),
    ].filter(
      (node) =>
        !node.hidden &&
        !(node as HTMLInputElement).disabled &&
        node.getClientRects().length > 0,
    );
    if (!items.length) return;
    const active = document.activeElement as HTMLInputElement;
    let index = items.indexOf(active);
    if (index < 0)
      index = items.findIndex((node) =>
        node.matches("button.primary,.title-start,input[type=range]"),
      );
    if (index < 0) index = 0;
    if (action === "accept") {
      items[index].click();
      return;
    }
    if ((action === "left" || action === "right") && active?.type === "range") {
      active.value = String(
        Math.max(
          Number(active.min),
          Math.min(
            Number(active.max),
            Number(active.value) + (action === "right" ? 5 : -5),
          ),
        ),
      );
      active.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    const delta = action === "up" || action === "left" ? -1 : 1;
    const next = items[(index + delta + items.length) % items.length];
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: "nearest" });
  };
  document.addEventListener(
    "keydown",
    (event) => {
      const editable = (event.target as HTMLElement)?.matches(
        "input,select,button",
      );
      if (
        (s.phase === "intro" || s.phase === "ending") &&
        !editable &&
        ["f", "x", "Enter", " "].includes(event.key)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (event.repeat) return;
      if (
        event.key === "Escape" ||
        (s.paused && event.key.toLowerCase() === "p")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (menuPage !== "home") {
          menuPage = "home";
          previous = "";
          sync();
        } else if (s.paused) returnToGame();
        else if (!["title", "report"].includes(s.phase)) open("home");
      } else if (currentMode && event.key.toLowerCase() === "m" && !editable) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toggleMute();
      } else if (
        currentMode &&
        (event.key === "Enter" ||
          (event.key === " " && currentMode === "title")) &&
        !editable &&
        menuPage === "home"
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        returnToGame();
      }
    },
    true,
  );
  sync();
  return sync;
}
