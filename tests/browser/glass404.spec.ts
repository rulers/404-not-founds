import { test, expect } from "@playwright/test";

test("Glass chips at the chosen point, ignores the hole and can be cleared", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("404/003/");
  const stage = page.getByRole("button", { name: /Glass 404:/ });
  await expect(page.locator('canvas[data-enhanced="true"]')).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-glass-whole.png`,
  });
  const box = (await page.locator("canvas").boundingBox())!;
  const hit = async (x: number, y: number) => {
    const p = {
      x: box.x + (x / 1000) * box.width,
      y: box.y + (y / 500) * box.height,
    };
    if (info.project.name === "mobile") await page.touchscreen.tap(p.x, p.y);
    else await page.mouse.click(p.x, p.y);
  };
  await hit(500, 250);
  await expect(stage).toHaveAttribute("data-damage", "0");
  await hit(270, 200);
  await expect(stage).toHaveAttribute("data-damage", "1");
  const remaining = Number(await stage.getAttribute("data-remaining"));
  expect(remaining).toBeLessThan(100);
  expect(remaining).toBeGreaterThan(70);
  await hit(270, 200);
  await expect(stage).toHaveAttribute("data-damage", "1");
  await page.screenshot({
    path: `test-results/${info.project.name}-glass-chipped.png`,
  });
  await stage.focus();
  for (
    let i = 0;
    i < 70 && (await stage.getAttribute("data-glass-phase")) !== "shattered";
    i++
  )
    await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-glass-phase", "shattered");
  await expect(stage).toHaveAttribute("data-remaining", "0");
  await expect(stage).toHaveAttribute("data-glass-phase", "whole", {
    timeout: 6000,
  });
  await expect(stage).toHaveAttribute("data-remaining", "100");
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  const card = page.getByRole("link", { name: /DAY 003/ });
  await expect(card.locator("img")).toHaveJSProperty("naturalWidth", 900);
  await card.click();
  await expect(stage).toHaveAttribute("data-damage", "0");
  expect(errors).toEqual([]);
});

test("holding an impact removes a larger area; cancelling never strikes", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("404/003/");
  const stage = page.getByRole("button", { name: /Glass 404:/ });
  await expect(page.locator('canvas[data-enhanced="true"]')).toBeVisible();
  const box = (await page.locator("canvas").boundingBox())!,
    x = box.x + box.width * 0.27,
    y = box.y + box.height * 0.4;
  await page.mouse.click(x, y);
  const quick = 100 - Number(await stage.getAttribute("data-remaining"));
  await page.reload();
  await expect(page.locator('canvas[data-enhanced="true"]')).toBeVisible();
  await page.mouse.move(x, y);
  await page.mouse.down();
  await stage.dispatchEvent("pointercancel");
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-damage", "0");
  await page.mouse.down();
  await page.clock.runFor(950);
  await page.mouse.up();
  const strong = 100 - Number(await stage.getAttribute("data-remaining"));
  expect(strong).toBeGreaterThan(quick * 2);
  await page.screenshot({ path: "test-results/glass-charged-impact.png" });
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

test("reduced motion preserves local destruction and regeneration", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("404/003/");
  const stage = page.getByRole("button", { name: /Glass 404:/ });
  await stage.focus();
  for (
    let i = 0;
    i < 70 && (await stage.getAttribute("data-glass-phase")) !== "shattered";
    i++
  )
    await page.keyboard.press("Space");
  await expect(stage).toHaveAttribute("data-glass-phase", "shattered");
  await expect(stage).toHaveAttribute("data-glass-phase", "whole", {
    timeout: 6000,
  });
});
