import type Phaser from "phaser";
import { CINEMATIC_AUDIO } from "./cinematic-audio";
import { MUSIC_FILES } from "./music";

type Size = [number, number];

function inlineSize(url: string): Size | undefined {
  const prefix = "data:image/png;base64,";
  if (!url.startsWith(prefix)) return;
  const bytes = atob(url.slice(prefix.length, prefix.length + 32));
  if (bytes.length < 24 || bytes.slice(12, 16) !== "IHDR") return;
  const int = (start: number) =>
    bytes.charCodeAt(start) * 2 ** 24 +
    bytes.charCodeAt(start + 1) * 2 ** 16 +
    bytes.charCodeAt(start + 2) * 256 +
    bytes.charCodeAt(start + 3);
  return [int(16), int(20)];
}

function expectedSize(url: string) {
  const catalog = document.getElementById("asset-dimensions")?.textContent;
  const sizes: Record<string, Size> = catalog ? JSON.parse(catalog) : {};
  const filename = url.match(/\/art\/([a-f0-9]+\.png)(?:[?#]|$)/)?.[1];
  return filename ? sizes[filename] : inlineSize(url);
}

function matchesSize(image: { width: number; height: number }, size?: Size) {
  return (
    image.width > 0 &&
    image.height > 0 &&
    (!size || (image.width === size[0] && image.height === size[1]))
  );
}

export async function prepareTitleImage(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (!matchesSize(image, expectedSize(url)))
    throw new Error("Invalid title image");
  return image;
}

export function watchImages(loader: Phaser.Loader.LoaderPlugin) {
  const planned = new Map<string, Size | undefined>();
  const added = (
    key: string,
    type: string,
    _loader: unknown,
    file: { url: string },
  ) => {
    if (type !== "image") return;
    planned.set(key, expectedSize(file.url));
  };
  loader.on("addfile", added);
  loader.once("complete", () => loader.off("addfile", added));
  return (textures: Phaser.Textures.TextureManager) => {
    for (const [key, size] of planned) {
      const image = textures.exists(key)
        ? textures.get(key).getSourceImage()
        : undefined;
      if (!image || !matchesSize(image, size)) return key;
    }
  };
}

export function missingRoadFrame(textures: Phaser.Textures.TextureManager) {
  for (const [key, names] of [
    ["sky", ["clouds", "skyline"]],
    ["service", [0, 1, 2]],
    ["service-right", [3]],
  ] as const) {
    if (!textures.exists(key)) return key;
    const texture = textures.get(key);
    for (const name of names) {
      const frame = texture.has(String(name)) && texture.get(name);
      if (
        !frame ||
        frame.cutWidth <= 0 ||
        frame.cutHeight <= 0 ||
        frame.cutX < 0 ||
        frame.cutY < 0 ||
        frame.cutX + frame.cutWidth > frame.source.width ||
        frame.cutY + frame.cutHeight > frame.source.height
      )
        return `${key}/${name}`;
    }
  }
}

async function wavExists(file: string, signal: AbortSignal) {
  const response = await fetch(`audio/${file}`, {
    headers: { Range: "bytes=0-11" },
    signal,
  });
  const reader = response.body?.getReader();
  if (!reader) return false;
  try {
    if (!response.ok) return false;
    let header = "";
    while (header.length < 12) {
      const { value, done } = await reader.read();
      if (done) return false;
      header += String.fromCharCode(...value.subarray(0, 12 - header.length));
    }
    if (!header.startsWith("RIFF") || !header.endsWith("WAVE")) return false;
    const dataSize =
      new DataView(
        Uint8Array.from(header, (byte) => byte.charCodeAt(0)).buffer,
      ).getUint32(4, true) + 8;
    const total =
      response.status === 206
        ? response.headers.get("Content-Range")?.split("/").at(-1)
        : response.headers.get("Content-Length");
    return (
      dataSize > 12 && (!total || total === "*" || Number(total) >= dataSize)
    );
  } finally {
    void reader.cancel().catch(() => {});
  }
}

export async function missingWebAudio() {
  const files = [
    ...Object.values(MUSIC_FILES),
    ...Object.values(CINEMATIC_AUDIO).flatMap(Object.values),
  ];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          return (await wavExists(file, controller.signal)) ? undefined : file;
        } catch {
          return file;
        }
      }),
    );
    return results.find(Boolean);
  } finally {
    clearTimeout(timeout);
  }
}
