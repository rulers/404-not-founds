import { test, expect } from "@playwright/test";

test("home, interaction, shuffle, discover and direct artwork URL", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Glitch 404" })).toBeVisible();
  const stage = page.getByRole("button", { name: /Glitch 404:/ });
  const box = (await stage.boundingBox())!;
  if (info.project.name === "mobile") {
    await stage.tap({ position: { x: box.width / 2, y: box.height / 2 } });
  } else {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(stage).toHaveCSS("--split", "14px");
    await stage.click();
  }
  await expect(stage).toHaveAttribute("data-burst", "true");
  await expect(stage).toHaveAttribute("data-burst", "false");
  await page.getByRole("button", { name: "SHUFFLE" }).click();
  await expect(stage).toBeVisible();
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await expect(page.getByRole("heading", { name: "Glitch 404" })).toBeVisible();
  await expect(page.locator(".thumbnail img")).toHaveJSProperty(
    "naturalWidth",
    900,
  );
  await page.getByRole("link", { name: /DAY 001/ }).click();
  await expect(stage).toBeVisible();
  await page.goto("404/001/");
  await expect(stage).toBeVisible();
  await page.goto("404/001");
  await expect(stage).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/${info.project.name}-gallery.png`,
    fullPage: true,
  });
});

test("reduced motion and keyboard activation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const stage = page.getByRole("button", { name: /Glitch 404:/ });
  await expect(page.locator(".number-base")).toHaveCSS(
    "animation-name",
    "none",
  );
  await stage.focus();
  await page.keyboard.press("Enter");
  await expect(stage).toHaveAttribute("data-burst", "true");
});

test("unknown URLs use the exported not-found page", async ({ page }) => {
  const response = await page.goto("nothing-here/");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("This one really doesn’t exist.")).toBeVisible();
  await page.getByRole("link", { name: /RETURN TO THE GALLERY/ }).click();
  await expect(page.getByRole("heading", { name: "Glitch 404" })).toBeVisible();
});

test("narrow phone layout keeps navigation and collection within viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("./");
  await expect(page.getByRole("button", { name: "SHUFFLE" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("immersive UI fills the viewport and passes non-actionable areas to the artwork", async ({
  page,
}, info) => {
  for (const route of ["./", "404/001/"]) {
    await page.goto(route);
    const stage = page.locator(".glitch-stage");
    await expect(stage).toBeVisible();
    await expect(page.locator(".gallery-shell footer")).toHaveCount(0);
    await expect(page.locator(".gallery-shell .header-note")).toHaveCount(0);
    const box = (await stage.boundingBox())!;
    const viewport = await page.evaluate(() => ({
      width: innerWidth,
      height: innerHeight,
    }));
    expect(box.x).toBe(0);
    expect(box.y).toBe(0);
    expect(box.width).toBe(viewport.width);
    expect(box.height).toBe(viewport.height);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);

    const hint = (await page.locator(".interaction-hint").boundingBox())!;
    const wordmark = (await page.locator(".wordmark").boundingBox())!;
    const nav = (await page.getByRole("navigation").boundingBox())!;
    const points = [
      { x: hint.x + hint.width / 2, y: hint.y + hint.height / 2 },
      {
        x: (wordmark.x + wordmark.width + nav.x) / 2,
        y: wordmark.y + wordmark.height / 2,
      },
    ];
    for (const point of points) {
      expect(
        await page.evaluate(
          ({ x, y }) =>
            Boolean(document.elementFromPoint(x, y)?.closest(".glitch-stage")),
          point,
        ),
      ).toBe(true);
      if (info.project.name === "mobile")
        await page.touchscreen.tap(point.x, point.y);
      else await page.mouse.click(point.x, point.y);
      await expect(stage).toHaveAttribute("data-burst", "true");
      await expect(stage).toHaveAttribute("data-burst", "false");
    }
    if (route !== "./") {
      await page.getByRole("link", { name: /^HOME/ }).click();
      await expect(page.getByRole("button", { name: "SHUFFLE" })).toBeVisible();
    }
    await page.getByRole("link", { name: /DISCOVER/ }).click();
    await expect(page.locator(".discover-footer")).toBeVisible();
    await expect(
      page.locator(".discover-shell .site-header-overlay"),
    ).toHaveCount(0);
  }
});
