// Browser-standard Xbox layout. No gameplay, DOM or device I/O in this mapper.
export const PAD_TUNING = {
  stickDeadzone: 0.2,
  triggerDeadzone: 0.1,
  menuDelay: 0.4,
  menuRepeat: 0.14,
};
export type PadDrive = { steer: number; throttle: number; brake: number };
export type PadUIAction =
  "start" | "accept" | "back" | "up" | "down" | "left" | "right" | "continue";
export type PadSnapshot = {
  index: number;
  connected: boolean;
  mapping: string;
  axes: readonly number[];
  buttons: readonly { pressed: boolean; value: number }[];
};
export type PadContext = { phase: string; menu: boolean; focused: boolean };
export type PadFrame = {
  actions: string[];
  ui: PadUIAction[];
  drive: PadDrive | null;
  connected: boolean;
  lost: boolean;
  used: boolean;
};
const padValue = (value: number | undefined) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value!)) : 0;
const padAxis = (value: number | undefined) => {
  if (!Number.isFinite(value) || Math.abs(value!) <= PAD_TUNING.stickDeadzone)
    return 0;
  return (
    Math.sign(value!) *
    Math.min(
      1,
      (Math.abs(value!) - PAD_TUNING.stickDeadzone) /
        (1 - PAD_TUNING.stickDeadzone),
    )
  );
};
export class GamepadInput {
  private index: number | null = null;
  private previous = [false, false, false];
  private blocked = [false, false, false];
  private menuDirection = "";
  private repeat = 0;
  suspend() {
    this.blocked = [true, true, true];
    this.menuDirection = "";
    this.repeat = 0;
  }
  sample(
    pads: readonly (PadSnapshot | null)[],
    context: PadContext,
    dt: number,
  ): PadFrame {
    const frame: PadFrame = {
      actions: [],
      ui: [],
      drive: null,
      connected: false,
      lost: false,
      used: false,
    };
    const available = pads.filter(
      (p): p is PadSnapshot => !!p?.connected && p.mapping === "standard",
    );
    const hadPad = this.index !== null;
    const selected =
      available.find((p) => p.index === this.index) ?? available[0];
    frame.lost = hadPad && !available.some((p) => p.index === this.index);
    if (!selected) {
      this.index = null;
      this.previous = [false, false, false];
      if (frame.lost) this.suspend();
      return frame;
    }
    if (selected.index !== this.index) this.previous = [false, false, false];
    this.index = selected.index;
    frame.connected = true;
    const pressed = (i: number) =>
      !!selected.buttons[i]?.pressed ||
      padValue(selected.buttons[i]?.value) > 0.5;
    // Merge before edge detection: B + X is one action, never a double hit.
    const current = [pressed(0), pressed(1) || pressed(2), pressed(9)];
    const edges = current.map((down, i) => {
      if (!down) this.blocked[i] = false;
      return down && !this.previous[i] && !this.blocked[i];
    });
    this.previous = current;
    if (!context.focused || frame.lost) {
      this.suspend();
      return frame;
    }
    const left = pressed(14),
      right = pressed(15),
      up = pressed(12),
      down = pressed(13);
    const x =
      left || right ? Number(right) - Number(left) : padAxis(selected.axes[0]);
    const y =
      up || down ? Number(down) - Number(up) : padAxis(selected.axes[1]);
    const trigger = (i: number) =>
      Math.max(
        0,
        (padValue(selected.buttons[i]?.value) - PAD_TUNING.triggerDeadzone) /
          (1 - PAD_TUNING.triggerDeadzone),
      );
    // Face buttons are full pedals while held; triggers stay analog. Context
    // routing below still owns A/B/X edge actions in menus and on foot.
    const throttle = Math.max(trigger(7), Number(current[0])),
      brake = Math.max(trigger(6), Number(current[1]));
    frame.used = !!(
      x ||
      y ||
      left ||
      right ||
      up ||
      down ||
      throttle ||
      brake ||
      current.some(Boolean)
    );
    if (edges[2]) {
      if (context.phase === "fail" && !context.menu)
        frame.actions.push("ENTER");
      else frame.ui.push("start");
      // One Start must never also act in the state it just opened.
      return frame;
    }
    if (context.menu) {
      if (edges[0]) frame.ui.push("accept");
      if (edges[1]) frame.ui.push("back");
      const direction =
        Math.max(Math.abs(x), Math.abs(y)) < 0.5
          ? ""
          : Math.abs(y) >= Math.abs(x)
            ? y < 0
              ? "up"
              : "down"
            : x < 0
              ? "left"
              : "right";
      if (direction && direction !== this.menuDirection) {
        frame.ui.push(direction);
        this.repeat = PAD_TUNING.menuDelay;
      } else if (direction) {
        this.repeat -= Math.max(0, Math.min(dt, 0.5));
        if (this.repeat <= 0) {
          frame.ui.push(direction);
          this.repeat = PAD_TUNING.menuRepeat;
        }
      }
      this.menuDirection = direction;
      return frame;
    }
    this.menuDirection = "";
    if (["free", "receive", "road", "home"].includes(context.phase)) {
      if (x || throttle || brake) frame.drive = { steer: x, throttle, brake };
      if (x < 0) frame.actions.push("LEFT");
      if (x > 0) frame.actions.push("RIGHT");
      if (throttle) frame.actions.push("UP");
      if (brake) frame.actions.push("DOWN");
    } else if (context.phase === "school") {
      if (x < 0) frame.actions.push("LEFT");
      if (x > 0) frame.actions.push("RIGHT");
      if (y < 0) frame.actions.push("UP");
      if (y > 0) frame.actions.push("DOWN");
      if (edges[0]) frame.actions.push("SPACE");
      if (edges[1]) frame.actions.push("X");
    } else if (context.phase === "course" && (edges[0] || edges[1]))
      frame.ui.push("continue");
    else if (
      ["fail", "lifeLost", "radiated"].includes(context.phase) &&
      (edges[0] || edges[1])
    )
      frame.actions.push("ENTER");
    return frame;
  }
}
