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
  for (const brick of game.bricks) {
    if (brick.alive) ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
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
  const permissionAttempted = useRef(false);
  const receivedTilt = useRef(false);
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
      const value =
        angle === 90
          ? -(event.beta ?? 0)
          : angle === 270 || angle === -90
            ? (event.beta ?? 0)
            : (event.gamma ?? 0) * (angle === 180 ? -1 : 1);
      if (event.gamma === null || !Number.isFinite(value)) return;
      receivedTilt.current = true;
      aimPaddle(
        game.current,
        BOARD_WIDTH / 2 +
          ((Math.max(-30, Math.min(30, value)) / 30) * BOARD_WIDTH) / 2,
      );
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
        advanceGame(current, dt);
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
    control.current = value;
    setInput(value);
  }

  async function activate() {
    if (!game.current || requesting) return;
    if (game.current.phase === "won") {
      game.current = createGame(game.current.height);
      setRemaining(game.current.remaining);
    }
    if (game.current.phase !== "ready") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse && !permissionAttempted.current) {
      permissionAttempted.current = true;
      if (typeof DeviceOrientationEvent !== "undefined") {
        try {
          setRequesting(true);
          const sensor = DeviceOrientationEvent as PermissionEvent;
          // iOSの権限要求はタップのハンドラーから直接呼ぶ。
          const permission = sensor.requestPermission
            ? await sensor.requestPermission()
            : "granted";
          if (!mounted.current) return;
          if (permission === "granted") {
            setControl("tilt");
            receivedTilt.current = false;
            tiltTimeout.current = setTimeout(() => {
              if (mounted.current && !receivedTilt.current) setControl("touch");
            }, 1500);
          } else setControl("touch");
        } catch {
          if (mounted.current) setControl("touch");
        } finally {
          if (mounted.current) setRequesting(false);
        }
      } else setControl("touch");
    }
    if (!mounted.current || !game.current) return;
    launchBall(game.current);
    setPhase(game.current.phase);
  }

  function point(event: PointerEvent<HTMLButtonElement>) {
    if (!game.current || !canvas.current) return;
    if (
      event.pointerType === "touch" &&
      event.type === "pointermove" &&
      control.current !== "touch"
    )
      setControl("touch");
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
                {requesting
                  ? "WAITING FOR MOTION PERMISSION"
                  : "TAP / CLICK TO LAUNCH"}
              </span>
              <small>BREAK THE SIGNAL. FIND THE VOID.</small>
            </>
          ) : null}
        </span>
      </button>
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
