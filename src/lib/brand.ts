import { readdir } from "node:fs/promises";
import path from "node:path";

/** Prefer explicit approved logo filenames; preserve every supplied asset. */
export async function getBrandLogo(): Promise<string | null> {
  try {
    const files = await readdir(path.join(process.cwd(), "public", "brand"));
    const candidates = files.filter((file) => /\.(svg|png|webp|avif|jpe?g)$/i.test(file));
    const preferred = ["logo.svg", "logo.png", "logo.webp", "logo-dark.svg", "logo-dark.png"];
    const selected = preferred.map((name) => candidates.find((file) => file.toLowerCase() === name)).find(Boolean)
      ?? candidates.find((file) => /^01[_-]/.test(file))
      ?? candidates.find((file) => /logo|شعار/i.test(file))
      ?? (candidates.length === 1 ? candidates[0] : null);
    return selected ? `/brand/${encodeURIComponent(selected)}` : null;
  } catch {
    return null;
  }
}
