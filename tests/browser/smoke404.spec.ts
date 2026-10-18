import { test, expect, type Page } from "@playwright/test";
async function alpha(page: Page) {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>("[data-smoke-phase]")!,
      canvases = stage.querySelectorAll("canvas"),
      canvas = canvases[stage.dataset.renderer === "webgl" ? 0 : 1],
      x = Math.floor(canvas.width * 0.55),
      y = Math.floor(canvas.height * 0.49);
    if (stage.dataset.renderer === "webgl") {
      const gl = canvas.getContext("webgl")!,
        pixel = new Uint8Array(4);
      gl.readPixels(
        x,
        canvas.height - y,
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixel,
      );
      return pixel[3];
    }
    return canvas.getContext("2d")!.getImageData(x, y, 1, 1).data[3];
  });
}
async function setup(page: Page, canvasOnly = false) {
  await page.addInitScript((canvasOnly) => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      options?: Record<string, unknown>,
    ) {
      if (type === "webgl") {
        if (canvasOnly) return null;
        options = { ...options, preserveDrawingBuffer: true };
      }
      return original.apply(this, [type, options] as Parameters<
        typeof original
      >);
    } as typeof original;
  }, canvasOnly);
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto("404/005");
  await expect(page.locator("[data-renderer]")).toBeVisible();
  await page.clock.runFor(40);
}
test("404 starts visible, is veiled, is revealed by mouse/touch and stays fixed", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await setup(page);
  const stage = page.getByRole("button", { name: /Lost in Smoke 404:/ }),
    number = page.locator("[data-smoke-number]"),
    original = await number.boundingBox();
  await page.clock.fastForward(1000);
  await page.clock.runFor(40);
  await expect(stage).toHaveAttribute("data-smoke-phase", "visible");
  expect(await alpha(page)).toBeLessThan(10);
  await page.screenshot({
    path: `test-results/${info.project.name}-smoke-visible.png`,
  });
  await page.clock.fastForward(4600);
  await page.clock.runFor(40);
  await expect(stage).toHaveAttribute("data-smoke-phase", "veiled");
  const covered = await alpha(page);
  expect(covered).toBeGreaterThan(210);
  await page.screenshot({
    path: `test-results/${info.project.name}-smoke-veiled.png`,
  });
  const box = (await stage.boundingBox())!,
    y = box.height * 0.49;
  let touch;
  if (info.project.name === "mobile") {
    touch = await page.context().newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.width * 0.3, y }],
    });
  } else await page.mouse.move(box.width * 0.3, y);
  for (let i = 0; i <= 12; i++) {
    const x = box.width * (0.3 + i * 0.04);
    if (touch)
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y }],
      });
    else await page.mouse.move(x, y);
    await page.clock.runFor(20);
  }
  await page.clock.runFor(40);
  await expect(stage).toHaveAttribute("data-smoke-phase", "clearing");
  expect(await alpha(page)).toBeLessThan(covered - 100);
  expect(await number.boundingBox()).toEqual(original);
  await page.screenshot({
    path: `test-results/${info.project.name}-smoke-wind.png`,
  });
  if (touch) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await touch.detach();
  } else await page.mouse.move(3, box.height - 3);
  await page.clock.fastForward(6500);
  await page.clock.runFor(40);
  await expect(stage).toHaveAttribute("data-smoke-phase", "veiled");
  expect(await alpha(page)).toBeGreaterThan(210);
  expect(await number.boundingBox()).toEqual(original);
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  const card = page.getByRole("link", { name: /DAY 005/ });
  await expect(card.locator("img")).toHaveJSProperty("naturalWidth", 900);
  await card.click();
  await expect(stage).toHaveAttribute("data-smoke-phase", "visible");
  expect(errors).toEqual([]);
});
test("Canvas fallback, keyboard wind, reduced motion and small/landscape navigation", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page, true);
  const stage = page.getByRole("button", { name: /Lost in Smoke 404:/ });
  await expect(stage).toHaveAttribute("data-renderer", "canvas");
  await page.clock.runFor(40);
  await page.clock.fastForward(5600);
  await page.clock.runFor(40);
  expect(await alpha(page)).toBeGreaterThan(210);
  await stage.focus();
  await page.keyboard.press("Enter");
  await page.clock.runFor(60);
  await expect(stage).toHaveAttribute("data-smoke-phase", "clearing");
  expect(await alpha(page)).toBeLessThan(100);
  await page.screenshot({
    path: `test-results/${info.project.name}-smoke-fallback.png`,
  });
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await page.clock.fastForward(6500);
  await page.clock.runFor(40);
  await expect(stage).toHaveAttribute("data-smoke-phase", "veiled");
  for (const size of [
    { width: 320, height: 740 },
    { width: 740, height: 360 },
  ]) {
    await page.setViewportSize(size);
    await expect(
      page.getByRole("heading", { name: "Lost in Smoke 404" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
  }
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await expect(page.locator(".discover-footer")).toBeVisible();
});
test("no JavaScript leaves a legible 404 and navigation", async ({
  browser,
  page,
}) => {
  await page.goto("404/005/");
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const still = await context.newPage();
    await still.goto(page.url());
    await expect(still.locator("[data-smoke-number]")).toHaveText("404");
    await expect(still.locator("[data-smoke-number]")).toBeVisible();
    await still.getByRole("link", { name: /DISCOVER/ }).click();
    await expect(still.locator(".artwork-grid")).toBeVisible();
  } finally {
    await context.close();
  }
});

test("a lost WebGL context repaints the Canvas fallback even when reduced motion is still", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page);
  const stage = page.locator("[data-smoke-phase]");
  test.skip(
    (await stage.getAttribute("data-renderer")) !== "webgl",
    "WebGL unavailable; the separate forced-Canvas test covers this environment.",
  );
  await page.clock.fastForward(5600);
  await page.clock.runFor(40);
  await expect(stage).toHaveAttribute("data-smoke-phase", "veiled");
  expect(await alpha(page)).toBeGreaterThan(210);
  const supported = await page.evaluate(() => {
    const gl = document.querySelector(
      "button[data-renderer] canvas",
    ) as HTMLCanvasElement;
    const extension = gl
      .getContext("webgl")!
      .getExtension("WEBGL_lose_context");
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  test.skip(!supported, "Context loss extension unavailable.");
  await expect(stage).toHaveAttribute("data-renderer", "canvas");
  await page.clock.runFor(40);
  expect(await alpha(page)).toBeGreaterThan(210);
  await stage.focus();
  await page.keyboard.press("Enter");
  await page.clock.runFor(100);
  expect(await alpha(page)).toBeLessThan(100);
});
