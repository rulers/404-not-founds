import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test.describe.configure({ mode: "serial" });
async function ready(page: Page, url: string) {
  await page.goto(url);
  await expect(
    page.locator('section[aria-label="404 Ripples"]'),
  ).toHaveAttribute("data-ready", "true");
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
  await breeze(page, 2200, 70);
  await page.waitForTimeout(500);
  await breeze(page, 500, 300, 5);
  await page.screenshot({ path: info.outputPath("009-wind.png") });
  await page.waitForTimeout(7500);
  await context.close();
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
  const before = Number(
    await page
      .locator('section[aria-label="404 Ripples"]')
      .getAttribute("data-leaf-x"),
  );
  await page.keyboard.down("ArrowLeft");
  await page.waitForTimeout(5500);
  await page.keyboard.up("ArrowLeft");
  const after = Number(
    await page
      .locator('section[aria-label="404 Ripples"]')
      .getAttribute("data-leaf-x"),
  );
  expect(after).toBeLessThan(before - 0.02);
  await page.waitForTimeout(500);
  await context.close();
});
