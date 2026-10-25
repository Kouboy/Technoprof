import type Phaser from "phaser";
import { FAILURE_DATA } from "./interface-data";
import { VIEW } from "./presentation";

export function failureNotice(s: {
  failureReason: string | null;
  mission: number;
  runPolicy?: string;
}) {
  const reason = s.failureReason;
  return {
    frame:
      reason === "breakdown"
        ? "road"
        : reason === "exhausted"
          ? "school"
          : null,
    cause:
      reason === "breakdown"
        ? "VEHICULE EN PANNE"
        : reason === "exhausted"
          ? "PROF EPUISE"
          : "DELAI DEPASSE",
    detail:
      reason === "breakdown"
        ? ["AUCUN VEHICULE", "DE REMPLACEMENT."]
        : reason === "exhausted"
          ? ["VOTRE ABSENCE SERA", "COMPTABILISEE."]
          : ["LE RETARD FIGURERA", "AU RAPPORT."],
    next:
      s.runPolicy === "legacy-two"
        ? s.mission === 2
          ? "VOIR LE BILAN"
          : "AFFECTATION SUIVANTE"
        : "RETOUR AU TITRE",
  };
}

// One preloaded atlas, two fixed frames. No texture creation in the render loop.
export class FailureArt {
  image: Phaser.GameObjects.Image;
  panel: Phaser.GameObjects.Graphics;
  static preload(scene: Phaser.Scene) {
    scene.load.image("failure-vignettes", FAILURE_DATA);
  }
  constructor(scene: Phaser.Scene) {
    const texture = scene.textures.get("failure-vignettes");
    const source = texture.getSourceImage() as HTMLImageElement;
    const half = Math.floor(source.height / 2);
    texture.add("road", 0, 0, 0, source.width, half);
    texture.add("school", 0, 0, half, source.width, half);
    texture.setFilter(1); // Phaser NEAREST; preserve the inked pixel clusters.
    this.image = scene.add
      .image(VIEW.x, VIEW.y, "failure-vignettes", "road")
      .setOrigin(0)
      .setDisplaySize(VIEW.width, VIEW.height)
      .setDepth(3.95)
      .setVisible(false);
    this.panel = scene.add.graphics().setDepth(3.99);
  }
  hide() {
    this.image.setVisible(false);
    this.panel.clear();
  }
  show(frame: string | null) {
    if (frame)
      this.image
        .setFrame(frame)
        .setDisplaySize(VIEW.width, VIEW.height)
        .setVisible(true);
  }
}
