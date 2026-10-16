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
