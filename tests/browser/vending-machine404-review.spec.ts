import { test, expect } from "@playwright/test";
import { products } from "../../lib/vending-machine404";

test("each falling product starts on its own shelf and lands in the shared tray", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("404/007/");
  const stage = page.locator("section[data-ready=true]");
  await expect(stage).toBeVisible();
  const arrivals: { x: number; y: number }[] = [];
  for (const product of products) {
    await page
      .getByRole("button", { name: `${product.id} ${product.name}を選ぶ` })
      .click();
    await page.clock.runFor(1050);
    await expect(stage).toHaveAttribute("data-phase", "drop");
    const geometry = await stage.evaluate((el, id) => {
      const cargo = el.querySelector<HTMLElement>("[data-cargo]")!;
      const animation = cargo
        .getAnimations()
        .find(
          (a) => a instanceof CSSAnimation && a.animationName.endsWith("fall"),
        )!;
      animation.pause();
      animation.currentTime = 0;
      const sample = el
        .querySelector(`[data-slot="${id}"] svg > g`)!
        .getBoundingClientRect();
      const falling = cargo.querySelector("svg > g")!.getBoundingClientRect();
      const origin = {
        x: falling.x - sample.x,
        y: falling.y - sample.y,
        width: falling.width - sample.width,
        height: falling.height - sample.height,
      };
      animation.currentTime = 700;
      const arrival = cargo.getBoundingClientRect();
      const tray = el
        .querySelector('button[aria-label="フラップを開けて商品を取り出す"]')!
        .getBoundingClientRect();
      return {
        origin,
        arrival: {
          x: arrival.x + arrival.width / 2,
          y: arrival.y + arrival.height / 2,
        },
        tray: { x: tray.x, y: tray.y, right: tray.right, bottom: tray.bottom },
      };
    }, product.id);
    for (const difference of Object.values(geometry.origin))
      expect(
        Math.abs(difference),
        `${product.id} shelf alignment`,
      ).toBeLessThan(1);
    expect(geometry.arrival.x).toBeGreaterThan(geometry.tray.x);
    expect(geometry.arrival.x).toBeLessThan(geometry.tray.right);
    expect(geometry.arrival.y).toBeGreaterThan(geometry.tray.y);
    expect(geometry.arrival.y).toBeLessThan(geometry.tray.bottom);
    arrivals.push(geometry.arrival);
    await page.clock.runFor(750);
    await page.getByRole("button", { name: /フラップ/ }).click();
    await page.clock.runFor(700);
    // Reset from the stable inspect/result state for the next purchase.
    if (product.id === "B2") await page.clock.runFor(1000);
    await page.keyboard.press("Escape");
    await expect(stage).toHaveAttribute("data-phase", "idle");
  }
  for (const arrival of arrivals) {
    expect(Math.abs(arrival.x - arrivals[0].x)).toBeLessThan(1);
    expect(Math.abs(arrival.y - arrivals[0].y)).toBeLessThan(1);
  }
});

for (const cancelPhase of ["collect", "reveal"] as const) {
  test(`Escape cancels immediately during ${cancelPhase}, even with focus on body`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("404/007/");
    const stage = page.locator("section[data-ready=true]");
    await expect(stage).toBeVisible();
    const select = page.getByRole("button", { name: /A1 Missing Page/ });
    await select.click();
    await page.clock.runFor(1100);
    await page.clock.runFor(750);
    const collect = page.getByRole("button", { name: /フラップ/ });
    await collect.click();
    if (cancelPhase === "reveal") {
      await page.clock.runFor(700);
      await page.getByRole("button", { name: "箱を開ける" }).click();
    }
    await expect(stage).toHaveAttribute("data-phase", cancelPhase);
    // Disabled controls can retain focus in Chromium; reproduce browsers that blur them.
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.keyboard.press("Escape");
    await expect(stage).toHaveAttribute("data-phase", "idle");
    await expect(select).toBeFocused();
    await page.clock.runFor(4000);
    await expect(stage).toHaveAttribute("data-phase", "idle");
    // Cancelled timers cannot advance a later purchase early.
    await select.click();
    await page.clock.runFor(100);
    await expect(stage).toHaveAttribute("data-phase", "coil");
    await page.getByRole("link", { name: /DISCOVER/ }).click();
    await page.clock.runFor(4000);
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: /DAY 007/ }).click();
    await expect(stage).toHaveAttribute("data-phase", "idle");
  });
}
