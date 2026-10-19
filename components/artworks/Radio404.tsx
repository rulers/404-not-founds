"use client";

import { useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/artworks";
import { createRadioAudio } from "@/lib/radio-audio";
import {
  dragFrequency,
  signalStrength,
  tuneRadio,
  type RadioState,
} from "@/lib/radio404";
import styles from "./Radio404.module.css";

const captions = {
  search: "［雑音］ 遠くに、何かがある。",
  near: "……こちら…… 聞こえますか。",
  receiving: "お探しのページは……",
  lost: "探しているページからの応答はありません。",
};
export default function Radio404() {
  const root = useRef<HTMLElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  const scale = useRef<HTMLDivElement>(null);
  const output = useRef<HTMLOutputElement>(null);
  const model = useRef<RadioState>({
    frequency: 398.2,
    phase: "search",
    enteredAt: null,
  });
  const audio = useRef<ReturnType<typeof createRadioAudio> | null>(null);
  const pending = useRef(false);
  const apply = useRef<(value: number) => void>(() => {});
  const [phase, setPhase] = useState<RadioState["phase"]>("search");
  const [sound, setSound] = useState(false);
  const [audioError, setAudioError] = useState(false);
  useEffect(() => {
    const node = root.current!,
      knob = slider.current!,
      band = scale.current!;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let echo: ReturnType<typeof setTimeout> | undefined;
    let pointer: number | null = null;
    let previousX = 0,
      previousTime = 0;
    let alive = true;
    function update(value: number) {
      if (!alive || document.hidden) return;
      clearTimeout(timer);
      const old = model.current;
      const next = tuneRadio(old, value, performance.now());
      model.current = next;
      node.dataset.phase = next.phase;
      node.style.setProperty("--tuned", String((next.frequency - 388) / 32));
      node.style.setProperty(
        "--strength",
        String(signalStrength(next.frequency)),
      );
      knob.setAttribute("aria-valuenow", next.frequency.toFixed(1));
      knob.setAttribute("aria-valuetext", `${next.frequency.toFixed(1)} MHz`);
      if (output.current)
        output.current.value = `${next.frequency.toFixed(1)} MHz`;
      if (next.phase !== old.phase) {
        setPhase(next.phase);
        if (old.phase === "near" && next.phase === "search") {
          node.dataset.echo = "true";
          clearTimeout(echo);
          echo = setTimeout(() => {
            delete node.dataset.echo;
          }, 400);
        }
      }
      audio.current?.update(next.frequency, next.phase);
      if (next.enteredAt !== null && next.phase !== "lost") {
        const boundary = next.phase === "receiving" ? 2400 : 600;
        timer = setTimeout(
          () => update(model.current.frequency),
          Math.max(10, boundary - (performance.now() - next.enteredAt)),
        );
      }
    }
    apply.current = update;
    function down(event: PointerEvent) {
      if (event.button !== 0 || pointer !== null) return;
      pointer = event.pointerId;
      previousX = event.clientX;
      previousTime = event.timeStamp;
      knob.setPointerCapture(pointer);
      knob.focus();
      node.dataset.touched = "true";
    }
    function move(event: PointerEvent) {
      if (event.pointerId !== pointer) return;
      update(
        dragFrequency(
          model.current.frequency,
          event.clientX - previousX,
          event.timeStamp - previousTime,
        ),
      );
      previousX = event.clientX;
      previousTime = event.timeStamp;
    }
    function release() {
      if (pointer !== null && knob.hasPointerCapture(pointer))
        knob.releasePointerCapture(pointer);
      pointer = null;
    }
    function key(event: KeyboardEvent) {
      const steps: Record<string, number> = {
        ArrowRight: 0.1,
        ArrowUp: 0.1,
        ArrowLeft: -0.1,
        ArrowDown: -0.1,
        PageUp: 1,
        PageDown: -1,
      };
      if (!(event.key in steps) && event.key !== "Home" && event.key !== "End")
        return;
      event.preventDefault();
      node.dataset.touched = "true";
      update(
        event.key === "Home"
          ? 388
          : event.key === "End"
            ? 420
            : Math.round(
                (model.current.frequency + (steps[event.key] ?? 0)) * 10,
              ) / 10,
      );
    }
    function jump(event: PointerEvent) {
      if (event.button !== 0) return;
      const bounds = band.getBoundingClientRect();
      update(
        388 +
          Math.max(
            0,
            Math.min(1, (event.clientX - bounds.left) / bounds.width),
          ) *
            32,
      );
      knob.focus();
    }
    function visibility() {
      release();
      clearTimeout(timer);
      if (document.hidden) {
        if (audio.current) void audio.current.context.suspend().catch(() => {});
      } else {
        // Preserve acquisition in the wider holding band, but restart the wait
        // so time spent in a hidden tab never skips the reception sequence.
        if (model.current.phase !== "lost" && model.current.enteredAt !== null)
          model.current = { ...model.current, enteredAt: performance.now() };
        const resuming = audio.current;
        if (resuming)
          void resuming.context.resume().catch(() => {
            if (!alive || audio.current !== resuming) return;
            audio.current = null;
            void resuming.close().catch(() => {});
            setSound(false);
            setAudioError(true);
          });
        update(model.current.frequency);
      }
    }
    knob.addEventListener("pointerdown", down);
    knob.addEventListener("pointermove", move);
    knob.addEventListener("pointerup", release);
    knob.addEventListener("pointercancel", release);
    knob.addEventListener("lostpointercapture", release);
    knob.addEventListener("keydown", key);
    band.addEventListener("pointerdown", jump);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", visibility);
    update(model.current.frequency);
    return () => {
      alive = false;
      apply.current = () => {};
      clearTimeout(timer);
      clearTimeout(echo);
      release();
      knob.removeEventListener("pointerdown", down);
      knob.removeEventListener("pointermove", move);
      knob.removeEventListener("pointerup", release);
      knob.removeEventListener("pointercancel", release);
      knob.removeEventListener("lostpointercapture", release);
      knob.removeEventListener("keydown", key);
      band.removeEventListener("pointerdown", jump);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", visibility);
      if (audio.current) void audio.current.close().catch(() => {});
      audio.current = null;
    };
  }, []);
  async function toggleSound() {
    if (pending.current) return;
    if (audio.current) {
      const current = audio.current;
      audio.current = null;
      setSound(false);
      await current.close().catch(() => {});
      return;
    }
    pending.current = true;
    let current: ReturnType<typeof createRadioAudio> | null = null;
    try {
      current = createRadioAudio(assetPath("/radio/fragment.wav"));
      audio.current = current;
      await current.context.resume();
      if (audio.current !== current) return;
      current.update(model.current.frequency, model.current.phase);
      setSound(true);
      setAudioError(false);
    } catch {
      if (audio.current !== current) return;
      audio.current = null;
      if (current && current.context.state !== "closed")
        void current.close().catch(() => {});
      setSound(false);
      setAudioError(true);
    } finally {
      pending.current = false;
    }
  }
  return (
    <section
      ref={root}
      className={styles.stage}
      data-phase={phase}
      lang="ja"
      aria-label="404 Radio — 存在しない周波数を探す"
    >
      <div className={styles.scene}>
        <p className={styles.eyebrow} lang="en">
          A FREQUENCY WITH NO ADDRESS
        </p>
        <div className={styles.radio}>
          {/* Static original cabinet; moving scale and knob remain separate and sharp. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- Local SVG has intrinsic dimensions and needs no image optimization. */}
          <img
            className={styles.cabinet}
            src={assetPath("/radio/cabinet.svg")}
            width="1000"
            height="540"
            alt="木製筐体、布張りスピーカー、通気窓に光る真空管を備えた古いラジオ"
            draggable={false}
          />
          <div
            ref={scale}
            className={styles.scale}
            aria-hidden="true"
            lang="en"
          >
            <div className={styles.labels}>
              {[388, 396, 404, 412, 420].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className={styles.ticks} />
            <i className={styles.needle} />
            <small>MEGACYCLES / LOST BAND</small>
          </div>
          <div
            ref={slider}
            className={styles.knob}
            role="slider"
            tabIndex={0}
            aria-label="同調ダイヤル"
            aria-describedby="radio-instructions"
            aria-valuemin={388}
            aria-valuemax={420}
            aria-valuenow={398.2}
            aria-valuetext="398.2 MHz"
            aria-orientation="horizontal"
          >
            <span />
          </div>
        </div>
        <div className={styles.readout}>
          <output ref={output} aria-label="現在の周波数" aria-live="off">
            398.2 MHz
          </output>
          <svg
            className={styles.signal}
            viewBox="0 0 240 30"
            aria-hidden="true"
          >
            <path
              className={styles.noise}
              d="M25 15h13l3-4 3 8 3-4h18l3-7 3 14 3-7h18l3-3 3 6 3-3h21l3-6 3 12 3-6h26l3-4 3 8 3-4h19"
            />
            <g className={styles.alignment}>
              <path d="M35 15h65" />
              <path d="M140 15h65" />
            </g>
            <path className={styles.received} d="M40 15h55l5-8 7 16 7-8h86" />
            <path className={styles.flat} d="M30 15h180" />
          </svg>
          <div className={styles.caption} aria-live="polite" aria-atomic="true">
            <strong lang="en">
              {phase === "lost"
                ? "SIGNAL NOT FOUND"
                : phase === "receiving"
                  ? "RECEIVING…"
                  : phase === "near"
                    ? "A VOICE, ALMOST."
                    : "SEARCHING THE SILENCE"}
            </strong>
            <p>{captions[phase]}</p>
          </div>
          <button
            className={styles.sound}
            type="button"
            lang="en"
            aria-pressed={sound}
            onClick={() => void toggleSound()}
          >
            {" "}
            {sound ? "SOUND ON" : "SOUND OFF"}
            <span aria-hidden="true"> {sound ? "◉" : "○"}</span>
          </button>
          {audioError && (
            <p className={styles.error} role="status">
              音声を開始できません。無音で探索できます。
            </p>
          )}
          <p id="radio-instructions" className={styles.hint}>
            ← ドラッグして同調 →
            <span>ゆっくり動かして微調整 / 矢印キーでも操作</span>
          </p>
        </div>
      </div>
      <noscript>
        <p className={styles.noScript}>
          <span lang="en">404 MHz — SIGNAL NOT FOUND</span>
          。探索にはJavaScriptが必要です。
        </p>
      </noscript>
    </section>
  );
}
