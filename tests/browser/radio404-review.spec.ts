import { test, expect, type Page } from "@playwright/test";

type AudioProbe = {
  contexts: AudioContext[];
  voiceStarts: number;
  decoding: boolean;
  decodeSettled: boolean;
  allowDecode: () => void;
  deferResume: boolean;
  rejectResume: () => void;
};
type ProbeWindow = Window & { radioProbe: AudioProbe };
async function instrumentAudio(page: Page) {
  await page.addInitScript(() => {
    const probe: AudioProbe = {
      contexts: [],
      voiceStarts: 0,
      decoding: false,
      decodeSettled: false,
      allowDecode: () => {},
      deferResume: false,
      rejectResume: () => {},
    };
    Object.assign(window, { radioProbe: probe });
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        probe.contexts.push(this);
      }
      decodeAudioData(data: ArrayBuffer) {
        probe.decoding = true;
        return new Promise<void>((resolve) => {
          probe.allowDecode = resolve;
        })
          .then(() => super.decodeAudioData(data))
          .finally(() => {
            probe.decodeSettled = true;
          });
      }
      createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        source.start = (when = 0, offset = 0, duration?: number) => {
          if (source.buffer && source.buffer.duration < 2) probe.voiceStarts++;
          if (duration === undefined) start(when, offset);
          else start(when, offset, duration);
        };
        return source;
      }
      resume() {
        if (probe.deferResume)
          return new Promise<void>((_, reject) => {
            probe.rejectResume = () =>
              reject(new Error("Delayed resume failure"));
          });
        return super.resume();
      }
    };
  });
}
async function setHidden(page: Page, hidden: boolean) {
  await page.evaluate((value) => {
    Object.defineProperty(document, "hidden", { value, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}
async function tune404(page: Page) {
  await page.getByRole("slider").focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 16; i++) await page.keyboard.press("PageUp");
}

for (const elapsed of [200, 650]) {
  test(`acquisition survives visibility changes at 404.6 MHz after ${elapsed}ms`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("404/006/");
    const stage = page.getByRole("region", { name: /404 Radio/ });
    await tune404(page);
    await page.clock.runFor(elapsed);
    for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("slider")).toHaveAttribute(
      "aria-valuenow",
      "404.6",
    );
    await setHidden(page, true);
    await page.clock.runFor(10000);
    await setHidden(page, false);
    await expect(stage).toHaveAttribute("data-phase", "near");
    await page.clock.runFor(650);
    await expect(stage).toHaveAttribute("data-phase", "receiving");
    await page.clock.runFor(1800);
    await expect(stage).toHaveAttribute("data-phase", "lost");
    await setHidden(page, true);
    await page.clock.runFor(10000);
    await setHidden(page, false);
    await expect(stage).toHaveAttribute("data-phase", "lost");
  });
}

test("Japanese accessibility content and English controls declare their languages", async ({
  page,
}) => {
  await page.goto("404/006/");
  const dial = page.getByRole("slider");
  expect(
    await dial.evaluate((node) => node.closest("[lang]")?.getAttribute("lang")),
  ).toBe("ja");
  expect(
    await page
      .getByText("［雑音］ 遠くに、何かがある。", { exact: true })
      .evaluate((node) => node.closest("[lang]")?.getAttribute("lang")),
  ).toBe("ja");
  await expect(page.getByRole("button", { name: /SOUND OFF/ })).toHaveAttribute(
    "lang",
    "en",
  );
  await expect(
    page.getByText("SEARCHING THE SILENCE", { exact: true }),
  ).toHaveAttribute("lang", "en");
});

for (const phase of ["receiving", "lost", "closed"] as const) {
  test(`late decoded voice starts only if reception is still active: ${phase}`, async ({
    page,
  }) => {
    await instrumentAudio(page);
    await page.clock.install();
    await page.goto("404/006/");
    await tune404(page);
    await page.clock.runFor(650);
    await expect(
      page.getByRole("region", { name: /404 Radio/ }),
    ).toHaveAttribute("data-phase", "receiving");
    // Enable sound after reception has already begun, and hold the decoder independently of network speed.
    await page.getByRole("button", { name: /SOUND OFF/ }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as ProbeWindow).radioProbe.decoding,
        ),
      )
      .toBe(true);
    if (phase === "lost") await page.clock.runFor(1800);
    if (phase === "closed")
      await page.getByRole("button", { name: /SOUND ON/ }).click();
    await page.evaluate(() =>
      (window as unknown as ProbeWindow).radioProbe.allowDecode(),
    );
    const starts = () =>
      page.evaluate(
        () => (window as unknown as ProbeWindow).radioProbe.voiceStarts,
      );
    if (phase === "receiving") {
      await expect.poll(starts).toBe(1);
      await page.getByRole("slider").focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowLeft");
      expect(await starts()).toBe(1);
    } else {
      await expect
        .poll(() =>
          page.evaluate(
            () => (window as unknown as ProbeWindow).radioProbe.decodeSettled,
          ),
        )
        .toBe(true);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as unknown as ProbeWindow).radioProbe.contexts[0].state,
          ),
        )
        .toBe(phase === "closed" ? "closed" : "running");
      expect(await starts()).toBe(0);
    }
  });
}

test("a stale resume failure cannot close replacement audio or show an error", async ({
  page,
}) => {
  await instrumentAudio(page);
  await page.goto("404/006/");
  await page.getByRole("button", { name: /SOUND OFF/ }).click();
  await expect(page.getByRole("button", { name: /SOUND ON/ })).toBeVisible();
  await setHidden(page, true);
  await page.evaluate(() => {
    (window as unknown as ProbeWindow).radioProbe.deferResume = true;
  });
  await setHidden(page, false);
  await page.getByRole("button", { name: /SOUND ON/ }).click();
  await page.evaluate(() => {
    (window as unknown as ProbeWindow).radioProbe.deferResume = false;
  });
  await page.getByRole("button", { name: /SOUND OFF/ }).click();
  await expect(page.getByRole("button", { name: /SOUND ON/ })).toBeVisible();
  await page.evaluate(async () => {
    (window as unknown as ProbeWindow).radioProbe.rejectResume();
    await Promise.resolve();
  });
  await expect(page.getByRole("button", { name: /SOUND ON/ })).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as unknown as ProbeWindow).radioProbe.contexts.map(
        (context) => context.state,
      ),
    ),
  ).toEqual(["closed", "running"]);
  await expect(
    page.getByText("音声を開始できません。無音で探索できます。", {
      exact: true,
    }),
  ).toHaveCount(0);
});
