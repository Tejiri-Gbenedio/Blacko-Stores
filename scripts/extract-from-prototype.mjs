import fs from "node:fs";
import path from "node:path";

const protoPath = path.resolve(process.cwd(), "docs/atelier-rack-prototype-v2.html");
if (!fs.existsSync(protoPath)) {
  console.error("Place atelier-rack-prototype-v2.html inside Blacko Stores/docs/ first.");
  process.exit(1);
}

const html = fs.readFileSync(protoPath, "utf8");

const writeWebp = (relPath, b64) => {
  const out = path.resolve(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(b64, "base64"));
  console.log("  extracted:", relPath);
};

// Extract the 4 Sky Floral sprites from BASE_ASSETS
for (const key of ["front", "side", "back", "folded"]) {
  const rx = new RegExp(key + ':\\s*"data:image/webp;base64,([^"]+)"');
  const m = html.match(rx);
  if (!m) throw new Error("Could not find " + key + " sprite in prototype HTML.");
  writeWebp("public/assets/shirts/sky-floral-camp/" + key + ".webp", m[1]);
}

// Extract the 2 Custom Bag layers
const bagMatches = [...html.matchAll(/<img src="data:image\/webp;base64,([^"]+)"[^>]*class="bag-layer-(back|front)"/g)];
if (bagMatches.length < 2) {
  throw new Error("Could not find bag-layer-back and bag-layer-front images.");
}
for (const m of bagMatches) {
  const filename = m[2] === "back" ? "bag-back.webp" : "bag-front-lip.webp";
  writeWebp("public/assets/bag/" + filename, m[1]);
}

console.log("\nAll 6 Blacko Stores WebP assets extracted successfully.");
