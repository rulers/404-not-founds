import { test, expect } from "@playwright/test";
test("real mouse/touch transports and splits the body; idle forms 404 which can be grabbed again", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("404/004");
  const stage = page.getByRole("button", { name: /Liquid 404:/ }),
    field = page.locator("[data-renderer]");
  await expect(field).toBeVisible();
  await expect(stage).toHaveAttribute("data-liquid-state", "resting");
  await page.screenshot({
    path: `test-results/${info.project.name}-liquid-pools.png`,
  });
  const bounds = (await field.boundingBox())!,
    height = (bounds.height / bounds.width) * 1000;
  const startX = Number(await stage.getAttribute("data-first-x")),
    startY = Number(await stage.getAttribute("data-first-y"));
  const x = bounds.x + (startX / 1000) * bounds.width,
    y = bounds.y + (startY / height) * bounds.height,
    end = x + bounds.width * 0.52;
  let session;
  if (info.project.name === "mobile") {
    session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
  }
  await expect(stage).toHaveAttribute("data-liquid-state", "touching");
  for (let i = 1; i <= 18; i++) {
    const next = x + ((end - x) * i) / 18;
    if (session)
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: next, y }],
      });
    else await page.mouse.move(next, y);
    await page.waitForTimeout(25);
  }
  await expect
    .poll(async () => Number(await stage.getAttribute("data-first-x")))
    .toBeGreaterThan(startX + 350);
  await expect
    .poll(async () => Number(await stage.getAttribute("data-split")))
    .toBeGreaterThan(0);
  await page.screenshot({
    path: `test-results/${info.project.name}-liquid-stretched.png`,
  });
  if (session) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await session.detach();
  } else await page.mouse.up();
  await expect(stage).toHaveAttribute("data-liquid-state", "resting");
  await expect(stage).toHaveAttribute("data-liquid-state", "formed", {
    timeout: 22000,
  });
  await page.screenshot({
    path: `test-results/${info.project.name}-liquid-formed.png`,
  });
  await stage.focus();
  await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-liquid-state", "touching");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-liquid-state", "resting");
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await expect(
    page.getByRole("link", { name: /DAY 004/ }).locator("img"),
  ).toHaveJSProperty("naturalWidth", 900);
  await expect(page.locator(".gallery-shell")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("WebGL-disabled Canvas fallback supports grab, cancellation, reduced motion and narrow layouts", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("404/004/");
  const stage = page.getByRole("button", { name: /Liquid 404:/ });
  await expect(page.locator('[data-renderer="canvas"]')).toBeVisible();
  await stage.focus();
  await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-liquid-state", "touching");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(stage).toHaveAttribute("data-liquid-state", "resting");
  await page.screenshot({ path: "test-results/liquid-canvas-fallback.png" });
  for (const size of [
    { width: 320, height: 740 },
    { width: 740, height: 360 },
  ]) {
    await page.setViewportSize(size);
    await expect(
      page.getByRole("heading", { name: "Liquid 404" }),
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
test("no JavaScript retains initial pools and navigation", async ({
  page,
  browser,
}) => {
  await page.goto("404/004/");
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const still = await context.newPage();
    await still.goto(page.url());
    await expect(still.locator("svg path").first()).toBeVisible();
    await expect(still.getByRole("link", { name: /DISCOVER/ })).toBeVisible();
  } finally {
    await context.close();
  }
});

test("pushing transported liquid into another pool joins material", async ({
  page,
}, info) => {
  await page.goto("404/004/");
  const stage = page.getByRole("button", { name: /Liquid 404:/ }),
    field = page.locator("[data-renderer]");
  await expect(field).toBeVisible();
  const box = (await field.boundingBox())!,
    h = (box.height / box.width) * 1000,
    x =
      box.x +
      (Number(await stage.getAttribute("data-first-x")) / 1000) * box.width,
    y =
      box.y +
      (Number(await stage.getAttribute("data-first-y")) / h) * box.height;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++) {
    await page.mouse.move(
      x + ((box.width * 0.64 - (x - box.x)) * i) / 30,
      y + ((box.height * 0.23 - (y - box.y)) * i) / 30,
    );
    await page.waitForTimeout(25);
  }
  await expect
    .poll(async () => Number(await stage.getAttribute("data-merged")))
    .toBeGreaterThan(0);
  await page.screenshot({
    path: `test-results/${info.project.name}-liquid-merged.png`,
  });
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-liquid-state", "resting");
});
