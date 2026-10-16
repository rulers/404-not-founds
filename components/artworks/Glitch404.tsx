"use client";

import { useEffect, useRef, type PointerEvent } from "react";

export default function Glitch404() {
  const root = useRef<HTMLButtonElement>(null);
  const frame = useRef<number>(0);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const point = useRef({ x: 50, y: 50, intensity: 0 });

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      if (burstTimer.current) clearTimeout(burstTimer.current);
    },
    [],
  );

  function move(event: PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    const distance = Math.hypot((x - 50) / 1.4, y - 50);
    point.current = { x, y, intensity: Math.max(0, 1 - distance / 55) };
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const node = root.current;
      if (!node) return;
      node.style.setProperty("--x", `${point.current.x}%`);
      node.style.setProperty("--y", `${point.current.y}%`);
      node.style.setProperty(
        "--split",
        `${2 + point.current.intensity * 12}px`,
      );
      node.style.setProperty("--interference", `${point.current.intensity}`);
    });
  }

  function burst() {
    const node = root.current;
    if (!node) return;
    if (burstTimer.current) clearTimeout(burstTimer.current);
    node.dataset.burst = "false";
    void node.offsetWidth; // Restart the brief CSS burst even on repeated taps.
    node.dataset.burst = "true";
    burstTimer.current = setTimeout(() => {
      if (root.current) root.current.dataset.burst = "false";
    }, 620);
  }

  return (
    <button
      ref={root}
      className="glitch-stage"
      aria-label="Glitch 404: move your pointer to distort the signal, or click, tap, or press Enter to disrupt it"
      onPointerMove={move}
      onPointerDown={move}
      onPointerLeave={() => {
        cancelAnimationFrame(frame.current);
        root.current?.style.setProperty("--split", "2px");
        root.current?.style.setProperty("--interference", "0");
      }}
      onClick={burst}
    >
      <span className="stage-corner corner-tl" aria-hidden="true" />
      <span className="stage-corner corner-tr" aria-hidden="true" />
      <span className="signal-coordinate" aria-hidden="true">
        ERR_CONNECTION_LOST
      </span>
      <span className="glitch-number" aria-hidden="true">
        <span className="number-base">404</span>
        <span className="channel channel-red">404</span>
        <span className="channel channel-cyan">404</span>
        <span className="slice slice-one">404</span>
        <span className="slice slice-two">404</span>
        <span className="slice slice-three">404</span>
      </span>
      <span className="scanlines" aria-hidden="true" />
      <span className="noise" aria-hidden="true" />
      <span className="impact" aria-hidden="true" />
      <span className="signal-caption" aria-hidden="true">
        <span /> SIGNAL UNSTABLE <i>—</i> NOTHING TO SEE HERE
      </span>
      <span className="stage-corner corner-bl" aria-hidden="true" />
      <span className="stage-corner corner-br" aria-hidden="true" />
    </button>
  );
}
