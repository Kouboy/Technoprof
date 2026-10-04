// Reference graph for runtime comparisons, not the game's source of truth.
const fs = require("node:fs");
const d = JSON.parse(
  fs.readFileSync("work/bruel-navigation-a2-design.json", "utf8"),
);
d.revision = "A3-workshop";
const zone = (id) => d.zones.find((z) => z.id === "bruel-" + id);
zone("hall").exits = zone("hall").exits.filter((e) => e.to !== d.health.zone);
zone("jonction-b").exits.push({
  to: d.health.zone,
  x: 170,
  spawn: 55,
  kind: "UP",
  sign: "INFIRMERIE / 1ER",
});
zone("infirmerie").floor = 1;
zone("infirmerie").exits = [
  {
    to: "bruel-jonction-b",
    x: 60,
    spawn: 170,
    kind: "DOWN",
    sign: "JONCTION / 1ER",
  },
];
for (const [care, base] of [
  ["discoveryWithCare", "discovery"],
  ["knownWithCare", "known"],
]) {
  const route = [...d.routes[base]],
    i = route.indexOf("bruel-jonction-b");
  route.splice(i + 1, 0, d.health.zone, "bruel-jonction-b");
  d.routes[care] = route;
}
fs.writeFileSync(
  "work/bruel-navigation-a3-design.json",
  JSON.stringify(d, null, 2) + "\n",
);
