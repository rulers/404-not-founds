"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  BOARD_WIDTH,
  advanceGame,
  aimPaddle,
  createGame,
  launchBall,
  parkBall,
  type Game,
} from "@/lib/break404";
import { tiltAngle, tiltTarget, TILT_TIMEOUT } from "@/lib/break404Tilt";
import styles from "./Break404.module.css";

type Control = "pointer" | "tilt" | "touch";
type PermissionEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function draw(
  ctx: CanvasRenderingContext2D,
  game: Game,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.scale(width / BOARD_WIDTH, height / game.height);
  ctx.fillStyle = "#efefec";
  for (const particle of game.particles) {
    ctx.globalAlpha = particle.life / 0.28;
    ctx.fillRect(particle.x, particle.y, 3, 3);
  }
  ctx.globalAlpha = 1;
  for (const brick of game.bricks) {
    if (brick.alive)
      ctx.fillRect(
        brick.x + (game.glitch > 0 ? Math.sin(brick.y * 4) * 2 : 0),
        brick.y,
        brick.width,
        brick.height,
      );
  }
  const { ball, paddle } = game;
  ctx.fillStyle = "#d5ff70";
  ctx.shadowColor = "#c5ff59";
  ctx.shadowBlur = 22;
  ctx.fillRect(
    paddle.x - paddle.width / 2,
    paddle.y,
    paddle.width,
    paddle.height,
  );
  if (game.phase !== "won") {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export default function Break404() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game | null>(null);
  const mounted = useRef(false);
  const control = useRef<Control>("pointer");
  const baseline = useRef<number | null>(null);
  const latestAngle = useRef<number | null>(null);
  const rotation = useRef<number | null>(null);
  const lastTilt = useRef(0);
  const requestId = useRef(0);
  const tiltTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keys = useRef({ left: false, right: false });
  const [phase, setPhase] = useState<Game["phase"]>("ready");
  const [input, setInput] = useState<Control>("pointer");
  const [requesting, setRequesting] = useState(false);
  const [remaining, setRemaining] = useState(() => createGame(800).remaining);

  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext("2d");
    if (!element || !ctx) return;
    mounted.current = true;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;
    let priorPhase: Game["phase"] = "ready";
    let priorRemaining = createGame(800).remaining;
    const resize = () => {
      const bounds = element.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(bounds.width * ratio);
      element.height = Math.round(bounds.height * ratio);
      // 画面の回転時は新しい比率で盤面を組み直す。
      game.current = createGame((BOARD_WIDTH * bounds.height) / bounds.width);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const orientation = (event: DeviceOrientationEvent) => {
      if (control.current !== "tilt" || !game.current) return;
      const angle =
        screen.orientation?.angle ??
        (window as Window & { orientation?: number }).orientation ??
        0;
      const value = tiltAngle(event.beta, event.gamma, angle);
      if (value === null) return;
      if (rotation.current !== angle) baseline.current = null;
      rotation.current = angle;
      latestAngle.current = value;
      lastTilt.current = performance.now();
      baseline.current ??= value;
      aimPaddle(game.current, tiltTarget(value, baseline.current));
    };
    const visibility = () => {
      keys.current = { left: false, right: false };
      if (document.hidden && game.current?.phase === "playing")
        parkBall(game.current);
      last = 0;
    };
    const tick = (time: number) => {
      const current = game.current;
      if (current && !document.hidden) {
        const dt = last ? (time - last) / 1000 : 0;
        if (keys.current.left || keys.current.right) {
          aimPaddle(
            current,
            current.paddle.target +
              (Number(keys.current.right) - Number(keys.current.left)) *
                Math.min(dt, 1 / 30) *
                950,
          );
        }
        if (
          control.current === "tilt" &&
          performance.now() - lastTilt.current > TILT_TIMEOUT
        )
          setControl("touch");
        advanceGame(current, dt, motion.matches);
        if (current.phase !== priorPhase) {
          priorPhase = current.phase;
          setPhase(current.phase);
        }
        if (current.remaining !== priorRemaining) {
          priorRemaining = current.remaining;
          setRemaining(current.remaining);
        }
        draw(ctx, current, element.width, element.height);
      }
      last = time;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("deviceorientation", orientation);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("deviceorientation", orientation);
      document.removeEventListener("visibilitychange", visibility);
      if (tiltTimeout.current) clearTimeout(tiltTimeout.current);
    };
  }, []);

  function setControl(value: Control) {
    if (value !== "tilt") {
      requestId.current++;
      if (tiltTimeout.current) clearTimeout(tiltTimeout.current);
      setRequesting(false);
    }
    control.current = value;
    setInput(value);
  }

  function activate() {
    if (!game.current) return;
    if (game.current.phase === "won") {
      game.current = createGame(game.current.height);
      setRemaining(game.current.remaining);
    }
    if (game.current.phase !== "ready") return;
    if (!mounted.current || !game.current) return;
    launchBall(game.current);
    setPhase(game.current.phase);
  }

  async function enableTilt() {
    if (requesting) return;
    const id = ++requestId.current;
    if (typeof DeviceOrientationEvent === "undefined") {
      setControl("touch");
      return;
    }
    setRequesting(true);
    // A hung permission dialog must not prevent the game from launching.
    tiltTimeout.current = setTimeout(() => {
      if (mounted.current && id === requestId.current) {
        requestId.current++;
        setRequesting(false);
        setControl("touch");
      }
    }, 10000);
    try {
      const sensor = DeviceOrientationEvent as PermissionEvent;
      const permission = sensor.requestPermission
        ? await sensor.requestPermission()
        : "granted";
      if (!mounted.current || id !== requestId.current) return;
      if (permission === "granted") {
        baseline.current = null;
        latestAngle.current = null;
        lastTilt.current = performance.now();
        setControl("tilt");
      } else setControl("touch");
    } catch {
      if (mounted.current && id === requestId.current) setControl("touch");
    } finally {
      if (mounted.current && id === requestId.current) {
        if (tiltTimeout.current) clearTimeout(tiltTimeout.current);
        setRequesting(false);
      }
    }
  }

  function point(event: PointerEvent<HTMLButtonElement>) {
    if (!game.current || !canvas.current) return;
    if (
      event.pointerType === "touch" &&
      event.type === "pointermove" &&
      control.current !== "touch"
    )
      setControl("touch");
    if (event.pointerType === "touch" && event.type === "pointerdown")
      event.currentTarget.setPointerCapture(event.pointerId);
    if (control.current === "tilt") return;
    const bounds = canvas.current.getBoundingClientRect();
    aimPaddle(
      game.current,
      ((event.clientX - bounds.left) / bounds.width) * BOARD_WIDTH,
    );
  }

  return (
    <div className={styles.artwork} data-phase={phase} data-control={input}>
      <button
        type="button"
        className={styles.playfield}
        onClick={activate}
        onPointerMove={point}
        onPointerDown={point}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setControl("pointer");
            keys.current[event.key === "ArrowLeft" ? "left" : "right"] = true;
          }
        }}
        onKeyUp={(event) => {
          if (event.key === "ArrowLeft") keys.current.left = false;
          if (event.key === "ArrowRight") keys.current.right = false;
        }}
        onBlur={() => {
          keys.current = { left: false, right: false };
        }}
        aria-label="Break the 404 game. Move the mouse, drag, tilt, or use arrow keys to move. Tap, click, Enter or Space to launch."
      >
        <canvas className={styles.canvas} ref={canvas} aria-hidden="true" />
        <span className={styles.message} aria-live="polite" role="status">
          {phase === "won" ? (
            <>
              <strong>NOT FOUND</strong>
              <span>YOU FOUND NOTHING.</span>
              <small>TAP / CLICK TO REBUILD</small>
            </>
          ) : phase === "ready" ? (
            <>
              <span>
                {requesting ? "WAITING FOR MOTION PERMISSION" : "TAP TO LAUNCH"}
              </span>
              <small>BREAK THE SIGNAL. FIND THE VOID.</small>
            </>
          ) : null}
        </span>
      </button>
      <div className={styles.controls}>
        {input === "tilt" ? (
          <button
            type="button"
            onClick={() => {
              baseline.current = latestAngle.current;
              if (game.current) aimPaddle(game.current, 500);
            }}
          >
            CALIBRATE
          </button>
        ) : (
          <button type="button" disabled={requesting} onClick={enableTilt}>
            {requesting ? "ENABLING TILT…" : "ENABLE TILT"}
          </button>
        )}
      </div>
      <div className={styles.identity}>
        <span>DAY 002 /</span>
        <h1>BREAK THE 404</h1>
      </div>
      <p className={styles.counter} aria-live="off">
        {String(remaining).padStart(3, "0")} BLOCKS TO NOTHING
      </p>
      <div className={styles.bottom}>
        <p className={styles.instructions}>
          {input === "tilt" ? (
            "TILT TO MOVE / TAP TO LAUNCH"
          ) : input === "touch" ? (
            "DRAG TO MOVE / TAP TO LAUNCH"
          ) : (
            <>
              <span className={styles.desktop}>
                MOUSE OR ← → TO MOVE / CLICK OR SPACE TO LAUNCH
              </span>
              <span className={styles.mobile}>
                TILT OR DRAG TO MOVE / TAP TO LAUNCH
              </span>
            </>
          )}
        </p>
        <p className={styles.copy}>EVERYTHING DISAPPEARS.</p>
      </div>
    </div>
  );
}
