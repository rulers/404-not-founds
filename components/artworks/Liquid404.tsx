"use client";
import { useEffect, useRef, useState } from "react";
import {
  createLiquid,
  grabLiquid,
  releaseLiquid,
  stepLiquid,
  liquidGroups,
} from "@/lib/liquid404";
import {
  createWebGLLiquid,
  createCanvasLiquid,
  type LiquidRenderer,
} from "@/lib/liquid-renderer";
import styles from "./Liquid404.module.css";
export default function Liquid404() {
  const stage = useRef<HTMLButtonElement>(null),
    field = useRef<HTMLSpanElement>(null),
    glCanvas = useRef<HTMLCanvasElement>(null),
    fallbackCanvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState("resting");
  useEffect(() => {
    const button = stage.current!,
      area = field.current!,
      gpu = glCanvas.current!,
      cpu = fallbackCanvas.current!,
      motion = matchMedia("(prefers-reduced-motion: reduce)");
    let renderer: LiquidRenderer | null = createWebGLLiquid(gpu),
      usingGL = !!renderer,
      liquid = createLiquid(),
      frame = 0,
      last = 0,
      alive = true,
      pointer: number | null = null,
      lastPaint = 0,
      reported = "",
      settled = false;
    if (!renderer) renderer = createCanvasLiquid(cpu);
    if (!renderer) return;
    function display() {
      gpu.style.visibility = usingGL ? "visible" : "hidden";
      cpu.style.visibility = usingGL ? "hidden" : "visible";
      area.dataset.renderer = usingGL ? "webgl" : "canvas";
      area.dataset.enhanced = "true";
    }
    display();
    function report() {
      const next = liquid.holding
        ? "touching"
        : liquid.formed
          ? "formed"
          : liquid.idle < 6
            ? "resting"
            : "gathering";
      if (next !== reported) {
        reported = next;
        setState(next);
      }
      button.dataset.groups = String(liquidGroups(liquid));
      button.dataset.split = String(liquid.split);
      button.dataset.merged = String(liquid.merged);
      button.dataset.firstX = liquid.drops[0].x.toFixed(1);
      button.dataset.firstY = liquid.drops[0].y.toFixed(1);
    }
    function wake() {
      if (alive && !frame && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    }
    function resize() {
      const box = area.getBoundingClientRect(),
        ratio = Math.min(devicePixelRatio || 1, 1.25),
        scale = Math.min(ratio, 750 / box.width);
      for (const canvas of [gpu, cpu]) {
        canvas.width = Math.round(box.width * scale);
        canvas.height = Math.round(box.height * scale);
      }
      const h = (box.height / box.width) * 1000;
      if (Math.abs(liquid.height - h) > 2) {
        liquid = createLiquid(h);
        pointer = null;
        reported = "";
        settled = false;
      }
      report();
      wake();
    }
    function draw(now: number) {
      frame = 0;
      if (!alive || document.hidden) return;
      const dt = last ? Math.min((now - last) / 1000, 0.25) : 1 / 60;
      last = now;
      let energy = 0;
      const steps = Math.max(1, Math.ceil(dt * 60));
      for (let i = 0; i < steps; i++)
        energy = stepLiquid(liquid, dt / steps, motion.matches);
      if (now - lastPaint > (usingGL ? 30 : 65) || liquid.holding) {
        renderer?.draw(liquid);
        report();
        lastPaint = now;
      }
      // Continue through the idle invitation and gather, then stop on a still 404.
      settled = liquid.formed && energy < 0.02;
      if (!settled || liquid.holding) frame = requestAnimationFrame(draw);
    }
    function point(e: PointerEvent) {
      const b = area.getBoundingClientRect();
      return {
        x: ((e.clientX - b.x) / b.width) * 1000,
        y: ((e.clientY - b.y) / b.height) * liquid.height,
      };
    }
    function down(e: PointerEvent) {
      if (e.button !== 0 || pointer !== null) return;
      const p = point(e);
      if (!grabLiquid(liquid, p.x, p.y)) return;
      pointer = e.pointerId;
      button.setPointerCapture(e.pointerId);
      reported = "";
      report();
      wake();
    }
    function move(e: PointerEvent) {
      if (pointer !== e.pointerId) return;
      const p = point(e);
      liquid.pointer = {
        x: Math.max(0, Math.min(1000, p.x)),
        y: Math.max(0, Math.min(liquid.height, p.y)),
      };
      wake();
    }
    function end(e?: PointerEvent) {
      if (e && pointer !== e.pointerId) return;
      if (pointer === null && !liquid.holding) return;
      releaseLiquid(liquid, e?.type !== "pointerup");
      const id = pointer;
      pointer = null;
      if (id !== null && button.hasPointerCapture(id))
        button.releasePointerCapture(id);
      report();
      wake();
    }
    function key(e: KeyboardEvent) {
      if (
        [
          "Enter",
          " ",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Escape",
        ].includes(e.key)
      ) {
        e.preventDefault();
        if (e.key === "Escape") {
          end();
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          if (liquid.holding) {
            releaseLiquid(liquid);
          } else {
            const p = liquid.drops[0];
            grabLiquid(liquid, p.x, p.y);
          }
        } else {
          if (!liquid.holding) {
            const p = liquid.drops[0];
            grabLiquid(liquid, p.x, p.y);
          }
          liquid.pointer.x +=
            e.key === "ArrowRight" ? 65 : e.key === "ArrowLeft" ? -65 : 0;
          liquid.pointer.y +=
            e.key === "ArrowDown" ? 65 : e.key === "ArrowUp" ? -65 : 0;
        }
        report();
        wake();
      }
    }
    function blur() {
      end();
    }
    function visibility() {
      blur();
      cancelAnimationFrame(frame);
      frame = 0;
      if (!document.hidden) wake();
    }
    function lost(e: Event) {
      e.preventDefault();
      renderer?.dispose();
      renderer = createCanvasLiquid(cpu);
      usingGL = false;
      display();
      wake();
    }
    function restored() {
      renderer?.dispose();
      renderer = createWebGLLiquid(gpu);
      usingGL = !!renderer;
      if (!renderer) renderer = createCanvasLiquid(cpu);
      display();
      wake();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(area);
    for (const [name, handler] of [
      ["pointerdown", down],
      ["pointermove", move],
      ["pointerup", end],
      ["pointercancel", end],
      ["lostpointercapture", end],
      ["blur", blur],
      ["keydown", key],
    ] as const)
      button.addEventListener(name, handler as EventListener);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", wake);
    gpu.addEventListener("webglcontextlost", lost);
    gpu.addEventListener("webglcontextrestored", restored);
    resize();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer?.dispose();
      for (const [name, handler] of [
        ["pointerdown", down],
        ["pointermove", move],
        ["pointerup", end],
        ["pointercancel", end],
        ["lostpointercapture", end],
        ["blur", blur],
        ["keydown", key],
      ] as const)
        button.removeEventListener(name, handler as EventListener);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", wake);
      gpu.removeEventListener("webglcontextlost", lost);
      gpu.removeEventListener("webglcontextrestored", restored);
    };
  }, []);
  return (
    <button
      ref={stage}
      type="button"
      className={styles.stage}
      data-liquid-state={state}
      aria-label="Liquid 404: grab a pool, pull to stretch and tear, push pools together to merge. Enter or Space grabs and releases; arrow keys move the liquid."
    >
      <span className={styles.invitation}>
        nothing
        <br />
        <em>holds its shape.</em>
      </span>
      <span className={styles.note}>
        004 / LIQUID
        <br />A SMALL POOL OF POSSIBILITIES.
      </span>
      <span ref={field} className={styles.field}>
        <svg
          className={styles.still}
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#263db8"
            d="M170 210C120 130 260 90 310 160C370 240 300 330 230 300C195 290 200 240 170 210ZM560 110C630 60 730 130 690 200C650 270 540 230 540 180C540 150 540 130 560 110ZM710 430C700 360 830 340 860 420C900 530 750 560 710 490ZM300 470C280 400 420 370 460 430C510 520 360 580 320 530Z"
          />
        </svg>
        <canvas ref={glCanvas} className={styles.canvas} aria-hidden="true" />
        <canvas
          ref={fallbackCanvas}
          className={styles.canvas}
          aria-hidden="true"
        />
        <span className={styles.poolLabel}>NO FIXED FORM / 404</span>
      </span>
      <span className={styles.caption} role="status" aria-live="polite">
        {state === "touching"
          ? "take a little with you."
          : state === "formed"
            ? "a shape, for now."
            : state === "gathering"
              ? "even nothing finds a shape."
              : "pull apart. bring together."}
      </span>
    </button>
  );
}
