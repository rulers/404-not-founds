import { test, expect, type Page } from "@playwright/test";

const stageSelector = 'section[aria-label="404 Ripples"]';
async function visit(page: Page) {
  await page.clock.install();
  await page.goto("404/009/");
  await expect(page.locator(stageSelector)).toHaveAttribute(
    "data-ready",
    "true",
  );
}
async function drag(
  page: Page,
  mobile: boolean,
  duration: number,
  distance: number,
) {
  const width = page.viewportSize()!.width;
  const x = width * 0.3,
    y = page.viewportSize()!.height * 0.55;
  const steps = 20;
  if (mobile) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
    for (let i = 1; i <= steps; i++) {
      await page.clock.runFor(duration / steps);
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + (distance * i) / steps, y, id: 1 }],
      });
    }
    await page.clock.runFor(50);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) {
      await page.clock.runFor(duration / steps);
      await page.mouse.move(x + (distance * i) / steps, y);
    }
    await page.clock.runFor(50);
    await page.mouse.up();
  }
}
async function number(page: Page, attribute: string) {
  return Number(await page.locator(stageSelector).getAttribute(attribute));
}

test("slow and fast real pointer drags drive the shared wind; release retains drift and fades", async ({
  page,
}, info) => {
  await visit(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const before = await number(page, "data-leaf-x");
  await drag(page, info.project.name === "mobile", 1600, 45);
  const weak = await number(page, "data-force");
  expect(weak).toBeGreaterThan(0.05);
  expect(await number(page, "data-wind-x")).toBeGreaterThan(0);
  expect(await number(page, "data-leaf-x")).toBeGreaterThan(before);
  await page.clock.runFor(7000);
  expect(await number(page, "data-force")).toBeLessThan(0.02);
  await drag(page, info.project.name === "mobile", 400, 170);
  expect(await number(page, "data-force")).toBeGreaterThan(weak * 1.3);
  const released = await number(page, "data-leaf-x");
  await page.clock.runFor(500);
  expect(await number(page, "data-leaf-x")).toBeGreaterThan(released);
  expect(errors).toEqual([]);
});

test("keyboard holds reach the edge without loss, then reverse wind releases the leaf", async ({
  page,
}) => {
  test.setTimeout(60000);
  await visit(page);
  const input = page.getByRole("group", { name: "水面に風を送る" });
  await input.focus();
  await page.keyboard.down("ArrowRight");
  // Ten-minute boundary stability is covered by the model test; 30s reaches the edge in-browser.
  await page.clock.runFor(30000);
  const edge = await number(page, "data-leaf-x");
  expect(edge).toBeLessThan(1);
  expect(edge).toBeGreaterThan(0.9);
  await page.clock.runFor(10000);
  expect(Math.abs((await number(page, "data-leaf-x")) - edge)).toBeLessThan(
    0.002,
  );
  await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(4500);
  expect(await number(page, "data-leaf-x")).toBeLessThan(edge - 0.025);
  await page.keyboard.up("ArrowLeft");
  await page.clock.runFor(7000);
  expect(await number(page, "data-force")).toBeLessThan(0.02);
});

test("navigation and taps do not blow; cancel, resize and hidden tabs leave no stale input", async ({
  page,
}) => {
  await visit(page);
  const stage = page.locator(stageSelector);
  const input = page.getByRole("group", { name: "水面に風を送る" });
  await page.mouse.click(100, 250);
  await page.clock.runFor(100);
  expect(await number(page, "data-force")).toBe(0);
  // Returning by keyboard after a pointer interaction must restore the focus ring.
  await page.getByRole("link", { name: /HOME/ }).focus();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS("outline-style", "solid");
  await input.focus();
  await page.keyboard.down("ArrowUp");
  await page.clock.runFor(800);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const phase = await number(page, "data-phase");
  await page.clock.runFor(10000);
  expect(await number(page, "data-phase")).toBe(phase);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.keyboard.up("ArrowUp");
  await page.clock.runFor(40);
  expect((await number(page, "data-phase")) - phase).toBeLessThan(0.1);
  await page.mouse.move(100, 250);
  await page.mouse.down();
  await page.clock.runFor(100);
  await page.mouse.move(160, 250);
  await page.clock.runFor(100);
  await input.dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-input", "idle");
  for (const size of [
    { width: 320, height: 740 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.clock.runFor(100);
    await expect(stage).toHaveAttribute("data-width", String(size.width));
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    await expect(page.getByRole("link", { name: /DISCOVER/ })).toBeVisible();
  }
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await expect(page.getByRole("link", { name: /DAY 009/ })).toBeVisible();
  await page.getByRole("link", { name: /DAY 009/ }).click();
  await expect(stage).toHaveAttribute("data-input", "idle");
  expect(await number(page, "data-force")).toBe(0);
});

test("reduced motion keeps letters and leaf still and renders static directional feedback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit(page);
  const x = await number(page, "data-leaf-x"),
    y = await number(page, "data-leaf-y");
  const input = page.getByRole("group", { name: "水面に風を送る" });
  await input.focus();
  await page.keyboard.down("ArrowLeft");
  await page.clock.runFor(2000);
  expect(await number(page, "data-wind-x")).toBeLessThan(-0.3);
  expect(await number(page, "data-leaf-x")).toBe(x);
  expect(await number(page, "data-leaf-y")).toBe(y);
  expect(await number(page, "data-phase")).toBe(0);
  await expect(page.locator("output")).toContainText("←");
  await page.keyboard.up("ArrowLeft");
  await page.clock.runFor(10000);
  const pixels = await page
    .locator("canvas")
    .evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.clock.runFor(5000);
  expect(
    await page
      .locator("canvas")
      .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
  ).toBe(pixels);
});

test("static water fallback and navigation remain available without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}404/009`);
  await expect(
    page.getByRole("img", { name: /青緑の静かな水面/ }),
  ).toBeVisible();
  await expect(page.locator("noscript p")).toBeVisible();
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await expect(page.getByRole("link", { name: /DAY 009/ })).toBeVisible();
  await context.close();
});
