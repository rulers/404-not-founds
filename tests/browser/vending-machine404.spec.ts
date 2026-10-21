import { test, expect, type Page } from "@playwright/test";
import { products } from "../../lib/vending-machine404";

async function visit(page: Page) {
  await page.goto("404/007/");
  await expect(page.locator("section[data-ready=true]")).toBeVisible();
}

test("four tangible purchases, no initial foreground, collection and distinct outcomes", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await visit(page);
  const stage = page.getByRole("region", { name: "404 Vending Machine" });
  const cargo = stage.locator("[data-cargo]");
  await expect(cargo).toHaveCount(0);
  await expect(page.getByText("404 NOT FOUND", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: `test-results/${info.project.name}-vending-initial.png`,
  });
  for (const product of products) {
    const select = page.getByRole("button", {
      name: `${product.id} ${product.name}を選ぶ`,
    });
    if (info.project.name === "mobile") await select.tap();
    else await select.click();
    await expect(stage).toHaveAttribute("data-phase", "coil");
    await expect(select).toHaveAttribute("aria-disabled", "true");
    // A real extra pointer click while busy must not queue or change the order.
    const extra = await page
      .getByRole("button", { name: /B2 Mystery Item/ })
      .boundingBox();
    await page.mouse.click(extra!.x + 10, extra!.y + 10);
    await expect(stage).toHaveAttribute("data-product", product.id);
    await expect(stage).toHaveAttribute("data-phase", "ready");
    const before = await cargo.boundingBox();
    const collect = page.getByRole("button", {
      name: "フラップを開けて商品を取り出す",
    });
    await expect(collect).toBeFocused();
    if (info.project.name === "mobile") await collect.tap();
    else await collect.click();
    if (product.id !== "B2") {
      const open = page.getByRole("button", { name: product.action });
      await expect(open).toBeFocused();
      const after = await cargo.boundingBox();
      expect(after!.width).toBeGreaterThan(before!.width * 2);
      expect(after!.x).toBeGreaterThanOrEqual(0);
      expect(after!.x + after!.width).toBeLessThanOrEqual(
        await page.evaluate(() => innerWidth),
      );
      if (info.project.name === "mobile") await open.tap();
      else await open.click();
    }
    await expect(stage).toHaveAttribute("data-phase", "result");
    await expect(page.getByRole("status")).toHaveText(product.result);
    await expect(page.getByText(product.stamp, { exact: true })).toBeVisible();
    if (product.id === "A1")
      await expect(cargo.locator('[data-part="lid"]')).toHaveCSS(
        "opacity",
        "0",
      );
    if (product.id === "A2") {
      await expect(cargo.locator('[data-part="bridge"]').first()).toHaveCSS(
        "opacity",
        "0",
      );
      await expect(cargo.locator('[data-part="broken-link"]')).toHaveCSS(
        "opacity",
        "1",
      );
    }
    if (product.id === "B1")
      await expect(cargo.locator('[data-part="photo-card"]')).not.toHaveCSS(
        "transform",
        "none",
      );
    if (product.id === "B2")
      await expect(cargo.locator('[data-part="mystery"]')).toHaveCSS(
        "opacity",
        "0",
      );
    await expect(
      page.getByRole("button", { name: "もう一つ選ぶ" }),
    ).toBeFocused();
    await page.screenshot({
      path: `test-results/${info.project.name}-vending-${product.id}.png`,
    });
    await page.getByRole("button", { name: "もう一つ選ぶ" }).click();
    await expect(select).toBeFocused();
    await expect(cargo).toHaveCount(0);
  }
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await page.getByRole("link", { name: /DAY 007/ }).click();
  await expect(stage).toHaveAttribute("data-phase", "idle");
  expect(errors).toEqual([]);
});

test("keyboard, cancellation, reduced motion and narrow/landscape layouts", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit(page);
  const stage = page.locator("section[data-ready]");
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    const select = page.getByRole("button", { name: /A1 Missing Page/ });
    await select.focus();
    await page.keyboard.press("Enter");
    await expect(stage).toHaveAttribute("data-phase", "ready");
    await expect(page.getByRole("button", { name: /フラップ/ })).toBeFocused();
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("button", { name: "箱を開ける" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(select).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(stage).toHaveAttribute("data-phase", "ready");
    await page.keyboard.press("Enter");
    await expect(stage).toHaveAttribute("data-phase", "inspect");
    await page.keyboard.press("Enter");
    await expect(stage).toHaveAttribute("data-phase", "result");
    await expect(page.locator("[data-cargo]")).toHaveCSS(
      "animation-name",
      "none",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const again = page.getByRole("button", { name: "もう一つ選ぶ" });
    const rect = await again.boundingBox();
    expect(rect!.y).toBeGreaterThanOrEqual(64);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height - 70);
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport.width);
    const center = {
      x: rect!.x + rect!.width / 2,
      y: rect!.y + rect!.height / 2,
    };
    expect(
      await again.evaluate(
        (el, point) => el.contains(document.elementFromPoint(point.x, point.y)),
        center,
      ),
    ).toBe(true);
    await again.click();
  }
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await expect(page.locator(".discover-shell")).toBeVisible();
});

test("hidden purchase pauses, resumes, and navigation cancels pending work", async ({
  page,
}) => {
  await page.clock.install();
  await visit(page);
  const stage = page.locator("section[data-ready]");
  await page.getByRole("button", { name: /A1 Missing Page/ }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(5000);
  await expect(stage).toHaveAttribute("data-phase", "coil");
  await expect(stage).toHaveAttribute("data-paused", "true");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(1100);
  await page.clock.runFor(800);
  await expect(stage).toHaveAttribute("data-phase", "ready");
  await page.getByRole("button", { name: /フラップ/ }).click();
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  await page.clock.runFor(4000);
  await page.getByRole("link", { name: /DAY 007/ }).click();
  await expect(stage).toHaveAttribute("data-phase", "idle");
});

test("static no-JavaScript cabinet and direct URL remain available", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}404/007`);
  await expect(page.locator("noscript p")).toBeVisible();
  await expect(page.locator("noscript p")).toHaveText(
    "操作にはJavaScriptが必要です。Nothing is for sale.",
  );
  await expect(page.locator("[data-cargo]")).toHaveCount(0);
  await page.getByRole("link", { name: /DISCOVER/ }).click();
  const image = page.getByRole("img", { name: /404 Vending Machine/ });
  await expect(image).toBeVisible();
  await expect(image).toHaveJSProperty("naturalWidth", 900);
  await context.close();
});
