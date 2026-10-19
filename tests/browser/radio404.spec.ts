import { test, expect } from "@playwright/test";

test("silent tuning, hold after release, loss, replay, navigation and sound", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.install();
  await page.goto("404/006/");
  const stage = page.getByRole("region", { name: /404 Radio/ });
  const dial = page.getByRole("slider", { name: "同調ダイヤル" });
  await expect(stage).toHaveAttribute("data-phase", "search");
  await expect(page.getByRole("button", { name: /SOUND OFF/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await dial.focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 16; i++) await page.keyboard.press("PageUp");
  await expect(dial).toHaveAttribute("aria-valuenow", "404.0");
  await page.clock.runFor(650);
  await expect(stage).toHaveAttribute("data-phase", "receiving");
  await page.screenshot({
    path: `test-results/${info.project.name}-radio-receiving.png`,
  });
  await page.clock.runFor(1800);
  await expect(stage).toHaveAttribute("data-phase", "lost");
  await expect(
    page.getByText("SIGNAL NOT FOUND", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-radio-lost.png`,
  });
  await page.keyboard.press("PageDown");
  await page.keyboard.press("PageUp");
  await page.clock.runFor(650);
  await expect(stage).toHaveAttribute("data-phase", "receiving");
  await page.getByRole("button", { name: /SOUND OFF/ }).click();
  await expect(page.getByRole("button", { name: /SOUND ON/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: /SOUND ON/ }).click();
  await expect(page.getByRole("button", { name: /SOUND OFF/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  const card = page.getByRole("link", { name: /DAY 006/ });
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("img")).toHaveJSProperty("naturalWidth", 900);
  await card.click();
  await expect(dial).toHaveAttribute("aria-valuenow", "398.2");
  expect(errors).toEqual([]);
});

test("real pointer input, narrow layouts, reduced motion and failed audio", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("404/006/");
  const dial = page.getByRole("slider");
  const box = (await dial.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(72);
  if (info.project.name === "mobile") {
    const touch = await page.context().newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }],
    });
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: box.x + box.width / 2 + 30, y: box.y + box.height / 2 },
      ],
    });
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await touch.detach();
  } else {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2);
    await page.mouse.up();
  }
  expect(Number(await dial.getAttribute("aria-valuenow"))).toBeGreaterThan(
    398.2,
  );
  for (const size of [
    { width: 390, height: 844 },
    { width: 320, height: 740 },
    { width: 740, height: 360 },
  ]) {
    await page.setViewportSize(size);
    await expect(dial).toBeInViewport();
    await expect(
      page.getByRole("button", { name: /SOUND OFF/ }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/${info.project.name}-radio-${size.width}.png`,
    });
  }
  await page.evaluate(() => {
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      configurable: true,
    });
  });
  await page.getByRole("button", { name: /SOUND OFF/ }).click();
  await expect(
    page.getByText("音声を開始できません。無音で探索できます。", {
      exact: true,
    }),
  ).toContainText("無音で探索できます");
});

test("audio stays opt-in, suspends while hidden and closes on navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const contexts: AudioContext[] = [];
    Object.assign(window, { radioContexts: contexts });
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
    };
  });
  await page.goto("404/006/");
  const states = () =>
    page.evaluate(() =>
      (
        window as unknown as Window & { radioContexts: AudioContext[] }
      ).radioContexts.map((context) => context.state),
    );
  expect(await states()).toEqual([]);
  const fragment = page.waitForResponse((response) =>
    response.url().endsWith("/radio/fragment.wav"),
  );
  await page.getByRole("button", { name: /SOUND OFF/ }).click();
  expect((await fragment).ok()).toBe(true);
  await expect.poll(states).toEqual(["running"]);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      value: true,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(states).toEqual(["suspended"]);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      value: false,
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(states).toEqual(["running"]);
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await expect.poll(states).toEqual(["closed"]);
});

test("JavaScript-free page retains the cabinet and gallery navigation", async ({
  browser,
  page,
}) => {
  await page.goto("404/006/");
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const still = await context.newPage();
    await still.goto(page.url());
    await expect(still.getByRole("img", { name: /木製筐体/ })).toBeVisible();
    await expect(still.getByText(/探索にはJavaScriptが必要/)).toBeVisible();
    await still.getByRole("link", { name: /DISCOVER/ }).click();
    await expect(still.locator(".artwork-grid")).toBeVisible();
  } finally {
    await context.close();
  }
});
