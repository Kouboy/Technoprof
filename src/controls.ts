// All devices feed the same logical keys read by gameplay and character poses.
export const BINDINGS: Record<string, string[]> = {
  LEFT: ["LEFT", "Q"],
  RIGHT: ["RIGHT", "D"],
  UP: ["UP", "Z"],
  DOWN: ["DOWN", "S"],
  SPACE: ["SPACE"],
  X: ["X", "F"],
  ENTER: ["ENTER"],
  P: ["P"],
  M: ["M"],
  F2: ["F2"],
  F3: ["F3"],
  F4: ["F4"],
};
export type ActionKey = { isDown: boolean; _justDown: boolean };
export class ActionInput {
  keyboardActive = false;
  keys: Record<string, ActionKey> = Object.fromEntries(
    Object.keys(BINDINGS).map((k) => [k, { isDown: false, _justDown: false }]),
  );
  sources = new Map<string, string[]>();
  setSource(source: string, actions: string[]) {
    if (actions.length) this.sources.set(source, actions);
    else this.sources.delete(source);
    const held = new Set([...this.sources.values()].flat());
    for (const [name, key] of Object.entries(this.keys)) {
      const down = held.has(name);
      if (down && !key.isDown) key._justDown = true;
      key.isDown = down;
    }
  }
  sampleKeyboard(
    raw: Record<string, { isDown: boolean }>,
    just: (name: string) => boolean,
  ) {
    const before = new Set(
      Object.keys(this.keys).filter((k) => this.keys[k].isDown),
    );
    const down: string[] = [],
      pressed: string[] = [];
    for (const [action, aliases] of Object.entries(BINDINGS)) {
      let edge = false;
      for (const alias of aliases) if (just(alias)) edge = true;
      if (aliases.some((alias) => raw[alias]?.isDown)) down.push(action);
      if (edge) pressed.push(action);
    }
    this.setSource("keyboard", down);
    this.keyboardActive = down.length > 0 || pressed.length > 0;
    // Preserve a quick down/up between frames, without alias double firing.
    for (const action of pressed)
      if (!before.has(action)) this.keys[action]._justDown = true;
  }
  reset() {
    this.keyboardActive = false;
    this.sources.clear();
    for (const key of Object.values(this.keys))
      key.isDown = key._justDown = false;
  }
}
