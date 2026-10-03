import type { AudioKit } from "./audio";
import { ENCOUNTERS, type DialogueState } from "./dialogue";
export const RADIO_BULLETINS = [
  "La rentrée est prête : les postes vacants seront occupés par le mot priorité.",
  "Le ministère annonce plus d’autonomie. Chaque établissement pourra désormais choisir ce qu’il ne répare pas.",
  "Le débat du jour : les enseignants travaillent-ils assez ? Les enseignants invités sont encore en classe.",
];

export const DAY_BRIEFS = [
  "08:00 — Prise de service. Le trafic laisse encore de la place.",
  "12:00 — Même collège, trafic plus dense et délai réduit de 15 secondes.",
  "17:00 — Dernier service. Le trafic se resserre ; la voiture conserve ses dégâts.",
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
  roomEnteredAt: number;
  session: { elapsed: number };
  pointerMode?: boolean;
  dialogue?: DialogueState;
};
export function contextualHelp(s: PlayerContext) {
  if (s.paused) return "";
  if (s.phase === "course" && s.age > 1)
    return "Une touche ou un toucher pour poursuivre après le cours.";
  if (s.mission !== 0)
    return s.phase === "free" && s.age < 10
      ? DAY_BRIEFS[Math.min(2, s.mission)]
      : "";
  if (s.phase === "free" && s.age < 10)
    return s.pointerMode
      ? "Maintenez dans la scène pour accélérer. Glissez pour diriger ; vers le bas pour freiner. Relâchez pour laisser rouler."
      : "Z/↑ accélérer · S/↓ freiner · Q D/← → diriger. Souris/tactile : maintenir puis glisser dans la scène.";
  if (s.phase === "receive" || (s.phase === "road" && s.age < 8))
    return "Le délai a commencé : route et recherche de la salle partagent le même chronomètre.";
  if (s.phase === "arrival" || s.phase === "arrivalFade")
    return "Arrivée automatique : le délai est suspendu. Vous reprendrez la main dans la cour.";
  if (s.phase !== "school" || s.encounterTime > 0) return "";
  const elapsed = s.session.elapsed - s.roomEnteredAt;
  if (s.room === 0 && elapsed < 10)
    return s.pointerMode
      ? "Touchez le sol pour marcher, une porte pour la rejoindre. Glissez vers le haut pour sauter, en diagonale pour sauter dans cette direction."
      : "Q D/← → marcher. Suivez les plaques ; les accès indiquent leur touche à proximité.";
  if (s.room === 1 && elapsed < 20)
    return s.pointerMode
      ? "Touchez l’adversaire pour aller le frapper. Touchez le sol pour vous placer ; glissez vers le haut pour sauter."
      : "F/X : se défendre avec le livre. ESPACE : sauter les trous ou une charge. Vous pouvez aussi éviter l’adversaire.";
  if (s.room === 4 && elapsed < 22)
    return "L’inspection bloque le livre. Évitez son attaque, puis frappez pendant son ouverture.";
  return "";
}
type Host = PlayerContext & {
  won: number;
  results: string[];
  reducedShake: boolean;
  pauseReason: string;
  audio: AudioKit;
  radioLines: string[];
  remaining: number;
  enemies?: { female?: boolean }[];
  startDay(): void;
  setPaused(value: boolean, reason?: string): void;
  setPlayerMenu(open: boolean): void;
  draw(): void;
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
  let hints = true,
    menuPage = "home",
    previous = "",
    currentMode = "";
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
    b.onclick = action;
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
  const toggleMute = () => {
    s.audio.muted = !s.audio.muted;
    save();
    s.audio.radio(
      s.radioLines[Math.min(2, s.mission)],
      s.phase === "free",
      s.paused,
    );
    s.audio.scene(s.phase, s.paused, s.remaining, 0);
    game.focus();
    sync();
  };
  const muteButton = button("Couper le son", toggleMute);
  toolbar.append(pauseButton, muteButton);
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
    const muteText = s.audio.muted ? "Activer le son (M)" : "Couper le son (M)";
    if (muteButton.textContent !== muteText) muteButton.textContent = muteText;
    const hint = hints ? contextualHelp(s) : "";
    if (help.textContent !== hint) help.textContent = hint;
    help.hidden = !hint || !!mode;
    const bulletin = s.phase === "free" && !mode ? s.mission : -1;
    const caption =
      bulletin >= 0
        ? "Radio : Educ France — " + RADIO_BULLETINS[Math.min(2, bulletin)]
        : "";
    if (captions.textContent !== caption) captions.textContent = caption;
    captions.hidden = !caption;
    if (dialogueCaption) {
      const data =
        s.phase === "school" && s.encounterTime > 0 && !mode && s.dialogue
          ? ENCOUNTERS[s.room]
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
    const key = mode + ":" + menuPage + ":" + s.results.join("|");
    if (key === previous) return;
    previous = key;
    s.setPlayerMenu(!!mode);
    if (!mode) return;
    root.replaceChildren();
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
              ? s.won >= 2
                ? "Maintien en poste"
                : "Radiation prononcée"
              : "Service suspendu";
    root.append(eyebrow, heading);
    if (menuPage === "controls") {
      controls();
      paragraph(
        "Une affectation ratée laisse place à la suivante. Les dégâts de la voiture restent ; le professeur récupère entre deux services.",
      );
    } else if (menuPage === "settings") {
      const sliders: [string, number, (v: number) => void][] = [
        [
          "Effets et ambiance",
          s.audio.effectsVolume,
          (v) => (s.audio.effectsVolume = v),
        ],
        [
          "Voix de la radio",
          s.audio.voiceVolume,
          (v) => (s.audio.voiceVolume = v),
        ],
      ];
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
        ["Rappels contextuels", hints, (v: boolean) => (hints = v)],
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
        "La radio reste sous-titrée. Une voix française locale est utilisée si elle est disponible ; sinon le bulletin est présenté en texte.",
      );
    } else if (mode === "title") {
      paragraph("PHYSIQUE APPLIQUÉE");
      paragraph(
        "Trois affectations. Deux cours à assurer pour garder votre poste.",
      );
      paragraph(
        "Attendez l’ordre en voiture, rejoignez le collège puis trouvez la salle 42C. Dès la notification, un même délai couvre la route et le collège. L’arrivée automatique ne vous coûte pas de temps.",
      );
      paragraph(
        "Clavier : ZQSD ou flèches · ESPACE · F/X. Souris et tactile : interactions directement dans la scène. Paysage conseillé sur téléphone.",
      );
    } else if (mode === "report") {
      paragraph(
        `${s.won} cours assuré${s.won > 1 ? "s" : ""} sur 3 — minimum exigé : 2.`,
      );
      const list = document.createElement("ol");
      s.results.forEach((result, i) => {
        const item = document.createElement("li");
        item.textContent = ["08:00", "12:00", "17:00"][i] + " — " + result;
        list.append(item);
      });
      root.append(list);
      paragraph(
        s.won >= 2
          ? "Le service a tenu. Les moyens sont donc déclarés suffisants."
          : "Les contraintes matérielles ne sauraient, selon le rapport, excuser les carences.",
      );
    } else {
      paragraph(
        s.pauseReason
          ? "La partie est suspendue. Reprenez quand vous êtes prêt."
          : "Le délai est arrêté. Soufflez un instant.",
      );
      paragraph(DAY_BRIEFS[Math.min(2, s.mission)]);
    }
    const actions = document.createElement("div");
    actions.className = "player-actions";
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
      actions.append(
        button(
          mode === "title"
            ? "Prendre le service"
            : mode === "report"
              ? "Nouvelle journée"
              : "Reprendre",
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
    heading.focus({ preventScroll: true });
  }
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.repeat) return;
      const editable = (event.target as HTMLElement)?.matches(
        "input,select,button",
      );
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
        event.key === "Enter" &&
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
