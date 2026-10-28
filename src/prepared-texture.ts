import Phaser from "phaser";

// Prepared art never changes after registration. CanvasTexture would read back
// and retain a second full RGBA image for its pixel-editing API. A plain Texture
// uses the identical canvas/GPU upload and frames without that unused snapshot.
export function addPreparedTexture(
  scene: Phaser.Scene,
  key: string,
  canvas: HTMLCanvasElement,
): Phaser.Textures.Texture | null {
  const texture = scene.textures.create(
    key,
    canvas,
    canvas.width,
    canvas.height,
  );
  if (!texture) return null;
  texture.add("__BASE", 0, 0, 0, canvas.width, canvas.height);
  // Match addImage/addCanvas observer semantics, after the base frame exists.
  scene.textures.emit(Phaser.Textures.Events.ADD, key, texture);
  scene.textures.emit(Phaser.Textures.Events.ADD_KEY + key, texture);
  return texture;
}
