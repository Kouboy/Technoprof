import { ActionInput } from "./controls";
import { combatProfile } from "./gameplay";
import type { Enemy, Exit } from "./world";
import { withinPassage, walkBounds } from "./world";
import { markerPassage, doorwayPassage, passageMarker } from "./passage-layout";

export const DIRECT = {
  swipe: 14,
  tapSlop: 7,
  arrivalSlop: 2,
  steerSlop: 0.025,
  markerSeconds: 0.6,
};
type Host = {
  phase: string;
  room: number;
  paused: boolean;
  playerMenu: boolean;
  encounterTime: number;
  schoolFade: number;
  roomTransition?: unknown;
  age: number;
  freshKey: boolean;
  px: number;
  py: number;
  car: number;
  steerVelocity: number;
  cam: number;
  attack: number;
  playerRecovery: number;
  falling: number;
  hitStop: number;
  enemies: Enemy[];
  controls?: ActionInput;
  pointerMode: boolean;
  workshop?: boolean;
  pointerExits(): Exit[];
  movementBounds?(): { min: number; max: number };
  careResource?(): { x: number; reach: number } | undefined;
  navigationCare?: { active: boolean };
  combatProfile?(): ReturnType<typeof combatProfile>;
};
type Intent =
  | { kind: "walk"; x: number }
  | { kind: "attack"; enemy: Enemy }
  | { kind: "care"; x: number }
  | { kind: "exit"; exit: Exit };
export class DirectInput {
  intent: Intent | null = null;
  gesture: {
    id: number;
    x: number;
    y: number;
    nx: number;
    ny: number;
    car: number;
    used: boolean;
    road: boolean;
  } | null = null;
  feedback: { x: number; y: number; kind: string; life: number } | null = null;
  context = "";
  pendingAction: string | null = null;
  host: Host;
  constructor(host: Host) {
    this.host = host;
  }
  blocked() {
    const s = this.host;
    return (
      (s.paused && !s.workshop) ||
      s.playerMenu ||
      s.schoolFade > 0 ||
      !!s.roomTransition ||
      !!s.navigationCare?.active
    );
  }
  marker(x: number, y: number, kind: string) {
    this.feedback = { x, y, kind, life: DIRECT.markerSeconds };
  }
  pulse(action: string) {
    this.pendingAction = action;
  }
  cancel() {
    this.intent = null;
    this.pendingAction = null;
    this.gesture = null;
    this.feedback = null;
    this.host.controls?.setSource("direct", []);
    this.host.controls?.setSource("direct-pulse", []);
  }
  down(id: number, x: number, y: number) {
    if (this.blocked() || this.gesture) return false;
    const s = this.host;
    s.pointerMode = true;
    const road = ["free", "receive", "road"].includes(s.phase);
    if (
      !road &&
      s.phase !== "school" &&
      s.phase !== "course" &&
      s.phase !== "fail"
    )
      return false;
    if (road && y > 175) return false;
    this.gesture = { id, x, y, nx: x, ny: y, car: s.car, used: false, road };
    if (road) {
      this.intent = null;
      this.marker(x, y, "drive");
    }
    return true;
  }
  move(id: number, x: number, y: number) {
    const g = this.gesture;
    if (!g || g.id !== id || this.blocked()) return;
    g.nx = x;
    g.ny = y;
    if (
      !g.road &&
      !g.used &&
      this.host.phase === "school" &&
      !this.host.encounterTime &&
      g.y - y > DIRECT.swipe
    ) {
      g.used = true;
      const dx = x - g.x;
      if (Math.abs(dx) > DIRECT.tapSlop) {
        const bounds =
          this.host.movementBounds?.() ?? walkBounds(this.host.room);
        this.intent = {
          kind: "walk",
          x: Math.max(
            bounds.min,
            Math.min(bounds.max, this.host.px + Math.sign(dx) * 85),
          ),
        };
      }
      this.pulse("SPACE");
      this.marker(this.host.px, 150, "jump");
    }
  }
  up(id: number, x: number, y: number) {
    const g = this.gesture;
    if (!g || g.id !== id) return;
    this.gesture = null;
    if (g.road) {
      this.host.controls?.setSource("direct", []);
      return;
    }
    if (!g.used && Math.hypot(x - g.x, y - g.y) <= DIRECT.tapSlop)
      this.tap(x, y);
  }
  tap(x: number, y: number) {
    if (this.blocked()) return;
    const s = this.host;
    s.pointerMode = true;
    if (s.phase === "course") {
      if (s.age > 0.3) this.pulse("CONTINUE");
      return;
    }
    if (s.phase === "fail") {
      if (s.age > 2) this.pulse("ENTER");
      return;
    }
    if (s.phase !== "school") return;
    if (s.encounterTime > 0) {
      this.pulse("X");
      return;
    }
    if (y > 175) return;
    const care = s.careResource?.();
    if (care && Math.abs(x + s.cam - care.x) < 25 && y >= 71 && y <= 146) {
      this.intent = { kind: "care", x: care.x };
      this.marker(care.x - s.cam, 115, "care");
      return;
    }
    const exits = s.pointerExits();
    // An explicitly displayed passage wins over an overlapping actor hitbox.
    const marker = markerPassage(exits, s.px, x + s.cam, y);
    if (marker) {
      this.chooseExit(marker);
      return;
    }
    const enemy = s.enemies.find(
      (e) =>
        e.hp > 0 &&
        Math.abs(x - (e.x - s.cam)) < (e.boss ? 34 : 25) &&
        y > (e.boss ? 58 : 75) &&
        y < 160,
    );
    if (enemy) {
      this.intent = { kind: "attack", enemy };
      this.marker(enemy.x - s.cam, 120, "attack");
      return;
    }
    const exit = doorwayPassage(exits, x + s.cam, y);
    if (exit) {
      this.chooseExit(exit);
      return;
    }
    if (y >= 135) {
      const bounds = s.movementBounds?.() ?? walkBounds(s.room);
      const target = Math.max(bounds.min, Math.min(bounds.max, x + s.cam));
      this.intent = { kind: "walk", x: target };
      this.marker(target - s.cam, 163, "walk");
    }
  }
  chooseExit(exit: Exit) {
    this.intent = { kind: "exit", exit };
    const marker = passageMarker(exit, this.host.px);
    this.marker(
      (marker ? marker.x + marker.w / 2 : exit.hint[0]) - this.host.cam,
      marker ? marker.y + marker.h / 2 : exit.hint[1],
      "exit",
    );
  }
  tick(dt: number) {
    const s = this.host;
    const context =
      s.room +
      ":" +
      (["free", "receive", "road"].includes(s.phase) ? "drive" : s.phase) +
      ":" +
      (s.encounterTime > 0);
    if (context !== this.context) {
      this.cancel();
      this.context = context;
    }
    if (this.blocked()) {
      this.cancel();
      return;
    }
    // Workshop gestures wait for the next simulation step rather than being
    // consumed by an idle paused frame. Live gameplay has no added delay.
    if (s.paused) return;
    if (this.feedback) {
      this.feedback.life -= dt;
      if (this.feedback.life <= 0) this.feedback = null;
    }
    // A physical gameplay key takes over immediately from an automatic destination.
    if (s.controls?.keyboardActive) {
      this.cancel();
      s.pointerMode = false;
      return;
    }
    if (this.pendingAction) {
      if (this.pendingAction === "CONTINUE") s.freshKey = true;
      else {
        s.controls?.setSource("direct-pulse", [this.pendingAction]);
        s.controls?.setSource("direct-pulse", []);
      }
      this.pendingAction = null;
    }
    const g = this.gesture;
    if (g?.road) {
      const target = Math.max(-1.1, Math.min(1.1, g.car + (g.nx - g.x) / 105));
      const predicted = s.car + s.steerVelocity * 0.24;
      const dir = target - predicted;
      s.controls?.setSource("direct", [
        g.ny - g.y > DIRECT.swipe ? "DOWN" : "UP",
        ...(Math.abs(dir) > DIRECT.steerSlop
          ? [dir > 0 ? "RIGHT" : "LEFT"]
          : []),
      ]);
      return;
    }
    if (!this.intent) {
      s.controls?.setSource("direct", []);
      return;
    }
    if (
      s.phase !== "school" ||
      s.encounterTime > 0 ||
      s.falling > 0 ||
      s.playerRecovery > 0
    ) {
      this.intent = null;
      s.controls?.setSource("direct", []);
      return;
    }
    const intent = this.intent;
    let x =
      intent.kind === "walk" || intent.kind === "care"
        ? intent.x
        : intent.kind === "exit"
          ? intent.exit.edge
            ? intent.exit.key === "LEFT"
              ? intent.exit.from
              : intent.exit.to
            : (intent.exit.from + intent.exit.to) / 2
          : intent.enemy.x;
    const direction = x > s.px ? "RIGHT" : "LEFT";
    const dx = Math.abs(x - s.px);
    if (
      intent.kind === "care" &&
      dx <= (s.careResource?.()?.reach ?? 0) &&
      s.py === 159
    ) {
      s.controls?.setSource("direct", []);
      this.pulse("X");
      this.intent = null;
      return;
    }
    if (intent.kind === "attack") {
      if (intent.enemy.hp <= 0) {
        this.intent = null;
        s.controls?.setSource("direct", []);
        return;
      }
      if (
        dx <= (s.combatProfile?.() ?? combatProfile(s.room)).bookReach - 5 &&
        s.py >= 135
      ) {
        if (s.attack === 0 && s.hitStop === 0) {
          s.controls?.setSource("direct", [direction]);
          this.pulse("X");
          this.intent = null;
        } else s.controls?.setSource("direct", []);
        return;
      }
      x -=
        Math.sign(x - s.px) *
        ((s.combatProfile?.() ?? combatProfile(s.room)).bookReach - 8);
    }
    if (
      intent.kind === "exit" &&
      (intent.exit.edge || withinPassage(intent.exit, s.px))
    ) {
      s.controls?.setSource("direct", [intent.exit.key]);
      return;
    }
    if (Math.abs(x - s.px) <= DIRECT.arrivalSlop) {
      this.intent = null;
      s.controls?.setSource("direct", []);
      return;
    }
    s.controls?.setSource("direct", [x > s.px ? "RIGHT" : "LEFT"]);
  }
}

export function installDirectInput(
  s: Host & { audio: { unlock(): void }; draw(): void },
) {
  const input = new DirectInput(s),
    game = document.getElementById("game")!;
  const point = (event: PointerEvent) => {
    const canvas = game.querySelector("canvas")!;
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) * 320) / box.width,
      y: ((event.clientY - box.top) * 240) / box.height,
    };
  };
  game.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const p = point(event);
    // Initialize context before the first gesture so its first tick retains it.
    input.tick(0);
    if (!input.down(event.pointerId, p.x, p.y)) return;
    event.preventDefault();
    s.audio.unlock();
    game.focus({ preventScroll: true });
    game.setPointerCapture(event.pointerId);
  });
  game.addEventListener("pointermove", (event) => {
    const p = point(event);
    input.move(event.pointerId, p.x, p.y);
  });
  game.addEventListener("pointerup", (event) => {
    const p = point(event);
    input.up(event.pointerId, p.x, p.y);
  });
  for (const type of ["pointercancel", "lostpointercapture"])
    game.addEventListener(type, (event) => {
      if (input.gesture?.id === (event as PointerEvent).pointerId)
        input.cancel();
    });
  game.addEventListener("contextmenu", (event) => event.preventDefault());
  window.addEventListener("blur", () => input.cancel());
  window.addEventListener("resize", () => input.cancel());
  document.addEventListener("visibilitychange", () => input.cancel());
  return input;
}
