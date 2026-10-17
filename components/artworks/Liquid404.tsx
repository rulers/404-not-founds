"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import {
  createLiquid,
  liquidPath,
  pulseLiquid,
  stepLiquid,
  grabLiquid,
  flingLiquid,
  type LiquidInput,
} from "@/lib/liquid404";
import styles from "./Liquid404.module.css";
const STILL = liquidPath(createLiquid());
type Drop = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  age: number;
  size: number;
};
export default function Liquid404() {
  const id = useId().replaceAll(":", "");
  const svg = useRef<SVGSVGElement>(null),
    surface = useRef<SVGPathElement>(null),
    rim = useRef<SVGPathElement>(null),
    clipping = useRef<SVGPathElement>(null),
    shine = useRef<SVGRadialGradientElement>(null),
    beads = useRef<SVGGElement>(null);
  const input = useRef<LiquidInput>({
    x: -1000,
    y: -1000,
    active: false,
    dragging: false,
    anchorX: 0,
    anchorY: 0,
  });
  const previous = useRef({ x: 0, y: 0, time: 0, vx: 0, vy: 0 });
  const wake = useRef<() => void>(() => {}),
    pulse = useRef<(dx: number, dy: number) => void>(() => {}),
    grab = useRef<(x: number, y: number) => void>(() => {}),
    fling = useRef<(vx: number, vy: number) => void>(() => {}),
    spray = useRef<(x: number, y: number, vx: number, vy: number) => void>(
      () => {},
    );
  const [state, setState] = useState("resting");
  useEffect(() => {
    const body = surface.current,
      edge = rim.current,
      clip = clipping.current,
      light = shine.current,
      dropletGroup = beads.current;
    if (!body || !edge || !clip || !light || !dropletGroup) return;
    const loops = createLiquid(),
      motion = matchMedia("(prefers-reduced-motion: reduce)");
    const circles = Array.from({ length: 16 }, () => {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("fill", `url(#${id}-body)`);
      circle.setAttribute("r", "0");
      dropletGroup.append(circle);
      return circle;
    });
    let frame = 0,
      last = 0,
      clock = 0,
      tick = 0,
      settling = false,
      alive = true,
      lastDrop = 0;
    let drops: Drop[] = [];
    const request = () => {
      if (alive && !frame && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    function draw(now: number) {
      frame = 0;
      if (!alive || document.hidden || !body!.isConnected) return;
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      clock += dt;
      const energy = stepLiquid(
        loops,
        input.current,
        dt,
        clock,
        motion.matches,
      );
      if (++tick % 2 === 0 || motion.matches || input.current.dragging) {
        const d = liquidPath(loops);
        body!.setAttribute("d", d);
        edge!.setAttribute("d", d);
        clip!.setAttribute("d", d);
        light!.setAttribute(
          "cx",
          String(input.current.active ? input.current.x : 350),
        );
        light!.setAttribute(
          "cy",
          String(input.current.active ? input.current.y : 120),
        );
      }
      drops = drops.filter((drop) => drop.age < 1.8 && !motion.matches);
      for (let i = 0; i < circles.length; i++) {
        const drop = drops[i],
          circle = circles[i];
        if (!drop) {
          circle.setAttribute("r", "0");
          continue;
        }
        drop.age += dt;
        drop.vx += (drop.homeX - drop.x) * 8 * dt;
        drop.vy += (drop.homeY - drop.y) * 8 * dt;
        drop.vx *= Math.exp(-2.2 * dt);
        drop.vy *= Math.exp(-2.2 * dt);
        drop.x += drop.vx * dt;
        drop.y += drop.vy * dt;
        circle.setAttribute("cx", String(drop.x));
        circle.setAttribute("cy", String(drop.y));
        circle.setAttribute(
          "r",
          String(Math.max(0, drop.size * (1 - drop.age / 1.8))),
        );
      }
      if (
        !input.current.dragging &&
        settling &&
        energy < (motion.matches ? 1 : 6) &&
        drops.length === 0
      ) {
        settling = false;
        setState("resting");
      }
      if (!motion.matches || energy > 0.1 || drops.length)
        frame = requestAnimationFrame(draw);
    }
    wake.current = () => {
      if (!input.current.dragging) settling = true;
      request();
    };
    grab.current = (x, y) => {
      grabLiquid(loops, x, y);
    };
    fling.current = (vx, vy) => {
      flingLiquid(
        loops,
        vx * (motion.matches ? 0.2 : 1),
        vy * (motion.matches ? 0.2 : 1),
      );
      settling = true;
      request();
    };
    spray.current = (x, y, vx, vy) => {
      if (
        motion.matches ||
        Math.hypot(vx, vy) < 450 ||
        performance.now() - lastDrop < 65
      )
        return;
      lastDrop = performance.now();
      if (drops.length >= 16) drops.shift();
      drops.push({
        x,
        y,
        vx: -vx * 0.16,
        vy: -vy * 0.16,
        homeX: input.current.anchorX,
        homeY: input.current.anchorY,
        age: 0,
        size: 9 + Math.min(14, Math.hypot(vx, vy) / 100),
      });
    };
    pulse.current = (dx, dy) => {
      pulseLiquid(
        loops,
        510,
        250,
        dx * (motion.matches ? 0.3 : 1),
        dy * (motion.matches ? 0.3 : 1),
      );
      settling = true;
      setState("settling");
      request();
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        input.current.active = false;
        input.current.dragging = false;
        settling = true;
      } else request();
    };
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", request);
    request();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", request);
      circles.forEach((circle) => circle.remove());
      wake.current = () => {};
      pulse.current = () => {};
      grab.current = () => {};
      fling.current = () => {};
      spray.current = () => {};
    };
  }, [id]);
  function position(event: PointerEvent<HTMLButtonElement>) {
    const box = svg.current!.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * 1000,
      y: ((event.clientY - box.top) / box.height) * 500,
    };
  }
  function release() {
    if (input.current.dragging) {
      input.current.dragging = false;
      input.current.active = false;
      const speed =
        performance.now() - previous.current.time < 100
          ? previous.current
          : { vx: 0, vy: 0 };
      fling.current(speed.vx, speed.vy);
      setState("settling");
      wake.current();
    }
  }
  return (
    <button
      type="button"
      className={styles.stage}
      data-liquid-state={state}
      aria-label="Liquid 404: grab and drag the ink. Pull far, flick, and release to let it flow back. Enter, Space or arrow keys send a wave."
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const p = position(event);
        if (
          typeof surface.current?.isPointInFill !== "function" ||
          typeof DOMPoint === "undefined" ||
          !surface.current.isPointInFill(new DOMPoint(p.x, p.y))
        )
          return;
        grab.current(p.x, p.y);
        input.current = {
          ...input.current,
          ...p,
          active: true,
          dragging: true,
          anchorX: p.x,
          anchorY: p.y,
        };
        previous.current = { ...p, time: performance.now(), vx: 0, vy: 0 };
        event.currentTarget.setPointerCapture(event.pointerId);
        setState("touching");
        wake.current();
      }}
      onPointerMove={(event) => {
        const p = position(event),
          now = performance.now(),
          last = previous.current,
          dt = Math.max(0.008, (now - last.time) / 1000);
        if (input.current.dragging) {
          const vx = (p.x - last.x) / dt,
            vy = (p.y - last.y) / dt;
          previous.current = {
            ...p,
            time: now,
            vx: last.vx * 0.35 + vx * 0.65,
            vy: last.vy * 0.35 + vy * 0.65,
          };
          spray.current(p.x, p.y, vx, vy);
        }
        Object.assign(input.current, p, { active: true });
        wake.current();
      }}
      onPointerUp={release}
      onPointerCancel={() => {
        previous.current.vx = previous.current.vy = 0;
        release();
      }}
      onLostPointerCapture={release}
      onPointerLeave={() => {
        if (!input.current.dragging) {
          input.current.active = false;
          wake.current();
        }
      }}
      onBlur={() => {
        input.current.dragging = false;
        input.current.active = false;
        setState("settling");
        wake.current();
      }}
      onClick={(event) => {
        if (event.detail === 0) pulse.current(0, -1);
      }}
      onKeyDown={(event) => {
        const directions: Record<string, [number, number]> = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        const d = directions[event.key];
        if (d) {
          event.preventDefault();
          pulse.current(...d);
        }
      }}
    >
      <span className={styles.invitation} aria-hidden="true">
        nothing
        <br />
        <em>stays.</em>
      </span>
      <span className={styles.note} aria-hidden="true">
        PULL IT OUT OF SHAPE.
        <br />
        IT KNOWS THE WAY BACK.
      </span>
      <svg
        ref={svg}
        className={styles.field}
        viewBox="0 0 1000 500"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${id}-body`} cx=".25" cy=".15" r=".95">
            <stop stopColor="#7b9fff" />
            <stop offset=".35" stopColor="#4057f2" />
            <stop offset="1" stopColor="#1723b8" />
          </radialGradient>
          <radialGradient
            ref={shine}
            id={`${id}-light`}
            gradientUnits="userSpaceOnUse"
            cx="350"
            cy="120"
            r="230"
          >
            <stop stopColor="#cfddff" stopOpacity=".45" />
            <stop offset="1" stopColor="#7791ff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}-clip`}>
            <path ref={clipping} d={STILL} clipRule="nonzero" />
          </clipPath>
          <filter
            id={`${id}-shadow`}
            x="-30%"
            y="-40%"
            width="180%"
            height="200%"
          >
            <feDropShadow
              dx="0"
              dy="18"
              stdDeviation="12"
              floodColor="#3233b0"
              floodOpacity=".15"
            />
          </filter>
        </defs>
        <path
          ref={surface}
          d={STILL}
          fill={`url(#${id}-body)`}
          fillRule="nonzero"
          filter={`url(#${id}-shadow)`}
        />
        <path
          ref={rim}
          d={STILL}
          fill="none"
          stroke="#bdceff"
          strokeWidth="1"
          strokeOpacity=".22"
        />
        <g clipPath={`url(#${id}-clip)`}>
          <path d="M0 0H1000V500H0Z" fill={`url(#${id}-light)`} />
        </g>
        <g ref={beads} data-liquid-drops />
      </svg>
      <span className={styles.caption} role="status" aria-live="polite">
        {state === "touching"
          ? "a little further."
          : state === "settling"
            ? "let it find itself."
            : "go on. get your hands messy."}
      </span>
    </button>
  );
}
