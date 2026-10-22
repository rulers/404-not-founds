import { test, expect, type Page } from "@playwright/test";

async function visit(page: Page) {
  await page.clock.install();
  await page.goto("404/008/");
  await expect(page.locator('section[data-ready="true"]')).toBeVisible();
}
async function drag(page: Page, mobile: boolean, dx: number, dy: number) {
  const plane = page.getByRole("button", { name: /紙飛行機を飛ばす/ });
  const box = (await plane.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  if (mobile) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
    for (let i = 1; i <= 8; i++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + (dx * i) / 8, y: y + (dy * i) / 8, id: 1 }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 8 });
    await page.mouse.up();
  }
}
async function finish(page: Page) {
  await page.clock.runFor(7900);
  await expect(page.locator("section[data-phase]")).toHaveAttribute(
    "data-phase",
    "returned",
  );
  await page.clock.runFor(1500);
}

test("direction and strength change real flights; the same plane returns stamped and can fly again", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await visit(page);
  const stage = page.getByRole("region", { name: "404 Paper Plane" });
  const plane = page.getByRole("button", { name: /紙飛行機を飛ばす/ });
  const original = await plane.elementHandle();
  await expect(stage).toHaveAttribute("data-stamped", "false");
  const stamp = page.locator("[data-stamp]");
  await expect(stamp).toHaveCSS("opacity", "0");
  const distances: number[] = [];
  for (const [dx, dy] of [
    [30, -20],
    [135, -90],
    [-95, -85],
  ]) {
    await drag(page, info.project.name === "mobile", dx, dy);
    await expect(stage).toHaveAttribute("data-phase", "flying");
    expect(Number(await stage.getAttribute("data-launch-angle"))).toBeCloseTo(
      Math.atan2(dy, dx),
      2,
    );
    await page.clock.runFor(2000);
    const x = Number(await stage.getAttribute("data-flight-x")),
      y = Number(await stage.getAttribute("data-flight-y"));
    distances.push(Math.hypot(x, y));
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await expect(stage).toHaveAttribute("data-phase", "flying");
    await finish(page);
    await expect(stage).toHaveAttribute("data-flight-x", "0.00");
    await expect(stage).toHaveAttribute("data-flight-y", "0.00");
    await expect(stage).toHaveAttribute("data-stamped", "true");
    await expect(stamp).toHaveCSS("opacity", "0.9");
    await expect(stamp).toContainText("DESTINATION");
    await expect(stamp).toContainText("RETURNED TO SENDER");
    expect(
      await original!.evaluate(
        (el) => el === document.querySelector('button[aria-label^="紙飛行機"]'),
      ),
    ).toBe(true);
  }
  expect(distances[1]).toBeGreaterThan(distances[0] * 1.5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  const card = page.getByRole("link", { name: /DAY 008/ });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("img")).toHaveJSProperty("naturalWidth", 900);
  await card.click();
  await expect(stage).toHaveAttribute("data-stamped", "false");
  expect(errors).toEqual([]);
});

test("aim stays near departure; taps, pointer cancellation, blur and resize do not misfire", async ({
  page,
}, info) => {
  await visit(page);
  const stage = page.locator("section[data-ready]");
  const plane = page.getByRole("button", { name: /紙飛行機を飛ばす/ });
  if (info.project.name === "mobile") await plane.tap();
  else await plane.click();
  await expect(stage).toHaveAttribute("data-phase", "idle");
  const initial = (await plane.boundingBox())!;
  const x = initial.x + initial.width / 2,
    y = initial.y + initial.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 110, y - 100);
  await expect(stage).toHaveAttribute("data-phase", "aiming");
  const aiming = (await plane.boundingBox())!;
  expect(Math.abs(aiming.x + aiming.width / 2 - x)).toBeLessThan(1);
  expect(Math.abs(aiming.y + aiming.height / 2 - y)).toBeLessThan(1);
  await plane.dispatchEvent("pointercancel", { pointerId: 1 });
  await expect(stage).toHaveAttribute("data-phase", "idle");
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(stage).toHaveAttribute("data-phase", "idle");
  await plane.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowUp");
  await expect(stage).toHaveAttribute("data-phase", "aiming");
  await plane.evaluate((el) => el.blur());
  await expect(stage).toHaveAttribute("data-phase", "idle");
  await plane.focus();
  await page.keyboard.press("Enter");
  await page.clock.runFor(500);
  await page.setViewportSize({ width: 320, height: 740 });
  await expect(stage).toHaveAttribute("data-phase", "idle");
  await page.clock.runFor(9000);
  await expect(stage).toHaveAttribute("data-stamped", "false");
});

test("keyboard, persistent stamp, reduced motion and small portrait/landscape layouts", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit(page);
  const stage = page.locator("section[data-ready]");
  const plane = page.getByRole("button", { name: /紙飛行機を飛ばす/ });
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(stage).toHaveAttribute("data-width", String(viewport.width));
    await expect(stage).toHaveAttribute("data-height", String(viewport.height));
    await plane.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Escape");
    expect(await stage.getAttribute("data-phase")).not.toBe("flying");
    await page.keyboard.press("Space");
    await expect(stage).toHaveAttribute("data-phase", "flying");
    await page.clock.runFor(400);
    await expect(stage).toHaveAttribute("data-flight-x", "0.00");
    await page.clock.runFor(650);
    await expect(stage).toHaveAttribute("data-phase", "returned");
    await expect(page.locator("[data-stamp]")).toHaveCSS("opacity", "0.9");
    await page.keyboard.press("ArrowLeft");
    await expect(stage).toHaveAttribute("data-stamped", "true");
    await page.keyboard.press("Escape");
    await expect(stage).toHaveAttribute("data-stamped", "true");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    await expect(page.getByRole("link", { name: /DISCOVER/ })).toBeVisible();
  }
});

test("hidden tabs pause without catch-up and navigation cancels the flight", async ({
  page,
}) => {
  await visit(page);
  const stage = page.locator("section[data-ready]");
  const plane = page.getByRole("button", { name: /紙飛行機を飛ばす/ });
  await plane.focus();
  await page.keyboard.press("Enter");
  await page.clock.runFor(700);
  const before = await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    return document.querySelector<HTMLElement>("section[data-ready]")!.dataset
      .progress!;
  });
  await page.clock.runFor(12000);
  await expect(stage).toHaveAttribute("data-progress", before!);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(35);
  expect(
    Number(await stage.getAttribute("data-progress")) - Number(before),
  ).toBeLessThan(0.03);
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await page.clock.runFor(9000);
  await page.getByRole("link", { name: /DAY 008/ }).click();
  await expect(stage).toHaveAttribute("data-phase", "idle");
  await expect(stage).toHaveAttribute("data-stamped", "false");
});

test("static artwork remains visible without JavaScript and direct URL works", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}404/008`);
  await expect(page.getByRole("heading", { name: /A letter/ })).toBeVisible();
  await expect(page.locator("noscript p")).toBeVisible();
  await expect(page.locator("[data-stamp]")).toHaveCSS("opacity", "0");
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await expect(page.getByRole("link", { name: /DAY 008/ })).toBeVisible();
  await context.close();
});
