import { test, expect } from "@playwright/test";

test("Liquid 404 stretches with real mouse/touch input and returns to its contour", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("404/004/");
  const stage = page.getByRole("button", { name: /Liquid 404:/ });
  const path = page.locator("svg > path").first();
  const original = (await path.getAttribute("d"))!;
  await page.screenshot({
    path: `test-results/${info.project.name}-liquid-whole.png`,
  });
  const bounds = (await page.locator("button svg").boundingBox())!;
  const x = bounds.x + (270 / 1000) * bounds.width,
    y = bounds.y + (240 / 500) * bounds.height;
  let session;
  if (info.project.name === "mobile") {
    session = await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + 40, y: y + 25 }],
    });
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 60, y + 30, { steps: 8 });
  }
  await expect(stage).toHaveAttribute("data-liquid-state", "touching");
  await expect(path).not.toHaveAttribute("d", original);
  const baseline = original.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  await expect
    .poll(async () => {
      const numbers = (await path.getAttribute("d"))!
        .match(/-?\d+(?:\.\d+)?/g)!
        .map(Number);
      return Math.max(...numbers.map((n, i) => Math.abs(n - baseline[i])));
    })
    .toBeGreaterThan(15);
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
  await expect(stage).toHaveAttribute("data-liquid-state", "settling");
  await expect(stage).toHaveAttribute("data-liquid-state", "resting", {
    timeout: 6000,
  });
  await expect
    .poll(
      async () => {
        const numbers = (await path.getAttribute("d"))!
          .match(/-?\d+(?:\.\d+)?/g)!
          .map(Number);
        return Math.max(...numbers.map((n, i) => Math.abs(n - baseline[i])));
      },
      { timeout: 6000 },
    )
    .toBeLessThan(0.4);
  await stage.focus();
  await page.keyboard.press("ArrowRight");
  await expect(stage).toHaveAttribute("data-liquid-state", "settling");
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  const card = page.getByRole("link", { name: /DAY 004/ });
  await expect(card.locator("img")).toHaveJSProperty("naturalWidth", 900);
  await card.click();
  await expect(stage).toBeVisible();
  expect(errors).toEqual([]);
});

test("hover ripples work without drag and cancel/resize preserve navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("404/004");
  const stage = page.getByRole("button", { name: /Liquid 404:/ }),
    path = page.locator("svg > path").first();
  const before = (await path.getAttribute("d"))!;
  const box = (await page.locator("button svg").boundingBox())!;
  await stage.dispatchEvent("pointermove", {
    clientX: box.x + box.width * 0.26,
    clientY: box.y + box.height * 0.4,
    pointerType: "mouse",
  });
  await expect(path).not.toHaveAttribute("d", before);
  await stage.dispatchEvent("pointercancel");
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

test("Liquid 404 is visible with JavaScript disabled", async ({
  page,
  browser,
}) => {
  await page.goto("404/004/");
  const url = page.url();
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const still = await context.newPage();
    await still.goto(url);
    await expect(still.locator("svg > path").first()).toBeVisible();
    await expect(
      still.getByRole("heading", { name: "Liquid 404" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
