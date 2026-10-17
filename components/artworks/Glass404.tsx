"use client";
import { useEffect, useRef, useState } from "react";
import {
  advanceShard,
  makeCracks,
  makePane,
  scorePane,
  strikePane,
  type GlassCell,
  type Point,
} from "@/lib/glass404";
import styles from "./Glass404.module.css";
type Phase = "whole" | "cracked" | "shattered" | "reforming";
export default function Glass404() {
  const stage = useRef<HTMLButtonElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("whole");
  useEffect(() => {
    const button = stage.current!,
      element = canvas.current!,
      ctx = element.getContext("2d");
    if (!ctx) return;
    const plate = document.createElement("canvas"),
      surface = plate.getContext("2d");
    if (!surface) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let height = 700,
      cells: GlassCell[] = [],
      flying: GlassCell[] = [],
      frame = 0,
      last = 0,
      phaseAt = 0,
      state: Phase = "whole",
      alive = true,
      shock = 0,
      hits = 0;
    let held: {
      id: number;
      start: Point;
      point: Point;
      time: number;
      dragged: boolean;
    } | null = null;
    let target: Point = { x: 500, y: 350 };
    const cracks: { points: Point[]; at: number }[] = [];
    function polygon(c: CanvasRenderingContext2D, points: Point[]) {
      c.beginPath();
      points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
      c.closePath();
    }
    function metrics() {
      button.dataset.damage = String(hits);
      button.dataset.remaining = String(
        Math.round((100 * cells.filter((c) => c.intact).length) / cells.length),
      );
      button.dataset.scored = String(
        cells.filter((c) => c.intact && c.damage > 0.3).length,
      );
    }
    function change(value: Phase) {
      state = value;
      phaseAt = performance.now();
      setPhase(value);
      button.dataset.glassPhase = value;
    }
    function paintPlate() {
      surface!.clearRect(0, 0, plate.width, plate.height);
      surface!.save();
      surface!.beginPath();
      for (const cell of cells)
        if (cell.intact) {
          surface!.moveTo(cell.points[0].x, cell.points[0].y);
          for (const p of cell.points.slice(1)) surface!.lineTo(p.x, p.y);
          surface!.closePath();
        }
      surface!.clip();
      const glaze = surface!.createLinearGradient(0, 0, 1000, height);
      glaze.addColorStop(0, "rgba(170,204,212,.18)");
      glaze.addColorStop(0.33, "rgba(186,220,224,.035)");
      glaze.addColorStop(0.48, "rgba(222,238,231,.2)");
      glaze.addColorStop(0.51, "rgba(13,25,33,.24)");
      glaze.addColorStop(1, "rgba(121,174,191,.17)");
      surface!.fillStyle = glaze;
      surface!.fillRect(0, 0, 1000, height);
      surface!.save();
      surface!.translate(160, 0);
      surface!.rotate(0.36);
      surface!.fillStyle = "rgba(229,248,246,.045)";
      surface!.fillRect(0, -500, 130, height * 3);
      surface!.fillRect(149, -500, 4, height * 3);
      surface!.restore();
      for (const crack of cracks) {
        surface!.beginPath();
        crack.points.forEach((p, i) =>
          i ? surface!.lineTo(p.x, p.y) : surface!.moveTo(p.x, p.y),
        );
        surface!.shadowBlur = 7;
        surface!.shadowColor = "#aef8e7";
        surface!.strokeStyle = "rgba(190,248,233,.38)";
        surface!.lineWidth = 3;
        surface!.stroke();
        surface!.shadowBlur = 0;
        surface!.lineWidth = 0.65;
        surface!.strokeStyle = "#ecfff8";
        surface!.stroke();
      }
      surface!.restore();
      // Exposed edges catch the light; intact mesh joints remain invisible.
      surface!.lineWidth = 1;
      surface!.strokeStyle = "rgba(222,255,245,.8)";
      for (const cell of cells)
        if (!cell.intact) {
          polygon(surface!, cell.points);
          surface!.stroke();
        }
    }
    function reset() {
      cells = makePane(height);
      flying = [];
      cracks.length = 0;
      hits = 0;
      metrics();
      paintPlate();
    }
    function wake() {
      if (alive && !frame && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    }
    function resize() {
      const box = element.getBoundingClientRect(),
        ratio = Math.min(devicePixelRatio || 1, 2);
      element.width = Math.round(box.width * ratio);
      element.height = Math.round(box.height * ratio);
      const next = (1000 * box.height) / box.width;
      if (Math.abs(next - height) > 2 || !cells.length) {
        height = next;
        plate.width = 1000;
        plate.height = Math.ceil(height);
        reset();
        change("whole");
        target = { x: 500, y: height * 0.5 };
      }
      wake();
    }
    function impact(p: Point, power: number) {
      if (state === "shattered" || state === "reforming") return;
      const removed = strikePane(cells, p, power);
      flying.push(...removed);
      hits++;
      shock = motion.matches ? 0 : 1;
      for (const ray of makeCracks(p)) {
        cracks.push({ points: ray.points, at: performance.now() });
        for (const branch of ray.branches)
          cracks.push({ points: branch, at: performance.now() });
      }
      if (cracks.length > 450) cracks.splice(0, cracks.length - 450);
      change(cells.some((c) => c.intact) ? "cracked" : "shattered");
      metrics();
      paintPlate();
      wake();
    }
    function draw(now: number) {
      frame = 0;
      if (!alive || document.hidden) return;
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      if (state === "shattered" && now - phaseAt > 2600) {
        change("reforming");
        reset();
      }
      if (state === "reforming" && now - phaseAt > 1200) change("whole");
      ctx!.setTransform(
        element.width / 1000,
        0,
        0,
        element.height / height,
        0,
        0,
      );
      ctx!.clearRect(0, 0, 1000, height);
      ctx!.save();
      if (shock > 0) {
        ctx!.translate(
          Math.sin(now * 0.19) * shock * 8,
          Math.cos(now * 0.15) * shock * 5,
        );
        shock = Math.max(0, shock - dt * 3.6);
      }
      if (state !== "shattered") {
        ctx!.globalAlpha =
          state === "reforming" && !motion.matches
            ? Math.min(1, (now - phaseAt) / 1200)
            : 1;
        ctx!.drawImage(plate, 0, 0);
        ctx!.globalAlpha = 1;
      }
      for (const cell of flying) {
        cell.age += dt;
        if (motion.matches) continue;
        advanceShard(cell, dt);
        ctx!.save();
        ctx!.translate(cell.x, cell.y);
        ctx!.rotate(cell.angle);
        ctx!.scale(0.65 + 0.35 * Math.cos(cell.angle), 1);
        ctx!.translate(-cell.home.x, -cell.home.y);
        polygon(ctx!, cell.points);
        ctx!.globalAlpha = Math.max(0, 1 - cell.age / 2.4);
        ctx!.fillStyle = `rgba(165,231,222,${0.12 + Math.abs(Math.sin(cell.angle * 2)) * 0.45})`;
        ctx!.fill();
        ctx!.strokeStyle = "#e5fff3";
        ctx!.lineWidth = 1.1;
        ctx!.stroke();
        ctx!.restore();
      }
      flying = flying.filter(
        (c) => !motion.matches && c.age < 2.4 && c.y < height + 250,
      );
      if (held && !held.dragged) {
        const charge = Math.min(1, (now - held.time) / 750);
        ctx!.beginPath();
        ctx!.arc(held.point.x, held.point.y, 12 + charge * 35, 0, Math.PI * 2);
        ctx!.strokeStyle = "rgba(229,255,245,.7)";
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }
      ctx!.restore();
      if (
        flying.length ||
        shock > 0 ||
        held ||
        state === "shattered" ||
        state === "reforming"
      )
        frame = requestAnimationFrame(draw);
    }
    function point(e: PointerEvent): Point {
      const box = element.getBoundingClientRect();
      return {
        x: ((e.clientX - box.x) / box.width) * 1000,
        y: ((e.clientY - box.y) / box.height) * height,
      };
    }
    function down(e: PointerEvent) {
      if (
        e.button !== 0 ||
        held ||
        state === "shattered" ||
        state === "reforming"
      )
        return;
      const p = point(e);
      held = {
        id: e.pointerId,
        start: p,
        point: p,
        time: performance.now(),
        dragged: false,
      };
      button.setPointerCapture(e.pointerId);
      wake();
    }
    function move(e: PointerEvent) {
      if (!held || held.id !== e.pointerId) return;
      const p = point(e);
      if (Math.hypot(p.x - held.start.x, p.y - held.start.y) > 12)
        held.dragged = true;
      if (
        held.dragged &&
        Math.hypot(p.x - held.point.x, p.y - held.point.y) > 8
      ) {
        scorePane(cells, held.point, p);
        cracks.push({ points: [held.point, p], at: performance.now() });
        if (cracks.length > 450) cracks.shift();
        paintPlate();
        metrics();
        held.point = p;
      }
      wake();
    }
    function up(e: PointerEvent) {
      if (!held || held.id !== e.pointerId) return;
      const press = held;
      held = null;
      if (!press.dragged)
        impact(
          press.start,
          Math.min(1, (performance.now() - press.time) / 750),
        );
      if (button.hasPointerCapture(e.pointerId))
        button.releasePointerCapture(e.pointerId);
      wake();
    }
    function cancel() {
      held = null;
      wake();
    }
    function key(e: KeyboardEvent) {
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        target = {
          x: Math.max(
            20,
            Math.min(
              980,
              target.x +
                (e.key === "ArrowRight" ? 65 : e.key === "ArrowLeft" ? -65 : 0),
            ),
          ),
          y: Math.max(
            80,
            Math.min(
              height - 80,
              target.y +
                (e.key === "ArrowDown" ? 65 : e.key === "ArrowUp" ? -65 : 0),
            ),
          ),
        };
        return;
      }
      if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
        e.preventDefault();
        let p = target;
        const nearest = cells
          .filter((c) => c.intact)
          .sort(
            (a, b) =>
              Math.hypot(a.home.x - p.x, a.home.y - p.y) -
              Math.hypot(b.home.x - p.x, b.home.y - p.y),
          )[0];
        if (nearest) p = nearest.home;
        impact(p, 1);
      }
    }
    function visibility() {
      cancel();
      cancelAnimationFrame(frame);
      frame = 0;
      if (!document.hidden) {
        phaseAt = performance.now();
        wake();
      }
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointermove", move);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", cancel);
    button.addEventListener("lostpointercapture", cancel);
    button.addEventListener("blur", cancel);
    button.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", wake);
    resize();
    element.dataset.enhanced = "true";
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const [name, handler] of [
        ["pointerdown", down],
        ["pointermove", move],
        ["pointerup", up],
        ["pointercancel", cancel],
        ["lostpointercapture", cancel],
        ["blur", cancel],
        ["keydown", key],
      ] as const)
        button.removeEventListener(name, handler as EventListener);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", wake);
      plate.width = 0;
    };
  }, []);
  return (
    <button
      ref={stage}
      type="button"
      className={styles.stage}
      data-glass-phase={phase}
      data-damage="0"
      data-remaining="100"
      aria-label="Glass 404: strike anywhere. Drag to score the pane, then strike the wound. Hold for force. Arrow keys aim; Enter or Space strikes."
    >
      <span className={styles.world} aria-hidden="true">
        <span className={styles.horizon} />
        <span className={styles.floor} />
        <span className={styles.door}>
          <span>404</span>
          <small>NO WORLD BEYOND THIS POINT</small>
        </span>
        <span className={styles.beam} />
      </span>
      <span className={styles.glaze} aria-hidden="true" />
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      <span className={styles.kicker}>
        003 / GLASS<span>SHATTER THE MISSING WORLD</span>
      </span>
      <span className={styles.caption} role="status" aria-live="polite">
        {phase === "shattered"
          ? "YOU MADE A WAY THROUGH."
          : phase === "reforming"
            ? "THE WORLD CLOSES AGAIN."
            : "THERE IS SOMETHING ON THE OTHER SIDE."}
        <span>
          {phase === "shattered"
            ? "STAY A MOMENT."
            : "SCORE THE SURFACE. STRIKE THE WOUND."}
        </span>
      </span>
    </button>
  );
}
