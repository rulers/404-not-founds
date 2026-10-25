import { mkdir, readdir, copyFile, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
const root = "test-results";
const target = "ripples-review";
let files;
try {
  files = await readdir(root, { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  process.exit(0);
}
await mkdir(target, { recursive: true });
let copied = 0;
for (const file of files) {
  if (!file.includes("ripples404-review-")) continue;
  let name = basename(file);
  if (!/^009-(desktop|mobile|wind)\.png$/.test(name)) {
    if (!name.endsWith(".webm")) continue;
    name = file.includes("breeze-video")
      ? "009-interaction.webm"
      : "009-edge-return.webm";
  }
  await copyFile(join(root, file), join(target, name));
  copied++;
}
if (copied !== 5) throw new Error(`Expected 5 review files, collected ${copied}.`);
await writeFile(
  join(target, "README.md"),
  `# 404 Ripples — browser review\n\nPC: 1280×900 / mobile: 390×844 (Chromium emulation).\n\n- 009-desktop.png: idle\n- 009-mobile.png: idle\n- 009-wind.png: stronger breeze\n- 009-interaction.webm: idle → slow drag → faster drags → decay (real time)\n- 009-edge-return.webm: hold right → slow at edge → hold left → return (real time)\n\nThese are browser captures of the implementation. Physical Safari/Android device testing is separate.\n`,
);
console.log(`Collected ${copied} Ripples review files.`);
