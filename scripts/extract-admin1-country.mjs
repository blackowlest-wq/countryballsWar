import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const [, , sourcePath, adm0A3, countryId, outputStem, exportName] = process.argv;

if (![sourcePath, adm0A3, countryId, outputStem, exportName].every(Boolean)) {
  throw new Error(
    "Usage: node scripts/extract-admin1-country.mjs <source.geojson> <ADM0_A3> <country-id> <output-stem> <EXPORT_NAME>",
  );
}

const source = JSON.parse(fs.readFileSync(path.resolve(sourcePath), "utf8"));
const features = source.features.filter((feature) => feature.properties?.adm0_a3 === adm0A3);
if (features.length === 0) throw new Error(`No Natural Earth Admin 1 features found for ${adm0A3}`);

function fragmentId(feature) {
  const isoCode = feature.properties?.iso_3166_2;
  if (typeof isoCode !== "string" || isoCode.length === 0) {
    throw new Error(`Feature ${feature.properties?.name || "unknown"} has no ISO 3166-2 code`);
  }
  return isoCode
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const compactEntries = features.map((feature) => {
  const properties = feature.properties;
  const id = fragmentId(feature);
  if (![properties.longitude, properties.latitude].every(Number.isFinite)) {
    throw new Error(`Feature ${id} has no finite Natural Earth label point`);
  }
  return [id, {
    fragmentId: id,
    isoA3: adm0A3,
    countryId,
    name: properties.name_en || properties.name,
    labelPoint: [properties.longitude, properties.latitude],
    iso3166: properties.iso_3166_2,
    geometry: feature.geometry,
  }];
});

const ids = compactEntries.map(([id]) => id);
if (new Set(ids).size !== ids.length) throw new Error(`Duplicate generated fragment ID for ${adm0A3}`);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(scriptDirectory, "..", "src", "config", "geodata");
const auditPath = path.join(outputDirectory, `ne_10m_admin_1_${outputStem}.geojson`);
const runtimePath = path.join(outputDirectory, `natural-earth-${outputStem}-admin-1.js`);
const audit = {
  type: source.type,
  name: `ne_10m_admin_1_${outputStem}`,
  crs: source.crs,
  features,
};
const runtimeHeader = [
  "// Derived from Natural Earth 1:10m Admin 1 - States, Provinces v5.1.1",
  `// (commit 9380cca). This compact subset contains ${features.length} ${countryId} features.`,
  "",
].join("\n");

fs.writeFileSync(auditPath, `${JSON.stringify(audit)}\n`);
fs.writeFileSync(
  runtimePath,
  `${runtimeHeader}export const ${exportName} = ${JSON.stringify(Object.fromEntries(compactEntries))};\n`,
);

console.log(JSON.stringify({ auditPath, runtimePath, featureCount: features.length }));
