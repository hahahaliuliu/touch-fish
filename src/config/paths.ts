import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

const assetRoot = process.env.TOUCHFISH_ASSET_DIR
  ? path.resolve(process.env.TOUCHFISH_ASSET_DIR)
  : path.join(projectRoot, "assets");

export function resolveAssetPath(...segments: string[]) {
  return path.join(assetRoot, ...segments);
}
