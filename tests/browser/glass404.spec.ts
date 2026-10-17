import { test, expect } from "@playwright/test";

test("Glass 404 fractures at the material, shatters and regenerates", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("404/003/");
  const stage = page.getByRole("button", { name: /Glass 404:/ });
  await expect(page.locator('canvas[data-enhanced="true"]')).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-glass-whole.png`,
  });
  const box = (await page.locator("canvas").boundingBox())!;
  const at = (x: number, y: number) => ({
    x: box.x + (x / 1000) * box.width,
    y: box.y + (y / 500) * box.height,
  });
  const strike = async (x: number, y: number) => {
    const p = at(x, y);
    if (info.project.name === "mobile") await page.touchscreen.tap(p.x, p.y);
    else await page.mouse.click(p.x, p.y);
  };
  await strike(500, 250); // The hollow zero is not glass.
  await expect(stage).toHaveAttribute("data-damage", "0");
  await strike(270, 200);
  await expect(stage).toHaveAttribute("data-damage", "1");
  await expect(stage).toHaveAttribute("data-glass-phase", "cracked");
  await page.screenshot({
    path: `test-results/${info.project.name}-glass-cracked.png`,
  });
  for (let i = 0; i < 5; i++) await strike(270, 240);
  await expect(stage).toHaveAttribute("data-glass-phase", "shattered");
  await expect(stage).toHaveAttribute("data-glass-phase", "reforming");
  await expect(stage).toHaveAttribute("data-glass-phase", "whole");
  await expect(stage).toHaveAttribute("data-damage", "0");
  await stage.focus();
  await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-damage", "1");
  await page.setViewportSize({ width: 320, height: 740 });
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        return canvas
          .getContext("2d")!
          .getImageData(
            Math.floor(canvas.width * 0.27),
            Math.floor(canvas.height * 0.48),
            1,
            1,
          ).data[3];
      }),
    )
    .toBeGreaterThan(0);
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  const card = page.getByRole("link", { name: /DAY 003/ });
  await expect(card.locator("img")).toHaveJSProperty("naturalWidth", 900);
  await card.click();
  await expect(stage).toHaveAttribute("data-damage", "0");
  expect(errors).toEqual([]);
});

test("Glass stays visible without Canvas and fits reduced-motion phone/landscape", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const size of [
    { width: 320, height: 740 },
    { width: 740, height: 360 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("404/003");
    await expect(page.locator("svg path").last()).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    await page.getByRole("link", { name: /DISCOVER/ }).click();
    await expect(page.locator(".discover-footer")).toBeVisible();
  }
});

test("reduced motion preserves the fracture/rebuild cycle", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("404/003/");
  const stage = page.getByRole("button", { name: /Glass 404:/ });
  await stage.focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press("Space");
  await expect(stage).toHaveAttribute("data-glass-phase", "shattered");
  await expect(stage).toHaveAttribute("data-glass-phase", "whole", {
    timeout: 6000,
  });
});
