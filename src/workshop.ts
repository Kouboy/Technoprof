import Phaser from "phaser";
import { DRIVE, trafficWidth, roadProjection } from "./driving";
import {
  BOSS,
  GUARD,
  PARENT,
  STUDENT,
  PLAY,
  combatProfile,
  enemyPhase,
} from "./gameplay";
import type { Enemy } from "./world";
import type { SessionLog } from "./session-log";

type Host = {
  phase: string;
  room: number;
  age: number;
  remaining: number;
  px: number;
  py: number;
  face: number;
  attack: number;
  playerRecovery: number;
  falling: number;
  inv: number;
  impact: number;
  impactX: number;
  impactY: number;
  encounterTime: number;
  roomTransition?: { target: number; age: number } | null;
  bossIntro: number;
  enemies: Enemy[];
  car: number;
  travel: number;
  speed: number;
  obstacles: { z: number; x: number; type: number }[];
  g: Phaser.GameObjects.Graphics;
  session: SessionLog;
  seed: number;
  collisions: number;
  punches: number;
  results: string[];
  paused: boolean;
  pauseReason: string;
  debugOverlay: boolean;
  workshopSpeed: number;
  workshopStep: boolean;
  workshopScenario: string;
  queuedAttack: boolean;
  comicWords: boolean;
  navigationGain: 1 | 2;
  navigationStartHp: number;
  recoveryScene?: { active: boolean; state: string };
  loadScenario(name: string): void;
  setPaused(value: boolean): void;
  floorGaps(): number[][];
  combatProfile?(): ReturnType<typeof combatProfile>;
  bendDirection(distance?: number): number;
  setWorkshopFocus(focused: boolean): void;
  unlockAudio(): void;
  journalSnapshot(): unknown;
  exportJournal(): void;
};
const SCENARIOS: Record<string, string> = {
  "bruel-navigation-a3": "Bruel A3 / combats plus vifs",
  "bruel-navigation-a3-road": "Bruel A3 / route puis réseau",
  "bruel-navigation-a3-care": "Bruel A3 / jonction et soins",
  "bruel-navigation-a3-parent": "Bruel A3 / Parent influent",
  "bruel-navigation-a2": "Bruel A2 / découverte du réseau",
  "bruel-navigation-a2-road": "Bruel A2 / route puis réseau",
  "bruel-navigation-a2-care": "Bruel A2 / hall et soins",
  "bruel-navigation": "Bruel A1 / découverte (comparaison)",
  "bruel-navigation-road": "Bruel A1 / route puis réseau",
  "bruel-navigation-care": "Bruel A1 / hall et soins",
  "hanouna-quiet": "Matin / liaison sans combat",
  "hanouna-quiet-class": "Matin / classe vide",
  "hanouna-quiet-hall": "Matin / hall",
  "bruel-quiet-class": "Midi / classe vide",
  "bruel-quiet-hall": "Midi / hall",
  "pro-quiet-class": "Crépuscule / classe vide",
  "pro-quiet-hall": "Crépuscule / hall",
  "bruel-workload": "Midi / ailes supplémentaires",
  "bruel-workload-dialogue": "Midi / nouvelle rencontre",
  "pro-workload": "Crépuscule / ailes supplémentaires",
  "pro-workload-dialogue": "Crépuscule / nouvelle rencontre",
  "pro-workload-end": "Crépuscule / fin de parcours",
  mission: "Première affectation / parcours complet",
  road: "Route / trafic reproductible",
  "road-slow": "Conduite / 40 km/h",
  "road-fast": "Conduite / 260 km/h",
  "road-brake": "Freinage / véhicule lent",
  "road-edge": "Accotement / perte d'adhérence",
  parent: "Parent / présentation",
  "bruel-drive": "Bruel / affectation complète",
  "bruel-cour": "Bruel / cour et parcours",
  "bruel-arrival": "Bruel / arrivée",
  "pro-arrival": "Lycée pro / arrivée",
  "bruel-boss": "Bruel / parent influent",
  "pro-drive": "Lycée pro / affectation complète",
  "pro-cour": "Lycée pro / parvis et parcours",
  "pro-boss": "Lycée pro / responsable sécurité",
  "bruel-shove": "Parent au téléphone / poussée",
  "bruel-rush": "Parent influent / ruée",
  "pro-throw": "Élève majeur / lancer",
  "pro-push": "Responsable sécurité / poussée",
  student: "Élève / présentation",
  guard: "Vigile / présentation",
  boss: "Inspectrice / confrontation",
  sweep: "Inspectrice / balayage",
  gap: "Trous / aller-retour",
  stairs: "Transitions / escalier ↔ couloir",
  passages: "Passages / cour ↔ hall",
  arrival: "Arrivée / transition",
  hit: "Livre / contact",
  whiff: "Livre / dans le vide",
  "hit-left": "Livre / contact vers la gauche",
  "block-left": "Livre / garde vers la gauche",
  "hurt-left": "Coup reçu / autre côté",
  "defeat-parent": "Défaite / parent",
  "defeat-student": "Défaite / élève",
  "defeat-guard": "Défaite / vigile",
  block: "Livre / garde",
  hurt: "Coup reçu",
  success: "Dernier coup / entrée en classe",
  late: "Échec / retard",
  exhausted: "Échec / épuisement",
  breakdown: "Échec / panne",
};
let status: HTMLElement | null = null;
let lastStatus = "";
let measurements: HTMLPreElement | null = null;
let lastMeasurementAt = 0;
function refreshMeasurements(s: Host) {
  if (!measurements || measurements.hidden) return;
  lastMeasurementAt = performance.now();
  measurements.textContent = JSON.stringify(
    s.journalSnapshot(),
    (key, value) => (key === "events" ? undefined : value),
    2,
  );
}
export function installWorkshop(s: Host) {
  const root = document.getElementById("workshop");
  if (!root) return;
  root.hidden = false;
  root.innerHTML = "";
  const heading = document.createElement("strong");
  heading.textContent = "ATELIER 0.61 — scénarios animés";
  root.append(heading);
  const controls = document.createElement("div");
  controls.className = "workshop-controls";
  root.append(controls);
  controls.addEventListener("focusin", (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== "BUTTON") s.setWorkshopFocus(true);
  });
  controls.addEventListener("focusout", (event) => {
    if (!controls.contains(event.relatedTarget as Node | null))
      s.setWorkshopFocus(false);
  });
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Scénario");
  for (const [value, label] of Object.entries(SCENARIOS)) {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = label;
    select.append(o);
  }
  select.value = s.workshopScenario in SCENARIOS ? s.workshopScenario : "road";
  controls.append(select);
  const seedLabel = document.createElement("label");
  seedLabel.textContent = "Seed ";
  const seed = document.createElement("input");
  seed.type = "number";
  seed.min = "1";
  seed.max = "4294967295";
  seed.value = String(s.seed);
  seed.setAttribute("aria-label", "Seed du trafic");
  seedLabel.append(seed);
  controls.append(seedLabel);
  const button = (label: string, callback: () => void) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.onclick = () => {
      s.unlockAudio();
      callback();
      b.blur();
    };
    controls.append(b);
    return b;
  };
  const reset = () => {
    s.seed = Number(seed.value) >>> 0 || 4301;
    seed.value = String(s.seed);
    s.loadScenario(select.value);
  };
  const careSettings = document.createElement("div");
  careSettings.className = "workshop-controls";
  const gainLabel = document.createElement("label");
  gainLabel.textContent = "Soin du prototype ";
  const gain = document.createElement("select");
  gain.setAttribute("aria-label", "Gain du soin Bruel");
  for (const value of [1, 2]) {
    const o = document.createElement("option");
    o.value = String(value);
    o.textContent = `+${value} PV`;
    gain.append(o);
  }
  gain.value = String(s.navigationGain);
  gainLabel.append(gain);
  careSettings.append(gainLabel);
  const hpLabel = document.createElement("label");
  hpLabel.textContent = "PV de départ (hors route) ";
  const hp = document.createElement("select");
  hp.setAttribute("aria-label", "PV de départ Bruel");
  for (const value of [5, 4, 3, 2, 1]) {
    const o = document.createElement("option");
    o.value = String(value);
    o.textContent = String(value);
    hp.append(o);
  }
  hp.value = String(s.navigationStartHp);
  hpLabel.append(hp);
  careSettings.append(hpLabel);
  const navigationNote = document.createElement("p");
  navigationNote.textContent =
    "BRUEL / A3 : l’infirmière accueille le professeur dès l’entrée. F/X ou toucher : afficher puis avancer les répliques. Soin complet, délai suspendu et sortie automatique ; une visite par affectation. Le Parent influent reprend sa garde après deux coups. A1/A2 conservent le soin partiel pour comparaison.";
  careSettings.append(navigationNote);
  root.append(careSettings);
  careSettings.addEventListener("focusin", () => s.setWorkshopFocus(true));
  careSettings.addEventListener("focusout", (event) => {
    if (!careSettings.contains(event.relatedTarget as Node | null))
      s.setWorkshopFocus(false);
  });
  const updateCareSettings = () => {
    careSettings.hidden = !select.value.startsWith("bruel-navigation");
    const a3 = select.value.startsWith("bruel-navigation-a3");
    gainLabel.hidden = a3;
    navigationNote.textContent = a3
      ? "BRUEL / A3 : l’infirmière accueille le professeur dès l’entrée. F/X ou toucher : afficher puis avancer les répliques. Soin complet, délai suspendu et sortie automatique ; une visite par affectation. Le Parent influent reprend sa garde après deux coups."
      : "BRUEL / A1-A2 : approcher l’armoire, F/X ou toucher pour le soin partiel +1/+2. Délai actif pendant le soin ; un usage par affectation. Changer le soin ou les PV relance cet essai.";
  };
  updateCareSettings();
  gain.onchange = () => {
    s.navigationGain = Number(gain.value) as 1 | 2;
    reset();
    gain.blur();
  };
  hp.onchange = () => {
    s.navigationStartHp = Number(hp.value);
    reset();
    hp.blur();
  };
  select.onchange = () => {
    updateCareSettings();
    reset();
    select.blur();
  };
  button("Rejouer", reset);
  button("Pause / reprendre", () => s.setPaused(!s.paused));
  button("Un pas (20 ms)", () => {
    s.setPaused(true);
    s.workshopStep = true;
  });
  button("Action / dialogue (X)", () => {
    s.queuedAttack = true;
    if (s.paused) s.workshopStep = true;
  });
  const speed = document.createElement("select");
  speed.setAttribute("aria-label", "Vitesse de simulation");
  for (const [value, label] of [
    [1, "Vitesse normale"],
    [0.5, "Ralenti ×0,5"],
    [0.25, "Ralenti ×0,25"],
  ] as const) {
    const o = document.createElement("option");
    o.value = String(value);
    o.textContent = label;
    speed.append(o);
  }
  speed.onchange = () => {
    s.workshopSpeed = Number(speed.value);
    speed.blur();
  };
  controls.append(speed);
  const overlayLabel = document.createElement("label");
  const overlay = document.createElement("input");
  overlay.type = "checkbox";
  overlay.checked = s.debugOverlay;
  overlay.onchange = () => {
    s.debugOverlay = overlay.checked;
  };
  overlayLabel.append(overlay, " Collisions et portées");
  controls.append(overlayLabel);
  const wordsLabel = document.createElement("label");
  const words = document.createElement("input");
  words.type = "checkbox";
  words.checked = s.comicWords;
  words.onchange = () => {
    s.comicWords = words.checked;
    words.blur();
  };
  wordsLabel.append(words, " Onomatopées");
  controls.append(wordsLabel);
  button("Exporter le journal", () => s.exportJournal());
  measurements = document.createElement("pre");
  measurements.hidden = true;
  measurements.setAttribute("aria-label", "Mesures de cet essai");
  button("Mesures de cet essai", () => {
    measurements!.hidden = !measurements!.hidden;
    refreshMeasurements(s);
  });
  root.append(measurements);
  const note = document.createElement("p");
  note.textContent =
    "Commandes du jeu conservées. Les coups et échecs passent par les vraies règles. En succès : frapper puis marcher à la porte et presser ↑. Cyan : corps/pieds ; ambre : livre ; rouge : portée adverse ou trou. Sur route : largeur de caisse et limites de chaussée, avec la même projection que le jeu.";
  root.append(note);
  status = document.createElement("pre");
  status.setAttribute("aria-label", "État de la simulation");
  root.append(status);
}
export function drawWorkshop(s: Host) {
  if (
    measurements &&
    !measurements.hidden &&
    performance.now() - lastMeasurementAt >= 1000
  )
    refreshMeasurements(s);
  const profile = s.combatProfile?.() ?? combatProfile(s.room);
  const player = s.roomTransition
    ? "TRANSITION → " + s.roomTransition.target
    : s.recoveryScene?.active
      ? "INFIRMERIE / " + s.recoveryScene.state
      : s.phase === "school" && s.encounterTime > 0
        ? "DIALOGUE"
        : s.falling > 0
          ? "CHUTE"
          : s.playerRecovery > 0
            ? "TOUCHE"
            : s.py < PLAY.floor
              ? "SAUT"
              : s.attack > 0
                ? "FRAPPE"
                : "LIBRE";
  const seconds = Object.entries(s.session.phaseSeconds)
    .map(([name, t]) => `${name} ${t.toFixed(1)}s`)
    .join(" · ");
  const lastEvent = s.session.events.at(-1);
  const stall =
    lastEvent?.kind === "long-frame-pause"
      ? ` (${Math.round((lastEvent.data as { ms: number }).ms)} ms)`
      : "";
  const text =
    `${s.paused ? "PAUSE — " : ""}${s.phase} / pièce ${s.room} / joueur ${player} / délai ${s.remaining.toFixed(2)}s\n` +
    s.enemies
      .map(
        (e) =>
          `Adversaire : ${s.phase === "school" ? enemyPhase(e, s.encounterTime > 0) : "figé"} · PV ${e.hp} · prép. ${e.wind.toFixed(2)} · reprise ${e.recovery.toFixed(2)} · touché ${e.stun.toFixed(2)}${e.parentCycle ? " · cycle " + e.parentCycle.phase + " / " + e.parentCycle.hits + " coups" : ""}`,
      )
      .join("\n") +
    `\nTemps simulé ${s.session.elapsed.toFixed(1)}s / ${s.collisions} chocs / ${s.session.falls} chutes / ${s.punches} coups réussis\n${seconds}` +
    `\nDernier événement : ${lastEvent?.kind ?? "—"}${stall}` +
    (s.paused && s.pauseReason ? `\n${s.pauseReason} — reprendre avec P` : "");
  if (status && text !== lastStatus) {
    status.textContent = text;
    lastStatus = text;
  }
  if (!s.debugOverlay) return;
  const g = s.g;
  if (["road", "free", "receive"].includes(s.phase)) {
    g.lineStyle(0.8, 0x7cd7df);
    g.strokeRect(
      160 + s.car * DRIVE.lanePixels - DRIVE.playerWidth / 2,
      159,
      DRIVE.playerWidth,
      11,
    );
    for (const side of [-1, 1]) {
      g.lineStyle(0.8, 0xe5ae60);
      g.lineBetween(
        160 + side * DRIVE.roadHalfPixels,
        155,
        160 + side * DRIVE.roadHalfPixels,
        175,
      );
    }
    for (const o of s.obstacles) {
      const d = o.z - s.travel;
      if (d < 0 || d > DRIVE.visibleDistance) continue;
      const { scale, x, y } = roadProjection(s.travel, d, o.x);
      const width = (trafficWidth(o.type) / 2) * scale;
      g.lineStyle(0.8, 0xea7770);
      g.strokeRect(x - width, y - 3, width * 2, 6);
    }
    return;
  }
  if (s.phase !== "school") return;
  g.lineStyle(0.6, 0x7cd7df, 0.7);
  g.lineBetween(7, PLAY.floor, 313, PLAY.floor);
  g.strokeRect(s.px - profile.bodyGap / 2, s.py - 36, profile.bodyGap, 36);
  g.lineStyle(1, 0xe5ae60);
  g.lineBetween(
    s.px,
    s.py - profile.contactY,
    s.px + s.face * profile.bookReach,
    s.py - profile.contactY,
  );
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    g.lineStyle(0.8, 0x7cd7df);
    g.strokeRect(e.x - profile.bodyGap / 2, 123, profile.bodyGap, 36);
    const reach = e.boss
      ? e.pattern % 2 === 0
        ? BOSS.sweepReach
        : BOSS.stampReach
      : e.parent
        ? PARENT.reach
        : s.room === 3
          ? STUDENT.reach
          : GUARD.reach;
    const face =
      Math.sign(e.facing ?? e.chargeDir ?? 0) || (s.px < e.x ? -1 : 1);
    g.lineStyle(1, 0xea7770);
    g.lineBetween(e.x, 130, e.x + face * reach, 130);
  }
  for (const [left, right] of s.floorGaps()) {
    g.lineStyle(1, 0xea7770);
    g.strokeRect(left, 159, right - left, 15);
  }
  if (s.impact > 0) {
    g.lineStyle(1.2, 0xffffff);
    g.lineBetween(s.impactX - 3, s.impactY, s.impactX + 3, s.impactY);
    g.lineBetween(s.impactX, s.impactY - 3, s.impactX, s.impactY + 3);
  }
}
