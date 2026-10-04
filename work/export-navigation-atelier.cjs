const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(
  path.join(root, "Jouer-Technoprof.html"),
  "utf8",
);
for (const revision of ["A1", "A2", "A3"]) {
  const scenario =
    revision === "A1"
      ? "bruel-navigation"
      : "bruel-navigation-" + revision.toLowerCase();
  const bootstrap = `<script>
const atelierUrl = new URL(location.href);
if (!atelierUrl.searchParams.has('essai')) {
  atelierUrl.searchParams.set('essai', 'labo');
  atelierUrl.searchParams.set('scenario', '${scenario}');
  location.replace(atelierUrl.href);
}
</script>`;
  const html = source
    .replace(/(<html\b[^>]*>)/, "$1" + bootstrap)
    .replace(
      /<title>[\s\S]*?<\/title\s*>/,
      `<title>TECHNOPROF — Atelier Bruel ${revision}</title>`,
    );
  if (html === source || !html.includes(bootstrap))
    throw Error("Atelier bootstrap missing");
  const destination = path.join(
    root,
    revision !== "A1"
      ? `Jouer-Technoprof-Atelier-Bruel-${revision}.html`
      : "Jouer-Technoprof-Atelier-Bruel.html",
  );
  fs.writeFileSync(destination, html);
  console.log(
    "Standalone atelier: " +
      destination +
      " (" +
      Buffer.byteLength(html) +
      " bytes)",
  );
}

const h1Bootstrap = `<script>
const atelierUrl = new URL(location.href);
if (!atelierUrl.searchParams.has('essai')) {
  atelierUrl.searchParams.set('essai', 'labo');
  atelierUrl.searchParams.set('scenario', 'hanouna-navigation-h1');
  location.replace(atelierUrl.href);
}
</script>`;
const h1 = source
  .replace(/(<html\b[^>]*>)/, "$1" + h1Bootstrap)
  .replace(
    /<title>[\s\S]*?<\/title\s*>/,
    "<title>TECHNOPROF — Atelier Hanouna H1</title>",
  );
if (!h1.includes(h1Bootstrap)) throw Error("H1 bootstrap missing");
fs.writeFileSync(
  path.join(root, "Jouer-Technoprof-Atelier-Hanouna-H1.html"),
  h1,
);
console.log(
  "Standalone atelier Hanouna H1: " + Buffer.byteLength(h1) + " bytes",
);
