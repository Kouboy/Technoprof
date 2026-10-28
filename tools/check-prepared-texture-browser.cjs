// Exercise the real prepared-texture helper against Phaser's addCanvas API.
// The isolated scene is generated under ignored work/checkpoints; dist is untouched.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  assert = require("node:assert/strict");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE || "playwright",
);
const root = path.resolve(__dirname, ".."),
  out = path.join(
    root,
    "work/checkpoints/optimization-2026-10-28/prepared-texture",
  );
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, "index.html"),
  '<style>body{margin:0;background:#14202b}canvas{image-rendering:pixelated}</style><script type="module" src="./scene.ts"></script>',
);
fs.writeFileSync(
  path.join(out, "scene.ts"),
  `
import Phaser from "phaser";
import { addPreparedTexture } from "/src/prepared-texture";
const requestedRenderer = new URLSearchParams(location.search).get("renderer");
class TextureProbe extends Phaser.Scene {
  create() {
    const scene = this, groups = { legacy: [], prepared: [] }, metadata = [], events = [];
    const canvases = [[96,80],[42,36]].map(([w,h], index) => {
      const canvas = document.createElement("canvas"); canvas.width=w; canvas.height=h;
      const c = canvas.getContext("2d"), data = c.createImageData(w,h);
      for (let y=0;y<h;y++) for(let x=0;x<w;x++) {
        const i=(y*w+x)*4;
        data.data[i]=(x*17+y*3+index*67)%256;
        data.data[i+1]=(x*2+y*11+37)%256;
        data.data[i+2]=(x*7+y*5+191)%256;
        data.data[i+3]=(x<2||y<2||x>=w-2||y>=h-2)?0:((x+y)%7===0?96:255);
      }
      c.putImageData(data,0,0);
      c.fillStyle="#edc575"; c.fillRect(6,8,15,17);
      c.clearRect(11,12,3,5);
      return canvas;
    });
    this.textures.on(Phaser.Textures.Events.ADD, (key, texture) => {
      if(key.startsWith("probe-")) events.push({event:"ADD",key,identity:this.textures.get(key)===texture,baseReady:texture.has("__BASE")});
    });
    for(const mode of ["legacy","prepared"]) for(const [index,canvas] of canvases.entries()) {
      const key="probe-"+mode+"-"+index;
      this.textures.on(Phaser.Textures.Events.ADD_KEY+key, texture => events.push({event:"ADD_KEY",key,identity:this.textures.get(key)===texture,baseReady:texture.has("__BASE")}));
      let reads=0;
      const oldRead=CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData=function(...args){reads++;return oldRead.apply(this,args);};
      let texture;
      try {texture=mode==="legacy"?this.textures.addCanvas(key,canvas):addPreparedTexture(this,key,canvas);}
      finally {CanvasRenderingContext2D.prototype.getImageData=oldRead;}
      if(!texture) throw Error("Registration failed: "+key);
      texture.add("body",0,3,4,Math.min(37,canvas.width-3),Math.min(50,canvas.height-4));
      texture.add(1,0,5,7,Math.min(29,canvas.width-5),Math.min(26,canvas.height-7));
      texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      metadata.push({mode,key,reads,sourceSame:texture.getSourceImage()===canvas,width:texture.source[0].width,height:texture.source[0].height,canvasTexture:texture instanceof Phaser.Textures.CanvasTexture,
        imageDataBytes:texture.imageData?.data?.byteLength||0,bufferBytes:texture.buffer?.byteLength||0,dataBytes:texture.data?.byteLength||0,pixelBytes:texture.pixels?.byteLength||0,
        snapshotsAbsent:["imageData","buffer","data","pixels"].every(name=>texture[name]===undefined),
        frames:Object.fromEntries(Object.entries(texture.frames).map(([name,f])=>[name,{x:f.cutX,y:f.cutY,width:f.cutWidth,height:f.cutHeight}]))});
      const a=this.add.image(7+index*160,7,key).setOrigin(0).setDisplaySize(96,80);
      const b=this.add.image(58+index*155,116,key,"body").setOrigin(.5,.75).setScale(1.6,1.2).setFlipX(true).setAlpha(.73);
      const c=this.add.image(112+index*150,115,key,1).setOrigin(.4,.6).setScale(1.3,1.7).setFlipY(true).setTint(0xa4cfe1);
      const d=this.add.image(311,174,key,"body").setOrigin(.3,.6).setScale(-1,1).setAlpha(.61);
      groups[mode].push(a,b,c,d);
    }
    groups.prepared.forEach(image=>image.setVisible(false));
    const capture = mode => new Promise(resolve=>{
      for(const name of ["legacy","prepared"]) groups[name].forEach(image=>image.setVisible(name===mode));
      this.game.events.once(Phaser.Core.Events.POST_RENDER,()=>{
        const canvas=document.createElement("canvas"); canvas.width=320; canvas.height=180;
        const c=canvas.getContext("2d"); c.drawImage(this.game.canvas,0,0);
        resolve(Array.from(c.getImageData(0,0,320,180).data));
      });
    });
    window.preparedTextureProbe={metadata,events,capture,renderer:this.game.renderer.type,webgl:!!this.game.renderer.gl};
  }
}
new Phaser.Game({type:requestedRenderer==="canvas"?Phaser.CANVAS:Phaser.WEBGL,width:320,height:180,backgroundColor:"#14202b",pixelArt:true,roundPixels:true,
  render:{preserveDrawingBuffer:true},scale:{mode:Phaser.Scale.NONE,zoom:2},scene:TextureProbe});
`,
);

(async () => {
  assert(
    fs.existsSync(path.join(root, "src/prepared-texture.ts")),
    "real helper must exist",
  );
  const { createServer } = await import("vite");
  const server = await createServer({
    root,
    server: { host: "127.0.0.1", port: 0 },
    logLevel: "error",
  });
  await server.listen();
  const reports = [];
  try {
    for (const [name, engine] of [
      ["chromium", chromium],
      ["firefox", firefox],
    ]) {
      if (process.argv.includes("--chrome-only") && name !== "chromium")
        continue;
      if (process.argv.includes("--firefox-only") && name !== "firefox")
        continue;
      const channel =
        name === "chromium" ? process.env.PLAYWRIGHT_CHANNEL : undefined;
      const browser = await engine.launch({ headless: true, channel });
      try {
        for (const renderer of ["webgl", "canvas"]) {
          const page = await browser.newPage({
              viewport: { width: 640, height: 360 },
            }),
            errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await page.goto(
            `http://127.0.0.1:${server.httpServer.address().port}/work/checkpoints/optimization-2026-10-28/prepared-texture/index.html?renderer=${renderer}`,
          );
          await page.waitForFunction(
            () => !!window.preparedTextureProbe,
            null,
            { timeout: 30000 },
          );
          const metadata = await page.evaluate(() => {
            const { metadata, events, renderer, webgl } =
              window.preparedTextureProbe;
            return { metadata, events, renderer, webgl };
          });
          assert.equal(
            metadata.webgl,
            renderer === "webgl",
            `${name}: requested renderer is active`,
          );
          assert.equal(metadata.renderer, renderer === "webgl" ? 2 : 1);
          const legacy = metadata.metadata.filter((t) => t.mode === "legacy"),
            prepared = metadata.metadata.filter((t) => t.mode === "prepared");
          assert.equal(legacy.length, 2);
          assert.equal(prepared.length, 2);
          for (let i = 0; i < legacy.length; i++) {
            const before = legacy[i],
              after = prepared[i];
            assert(
              before.canvasTexture &&
                before.imageDataBytes > 0 &&
                before.reads > 0,
              "control retains native CanvasTexture snapshots",
            );
            assert(
              !after.canvasTexture && after.snapshotsAbsent,
              "helper creates a plain Texture with no snapshot fields",
            );
            assert.equal(
              after.reads,
              0,
              "helper performs no getImageData readback",
            );
            for (const bytes of [
              after.imageDataBytes,
              after.bufferBytes,
              after.dataBytes,
              after.pixelBytes,
            ])
              assert.equal(bytes, 0);
            assert(
              before.sourceSame && after.sourceSame,
              "source canvas identity is preserved",
            );
            assert.deepEqual(
              after.frames,
              before.frames,
              "base, named and numeric frames are identical",
            );
            assert.equal(after.width, before.width);
            assert.equal(after.height, before.height);
            const events = metadata.events.filter(
              (event) => event.key === after.key,
            );
            assert.deepEqual(
              events.map((event) => event.event),
              ["ADD", "ADD_KEY"],
            );
            assert(
              events.every((event) => event.identity && event.baseReady),
              "events expose registered texture with ready __BASE",
            );
          }
          const capture = async (mode) =>
            Buffer.from(
              await page.evaluate(
                (mode) => window.preparedTextureProbe.capture(mode),
                mode,
              ),
            );
          const original = await capture("legacy"),
            optimized = await capture("prepared");
          assert.equal(original.length, 320 * 180 * 4);
          let changedBytes = 0,
            maxDifference = 0;
          for (let i = 0; i < original.length; i++)
            if (original[i] !== optimized[i]) {
              changedBytes++;
              maxDifference = Math.max(
                maxDifference,
                Math.abs(original[i] - optimized[i]),
              );
            }
          assert.equal(
            changedBytes,
            0,
            `${name}/${renderer}: rendered RGBA differs (${changedBytes} bytes, maximum delta ${maxDifference})`,
          );
          assert.deepEqual(errors, []);
          await page
            .locator("canvas")
            .first()
            .screenshot({ path: path.join(out, `${name}-${renderer}.png`) });
          const report = {
            browser: name,
            channel: channel || "bundled",
            version: browser.version(),
            requestedRenderer: renderer,
            changedBytes,
            maxDifference,
            rgbaSHA256: crypto
              .createHash("sha256")
              .update(optimized)
              .digest("hex"),
            ...metadata,
            errors,
          };
          reports.push(report);
          fs.writeFileSync(
            path.join(out, `${name}-${renderer}.json`),
            JSON.stringify(report, null, 2),
          );
          console.log(
            `PASS ${name}/${renderer}: identical RGBA; zero prepared snapshots/readbacks; ADD then ADD_KEY, registered texture and __BASE intact`,
          );
          await page.close();
        }
      } finally {
        await browser.close();
      }
    }
    fs.writeFileSync(
      path.join(out, "reports.json"),
      JSON.stringify(reports, null, 2),
    );
  } finally {
    await server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
