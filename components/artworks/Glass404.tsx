"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import {
  GLASS_PATH,
  advanceShard,
  makeCracks,
  makeShards,
  type Crack,
  type Point,
  type Shard,
} from "@/lib/glass404";
import styles from "./Glass404.module.css";

type Phase = "whole" | "cracked" | "shattered" | "reforming";
const words = {
  whole: "SOMETHING FRAGILE.",
  cracked: "EVERY TOUCH LEAVES A TRACE.",
  shattered: "LET IT GO.",
  reforming: "NOTHING IS EVER LOST.",
};

export default function Glass404() {
  const id = useId().replaceAll(":", "");
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<(point: Point) => void>(() => {});
  const light = useRef<Point>({ x: 300, y: 180 });
  const [phase, setPhase] = useState<Phase>("whole");
  const [damage, setDamage] = useState(0);
  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext("2d");
    if (!element || !ctx || typeof Path2D === "undefined") return;
    const path = new Path2D(GLASS_PATH);
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let state: Phase = "whole",
      hits = 0,
      start = 0,
      last = 0,
      frame = 0;
    let cracks: Crack[] = [],
      shards: Shard[] = [];
    let impact: Point = { x: 260, y: 240 };
    let shockAt = -10000;
    let dirty = true;
    let requestDraw = () => {};
    function change(value: Phase) {
      state = value;
      dirty = true;
      setPhase(value);
    }
    const resize = () => {
      const bounds = element!.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 2);
      element!.width = Math.round(bounds.width * ratio);
      element!.height = Math.round(bounds.height * ratio);
      dirty = true;
      requestDraw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    function glass() {
      const fill = ctx!.createLinearGradient(70, 20, 900, 470);
      fill.addColorStop(0, "rgba(188,239,255,.12)");
      fill.addColorStop(0.24, "rgba(223,249,255,.40)");
      fill.addColorStop(0.29, "rgba(99,178,204,.09)");
      fill.addColorStop(0.56, "rgba(160,209,225,.13)");
      fill.addColorStop(0.72, "rgba(240,219,255,.31)");
      fill.addColorStop(0.76, "rgba(106,180,208,.08)");
      fill.addColorStop(1, "rgba(217,247,255,.27)");
      ctx!.fillStyle = fill;
      ctx!.fill(path, "evenodd");
      ctx!.save();
      ctx!.translate(5, 7);
      ctx!.strokeStyle = "rgba(86,164,191,.46)";
      ctx!.lineWidth = 5;
      ctx!.stroke(path);
      ctx!.restore();
      ctx!.strokeStyle = "rgba(225,248,255,.8)";
      ctx!.lineWidth = 1.6;
      ctx!.stroke(path);
      ctx!.save();
      ctx!.clip(path, "evenodd");
      const halo = ctx!.createRadialGradient(
        light.current.x,
        light.current.y,
        0,
        light.current.x,
        light.current.y,
        330,
      );
      halo.addColorStop(0, "rgba(240,252,255,.27)");
      halo.addColorStop(1, "rgba(150,220,255,0)");
      ctx!.fillStyle = halo;
      ctx!.fillRect(0, 0, 1000, 500);
      ctx!.strokeStyle = "rgba(220,246,255,.11)";
      for (let x = -300; x < 1200; x += 94) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x + 370, 500);
        ctx!.stroke();
      }
      ctx!.restore();
    }
    const stroke = (points: Point[]) => {
      ctx!.beginPath();
      points.forEach((p, i) =>
        i ? ctx!.lineTo(p.x, p.y) : ctx!.moveTo(p.x, p.y),
      );
      ctx!.stroke();
    };
    const draw = (now: number) => {
      frame = 0;
      if (document.hidden) return;
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      let age = now - start;
      if (state === "shattered" && age > 2300) {
        change("reforming");
        start = now;
        age = 0;
      } else if (state === "reforming" && age > 1200) {
        change("whole");
        hits = 0;
        cracks = [];
        shards = [];
        setDamage(0);
      }
      if (dirty || state !== "whole" || now - shockAt < 400) {
        ctx.clearRect(0, 0, element.width, element.height);
        ctx.save();
        ctx.scale(element.width / 1000, element.height / 500);
        if (state === "shattered") {
          if (!motion.matches)
            for (const shard of shards) {
              advanceShard(shard, dt);
              const cx = shard.points.reduce((sum, p) => sum + p.x, 0) / 3,
                cy = shard.points.reduce((sum, p) => sum + p.y, 0) / 3;
              ctx.save();
              ctx.translate(shard.x, shard.y);
              ctx.rotate(shard.angle);
              ctx.translate(-cx, -cy);
              ctx.beginPath();
              shard.points.forEach((p, i) =>
                i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
              );
              ctx.closePath();
              ctx.clip();
              ctx.globalAlpha = Math.max(0, 1 - age / 2500);
              glass();
              ctx.restore();
            }
        } else {
          if (state === "reforming")
            ctx.globalAlpha = motion.matches ? 1 : Math.min(1, age / 1100);
          glass();
          if (state === "cracked") {
            ctx.save();
            ctx.clip(path, "evenodd");
            ctx.strokeStyle = "rgba(1,11,17,.85)";
            ctx.lineWidth = 3;
            for (const crack of cracks) stroke(crack.points);
            ctx.translate(-0.8, -0.8);
            ctx.strokeStyle = "rgba(234,252,255,.9)";
            ctx.lineWidth = 0.9;
            for (const crack of cracks) {
              stroke(crack.points);
              ctx.lineWidth = 0.5;
              crack.branches.forEach(stroke);
              ctx.lineWidth = 0.9;
            }
            ctx.restore();
          }
        }
        const shock = (now - shockAt) / 400;
        if (!motion.matches && shock >= 0 && shock < 1) {
          ctx.strokeStyle = `rgba(202,245,255,${(1 - shock) * 0.55})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(impact.x, impact.y, 8 + shock * 65, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        dirty = false;
      }
      if (state === "shattered" || state === "reforming" || now - shockAt < 400)
        frame = requestAnimationFrame(draw);
    };
    const wake = () => {
      dirty = true;
      if (!frame && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    hit.current = (point) => {
      if (
        state === "shattered" ||
        state === "reforming" ||
        !ctx.isPointInPath(path, point.x, point.y, "evenodd")
      )
        return;
      impact = point;
      shockAt = performance.now();
      hits++;
      setDamage(hits);
      cracks.push(...makeCracks(point));
      if (hits >= 6) {
        shards = makeShards(
          (x, y) => ctx.isPointInPath(path, x, y, "evenodd"),
          point,
        );
        change("shattered");
        start = shockAt;
      } else change("cracked");
      wake();
    };
    requestDraw = wake;
    const move = () => wake();
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        if (state === "shattered" || state === "reforming")
          start = performance.now();
        wake();
      }
    };
    element.closest("button")!.addEventListener("pointermove", move);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", wake);
    element.dataset.enhanced = "true";
    wake();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      hit.current = () => {};
      element.closest("button")!.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", wake);
    };
  }, []);
  function point(clientX: number, clientY: number) {
    const bounds = canvas.current!.getBoundingClientRect();
    return {
      x: ((clientX - bounds.left) / bounds.width) * 1000,
      y: ((clientY - bounds.top) / bounds.height) * 500,
    };
  }
  function strike(event: MouseEvent<HTMLButtonElement>) {
    hit.current(
      event.detail === 0
        ? { x: 270, y: 240 }
        : point(event.clientX, event.clientY),
    );
  }
  return (
    <button
      type="button"
      className={styles.stage}
      data-glass-phase={phase}
      data-damage={damage}
      aria-label="Glass 404: click or tap the glass, or press Enter or Space, to crack and shatter it. It will rebuild."
      onClick={strike}
      onPointerMove={(event) => {
        light.current = point(event.clientX, event.clientY);
      }}
    >
      <span className={styles.kicker} aria-hidden="true">
        MATERIAL STUDY / 003 <span>SiO₂ — HANDLE WITH FEELING</span>
      </span>
      <span className={styles.field}>
        <svg
          className={styles.fallback}
          viewBox="0 0 1000 500"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={id}>
              <stop stopColor="#9dc3d6" stopOpacity=".35" />
              <stop offset=".45" stopColor="#e6f9ff" stopOpacity=".6" />
              <stop offset="1" stopColor="#9fadd2" stopOpacity=".15" />
            </linearGradient>
          </defs>
          <path
            d={GLASS_PATH}
            fill={`url(#${id})`}
            fillRule="evenodd"
            stroke="#b7d4e3"
            strokeWidth="1.5"
          />
        </svg>
        <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      </span>
      <span className={styles.caption} aria-live="polite" role="status">
        {words[phase]}
        <span>
          {phase === "shattered" || phase === "reforming"
            ? "A MOMENT. THEN AGAIN."
            : `${String(damage).padStart(2, "0")} / 06 IMPACTS`}
        </span>
      </span>
    </button>
  );
}
