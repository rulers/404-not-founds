"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  GLASS_PATH,
  advanceShard,
  makeCracks,
  makeShards,
  fractureGlass,
  type Point,
  type GlassCell,
} from "@/lib/glass404";
import styles from "./Glass404.module.css";
type Phase = "whole" | "cracked" | "shattered" | "reforming";
type Press = { point: Point | null; time: number };
const words = {
  whole: "BREAK SOMETHING.",
  cracked: "MAKE IT YOUR MESS.",
  shattered: "THAT FELT GOOD.",
  reforming: "ONE MORE TIME?",
};

export default function Glass404() {
  const id = useId().replaceAll(":", "");
  const canvas = useRef<HTMLCanvasElement>(null),
    press = useRef<Press | null>(null);
  const strike = useRef<
      (point: Point | null, power: number, direction: Point) => void
    >(() => {}),
    wake = useRef<() => void>(() => {});
  const [phase, setPhase] = useState<Phase>("whole"),
    [hits, setHits] = useState(0),
    [remaining, setRemaining] = useState(100);
  useEffect(() => {
    const element = canvas.current,
      ctx = element?.getContext("2d"),
      button = element?.closest("button");
    if (!element || !ctx || !button || typeof Path2D === "undefined") return;
    const texture = document.createElement("canvas"),
      plate = document.createElement("canvas");
    texture.width = plate.width = 1000;
    texture.height = plate.height = 500;
    const material = texture.getContext("2d"),
      standing = plate.getContext("2d");
    if (!material || !standing) return;
    const path = new Path2D(GLASS_PATH),
      motion = matchMedia("(prefers-reduced-motion: reduce)");
    let cells: GlassCell[] = [],
      flying: GlassCell[] = [],
      state: Phase = "whole",
      frame = 0,
      last = 0,
      phaseAt = 0,
      shockAt = -10000,
      alive = true,
      count = 0,
      impact: Point = { x: 270, y: 240 },
      force = 0;
    function triangle(context: CanvasRenderingContext2D, points: Point[]) {
      context.beginPath();
      points.forEach((p, i) =>
        i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y),
      );
      context.closePath();
    }
    function prepare() {
      cells = makeShards((x, y) => ctx!.isPointInPath(path, x, y, "evenodd"), {
        x: 500,
        y: 250,
      }).map((cell) => ({ ...cell, intact: true, age: 0 }));
      flying = [];
      count = 0;
      setHits(0);
      setRemaining(100);
      material!.clearRect(0, 0, 1000, 500);
      const fill = material!.createLinearGradient(50, 0, 950, 500);
      [
        [0, "#26303d"],
        [0.2, "#b8c7da"],
        [0.24, "#566376"],
        [0.4, "#19202e"],
        [0.58, "#7c8ea5"],
        [0.62, "#d9e9f4"],
        [0.65, "#566274"],
        [1, "#222b3a"],
      ].forEach(([offset, color]) =>
        fill.addColorStop(Number(offset), String(color)),
      );
      material!.fillStyle = fill;
      material!.globalAlpha = 0.8;
      material!.fill(path, "evenodd");
      material!.globalAlpha = 1;
      material!.save();
      material!.clip(path, "evenodd");
      for (const cell of cells) {
        triangle(material!, cell.points);
        material!.fillStyle = `rgba(220,235,255,${Math.random() * 0.13})`;
        material!.fill();
        material!.strokeStyle = "rgba(234,245,255,.09)";
        material!.lineWidth = 0.55;
        material!.stroke();
      }
      material!.restore();
      material!.save();
      material!.translate(4, 6);
      material!.strokeStyle = "rgba(84,110,145,.75)";
      material!.lineWidth = 5;
      material!.stroke(path);
      material!.restore();
      material!.strokeStyle = "#e4edf9";
      material!.lineWidth = 1.4;
      material!.stroke(path);
      standing!.clearRect(0, 0, 1000, 500);
      standing!.drawImage(texture, 0, 0);
    }
    function change(value: Phase, now = performance.now()) {
      state = value;
      phaseAt = now;
      setPhase(value);
    }
    const request = () => {
      if (alive && !frame && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    function resize() {
      const box = element!.getBoundingClientRect(),
        ratio = Math.min(devicePixelRatio || 1, 2);
      element!.width = Math.round(box.width * ratio);
      element!.height = Math.round(box.height * ratio);
      request();
    }
    function draw(now: number) {
      frame = 0;
      if (!alive || document.hidden || !element!.isConnected) return;
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      let age = now - phaseAt;
      if (state === "shattered" && age > 2100) {
        change("reforming", now);
        age = 0;
      }
      if (state === "reforming" && age > 1100) {
        prepare();
        change("whole", now);
      }
      ctx!.clearRect(0, 0, element!.width, element!.height);
      ctx!.save();
      ctx!.scale(element!.width / 1000, element!.height / 500);
      const shock = Math.max(0, 1 - (now - shockAt) / 320);
      if (!motion.matches) {
        ctx!.translate(
          Math.sin(now * 0.14) * shock * force * 12,
          Math.cos(now * 0.19) * shock * force * 7,
        );
        ctx!.rotate(Math.sin(now * 0.1) * shock * force * 0.004);
      }
      if (state === "reforming")
        ctx!.globalAlpha = motion.matches ? 1 : Math.min(1, age / 1000);
      if (state !== "shattered")
        ctx!.drawImage(state === "reforming" ? texture : plate, 0, 0);
      ctx!.globalAlpha = 1;
      if (!motion.matches)
        for (const cell of flying) {
          cell.age += dt;
          advanceShard(cell, dt);
          if (cell.age > 2.1) continue;
          const cx = cell.points.reduce((n, p) => n + p.x, 0) / 3,
            cy = cell.points.reduce((n, p) => n + p.y, 0) / 3;
          ctx!.save();
          ctx!.translate(cell.x, cell.y);
          ctx!.rotate(cell.angle);
          ctx!.scale(Math.cos(cell.angle * 0.7) * 0.35 + 0.7, 1);
          ctx!.translate(-cx, -cy);
          triangle(ctx!, cell.points);
          ctx!.clip();
          ctx!.globalAlpha = Math.max(0, 1 - cell.age / 2.1);
          ctx!.drawImage(texture, 0, 0);
          ctx!.fillStyle = `rgba(255,255,255,${Math.max(0, Math.sin(cell.angle * 3)) * 0.7})`;
          ctx!.fillRect(cx - 30, cy - 30, 60, 60);
          ctx!.restore();
        }
      flying = flying.filter((cell) => cell.age < 2.1 && !motion.matches);
      if (shock > 0 && !motion.matches) {
        ctx!.strokeStyle = `rgba(255,240,218,${shock * 0.8})`;
        ctx!.lineWidth = 1 + shock;
        ctx!.beginPath();
        ctx!.arc(
          impact.x,
          impact.y,
          6 + (1 - shock) * (50 + force * 100),
          0,
          Math.PI * 2,
        );
        ctx!.stroke();
      }
      const held = press.current;
      if (held?.point && state !== "shattered" && state !== "reforming") {
        const power = Math.min(1, (now - held.time) / 900);
        ctx!.strokeStyle = "#ffab65";
        ctx!.lineWidth = 1.3;
        ctx!.beginPath();
        ctx!.arc(held.point.x, held.point.y, 16 + power * 25, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(
          held.point.x,
          held.point.y,
          21 + power * 25,
          -Math.PI / 2,
          -Math.PI / 2 + power * Math.PI * 2,
        );
        ctx!.stroke();
      }
      ctx!.restore();
      if (
        flying.length ||
        shock > 0 ||
        state === "shattered" ||
        state === "reforming" ||
        held
      )
        frame = requestAnimationFrame(draw);
    }
    strike.current = (point, power, direction) => {
      if (state === "shattered" || state === "reforming") return;
      if (!point) {
        const target = cells.find((cell) => cell.intact);
        if (!target) return;
        point = { x: target.x, y: target.y };
      }
      if (
        point.x < 0 ||
        point.x >= 1000 ||
        point.y < 0 ||
        point.y >= 500 ||
        !ctx.isPointInPath(path, point.x, point.y, "evenodd") ||
        standing.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1)
          .data[3] < 10
      )
        return;
      const removed = fractureGlass(cells, point, power);
      if (!removed.length) return;
      count++;
      setHits(count);
      impact = point;
      force = 0.35 + power;
      shockAt = performance.now();
      let survivors = cells.filter((cell) => cell.intact);
      if (survivors.length / cells.length < 0.32) {
        removed.push(...fractureGlass(cells, { x: 500, y: 250 }, 1, () => 1));
        for (const cell of cells)
          if (cell.intact) {
            cell.intact = false;
            cell.age = 0;
            cell.vx = (cell.x - point.x) * 1.5;
            cell.vy = -200 - Math.random() * 300;
            removed.push(cell);
          }
        survivors = [];
        change("shattered");
      } else change("cracked");
      for (const cell of removed) {
        cell.vx += Math.max(-400, Math.min(400, direction.x * 3));
        cell.vy += Math.max(-200, Math.min(200, direction.y * 3));
      }
      flying.push(...removed);
      standing.save();
      standing.clip(path, "evenodd");
      standing.strokeStyle = "rgba(242,249,255,.9)";
      standing.lineWidth = 0.85;
      for (const crack of makeCracks(point)) {
        standing.beginPath();
        crack.points.forEach((p, i) =>
          i ? standing.lineTo(p.x, p.y) : standing.moveTo(p.x, p.y),
        );
        standing.stroke();
      }
      standing.restore();
      standing.save();
      standing.globalCompositeOperation = "destination-out";
      for (const cell of cells)
        if (!cell.intact) {
          triangle(standing, cell.points);
          standing.fill();
          standing.lineWidth = 1.2;
          standing.stroke();
        }
      standing.restore();
      setRemaining(Math.round((survivors.length / cells.length) * 100));
      request();
    };
    wake.current = request;
    const visibility = () => {
      press.current = null;
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        if (state === "shattered" || state === "reforming")
          phaseAt = performance.now();
        request();
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    prepare();
    resize();
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", request);
    element.dataset.enhanced = "true";
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", request);
      wake.current = () => {};
      strike.current = () => {};
      press.current = null;
      texture.width = plate.width = 0;
    };
  }, []);
  function point(x: number, y: number) {
    const box = canvas.current!.getBoundingClientRect();
    return {
      x: ((x - box.left) / box.width) * 1000,
      y: ((y - box.top) / box.height) * 500,
    };
  }
  return (
    <button
      type="button"
      className={styles.stage}
      data-glass-phase={phase}
      data-damage={hits}
      data-remaining={remaining}
      aria-label="Glass 404: click or tap to chip the glass. Hold then release for a harder impact. Enter or Space breaks a remaining piece."
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        press.current = {
          point: point(event.clientX, event.clientY),
          time: performance.now(),
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        wake.current();
      }}
      onPointerUp={(event) => {
        const held = press.current;
        press.current = null;
        if (held?.point) {
          const end = point(event.clientX, event.clientY);
          strike.current(
            held.point,
            Math.min(1, (performance.now() - held.time) / 900),
            { x: end.x - held.point.x, y: end.y - held.point.y },
          );
        }
        wake.current();
      }}
      onPointerCancel={() => {
        press.current = null;
        wake.current();
      }}
      onLostPointerCapture={() => {
        press.current = null;
        wake.current();
      }}
      onKeyDown={(event) => {
        if ((event.key === " " || event.key === "Enter") && !event.repeat)
          press.current = { point: null, time: performance.now() };
      }}
      onClick={(event) => {
        if (event.detail === 0) {
          const held = press.current;
          press.current = null;
          strike.current(
            null,
            held ? Math.min(1, (performance.now() - held.time) / 900) : 0,
            { x: 0, y: 0 },
          );
        }
      }}
      onBlur={() => {
        press.current = null;
        wake.current();
      }}
    >
      <span className={styles.kicker} aria-hidden="true">
        03 — FRACTURE<span>HOLD YOUR BREATH. LET IT BREAK.</span>
      </span>
      <span className={styles.field}>
        <svg
          className={styles.fallback}
          viewBox="0 0 1000 500"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={id} x2="1" y2="1">
              <stop stopColor="#bdcfdf" />
              <stop offset=".45" stopColor="#263247" />
              <stop offset=".65" stopColor="#d8edff" />
              <stop offset="1" stopColor="#343e50" />
            </linearGradient>
          </defs>
          <path
            d={GLASS_PATH}
            fill={`url(#${id})`}
            fillRule="evenodd"
            stroke="#e2edff"
          />
        </svg>
        <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      </span>
      <span className={styles.caption} aria-live="polite" role="status">
        {words[phase]}
        <span>
          {phase === "shattered" || phase === "reforming"
            ? "THE SILENCE AFTER."
            : `${remaining}% REMAINS — HOLD, AIM, RELEASE`}
        </span>
      </span>
    </button>
  );
}
