"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  createRipples,
  dragWind,
  leafBounds,
  clamp,
  updateRipples,
  type Vector,
} from "@/lib/ripples404";
import { createRippleRenderer } from "@/lib/ripples-renderer";
import styles from "./Ripples404.module.css";

export default function Ripples404() {
  const stageRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLOutputElement>(null);
  const hint = useId();
  const [message, setMessage] = useState(
    "水面をゆっくりなぞると、そよ風が吹きます。",
  );
  useEffect(() => {
    const stage = stageRef.current,
      input = inputRef.current,
      canvas = canvasRef.current,
      output = outputRef.current;
    if (!stage || !input || !canvas || !output) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const renderer = createRippleRenderer();
    const state = createRipples();
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1,
      height = 1,
      ratio = 1,
      raf = 0,
      last: number | null = null;
    let blurred = false,
      lastOutput = 0,
      held = 0;
    let target: Vector | null = null,
      targetUntil = 0;
    let pointer: {
      id: number;
      startX: number;
      startY: number;
      x: number;
      y: number;
      time: number;
      active: boolean;
    } | null = null;
    const keys = new Set<string>();
    function paint() {
      ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
      renderer.paint(ctx!, width, height, state, media.matches);
      stage!.dataset.windX = state.wind.x.toFixed(4);
      stage!.dataset.windY = state.wind.y.toFixed(4);
      stage!.dataset.force = Math.hypot(state.user.x, state.user.y).toFixed(4);
      stage!.dataset.leafX = state.leaf.x.toFixed(5);
      stage!.dataset.leafY = state.leaf.y.toFixed(5);
      stage!.dataset.phase = state.phase.toFixed(4);
      stage!.dataset.reduced = String(media.matches);
    }
    function readout() {
      const strength = Math.hypot(state.user.x, state.user.y);
      if (strength < 0.04) output!.value = "NATURAL BREEZE";
      else {
        const angle = Math.atan2(state.wind.y, state.wind.x);
        const arrows = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];
        output!.value = `${
          arrows[(Math.round(angle / (Math.PI / 4)) + 8) % 8]
        } ${
          strength < 0.3
            ? "SOFT BREEZE"
            : strength < 0.65
              ? "BREEZE"
              : "STEADY BREEZE"
        }`;
      }
    }
    function start() {
      if (!raf && !document.hidden && !blurred)
        raf = requestAnimationFrame(tick);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      last = null;
    }
    function releasePointer() {
      const old = pointer;
      pointer = null;
      if (old && input!.hasPointerCapture(old.id))
        input!.releasePointerCapture(old.id);
    }
    function clearInput() {
      releasePointer();
      keys.clear();
      target = null;
      held = 0;
      stage!.dataset.input = "idle";
    }
    function tick(now: number) {
      raf = 0;
      if (document.hidden || blurred) {
        last = null;
        return;
      }
      if (last !== null && now - last < 1000 / 30 - 1) {
        start();
        return;
      }
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      let desired: Vector | null = null;
      if (keys.size) {
        held += dt;
        const x =
          Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
        const y = Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp"));
        const length = Math.hypot(x, y);
        const strength = Math.min(1, 0.16 + held * 0.28);
        if (length)
          desired = { x: (x / length) * strength, y: (y / length) * strength };
      } else if (target && now < targetUntil) desired = target;
      updateRipples(state, dt, desired, width, height, media.matches);
      paint();
      if (now - lastOutput > 250) {
        readout();
        lastOutput = now;
      }
      if (
        !media.matches ||
        keys.size ||
        desired ||
        Math.hypot(state.user.x, state.user.y) > 0.005
      )
        start();
      else {
        last = null;
        readout();
      }
    }
    function resize() {
      const box = stage!.getBoundingClientRect();
      width = Math.max(1, box.width);
      height = Math.max(1, box.height);
      ratio = Math.min(
        devicePixelRatio || 1,
        1.5,
        Math.sqrt(1800000 / (width * height)),
      );
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      clearInput();
      const bounds = leafBounds(width, height);
      state.leaf.x = clamp(state.leaf.x, bounds.left, bounds.right);
      state.leaf.y = clamp(state.leaf.y, bounds.top, bounds.bottom);
      stage!.dataset.width = String(Math.round(width));
      stage!.dataset.height = String(Math.round(height));
      paint();
      start();
    }
    const down = (event: PointerEvent) => {
      if (pointer || !event.isPrimary || event.button !== 0) return;
      keys.clear();
      held = 0;
      const rect = input.getBoundingClientRect();
      pointer = {
        id: event.pointerId,
        startX: event.clientX - rect.left,
        startY: event.clientY - rect.top,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        time: performance.now(),
        active: false,
      };
      input.setPointerCapture(event.pointerId);
      input.focus({ preventScroll: true });
      input.dataset.pointer = "true";
    };
    const move = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const rect = input.getBoundingClientRect();
      const x = event.clientX - rect.left,
        y = event.clientY - rect.top;
      if (
        !pointer.active &&
        Math.hypot(x - pointer.startX, y - pointer.startY) < 6
      )
        return;
      const now = performance.now();
      const elapsed = now - pointer.time;
      if (elapsed < 8) return;
      target = dragWind(
        x - pointer.x,
        y - pointer.y,
        elapsed,
        Math.min(width, height),
      );
      targetUntil = now + 140;
      if (!pointer.active)
        setMessage("風が水面を渡り、404と葉を揺らしています。");
      pointer.active = true;
      pointer.x = x;
      pointer.y = y;
      pointer.time = now;
      stage.dataset.input = "drag";
      start();
    };
    const end = (event: PointerEvent) => {
      if (pointer?.id !== event.pointerId) return;
      const active = pointer.active;
      if (event.type === "pointerup") {
        releasePointer();
        keys.clear();
        held = 0;
        stage.dataset.input = "idle";
      } else clearInput();
      if (active)
        setMessage("風がゆっくり弱まります。逆方向になぞると、葉も戻ります。");
      start();
    };
    const keyDown = (event: KeyboardEvent) => {
      delete input.dataset.pointer;
      if (event.key === "Escape") {
        clearInput();
        setMessage("風を離しました。静けさが戻ります。");
        start();
        return;
      }
      if (
        !event.key.startsWith("Arrow") ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey
      )
        return;
      event.preventDefault();
      releasePointer();
      if (!keys.size) {
        held = 0;
        setMessage(
          "矢印の方向へ風を送っています。押し続けると少し強まります。",
        );
      }
      keys.add(event.key);
      stage.dataset.input = "keyboard";
      start();
    };
    const keyUp = (event: KeyboardEvent) => {
      if (!keys.has(event.key)) return;
      event.preventDefault();
      keys.delete(event.key);
      if (!keys.size) {
        held = 0;
        stage.dataset.input = "idle";
        setMessage("風がゆっくり弱まります。");
      }
      start();
    };
    const inputBlur = () => {
      clearInput();
      start();
    };
    const visibility = () => {
      if (document.hidden || blurred) {
        clearInput();
        stop();
      } else {
        last = null;
        start();
      }
    };
    const windowBlur = () => {
      blurred = true;
      visibility();
    };
    const windowFocus = () => {
      blurred = false;
      visibility();
    };
    const motion = () => {
      clearInput();
      state.user.x = 0;
      state.user.y = 0;
      state.leaf.vx = 0;
      state.leaf.vy = 0;
      stop();
      paint();
      readout();
      if (!media.matches) start();
    };
    input.addEventListener("pointerdown", down);
    input.addEventListener("pointermove", move);
    input.addEventListener("pointerup", end);
    input.addEventListener("pointercancel", end);
    input.addEventListener("lostpointercapture", end);
    input.addEventListener("keydown", keyDown);
    input.addEventListener("keyup", keyUp);
    input.addEventListener("blur", inputBlur);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", windowBlur);
    window.addEventListener("focus", windowFocus);
    media.addEventListener("change", motion);
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    readout();
    stage.dataset.ready = "true";
    return () => {
      clearInput();
      stop();
      observer.disconnect();
      input.removeEventListener("pointerdown", down);
      input.removeEventListener("pointermove", move);
      input.removeEventListener("pointerup", end);
      input.removeEventListener("pointercancel", end);
      input.removeEventListener("lostpointercapture", end);
      input.removeEventListener("keydown", keyDown);
      input.removeEventListener("keyup", keyUp);
      input.removeEventListener("blur", inputBlur);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", windowBlur);
      window.removeEventListener("focus", windowFocus);
      media.removeEventListener("change", motion);
    };
  }, []);
  return (
    <section
      ref={stageRef}
      className={styles.ripples}
      aria-label="404 Ripples"
      data-input="idle"
    >
      <div
        ref={inputRef}
        className={styles.surface}
        tabIndex={0}
        role="group"
        aria-label="水面に風を送る"
        aria-describedby={hint}
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        <svg
          className={styles.fallback}
          viewBox="0 0 900 600"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="青緑の静かな水面に浮かぶ404と1枚の葉"
        >
          <path d="M0 0H900V600H0Z" fill="#538e99" />
          <g fill="none" stroke="#b8d7cc" strokeWidth="2" opacity=".3">
            <path d="M60 180q90-20 170 5t170-5m120 30q100-20 200 0M20 430q100-20 180 0m130 40q120-20 250 5M520 90q120-20 270 0" />
          </g>
          <text
            x="450"
            y="335"
            textAnchor="middle"
            fill="#f4eedb"
            fontFamily="Arial,sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="180"
          >
            404
          </text>
          <path d="M638 411q30-28 58 0-31 25-58 0" fill="#c9b968" />
        </svg>
      </div>
      <div className={styles.caption} aria-hidden="true">
        <span>Page not found</span>
        <i />
        <output ref={outputRef}>NATURAL BREEZE</output>
      </div>
      <p id={hint} className={styles.instructions}>
        水面をドラッグして風を送ります。ゆっくり動かすと弱い風、速く動かすと強い風。矢印キーを押し続けても操作できます。Escapeで風を離します。動きを減らす設定では、移動を止めて水面の明暗と風向表示で応答します。
      </p>
      <p className={styles.instructions} role="status">
        {message}
      </p>
      <noscript>
        <p className={styles.noScript}>
          静かな水面を展示しています。風の操作にはJavaScriptが必要です。
        </p>
      </noscript>
    </section>
  );
}
