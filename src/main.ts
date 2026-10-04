import {
  missionSpec,
  roomSpec,
  missionPassages,
  missionEnemies,
} from "./missions";
import { NewSchoolArt } from "./new-school-art";
import {
  BRUEL_NAV,
  BRUEL_NAV_A2,
  BRUEL_NAV_A3,
  NAV_ID,
  NAV_CARE,
  NavigationCare,
  NavigationMetrics,
} from "./bruel-navigation";
import { BruelNavigationArt } from "./bruel-navigation-art";
import {
  INFIRMARY,
  InfirmaryRecovery,
  PARENT_CYCLE,
  parentCycle,
} from "./bruel-recovery";
import { ActionInput, BINDINGS } from "./controls";
import { DirectInput, installDirectInput } from "./direct-input";
import { drawComicFX } from "./comic-fx";
import {
  installPlayerExperience,
  resultLine,
  RADIO_BULLETINS,
  RADIO_NAME,
} from "./player-experience";
import {
  VIEW,
  daylight,
  drawSurround,
  drawContactShadow,
  drawRoadWear,
  drawSchoolWear,
  installPresentation,
} from "./presentation";
import {
  PLAY,
  BOSS,
  PARENT,
  GUARD,
  STUDENT,
  SECURITY,
  THROWER,
  FILMER,
  enemyTuning,
  combatProfile,
  terminalReason,
  FAILURE_LABELS,
  SeededRandom,
  type FailureReason,
} from "./gameplay";
import { SessionLog, RuntimeLog } from "./session-log";
import { installWorkshop, drawWorkshop } from "./workshop";
import { drawPassageHints } from "./passage-hints";
import { ENCOUNTER_SECONDS } from "./world";
import {
  DIALOGUE,
  advanceDialogue,
  dialogueLength,
  dialogueLetters,
  type DialogueState,
} from "./dialogue";
import { SchoolProps, drawDialogue } from "./school-props";
import { BLOCKED_EDGES, walkBounds, recoveryBank } from "./world";
import { drawCadre, bitmap, bitmapWidth } from "./cadre";
import { WingArt } from "./wing-art";
import { BridgeArt } from "./bridge-art";
import { SERVICE_DATA } from "./service-data";
import { TECHNICAL_DATA } from "./technical-data";
import { CENTRAL_DATA } from "./central-data";
import { STAIR_DATA } from "./stair-data";
import { HallArt } from "./hall-art";
import { COURT_DATA } from "./court-data";
import { ARRIVAL_DATA } from "./arrival-data";
import {
  RoadArt,
  districtAnchors,
  openAddress,
  vergeZone,
  type Scenery,
  ROAD_VIEWS,
} from "./road-art";
import { drawRoadBridge, roadsideProjection } from "./road-structures";
import { CarArt } from "./car-art";
import { SliceArt } from "./slice-art";
import Phaser from "phaser";
import {
  DRIVE,
  trafficCue,
  TRAFFIC,
  trafficWidth,
  trafficSpeed,
  contactWidth,
  shoulderAmount,
  shoulderDrag,
  roadProjection,
  type Traffic,
} from "./driving";
import {
  TUNING,
  ROOM_NAMES,
  roomPassages,
  withinPassage,
  makeEnemies,
  type Enemy,
} from "./world";
import { AudioKit } from "./audio";
class Game extends Phaser.Scene {
  failureReason: FailureReason | null = null;
  playerRecovery = 0;
  playerHitDirection = -1;
  bookBlocked = 0;
  attackBuffer = 0;
  reducedShake = false;
  comicWords = true;
  groundContact?: Phaser.GameObjects.Graphics;
  roadWash?: Phaser.GameObjects.Graphics;
  schoolWear?: Phaser.GameObjects.Graphics;
  sceneSurround?: Phaser.GameObjects.Graphics;
  presentationHideHud = false;
  syncPlayerUI?: () => void;
  direct?: DirectInput;
  controls?: ActionInput;
  pointerMode = false;
  physicalKeys?: Record<string, Phaser.Input.Keyboard.Key>;
  playerMenu = false;
  roomEnteredAt = 0;
  seed = 4301;
  random = new SeededRandom();
  session = new SessionLog();
  runtime = new RuntimeLog();
  workshop = false;
  debugOverlay = false;
  workshopSpeed = 1;
  workshopStep = false;
  workshopScenario = "road";
  substepping = false;
  queuedAttack = false;
  lastLoggedPhase = "";
  art?: SliceArt;
  schoolProps?: SchoolProps;
  newSchoolArt?: NewSchoolArt;
  projectiles: { x: number; dir: number; life: number }[] = [];
  navigationProfile = false;
  navigationRevision: "A1" | "A2" | "A3" = "A1";
  navigationGain: 1 | 2 = 1;
  navigationStartHp = 5;
  navigationCare = new NavigationCare();
  recoveryScene = new InfirmaryRecovery();
  navigationMetrics = new NavigationMetrics();
  navigationArt?: BruelNavigationArt;
  navigationSpec() {
    return this.workshop && this.navigationProfile
      ? this.navigationRevision === "A3"
        ? BRUEL_NAV_A3
        : this.navigationRevision === "A2"
          ? BRUEL_NAV_A2
          : BRUEL_NAV
      : undefined;
  }
  missionSpec() {
    return this.navigationSpec() ?? missionSpec(this.mission);
  }
  pressureCombat() {
    return this.navigationSpec() === BRUEL_NAV_A3;
  }
  enemyTuning() {
    return enemyTuning(this.pressureCombat());
  }
  enemyAttack(e: Enemy, stage: "windup" | "release") {
    if (this.pressureCombat())
      this.session.record("enemy-attack", this.mission, this.room, {
        role: e.role ?? this.roomSpec()?.role,
        stage,
        x: e.x,
        facing: e.facing,
        playerX: this.px,
      });
  }
  roomSpec() {
    return roomSpec(this.mission, this.room, this.navigationSpec());
  }
  encounter() {
    return this.roomSpec()?.encounter;
  }
  combatProfile() {
    return combatProfile(this.room, this.roomSpec()?.role);
  }
  movementBounds() {
    const blocked = this.roomSpec()?.blocked ?? [];
    return {
      min: blocked.includes("left") ? 42 : 10,
      max: blocked.includes("right") ? 278 : 302,
    };
  }
  usesNewSchoolArt() {
    return (
      !!this.newSchoolArt &&
      this.room >= 10 &&
      !this.brokenRoad &&
      ["school", "opening", "fail"].includes(this.phase)
    );
  }
  technicalBackdrop?: Phaser.GameObjects.Image;
  usesTechnicalArt() {
    return (
      !!this.technicalBackdrop &&
      this.room === 8 &&
      ["school", "fail"].includes(this.phase) &&
      !this.brokenRoad
    );
  }
  technicalGaps = [
    [95, 128],
    [190, 223],
  ];
  serviceBackdrop?: Phaser.GameObjects.Image;
  usesServiceArt() {
    return (
      !!this.serviceBackdrop &&
      this.room === 7 &&
      ["school", "fail"].includes(this.phase) &&
      !this.brokenRoad
    );
  }
  centralBackdrop?: Phaser.GameObjects.Image;
  usesCentralArt() {
    return (
      !!this.centralBackdrop &&
      this.room === 2 &&
      ["school", "fail"].includes(this.phase) &&
      !this.brokenRoad
    );
  }
  stairBackdrop?: Phaser.GameObjects.Image;
  usesStairArt() {
    return (
      !!this.stairBackdrop &&
      this.room === 5 &&
      ["school", "fail"].includes(this.phase) &&
      !this.brokenRoad
    );
  }
  wingArt?: WingArt;
  usesWingArt() {
    return (
      !!this.wingArt &&
      this.room === 3 &&
      ["school", "fail"].includes(this.phase) &&
      !this.brokenRoad
    );
  }
  bridgeArt?: BridgeArt;
  usesBridgeArt() {
    return (
      !!this.bridgeArt &&
      this.room === 6 &&
      ["school", "fail"].includes(this.phase) &&
      !this.brokenRoad
    );
  }
  hallArt?: HallArt;
  usesHallArt() {
    return (
      !!this.hallArt &&
      this.room === 1 &&
      ["school", "fail"].includes(this.phase) &&
      !this.brokenRoad
    );
  }
  courtBackdrop?: Phaser.GameObjects.Image;
  usesCourtArt() {
    return (
      !!this.courtBackdrop &&
      this.room === 0 &&
      ["school", "fail"].includes(this.phase) &&
      !this.brokenRoad
    );
  }
  arrivalBackdrop?: Phaser.GameObjects.Image;
  arrivalGate?: Phaser.GameObjects.Graphics;
  carArt?: CarArt;
  roadArt?: RoadArt;
  sceneGraphics?: Phaser.GameObjects.Graphics;
  foreground?: Phaser.GameObjects.Graphics;
  sceneFade?: Phaser.GameObjects.Graphics;
  cadreReview = false;
  artReview = -1;
  arrivalStill = false;
  reviewFacing = 1;
  preload() {
    this.runtime.mark("preload");
    this.audio.prepare();
    SliceArt.preload(this);
    NewSchoolArt.preload(this);
    SchoolProps.preload(this);
    HallArt.preload(this);
    BridgeArt.preload(this);
    WingArt.preload(this);
    BruelNavigationArt.preload(this);
    this.load.image("service-stair", SERVICE_DATA);
    this.load.image("technical", TECHNICAL_DATA);
    this.load.image("central-stair", CENTRAL_DATA);
    this.load.image("annex-stair", STAIR_DATA);
    this.load.image("courtyard", COURT_DATA);
    this.load.image("arrival-college", ARRIVAL_DATA);
    CarArt.preload(this);
    RoadArt.preload(this);
  }
  usesSliceArt() {
    return (
      !!this.art &&
      this.room === 4 &&
      ["school", "opening", "fail"].includes(this.phase) &&
      !this.brokenRoad
    );
  }
  ambienceClock = 0;
  arrivalAlert = false;
  skidClock = 0;
  rattleClock = 0;
  tireMarks: { x: number; y: number; life: number }[] = [];
  radioLines = RADIO_BULLETINS.map((text) => RADIO_NAME + ". " + text);
  falling = 0;
  fallReturn = 25;
  lastGroundX = 25;
  floorGaps() {
    return this.roomSpec()?.gaps ?? [];
  }
  drawingEncounter = false;
  encounterTime = 0;
  dialogue: DialogueState = { page: 0, characters: 0 };
  vehicle = 100;
  crashPush = 0;
  hitStop = 0;
  brokenRoad = false;
  boardMessage = "";
  messageTime = 0;
  kilometers = 0;
  collisions = 0;
  punches = 0;
  shortcuts = 0;
  particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: number;
  }[] = [];
  audio = new AudioKit();
  bossIntro = 0;
  walkClock = 0;
  stepClock = 0;
  impact = 0;
  impactX = 0;
  impactY = 132;
  impactKind = "hit";
  openingFrom = 280;
  attackHit = false;
  schoolFade = 0;
  roomTransition: {
    target: number;
    spawn: number;
    age: number;
    swapped: boolean;
  } | null = null;
  exitHeld = false;
  dialogueSoundWait = 0;
  roomEnemies = new Map<number, Enemy[]>();
  g!: Phaser.GameObjects.Graphics;
  labels: Phaser.GameObjects.Text[] = [];
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  steerVelocity = 0;
  parkFrom = 0;
  parkSpeed = 0;
  freshKey = false;
  returnFade = 0;
  notified = false;
  interactLock = 0;
  trafficHit = 0;
  room = 0;
  travel = 0;
  arena = false;
  cleared = new Set<number>();
  phase = "title";
  age = 0;
  mission = 0;
  won = 0;
  remaining = 90;
  paused = false;
  pauseReason = "";
  speed = 0;
  road = 0;
  car = 0;
  px = 30;
  py = 159;
  vy = 0;
  hp = 5;
  inv = 0;
  attack = 0;
  face = 1;
  cam = 0;
  enemies: Enemy[] = [];
  obstacles: Traffic[] = [];
  trafficIndex = 0;
  shoulder = 0;
  shoulderClock = 0;
  results: string[] = [];
  create() {
    this.runtime.mark("create");
    const shakeOption = document.getElementById(
      "reduced-shake",
    ) as HTMLInputElement | null;
    try {
      this.reducedShake =
        localStorage.getItem("technoprof-reduced-shake") === "true";
    } catch {
      /* The setting still works without local storage. */
    }
    if (shakeOption) {
      shakeOption.checked = this.reducedShake;
      shakeOption.onfocus = () => this.setWorkshopFocus(true);
      shakeOption.onblur = () => this.setWorkshopFocus(false);
      shakeOption.onchange = () => {
        this.reducedShake = shakeOption.checked;
        try {
          localStorage.setItem(
            "technoprof-reduced-shake",
            String(this.reducedShake),
          );
        } catch {
          /* Non-persistent mode. */
        }
        shakeOption.blur();
      };
    }
    this.cameras.main.setZoom(2).setScroll(-160, -120);
    this.g = this.add.graphics().setDepth(3);
    this.art = new SliceArt(this);
    this.schoolProps = new SchoolProps(this);
    this.newSchoolArt = new NewSchoolArt(this);
    this.navigationArt = new BruelNavigationArt(this);
    this.hallArt = new HallArt(this);
    this.bridgeArt = new BridgeArt(this);
    this.wingArt = new WingArt(this);
    const service = this.textures.get("service-stair");
    const serviceImage = service.getSourceImage() as HTMLImageElement;
    service.add(
      "playable",
      0,
      Math.round((serviceImage.width * 100) / 1672),
      Math.round((serviceImage.height * 120) / 941),
      Math.round((serviceImage.width * 1440) / 1672),
      Math.round((serviceImage.height * 627) / 941),
    );
    service.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.serviceBackdrop = this.add
      .image(7, 7, "service-stair", "playable")
      .setOrigin(0)
      .setDisplaySize(306, 168)
      .setDepth(1)
      .setVisible(false);
    const technical = this.textures.get("technical");
    const technicalImage = technical.getSourceImage() as HTMLImageElement;
    technical.add(
      "playable",
      0,
      0,
      0,
      technicalImage.width,
      Math.round(technicalImage.height * 0.75),
    );
    technical.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.technicalBackdrop = this.add
      .image(7, 7, "technical", "playable")
      .setOrigin(0)
      .setDisplaySize(306, 168)
      .setDepth(1)
      .setVisible(false);
    const central = this.textures.get("central-stair");
    const centralImage = central.getSourceImage() as HTMLImageElement;
    central.add(
      "playable",
      0,
      0,
      0,
      centralImage.width,
      Math.round(centralImage.height * 0.75),
    );
    central.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.centralBackdrop = this.add
      .image(7, 7, "central-stair", "playable")
      .setOrigin(0)
      .setDisplaySize(306, 168)
      .setDepth(1)
      .setVisible(false);
    const stair = this.textures.get("annex-stair");
    const stairImage = stair.getSourceImage() as HTMLImageElement;
    stair.add(
      "playable",
      0,
      Math.round((stairImage.width * 50) / 1672),
      Math.round((stairImage.height * 120) / 941),
      Math.round((stairImage.width * 1382) / 1672),
      Math.round((stairImage.height * 627) / 941),
    );
    stair.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.stairBackdrop = this.add
      .image(7, 7, "annex-stair", "playable")
      .setOrigin(0)
      .setDisplaySize(306, 168)
      .setDepth(1)
      .setVisible(false);
    const courtyard = this.textures.get("courtyard");
    const courtSource = courtyard.getSourceImage() as HTMLImageElement;
    // Frame the background so its actual doorway threshold meets y=159.
    courtyard.add(
      "playable",
      0,
      0,
      0,
      courtSource.width,
      Math.round(courtSource.height * 0.802),
    );
    courtyard.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.courtBackdrop = this.add
      .image(7, 7, "courtyard", "playable")
      .setOrigin(0)
      .setDisplaySize(306, 168)
      .setDepth(1)
      .setVisible(false);
    this.textures
      .get("arrival-college")
      .setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.arrivalBackdrop = this.add
      .image(7, 7, "arrival-college")
      .setOrigin(0)
      .setDisplaySize(306, 168)
      .setDepth(3.005)
      .setVisible(false);
    this.arrivalGate = this.add.graphics().setDepth(3.14);
    this.sceneGraphics = this.g;
    this.carArt = new CarArt(this);
    this.roadArt = new RoadArt(this);
    this.releasePreparedSources();
    this.foreground = this.add.graphics().setDepth(3.2);
    this.sceneFade = this.add.graphics().setDepth(4.05);
    this.groundContact = this.add.graphics().setDepth(1.3);
    this.roadWash = this.add.graphics().setDepth(3.095);
    this.schoolWear = this.add.graphics().setDepth(1.7);
    this.sceneSurround = this.add.graphics().setDepth(4.1);
    drawSurround(this.sceneSurround);
    this.physicalKeys = this.input.keyboard!.addKeys(
      Object.values(BINDINGS).flat().join(","),
    ) as typeof this.keys;
    this.controls = new ActionInput();
    this.keys = this.controls.keys as unknown as typeof this.keys;
    this.input.keyboard!.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT"]);
    this.input.keyboard!.on("keydown", this.handleKeyDown, this);
    const focusLost = () => this.pauseForFocusLoss();
    this.game.events.on(Phaser.Core.Events.BLUR, focusLost);
    this.game.events.on(Phaser.Core.Events.HIDDEN, focusLost);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, focusLost);
      this.game.events.off(Phaser.Core.Events.HIDDEN, focusLost);
      this.input.keyboard?.off("keydown", this.handleKeyDown, this);
    });
    const preview =
      new URLSearchParams(location.search).get("essai") ||
      (location.pathname.endsWith("Jouer-Retouches.html")
        ? "retouches"
        : location.pathname.endsWith("Jouer-AileC.html")
          ? "ailec"
          : location.pathname.endsWith("Jouer-Passerelle.html")
            ? "passerelle"
            : location.pathname.endsWith("Jouer-Service.html")
              ? "service"
              : location.pathname.endsWith("Jouer-Technique.html")
                ? "raccourci"
                : location.pathname.endsWith("Jouer-Central.html")
                  ? "central"
                  : location.pathname.endsWith("Jouer-Escaliers.html")
                    ? "escaliers"
                    : location.pathname.endsWith("Jouer-Hall.html")
                      ? "parent"
                      : location.pathname.endsWith("Jouer-Cour.html")
                        ? "cour"
                        : location.pathname.endsWith("Jouer-Arrivee.html")
                          ? "arrivee"
                          : location.pathname.endsWith("Jouer-Salle42C.html")
                            ? "atelier"
                            : null);
    if (preview) {
      this.begin();
      this.notified = true;
      if (preview === "poses") {
        this.school();
        this.enterRoom(4, 80);
        this.schoolFade = 0;
        this.bossIntro = 0;
        this.encounterTime = 0;
        this.artReview = Phaser.Math.Clamp(
          Number(new URLSearchParams(location.search).get("pose")) || 0,
          0,
          7,
        );
        this.reviewFacing =
          new URLSearchParams(location.search).get("flip") === "1" ? -1 : 1;
      } else if (preview === "voiture") {
        this.notified = false;
        this.phase = "free";
        this.speed = 80;
      } else if (preview === "chocs") {
        this.vehicle = 100;
        this.speed = 140;
        this.obstacles = [
          { z: 45, x: 0, type: 1 },
          { z: 300, x: 0, type: 1 },
          { z: 650, x: 0, type: 1 },
        ];
      } else if (preview === "arrivee") {
        this.phase = "arrival";
        this.parkSpeed = 100;
        this.age = 0;
        const instant = new URLSearchParams(location.search).get("instant");
        if (instant !== null) {
          this.age = Phaser.Math.Clamp(Number(instant) || 0, 0, 5.8);
          this.arrivalStill = true;
        }
      } else {
        this.school();
        if (preview === "ailec") this.enterRoom(3, 90);
        if (preview === "passerelle") this.enterRoom(6, 90);
        if (preview === "service") this.enterRoom(7, 100);
        if (preview === "central") this.enterRoom(2, 70);
        if (preview === "parent") this.enterRoom(1, 90);
        if (preview === "escaliers") this.enterRoom(5, 140);
        if (preview === "raccourci") this.enterRoom(8, 25);
        if (["inspecteur", "atelier"].includes(preview)) this.enterRoom(4, 80);
      }
    }
    if (preview === "cadre") {
      this.cadreReview = true;
      this.inv = 0;
      this.phase = "free";
      this.notified = false;
      this.speed = 80;
      this.returnFade = 0;
      this.schoolFade = 0;
      this.bossIntro = 0;
      this.encounterTime = 0;
      this.messageTime = 0;
      this.hp = 4;
      const etat = new URLSearchParams(location.search).get("etat");
      if (etat === "reception") {
        this.phase = "receive";
        this.notified = true;
        this.age = 1.5;
        this.remaining = 239;
      }
      if (etat === "route" || etat === "proximite") {
        this.phase = "road";
        this.notified = true;
        this.speed = 180;
        this.road = etat === "proximite" ? 3450 : 1400;
        this.remaining = 110;
      }
      if (etat === "college" || etat === "urgence") {
        this.enterRoom(3, 90);
        this.phase = "school";
        this.notified = true;
        this.encounterTime = 0;
        this.schoolFade = 0;
        this.remaining = etat === "urgence" ? 19 : 157;
      }
      if (etat === "suspendu") {
        this.phase = "arrival";
        this.notified = true;
        this.remaining = 133;
        this.age = 1;
      }
    }
    if (preview === "chutes") {
      this.begin();
      this.notified = true;
      this.school();
      this.enterRoom(8, 150);
      this.schoolFade = 0;
      this.returnFade = 0;
      this.face = -1;
    }
    if (preview === "retouches") {
      this.cadreReview = true;
      this.notified = true;
      this.remaining = 157;
      this.age = 2;
      this.inv = 0;
      this.schoolFade = 0;
      this.bossIntro = 0;
      this.encounterTime = 0;
      this.messageTime = 0;
      this.returnFade = 0;
      const view = new URLSearchParams(location.search).get("vue") || "hall";
      const rooms: Record<string, number> = {
        hall: 1,
        technique: 8,
        aile: 3,
        central: 2,
        annexe: 5,
        service: 7,
        passerelle: 6,
        inspecteur: 4,
        "inspectrice-tampon": 4,
        "inspectrice-pied": 4,
        "inspectrice-recul": 4,
        chute: 8,
        "fx-coup": 4,
        "fx-garde": 4,
        "fx-recu": 4,
        "fx-alerte": 3,
        "fx-parent": 1,
        "fx-vigile": 6,
      };
      if (view in rooms) {
        this.phase = "school";
        this.enterRoom(rooms[view], 80);
        this.schoolFade = 0;
        this.bossIntro = 0;
        this.inv = 0;
        this.encounterTime = [
          "hall",
          "aile",
          "inspecteur",
          "passerelle",
        ].includes(view)
          ? 8
          : 0;
      }
      if (view.startsWith("inspectrice-")) {
        const e = this.enemies[0];
        e.recovery = view === "inspectrice-recul" ? 0.5 : 1;
        e.pattern = view === "inspectrice-pied" ? 0 : 1;
        e.strikeTime =
          view === "inspectrice-recul"
            ? 0
            : view === "inspectrice-pied"
              ? BOSS.sweepPose
              : BOSS.stampPose;
        e.facing = -1;
      }
      if (view.startsWith("fx-")) {
        this.encounterTime = 0;
        this.bossIntro = 0;
        this.px = 150;
        this.enemies[0].x = this.room === 4 ? 215 : 190;
        if (view === "fx-alerte") this.enemies[0].wind = 0.5;
        else {
          this.attack = view === "fx-recu" ? 0 : 0.25;
          this.impact = 0.28;
          const contact = this.bookContact(this.enemies[0]);
          this.impactX = view === "fx-recu" ? 166 : contact.x;
          this.impactY = view === "fx-recu" ? 106 : contact.y;
          this.impactKind =
            view === "fx-recu" ? "hurt" : view === "fx-garde" ? "block" : "hit";
        }
      }
      if (view === "chute") {
        this.px = 110;
        this.py = 180;
        this.falling = 0.3;
      }
      if (
        [
          "voiture",
          "virage",
          "virage-gauche",
          "frein-droite",
          "proximite",
        ].includes(view)
      ) {
        this.phase = "road";
        this.speed = 148;
        this.road =
          view === "proximite" ? this.missionSpec().meters - 490 : 1200;
        this.travel = 140;
        this.steerVelocity =
          view === "virage-gauche"
            ? -0.6
            : ["virage", "frein-droite"].includes(view)
              ? 0.6
              : 0;
        if (view === "frein-droite") this.keys.DOWN.isDown = true;
      }
      if (view === "parking") {
        this.phase = "arrival";
        this.age = 2.6;
        this.speed = 0;
        this.road = this.missionSpec().meters;
        this.parkSpeed = 0;
      }
    }
    if (preview === "labo") {
      this.workshop = true;
      const query = new URLSearchParams(location.search);
      this.seed = Number(query.get("seed")) >>> 0 || 4301;
      this.loadScenario(query.get("scenario") || "road");
      installWorkshop(this);
    }
    if (preview === "presentation") installPresentation(this);
    if (!preview || preview === "accueil") {
      if (window.matchMedia("(any-pointer: coarse)").matches)
        this.pointerMode = true;
      this.phase = "title";
      this.syncPlayerUI = installPlayerExperience(this);
      if (preview === "accueil") {
        const bar = document.getElementById("pose-controls")!;
        bar.hidden = false;
        for (const won of [2, 1]) {
          const button = document.createElement("button");
          button.textContent = `Aperçu du bilan ${won}/3`;
          button.onclick = () => {
            this.startDay();
            for (let mission = 0; mission < 3; mission++) {
              this.phase = mission === 1 ? "road" : "school";
              this.finish(mission < won, mission === 1 ? "breakdown" : "late");
              this.next();
            }
            this.draw();
          };
          bar.append(button);
        }
      }
    } else document.getElementById("loading")?.setAttribute("hidden", "");
    if (!preview || preview === "accueil" || preview === "labo")
      this.direct = installDirectInput(this);
    this.draw();
    this.runtime.mark("ready");
  }
  refreshLayout() {
    this.scale?.refresh();
  }
  releasePreparedSources() {
    // These source sheets are read only by the constructors above. Drawing uses
    // independent Canvas textures; backgrounds and playable atlases stay alive.
    for (const key of [
      "bruel-enemies",
      "pro-enemies",
      "raw-prof",
      "raw-inspecteur",
      "raw-inspectrice",
      "raw-parent",
      "raw-guard-33",
      "raw-student-34",
      "raw-service",
      "raw-service-right",
      "raw-traffic",
      "raw-district",
      "raw-verge",
      "raw-school-props-36",
      "raw-warnings-37",
    ]) {
      if (!this.textures.exists(key)) continue;
      const image = this.textures.get(key).getSourceImage() as HTMLImageElement;
      this.runtime.releasedSources.count++;
      this.runtime.releasedSources.rgbaBytes += image.width * image.height * 4;
      this.textures.remove(key);
    }
  }
  inkCache = new Map<number, number>();
  ink(c: number) {
    if (c === 0) return 0;
    const known = this.inkCache.get(c);
    if (known !== undefined) return known;
    // Shared pigments for every scene: soot, slate, oxidised steel, tobacco, paper, rust.
    const palette = [
      0x080d13, 0x141e27, 0x24333b, 0x38494c, 0x526064, 0x758080, 0x45443a,
      0x665e4a, 0x928269, 0xb9aa89, 0xe3d4b3, 0x512e32, 0x854538, 0xbf6648,
      0xe5ae60,
    ];
    const r = c >> 16,
      g = (c >> 8) & 255,
      b = c & 255;
    let best = palette[0],
      distance = Infinity;
    for (const p of palette) {
      const d =
        2 * (r - (p >> 16)) ** 2 +
        3 * (g - ((p >> 8) & 255)) ** 2 +
        (b - (p & 255)) ** 2;
      if (d < distance) {
        distance = d;
        best = p;
      }
    }
    this.inkCache.set(c, best);
    return best;
  }
  shape(points: number[], color: number, alpha = 1) {
    this.g.fillStyle(this.ink(color), alpha);
    this.g.beginPath();
    this.g.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2)
      this.g.lineTo(points[i], points[i + 1]);
    this.g.closePath();
    this.g.fillPath();
  }
  hatch(
    x: number,
    y: number,
    w: number,
    h: number,
    color = 0x080d13,
    spacing = 5,
  ) {
    this.g.lineStyle(0.5, this.ink(color), 0.45);
    for (let i = 0; i < w; i += spacing)
      this.g.lineBetween(x + i, y, x + Math.min(w, i + 5), y + Math.min(h, 8));
  }
  rearCar(
    x: number,
    y: number,
    w: number,
    h: number,
    paint: number,
    lean = 0,
    service = false,
  ) {
    const poly = (pts: number[], c: number) =>
      this.shape(
        pts.map((v, i) => (i % 2 ? y + v * h : x + v * w + (v < 0 ? lean : 0))),
        c,
      );
    for (const side of [-1, 1]) {
      this.rect(
        x + side * w * 0.46 - w * 0.07,
        y - h * 0.24,
        w * 0.14,
        h * 0.26,
        0x080d13,
      );
      this.rect(
        x + side * w * 0.46 - w * 0.025,
        y - h * 0.2,
        w * 0.045,
        h * 0.19,
        0x38494c,
      );
    }
    poly(
      [
        -0.55, 0, -0.52, -0.38, -0.35, -0.91, -0.23, -1, 0.27, -1, 0.38, -0.86,
        0.53, -0.35, 0.54, 0,
      ],
      0x080d13,
    );
    poly(
      [
        -0.46, -0.12, -0.46, -0.44, -0.31, -0.87, 0.3, -0.87, 0.46, -0.43, 0.47,
        -0.12,
      ],
      paint,
    );
    poly([-0.31, -0.86, -0.24, -0.96, 0.25, -0.96, 0.32, -0.85], 0xb9aa89);
    poly([-0.3, -0.81, 0.29, -0.81, 0.37, -0.5, -0.37, -0.5], 0x141e27);
    poly([-0.26, -0.78, -0.1, -0.78, -0.28, -0.54, -0.34, -0.54], 0x526064);
    poly([-0.44, -0.43, 0.44, -0.43, 0.48, -0.33, -0.46, -0.33], 0x928269);
    poly([0.38, -0.43, 0.48, -0.35, 0.47, -0.12, 0.35, -0.12], 0x45443a);
    this.rect(x - w * 0.44, y - h * 0.23, w * 0.19, h * 0.07, 0xbf6648);
    this.rect(x + w * 0.25, y - h * 0.23, w * 0.19, h * 0.07, 0xbf6648);
    this.rect(x - w * 0.46, y - h * 0.11, w * 0.92, h * 0.045, 0x758080);
    this.rect(x - w * 0.13, y - h * 0.19, w * 0.26, h * 0.055, 0xe3d4b3);
    if (service) {
      this.hatch(x - w * 0.35, y - h * 0.3, w * 0.36, h * 0.1);
      this.rect(x - w * 0.3, y - h * 0.75, w * 0.6, 1, 0x758080);
      this.shape(
        [
          x - w * 0.22,
          y - h * 0.61,
          x + w * 0.18,
          y - h * 0.68,
          x + w * 0.2,
          y - h * 0.66,
          x - w * 0.2,
          y - h * 0.59,
        ],
        0x080d13,
      );
      this.rect(x - w * 0.07, y - h * 0.56, w * 0.14, 1, 0x080d13);
      this.rect(x - w * 0.36, y - h * 0.28, w * 0.16, h * 0.06, 0x854538);
      this.rect(x + w * 0.32, y - h * 0.36, w * 0.09, h * 0.13, 0x665e4a);
      this.rect(x - w * 0.46, y - h * 0.12, w * 0.25, h * 0.055, 0xb9aa89);
      this.rect(x + w * 0.24, y - h * 0.11, w * 0.22, h * 0.06, 0x665e4a);
      this.rect(x + w * 0.09, y - h * 0.38, w * 0.2, h * 0.1, 0xe3d4b3);
      this.rect(x + w * 0.11, y - h * 0.36, w * 0.14, 1, 0x24333b);
      this.rect(x - w * 0.3, y - h * 1.13, 1, h * 0.18, 0x080d13);
      this.rect(x - w * 0.56, y - h * 0.51, w * 0.11, h * 0.055, 0x080d13);
      this.rect(x + w * 0.46, y - h * 0.48, w * 0.1, h * 0.06, 0x665e4a);
    } else {
      this.rect(x - w * 0.39, y - h * 0.25, w * 0.78, h * 0.025, 0xbf6648);
      this.rect(x - w * 0.24, y - h * 0.8, w * 0.44, h * 0.025, 0xb9aa89);
      this.rect(x - w * 0.035, y - h * 0.36, w * 0.07, h * 0.04, 0x758080);
    }
  }
  sceneInk() {
    if (
      this.usesNewSchoolArt() ||
      this.usesSliceArt() ||
      this.usesCourtArt() ||
      this.usesHallArt() ||
      this.usesStairArt() ||
      this.usesCentralArt() ||
      this.usesTechnicalArt() ||
      this.usesServiceArt() ||
      this.usesBridgeArt() ||
      this.usesWingArt() ||
      (this.roadArt && ["free", "road", "receive", "tow"].includes(this.phase))
    )
      return;
    // Edge shadow stays outside the playable floor and does not touch text or the CADRE.
    this.shape([7, 24, 21, 24, 13, 149, 7, 158], 0x080d13, 0.55);
    this.shape([303, 24, 313, 24, 313, 158, 308, 149], 0x080d13, 0.55);
    if (["school", "opening"].includes(this.phase)) {
      this.shape([7, 24, 313, 24, 313, 29, 7, 33], 0x080d13);
      this.hatch(8, 34, 303, 12, 0x080d13, 7);
    }
  }
  rect(x: number, y: number, w: number, h: number, c: number) {
    c = this.ink(c);
    this.g.fillStyle(c);
    this.g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  txt(
    x: number,
    y: number,
    s: string,
    size = 8,
    c = "#d3dfb6",
    mounted = false,
  ) {
    if (
      this.phase === "school" &&
      this.encounterTime > 0 &&
      y > 24 &&
      y < 105 &&
      !this.drawingEncounter
    )
      return;
    const clutter = [
      "TRAVAUX",
      "PREVUS",
      "L'EXCELLENCE A MOINDRE COUT",
      "ICI, ON APPREND ENCORE.",
      "COURS EN COURS",
      "ESCALIER >",
      "HAUT : 2E",
      "BAS : 1ER",
      "PASSERELLE / 2E ETAGE",
      "ESCALIER DE SERVICE",
      "DEVANT LA PORTE : HAUT",
    ];
    if (this.phase === "school" && clutter.includes(s)) return;
    x = Math.round(x);
    y = Math.round(y);
    if (
      ["school", "opening", "fail"].includes(this.phase) &&
      y > 24 &&
      y < 105 &&
      s.length > 5 &&
      !mounted
    ) {
      size = Math.max(8, size);
      const w = Math.min(302, s.length * size * 0.61 + 6);
      x = Math.max(10, Math.min(x, 310 - w));
      this.rect(x - 3, y - 3, w, size + 6, 0x20352f);
      this.rect(x - 3, y - 3, w, 1, 0x849480);
      c = "#efdfad";
    }
    this.labels.push(
      this.add
        .text(x, y, s, {
          resolution: 2,
          fontFamily: "monospace",
          fontSize: size,
          color: c === "#d3dfb6" ? "#e3d4b3" : c,
          fontStyle: "bold",
        })
        .setDepth(4),
    );
  }
  setPlayerMenu(open: boolean) {
    this.playerMenu = open;
    this.controls?.reset();
    this.direct?.cancel();
    const keyboard = this.input?.keyboard;
    if (!keyboard) return;
    keyboard.resetKeys();
    keyboard.enabled = !open;
    if (open) keyboard.disableGlobalCapture();
    else keyboard.enableGlobalCapture();
  }
  startDay() {
    this.navigationProfile = false;
    this.navigationMetrics = new NavigationMetrics();
    this.audio.unlock();
    this.audio.radio("", false);
    this.cadreReview = false;
    this.session = new SessionLog();
    this.runtime.resetFrames();
    if (!this.workshop) this.seed = Math.floor(Math.random() * 4294967295) || 1;
    this.mission = 0;
    this.won = 0;
    this.results = [];
    this.vehicle = 100;
    this.kilometers = 0;
    this.collisions = 0;
    this.punches = 0;
    this.shortcuts = 0;
    this.paused = false;
    this.pauseReason = "";
    this.setPlayerMenu(false);
    this.begin();
  }
  begin() {
    this.navigationCare.reset(this.navigationGain);
    this.recoveryScene.reset();
    this.projectiles = [];
    this.roomTransition = null;
    this.exitHeld = false;
    this.dialogueSoundWait = 0;
    this.failureReason = null;
    this.playerRecovery = 0;
    this.attackBuffer = 0;
    this.bookBlocked = 0;
    this.attack = 0;
    this.hitStop = 0;
    this.encounterTime = 0;
    this.bossIntro = 0;
    this.schoolFade = 0;
    this.boardMessage = "";
    this.messageTime = 0;
    this.random.reset(this.seed + this.mission * 7919);
    this.falling = 0;
    this.phase = "free";
    this.notified = false;
    this.arrivalAlert = false;
    this.steerVelocity = 0;
    this.returnFade = 1.2;
    this.age = 0;
    this.speed = 40;
    this.road = 0;
    this.travel = 0;
    this.trafficHit = 0;
    this.crashPush = 0;
    this.particles = [];
    this.tireMarks = [];
    this.skidClock = 0;
    this.rattleClock = 0;
    this.brokenRoad = false;
    if (this.vehicle <= 0) this.vehicle = 65;
    this.arena = false;
    this.cleared.clear();
    this.roomEnemies.clear();
    this.enemies = [];
    this.room = this.missionSpec().start;
    this.py = PLAY.floor;
    this.vy = 0;
    this.face = 1;
    this.impact = 0;
    this.car = 0;
    this.remaining = this.missionSpec().seconds;
    this.hp = 5;
    const trafficCount = TRAFFIC.capacity;
    this.trafficIndex = 0;
    this.shoulder = 0;
    this.shoulderClock = 0;
    let z = 0;
    this.obstacles = Array.from({ length: trafficCount }, () => {
      const cue = trafficCue(
        this.trafficIndex++,
        this.mission,
        this.random.next(),
      );
      z += cue.gap;
      return { z, x: cue.x, type: cue.type, speed: cue.speed };
    });
  }
  school() {
    this.phase = "school";
    this.schoolFade = 0.7;
    this.age = 0;
    this.room = this.missionSpec().start;
    this.enterRoom(this.missionSpec().start, 25);
  }
  enterRoom(room: number, x: number) {
    this.navigationCare.cancel();
    this.recoveryScene.reset();
    this.roomTransition = null;
    this.direct?.cancel();
    this.projectiles = [];
    this.dialogueSoundWait = 0;
    this.roomEnteredAt = this.session.elapsed;
    this.impact = 0;
    this.hitStop = 0;
    this.particles = [];
    this.falling = 0;
    this.room = room;
    this.interactLock = PLAY.interactLock;
    const bounds = this.movementBounds();
    this.px = Phaser.Math.Clamp(x, bounds.min, bounds.max);
    this.lastGroundX = this.px;
    this.py = 159;
    this.vy = 0;
    this.cam = 0;
    this.inv = 0.5;
    this.attack = 0;
    this.playerRecovery = 0;
    this.attackBuffer = 0;
    this.bookBlocked = 0;
    this.arena = !!this.roomSpec()?.boss;
    this.encounterTime =
      !this.roomEnemies.has(room) && !!this.encounter() ? ENCOUNTER_SECONDS : 0;
    this.dialogue = { page: 0, characters: 0 };
    this.bossIntro =
      this.arena && !this.roomEnemies.has(room) ? ENCOUNTER_SECONDS : 0;
    if (!this.roomEnemies.has(room)) {
      this.roomEnemies.set(
        room,
        missionEnemies(this.mission, room, this.navigationSpec()),
      );
      if (this.pressureCombat())
        for (const e of this.roomEnemies.get(room)!) {
          e.cool = this.enemyTuning().initialCooldown;
          if (e.boss && e.role === "influential") e.parentCycle = parentCycle();
        }
    }
    this.enemies = this.roomEnemies.get(room)!;
    const nav = this.roomSpec()?.navigation;
    if (nav) {
      this.navigationMetrics.start(nav.id, this.hp, this.remaining);
      this.session.record("navigation-enter", this.mission, room, {
        zone: nav.id,
        floor: nav.floor,
        hp: this.hp,
        remaining: this.remaining,
      });
    }
    this.session.record("room", this.mission, room, {
      spawn: this.px,
      introduction: this.encounterTime,
    });
    this.audio.fx("step", (this.px - 160) / 190, 0.8);
    if (
      this.pressureCombat() &&
      room === NAV_ID.infirmerie &&
      !this.navigationCare.used &&
      this.hp > 0 &&
      this.remaining > 0
    ) {
      this.navigationCare.used = true;
      this.recoveryScene.start();
      this.inv = 0;
      this.face = 1;
      this.session.record("care-start", this.mission, room, {
        kind: "recovery",
        hp: this.hp,
        remaining: this.remaining,
      });
    }
  }

  changeRoom(target: number, spawn: number) {
    if (this.roomTransition) return;
    if (this.navigationProfile) {
      const from = this.roomSpec()!.navigation!.id;
      const to = roomSpec(this.mission, target, this.navigationSpec())
        .navigation!.id;
      const choice = {
        from,
        to,
        hp: this.hp,
        remaining: this.remaining,
        annexe: this.room === NAV_ID.hall && target === NAV_ID.annexe,
      };
      this.navigationMetrics.choices.push(choice);
      this.session.record("navigation-choice", this.mission, this.room, choice);
    }
    this.exitHeld = this.keys.UP.isDown || this.keys.DOWN.isDown;
    this.direct?.cancel();
    this.attackBuffer = 0;
    this.roomTransition = { target, spawn, age: 0, swapped: false };
  }

  roomTransitionAlpha() {
    const t = this.roomTransition;
    if (!t) return 0;
    return t.swapped
      ? Math.max(0, 1 - (t.age - PLAY.roomFadeOut) / PLAY.roomFadeIn)
      : Math.min(1, t.age / PLAY.roomFadeOut);
  }

  finish(ok: boolean, reason?: FailureReason) {
    if (
      [
        "fail",
        "opening",
        "blackBefore",
        "course",
        "blackAfter",
        "later",
        "report",
      ].includes(this.phase)
    )
      return;
    this.brokenRoad = ["free", "receive", "road"].includes(this.phase);
    this.failureReason = ok
      ? null
      : (reason ??
        terminalReason(
          this.hp,
          this.remaining,
          this.vehicle,
          this.brokenRoad,
        ) ??
        "late");
    this.attack = 0;
    this.playerRecovery = 0;
    this.attackBuffer = 0;
    this.bookBlocked = 0;
    this.impact = 0;
    this.hitStop = 0;
    this.encounterTime = 0;
    this.bossIntro = 0;
    this.falling = 0;
    this.particles = [];
    this.queuedAttack = false;
    this.recoveryScene.reset();
    for (const e of this.enemies) {
      e.wind = 0;
      e.recovery = 0;
      e.chargeTime = 0;
      e.strikeTime = 0;
      e.recoilTime = 0;
      e.blockTime = 0;
      e.downTime = 0;
    }
    this.direct?.cancel();
    this.phase = ok ? "opening" : "fail";
    this.age = 0;
    if (ok) {
      this.openingFrom = this.px;
      this.won++;
    }
    this.results.push(resultLine(ok, this.failureReason, this.brokenRoad));
    this.session.record(ok ? "success" : "failure", this.mission, this.room, {
      reason: this.failureReason,
      remaining: this.remaining,
      hp: this.hp,
      vehicle: this.vehicle,
    });
    if (this.navigationProfile)
      this.navigationMetrics.end = {
        outcome: ok ? "success" : "failure",
        hp: this.hp,
        remaining: this.remaining,
        careUsed: this.navigationCare.used,
      };
    this.persistJournal();
  }
  next() {
    this.navigationProfile = false;
    this.mission++;
    if (this.mission === 3) {
      this.phase = "report";
      this.age = 0;
    } else this.begin();
  }
  handleKeyDown(event: Pick<KeyboardEvent, "key" | "repeat">) {
    this.audio.unlock();
    if (
      !event.repeat &&
      !this.paused &&
      this.phase === "course" &&
      this.age > 0.3 &&
      !["P", "M", "F2", "F3", "F4"].includes(event.key.toUpperCase())
    )
      this.freshKey = true;
  }
  setPaused(value: boolean, reason = "", preserveControls = false) {
    if (!preserveControls && value !== this.paused) {
      this.controls?.reset();
      this.direct?.cancel();
    }
    this.paused = value;
    this.pauseReason = value ? reason : "";
    this.freshKey = false;
    // Focus loss may stop the render loop: silence audio in the event itself.
    this.audio.radio(
      this.radioLines[Math.min(this.mission, 2)],
      this.phase === "free",
      value,
    );
    this.audio.scene(
      this.phase,
      value,
      this.remaining,
      0,
      this.roomSpec()?.frame === 0 ? 0 : this.room,
      this.encounterTime > 0 ||
        this.schoolFade > 0 ||
        !!this.roomTransition ||
        this.recoveryScene.active,
    );
    this.audio.motor(
      this.speed,
      !value && ["free", "receive", "road", "arrival"].includes(this.phase),
      this.keys.UP.isDown,
    );
    this.syncPlayerUI?.();
  }
  pauseForFocusLoss() {
    if (
      this.paused ||
      this.arrivalStill ||
      this.cadreReview ||
      this.artReview >= 0 ||
      ["title", "report"].includes(this.phase)
    )
      return;
    this.input?.keyboard?.resetKeys();
    this.setPaused(true, "FENETRE INACTIVE");
    this.draw();
  }
  bookContact(e: Enemy) {
    const profile = this.combatProfile();
    return {
      x: e.x - this.face * profile.contactX,
      y: this.py - profile.contactY,
    };
  }
  persistJournal() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(
        "technoprof-last-session",
        JSON.stringify(this.journalSnapshot()),
      );
    } catch {
      /* Export from the workshop remains available when storage is disabled. */
    }
  }
  chargeClock(category: string, dt: number) {
    this.remaining -= dt;
    this.session.measure(this.mission, category, dt, true);
    if (this.navigationProfile && this.phase === "school")
      this.navigationMetrics.tick(category, dt);
  }
  journalSnapshot() {
    const snapshot = this.session.snapshot(
      this.seed,
      this.collisions,
      this.punches,
      this.results,
      this.runtime.snapshot(),
    );
    return this.navigationProfile || this.navigationMetrics.visits.length
      ? {
          ...snapshot,
          navigation: {
            ...this.navigationMetrics.snapshot(),
            gain: this.navigationGain,
            ...(this.pressureCombat()
              ? { careMode: "recovery", variant: "recovery-parent-cycle" }
              : {}),
            careUsed:
              this.navigationMetrics.end?.careUsed ?? this.navigationCare.used,
            remaining: this.navigationMetrics.end?.remaining ?? this.remaining,
            hp: this.navigationMetrics.end?.hp ?? this.hp,
          },
        }
      : snapshot;
  }
  exportJournal() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(this.journalSnapshot(), null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "technoprof-057-essai.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  loadScenario(name: string) {
    this.recoveryScene.reset();
    this.navigationProfile = false;
    this.navigationMetrics = new NavigationMetrics();
    this.controls?.reset();
    this.workshopScenario = name;
    this.input?.keyboard?.resetKeys();
    this.paused = false;
    this.pauseReason = "";
    this.queuedAttack = false;
    this.workshopStep = false;
    this.session = new SessionLog();
    this.lastLoggedPhase = "";
    this.vehicle = 100;
    this.mission = 0;
    this.results = [];
    this.won = 0;
    this.collisions = 0;
    this.punches = 0;
    this.kilometers = 0;
    this.cadreReview = false;
    this.arrivalStill = false;
    this.artReview = -1;
    if (this.workshop && name.startsWith("bruel-navigation")) {
      this.navigationProfile = true;
      this.navigationRevision = name.includes("-a3")
        ? "A3"
        : name.includes("-a2")
          ? "A2"
          : "A1";
      this.navigationMetrics = new NavigationMetrics(this.navigationRevision);
      this.mission = 1;
      this.begin();
      this.returnFade = 0;
      if (!name.endsWith("-road")) {
        this.notified = true;
        this.phase = "school";
        this.schoolFade = 0;
        this.hp = this.navigationStartHp;
        if (name.endsWith("-care") && this.navigationRevision === "A3") {
          // Declared care preset: first three encounters already passed.
          for (const id of [NAV_ID.cour, NAV_ID.vestibule, NAV_ID.jonction]) {
            this.roomEnemies.set(id, []);
            this.cleared.add(id);
          }
        }
        const viewRoom =
          this.navigationRevision === "A3"
            ? Number(name.match(/-view-(\d+)$/)?.[1])
            : NaN;
        const visualPreset = this.navigationSpec()?.rooms[viewRoom];
        this.enterRoom(
          visualPreset
            ? visualPreset.id
            : name.endsWith("-care")
              ? this.navigationRevision === "A3"
                ? NAV_ID.jonction
                : NAV_ID.hall
              : name.endsWith("-parent")
                ? NAV_ID.seuil
                : NAV_ID.cour,
          name.endsWith("-parent") ? 150 : visualPreset ? 55 : 20,
        );
      }
      this.session.record("scenario", this.mission, this.room, {
        name,
        profile: this.missionSpec().id,
        careGain: this.navigationGain,
        startHp: this.hp,
      });
      this.draw();
      return;
    }
    if (name.includes("quiet")) {
      this.mission = name.startsWith("bruel")
        ? 1
        : name.startsWith("pro-")
          ? 2
          : 0;
      this.begin();
      this.notified = true;
      this.school();
      const first = [30, 16, 26][this.mission];
      this.enterRoom(
        first + (name.endsWith("class") ? 1 : name.endsWith("hall") ? 2 : 0),
        50,
      );
      this.schoolFade = 0;
      this.session.record("scenario", this.mission, this.room, { name });
      this.draw();
      return;
    }
    const workloadRooms: Record<string, [number, number]> = {
      "bruel-workload": [1, 40],
      "bruel-workload-dialogue": [1, 44],
      "pro-workload": [2, 60],
      "pro-workload-dialogue": [2, 70],
      "pro-workload-end": [2, 88],
    };
    if (name in workloadRooms) {
      [this.mission] = workloadRooms[name];
      this.begin();
      this.notified = true;
      this.school();
      this.enterRoom(workloadRooms[name][1], 50);
      this.schoolFade = 0;
      this.session.record("scenario", this.mission, this.room, { name });
      this.draw();
      return;
    }
    if (name.startsWith("bruel") || name.startsWith("pro-")) {
      this.mission = name.startsWith("bruel") ? 1 : 2;
      this.begin();
      if (name.endsWith("arrival")) {
        this.phase = "arrival";
        this.notified = true;
        this.road = this.missionSpec().meters;
        this.age = 0;
        this.parkSpeed = 100;
        this.session.record("scenario", this.mission, this.room, { name });
        this.draw();
        return;
      }
      if (name.endsWith("drive")) {
        this.session.record("scenario", this.mission, this.room, { name });
        return;
      }
      this.notified = true;
      this.school();
      const gestureRooms: Record<string, number> = {
        "bruel-shove": 11,
        "bruel-rush": 14,
        "pro-throw": 21,
        "pro-push": 24,
      };
      this.enterRoom(
        gestureRooms[name] ??
          (name.endsWith("boss")
            ? this.missionSpec().arena
            : this.missionSpec().start),
        50,
      );
      this.schoolFade = 0;
      if (name in gestureRooms) {
        // Isolated workshop setup; afterwards windup/contact follow normal rules.
        this.encounterTime = 0;
        this.bossIntro = 0;
        this.px = 175;
        this.inv = 0;
        const e = this.enemies[0];
        e.x = 220;
        e.facing = -1;
        e.cool = 0;
      }
      this.session.record("scenario", this.mission, this.room, { name });
      this.draw();
      return;
    }
    if (name === "mission") {
      this.startDay();
      this.session.record("scenario", this.mission, this.room, { name });
      return;
    }
    this.begin();
    this.notified = true;
    this.returnFade = 0;
    const rooms: Record<string, number> = {
      parent: 1,
      student: 3,
      guard: 6,
      boss: 4,
      sweep: 4,
      gap: 8,
      stairs: 7,
      passages: 0,
      hit: 6,
      whiff: 6,
      "hit-left": 6,
      "block-left": 4,
      "hurt-left": 3,
      "defeat-parent": 1,
      "defeat-student": 3,
      "defeat-guard": 6,
      block: 4,
      hurt: 3,
      success: 4,
      exhausted: 3,
      late: 0,
    };
    if (name in rooms) {
      this.school();
      this.schoolFade = 0;
      this.enterRoom(rooms[name], name === "gap" ? 80 : 100);
      const kind = name.replace(/-left$/, "");
      if (
        [
          "whiff",
          "hit",
          "block",
          "hurt",
          "success",
          "exhausted",
          "sweep",
        ].includes(kind) ||
        name.startsWith("defeat-")
      ) {
        this.bossIntro = 0;
        this.encounterTime = 0;
        const e = this.enemies[0];
        e.x = 220;
        this.px =
          kind === "block" || kind === "success"
            ? 160
            : name === "defeat-parent"
              ? 185
              : 175;
        e.cool = 1;
        this.inv = 0;
        if (kind === "hit" || kind === "whiff") e.recovery = 1.5;
        if (kind === "whiff") this.px = 125;
        if (name === "success" || name.startsWith("defeat-")) {
          e.hp = 1;
          e.recovery = 3;
        }
        if (kind === "hurt" || name === "exhausted") {
          e.wind = STUDENT.wind;
          e.facing = -1;
        }
        if (name === "exhausted") this.hp = 1;
        if (name.endsWith("-left")) {
          this.px = 320 - this.px;
          e.x = 320 - e.x;
          this.face = -1;
          e.facing = 1;
        }
      }
      if (name === "sweep") {
        this.px = 150;
        this.enemies[0].x = 220;
        this.enemies[0].pattern = 2;
        this.enemies[0].wind = BOSS.sweepWind;
        this.enemies[0].facing = -1;
      }
      if (name === "late") this.remaining = 2;
      if (name === "stairs") {
        // Reproduce the old held-DOWN bounce without a combat obscuring it.
        this.px = 220;
        this.roomEnemies.set(3, []);
      }
      if (name === "passages") {
        this.px = 240;
        // Isolate the visible arrow interaction from combat and dialogue.
        this.roomEnemies.set(1, []);
      }
    } else if (name === "arrival") {
      this.phase = "arrival";
      this.parkSpeed = 100;
      this.age = 0;
    } else {
      this.phase = "road";
      this.speed = 110;
      if (name === "road-slow") this.speed = 40;
      if (name === "road-fast") this.speed = 260;
      if (name === "road-edge") {
        this.speed = 180;
        this.car = 1.1;
        this.obstacles = [];
      }
      if (name === "road-brake") {
        this.speed = 260;
        this.obstacles = [
          { z: 160 * DRIVE.motionScale, x: 0, type: 1, speed: 62 },
        ];
      }
      if (name === "breakdown") {
        this.vehicle = 22;
        this.obstacles = [{ z: 12, x: 0, type: 0 }];
      }
    }
    this.session.record("scenario", this.mission, this.room, {
      name,
      seed: this.seed,
    });
    this.draw();
  }
  loadPresentation(scene: string, mission: number) {
    const roadView = ROAD_VIEWS[scene];
    this.loadScenario(
      roadView !== undefined
        ? "road"
        : scene === "arrival"
          ? "arrival"
          : "boss",
    );
    this.mission = Math.max(0, Math.min(2, mission));
    this.cadreReview = true;
    this.paused = false;
    this.remaining = 157;
    this.age = 0;
    this.ambienceClock = 0;
    this.inv = 0;
    this.face = 1;
    if (roadView !== undefined) {
      this.travel = roadView;
      this.road = 1200;
      this.speed = 148;
      this.car = 0;
      this.obstacles = [
        { z: roadView + 80, x: -0.65, type: 0, speed: 74 },
        { z: roadView + 150, x: 0.65, type: 2, speed: 82 },
        { z: roadView + 290, x: -0.65, type: 1, speed: 62 },
      ];
    } else if (scene === "arrival") {
      this.age = 2.6;
      this.speed = 0;
      this.road = this.missionSpec().meters;
    } else {
      this.enterRoom(Number(scene), Number(scene) === 4 ? 125 : 130);
      this.schoolFade = 0;
      this.bossIntro = 0;
      this.encounterTime = 0;
      this.inv = 0;
      this.enemies.forEach((e) => {
        e.x = 230;
        e.cool = 2;
        if (e.boss) e.female = true;
      });
    }
    this.messageTime = 0;
    this.returnFade = 0;
    this.draw();
  }
  setWorkshopFocus(focused: boolean) {
    if (!this.input?.keyboard) return;
    this.input.keyboard.resetKeys();
    this.input.keyboard.enabled = !focused;
    if (focused) this.setPaused(true);
  }
  update(_t: number, ms: number) {
    if (
      !this.paused &&
      !this.playerMenu &&
      !this.workshopStep &&
      this.artReview < 0 &&
      !this.cadreReview &&
      !this.arrivalStill &&
      !["title", "report"].includes(this.phase)
    )
      this.runtime.frame(ms);
    if (this.controls && this.physicalKeys)
      this.controls.sampleKeyboard(this.physicalKeys, (k) =>
        Phaser.Input.Keyboard.JustDown(this.physicalKeys![k]),
      );
    if (
      ms > PLAY.maxFrameMs &&
      !this.paused &&
      !["title", "report"].includes(this.phase) &&
      !this.cadreReview &&
      !this.arrivalStill &&
      this.artReview < 0
    ) {
      this.input?.keyboard?.resetKeys();
      this.setPaused(true, "INTERRUPTION LONGUE");
      this.session.record("long-frame-pause", this.mission, this.room, { ms });
      this.draw();
      return;
    }
    const singleStep = this.workshop && this.workshopStep;
    this.workshopStep = false;
    const wasPaused = this.paused;
    if (singleStep) this.paused = false;
    const elapsed = singleStep
      ? PLAY.maxStepMs
      : Math.max(0, Math.min(ms, PLAY.maxFrameMs)) *
        (this.workshop ? this.workshopSpeed : 1);
    const steps = Math.max(1, Math.ceil(elapsed / PLAY.maxStepMs));
    this.substepping = true;
    for (let i = 0; i < steps; i++) this.simulate(elapsed / steps / 1000);
    this.substepping = false;
    if (singleStep) this.setPaused(wasPaused, "", true);
    this.draw();
  }
  simulate(dt: number) {
    if (this.arrivalStill || this.cadreReview) {
      this.draw();
      return;
    }
    if (this.artReview >= 0) {
      this.draw();
      return;
    }

    this.direct?.tick(dt);
    const just = (k: string) => Phaser.Input.Keyboard.JustDown(this.keys[k]);
    // Consume one-shot controls even when an imposed transition rejects them.
    const jumpPressed = just("SPACE");
    const attackPressed = just("X") || this.queuedAttack;
    this.queuedAttack = false;
    const enterPressed = just("ENTER");
    const upPressed = just("UP"),
      downPressed = just("DOWN");
    if (!this.keys.UP.isDown && !this.keys.DOWN.isDown) this.exitHeld = false;
    if (just("M")) this.audio.muted = !this.audio.muted;
    if (just("F2") && this.workshop) {
      this.begin();
      this.notified = true;
      this.school();
    }
    if (just("F3") && this.workshop) {
      this.begin();
      this.notified = true;
      this.school();
      this.enterRoom(4, 80);
    }
    if (just("F4") && this.workshop) {
      this.begin();
      this.notified = true;
      this.phase = "arrival";
      this.parkSpeed = 100;
      this.age = 0;
    }
    if (just("P") && !["title", "report"].includes(this.phase))
      this.setPaused(!this.paused);
    this.ambienceClock += this.paused ? 0 : dt;
    this.audio.radio(
      this.radioLines[Math.min(this.mission, 2)],
      this.phase === "free",
      this.paused,
    );
    this.audio.scene(
      this.phase,
      this.paused,
      this.remaining,
      dt,
      this.room,
      this.encounterTime > 0 ||
        this.schoolFade > 0 ||
        !!this.roomTransition ||
        this.recoveryScene.active,
    );
    this.audio.motor(
      this.speed,
      !this.paused &&
        ["free", "receive", "road", "arrival"].includes(this.phase),
      this.keys.UP.isDown,
    );
    if (this.paused) {
      this.draw();
      return;
    }
    this.session.tick(this.phase, dt);
    const category =
      this.hitStop > 0
        ? "hitStop"
        : this.phase === "school"
          ? this.roomTransition || this.schoolFade > 0
            ? "transition"
            : this.recoveryScene.active
              ? "recovery"
              : this.encounterTime > 0 || this.bossIntro > 0
                ? "dialogue"
                : this.arena && this.enemies.some((e) => e.hp > 0)
                  ? "boss"
                  : this.navigationProfile && this.navigationCare.active
                    ? "care"
                    : this.enemies.some((e) => e.hp > 0)
                      ? "encounter"
                      : "orientation"
          : this.phase;
    this.session.measure(this.mission, category, dt);
    if (this.phase !== this.lastLoggedPhase) {
      this.session.record("phase", this.mission, this.room, {
        from: this.lastLoggedPhase,
        to: this.phase,
      });
      this.lastLoggedPhase = this.phase;
    }
    this.tireMarks = this.tireMarks.filter((m) => m.life > 0 && m.y < 176);
    for (const m of this.tireMarks) {
      m.life -= dt;
      m.y += dt * (12 + this.speed * 0.1);
    }
    // Encounter presentation is advanced by the player, never by elapsed time.
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 100 * dt;
    }
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - dt);
      this.draw();
      return;
    }
    this.age += dt;
    if (this.phase === "title" || this.phase === "report") {
      if (enterPressed) this.startDay();
    } else if (this.phase === "opening") {
      if (this.age > PLAY.openingSeconds) {
        this.phase = "blackBefore";
        this.age = 0;
      }
    } else if (this.phase === "blackBefore") {
      if (this.age > 0.8) {
        this.phase = "course";
        this.age = 0;
        this.freshKey = false;
      }
    } else if (this.phase === "course") {
      if (this.freshKey) {
        this.phase = "blackAfter";
        this.age = 0;
        this.freshKey = false;
      }
    } else if (this.phase === "blackAfter") {
      if (this.age > 0.8) {
        this.phase = "later";
        this.age = 0;
      }
    } else if (this.phase === "later") {
      if (this.age > 2.2) this.next();
    } else if (this.phase === "fail") {
      if (this.age >= PLAY.failContinueSeconds && enterPressed) this.next();
    } else if (this.phase === "tow") {
      if (this.age > 3) {
        this.vehicle = 65;
        this.begin();
      }
    } else if (this.phase === "arrival") {
      this.speed = this.parkSpeed * (1 - Math.min(1, this.age / 1.8));
      if (this.age > 5.8) {
        this.phase = "arrivalFade";
        this.age = 0;
      }
    } else if (this.phase === "arrivalFade") {
      if (this.age > 1.1) this.school();
    } else if (["free", "receive", "road"].includes(this.phase)) {
      const cruising = this.phase === "free";
      const throttle = this.keys.UP.isDown,
        brake = this.keys.DOWN.isDown;
      const acceleration = brake
        ? -DRIVE.braking
        : throttle
          ? DRIVE.acceleration * (1 - this.speed / 340)
          : -1.5 - this.speed * 0.012;
      this.speed = Phaser.Math.Clamp(
        this.speed + acceleration * dt,
        0,
        this.notified ? TUNING.maxSpeed : 110,
      );
      const steer =
        (this.keys.RIGHT.isDown ? 1 : 0) - (this.keys.LEFT.isDown ? 1 : 0);
      const target =
        steer *
        Math.min(1, this.speed / 20) *
        (0.12 + Math.min(1, this.speed / TUNING.maxSpeed) * 1.8);
      this.steerVelocity +=
        (target - this.steerVelocity) *
        (1 - Math.exp(-dt / (steer ? DRIVE.steerRise : DRIVE.steerReturn)));
      this.car = Phaser.Math.Clamp(
        this.car +
          (this.steerVelocity + this.crashPush - this.curveForce()) * dt,
        -DRIVE.maxOffset,
        DRIVE.maxOffset,
      );
      const oldShoulder = this.shoulder;
      this.shoulder = shoulderAmount(this.car);
      this.speed = Math.max(
        0,
        this.speed - shoulderDrag(this.car, this.speed) * dt,
      );
      this.shoulderClock = Math.max(0, this.shoulderClock - dt);
      if (this.shoulder > 0.12 && this.speed > 20 && this.shoulderClock === 0) {
        this.audio.fx(
          "gravel",
          Math.sign(this.car) * 0.5,
          0.3 + this.shoulder * 0.8,
        );
        this.shoulderClock = 0.24;
      }
      if (this.shoulder > 0.12 && oldShoulder <= 0.12) {
        this.session.record("shoulder", this.mission, this.room, {
          side: Math.sign(this.car),
          speed: this.speed,
        });
        if (!this.arrivalAlert) {
          this.boardMessage = "ACCOTEMENT / PERTE D'ADHERENCE";
          this.messageTime = 1.5;
        }
      }
      this.crashPush *= Math.exp(-dt * 8);
      this.kilometers += ((this.speed / 3.6) * dt) / 1000;
      this.trafficHit = Math.max(0, this.trafficHit - dt);
      this.returnFade = Math.max(0, this.returnFade - dt);
      const priorTravel = this.travel;
      this.travel += this.visualSpeed() * dt;
      this.skidClock = Math.max(0, this.skidClock - dt);
      const skidding =
        this.speed > 65 && (brake || Math.abs(this.steerVelocity) > 1.05);
      if (skidding) {
        const x = 160 + this.car * 105;
        this.tireMarks.push(
          { x: x - 15, y: 165, life: 0.65 },
          { x: x + 15, y: 165, life: 0.65 },
        );
        if (this.skidClock === 0) {
          this.audio.fx("skid", this.car * 0.3);
          this.skidClock = 0.2;
        }
      }
      this.rattleClock -= dt;
      if (this.speed > 90 && this.rattleClock <= 0) {
        this.audio.fx("rattle", 0.3, this.vehicle < 45 ? 1.3 : 0.45);
        this.rattleClock = this.vehicle < 45 ? 0.65 : 1.8;
      }
      for (const o of this.obstacles) {
        const previous = o.z - priorTravel;
        o.z += DRIVE.motionScale * (trafficSpeed(o) / 3.6) * dt;
        const distance = o.z - this.travel;
        const closing =
          this.visualSpeed() - (DRIVE.motionScale * trafficSpeed(o)) / 3.6;
        if (
          !o.sounded &&
          !o.hit &&
          closing > 3 &&
          distance <= closing * 0.12 &&
          previous > 0
        ) {
          const lateral = Math.abs(o.x - this.car),
            width = contactWidth(o.type);
          if (lateral >= width) {
            const close = lateral < width + DRIVE.closeMargin;
            this.audio.pass(o.x - this.car, close, o.type === 1, closing);
            o.sounded = true;
            this.session.record(
              close ? "near-pass" : "pass",
              this.mission,
              this.room,
              { side: Math.sign(o.x - this.car), closing },
            );
            if (close) {
              this.boardMessage = "RETROVISEUR : ENCORE PRESENT";
              this.messageTime = 1.2;
            }
          }
        }
        if (
          this.trafficHit === 0 &&
          !o.hit &&
          Math.min(previous, distance) < DRIVE.contactDepth &&
          Math.max(previous, distance) > -DRIVE.contactDepth &&
          Math.abs(o.x - this.car) < contactWidth(o.type)
        ) {
          o.hit = true;
          this.crash(o.x, o.type);
        }
        if (distance < -40) {
          const cue = trafficCue(
            this.trafficIndex++,
            this.mission,
            this.random.next(),
          );
          const tail = Math.max(
            this.travel + DRIVE.visibleDistance + 80,
            ...this.obstacles
              .filter((other) => other !== o)
              .map((other) => other.z),
          );
          o.z = tail + cue.gap;
          o.x = cue.x;
          o.type = cue.type;
          o.speed = cue.speed;
          o.sounded = false;
          o.hit = false;
        }
      }

      if (this.vehicle <= 0) {
        if (this.notified) this.finish(false);
        else {
          this.phase = "tow";
          this.age = 0;
        }
        this.draw();
        return;
      }
      if (
        cruising &&
        ((this.audio.radioDone && !this.audio.radioFailed && this.age > 3) ||
          (!this.audio.radioPlaying && this.age > TUNING.cruiseSeconds) ||
          this.age > 45)
      ) {
        this.phase = "receive";
        this.notified = true;
        this.audio.radio("", false);
        this.age = 0;
        this.road = 0;
      }
      if (this.phase === "receive" || this.phase === "road") {
        this.chargeClock("road", dt);
        this.road += (this.speed / 3.6) * dt;
        if (
          !this.arrivalAlert &&
          this.missionSpec().meters - this.road < 1000
        ) {
          this.arrivalAlert = true;
          this.boardMessage = "ARRIVEE IMMINENTE / PREPAREZ-VOUS";
          this.messageTime = 5;
          this.audio.tone(523, 0.16, 0.065, 523);
          this.audio.tone(784, 0.25, 0.065, 784, 0.2);
          this.audio.attention(0.65);
        }
        if (this.phase === "receive" && this.age > 3) {
          this.phase = "road";
          this.age = 0;
        }
        if (this.remaining <= 0) this.finish(false);
        else if (this.road >= this.missionSpec().meters) {
          this.phase = "arrival";
          this.parkFrom = this.car;
          this.parkSpeed = this.speed;
          this.age = 0;
        }
      }
    } else if (this.phase === "school") {
      if (this.roomTransition) {
        const t = this.roomTransition;
        t.age += dt;
        if (!t.swapped && t.age >= PLAY.roomFadeOut) {
          this.enterRoom(t.target, t.spawn);
          t.swapped = true;
          this.roomTransition = t;
        }
        if (t.age >= PLAY.roomFadeOut + PLAY.roomFadeIn)
          this.roomTransition = null;
        // A forced visual transition consumes inputs but never the mission clock.
        this.draw();
        return;
      }
      if (this.recoveryScene.active) {
        this.updateRecoveryScene(dt, attackPressed);
        this.attackBuffer = 0;
        this.draw();
        return;
      }
      const presentation =
        this.schoolFade > 0 || this.encounterTime > 0 || this.bossIntro > 0;
      this.schoolFade = Math.max(0, this.schoolFade - dt);
      this.bossIntro = this.arena ? this.encounterTime : 0;
      this.impact = Math.max(0, this.impact - dt);
      this.interactLock = Math.max(0, this.interactLock - dt);
      if (!presentation) this.chargeClock(category, dt);
      this.inv = Math.max(0, this.inv - dt);
      if (presentation) {
        if (this.schoolFade === 0 && this.encounterTime > 0) {
          const before = this.dialogue.characters;
          this.dialogue.characters = Math.min(
            dialogueLength(this.room, this.dialogue, this.encounter()),
            this.dialogue.characters + DIALOGUE.charactersPerSecond * dt,
          );
          this.dialogueSoundWait = Math.max(0, this.dialogueSoundWait - dt);
          if (
            !attackPressed &&
            this.dialogueSoundWait === 0 &&
            dialogueLetters(this.room, this.dialogue, before, this.encounter())
          ) {
            this.audio.talk(
              this.arena
                ? 4
                : this.roomSpec()?.role === "student" ||
                    this.roomSpec()?.role === "thrower"
                  ? 3
                  : this.roomSpec()?.role === "guard"
                    ? 6
                    : 1,
              !!this.enemies[0]?.female,
              ((this.enemies[0]?.x ?? 160) - 160) / 190,
            );
            this.dialogueSoundWait = DIALOGUE.soundInterval;
          }
          if (attackPressed) {
            const result = advanceDialogue(
              this.room,
              this.dialogue,
              this.encounter(),
            );
            this.session.record("dialogue", this.mission, this.room, {
              page: this.dialogue.page,
              result,
            });
            this.audio.fx("paper", 0, result === "finished" ? 0.35 : 0.2);
            this.dialogueSoundWait = 0;
            if (result === "finished") {
              this.encounterTime = 0;
              this.bossIntro = 0;
              this.roomEnteredAt = this.session.elapsed;
            }
          }
        }
        // The confirming X is consumed here: it can never also strike.
        this.attackBuffer = 0;
        this.draw();
        return;
      }
      const terminal = terminalReason(
        this.hp,
        this.remaining,
        this.vehicle,
        false,
      );
      if (terminal) {
        this.navigationCare.cancel();
        this.finish(false, terminal);
        return;
      }
      const reprising = this.enemies.find(
        (e) => e.hp > 0 && e.parentCycle?.phase === "breakaway",
      );
      if (reprising) {
        this.updateParentBreakaway(reprising, dt);
        this.attack = this.attackBuffer = 0;
        this.direct?.cancel();
        this.draw();
        return;
      }
      if (this.navigationProfile && this.navigationCare.active) {
        const gain = this.navigationCare.tick(dt, this.hp, this.remaining);
        if (gain) {
          this.hp += gain;
          this.boardMessage = `SOINS : +${gain} PV`;
          this.messageTime = 2.2;
          this.session.record("care-complete", this.mission, this.room, {
            gain,
            hp: this.hp,
            remaining: this.remaining,
          });
          this.audio.fx("paper", 0, 0.4);
        }
        this.attackBuffer = 0;
        this.draw();
        return;
      }
      const resource = this.careResource();
      if (
        resource &&
        attackPressed &&
        Math.abs(this.px - resource.x) <= resource.reach &&
        this.py === PLAY.floor &&
        !this.playerRecovery &&
        !this.attack &&
        !this.interactLock
      ) {
        this.direct?.cancel();
        if (this.navigationCare.start(this.hp)) {
          this.session.record("care-start", this.mission, this.room, {
            gain: this.navigationCare.gain,
            hp: this.hp,
            remaining: this.remaining,
          });
          this.audio.fx("paper", 0, 0.25);
        } else {
          this.boardMessage = this.navigationCare.used
            ? "SOINS DEJA UTILISES"
            : "RIEN A SOIGNER";
          this.messageTime = 1.8;
        }
        this.attackBuffer = 0;
        this.draw();
        return;
      }
      if (this.falling > 0) {
        this.falling += dt;
        this.vy += 780 * dt;
        this.py += this.vy * dt;
        if (this.falling > 0.85) {
          this.falling = 0;
          this.py = 159;
          this.vy = 0;
          this.px = this.fallReturn;
          this.lastGroundX = this.px;
          this.boardMessage = "CHUTE / UN POINT DE SANTE PERDU";
          this.messageTime = 1.6;
          this.hp--;
          this.session.falls++;
          this.session.record("fall-damage", this.mission, this.room, {
            hp: this.hp,
            bank: this.px,
          });
          this.inv = 1.5;
          this.audio.fx("land", (this.px - 160) / 190, 1.4);
          if (this.hp <= 0 || this.remaining <= 0) this.finish(false);
        }
        this.draw();
        return;
      }
      this.attack = Math.max(0, this.attack - dt);
      this.bookBlocked = Math.max(0, this.bookBlocked - dt);
      this.attackBuffer = Math.max(0, this.attackBuffer - dt);
      const recovering = this.playerRecovery > 0;
      this.playerRecovery = Math.max(0, this.playerRecovery - dt);
      const dir =
        (this.keys.RIGHT.isDown ? 1 : 0) - (this.keys.LEFT.isDown ? 1 : 0);
      if (dir && this.attack === 0 && !recovering) this.face = dir;
      const previousX = this.px;
      if (
        this.py === 159 &&
        !this.floorGaps().some(
          ([left, right]) => this.px > left && this.px < right,
        )
      )
        this.lastGroundX = this.px;
      this.px = Phaser.Math.Clamp(
        this.px +
          (recovering
            ? 0
            : dir *
              (this.attack > 0 ? this.combatProfile().attackWalk : PLAY.walk)) *
            dt,
        10,
        302,
      );
      this.separateFighters(previousX);
      if (
        dir &&
        this.py === 159 &&
        this.attack === 0 &&
        Math.abs(this.px - previousX) > 0.01
      ) {
        this.walkClock += dt * 13;
        this.stepClock += dt;
        if (this.stepClock > 0.27) {
          this.stepClock = 0;
          this.audio.fx("step", (this.px - 160) / 190);
        }
      }
      if (jumpPressed && this.py === PLAY.floor && !recovering) {
        this.vy = -PLAY.jump;
        this.audio.fx("jump", (this.px - 160) / 190);
      }
      const bounds = this.movementBounds();
      this.px = Phaser.Math.Clamp(this.px, bounds.min, bounds.max);
      const landing = this.py < PLAY.floor && this.vy > 100;
      this.vy += PLAY.gravity * dt;
      this.py += this.vy * dt;
      if (this.py >= 159) {
        if (
          landing &&
          !this.floorGaps().some(([l, r]) => this.px > l && this.px < r)
        )
          this.audio.fx("land", (this.px - 160) / 190);
        this.py = 159;
        this.vy = 0;
      }
      if (this.tryFall()) return;
      // Only a fresh press in the last 100 ms of a swing can request the next one.
      // Early mashing, a held key, hurt and transitions never queue an attack.
      if (
        attackPressed &&
        this.attack > 0 &&
        this.attack <= PLAY.attackBuffer &&
        !recovering
      )
        this.attackBuffer = PLAY.attackBuffer;
      if (
        (attackPressed || this.attackBuffer > 0) &&
        this.attack === 0 &&
        !recovering
      ) {
        this.attackBuffer = 0;
        this.attack = PLAY.attackDuration;
        this.attackHit = false;
        this.session.record("attack", this.mission, this.room, {
          x: this.px,
          facing: this.face,
        });
      }
      if (
        this.attack > 0 &&
        this.attack <= PLAY.attackContact &&
        !this.attackHit
      ) {
        this.attackHit = true;
        this.audio.combat("swing", this.face);
        for (const e of this.enemies) {
          if (
            e.hp <= 0 ||
            Math.abs(e.x - this.px) > this.combatProfile().bookReach ||
            (e.x - this.px) * this.face < -8 ||
            this.py < 125
          )
            continue;
          const contact = this.bookContact(e);
          if (
            e.boss &&
            (e.parentCycle
              ? e.parentCycle.phase !== "opening" ||
                e.recovery <= 0 ||
                e.parentCycle.hits >= PARENT_CYCLE.maxHits
              : e.recovery <= 0 &&
                e.stun <= 0 &&
                (e.role !== "security" ||
                  (this.px - e.x) * (e.facing ?? -1) > 0))
          ) {
            this.audio.combat("block", this.face);
            this.bookBlocked = PLAY.attackRecovery;
            this.attack = PLAY.attackRecovery;
            e.blockTime = 0.14;
            e.hitDirection = this.face;
            this.impact = PLAY.impactSeconds;
            this.impactX = contact.x;
            this.impactY = contact.y;
            this.impactKind = "block";
            this.hitStop = PLAY.blockStop;
            this.session.record("blocked", this.mission, this.room, contact);
            continue;
          }
          e.hp--;
          if (e.hp <= 0) e.downTime = PLAY.defeatSeconds;
          e.stun = this.enemyTuning().hitStun;
          e.wind = 0;
          e.chargeTime = 0;
          e.strikeTime = 0;
          e.recovery = Math.max(e.recovery, this.enemyTuning().hitRecovery);
          if (this.pressureCombat()) e.cool = 0;
          e.facing = Math.sign(this.px - e.x) || -this.face;
          e.hitDirection = this.face;
          e.recoilTime = PLAY.hitStun;
          const oldX = e.x;
          e.x = Phaser.Math.Clamp(e.x + this.face * PLAY.recoil, 22, 287);
          e.recoilDistance = e.x - oldX;
          this.hitStop = PLAY.hitStop;
          this.punches++;
          this.impact = PLAY.impactSeconds;
          this.impactX = contact.x;
          this.impactY = contact.y;
          this.impactKind = "hit";
          this.session.record("contact", this.mission, this.room, {
            ...contact,
            hp: e.hp,
            ...(e.parentCycle ? { openingHit: e.parentCycle.hits + 1 } : {}),
          });
          this.audio.combat(e.hp <= 0 ? "defeat" : "hit", this.face);
          if (e.parentCycle) {
            e.parentCycle.hits++;
            if (e.hp > 0 && e.parentCycle.hits >= PARENT_CYCLE.maxHits)
              this.beginParentBreakaway(e);
            else
              e.recovery = Math.max(e.recovery, PARENT_CYCLE.firstHitOpening);
          }
        }
      }
      for (const e of this.enemies) {
        const BOSS = this.enemyTuning().boss;
        e.recoilTime = Math.max(0, (e.recoilTime ?? 0) - dt);
        e.blockTime = Math.max(0, (e.blockTime ?? 0) - dt);
        if (e.downTime) e.downTime = Math.max(0, e.downTime - dt);
        if (e.hp <= 0) continue;
        e.strikeTime = Math.max(0, (e.strikeTime ?? 0) - dt);
        e.stun = Math.max(0, e.stun - dt);
        if (e.stun > 0) continue;
        if (this.roomSpec()?.role === "student") {
          this.updateStudent(e, dt);
          continue;
        }
        if (this.roomSpec()?.role === "guard") {
          this.updateGuard(e, dt);
          continue;
        }
        if (e.role === "filmer") {
          this.updateFilmer(e, dt);
          continue;
        }
        if (e.role === "security") {
          this.updateSecurity(e, dt);
          continue;
        }
        if (e.role === "thrower") {
          this.updateThrower(e, dt);
          continue;
        }
        if (e.parent) {
          this.updateParent(e, dt);
          continue;
        }
        if (e.recovery > 0) {
          e.recovery -= dt;
          continue;
        }
        if (e.wind > 0) {
          e.wind -= dt;
          if (e.wind <= 0) {
            this.enemyAttack(e, "release");
            const range =
              e.pattern % 2 === 0 ? BOSS.sweepReach : BOSS.stampReach;
            e.strikeTime =
              e.pattern % 2 === 0 ? BOSS.sweepPose : BOSS.stampPose;
            const facing = e.facing ?? Math.sign(this.px - e.x);
            if (
              Math.abs(this.px - e.x) < range &&
              this.py > 130 &&
              (this.px - e.x) * facing > 0
            ) {
              const vulnerable = this.inv <= 0;
              this.hurt(facing);
              if (vulnerable) {
                this.impact = PLAY.impactSeconds;
                this.impactKind = "hurt";
                this.impactX = this.px - facing * 10;
                this.impactY = e.pattern % 2 === 0 ? 125 : 113;
                this.burst(this.impactX, this.impactY, 0xbf6648);
                this.hitStop = PLAY.hurtStop;
                this.px = Phaser.Math.Clamp(this.px + facing * 10, 22, 298);
              }
            }
            e.recovery = BOSS.recovery;
            this.audio.fx(
              e.pattern % 2 === 0 ? "sweep" : "stamp",
              facing * 0.25,
            );
          }
          continue;
        }
        e.cool -= dt;
        const d = this.px - e.x;
        const oldEnemyX = e.x;
        if (Math.abs(d) > BOSS.approach)
          e.x = Phaser.Math.Clamp(
            e.x + Math.sign(d) * BOSS.speed * dt,
            22,
            287,
          );
        e.walk = (e.walk ?? 0) + Math.abs(e.x - oldEnemyX);
        this.separateFighters(this.px);
        if (Math.abs(d) < BOSS.trigger && e.cool <= 0) {
          e.facing = Math.sign(d) || -1;
          e.pattern++;
          e.wind = e.pattern % 2 === 0 ? BOSS.sweepWind : BOSS.stampWind;
          this.enemyAttack(e, "windup");
          this.audio.fx(
            e.pattern % 2 === 0 ? "step" : "paper",
            (e.x - 160) / 190,
            0.7,
          );
          e.cool = BOSS.cooldown;
        }
      }
      this.updateProjectiles(dt);
      if (this.tryFall()) return;
      if (this.enemies.every((e) => e.hp <= 0)) this.cleared.add(this.room);
      if (this.remaining <= 0 || this.hp <= 0) this.finish(false);
      else {
        const action = this.pointerExits().find(
          (exit) =>
            withinPassage(exit, this.px) &&
            (exit.edge
              ? dir === (exit.key === "LEFT" ? -1 : 1)
              : !this.exitHeld &&
                (this.keys[exit.key].isDown ||
                  (exit.key === "UP" ? upPressed : downPressed))),
        );
        if (
          action &&
          this.interactLock === 0 &&
          this.py === 159 &&
          this.attack === 0 &&
          this.playerRecovery === 0 &&
          !recovering
        ) {
          if (action.target === -1) this.finish(true);
          else {
            if (action.target === 8) {
              this.shortcuts++;
              this.boardMessage = "VOTRE AUTONOMIE EST APPRECIEE";
              this.messageTime = 4;
            }
            this.changeRoom(action.target, action.spawn);
          }
        }
      }
    }
    this.draw();
  }
  schoolStatus() {
    if (this.recoveryScene.active) return "INFIRMERIE / DELAI SUSPENDU";
    if (this.pressureCombat() && this.room === NAV_ID.infirmerie)
      return "UNE PAUSE BIENVENUE";
    if (this.navigationProfile && this.navigationCare.active)
      return "SOINS EN COURS / DELAI ACTIF";
    if (this.falling > 0) return "SOL EFFONDRE / CHUTE";
    if (this.messageTime > 0) return this.boardMessage;
    const care = this.careResource();
    if (care && Math.abs(this.px - care.x) <= care.reach)
      return this.navigationCare.used
        ? "SOINS UTILISES"
        : `${this.pointerMode ? "TOUCHER" : "F/X"} : SOINS +${this.navigationGain} PV`;
    const hint = this.interaction();
    if (hint) return hint.label;
    const edges = this.roomSpec()?.blocked ?? [];
    if (
      (edges.includes("left") && this.px <= 43) ||
      (edges.includes("right") && this.px >= 277)
    )
      return "ACCES CONDAMNE / CHERCHEZ UN DETOUR";
    return (
      ["07:00", "12:00", "18:30"][Math.min(this.mission, 2)] +
      " / " +
      (this.roomSpec()?.name ?? ROOM_NAMES[this.room])
    );
  }
  tryFall() {
    if (this.py !== PLAY.floor || this.falling > 0) return false;
    const gap = this.floorGaps().find(
      ([left, right]) => this.px > left && this.px < right,
    );
    if (!gap) return false;
    this.falling = 0.001;
    this.fallReturn = recoveryBank(gap[0], gap[1], this.lastGroundX);
    this.vy = 45;
    this.attack = 0;
    this.attackHit = true;
    this.playerRecovery = 0;
    this.attackBuffer = 0;
    this.bookBlocked = 0;
    this.session.record("fall", this.mission, this.room, {
      x: this.px,
      bank: this.fallReturn,
    });
    this.audio.fx("crumble", (this.px - 160) / 190);
    this.burst(this.px, 158, 0x8e8268);
    return true;
  }
  pointerExits() {
    return missionPassages(
      this.mission,
      this.room,
      this.cleared.has(this.room),
      this.navigationSpec(),
    );
  }
  careResource() {
    return this.navigationSpec() &&
      !this.pressureCombat() &&
      this.phase === "school"
      ? this.roomSpec()?.care
      : undefined;
  }
  interaction() {
    return this.pointerExits().find((t) => withinPassage(t, this.px));
  }
  burst(x: number, y: number, color: number) {
    for (let i = 0; i < 8; i++)
      this.particles.push({
        x,
        y,
        vx: (i - 3.5) * 18,
        vy: -35 - (i % 3) * 18,
        life: 0.7 + i * 0.035,
        color,
      });
  }
  crash(lane: number, type: number) {
    if (this.trafficHit > 0 || this.vehicle <= 0) return;
    this.collisions++;
    this.session.record("crash", this.mission, this.room, {
      lane,
      type,
      speed: this.speed,
    });
    this.vehicle = Math.max(0, this.vehicle - (type === 1 ? 30 : 22));
    this.speed *= 0.48;
    this.trafficHit = 1.4;
    this.crashPush =
      (Math.sign(this.car - lane) || Math.sign(this.steerVelocity) || 1) *
      (type === 1 ? 0.55 : 0.42);
    this.burst(160 + this.car * 105, 148, 0xdba15d);
    this.audio.roadImpact(lane - this.car, type === 1);
    this.shake(170, 0.008);
    this.boardMessage = "CHOC / CARROSSERIE ENDOMMAGEE";
    this.messageTime = 3;
  }
  updateStudent(e: Enemy, dt: number) {
    const STUDENT = this.enemyTuning().student;
    // Body collision is resolved independently, even during speech or stun.
    if (e.recovery > 0) {
      e.recovery = Math.max(0, e.recovery - dt);
      return;
    }
    if (e.wind > 0) {
      if (e.role !== "filmer" && e.wind > dt && STUDENT.windAdvance > 0) {
        e.x = Phaser.Math.Clamp(
          e.x + (e.facing ?? -1) * STUDENT.windAdvance * dt,
          22,
          287,
        );
        this.separateFighters(this.px);
      }
      e.wind -= dt;
      if (e.wind <= 0) {
        this.enemyAttack(e, "release");
        e.strikeTime = e.role === "filmer" ? FILMER.activePose : 0.12;
        const dir = e.facing ?? -1;
        if (
          Math.abs(this.px - e.x) < STUDENT.reach &&
          (this.px - e.x) * dir > 0 &&
          this.py > 130 &&
          this.inv <= 0
        ) {
          const contact = this.px - dir * 8;
          this.hurt(dir);
          this.px = Phaser.Math.Clamp(this.px + dir * 9, 12, 298);
          this.impactX = contact;
          this.impactY = 128;
          this.impact = PLAY.impactSeconds;
          this.impactKind = "hurt";
          this.hitStop = 0.045;
        }
        e.recovery = STUDENT.recovery;
        e.cool = STUDENT.cooldown;
        if (e.role === "filmer")
          this.audio.enemyGesture("filmer", "release", e.x);
        else this.audio.combat("swing", dir);
      }
      return;
    }
    e.cool -= dt;
    const d = this.px - e.x;
    e.facing = Math.sign(d) || e.facing || -1;
    if (Math.abs(d) > STUDENT.approach)
      e.x = Phaser.Math.Clamp(e.x + Math.sign(d) * STUDENT.speed * dt, 22, 287);
    if (Math.abs(d) < STUDENT.trigger && e.cool <= 0) {
      e.facing = Math.sign(d) || -1;
      e.wind = STUDENT.wind;
      this.enemyAttack(e, "windup");
      if (e.role === "filmer") this.audio.enemyGesture("filmer", "windup", e.x);
    }
    this.separateFighters(this.px);
  }
  updateFilmer(e: Enemy, dt: number) {
    const FILMER = this.enemyTuning().filmer;
    if (e.wind > dt) {
      e.x = Phaser.Math.Clamp(
        e.x + (e.facing ?? -1) * FILMER.windAdvance * dt,
        32,
        280,
      );
      this.separateFighters(this.px);
    }
    this.updateStudent(e, dt);
  }
  updateSecurity(e: Enemy, dt: number) {
    const SECURITY = this.enemyTuning().security;
    if (e.recovery > 0) {
      e.recovery = Math.max(0, e.recovery - dt);
      return;
    }
    const direction = Math.sign(this.px - e.x) || e.facing || -1;
    // A committed facing is part of the guard, rather than an instant auto-aim.
    if (e.turnTime) {
      e.turnTime = Math.max(0, e.turnTime - dt);
      if (!e.turnTime) e.facing = direction;
      return;
    }
    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) {
        e.strikeTime = SECURITY.activePose;
        const facing = e.facing ?? -1;
        if (
          Math.abs(this.px - e.x) < SECURITY.reach &&
          (this.px - e.x) * facing > 0 &&
          this.py > 130 &&
          this.inv <= 0
        ) {
          this.hurt(facing);
          this.impact = PLAY.impactSeconds;
          this.impactKind = "hurt";
          this.impactX = this.px - facing * 10;
          this.impactY = this.py - 55;
          this.hitStop = PLAY.hurtStop;
        }
        e.recovery = SECURITY.recovery;
        e.cool = SECURITY.cooldown;
        this.audio.enemyGesture("security", "release", e.x);
      }
      return;
    }
    if (direction !== (e.facing ?? -1)) {
      e.turnTime = SECURITY.turn;
      return;
    }
    e.cool -= dt;
    const distance = Math.abs(this.px - e.x);
    if (distance > SECURITY.approach)
      e.x = Phaser.Math.Clamp(e.x + direction * SECURITY.speed * dt, 32, 270);
    this.separateFighters(this.px);
    if (distance < SECURITY.trigger && e.cool <= 0) {
      e.wind = SECURITY.wind;
      this.audio.enemyGesture("security", "windup", e.x);
    }
  }
  updateThrower(e: Enemy, dt: number) {
    const THROWER = this.enemyTuning().thrower;
    if (e.recovery > 0) {
      e.recovery = Math.max(0, e.recovery - dt);
      return;
    }
    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) {
        e.strikeTime = THROWER.activePose;
        this.projectiles.push({
          x: e.x + (e.facing ?? -1) * 18,
          dir: e.facing ?? -1,
          life: 2.8,
        });
        e.recovery = THROWER.recovery;
        e.cool = THROWER.cooldown;
        this.audio.enemyGesture("thrower", "release", e.x);
        this.session.record("projectile", this.mission, this.room, {
          x: e.x,
          facing: e.facing,
        });
      }
      return;
    }
    e.cool -= dt;
    if (Math.abs(this.px - e.x) < THROWER.reach && e.cool <= 0) {
      e.facing = Math.sign(this.px - e.x) || -1;
      e.wind = THROWER.wind;
      this.audio.enemyGesture("thrower", "windup", e.x);
    }
  }
  updateProjectiles(dt: number) {
    this.projectiles = this.projectiles.filter((p) => {
      const before = p.x;
      p.x += p.dir * THROWER.speed * dt;
      p.life -= dt;
      if (this.enemies.every((e) => e.hp <= 0)) return false;
      if (
        this.py > 132 &&
        this.inv <= 0 &&
        Math.min(before, p.x) - 9 < this.px &&
        Math.max(before, p.x) + 9 > this.px
      ) {
        this.hurt(p.dir);
        this.impact = PLAY.impactSeconds;
        this.impactKind = "hurt";
        this.impactX = this.px;
        this.impactY = THROWER.height;
        this.hitStop = PLAY.hurtStop;
        return false;
      }
      return p.life > 0 && p.x > 7 && p.x < 313;
    });
  }
  updateGuard(e: Enemy, dt: number) {
    const GUARD = this.enemyTuning().guard;
    if (e.recovery > 0) {
      e.recovery = Math.max(0, e.recovery - dt);
      return;
    }
    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) {
        this.enemyAttack(e, "release");
        e.strikeTime = 0.12;
        const dir = e.facing ?? -1;
        if (
          Math.abs(this.px - e.x) < GUARD.reach &&
          (this.px - e.x) * dir > 0 &&
          this.py > 130 &&
          this.inv <= 0
        ) {
          this.hurt(dir);
          this.px = Phaser.Math.Clamp(this.px + dir * 12, 12, 298);
          this.impactX = this.px - dir * 12;
          this.impactY = 115;
          this.impactKind = "hurt";
          this.impact = PLAY.impactSeconds;
        }
        e.recovery = GUARD.recovery;
        e.cool = GUARD.cooldown;
        this.audio.combat("swing", dir);
      }
      return;
    }
    e.cool -= dt;
    const d = this.px - e.x;
    e.facing = Math.sign(d) || e.facing || -1;
    if (Math.abs(d) > GUARD.approach)
      e.x = Phaser.Math.Clamp(e.x + Math.sign(d) * GUARD.speed * dt, 22, 287);
    if (Math.abs(d) < GUARD.trigger && e.cool <= 0) {
      e.facing = Math.sign(d) || -1;
      e.wind = GUARD.wind;
      this.enemyAttack(e, "windup");
    }
    this.separateFighters(this.px);
  }
  updateParent(e: Enemy, dt: number) {
    if (e.parentCycle?.phase === "breakaway") {
      this.updateParentBreakaway(e, dt);
      return;
    }
    const tuning = this.enemyTuning(),
      PARENT = tuning.parent;
    if (e.recovery > 0) {
      e.recovery = Math.max(0, e.recovery - dt);
      if (e.parentCycle && e.recovery === 0) {
        e.parentCycle.phase = "guard";
        e.parentCycle.hits = 0;
      }
      return;
    }
    if ((e.chargeTime ?? 0) > 0) {
      e.chargeTime! -= dt;
      e.x += (e.chargeDir ?? 1) * PARENT.chargeSpeed * dt;
      if (
        Math.abs(e.x - this.px) < PARENT.reach &&
        this.py > 130 &&
        this.inv <= 0
      ) {
        this.hurt(e.chargeDir ?? 1);
        this.impact = PLAY.impactSeconds;
        this.impactKind = "hurt";
        this.impactX = this.px - (e.chargeDir ?? 1) * 8;
        this.impactY = this.py - 43;
        this.hitStop = 0.045;
      }
      if (e.x < 29 || e.x > 275) {
        e.x = Phaser.Math.Clamp(e.x, 29, 275);
        if (!e.boss) e.hp--;
        if (e.hp <= 0) e.downTime = PLAY.defeatSeconds;
        e.hitDirection = -(e.chargeDir ?? 1);
        e.chargeTime = 0;
        e.stun = tuning.wallStun;
        e.recovery = tuning.wallRecovery;
        if (e.parentCycle) this.openParentWindow(e);
        this.burst(e.x, 136, 0xbab099);
        this.audio.fx("land", (e.x - 160) / 190, 1.8);
        this.boardMessage = "INCIDENT MOBILIER ENREGISTRE";
        this.messageTime = 3;
      } else if (e.chargeTime! <= 0) {
        e.recovery = PARENT.recovery;
        if (e.parentCycle) this.openParentWindow(e);
      }
      return;
    }
    if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) {
        this.enemyAttack(e, "release");
        e.chargeTime = PARENT.charge;
        if (e.parentCycle) e.parentCycle.phase = "charge";
        if (e.boss) this.audio.enemyGesture("influential", "release", e.x);
        else this.audio.fx("jump", (e.x - 160) / 190, 1.3);
      }
      return;
    }
    e.cool -= dt;
    if (Math.abs(e.x - this.px) < 185 && e.cool <= 0) {
      e.pattern++;
      e.wind = PARENT.wind;
      if (e.parentCycle) {
        e.parentCycle.phase = "windup";
        e.parentCycle.hits = 0;
      }
      this.enemyAttack(e, "windup");
      if (e.boss) this.audio.enemyGesture("influential", "windup", e.x);
      e.chargeDir = Math.sign(this.px - e.x) || -1;
      e.cool = tuning.parentCooldown;
    } else if (Math.abs(e.x - this.px) > 60)
      e.x += Math.sign(this.px - e.x) * PARENT.speed * dt;
  }
  openParentWindow(e: Enemy) {
    e.parentCycle!.phase = "opening";
    e.parentCycle!.hits = 0;
    e.stun = 0;
    e.recovery = PARENT_CYCLE.openingSeconds;
    this.session.record("boss-opening", this.mission, this.room, { hp: e.hp });
  }
  beginParentBreakaway(e: Enemy) {
    const c = e.parentCycle!,
      dir = Math.sign(e.x - this.px) || this.face;
    c.phase = "breakaway";
    c.elapsed = 0;
    c.fromX = e.x;
    c.targetX = Phaser.Math.Clamp(e.x + dir * PARENT_CYCLE.retreat, 29, 275);
    c.playerFrom = this.px;
    c.playerTarget = Phaser.Math.Clamp(
      c.targetX - dir * PARENT_CYCLE.distance,
      10,
      302,
    );
    e.facing = -dir;
    e.stun = e.recovery = e.wind = e.cool = 0;
    e.chargeTime = e.strikeTime = 0;
    // This is a displacement without damage; don't play the hurt sound or pose.
    this.attack = this.attackBuffer = 0;
    this.direct?.cancel();
    this.session.record("boss-breakaway", this.mission, this.room, {
      hits: c.hits,
      hp: e.hp,
      x: e.x,
      playerX: this.px,
    });
    this.audio.fx("step", (e.x - 160) / 190, 0.7);
  }
  updateParentBreakaway(e: Enemy, dt: number) {
    const c = e.parentCycle!;
    c.elapsed = Math.min(PARENT_CYCLE.breakSeconds, c.elapsed + dt);
    const t = c.elapsed / PARENT_CYCLE.breakSeconds,
      ease = t * (2 - t);
    e.x = c.fromX! + (c.targetX! - c.fromX!) * ease;
    this.px = c.playerFrom! + (c.playerTarget! - c.playerFrom!) * ease;
    if (this.py < PLAY.floor) {
      this.vy += PLAY.gravity * dt;
      this.py = Math.min(PLAY.floor, this.py + this.vy * dt);
      if (this.py === PLAY.floor) this.vy = 0;
    }
    e.recoilTime = Math.max(0, (e.recoilTime ?? 0) - dt);
    e.walk = (e.walk ?? 0) + dt * 12;
    if (t >= 1) {
      c.phase = "guard";
      c.hits = 0;
      // Next update prepares the charge, restoring its visible anticipation.
      this.session.record("boss-guard-restored", this.mission, this.room, {
        x: e.x,
        playerX: this.px,
      });
    }
  }
  updateRecoveryScene(dt: number, action: boolean) {
    const scene = this.recoveryScene;
    if (this.hp <= 0) {
      this.finish(false, "exhausted");
      return;
    }
    this.navigationMetrics.tick("recovery", dt);
    this.attack = this.attackBuffer = this.playerRecovery = 0;
    this.py = PLAY.floor;
    this.vy = 0;
    const walking = scene.state === "enter" || scene.state === "leave";
    if (walking) {
      const target =
        scene.state === "enter" ? INFIRMARY.teacherX : INFIRMARY.exitX;
      const d = target - this.px;
      this.face = Math.sign(d) || this.face;
      this.px += Math.sign(d) * Math.min(Math.abs(d), INFIRMARY.walk * dt);
      this.walkClock += dt * 13;
      if (Math.abs(target - this.px) < 0.01) {
        if (scene.state === "enter") {
          scene.state = "dialogue";
          this.face = 1;
        } else {
          scene.reset();
          this.direct?.cancel();
          this.session.record("care-exit", this.mission, this.room, {
            hp: this.hp,
            remaining: this.remaining,
          });
          this.changeRoom(NAV_ID.jonction, 170);
        }
      }
      return;
    }
    const before = scene.dialogue.characters;
    const result = scene.tick(dt, action);
    this.dialogueSoundWait = Math.max(0, this.dialogueSoundWait - dt);
    if (
      !action &&
      !this.dialogueSoundWait &&
      dialogueLetters(0, scene.dialogue, before, INFIRMARY.encounter)
    ) {
      this.audio.talk(2, true, (INFIRMARY.nurseX - 160) / 190);
      this.dialogueSoundWait = DIALOGUE.soundInterval;
    }
    if (result) {
      this.session.record("care-dialogue", this.mission, this.room, {
        page: scene.dialogue.page,
        result,
      });
      if (scene.dialogue.page === 2 && !scene.healed) {
        const gain = NAV_CARE.cap - this.hp;
        this.hp = NAV_CARE.cap;
        scene.healed = true;
        this.session.record("care-complete", this.mission, this.room, {
          kind: "recovery",
          gain,
          hp: this.hp,
          remaining: this.remaining,
        });
        this.audio.fx("paper", 0, 0.2);
      }
    }
  }
  vehicleDamage(x: number, y: number, side = false) {
    if (this.vehicle > 70) return;
    if (this.carArt) {
      // Marks follow the new hatch/window, leaving the readable silhouette intact.
      this.g.lineStyle(0.7, 0x1a2224);
      if (side) {
        this.g.lineBetween(x + 4, y - 11, x + 12, y - 7);
        this.g.lineBetween(x + 7, y - 5, x + 16, y - 8);
      } else {
        this.g.lineBetween(x - 5, y - 21, x + 1, y - 17);
        this.g.lineBetween(x + 1, y - 17, x - 1, y - 13);
        this.g.lineBetween(x + 1, y - 17, x + 7, y - 19);
        this.rect(x + 12, y - 10, 5, 2, 0x292c2a);
      }
      if (this.vehicle <= 40) {
        this.g.lineStyle(1.3, 0x23282b);
        this.g.lineBetween(x - 16, y - 3, x + 15, y);
        for (let i = 0; i < 5; i++) {
          const p = (this.ambienceClock * 0.8 + i / 5) % 1;
          this.g.fillStyle(0x727775, (1 - p) * 0.65);
          this.g.fillCircle(
            x + (side ? 22 : 8) + p * 8,
            y - 21 - p * 22,
            1 + p * 3,
          );
        }
      }
      return;
    }
    this.rect(x - 12, y, side ? 24 : 18, 3, 0x333b39);
    this.rect(x + 8, y - 8, 4, 6, 0x292c2a);
    if (this.vehicle <= 40) {
      this.rect(x - 9, y - 17 + Math.sin(this.age * 18) * 2, 21, 3, 0x7e5b3c);
      for (let i = 0; i < 5; i++) {
        const p = (this.age * 0.8 + i / 5) % 1;
        this.rect(
          x - 5 + p * 12,
          y - 20 - p * 30,
          4 + p * 6,
          4 + p * 5,
          0x92998c,
        );
      }
    }
  }
  bendDirection(distance = 0) {
    return Math.sin((this.travel + distance * 0.4) / 220);
  }
  curveForce() {
    // Same bend phase as the road horizon; high speed requires active counter-steering.
    return this.bendDirection() * 0.14 * (this.speed / 260) ** 1.4;
  }
  visualSpeed() {
    const rush = Math.max(0, (this.speed - 110) / 150);
    return DRIVE.motionScale * (this.speed / 3.6) * (1 + 0.65 * rush ** 1.3);
  }
  separateFighters(previousX: number) {
    const profile = this.combatProfile();
    const bounds = this.movementBounds();
    for (const e of this.enemies) {
      if (e.hp <= 0 || this.py < profile.jumpClear || (e.chargeTime ?? 0) > 0)
        continue;
      const side = previousX < e.x ? -1 : 1;
      if ((this.px - e.x) * side < profile.bodyGap) {
        this.px = Phaser.Math.Clamp(
          e.x + side * profile.bodyGap,
          bounds.min,
          bounds.max,
        );
        if (Math.abs(this.px - e.x) < profile.bodyGap)
          e.x = this.px - side * profile.bodyGap;
      }
    }
  }
  shake(duration: number, intensity: number) {
    this.cameras.main.shake(
      duration,
      this.reducedShake ? intensity * 0.2 : intensity,
    );
  }
  unlockAudio() {
    this.audio.unlock();
  }
  hurt(direction = -this.face) {
    if (this.inv > 0) return;
    this.hp--;
    this.inv = PLAY.invulnerability;
    this.attack = 0;
    this.attackHit = true;
    this.playerRecovery = PLAY.playerRecovery;
    this.playerHitDirection = direction;
    this.attackBuffer = 0;
    this.bookBlocked = 0;
    this.hitStop = PLAY.hurtStop;
    this.session.record("hurt", this.mission, this.room, {
      hp: this.hp,
      x: this.px,
    });
    this.audio.combat("hurt", direction);
    this.shake(80, 0.005);
  }
  person(x: number, y: number, c: number, book = false, enemy?: Enemy) {
    const role = book
      ? "prof"
      : enemy?.boss
        ? "inspecteur"
        : enemy?.parent
          ? "parent"
          : this.room === 6
            ? "vigile"
            : "eleve";
    const direction = book
      ? this.phase === "arrival"
        ? 1
        : this.face
      : enemy?.chargeTime
        ? enemy.chargeDir || 1
        : this.px < x
          ? -1
          : 1;
    const moving = book
      ? (this.phase === "school" &&
          !this.encounterTime &&
          (this.keys.LEFT.isDown || this.keys.RIGHT.isDown)) ||
        this.phase === "arrival"
      : !!enemy &&
        !this.encounterTime &&
        enemy.wind <= 0 &&
        enemy.recovery <= 0 &&
        enemy.stun <= 0 &&
        Math.abs(this.px - x) > 32;
    const gait = moving
      ? Math.sin(
          book
            ? this.walkClock
            : this.ambienceClock * (enemy?.chargeTime ? 20 : 9),
        ) * 3
      : 0;
    const sx =
      role === "parent"
        ? 1.22
        : role === "inspecteur"
          ? 0.92
          : role === "eleve"
            ? 0.91
            : 1;
    const sy = role === "eleve" ? 0.84 : role === "inspecteur" ? 1.08 : 1;
    const lean = enemy?.wind
      ? -2
      : enemy?.chargeTime
        ? 4
        : enemy?.stun
          ? -3
          : 0;
    const poly = (p: number[], color: number) =>
      this.shape(
        p.map((v, i) =>
          i % 2
            ? y + v * sy
            : x + direction * (v * sx + (p[i + 1] < -15 ? lean : 0)),
        ),
        color,
      );
    const r = (xx: number, yy: number, w: number, h: number, color: number) =>
      poly([xx, yy, xx + w, yy, xx + w, yy + h, xx, yy + h], color);
    this.shape(
      [x - 11, y + 1, x - 6, y - 2, x + 11, y - 1, x + 14, y + 2],
      0x080d13,
      0.7,
    );
    const kick =
      enemy?.boss && (enemy.strikeTime ?? 0) > 0 && enemy.pattern % 2 === 0;
    poly(
      [
        -5,
        -22,
        -6 + gait,
        -10,
        -7 + gait,
        0,
        -2 + gait,
        0,
        1,
        -15,
        4 - gait,
        -1,
        8 - gait,
        -1,
        5,
        -22,
      ],
      0x080d13,
    );
    poly(
      [-4, -20, -4 + gait, -3, -1 + gait, -3, 1, -20],
      role === "eleve" ? 0x526064 : 0x38494c,
    );
    if (kick) poly([1, -21, 10, -12, 30, -8, 31, -4, 8, -7, -1, -16], 0x24333b);
    r(-8 + gait, 0, 7, 2, role === "eleve" ? 0xe3d4b3 : 0x080d13);
    r(3 - gait, 0, 7, 2, role === "eleve" ? 0xe3d4b3 : 0x080d13);
    poly(
      [-5, -34, 2, -36, 7, -30, 6, -15, 9, -10, -3, -12, -8, -9, -7, -29],
      0x080d13,
    );
    const coat =
      role === "prof"
        ? 0x928269
        : role === "inspecteur"
          ? 0x141e27
          : role === "parent"
            ? 0x665e4a
            : role === "vigile"
              ? 0x24333b
              : 0x512e32;
    poly(
      [-4, -32, 1, -34, 5, -29, 4, -14, 6, -12, -2, -14, -6, -12, -5, -28],
      coat,
    );
    poly([-4, -32, 0, -28, -2, -15, -6, -12], 0x45443a);
    if (role === "prof" || role === "inspecteur") {
      poly([1, -33, 4, -29, 2, -21, -1, -28], 0xe3d4b3);
      poly([1, -29, 3, -27, 2, -19, 0, -22], 0x854538);
    }
    poly(
      [-4, -44, 2, -46, 6, -42, 5, -38, 7, -36, 3, -33, -3, -35, -5, -40],
      0x080d13,
    );
    poly(
      [-2, -42, 3, -43, 4, -38, 6, -36, 2, -34, -2, -36],
      role === "vigile" ? 0x928269 : 0xb9aa89,
    );
    poly([-3, -42, 0, -43, 0, -36, -2, -37], 0x665e4a);
    r(3, -40, 2, 1, 0x080d13);
    if (role === "prof") {
      r(-3, -45, 6, 2, 0x758080);
      r(-2, -40, 7, 1, 0x080d13);
      r(0, -40, 3, 3, 0x24333b);
      r(1, -39, 1, 1, 0xb9aa89);
      r(-5, -22, 3, 5, 0x665e4a);
      r(-11, -20, 1, 11, 0x080d13);
      r(-14, -13, 8, 11, 0x45443a);
      r(-13, -12, 6, 2, 0x928269);
      const swing = this.attack > 0.34 ? -7 : this.attack > 0.17 ? 23 : 10,
        by = this.attack > 0.34 ? -39 : this.attack > 0.17 ? -29 : -24;
      // Forearm and book share one hand anchor, including the back-swing.
      poly(
        [3, -29, 6, -27, swing, by + 8, swing - 1, by + 11, 3, -23],
        0x665e4a,
      );
      r(swing - 3, by - 2, 11, 15, 0x080d13);
      r(swing - 2, by - 1, 9, 13, 0x854538);
      r(swing, by, 6, 10, 0xe3d4b3);
      r(swing + 1, by + 3, 4, 1, 0x665e4a);
      r(swing + 1, by + 5, 3, 1, 0x665e4a);
      r(swing - 2, by - 1, 2, 13, 0x512e32);
      r(swing - 2, by + 9, 4, 3, 0xb9aa89);
      if (this.attack > 0.17 && this.attack < 0.34)
        poly([12, -39, 27, -33, 31, -23, 27, -26, 23, -32], 0xe3d4b3);
    } else {
      const hit = !!enemy && (enemy.strikeTime ?? 0) > 0;
      const hand = hit ? 22 : enemy?.wind ? 3 : 10;
      poly([4, -30, 7, -28, hand, -22, hand, -18, 4, -24], coat);
      r(hand - 1, -22, 4, 4, 0xb9aa89);
      if (role === "inspecteur") {
        r(-3, -44, 3, 3, 0x758080);
        r(-2, -40, 8, 1, 0x080d13);
        r(0, -40, 3, 2, 0x24333b);
        r(5, -29, 2, 3, 0xe5ae60);
        r(-10, -20, 9, 14, 0x38494c);
        r(-9, -19, 7, 11, 0xe3d4b3);
        r(-8, -17, 5, 1, 0x854538);
        r(-8, -14, 4, 1, 0x665e4a);
        r(-7, -22, 4, 3, 0x758080);
        r(-6, -21, 2, 1, 0x080d13);
        r(-8, -11, 5, 1, 0x854538);
        r(-8, -9, 3, 1, 0x665e4a);
        r(-3, -37, 4, 1, 0x665e4a);
        r(2, -35, 3, 1, 0x080d13);
        if (!kick) {
          // Mushroom handle, metal shaft and wide rubber sole: readable rubber stamp.
          const stampY = enemy?.wind ? -34 : hit ? -20 : -28;
          poly(
            [
              hand - 3,
              stampY,
              hand - 2,
              stampY - 4,
              hand + 3,
              stampY - 4,
              hand + 5,
              stampY,
              hand + 3,
              stampY + 2,
              hand - 2,
              stampY + 2,
            ],
            0x080d13,
          );
          r(hand - 2, stampY - 3, 5, 3, 0x928269);
          r(hand, stampY + 1, 2, 5, 0x758080);
          r(hand - 6, stampY + 5, 14, 3, 0x080d13);
          r(hand - 5, stampY + 5, 12, 1, 0xb9aa89);
          r(hand - 5, stampY + 8, 12, 2, 0x854538);
          if (hit) {
            r(hand - 7, stampY + 12, 16, 1, 0xbf6648);
            r(hand - 7, stampY + 16, 16, 1, 0xbf6648);
            r(hand - 7, stampY + 12, 1, 5, 0xbf6648);
            r(hand + 8, stampY + 12, 1, 5, 0xbf6648);
          }
        }
      } else if (role === "parent") {
        poly([-4, -45, 3, -46, 5, -42, -3, -42], 0x854538);
        poly([-4, -34, 1, -31, 5, -34, 5, -30, 1, -28, -5, -31], 0x854538);
        r(hand, -26, 4, 8, 0x080d13);
        r(hand + 1, -25, 2, 5, 0x758080);
        r(hand + 1, -20, 1, 1, 0xe3d4b3);
        r(-3, -38, 4, 1, 0x665e4a);
        r(-2, -36, 5, 1, 0x45443a);
        r(-4, -21, 4, 1, 0xb9aa89);
      } else if (role === "vigile") {
        r(-5, -46, 10, 3, 0x141e27);
        r(-3, -43, 12, 1, 0x758080);
        r(3, -30, 3, 4, 0xe5ae60);
        r(-5, -29, 3, 7, 0x080d13);
        r(-4, -32, 1, 3, 0x080d13);
        r(-4, -28, 1, 3, 0x758080);
        r(-3, -25, 1, 1, 0xbf6648);
        r(-4, -23, 2, 1, 0x526064);
        r(3, -28, 2, 1, 0x141e27);
        r(-5, -15, 10, 2, 0x080d13);
        r(hand, -20, 2, 16, 0x080d13);
      } else {
        poly([-4, -44, -1, -48, 5, -46, 6, -42, 1, -43, -2, -40], 0x665e4a);
        poly([-4, -34, 0, -31, 4, -34, 5, -30, 0, -28], 0xe3d4b3);
        r(-9, -28, 4, 14, 0x141e27);
        r(-6, -32, 1, 16, 0xb9aa89);
        r(3, -27, 2, 2, 0xe5ae60);
        r(hand, -23, 2, 1, 0xe5ae60);
      }
    }
  }
  draw() {
    this.sceneFade?.clear();
    if (this.substepping) return;
    this.art?.hide();
    this.newSchoolArt?.hide();
    this.navigationArt?.hide();
    this.hallArt?.hide();
    this.bridgeArt?.hide();
    this.wingArt?.hide();
    this.stairBackdrop?.setVisible(false);
    this.centralBackdrop?.setVisible(false);
    this.technicalBackdrop?.setVisible(false);
    this.serviceBackdrop?.setVisible(false);
    this.art?.teacher.setCrop();
    this.schoolProps?.hide();
    this.courtBackdrop?.setVisible(false);
    this.arrivalBackdrop?.setVisible(false);
    this.arrivalGate?.clear();
    this.carArt?.hide();
    this.roadArt?.hide();
    this.foreground?.clear();
    if (this.sceneGraphics) this.g = this.sceneGraphics;
    this.g.clear();
    this.labels.forEach((t) => t.destroy());
    this.labels = [];
    if (
      !this.usesNewSchoolArt() &&
      !this.usesSliceArt() &&
      !this.usesCourtArt() &&
      !this.usesHallArt() &&
      !this.usesStairArt() &&
      !this.usesCentralArt() &&
      !this.usesTechnicalArt() &&
      !this.usesServiceArt() &&
      !this.usesBridgeArt() &&
      !this.usesWingArt()
    ) {
      this.rect(0, 0, 320, 240, 0x171e20);
      this.rect(5, 5, 310, 172, 0x080b10);
    }
    if (
      ["road", "free", "receive", "tow"].includes(this.phase) ||
      (this.phase === "fail" && this.brokenRoad)
    )
      this.drawRoad();
    else if (["arrival", "arrivalFade"].includes(this.phase))
      this.drawArrival();
    else if (["school", "opening", "fail"].includes(this.phase))
      this.drawSchool();
    else if (
      ["blackBefore", "course", "blackAfter", "later"].includes(this.phase)
    ) {
      this.rect(5, 5, 310, 172, 0x000000);
    } else {
      if (this.phase === "title") this.titleBackdrop();
      this.txt(46, 27, "TECHNOPROF", 29, "#533d34");
      this.txt(45, 25, "TECHNOPROF", 29, "#e6be65");
      this.txt(55, 61, "PHYSIQUE APPLIQUEE", 13);
      if (this.phase === "title") {
        this.txt(39, 103, "3 AFFECTATIONS. 2 SERVICES REQUIS.", 8, "#ede0b8");
        this.txt(42, 121, "UN LIVRE. UNE JOURNEE A TENIR.", 8, "#ede0b8");
        this.rect(48, 145, 225, 18, 0x142523);
        this.txt(
          66,
          149,
          "ENTREE : PRISE DE SERVICE",
          10,
          Math.sin(this.ambienceClock * 3) > -0.5 ? "#efd58f" : "#a8a485",
        );
      } else {
        this.txt(
          33,
          84,
          this.won >= 2 ? "MAINTIEN EN POSTE" : "RADIATION PRONONCEE",
          15,
          this.won >= 2 ? "#cce889" : "#ff716a",
        );
        this.results.forEach((r, i) =>
          this.txt(30, 108 + i * 10, `${i + 1}. ${r}`),
        );
        this.txt(
          19,
          142,
          `${this.kilometers.toFixed(1)} KM / ${this.collisions} CHOCS / ${this.punches} COUPS`,
          8,
        );
        this.txt(
          19,
          153,
          this.won >= 2
            ? "MOYENS JUGES SUFFISANTS. RECONDUCTION."
            : "LES CONTRAINTES NE SAURAIENT EXCUSER.",
          8,
          "#e6be65",
        );
        this.txt(58, 166, "ENTREE : NOUVELLE JOURNEE");
      }
    }
    if (
      [
        "road",
        "free",
        "receive",
        "arrival",
        "arrivalFade",
        "school",
        "opening",
      ].includes(this.phase)
    )
      this.sceneInk();
    this.groundSchoolActors();
    if (
      this.schoolProps &&
      ["school", "opening", "fail"].includes(this.phase) &&
      !this.brokenRoad
    ) {
      this.schoolProps.render(
        this.room,
        this.floorGaps(),
        this.art?.teacher,
        this.falling > 0,
        this.py + VIEW.actorOffsetY,
        this.mission,
        this.room >= 10 ? this.roomSpec() : undefined,
      );
    }
    if (
      this.navigationProfile &&
      ["school", "opening", "fail"].includes(this.phase)
    )
      this.navigationArt?.render(
        this.roomSpec()!,
        this.navigationCare,
        this.px,
        this.pointerMode,
        this.ambienceClock,
      );
    this.applyPresentation();
    const schoolLine =
      this.phase === "school" ? this.schoolStatus() : undefined;
    if (!this.presentationHideHud)
      drawCadre(
        this.g,
        schoolLine
          ? {
              ...this,
              boardMessage: schoolLine,
              messageTime: 1,
              destinationHUD: this.missionSpec().hud,
              classroom: this.missionSpec().classroom,
            }
          : {
              ...this,
              destinationHUD: this.missionSpec().hud,
              classroom: this.missionSpec().classroom,
            },
        this.missionSpec().meters,
      );
    else {
      this.g.fillStyle(0x080d13);
      this.g.fillRect(0, 179, 320, 61);
    }
    if (this.phase === "opening") {
      this.fadeViewport(
        Phaser.Math.Clamp((this.age - (PLAY.openingSeconds - 0.9)) / 0.9, 0, 1),
      );
    }
    if (this.phase === "course") {
      this.rect(5, 5, 310, 172, 0x000000);
      this.txt(61, 78, "Bon. Reprenons.", 17);
    }
    if (this.phase === "later") this.txt(47, 88, "Une heure plus tard...", 14);
    if (this.phase === "arrivalFade")
      this.fadeViewport(Math.min(1, this.age / 1.1));
    if (this.phase === "free" && this.returnFade > 0)
      this.fadeViewport(this.returnFade / 1.2);
    if (this.phase === "fail") {
      this.banner(
        this.vehicle <= 0 ? "PANNE / MISSION PERDUE" : "CARENCE CONSTATEE",
      );
      this.txt(
        55,
        117,
        FAILURE_LABELS[this.failureReason ?? "late"],
        10,
        "#e3d4b3",
        true,
      );
      if (this.age >= PLAY.failContinueSeconds)
        this.txt(53, 137, "ENTREE : AFFECTATION SUIVANTE", 8, "#e3d4b3", true);
    }
    if (this.phase === "school") {
      if (
        !this.falling &&
        this.schoolFade === 0 &&
        this.bossIntro === 0 &&
        this.encounterTime === 0 &&
        !this.recoveryScene.active
      )
        drawPassageHints(
          this.g,
          this.room,
          this.px,
          this.cleared.has(this.room),
          this.pointerExits(),
        );
      drawComicFX(this.g, this);
    }
    if (this.phase === "school" && this.recoveryScene.state === "dialogue")
      drawDialogue(
        this.g,
        this.room,
        1,
        INFIRMARY.nurseX,
        true,
        this.recoveryScene.dialogue,
        this.pointerMode ? "TOUCHER" : "X/F",
        INFIRMARY.encounter,
      );
    if (
      this.phase === "school" &&
      this.encounterTime > 0 &&
      this.enemies[0]?.hp > 0
    )
      drawDialogue(
        this.g,
        this.room,
        this.encounterTime,
        this.enemies[0].x,
        this.enemies[0].female,
        this.dialogue,
        this.pointerMode ? "TOUCHER" : "X/F",
        this.encounter(),
      );
    this.drawingEncounter = false;
    if (this.phase === "school" && this.schoolFade > 0)
      this.fadeViewport(this.schoolFade / 0.7);
    if (this.phase === "school" && this.roomTransition)
      this.fadeViewport(this.roomTransitionAlpha());
    if (this.phase === "tow") {
      this.banner("DEPANNAGE EN COURS");
      this.txt(45, 120, "VOITURE DE SERVICE / DEPANNAGE", 8);
    }
    for (const p of ["free", "receive", "road", "school"].includes(this.phase)
      ? this.particles
      : [])
      if (p.x > 8 && p.x < 308 && p.y > 8 && p.y < 173)
        this.rect(
          p.x,
          p.y + (this.phase === "school" ? VIEW.actorOffsetY : 0),
          3,
          2,
          p.color,
        );
    const feedback = this.direct?.feedback;
    if (
      feedback &&
      !this.paused &&
      ["school", "free", "receive", "road"].includes(this.phase)
    ) {
      const x = feedback.x,
        y = feedback.y;
      this.g.lineStyle(
        1,
        feedback.kind === "attack" ? 0xd97561 : 0xe5ae60,
        Math.min(1, feedback.life / 0.2),
      );
      this.g.strokeRect(x - 4, y - 4, 8, 8);
      this.g.lineBetween(x - 8, y, x - 5, y);
      this.g.lineBetween(x + 5, y, x + 8, y);
    }
    if (this.paused && !this.workshop && !this.syncPlayerUI) {
      this.g.fillStyle(0x080d13, 0.55);
      this.g.fillRect(7, 7, 306, 168);
      this.rect(65, 65, 190, 61, 0xb9aa89);
      this.rect(67, 67, 186, 57, 0x141e27);
      const line = (s: string, y: number, c: number) =>
        bitmap(this.g, Math.round(160 - bitmapWidth(s) / 2), y, s, c, 1);
      line("PAUSE", 75, 0xe5ae60);
      line(this.pauseReason || "SOUFFLEZ UN INSTANT", 91, 0xb9aa89);
      line("P : REPRENDRE", 110, 0xe3d4b3);
    }
    if (this.workshop) drawWorkshop(this);
    this.syncPlayerUI?.();
  }
  fadeViewport(alpha: number) {
    for (const t of this.labels) if (t.y < 179) t.setAlpha(1 - alpha);
    const overlay = this.sceneFade ?? this.g;
    overlay.fillStyle(0x000000, alpha);
    overlay.fillRect(5, 5, 310, 172);
  }
  groundSchoolActors() {
    if (this.brokenRoad || !["school", "opening", "fail"].includes(this.phase))
      return;
    // Every draw rebuilds actor poses first: the offset cannot accumulate on pause.
    for (const actor of [
      this.art?.teacher,
      this.art?.inspector,
      this.hallArt?.parent,
      this.wingArt?.student,
      this.bridgeArt?.guard,
      this.newSchoolArt?.enemy,
    ])
      if (actor?.visible) actor.setY(actor.y + VIEW.actorOffsetY);
  }
  applyPresentation() {
    const light = daylight(this.mission);
    this.schoolWear?.clear();
    if (
      this.schoolWear &&
      ["school", "opening"].includes(this.phase) &&
      this.roomSpec()?.navigation?.revision !== "A3"
    )
      drawSchoolWear(
        this.schoolWear,
        this.room,
        this.mission,
        this.ambienceClock,
        this.floorGaps(),
        this.roomSpec()?.quietFrame,
        this.roomSpec()?.quietMirror,
      );
    for (const background of [
      this.art?.backdrop,
      this.hallArt?.background,
      this.wingArt?.background,
      this.bridgeArt?.background,
      this.courtBackdrop,
      this.stairBackdrop,
      this.centralBackdrop,
      this.technicalBackdrop,
      this.serviceBackdrop,
      this.arrivalBackdrop,
      this.newSchoolArt?.background,
      this.navigationArt?.a3.background,
    ])
      background?.setTint(light.background);
    for (const actor of [
      this.art?.teacher,
      this.art?.inspector,
      this.hallArt?.parent,
      this.wingArt?.student,
      this.bridgeArt?.guard,
      this.newSchoolArt?.enemy,
      this.carArt?.sprite,
      this.navigationArt?.nurse,
    ])
      actor?.setTint(light.actor);
    this.groundContact?.clear();
    this.roadWash?.clear();
    if (
      ["free", "road", "receive", "tow"].includes(this.phase) ||
      (this.phase === "fail" && this.brokenRoad)
    ) {
      this.roadWash?.fillStyle(light.wash, light.opacity);
      this.roadWash?.fillRect(7, 7, 306, 168);
    }
    if (
      !this.groundContact ||
      this.brokenRoad ||
      !["school", "fail"].includes(this.phase)
    )
      return;
    const g = this.groundContact,
      gaps = this.floorGaps();
    // Flatten the foreground sheen without painting over the actors or signs.
    for (let y = 160; y < 175; y++) {
      g.fillStyle(0x141e27, 0.06 + (y - 160) * 0.006);
      g.fillRect(7, y, 306, 1);
    }
    const teacher = this.art?.teacher;
    if (teacher?.visible && !this.falling)
      drawContactShadow(
        g,
        teacher.x,
        this.py + VIEW.actorOffsetY,
        this.room === 4 ? 28 : this.room === 0 ? 15 : 22,
        gaps,
      );
    const enemySprite =
      this.room >= 10
        ? this.newSchoolArt?.enemy
        : this.room === 4
          ? this.art?.inspector
          : this.room === 1
            ? this.hallArt?.parent
            : this.room === 3
              ? this.wingArt?.student
              : this.room === 6
                ? this.bridgeArt?.guard
                : undefined;
    if (enemySprite?.visible)
      drawContactShadow(
        g,
        enemySprite.x,
        VIEW.floor,
        this.room === 4 ? 30 : 24,
        gaps,
        enemySprite.alpha,
      );
  }
  banner(s: string) {
    this.rect(23, 75, 274, 34, 0x101719);
    this.txt(32, 85, s, 15, "#e6be65");
  }
  titleBackdrop() {
    this.rect(7, 7, 306, 168, 0x273b40);
    for (let i = 0; i < 12; i++) {
      const x = 10 + i * 26;
      this.rect(x, 79, 24, 94, i % 2 ? 0x354641 : 0x3d4a40);
      for (let j = 0; j < 3; j++)
        this.rect(
          x + 5,
          86 + j * 28,
          12,
          16,
          (i + j) % 5 === 0 ? 0x857957 : 0x1b3034,
        );
    }
    this.rect(24, 97, 272, 34, 0x182b2c);
    for (let i = 0; i < 22; i++) this.rect(8 + i * 14, 133, 2, 41, 0x172b2b);
    this.rect(7, 139, 306, 2, 0x172b2b);
    this.txt(85, 79, "REMPLACEMENT SANS GARANTIE", 7, "#c1ba94");
  }
  roadSky(horizon: number) {
    const dusk = this.mission === 2;
    this.rect(7, 7, 306, horizon - 7, dusk ? 0x512e32 : 0x38494c);
    this.shape(
      [
        7,
        horizon - 23,
        59,
        horizon - 20,
        134,
        horizon - 28,
        207,
        horizon - 21,
        313,
        horizon - 25,
        313,
        horizon,
        7,
        horizon,
      ],
      dusk ? 0x854538 : 0x758080,
    );
    this.g.fillStyle(dusk ? 0xe5ae60 : 0xb9aa89);
    this.g.fillCircle(dusk ? 68 : 253, horizon - 25, 8);
    this.shape(
      [
        7, 15, 70, 18, 109, 14, 151, 23, 211, 17, 264, 21, 313, 15, 313, 28,
        231, 30, 163, 28, 91, 32, 7, 26,
      ],
      0x24333b,
    );
    this.hatch(8, 19, 300, 8, 0x080d13, 9);
    for (let i = 0; i < 18; i++) {
      const x = 7 + ((((i * 23 - this.travel * 0.004) % 306) + 306) % 306),
        h = 7 + ((i * 7) % 19),
        w = Math.min(17, 313 - x);
      this.shape(
        [
          x,
          horizon,
          x,
          horizon - h,
          x + w * 0.5,
          horizon - h - 3,
          x + w,
          horizon - h,
          x + w,
          horizon,
        ],
        0x24333b,
      );
      if (w > 10) {
        this.rect(x + 3, horizon - h + 3, 1, h - 4, 0x526064);
        for (let j = 0; j < 3; j++)
          this.rect(x + 7, horizon - h + 4 + j * 5, 3, 1, 0x665e4a);
      }
    }
    this.rect(7, horizon - 2, 306, 2, 0x141e27);
  }
  roomLandmark() {
    if (this.room === 0) return;
    if ([3, 6].includes(this.room)) {
      for (let i = 0; i < 3; i++) {
        const x = 24 + i * 83;
        this.rect(x, 43, 54, 68, 0x293b3c);
        this.rect(x + 3, 46, 48, 61, this.mission === 2 ? 0x8e696b : 0x829f9b);
        for (let j = 0; j < 4; j++)
          this.rect(x + 4 + j * 12, 81 - (j % 2) * 7, 10, 25, 0x546f6a);
        this.rect(x + 25, 44, 3, 65, 0xada58a);
        this.rect(x + 2, 76, 50, 3, 0xada58a);
        this.rect(x - 2, 110, 58, 3, 0xbbb293);
      }
    }
    if (this.room === 1) {
      this.rect(109, 44, 87, 38, 0x493e32);
      this.rect(112, 47, 81, 32, 0x8e8261);
      for (let i = 0; i < 5; i++) {
        this.rect(
          115 + i * 15,
          51 + (i % 2) * 5,
          11,
          18,
          i === 3 ? 0xc5ae7c : 0xc7c9a5,
        );
        this.rect(118 + i * 15, 55 + (i % 2) * 5, 5, 1, 0x768373);
      }
    }
    if (this.room === 4) {
      this.rect(32, 42, 31, 34, 0x4a473b);
      this.rect(35, 45, 25, 28, 0xbcb28f);
      this.rect(44, 48, 7, 9, 0x68796a);
      this.rect(40, 57, 15, 9, 0x525f5a);
      this.rect(37, 69, 21, 1, 0x84785d);
    }
    if ([2, 5, 7, 8].includes(this.room)) {
      for (let i = 0; i < 3; i++) {
        this.rect(20 + i * 9, 91, 4, 58, 0x66776a);
        this.rect(21 + i * 9, 92, 1, 56, 0x96a18d);
      }
      this.rect(18, 92, 27, 3, 0x354d42);
      this.rect(18, 145, 27, 3, 0x354d42);
    }
  }
  schoolAtmosphere() {
    this.roomLandmark();
    const evening = this.mission === 2;
    if (this.room === 0) {
      for (let i = 0; i < 7; i++) {
        this.rect(12 + i * 44, 40, 39, 47, 0x697568);
        this.rect(18 + i * 44, 48, 24, 22, 0x31464a);
        this.rect(29 + i * 44, 48, 2, 22, 0x8a9580);
      }
      this.rect(112, 68, 3, 89, 0x536256);
      this.rect(98, 63, 30, 20, 0xb9b59b);
      this.rect(106, 69, 13, 9, 0x7e7159);
      this.rect(109, 83, 14, 2, 0xa77454);
      this.rect(111, 85, 1, 7, 0xa49d81);
      this.rect(121, 85, 1, 4, 0xa49d81);
      this.rect(31, 139, 53, 4, 0x777458);
      this.rect(36, 143, 3, 16, 0x303e38);
      this.rect(75, 143, 3, 16, 0x303e38);
      this.rect(256, 136, 15, 22, 0x465f53);
      for (let i = 0; i < 6; i++) this.rect(15 + i * 48, 154, 7, 2, 0xada78b);
      return;
    }
    // Worn two-tone paint, damp plaster and exposed brick; stable texture per room.
    this.rect(7, 119, 306, 40, evening ? 0x34463f : 0x475c4b);
    this.rect(7, 119, 306, 2, 0x8a8970);
    for (let i = 0; i < 35; i++) {
      const x = 8 + ((i * 47 + this.room * 19) % 294);
      const y = 40 + ((i * 31 + this.room * 11) % 113);
      this.rect(x, y, 3 + (i % 7), 2 + (i % 5), i % 2 ? 0x5a6151 : 0x424d43);
    }
    for (let i = 0; i < 5; i++) {
      this.rect(169 + (i % 2) * 5, 112 + i * 6, 27 - i * 3, 4, 0x866b54);
      this.rect(177, 111 + i * 6, 1, 6, 0x373e36);
    }
    this.rect(7, 24, 306, 3, 0x39493f);
    this.rect(301, 25, 3, 132, 0x879080);
    for (const x of [58, 180]) {
      const lit =
        x === 180 ||
        Math.sin(this.ambienceClock * 8.1) + Math.sin(this.ambienceClock * 13) >
          -1.5;
      this.rect(x - 3, 28, 47, 7, 0x303c36);
      this.rect(x, 30, 39, 2, lit ? 0xe0ddac : 0x7a8269);
      if (lit) {
        this.g.fillStyle(0xd2d397, 0.035);
        this.g.fillTriangle(x, 35, x - 25, 155, x + 62, 155);
      }
    }
    this.rect(235, 49, 18, 25, 0x283d39);
    this.rect(237, 51, 14, 21, 0xb7ac88);
    this.rect(240, 54, 8, 2, 0x8f624b);
    this.rect(240, 59, 7, 1, 0x6d755f);
    this.rect(240, 63, 7, 1, 0x6d755f);
    if (this.room === 1)
      this.txt(108, 38, "L'EXCELLENCE A MOINDRE COUT", 7, "#d1c79f");
    if (this.room === 3)
      this.txt(53, 49, "ICI, ON APPREND ENCORE.", 7, "#d5cfa7");
    this.rect(82, 158, 28, 1, 0xa2afa0);
  }
  drawRoad() {
    const horizon = 67 + Math.sin(this.travel / 950) * 3,
      bottom = 169;
    // One depth projection for road, markings, traffic and verges.
    const project = (d: number, lane = 0) =>
      roadProjection(this.travel, d, lane);
    this.rect(7, 7, 306, 168, [0x7d9daa, 0x9cb3a5, 0x815762][this.mission]);
    if (this.roadArt)
      this.roadArt.sky(
        horizon,
        54 * this.bendDirection(),
        this.ambienceClock,
        this.mission,
      );
    else this.roadSky(horizon);
    this.rect(
      7,
      horizon,
      306,
      175 - horizon,
      [0x414b3c, 0x4c5140, 0x303d3b][this.mission],
    );
    for (let y = Math.ceil(horizon + 1); y <= 175; y++) {
      const scale = (Math.min(y, bottom) - horizon) / (bottom - horizon),
        d = DRIVE.focal / scale - DRIVE.focal,
        c = project(d).x,
        half = DRIVE.roadHalfPixels * scale;
      const worldZ = this.travel + d;
      const district = vergeZone(worldZ);
      const address = Math.floor((worldZ - 18) / 30);
      const open = openAddress(Math.max(0, address));
      this.rect(
        7,
        y,
        306,
        1,
        [0x45443a, 0x526064, 0x454b3a, 0x3d4445][district],
      );
      for (const side of [-1, 1]) {
        const a = c + side * half,
          b = c + side * (half + 24 * scale);
        const l = Math.max(7, Math.min(a, b)),
          r = Math.min(313, Math.max(a, b));
        if (r > l)
          this.rect(
            l,
            y,
            r - l,
            1,
            open
              ? 0x686858
              : worldZ % 30 > 23
                ? 0x45443a
                : Math.floor(worldZ / 5) % 7 === 0
                  ? 0x526064
                  : 0x928269,
          );
      }
      const left = Math.max(7, c - half),
        right = Math.min(313, c + half);
      if (right > left)
        this.rect(
          left,
          y,
          right - left,
          1,
          Math.floor(worldZ / 31) % 7 === 0 ? 0x526064 : 0x38494c,
        );
      for (const side of [-1, 1]) {
        const edge = c + side * (half - 3 * scale);
        if (edge > 8 && edge < 309) {
          this.rect(edge, y, Math.max(1, 5 * scale), 1, 0x141e27);
          if (worldZ % 38 < 2.6)
            this.rect(
              edge - 3 * scale,
              y,
              Math.max(1, 6 * scale),
              1,
              Math.floor(worldZ * 5) % 2 ? 0x758080 : 0x080d13,
            );
        }
        if (open) {
          const grass =
            c + side * (half + (30 + (Math.floor(worldZ / 3) % 7)) * scale);
          if (grass > 8 && grass < 309)
            this.rect(
              grass,
              y,
              Math.max(1, 4 * scale),
              1,
              Math.floor(worldZ) % 3 === 0 ? 0x8b8262 : 0x656a50,
            );
        }
      }
      if (worldZ % 53 < 5) {
        const patch = c + half * 0.22,
          width = half * 0.23;
        if (patch > 8 && patch + width < 312)
          this.rect(patch, y, width, 1, 0x24333b);
      }
      for (const lane of [-1, 1])
        this.rect(c + lane * half - 1, y, Math.max(1, 2 * scale), 1, 0xc2bba4);
      if (Math.floor((this.travel + d) / 7) % 5 === 0) {
        this.rect(c + half * 0.42, y, Math.max(1, scale * 7), 1, 0x252d30);
        this.rect(c - half * 0.6, y, Math.max(1, scale * 4), 1, 0x424b48);
      }
      if (Math.floor((this.travel + d) / 12) % 2 === 0)
        this.rect(c - scale, y, Math.max(1, 2 * scale), 1, 0xd1ccad);
    }

    drawRoadWear(this.g, this.travel, project);
    const scenery = [];
    // Immutable world anchors: types depend on the object, never on camera position.
    const first = Math.floor(this.travel / 45);
    for (let id = first; id <= first + 12; id++) {
      const z = id * 45 + 12 + ((id * 17) % 23),
        d = z - this.travel;
      if (d < 0 || d > 540) continue;
      scenery.push({
        d,
        lane: (id % 2 ? -1 : 1) * (1.48 + (id % 3) * 0.18),
        kind: [0, 4, 1, 2, 5, 1, 4, 0, 6, 3, 1, 4][id % 12],
      });
    }
    if (this.roadArt) {
      scenery.length = 0;
      scenery.push(
        ...districtAnchors(this.travel, this.missionSpec().district),
      );
    }
    const renderScenery = (t: Scenery) => {
      const p = roadsideProjection(this.travel, t.d, t.lane);
      if (t.kind === 6) {
        drawRoadBridge(this.g, this.travel, t.d, t.variant ?? 0);
        return;
      }
      if (this.roadArt && t.kind === 7) {
        const frame = t.variant ?? 0,
          width = [160, 195, 150, 90, 115, 42][frame] * p.scale;
        if (p.x + width / 2 < 7 || p.x - width / 2 > 313) return;
        this.roadArt.draw("verge", frame, p.x, p.y, width, t.lane > 0);
        return;
      }
      if (this.roadArt && t.kind !== 6) {
        const frame =
          t.kind === 1 ? 0 : t.kind === 2 ? 1 : t.kind === 4 ? 2 : 3;
        const width = [150, 64, 29, 115][frame] * p.scale;
        if (p.x + width / 2 < 7 || p.x - width / 2 > 313) return;
        this.roadArt.draw("district", frame, p.x, p.y, width, t.lane > 0);
        return;
      }
      if (t.kind !== 6 && (p.x < 10 || p.x > 304)) return;
      this.g.save();
      if (t.kind !== 6 && t.lane > 0) {
        this.g.translateCanvas(p.x, 0);
        this.g.scaleCanvas(-1, 1);
        this.g.translateCanvas(-p.x, 0);
      }
      try {
        const local = (
          dx: number,
          dy: number,
          w: number,
          h: number,
          c: number,
        ) =>
          this.rect(
            p.x + dx * p.scale,
            p.y + dy * p.scale,
            w * p.scale,
            h * p.scale,
            c,
          );
        if (t.kind === 4) {
          local(-1, -77, 3, 77, 0x566668);
          local(-2, -78, 20, 3, 0x667776);
          local(13, -75, 9, 3, 0xc1b685);
          local(-4, -3, 8, 3, 0x384546);
          local(0, -70, 1, 64, 0x928269);
          local(-2, -17, 4, 8, 0x24333b);
          local(-1, -15, 1, 3, 0xb9aa89);
          local(13, -74, 8, 1, 0xe3d4b3);
          local(19, -78, 2, 3, 0x080d13);
          return;
        }
        if (t.kind === 5) {
          local(-9, -65, 4, 65, 0x666d64);
          local(10, -65, 4, 65, 0x4c5953);
          local(-23, -89, 48, 25, 0x828576);
          local(-26, -92, 54, 4, 0x404d4b);
          local(-20, -85, 42, 2, 0xa1a088);
          local(-8, -35, 20, 3, 0x46554e);
          local(15, -85, 2, 80, 0x24333b);
          local(21, -85, 2, 80, 0x24333b);
          for (let i = 0; i < 12; i++) local(16, -81 + i * 6, 6, 1, 0x928269);
          local(-21, -79, 4, 10, 0x665e4a);
          local(-20, -71, 3, 7, 0x854538);
          local(-5, -85, 13, 6, 0xb9aa89);
          local(-3, -83, 9, 1, 0x24333b);
          return;
        }
        if (t.kind === 1) {
          this.shape(
            [
              p.x + 20 * p.scale,
              p.y - 45 * p.scale,
              p.x + 33 * p.scale,
              p.y - 38 * p.scale,
              p.x + 33 * p.scale,
              p.y - 3 * p.scale,
              p.x + 20 * p.scale,
              p.y,
            ],
            0x24333b,
          );

          this.rect(
            p.x - 20 * p.scale,
            p.y - 45 * p.scale,
            40 * p.scale,
            45 * p.scale,
            0x807b65,
          );
          this.rect(
            p.x - 23 * p.scale,
            p.y - 48 * p.scale,
            46 * p.scale,
            6 * p.scale,
            0x4c4943,
          );
          for (let i = 0; i < 3; i++)
            this.rect(
              p.x + (-14 + i * 11) * p.scale,
              p.y - 35 * p.scale,
              7 * p.scale,
              11 * p.scale,
              0x293f42,
            );
          for (let row = 0; row < 5; row++)
            for (let col = 0; col < 4; col++)
              local(
                -18 + col * 10 + (row % 2) * 3,
                -29 + row * 5,
                5,
                1,
                0x45443a,
              );
          local(-20, -17, 40, 17, 0x5c6155);
          local(-5, -20, 10, 20, 0x2b3b3b);
          local(-22, -27, 44, 5, 0xa27854);
          local(10, -55, 5, 7, 0x575148);
          local(-17, -12, 8, 5, 0xc4a476);
          return;
        }
        if (t.kind === 2) {
          this.rect(
            p.x,
            p.y - 23 * p.scale,
            2 * p.scale,
            23 * p.scale,
            0x999783,
          );
          this.rect(
            p.x - 12 * p.scale,
            p.y - 25 * p.scale,
            27 * p.scale,
            10 * p.scale,
            0x597b69,
          );
          return;
        }
        if (t.kind === 3) {
          local(-12, -10, 18, 4, 0x93917a);
          this.rect(
            p.x - 17 * p.scale,
            p.y - 6 * p.scale,
            34 * p.scale,
            6 * p.scale,
            0x797765,
          );
          return;
        }
        const tree = (pts: number[], c: number) =>
          this.shape(
            pts.map((v, i) => (i % 2 ? p.y + v * p.scale : p.x + v * p.scale)),
            c,
          );
        tree(
          [
            -3, 0, -2, -34, -10, -43, -7, -44, 0, -35, 3, -54, 5, -53, 3, -29,
            8, -38, 10, -38, 4, -24, 3, 0,
          ],
          0x141e27,
        );
        tree(
          [
            0, -61, -8, -49, -4, -49, -15, -37, -9, -38, -18, -26, -8, -27, -13,
            -20, 15, -22, 9, -31, 16, -31, 7, -42, 10, -43,
          ],
          0x24333b,
        );
        tree(
          [0, -58, -5, -48, 1, -50, -9, -38, -3, -39, -10, -29, 1, -33, 5, -45],
          0x45443a,
        );
      } finally {
        this.g.restore();
      }
    };
    const renderTraffic = (o: { z: number; x: number; type: number }) => {
      const d = o.z - this.travel;
      if (d < 0 || d > DRIVE.visibleDistance) return;
      const p = project(d, o.x),
        w = trafficWidth(o.type) * p.scale,
        h = (o.type === 1 ? 43 : 27) * p.scale;
      if (this.roadArt) {
        this.roadArt.draw(
          "traffic",
          o.type === 1 ? 2 : o.type === 2 ? 1 : 0,
          p.x,
          p.y,
          trafficWidth(o.type) * p.scale,
        );
        return;
      }
      if (o.type === 1) this.rect(p.x - w / 2, p.y - h, w, h, 0xada884);
      if (o.type === 1) {
        this.rect(p.x - w / 2, p.y - h, w, h * 0.78, 0xb8b6a1);
        this.rect(
          p.x - 1 * p.scale,
          p.y - h + 3 * p.scale,
          2 * p.scale,
          h * 0.7,
          0x6d776f,
        );
        for (let i = 0; i < 4; i++)
          this.rect(
            p.x - w * 0.43,
            p.y - h + (8 + i * 7) * p.scale,
            w * 0.86,
            1 * p.scale,
            0x8d9587,
          );
        this.rect(
          p.x - w * 0.45,
          p.y - 5 * p.scale,
          w * 0.9,
          3 * p.scale,
          0x333e3d,
        );
      } else {
        this.rearCar(p.x, p.y, w, h * 0.82, o.type === 2 ? 0x526064 : 0x854538);
      }
      this.g.lineStyle(Math.max(0.5, p.scale), 0x162127);
      if (o.type === 1) {
        this.g.strokeRect(p.x - w / 2, p.y - h, w, h);
        for (const side of [-1, 1]) {
          this.rect(
            p.x + side * w * 0.22,
            p.y - h * 0.9,
            p.scale,
            h * 0.55,
            0x24333b,
          );
          this.rect(
            p.x + side * w * 0.22 - p.scale,
            p.y - h * 0.4,
            3 * p.scale,
            2 * p.scale,
            0x758080,
          );
        }
        this.rect(
          p.x - w * 0.25,
          p.y - h * 0.9,
          w * 0.5,
          4 * p.scale,
          0x38494c,
        );
        this.rect(p.x - w * 0.16, p.y - h * 0.86, w * 0.32, p.scale, 0xb9aa89);
      }
      for (const side of [-1, 1])
        this.rect(
          p.x + side * w * 0.35 - 2 * p.scale,
          p.y - 8 * p.scale,
          4 * p.scale,
          2 * p.scale,
          0xf0a16e,
        );
      this.rect(
        p.x - w / 2,
        p.y - 4 * p.scale,
        5 * p.scale,
        5 * p.scale,
        0x14171a,
      );
      this.rect(
        p.x + w / 2 - 5 * p.scale,
        p.y - 4 * p.scale,
        5 * p.scale,
        5 * p.scale,
        0x14171a,
      );
    };
    const layers = [
      ...scenery.map((t) => ({ d: t.d, render: () => renderScenery(t) })),
      ...this.obstacles.map((o) => ({
        d: o.z - this.travel,
        render: () => renderTraffic(o),
      })),
    ];
    const ground = this.g;
    layers
      .sort((a, b) => b.d - a.d)
      .forEach((layer, index) => {
        if (this.roadArt) this.g = this.roadArt.layer(index);
        layer.render();
      });
    this.g = ground;

    for (const m of this.tireMarks) {
      if (m.x > 8 && m.x < 309)
        this.rect(m.x, m.y, 2, Math.min(5, 176 - m.y), 0x252a2b);
    }
    const x = project(0, this.car).x;
    // Body lean follows steering; each view retains the car's permanent asymmetry.
    const lean = Math.max(-2, Math.min(2, this.steerVelocity * 2));
    if (this.carArt && this.foreground) {
      this.carArt.rear(
        x,
        this.speed,
        this.steerVelocity,
        this.ambienceClock,
        this.vehicle,
      );
      this.g = this.foreground;
    } else this.rearCar(x, 169, DRIVE.playerWidth, 32, 0x928269, lean, true);
    if (this.shoulder > 0 && this.speed > 10) {
      const wheel = x + Math.sign(this.car) * 17;
      for (let i = 0; i < 5; i++) {
        const drift = (this.ambienceClock * 4 + i * 0.21) % 1;
        this.g.fillStyle(0xb9aa89, (1 - drift) * this.shoulder * 0.5);
        this.g.fillRect(
          wheel + Math.sign(this.car) * drift * 9,
          164 + drift * 8,
          1 + drift * 3,
          1 + drift * 2,
        );
      }
    }
    if (this.keys.DOWN.isDown) {
      for (const [kind, fallback] of [
        ["leftLamp", x - 14.5],
        ["rightLamp", x + 14.5],
      ] as const) {
        const lamp = this.carArt?.anchor(kind) ?? { x: fallback, y: 156 };
        this.rect(lamp.x - 2, lamp.y - 1, 4, 2, 0xff7352);
      }
    }
    const exhaust = (this.ambienceClock * 4) % 1;
    if (this.speed > 5) {
      const pipe = this.carArt?.anchor("exhaust") ?? { x: x - 12, y: 168 };
      this.rect(pipe.x - exhaust * 4, pipe.y + exhaust * 4, 3, 2, 0x9a9b89);
    }
    this.vehicleDamage(x, 165);
  }
  drawArrival() {
    if (this.arrivalBackdrop && this.art && this.carArt && this.foreground) {
      this.drawPulpArrival();
      return;
    }
    const t = this.phase === "arrivalFade" ? 5.8 : this.age;
    this.rect(7, 7, 306, 168, [0x859ea6, 0xa7b2a0, 0x755b69][this.mission]);
    this.rect(87, 35, 216, 76, 0x898674);
    this.rect(83, 31, 224, 6, 0x414c47);
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 8; col++) {
        const x = 95 + col * 25,
          y = 44 + row * 29;
        this.rect(x, y, 15, 20, 0x354b50);
        this.rect(x + 6, y, 2, 20, 0x6c7c76);
      }
    for (let i = 0; i < 16; i++)
      this.rect(91 + i * 13, 39 + (i % 3) * 24, 3, 15, 0x676e60);
    this.rect(179, 47, 9, 2, 0x111e24);
    this.rect(182, 49, 2, 12, 0x111e24);
    this.rect(119, 85, 177, 15, 0xc6b99b);
    this.txt(125, 89, "COLLEGE C. HANOUNA", 9, "#313d37");
    this.rect(7, 110, 306, 30, 0x65716a);
    this.rect(7, 140, 306, 35, 0x454b4e);
    this.rect(7, 138, 306, 3, 0xb5af98);
    for (let x = 10; x < 310; x += 39) this.rect(x, 164, 20, 2, 0xbcbba4);
    const gateOpen = t > 3.8;
    for (let x = 12; x < 312; x += 10) {
      if (x > 218 && x < 258) continue;
      this.rect(x, 101, 2, 37, 0x293e39);
    }
    this.rect(7, 107, 211, 2, 0x293e39);
    this.rect(260, 107, 53, 2, 0x293e39);
    this.rect(214, 95, 6, 45, 0x424f45);
    this.rect(259, 95, 6, 45, 0x424f45);
    if (!gateOpen) {
      for (let x = 223; x < 256; x += 8) this.rect(x, 102, 2, 35, 0x293e39);
      this.rect(220, 109, 39, 2, 0x293e39);
    } else {
      this.rect(218, 101, 6, 36, 0x293e39);
      this.rect(255, 101, 5, 36, 0x293e39);
    }
    // The vehicle decelerates into a fixed parking place in this side-on shot.
    const p = Math.min(1, t / 1.8),
      carX = 40 + 71 * (1 - (1 - p) ** 3);
    if (this.carArt && this.foreground) {
      this.carArt.side(carX);
      this.g = this.foreground;
    } else {
      this.shape(
        [
          carX - 34,
          147,
          carX - 33,
          134,
          carX - 23,
          132,
          carX - 14,
          120,
          carX + 12,
          120,
          carX + 23,
          131,
          carX + 34,
          134,
          carX + 35,
          147,
        ],
        0x080d13,
      );
      this.shape(
        [
          carX - 31,
          144,
          carX - 30,
          135,
          carX - 21,
          134,
          carX - 12,
          122,
          carX + 10,
          122,
          carX + 22,
          133,
          carX + 32,
          135,
          carX + 32,
          144,
        ],
        0x928269,
      );
      this.shape(
        [carX - 18, 132, carX - 11, 124, carX + 9, 124, carX + 17, 132],
        0x141e27,
      );
      this.rect(carX, 124, 2, 9, 0x758080);
      this.rect(carX - 31, 138, 63, 2, 0xb9aa89);
      for (const dx of [-21, 23]) {
        this.g.fillStyle(0x080d13);
        this.g.fillCircle(carX + dx, 147, 6);
        this.g.fillStyle(0x758080);
        this.g.fillCircle(carX + dx, 147, 2);
      }
      this.hatch(carX - 15, 141, 31, 4);
      this.rect(carX - 12, 135, 16, 9, 0x665e4a);
      this.rect(carX - 10, 137, 12, 5, 0xe3d4b3);
      this.rect(carX - 8, 139, 8, 1, 0x24333b);
      this.rect(carX - 28, 141, 8, 2, 0x854538);
      this.rect(carX + 13, 140, 7, 3, 0x854538);
      this.rect(carX - 9, 121, 1, 12, 0x758080);
      this.rect(carX + 5, 136, 4, 1, 0x080d13);
      this.rect(carX - 18, 115, 1, 8, 0x080d13);
    }
    this.vehicleDamage(carX, 146, true);
    if (t > 1.9 && t < 2.8) {
      this.rect(carX + 2, 131, 21, 18, 0xdbc094);
      this.rect(carX + 4, 133, 16, 7, 0x354d55);
    }
    // Exit with the book, walk to the opening, then recede into the courtyard.
    if (t > 2.25) {
      const walk = Math.min(1, (t - 2.25) / 2.35),
        x = carX + 13 + (239 - carX - 13) * walk,
        depth = Math.max(0, Math.min(1, (t - 4.6) / 1.2));
      const y = 145 - depth * 27;
      this.person(x, y, 0x9f855c, true);
      if (walk < 1) {
        this.rect(x - 6 + Math.sin(t * 15) * 2, y - 3, 4, 5, 0x191c23);
      }
    }
  }
  drawPulpArrival() {
    if (this.mission > 0 && this.newSchoolArt && this.carArt && this.art) {
      this.newSchoolArt.arrival(this);
      this.g = this.foreground!;
      const t = this.phase === "arrivalFade" ? 5.8 : this.age;
      this.vehicleDamage(
        40 + 71 * (1 - (1 - Math.min(1, t / 1.8)) ** 3),
        146,
        true,
      );
      return;
    }
    const t = this.phase === "arrivalFade" ? 5.8 : this.age;
    this.arrivalBackdrop!.setVisible(true);
    const p = Math.min(1, t / 1.8),
      carX = 40 + 71 * (1 - (1 - p) ** 3);
    this.carArt!.side(carX);
    this.g = this.foreground!;
    this.vehicleDamage(carX, 146, true);
    this.txt(181, 62, "COLLEGE C. HANOUNA", 7, "#e3d4b3", true);
    // The gate pivots at the actual masonry opening, before the teacher arrives.
    const gate = this.arrivalGate!;
    const opening = Phaser.Math.Clamp((t - 3.65) / 0.7, 0, 1);
    const width = 29 * (1 - opening) + 3 * opening;
    for (const side of [-1, 1]) {
      const hinge = side === -1 ? 190 : 252;
      const end = hinge - side * width;
      gate.lineStyle(1.1, 0x17292c);
      gate.lineBetween(hinge, 94, end, 94 + opening * 3);
      gate.lineBetween(hinge, 123, end, 123 + opening * 3);
      for (let bar = 0; bar <= 6; bar++) {
        const x = hinge - (side * width * bar) / 6;
        gate.lineBetween(x, 91 + opening * bar * 0.5, x, 128);
      }
      gate.lineStyle(0.45, 0x79837a);
      gate.lineBetween(hinge, 94, end, 94 + opening * 3);
    }
    if (t > 2.25) {
      const walk = Phaser.Math.Clamp((t - 2.25) / 2.35, 0, 1);
      const recede = Phaser.Math.Clamp((t - 4.6) / 1.2, 0, 1);
      const x = 129 + (220 - 129) * walk;
      const approach = Phaser.Math.Clamp((walk - 0.38) / 0.62, 0, 1);
      const feet = 154 - 24 * approach - 19 * recede;
      const frame = [1, 2, 3, 2][Math.floor(t * 7) % 4];
      const teacher = this.art!.pose("prof", frame, x, feet, 1);
      teacher
        .setDepth(3.15)
        .setScale(0.105 * (1 - 0.2 * recede))
        .setAlpha(Math.min(1, (t - 2.25) / 0.22));
    }
  }
  drawHall() {
    this.hallArt!.background.setVisible(true);

    if (this.py < 202) this.art!.drawTeacher(this, 0.18);
    const e = this.enemies.find(
      (e) => e.parent && (e.hp > 0 || (e.downTime ?? 0) > 0),
    );
    if (e) {
      const facing =
        (e.chargeTime ?? 0) > 0 || e.wind > 0
          ? (e.chargeDir ?? 1)
          : Math.sign(this.px - e.x) || 1;
      this.hallArt!.pose(
        e.hp <= 0 || e.stun > 0 || e.recovery > 0
          ? 3
          : (e.chargeTime ?? 0) > 0
            ? 2
            : e.wind > 0
              ? 1
              : 0,
        e.x,
        facing,
      );
      this.art!.reactEnemy(this.hallArt!.parent, e, facing);
    }
  }
  drawTechnical() {
    this.technicalBackdrop!.setVisible(true);
    if (this.py < 202) this.art!.drawTeacher(this, 0.18);
  }
  drawService() {
    this.serviceBackdrop!.setVisible(true);
    if (this.py < 202) this.art!.drawTeacher(this, 0.18);
  }
  drawWing() {
    this.wingArt!.background.setVisible(true);
    if (this.py < 202) this.art!.drawTeacher(this, 0.18);

    const e = this.enemies[0];
    if (e && (e.hp > 0 || (e.downTime ?? 0) > 0)) {
      const facing =
        e.wind > 0 || e.recovery > 0 || e.stun > 0 || e.hp <= 0
          ? (e.facing ?? -1)
          : Math.sign(this.px - e.x) || -1;
      const frame =
        e.hp <= 0 || e.stun > 0
          ? 3
          : e.wind > 0
            ? 1
            : (e.strikeTime ?? 0) > 0
              ? 2
              : 0;
      this.wingArt!.pose(
        frame,
        e.x,
        facing,
        e.hp <= 0 ? Math.min(1, e.downTime ?? 0) : 1,
      );
      this.art!.reactEnemy(this.wingArt!.student, e, facing);
    }
  }
  drawBridge() {
    this.bridgeArt!.background.setVisible(true);
    if (this.py < 202) this.art!.drawTeacher(this, 0.18);

    const e = this.enemies[0];
    if (e && (e.hp > 0 || (e.downTime ?? 0) > 0)) {
      const facing =
        e.wind > 0 || e.recovery > 0 || e.stun > 0 || e.hp <= 0
          ? (e.facing ?? -1)
          : Math.sign(this.px - e.x) || -1;
      const frame =
        e.hp <= 0 || e.stun > 0
          ? 3
          : e.wind > 0
            ? 1
            : (e.strikeTime ?? 0) > 0
              ? 2
              : 0;
      this.bridgeArt!.pose(
        frame,
        e.x,
        facing,
        e.hp <= 0 ? Math.min(1, e.downTime ?? 0) : 1,
      );
      this.art!.reactEnemy(this.bridgeArt!.guard, e, facing);
    }
  }
  drawCentralStair() {
    this.centralBackdrop!.setVisible(true);
    if (this.py < 202) this.art!.drawTeacher(this, 0.18);
  }
  drawAnnexStair() {
    this.stairBackdrop!.setVisible(true);
    if (this.py < 202) this.art!.drawTeacher(this, 0.18);
  }
  drawCourtyard() {
    this.courtBackdrop!.setVisible(true);
    if (this.py < 202) this.art!.drawTeacher(this, 0.13);
  }
  drawSliceSchool() {
    this.art!.render(this);
    if (this.artReview >= 0) {
      this.art!.pose("prof", this.artReview, 80, 159, this.reviewFacing);
      this.art!.pose("inspecteur", this.artReview, 220, 159, this.reviewFacing);
      this.txt(
        14,
        10,
        `POSE ${this.artReview + 1}/8 - ${this.reviewFacing > 0 ? "DROITE" : "GAUCHE"}`,
        8,
        "#e3d4b3",
        true,
      );
    }

    const e = this.enemies.find((e) => e.boss && e.hp > 0);
    if (e) {
      this.rect(108, 27, 104, 3, 0x141e27);
      this.rect(108, 27, (104 * e.hp) / (6 + this.mission), 3, 0xb9aa89);
      if (this.phase === "school" && e.wind > 0)
        this.txt(
          107,
          33,
          e.pattern % 2 === 0 ? "BALAYAGE !" : "TAMPON !",
          9,
          "#e5ae60",
          true,
        );
      else if (this.phase === "school" && e.recovery > 0)
        this.txt(111, 33, "OUVERTURE", 9, "#e3d4b3", true);
    }
  }
  drawSchool() {
    if (this.usesNewSchoolArt()) {
      this.newSchoolArt!.render(this, this.roomSpec());
      if (this.roomSpec()?.navigation?.revision === "A3")
        this.newSchoolArt!.background.setVisible(false);
      return;
    }
    if (this.usesWingArt()) {
      this.drawWing();
      return;
    }
    if (this.usesBridgeArt()) {
      this.drawBridge();
      return;
    }
    if (this.usesServiceArt()) {
      this.drawService();
      return;
    }
    if (this.usesTechnicalArt()) {
      this.drawTechnical();
      return;
    }
    if (this.usesCentralArt()) {
      this.drawCentralStair();
      return;
    }
    if (this.usesStairArt()) {
      this.drawAnnexStair();
      return;
    }
    if (this.usesHallArt()) {
      this.drawHall();
      return;
    }
    if (this.usesCourtArt()) {
      this.drawCourtyard();
      return;
    }
    if (this.usesSliceArt()) {
      this.drawSliceSchool();
      return;
    }
    this.rect(7, 7, 306, 167, [0x3d443e, 0x474a3f, 0x272f33][this.mission]);
    if (this.room === 0) {
      this.rect(7, 7, 306, 65, 0x849a9c);
      for (let x = 10; x < 312; x += 25) {
        this.rect(x, 80, 3, 79, 0x303d3c);
        this.rect(x, 100, Math.min(25, 313 - x), 2, 0x303d3c);
      }
      this.txt(160, 64, "ENTREE C >", 12);
    } else {
      for (let i = 0; i < 12; i++) {
        let x = 8 + i * 26;
        this.rect(x, 30, 1, 129, 0x404d48);
        this.rect(x + 4, 53 + (i % 3) * 28, 13, 3, 0x50574e);
        this.rect(x + 9, 110, 7, 26, 0x48524a);
      }
    }
    this.schoolAtmosphere();
    if (this.room === 0) {
      for (let i = 0; i < 7; i++) {
        const x = 12 + i * 43;
        this.shape([x, 39, x + 3, 39, x + 3, 84, x - 2, 90], 0x24333b);
        this.rect(x + 3, 85, 31, 2, 0xb9aa89);
        this.hatch(x + 6, 88, 25, 12, 0x080d13, 4);
        for (let j = 0; j < 3; j++)
          this.rect(x + 7 + j * 7, 102 + (i % 3) * 8, 5, 1, 0x665e4a);
      }
      this.shape(
        [173, 89, 175, 94, 172, 101, 177, 110, 174, 117, 175, 112, 170, 101],
        0x080d13,
      );
    }

    // Long cast shadows and exposed brick replace flat pastel wall expanses.
    if (this.room !== 0) {
      this.shape([7, 35, 71, 35, 124, 151, 90, 151], 0x080d13, 0.24);
      this.shape([190, 34, 207, 34, 264, 151, 228, 151], 0x080d13, 0.3);
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 5 - row; col++) {
          const bx = 14 + col * 11 + (row % 2) * 5,
            by = 111 + row * 8;
          this.rect(bx, by, 9, 6, row % 2 ? 0x665e4a : 0x45443a);
          this.rect(bx, by + 5, 9, 1, 0x080d13);
        }
      this.hatch(130, 124, 64, 25, 0x080d13, 4);
    }

    this.rect(7, 160, 306, 15, 0x343c38);
    for (let i = 0; i < 22; i++) {
      this.rect(9 + i * 14, 164, 12, 1, 0x586359);
    }
    if (this.room !== 0) {
      this.rect(92, 33, 3, 66, 0x475a4c);
      this.rect(86, 150, 17, 8, 0x82968b);
      this.rect(83, 157, 25, 2, 0x748b80);
      this.rect(93, 40 + ((this.age * 34) % 107), 1, 4, 0xadc5b1);
      const signs: Record<number, [string, string]> = {
        1: ["VIE SCOLAIRE", "GUICHET FERME"],
        2: ["ESCALIER A", "ACCES CONDAMNE"],
        3: ["SCIENCES / C", "40C - 42C  >"],
        4: ["42C / PHYSIQUE", "CAPACITE : 24"],
        5: ["ANNEXE 1978", "2e ETAGE  ^"],
        6: ["PASSERELLE", "BADGE REQUIS"],
        7: ["ESCALIER B", "AILE C / BAS"],
        8: ["CHANTIER", "PLANCHER FRAGILE"],
      };
      const sign = signs[this.room];
      if (sign) {
        this.rect(13, 51, 91, 26, 0x080d13);
        this.rect(15, 53, 87, 22, 0xb9aa89);
        this.rect(
          15,
          53,
          3,
          22,
          this.room === 8 || this.room === 2 ? 0x854538 : 0x38494c,
        );
        this.txt(21, 56, sign[0], 7, "#141e27", true);
        this.txt(21, 66, sign[1], 6, "#45443a", true);
        this.rect(99, 54, 1, 1, 0x080d13);
        this.rect(99, 72, 1, 1, 0x080d13);
      }
      if (this.room === 1) {
        this.rect(254, 119, 30, 38, 0x45443a);
        this.rect(256, 121, 26, 2, 0xb9aa89);
        for (let i = 0; i < 3; i++) {
          this.rect(257, 126 + i * 9, 23, 7, 0x665e4a);
          this.rect(265, 128 + i * 9, 7, 2, 0x080d13);
        }
        this.shape([257, 114, 277, 113, 280, 119, 255, 119], 0xe3d4b3);
        this.rect(259, 116, 12, 1, 0x665e4a);
      } else if (this.room === 4) {
        this.rect(180, 95, 30, 22, 0x080d13);
        this.rect(182, 97, 26, 18, 0xb9aa89);
        this.g.lineStyle(1, 0x38494c);
        this.g.strokeCircle(195, 106, 7);
        this.g.lineBetween(188, 106, 202, 106);
        this.g.lineBetween(195, 99, 195, 113);
        this.rect(188, 111, 14, 1, 0x854538);
        this.rect(257, 129, 5, 18, 0x854538);
        this.rect(258, 126, 3, 4, 0x080d13);
        this.rect(258, 134, 3, 5, 0xe3d4b3);
      } else if (this.room === 5) {
        this.rect(150, 127, 19, 29, 0x665e4a);
        this.rect(152, 129, 15, 25, 0x24333b);
        this.shape(
          [
            156, 143, 149, 120, 153, 120, 158, 138, 163, 116, 166, 117, 160,
            143,
          ],
          0x45443a,
        );
      } else if (this.room === 6) {
        this.rect(273, 117, 9, 15, 0x080d13);
        this.rect(275, 119, 5, 6, 0x526064);
        this.rect(277, 128, 2, 1, 0xbf6648);
        this.g.lineStyle(1, 0x141e27);
        this.g.lineBetween(277, 117, 277, 79);
      }
    }
    const door = (x: number, n: string, open = false) => {
      this.rect(x, 85, 30, 74, 0x242e30);
      this.rect(x + 3, 88, open ? 5 : 24, 70, 0x786e53);
      if (!open) {
        this.rect(x + 6, 107, 16, 23, 0x665f4c);
        this.rect(x + 7, 134, 14, 17, 0x665f4c);
        this.rect(x + 22, 128, 4, 2, 0xdbbc74);
        this.rect(x + 3, 151, 9, 5, 0x403d34);
      }
      if (!open) {
        this.shape(
          [
            x + 5,
            106,
            x + 9,
            106,
            x + 9,
            126,
            x + 20,
            126,
            x + 20,
            129,
            x + 5,
            129,
          ],
          0x24333b,
        );
        this.hatch(x + 7, 137, 14, 12, 0x080d13, 4);
      }
      this.rect(x + 5, 91, 20, 11, 0xcabb93);
      this.txt(x + 6, 93, n, 7, "#222a28");
    };
    if (this.room === 1) {
      door(65, "12A");
      door(215, "18A");
      this.rect(140, 159, 26, 16, 0x10151a);
      this.txt(165, 63, "ESCALIER CENTRAL >", 8);
    }
    if (this.room === 1) {
      for (const x of [15, 278]) {
        this.rect(x, 142, 24, 17, 0x77654e);
        this.rect(x + 4, 135, 16, 7, 0x9b8b68);
      }
    }
    if (this.room === 2) {
      for (let i = 0; i < 10; i++)
        this.rect(125 + i * 14, 150 - i * 7, 14, 9 + i * 7, 0x77786b);
      for (let i = 0; i < 8; i++)
        this.rect(115 + i * 20, 106 - i * 3, 15, 5, 0xc4a951);
      this.txt(43, 56, "ESCALIER CONDAMNE", 13, "#eed09a");
      this.txt(30, 78, "42C : ANNEXE > 2E > SERVICE > 1ER", 8);
      this.txt(25, 95, "< DETOUR SUR / RACCOURCI RISQUE >", 8);
    }
    if (this.room === 3) {
      door(120, "40C");
      door(210, "41C");
      this.txt(200, 60, "42C-49C >", 10);
      this.rect(16, 91, 28, 65, 0x293938);
      this.txt(18, 105, "RDC", 8);
    }
    if (this.room === 5) {
      door(25, "12A");
      this.txt(65, 61, "ACCES AILE C : PAR LE 2E", 9);
      this.txt(170, 86, "ESCALIER >", 9);
      for (let i = 0; i < 6; i++)
        this.rect(204 + i * 14, 151 - i * 8, 14, 8 + i * 8, 0x777b6c);
    }
    if ([2, 5, 7].includes(this.room)) {
      const down = this.room === 7,
        count = this.room === 2 ? 10 : down ? 8 : 6;
      const start = this.room === 2 ? 125 : down ? 165 : 204,
        spacing = this.room === 2 ? 14 : down ? 15 : 14;
      const base = this.room === 2 ? 150 : down ? 104 : 151,
        rise = this.room === 2 ? -7 : down ? 7 : -8;
      for (let i = 0; i < count; i++) {
        const x = start + i * spacing,
          y = base + i * rise;
        this.rect(x, y, spacing, 2, this.room === 2 ? 0xb99451 : 0xc0bd94);
        this.rect(x, y + 2, 2, 7, 0x172720);
        this.rect(x + 3, y - 21, 2, 20, 0x22352e);
      }
      this.g.lineStyle(2, 0x929e83);
      this.g.lineBetween(
        start + 4,
        base - 22,
        start + (count - 1) * spacing + 4,
        base + (count - 1) * rise - 22,
      );
      if (this.room !== 2) {
        this.rect(213, 124, 69, 16, 0x10231e);
        this.txt(217, 128, down ? "BAS : 1ER" : "HAUT : 2E", 9, "#f4dfa0");
      }
    }
    if (this.room === 4) {
      door(270, "42C", this.phase === "opening");
      this.txt(
        88,
        40,
        this.cleared.has(4) ? "ACCES LIBERE" : "INSPECTEUR DE SERVICE",
        10,
      );
      if (this.cleared.has(4)) this.txt(130, 64, "DEVANT LA PORTE : HAUT", 8);
    }
    if (this.room === 6) {
      this.txt(36, 61, "PASSERELLE / 2E ETAGE", 11);
      this.txt(137, 85, "SERVICE : DESCENDRE >", 8);
      for (let i = 0; i < 9; i++) {
        this.rect(20 + i * 32, 107, 2, 51, 0x3e4e48);
        this.rect(20 + i * 32, 108, 30, 2, 0xa0a58b);
      }
    }
    if (this.room === 7) {
      this.txt(47, 61, "ESCALIER DE SERVICE", 11);
      this.txt(73, 82, "42C : DESCENDRE AU 1ER", 9);
      for (let i = 0; i < 8; i++)
        this.rect(165 + i * 15, 104 + i * 7, 15, 55 - i * 7, 0x747968);
    }
    if (this.room === 8) {
      this.txt(37, 63, "SOL FRAGILE / SAUTEZ LES TROUS", 9, "#edc878");
      for (const x of [95, 190]) this.rect(x, 159, 33, 16, 0x090d13);
      this.txt(202, 94, "AILE C >", 9);
    }
    if (this.room === 3) {
      this.rect(128, 108, 13, 14, 0x2b423b);
      this.rect(130, 118, 3, 4, 0xbfa783);
      this.rect(136, 118, 3, 4, 0xbfa783);
      this.txt(120, 76, "COURS EN COURS", 7);
    }
    // Heavy architectural shadows and broken hatching stay behind combatants.
    this.g.fillStyle(0x080f16, 0.28);
    this.g.fillTriangle(7, 23, 82, 23, 7, 158);
    this.g.fillTriangle(313, 23, 269, 23, 313, 158);
    this.rect(7, 153, 306, 6, 0x182722);
    for (let i = 0; i < 22; i++) {
      const x = 10 + i * 14;
      this.rect(x, 145 + (i % 3) * 3, 1, 7, 0x182722);
      if (i % 3 === 0) this.rect(x + 3, 148, 1, 8, 0x182722);
    }
    for (const e of this.enemies)
      if (e.hp > 0) {
        this.person(e.x, 159, 0, false, e);
        if (e.parent && e.wind > 0)
          this.txt(64, 91, "VOUS ETES ENCORE EN RETARD !", 8, "#e8bb87");
        if (e.stun > 0) this.txt(e.x - 8, 100, "***", 9, "#e3d4b3");
        if (e.wind > 0) {
          this.txt(e.x - 5, 111, "!", 14, "#ffdc72");
          if (e.boss)
            this.txt(
              72,
              78,
              e.pattern % 2 === 0 ? "BALAYAGE : SAUTEZ" : "TAMPON : RECULEZ",
              9,
              "#f0bc7b",
            );
        }
        if (e.recovery > 0 && e.boss)
          this.txt(107, 78, "OUVERTURE !", 10, "#bdd99b");
        if (e.boss) {
          this.rect(106, 57, 110, 4, 0x271c27);
          this.rect(106, 57, (e.hp * 110) / (6 + this.mission), 4, 0xd8aa64);
        }
      }
    if (
      (this.inv === 0 ||
        Math.floor(this.inv * 12) % 2 === 0 ||
        this.falling > 0) &&
      this.py < 209
    )
      this.person(this.px, this.py, 0x9f855c, true);
    if (this.impact > 0) {
      this.rect(this.impactX - 12, 130, 24, 3, 0xffe5a0);
      this.rect(this.impactX - 2, 120, 3, 23, 0xffe5a0);
      this.txt(this.impactX - 12, 105, "PAF", 9, "#ffe5a0");
    }
    const floorGaps = this.floorGaps();
    for (const [left, right] of floorGaps) {
      // Foreground lip occludes the falling body; cracks and broken tiles identify the danger.
      this.rect(left, 160, right - left, 15, 0x060b10);
      for (let i = 0; i < right - left; i += 7)
        this.rect(left + i, 160, 4, 3 + (i % 3), 0x343c34);
      this.rect(left - 4, 157, 4, 4, 0xc0aa73);
      this.rect(right, 157, 4, 4, 0xc0aa73);
      this.rect(left - 10, 155, 6, 1, 0x121e1c);
      this.rect(right + 4, 155, 7, 1, 0x121e1c);
      this.rect(left - 8, 141, 2, 15, 0x8d764b);
      this.rect(left - 12, 140, 11, 3, 0xc3a451);
    }
    const hint = this.falling > 0 ? undefined : this.interaction();
    if (hint && this.phase === "school") {
      this.rect(42, 163, 236, 12, 0x142924);
      this.txt(49, 165, hint.label, 8, "#f0d287");
    }
    this.rect(9, 9, 302, 13, 0x21332f);
    this.txt(12, 12, ROOM_NAMES[this.room], 9);
  }
}
new Phaser.Game({
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  parent: "game",
  pixelArt: true,
  // Pass elapsed wall time to our bounded substeps, without the engine's
  // rolling average hiding slow frames or long interruptions.
  fps: { smoothStep: false },
  backgroundColor: "#101719",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 640,
    height: 480,
  },
  scene: Game,
});
