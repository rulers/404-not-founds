"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import {
  createLiquid,
  liquidPath,
  pulseLiquid,
  stepLiquid,
  type LiquidInput,
} from "@/lib/liquid404";
import styles from "./Liquid404.module.css";

const STILL = liquidPath(createLiquid());
export default function Liquid404() {
  const id = useId().replaceAll(":", "");
  const svg = useRef<SVGSVGElement>(null),
    surface = useRef<SVGPathElement>(null),
    rim = useRef<SVGPathElement>(null),
    clipping = useRef<SVGPathElement>(null),
    shine = useRef<SVGRadialGradientElement>(null);
  const input = useRef<LiquidInput>({
    x: -1000,
    y: -1000,
    active: false,
    dragging: false,
    anchorX: 0,
    anchorY: 0,
  });
  const wake = useRef<() => void>(() => {}),
    pulse = useRef<(dx: number, dy: number) => void>(() => {});
  const [state, setState] = useState("resting");
  useEffect(() => {
    const bodyElement = surface.current;
    const rimElement = rim.current;
    const clipElement = clipping.current;
    const lightElement = shine.current;
    if (!bodyElement || !rimElement || !clipElement || !lightElement) return;
    const loops = createLiquid(),
      motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      last = 0,
      clock = 0,
      tickCount = 0,
      settling = false;
    const draw = (now: number) => {
      frame = 0;
      if (document.hidden || !bodyElement.isConnected) return;
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
      // SVGの更新は通常約30fps。物理と入力処理をReactの描画から分離する。
      if (++tickCount % 2 === 0 || motion.matches || input.current.dragging) {
        const d = liquidPath(loops);
        bodyElement.setAttribute("d", d);
        rimElement.setAttribute("d", d);
        clipElement.setAttribute("d", d);
        lightElement.setAttribute(
          "cx",
          String(input.current.active ? input.current.x : 390),
        );
        lightElement.setAttribute(
          "cy",
          String(input.current.active ? input.current.y : 160),
        );
      }
      if (
        !input.current.dragging &&
        settling &&
        energy < (motion.matches ? 1 : 6)
      ) {
        settling = false;
        setState("resting");
      }
      if (!motion.matches || energy > 0.1) frame = requestAnimationFrame(draw);
    };
    const request = () => {
      if (!frame && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    };
    wake.current = () => {
      if (!input.current.dragging) settling = true;
      request();
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
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", request);
      wake.current = () => {};
      pulse.current = () => {};
    };
  }, []);
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
      setState("settling");
      wake.current();
    }
  }
  return (
    <button
      type="button"
      className={styles.stage}
      data-liquid-state={state}
      aria-label="Liquid 404: move near the surface, drag to stretch, release to restore. Enter, Space or arrow keys send a wave."
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const p = position(event);
        if (
          typeof surface.current?.isPointInFill !== "function" ||
          typeof DOMPoint === "undefined" ||
          !surface.current.isPointInFill(new DOMPoint(p.x, p.y))
        )
          return;
        input.current = {
          ...input.current,
          ...p,
          active: true,
          dragging: true,
          anchorX: p.x,
          anchorY: p.y,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setState("touching");
        wake.current();
      }}
      onPointerMove={(event) => {
        const p = position(event);
        Object.assign(input.current, p, { active: true });
        wake.current();
      }}
      onPointerUp={release}
      onPointerCancel={release}
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
        const direction = directions[event.key];
        if (direction) {
          event.preventDefault();
          pulse.current(...direction);
        }
      }}
    >
      <span className={styles.kicker} aria-hidden="true">
        MATERIAL STUDY / 004 <span>NO FIXED FORM.</span>
      </span>
      <svg
        ref={svg}
        className={styles.field}
        viewBox="0 0 1000 500"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2=".15" y2="1">
            <stop stopColor="#314f58" />
            <stop offset=".12" stopColor="#b3d8d9" />
            <stop offset=".28" stopColor="#314f5b" />
            <stop offset=".42" stopColor="#ecfff6" />
            <stop offset=".49" stopColor="#badfdf" />
            <stop offset=".55" stopColor="#547778" />
            <stop offset=".72" stopColor="#112b35" />
            <stop offset=".87" stopColor="#93bec1" />
            <stop offset="1" stopColor="#263d48" />
          </linearGradient>
          <linearGradient id={`${id}-edge`} x2="1" y2="1">
            <stop stopColor="#ecfff6" />
            <stop offset=".45" stopColor="#527c85" />
            <stop offset=".8" stopColor="#bfded0" />
            <stop offset="1" stopColor="#668091" />
          </linearGradient>
          <radialGradient
            ref={shine}
            id={`${id}-light`}
            gradientUnits="userSpaceOnUse"
            cx="390"
            cy="160"
            r="250"
          >
            <stop stopColor="#eefff8" stopOpacity=".5" />
            <stop offset="1" stopColor="#c2e8e9" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}-clip`}>
            <path ref={clipping} d={STILL} clipRule="evenodd" />
          </clipPath>
          <filter
            id={`${id}-shadow`}
            x="-20%"
            y="-30%"
            width="140%"
            height="170%"
          >
            <feDropShadow
              dx="0"
              dy="18"
              stdDeviation="15"
              floodColor="#000"
              floodOpacity=".65"
            />
          </filter>
        </defs>
        <path
          ref={surface}
          d={STILL}
          fill={`url(#${id}-body)`}
          fillRule="evenodd"
          stroke={`url(#${id}-edge)`}
          strokeWidth="2"
          filter={`url(#${id}-shadow)`}
        />
        <path
          ref={rim}
          d={STILL}
          fill="none"
          stroke="#e9fff3"
          strokeWidth=".7"
          strokeOpacity=".5"
        />
        <g clipPath={`url(#${id}-clip)`}>
          <path d="M0 0H1000V500H0Z" fill={`url(#${id}-light)`} />
          <path
            d="M40 198Q500 60 970 175"
            fill="none"
            stroke="#effff2"
            strokeWidth="3"
            opacity=".28"
          />
        </g>
      </svg>
      <span className={styles.caption} role="status" aria-live="polite">
        {state === "touching"
          ? "STAY A LITTLE LONGER."
          : state === "settling"
            ? "FINDING ITS WAY BACK."
            : "NOTHING HOLDS ITS SHAPE."}
        <span>MOVE CLOSER. PULL GENTLY. LET GO.</span>
      </span>
    </button>
  );
}
