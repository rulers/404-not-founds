"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  aimFromDrag,
  clamp,
  createFlight,
  flightLayout,
  sampleFlight,
} from "@/lib/paper-plane404";
import type { FlightPlan } from "@/lib/paper-plane404";
import styles from "./PaperPlane404.module.css";

type Phase = "idle" | "aiming" | "flying" | "returned";
const restingAngle = -0.14;

export default function PaperPlane404() {
  const stageRef = useRef<HTMLElement>(null);
  const planeRef = useRef<HTMLButtonElement>(null);
  const readoutRef = useRef<HTMLOutputElement>(null);
  const uid = useId().replaceAll(":", "");
  const [view, setView] = useState<{
    phase: Phase;
    stamped: boolean;
    message: string;
  }>({
    phase: "idle",
    stamped: false,
    message: "紙飛行機をつかんで、飛ばしたい方向へ。",
  });
  useEffect(() => {
    const stage = stageRef.current,
      plane = planeRef.current,
      readout = readoutRef.current;
    if (!stage || !plane || !readout) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0,
      height = 0,
      angle = -0.6,
      power = 0.55;
    let phase: Phase = "idle",
      stamped = false;
    let pointer: {
      id: number;
      x: number;
      y: number;
      angle: number;
      power: number;
      valid: boolean;
    } | null = null;
    let plan: FlightPlan | null = null;
    let elapsed = 0,
      last: number | null = null,
      raf = 0,
      blurred = false,
      returning = false;
    let quietFlight = false;
    function notify(next: Phase, message: string) {
      phase = next;
      stage!.dataset.phase = next;
      stage!.dataset.stamped = String(stamped);
      plane!.setAttribute("aria-disabled", String(next === "flying"));
      setView({ phase: next, stamped, message });
    }
    function paint(x: number, y: number, heading: number, scale = 1) {
      plane!.style.setProperty("--fly-x", `${x}px`);
      plane!.style.setProperty("--fly-y", `${y}px`);
      plane!.style.setProperty("--heading", `${heading}rad`);
      plane!.style.setProperty("--flight-scale", String(scale));
      stage!.dataset.flightX = x.toFixed(2);
      stage!.dataset.flightY = y.toFixed(2);
    }
    function controls() {
      stage!.style.setProperty("--aim-angle", `${angle}rad`);
      stage!.style.setProperty(
        "--aim-length",
        `${48 + power * Math.min(120, width * 0.25)}px`,
      );
      const degrees = Math.round((angle * 180) / Math.PI);
      readout!.value = `方向 ${degrees}° ／ 強さ ${Math.round(power * 100)}%`;
      plane!.setAttribute(
        "aria-label",
        `紙飛行機を飛ばす。方向 ${degrees}度、強さ ${Math.round(power * 100)}パーセント${stamped ? "。返送された同じ紙飛行機" : ""}`,
      );
    }
    function releasePointer() {
      const old = pointer;
      pointer = null;
      if (old && plane!.hasPointerCapture(old.id))
        plane!.releasePointerCapture(old.id);
    }
    function cancelAim(message = "狙いを戻しました。もう一度、どうぞ。") {
      if (phase !== "aiming") return;
      if (pointer) {
        angle = pointer.angle;
        power = pointer.power;
      }
      releasePointer();
      controls();
      paint(
        0,
        0,
        restingAngle,
        stamped
          ? Math.min(3.5, (width * 1.12) / flightLayout(width, height).size)
          : 1,
      );
      notify(stamped ? "returned" : "idle", message);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      last = null;
    }
    function tick(now: number) {
      raf = 0;
      if (document.hidden || blurred || !plan) {
        last = null;
        return;
      }
      if (last !== null) elapsed += Math.min(50, Math.max(0, now - last));
      last = now;
      const duration = quietFlight ? 900 : plan.duration;
      const position = sampleFlight(plan, (elapsed / duration) * plan.duration);
      stage!.dataset.progress = position.progress.toFixed(3);
      if (!returning && position.progress > 0.72) {
        returning = true;
        notify("flying", "宛先が見つかりません。あなたのもとへ戻ります。");
      }
      paint(
        quietFlight ? 0 : position.x,
        quietFlight ? 0 : position.y,
        quietFlight ? restingAngle : position.angle,
        quietFlight
          ? 1 - 0.06 * Math.sin(position.progress * Math.PI)
          : position.scale,
      );
      if (position.done) {
        stop();
        plan = null;
        stamped = true;
        controls();
        notify(
          "returned",
          "宛先不明で返送されました。同じ紙飛行機を、もう一度飛ばせます。",
        );
        paint(
          0,
          0,
          restingAngle,
          Math.min(3.5, (width * 1.12) / flightLayout(width, height).size),
        );
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    function launch() {
      if (phase === "flying" || width <= 0 || height <= 0) return;
      releasePointer();
      stamped = false;
      returning = false;
      elapsed = 0;
      last = null;
      quietFlight = motion.matches;
      plan = createFlight(width, height, angle, power);
      stage!.dataset.launchAngle = angle.toFixed(4);
      stage!.dataset.launchPower = power.toFixed(3);
      stage!.dataset.progress = "0";
      controls();
      notify(
        "flying",
        "送り出しました。存在しない宛先を探して、滑空しています。",
      );
      paint(0, 0, quietFlight ? restingAngle : angle);
      if (!document.hidden && !blurred) raf = requestAnimationFrame(tick);
    }
    const down = (event: PointerEvent) => {
      if (
        phase === "flying" ||
        pointer ||
        !event.isPrimary ||
        event.button !== 0
      )
        return;
      pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        angle,
        power,
        valid: false,
      };
      plane.dataset.pointerInput = "true";
      plane.setPointerCapture(event.pointerId);
      plane.focus({ preventScroll: true });
      notify("aiming", "飛ばす方向へ引いて、離すと発射。Escapeでキャンセル。");
    };
    const move = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const aim = aimFromDrag(
        event.clientX - pointer.x,
        event.clientY - pointer.y,
        Math.min(180, width * 0.45),
      );
      pointer.valid = aim.valid;
      if (!aim.valid) return;
      angle = aim.angle;
      power = aim.power;
      controls();
      paint(
        0,
        0,
        angle,
        stamped
          ? Math.min(3.5, (width * 1.12) / flightLayout(width, height).size)
          : 1,
      );
    };
    const up = (event: PointerEvent) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      // A release can contain the last movement even when no move event was delivered.
      move(event);
      if (pointer.valid) launch();
      else cancelAim("もう少し引いてから離すと、紙飛行機が飛びます。");
    };
    const cancel = (event: PointerEvent) => {
      if (pointer?.id === event.pointerId) cancelAim();
    };
    const key = (event: KeyboardEvent) => {
      delete plane.dataset.pointerInput;
      if (event.key === "Escape") {
        cancelAim();
        return;
      }
      if (phase === "flying") {
        if (
          [
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Enter",
            " ",
          ].includes(event.key)
        )
          event.preventDefault();
        return;
      }
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      ) {
        event.preventDefault();
        releasePointer();
        if (event.key === "ArrowLeft") angle -= Math.PI / 18;
        if (event.key === "ArrowRight") angle += Math.PI / 18;
        angle = Math.atan2(Math.sin(angle), Math.cos(angle));
        if (event.key === "ArrowUp") power = clamp(power + 0.1, 0.12, 1);
        if (event.key === "ArrowDown") power = clamp(power - 0.1, 0.12, 1);
        controls();
        paint(
          0,
          0,
          angle,
          stamped
            ? Math.min(3.5, (width * 1.12) / flightLayout(width, height).size)
            : 1,
        );
        notify("aiming", "矢印キーで方向と強さを調整。EnterかSpaceで発射。");
      } else if (
        (event.key === "Enter" || event.key === " ") &&
        !event.repeat
      ) {
        event.preventDefault();
        launch();
      }
    };
    const click = (event: MouseEvent) => {
      if (event.detail === 0 && !pointer) launch();
    };
    const visibility = () => {
      if (document.hidden || blurred) {
        cancelAim();
        stop();
      } else if (phase === "flying" && !raf) {
        last = null;
        raf = requestAnimationFrame(tick);
      }
    };
    const blur = () => {
      blurred = true;
      visibility();
    };
    const focus = () => {
      blurred = false;
      visibility();
    };
    const blurPlane = () => {
      delete plane.dataset.pointerInput;
      cancelAim();
    };
    const resize = () => {
      const nextWidth = stage.clientWidth,
        nextHeight = stage.clientHeight;
      if (
        !nextWidth ||
        !nextHeight ||
        (nextWidth === width && nextHeight === height)
      )
        return;
      const wasActive = width > 0 && (phase === "flying" || phase === "aiming");
      stop();
      releasePointer();
      plan = null;
      width = nextWidth;
      height = nextHeight;
      stage.dataset.width = String(width);
      stage.dataset.height = String(height);
      const layout = flightLayout(width, height);
      stage.style.setProperty("--home-x", `${layout.home.x}px`);
      stage.style.setProperty("--home-y", `${layout.home.y}px`);
      stage.style.setProperty("--plane-size", `${layout.size}px`);
      controls();
      paint(
        0,
        0,
        restingAngle,
        stamped ? Math.min(3.5, (width * 1.12) / layout.size) : 1,
      );
      if (wasActive)
        notify(
          stamped ? "returned" : "idle",
          "画面サイズが変わったので、紙飛行機を手元へ戻しました。",
        );
    };
    const changeMotion = () => {
      if (phase === "flying" && motion.matches && !quietFlight) {
        quietFlight = true;
        elapsed = 0;
        last = null;
      }
    };
    resize();
    stage.dataset.ready = "true";
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    plane.addEventListener("pointerdown", down);
    plane.addEventListener("pointermove", move);
    plane.addEventListener("pointerup", up);
    plane.addEventListener("pointercancel", cancel);
    plane.addEventListener("lostpointercapture", cancel);
    plane.addEventListener("keydown", key);
    plane.addEventListener("click", click);
    plane.addEventListener("blur", blurPlane);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    motion.addEventListener("change", changeMotion);
    return () => {
      stop();
      releasePointer();
      observer.disconnect();
      plane.removeEventListener("pointerdown", down);
      plane.removeEventListener("pointermove", move);
      plane.removeEventListener("pointerup", up);
      plane.removeEventListener("pointercancel", cancel);
      plane.removeEventListener("lostpointercapture", cancel);
      plane.removeEventListener("keydown", key);
      plane.removeEventListener("click", click);
      plane.removeEventListener("blur", blurPlane);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      motion.removeEventListener("change", changeMotion);
    };
  }, []);
  return (
    <section
      ref={stageRef}
      className={styles.sky}
      data-phase={view.phase}
      data-stamped={view.stamped}
      aria-label="404 Paper Plane"
      lang="ja"
    >
      <div className={styles.cloudOne} aria-hidden="true" />
      <div className={styles.cloudTwo} aria-hidden="true" />
      <div className={styles.horizon} aria-hidden="true" />
      <div className={styles.poem} lang="en">
        <p>POSTMARK / NOWHERE</p>
        <h2>
          A letter
          <br />
          <em>to nowhere.</em>
        </h2>
        <span>Some things find their way back.</span>
      </div>
      <div className={styles.guide} aria-hidden="true">
        <span />
        <i />
      </div>
      <button
        ref={planeRef}
        className={styles.plane}
        aria-label="紙飛行機を飛ばす"
        aria-describedby={`${uid}-instructions`}
      >
        <svg viewBox="0 0 360 220" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-top`} x2=".7" y2="1">
              <stop stopColor="#fffefa" />
              <stop offset="1" stopColor="#dfe6e5" />
            </linearGradient>
            <linearGradient id={`${uid}-wing`} x2=".6" y2="1">
              <stop stopColor="#fffef6" />
              <stop offset=".7" stopColor="#f4f2e9" />
              <stop offset="1" stopColor="#bdced2" />
            </linearGradient>
          </defs>
          <path
            d="M20 35 340 110 35 195 110 115Z"
            fill={`url(#${uid}-top)`}
            stroke="#829da6"
            strokeOpacity=".4"
            strokeWidth="1.3"
          />
          <path d="M20 35 340 110 110 115Z" fill="#fffefa" />
          <path d="M35 195 340 110 110 115Z" fill={`url(#${uid}-wing)`} />
          <path
            d="M110 115 340 110 105 137Z"
            fill="#839da7"
            fillOpacity=".48"
          />
          <path d="M20 35 110 115 105 137Z" fill="#c8d7d9" />
          <path
            d="M110 115 340 110M35 195 110 115 20 35"
            fill="none"
            stroke="#91a8ad"
            strokeWidth="1.2"
            strokeOpacity=".6"
          />
          <path
            d="M35 42 318 108M44 185 317 115"
            fill="none"
            stroke="#fff"
            strokeWidth="1.6"
            opacity=".8"
          />
          <g
            className={styles.stamp}
            transform="translate(118 70) rotate(14)"
            data-stamp="true"
          >
            <rect
              x="0"
              y="0"
              width="130"
              height="38"
              rx="1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <rect
              x="3"
              y="3"
              width="124"
              height="32"
              rx="1"
              fill="none"
              stroke="currentColor"
              strokeWidth=".6"
              strokeDasharray="12 2 3 1"
            />
            <text
              x="8"
              y="24"
              fontSize="20"
              fontWeight="bold"
              fontFamily="Georgia,serif"
              fill="currentColor"
            >
              404
            </text>
            <text
              x="47"
              y="13"
              fontSize="9"
              fontFamily="monospace"
              fill="currentColor"
            >
              DESTINATION
            </text>
            <text
              x="47"
              y="24"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
              fill="currentColor"
            >
              NOT FOUND
            </text>
            <text
              x="65"
              y="33"
              textAnchor="middle"
              fontSize="7.5"
              letterSpacing=".1"
              fontFamily="monospace"
              fill="currentColor"
            >
              RETURNED TO SENDER
            </text>
          </g>
          <path
            className={styles.focusContour}
            d="M20 35 340 110 35 195 110 115Z"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </button>
      <div className={styles.departure} aria-hidden="true">
        <span>×</span>
        <p>FROM / YOU</p>
      </div>
      <div className={styles.controls}>
        <output ref={readoutRef} aria-live="off">
          方向 −34° ／ 強さ 55%
        </output>
        <p id={`${uid}-instructions`}>
          ドラッグした方向へ発射 ／ 矢印キーで調整、Enterで飛ばす
        </p>
        <p className={styles.status} role="status">
          {view.message}
        </p>
      </div>
      <noscript>
        <p className={styles.noScript}>飛ばす操作にはJavaScriptが必要です。</p>
      </noscript>
    </section>
  );
}
