import { test, expect, type Page } from "@playwright/test";

// Read the rendered paddle rather than exposing mutable game state for tests.
async function paddlePosition(page: Page) {
  return page.locator("canvas").evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const { width, height } = canvas;
    const pixels = canvas
      .getContext("2d")!
      .getImageData(0, 0, width, height).data;
    let total = 0;
    let count = 0;
    for (let y = Math.floor(height * 0.93); y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        if (
          pixels[index + 1] > 240 &&
          pixels[index + 2] < 150 &&
          pixels[index + 3] > 240
        ) {
          total += x / width;
          count++;
        }
      }
    }
    return count ? total / count : 0.5;
  });
}

test("Day 002 direct URL, mouse/keyboard, thumbnail and navigation", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("404/002");
  const stage = page.locator("[data-phase]");
  const game = page.getByRole("button", { name: /Break the 404 game/ });
  await expect(
    page.getByRole("heading", { name: "BREAK THE 404" }),
  ).toBeVisible();
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await expect(page.locator(".artwork-info")).toHaveCount(0);
  await page.screenshot({
    path: `test-results/${info.project.name}-break404.png`,
  });
  if (info.project.name === "desktop") {
    const bounds = (await game.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width * 0.85, bounds.height * 0.8);
    await expect.poll(() => paddlePosition(page)).toBeGreaterThan(0.75);
  }
  await game.focus();
  await page.keyboard.press("Space");
  await expect(stage).toHaveAttribute("data-phase", "playing");
  await page.keyboard.down("ArrowLeft");
  await expect.poll(() => paddlePosition(page)).toBeLessThan(0.2);
  await page.keyboard.up("ArrowLeft");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  const card = page.getByRole("link", { name: /DAY 002/ });
  await expect(card.locator("img")).toHaveJSProperty("naturalWidth", 900);
  await card.click();
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await page.getByRole("link", { name: /^HOME/ }).click();
  await expect(page.getByRole("button", { name: "SHUFFLE" })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const permission of ["granted", "denied"] as const) {
  test(`mobile motion permission ${permission} and touch fallback`, async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "mobile", "Touch device only");
    await page.addInitScript((result) => {
      Object.defineProperty(DeviceOrientationEvent, "requestPermission", {
        value: async () => result,
        configurable: true,
      });
    }, permission);
    await page.goto("404/002/");
    const stage = page.locator("[data-phase]");
    const game = page.getByRole("button", { name: /Break the 404 game/ });
    await page.getByRole("button", { name: "ENABLE TILT" }).tap();
    await game.tap();
    await expect(stage).toHaveAttribute("data-phase", "playing");
    if (permission === "granted") {
      await expect(stage).toHaveAttribute("data-control", "tilt");
      await page.evaluate(() =>
        window.dispatchEvent(
          new DeviceOrientationEvent("deviceorientation", {
            gamma: 10,
            beta: 0,
          }),
        ),
      );
      await page.evaluate(() =>
        window.dispatchEvent(
          new DeviceOrientationEvent("deviceorientation", {
            gamma: 35,
            beta: 0,
          }),
        ),
      );
      await expect(
        page.getByText("TILT TO MOVE / TAP TO LAUNCH", { exact: true }),
      ).toBeVisible();
      await expect.poll(() => paddlePosition(page)).toBeGreaterThan(0.75);
      // A real drag remains available even when motion access was granted.
      await game.dispatchEvent("pointermove", {
        pointerType: "touch",
        clientX: 100,
        clientY: 300,
      });
    }
    await expect(stage).toHaveAttribute("data-control", "touch");
    await expect(
      page.getByText("DRAG TO MOVE / TAP TO LAUNCH", { exact: true }),
    ).toBeVisible();
  });
}

test("motion granted without sensor readings falls back to drag", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "mobile", "Touch device only");
  await page.addInitScript(() =>
    Object.defineProperty(DeviceOrientationEvent, "requestPermission", {
      value: async () => "granted",
      configurable: true,
    }),
  );
  await page.goto("404/002/");
  await page.getByRole("button", { name: "ENABLE TILT" }).tap();
  await page.getByRole("button", { name: /Break the 404 game/ }).tap();
  await expect(page.locator("[data-phase]")).toHaveAttribute(
    "data-control",
    "touch",
  );
});

test("Day 002 remains available with reduced motion and narrow landscape layout", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const size of [
    { width: 320, height: 740 },
    { width: 740, height: 360 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("404/002/");
    await expect(
      page.getByRole("heading", { name: "BREAK THE 404" }),
    ).toBeVisible();
    const canvas = await page.locator("canvas").boundingBox();
    expect(canvas!.height).toBeGreaterThan(100);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: /Break the 404 game/ }).click();
    await expect(page.locator("[data-phase]")).toHaveAttribute(
      "data-phase",
      "playing",
    );
  }
});

test("tilt calibration, dead zone, rotation, sensor loss and re-enable", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "mobile", "Touch device only");
  await page.addInitScript(() =>
    Object.defineProperty(DeviceOrientationEvent, "requestPermission", {
      value: async () => "granted",
      configurable: true,
    }),
  );
  await page.goto("404/002/");
  const stage = page.locator("[data-phase]");
  const send = async (gamma: number | null, beta = 0) => {
    await page.evaluate(
      ({ gamma, beta }) => {
        const sensor = window as Window & { mockTiltTimer?: number };
        clearInterval(sensor.mockTiltTimer);
        const emit = () =>
          window.dispatchEvent(
            new DeviceOrientationEvent("deviceorientation", { gamma, beta }),
          );
        emit();
        sensor.mockTiltTimer = window.setInterval(emit, 50);
      },
      { gamma, beta },
    );
  };
  await page.getByRole("button", { name: "ENABLE TILT" }).tap();
  await expect(stage).toHaveAttribute("data-control", "tilt");
  await send(15);
  await send(16);
  await expect.poll(() => paddlePosition(page)).toBeGreaterThan(0.47);
  await expect.poll(() => paddlePosition(page)).toBeLessThan(0.53);
  await send(40);
  await expect.poll(() => paddlePosition(page)).toBeGreaterThan(0.8);
  await page.getByRole("button", { name: "CALIBRATE" }).tap();
  await send(40);
  await expect.poll(() => paddlePosition(page)).toBeLessThan(0.53);
  await page.evaluate(() =>
    Object.defineProperty(screen.orientation, "angle", {
      value: 90,
      configurable: true,
    }),
  );
  await send(null, 30);
  await send(null, 55);
  await expect.poll(() => paddlePosition(page)).toBeLessThan(0.2);
  await page.evaluate(() =>
    clearInterval(
      (window as Window & { mockTiltTimer?: number }).mockTiltTimer,
    ),
  );
  await expect(stage).toHaveAttribute("data-control", "touch");
  await page.getByRole("button", { name: "ENABLE TILT" }).tap();
  await send(null, 30);
  await expect(stage).toHaveAttribute("data-control", "tilt");
  await page.getByRole("button", { name: /Break the 404 game/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(stage).toHaveAttribute("data-control", "pointer");
});

for (const failure of ["unsupported", "throws", "pending"] as const) {
  test(`sensor ${failure} leaves launch and manual controls available`, async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "mobile", "Touch device only");
    await page.addInitScript((failure) => {
      if (failure === "unsupported")
        Object.defineProperty(window, "DeviceOrientationEvent", {
          value: undefined,
          configurable: true,
        });
      else
        Object.defineProperty(DeviceOrientationEvent, "requestPermission", {
          value: () =>
            failure === "throws"
              ? Promise.reject(new Error("unavailable"))
              : new Promise(() => {}),
          configurable: true,
        });
    }, failure);
    await page.goto("404/002/");
    await page.getByRole("button", { name: "ENABLE TILT" }).tap();
    const game = page.getByRole("button", { name: /Break the 404 game/ });
    await game.tap();
    await expect(page.locator("[data-phase]")).toHaveAttribute(
      "data-phase",
      "playing",
    );
    await game.dispatchEvent("pointermove", {
      pointerType: "touch",
      clientX: 90,
      clientY: 400,
    });
    await expect(page.locator("[data-phase]")).toHaveAttribute(
      "data-control",
      "touch",
    );
    await expect(
      page.getByRole("button", { name: "ENABLE TILT" }),
    ).toBeEnabled();
  });
}
