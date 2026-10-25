import { test, expect, type Page } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";

test.describe.configure({ mode: "serial" });
async function ready(page: Page, url: string) {
  await page.goto(url);
  await expect(
    page.locator('section[aria-label="404 Ripples"]'),
  ).toHaveAttribute("data-ready", "true");
}
// Transport a few review frames through CI logs when local browser access is unavailable.
// Full-resolution PNGs and the two real-time videos remain in the CI artifact.
function reviewPayload(name: string, data: string) {
  const parts = Math.ceil(data.length / 16000);
  for (let i = 0; i < parts; i++)
    console.log(
      `RIPPLES_REVIEW:${name}:${i}/${parts}:${data.slice(
        i * 16000,
        (i + 1) * 16000,
      )}`,
    );
}
async function reviewFrame(page: Page, name: string) {
  if (process.env.RIPPLES_REVIEW_IMAGES !== "1") return;
  reviewPayload(
    name,
    (await page.screenshot({ type: "jpeg", quality: 65 })).toString("base64"),
  );
}
async function reviewVideo(page: Page, name: string) {
  if (process.env.RIPPLES_REVIEW_IMAGES !== "1") return;
  const path = await page.video()!.path();
  reviewPayload(name, (await readFile(path)).toString("base64"));
}
async function breeze(
  page: Page,
  duration: number,
  distance: number,
  repetitions = 1,
) {
  for (let j = 0; j < repetitions; j++) {
    await page.mouse.move(360, 550);
    await page.mouse.down();
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      await page.waitForTimeout(duration / steps);
      await page.mouse.move(360 + (distance * i) / steps, 550);
    }
    await page.mouse.up();
  }
}

test("review: idle, slow breeze, stronger breeze and natural decay in real time", async ({
  browser,
  baseURL,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Capture once; mobile interaction is tested separately.",
  );
  test.setTimeout(45000);
  const dir = info.outputPath("breeze-video");
  await mkdir(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir, size: { width: 1280, height: 900 } },
  });
  const page = await context.newPage();
  await ready(page, `${baseURL}404/009/`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: info.outputPath("009-desktop.png") });
  await reviewFrame(page, "desktop");
  await breeze(page, 2200, 70);
  await reviewFrame(page, "weak");
  await page.waitForTimeout(500);
  await breeze(page, 500, 300, 5);
  await page.screenshot({ path: info.outputPath("009-wind.png") });
  await reviewFrame(page, "wind");
  await page.waitForTimeout(7500);
  await reviewFrame(page, "calm");
  await context.close();
  await reviewVideo(page, "interaction-video");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobile.newPage();
  await ready(mobilePage, `${baseURL}404/009/`);
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: info.outputPath("009-mobile.png") });
  await reviewFrame(mobilePage, "mobile");
  await mobile.close();
});

test("review: the single leaf reaches an edge and returns with reverse wind in real time", async ({
  browser,
  baseURL,
}, info) => {
  test.skip(info.project.name !== "desktop", "Capture once.");
  test.setTimeout(45000);
  const dir = info.outputPath("edge-video");
  await mkdir(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: { dir, size: { width: 1280, height: 900 } },
  });
  const page = await context.newPage();
  await ready(page, `${baseURL}404/009/`);
  const input = page.getByRole("group", { name: "水面に風を送る" });
  await input.focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(12000);
  await page.keyboard.up("ArrowRight");
  await reviewFrame(page, "edge");
  const before = Number(
    await page
      .locator('section[aria-label="404 Ripples"]')
      .getAttribute("data-leaf-x"),
  );
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(5500);
  await page.keyboard.up("ArrowLeft");
  await reviewFrame(page, "returned");
  const after = Number(
    await page
      .locator('section[aria-label="404 Ripples"]')
      .getAttribute("data-leaf-x"),
  );
  expect(after).toBeLessThan(before - 0.02);
  await page.waitForTimeout(500);
  await context.close();
  await reviewVideo(page, "edge-video");
});
