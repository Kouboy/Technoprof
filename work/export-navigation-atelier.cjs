const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(
  path.join(root, "Jouer-Technoprof.html"),
  "utf8",
);
const bootstrap = `<script>
const atelierUrl = new URL(location.href);
if (!atelierUrl.searchParams.has('essai')) {
  atelierUrl.searchParams.set('essai', 'labo');
  atelierUrl.searchParams.set('scenario', 'bruel-navigation');
  location.replace(atelierUrl.href);
}
</script>`;
const html = source
  .replace(/(<html\b[^>]*>)/, "$1" + bootstrap)
  .replace(
    /<title>[\s\S]*?<\/title\s*>/,
    "<title>TECHNOPROF — Atelier Bruel A1</title>",
  );
if (html === source || !html.includes(bootstrap))
  throw Error("Atelier bootstrap missing");
const destination = path.join(root, "Jouer-Technoprof-Atelier-Bruel.html");
fs.writeFileSync(destination, html);
console.log(
  "Standalone atelier: " +
    destination +
    " (" +
    Buffer.byteLength(html) +
    " bytes)",
);
