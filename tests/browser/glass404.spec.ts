import { test, expect } from "@playwright/test";
test("whole-screen pane responds outside the old digits, scores, collapses and regenerates", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("404/003");
  const stage = page.getByRole("button", { name: /Glass 404:/ });
  await expect(page.locator('canvas[data-enhanced="true"]')).toBeVisible();
  const box = (await stage.boundingBox())!;
  const x = box.x + box.width * 0.18,
    y = box.y + box.height * 0.28;
  await page.screenshot({
    path: `test-results/${info.project.name}-glass-world.png`,
  });
  // Jittered cell geometry changes how many quick hits a local joint needs.
  for (
    let hit = 0;
    hit < 6 && Number(await stage.getAttribute("data-remaining")) === 100;
    hit++
  ) {
    if (info.project.name === "mobile") await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  }
  expect(
    Number(await stage.getAttribute("data-damage")),
  ).toBeGreaterThanOrEqual(2);
  expect(Number(await stage.getAttribute("data-remaining"))).toBeLessThan(100);
  await stage.focus();
  for (
    let i = 0;
    i < 100 && (await stage.getAttribute("data-glass-phase")) !== "shattered";
    i++
  )
    await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-glass-phase", "shattered");
  await expect(stage).toHaveAttribute("data-remaining", "0");
  await page.screenshot({
    path: `test-results/${info.project.name}-glass-through.png`,
  });
  await expect(stage).toHaveAttribute("data-glass-phase", "whole", {
    timeout: 6500,
  });
  await expect(stage).toHaveAttribute("data-remaining", "100");
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await expect(
    page.getByRole("link", { name: /DAY 003/ }).locator("img"),
  ).toHaveJSProperty("naturalWidth", 900);
  expect(errors).toEqual([]);
});
test("drag scores the pane; a cancelled press does not strike", async ({
  page,
}) => {
  await page.goto("404/003/");
  const stage = page.getByRole("button", { name: /Glass 404:/ });
  await expect(page.locator('canvas[data-enhanced="true"]')).toBeVisible();
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.width * 0.25, box.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(box.width * 0.65, box.height * 0.4, { steps: 20 });
  await page.mouse.up();
  expect(Number(await stage.getAttribute("data-scored"))).toBeGreaterThan(0);
  await expect(stage).toHaveAttribute("data-damage", "0");
  await page.screenshot({ path: "test-results/glass-scored.png" });
  await page.mouse.down();
  await stage.dispatchEvent("pointercancel");
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-damage", "0");
});
test("reduced motion retains destruction and fallback world fits narrow and landscape screens", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("404/003/");
  const stage = page.getByRole("button", { name: /Glass 404:/ });
  await stage.focus();
  for (
    let i = 0;
    i < 100 && (await stage.getAttribute("data-glass-phase")) !== "shattered";
    i++
  )
    await page.keyboard.press("Space");
  await expect(stage).toHaveAttribute("data-glass-phase", "shattered");
  await expect(stage).toHaveAttribute("data-glass-phase", "whole", {
    timeout: 6500,
  });
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  for (const size of [
    { width: 320, height: 740 },
    { width: 740, height: 360 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("404/003/");
    await expect(page.getByText("NO WORLD BEYOND THIS POINT")).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
});
