"use client";
import { useEffect, useRef, useState } from "react";
import {
  createSmoke,
  blowSmoke,
  stepSmoke,
  smokeAt,
  smokeArrival,
  smokeTexture,
  type SmokePoint,
} from "@/lib/smoke404";
import {
  createSmokeGL,
  createSmokeCanvas,
  type SmokeRenderer,
} from "@/lib/smoke-renderer";
import styles from "./Smoke404.module.css";
type Phase = "visible" | "gathering" | "veiled" | "clearing";
const captions = {
  visible: "It was here.",
  gathering: "Some things disappear slowly.",
  veiled: "You know where it is.",
  clearing: "For a moment, there it is.",
};
export default function Smoke404() {
  const stage = useRef<HTMLButtonElement>(null),
    gpu = useRef<HTMLCanvasElement>(null),
    fallback = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("visible");
  useEffect(() => {
    const button = stage.current!,
      canvas = gpu.current!,
      cpu = fallback.current!,
      texture = document.createElement("canvas");
    texture.width = texture.height = 256;
    const source = texture.getContext("2d");
    if (!source) return;
    const data = source.createImageData(256, 256);
    data.data.set(smokeTexture());
    source.putImageData(data, 0, 0);
    let renderer: SmokeRenderer | null = createSmokeGL(
        canvas,
        texture,
        data.data,
      ),
      usingGL = !!renderer;
    if (!renderer) renderer = createSmokeCanvas(cpu, texture);
    if (!renderer) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let world = createSmoke(700),
      frame = 0,
      last = 0,
      painted = -Infinity,
      alive = true,
      reported: Phase = "visible",
      pointer: number | null = null,
      previous: SmokePoint | null = null,
      aim: SmokePoint = { x: 550, y: 350 };
    function display() {
      canvas.style.visibility = usingGL ? "visible" : "hidden";
      cpu.style.visibility = usingGL ? "hidden" : "visible";
      if (renderer) button.dataset.renderer = usingGL ? "webgl" : "canvas";
      else delete button.dataset.renderer;
    }
    function report() {
      const density = smokeArrival(world.time),
        clear = smokeAt(world, { x: 550, y: world.height * 0.49 })[2];
      const next: Phase =
        density === 0
          ? "visible"
          : clear > 0.12
            ? "clearing"
            : density < 0.99
              ? "gathering"
              : "veiled";
      if (next !== reported) {
        reported = next;
        setPhase(next);
      }
      button.dataset.clear = clear.toFixed(3);
      button.dataset.arrival = density.toFixed(3);
    }
    function wake() {
      if (alive && !frame && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    }
    function resize() {
      const box = button.getBoundingClientRect(),
        ratio = Math.min(devicePixelRatio || 1, 1.25, 1000 / box.width),
        height = (1000 * box.height) / box.width;
      for (const c of [canvas, cpu]) {
        c.width = Math.round(box.width * ratio);
        c.height = Math.round(box.height * ratio);
      }
      if (Math.abs(world.height - height) > 2) {
        world = createSmoke(height, box.width < 600);
        aim = { x: 550, y: height * 0.49 };
        previous = null;
        pointer = null;
      }
      renderer?.draw(world);
      report();
      wake();
    }
    function draw(now: number) {
      frame = 0;
      if (!alive || document.hidden) return;
      const elapsed = last ? Math.max(0, (now - last) / 1000) : 1 / 60;
      last = now;
      const energy = stepSmoke(world, elapsed, motion.matches);
      if (now - painted > (usingGL ? 32 : 65)) {
        renderer?.draw(world);
        report();
        painted = now;
      }
      if (!motion.matches || world.time < 5.3 || energy > 0.002)
        frame = requestAnimationFrame(draw);
    }
    function point(e: PointerEvent): SmokePoint {
      const b = button.getBoundingClientRect();
      return {
        x: ((e.clientX - b.x) / b.width) * 1000,
        y: ((e.clientY - b.y) / b.height) * world.height,
      };
    }
    function move(e: PointerEvent) {
      if (pointer !== null && pointer !== e.pointerId) return;
      if (e.pointerType !== "mouse" && pointer === null) return;
      const p = point(e),
        from = previous ?? p;
      const distance = Math.hypot(p.x - from.x, p.y - from.y);
      blowSmoke(world, from, p, Math.min(1.1, 0.28 + distance / 90));
      previous = p;
      wake();
    }
    function down(e: PointerEvent) {
      if (e.button !== 0 || pointer !== null) return;
      pointer = e.pointerId;
      previous = point(e);
      blowSmoke(world, previous, previous, 1.5);
      button.setPointerCapture(e.pointerId);
      wake();
    }
    function end(e: PointerEvent) {
      if (pointer !== e.pointerId) return;
      const id = pointer;
      pointer = null;
      previous = null;
      if (id !== null && button.hasPointerCapture(id))
        button.releasePointerCapture(id);
    }
    function leave() {
      if (pointer === null) previous = null;
    }
    function cancel() {
      if (pointer !== null && button.hasPointerCapture(pointer))
        button.releasePointerCapture(pointer);
      pointer = null;
      previous = null;
    }
    function key(e: KeyboardEvent) {
      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "Enter",
          " ",
        ].includes(e.key)
      ) {
        e.preventDefault();
        const from = aim;
        aim = {
          x: Math.max(
            20,
            Math.min(
              980,
              aim.x +
                (e.key === "ArrowRight" ? 90 : e.key === "ArrowLeft" ? -90 : 0),
            ),
          ),
          y: Math.max(
            60,
            Math.min(
              world.height - 60,
              aim.y +
                (e.key === "ArrowDown" ? 90 : e.key === "ArrowUp" ? -90 : 0),
            ),
          ),
        };
        blowSmoke(
          world,
          from,
          aim,
          e.key === "Enter" || e.key === " " ? 1.8 : 1.1,
        );
        wake();
      }
    }
    function visibility() {
      cancel();
      cancelAnimationFrame(frame);
      frame = 0;
      if (!document.hidden) wake();
    }
    function lost(e: Event) {
      e.preventDefault();
      renderer?.dispose();
      renderer = createSmokeCanvas(cpu, texture);
      usingGL = false;
      display();
      wake();
    }
    function restored() {
      renderer?.dispose();
      renderer = createSmokeGL(canvas, texture, data.data);
      usingGL = !!renderer;
      if (!renderer) renderer = createSmokeCanvas(cpu, texture);
      display();
      wake();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(button);
    const events = [
      ["pointermove", move],
      ["pointerdown", down],
      ["pointerup", end],
      ["pointercancel", end],
      ["lostpointercapture", end],
      ["pointerleave", leave],
      ["blur", cancel],
      ["keydown", key],
    ] as const;
    for (const [name, handler] of events)
      button.addEventListener(name, handler as EventListener);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", wake);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    display();
    resize();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const [name, handler] of events)
        button.removeEventListener(name, handler as EventListener);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", wake);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      renderer?.dispose();
      texture.width = 0;
    };
  }, []);
  return (
    <button
      ref={stage}
      type="button"
      className={styles.stage}
      data-smoke-phase={phase}
      aria-label="Lost in Smoke 404: move the mouse or swipe to part the smoke. Click or tap to blow. Arrow keys move the wind; Enter or Space blows."
    >
      <span className={styles.kicker} aria-hidden="true">
        005 / LOST IN SMOKE<span>A PLACE YOU ALMOST REMEMBER</span>
      </span>
      <span className={styles.number} data-smoke-number aria-hidden="true">
        404
      </span>
      <span className={styles.stillSmoke} aria-hidden="true" />
      <canvas ref={gpu} className={styles.canvas} aria-hidden="true" />
      <canvas ref={fallback} className={styles.canvas} aria-hidden="true" />
      <span className={styles.caption} role="status" aria-live="polite">
        {captions[phase]}
        <span>NOTHING MOVED. ONLY THE AIR.</span>
      </span>
    </button>
  );
}
