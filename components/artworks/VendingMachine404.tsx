"use client";

import { useEffect, useId, useReducer, useRef } from "react";
import {
  initialVend,
  phaseDuration,
  products,
  vendTransition,
} from "@/lib/vending-machine404";
import type { ProductId } from "@/lib/vending-machine404";
import styles from "./VendingMachine404.module.css";

function Product({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 140 150" aria-hidden="true" className={styles.productArt}>
      {kind === "box" && (
        <g className={styles.parcel}>
          <path d="M20 62 70 45 122 62 70 83Z" fill="#9c704c" />
          <path
            data-part="lid"
            className={styles.lid}
            d="M20 62 70 45 122 62 70 83Z"
            fill="#e8c599"
            stroke="#b78b60"
            strokeWidth="2"
          />
          <path
            className={styles.openLid}
            d="M20 62 70 45 70 3 20 20Z"
            fill="#e8c599"
            stroke="#b78b60"
            strokeWidth="2"
          />
          <path d="M20 62 70 83V137L20 114Z" fill="#c69b6d" stroke="#b08256" />
          <path d="M70 83 122 62V115L70 137Z" fill="#ddba8e" stroke="#b08256" />
          <path d="M40 73 89 56 102 60 52 78V128L40 122Z" fill="#cb573e" />
          <path
            d="M28 62 45 55 57 70 70 61 87 72 111 61"
            fill="none"
            stroke="#fff3d8"
            strokeWidth="6"
            className={styles.tissue}
          />
          <text
            x="86"
            y="104"
            fontSize="6"
            fill="#5a3d2a"
            transform="rotate(-21 86 104)"
          >
            MISSING PAGE
          </text>
          <text
            x="69"
            y="65"
            textAnchor="middle"
            fill="#f5e3c4"
            fontSize="6"
            className={styles.emptyLabel}
          >
            NOTHING.
          </text>
        </g>
      )}
      {kind === "chain" && (
        <g>
          <g className={styles.wrapper}>
            <path
              d="M28 23H112V132H28Z"
              fill="#f2d3a0"
              fillOpacity=".3"
              stroke="#fce2b1"
              strokeWidth="2"
            />
            <path d="M28 33H112M28 120H112" stroke="#d8ba82" strokeWidth="4" />
            <text
              x="70"
              y="128"
              textAnchor="middle"
              fontSize="6"
              fill="#72512f"
            >
              EXPIRED LINK
            </text>
          </g>
          <g fill="none" stroke="#604429" strokeWidth="9" strokeLinecap="round">
            <g className={styles.chainLeft}>
              <ellipse
                cx="47"
                cy="58"
                rx="12"
                ry="20"
                transform="rotate(30 47 58)"
              />
              <ellipse
                cx="59"
                cy="82"
                rx="9"
                ry="17"
                transform="rotate(-15 59 82)"
              />
            </g>
            <g className={styles.chainRight}>
              <ellipse
                cx="94"
                cy="105"
                rx="12"
                ry="19"
                transform="rotate(30 94 105)"
              />
              <ellipse
                cx="82"
                cy="84"
                rx="9"
                ry="17"
                transform="rotate(-15 82 84)"
              />
            </g>
            <path
              data-part="bridge"
              className={styles.bridge}
              d="M60 83Q51 67 63 61Q77 55 84 76Q91 94 78 100Q65 106 60 83"
            />
          </g>
          <g fill="none" stroke="#e6c382" strokeWidth="4" strokeLinecap="round">
            <g className={styles.chainLeft}>
              <ellipse
                cx="47"
                cy="58"
                rx="12"
                ry="20"
                transform="rotate(30 47 58)"
              />
              <ellipse
                cx="59"
                cy="82"
                rx="9"
                ry="17"
                transform="rotate(-15 59 82)"
              />
            </g>
            <g className={styles.chainRight}>
              <ellipse
                cx="94"
                cy="105"
                rx="12"
                ry="19"
                transform="rotate(30 94 105)"
              />
              <ellipse
                cx="82"
                cy="84"
                rx="9"
                ry="17"
                transform="rotate(-15 82 84)"
              />
            </g>
            <path
              data-part="bridge"
              className={styles.bridge}
              d="M60 83Q51 67 63 61Q77 55 84 76Q91 94 78 100Q65 106 60 83"
            />
            <path
              data-part="broken-link"
              className={styles.brokenLink}
              d="M66 67Q48 68 59 91Q65 105 77 98M82 90 89 76 80 63"
            />
          </g>
          <path
            className={styles.snap}
            d="M61 47 56 37M78 45 81 34M95 54 104 46"
            fill="none"
            stroke="#fff0b8"
            strokeWidth="3"
          />
        </g>
      )}
      {kind === "image" && (
        <g>
          <g data-part="photo-card" className={styles.photoCard}>
            <path
              d="M32 43H108V119H32Z M40 52V100H100V52Z"
              fill="#fff0cc"
              fillRule="evenodd"
              stroke="#c8b79a"
            />
            <g
              className={styles.missingImage}
              fill="none"
              stroke="#658278"
              strokeWidth="2"
            >
              <path d="M57 64H80V87H57Z M57 84 64 75 70 81 75 75 80 82M70 64 67 70 72 73 68 78" />
              <circle cx="75" cy="69" r="2" />
            </g>
          </g>
          <g className={styles.sleeve}>
            <path
              d="M23 52H117V134H23Z"
              fill="#d47758"
              stroke="#aa553b"
              strokeWidth="2"
            />
            <path d="M23 52 70 91 117 52" fill="#eea27d" stroke="#c77b56" />
            <path
              d="M23 134 61 97M117 134 79 97"
              fill="none"
              stroke="#b86246"
            />
            <rect x="54" y="90" width="32" height="27" fill="#f8deb4" />
            <path
              d="M57 112 65 102 71 108 77 100 83 110"
              fill="none"
              stroke="#d07e59"
              strokeWidth="2"
            />
            <circle cx="63" cy="97" r="3" fill="#d07e59" />
          </g>
        </g>
      )}
      {kind === "can" && (
        <g data-part="mystery" className={styles.mystery}>
          <ellipse
            cx="70"
            cy="132"
            rx="27"
            ry="5"
            fill="#253e45"
            opacity=".15"
          />
          <path
            d="M47 36 53 26H87L94 36V124Q70 137 47 124Z"
            fill="#357787"
            stroke="#21515e"
            strokeWidth="2"
          />
          <path d="M53 41V119" stroke="#b7d6ce" strokeWidth="7" opacity=".45" />
          <path d="M83 40V121" stroke="#204d5d" strokeWidth="8" opacity=".45" />
          <ellipse
            cx="70"
            cy="29"
            rx="18"
            ry="5"
            fill="#c3c5b3"
            stroke="#687e7a"
          />
          <ellipse cx="70" cy="29" rx="7" ry="2" fill="none" stroke="#5c7471" />
          <text
            x="71"
            y="88"
            textAnchor="middle"
            fontFamily="Georgia,serif"
            fontWeight="bold"
            fontSize="43"
            fill="#f7e8bd"
          >
            ?
          </text>
          <text
            x="70"
            y="109"
            textAnchor="middle"
            fontSize="6"
            letterSpacing="1"
            fill="#e7dfbd"
          >
            MYSTERY
          </text>
        </g>
      )}
    </svg>
  );
}

function focusControl(control: HTMLButtonElement | null | undefined) {
  control?.focus({ preventScroll: true });
  control?.scrollIntoView({
    block: "nearest",
    inline: "nearest",
    behavior: "instant",
  });
}

export default function VendingMachine404() {
  const [state, dispatch] = useReducer(vendTransition, initialVend);
  const uid = useId().replaceAll(":", "");
  const selected = products.find((p) => p.id === state.product);
  const selectRefs = useRef<
    Partial<Record<ProductId, HTMLButtonElement | null>>
  >({});
  const collectRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const againRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const returnFocus = useRef<ProductId | null>(null);
  const phase = state.phase;
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.dataset.ready = "true";
    const visibility = () => {
      stage.dataset.paused = String(document.hidden);
    };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  const taken = ["collect", "inspect", "reveal", "result"].includes(phase);
  useEffect(() => {
    const duration = phaseDuration[phase];
    if (duration === undefined) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let remaining = motion.matches ? 120 : duration;
    let started = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pause = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
        remaining = Math.max(0, remaining - (performance.now() - started));
      }
    };
    const resume = () => {
      if (timer === undefined && !document.hidden) {
        started = performance.now();
        timer = setTimeout(() => dispatch({ type: "advance" }), remaining);
      }
    };
    const visibility = () => (document.hidden ? pause() : resume());
    resume();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      pause();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [phase]);
  useEffect(() => {
    if (phase === "idle" && returnFocus.current) {
      focusControl(selectRefs.current[returnFocus.current]);
      returnFocus.current = null;
    }
    if (phase === "ready") focusControl(collectRef.current);
    if (phase === "inspect") focusControl(openRef.current);
    if (phase === "result") focusControl(againRef.current);
  }, [phase]);
  function reset() {
    returnFocus.current = state.product;
    dispatch({ type: "reset" });
  }
  const status =
    phase === "idle"
      ? "ひとつ、選んでみて。"
      : phase === "coil"
        ? "コイルが回っています…"
        : phase === "drop"
          ? "もうすぐ、届きます。"
          : phase === "ready"
            ? "届きました。フラップを押して取り出す。"
            : phase === "collect"
              ? "あなたのものです。たぶん。"
              : phase === "inspect"
                ? "手元に届きました。開けてみて。"
                : phase === "reveal"
                  ? "あれ？"
                  : selected?.result;
  return (
    <section
      ref={stageRef}
      className={styles.stage}
      lang="ja"
      aria-label="404 Vending Machine"
      data-phase={phase}
      data-product={state.product ?? "none"}
      onKeyDown={(e) => {
        if (e.key === "Escape" && taken) reset();
      }}
    >
      <div className={styles.wallCaption} aria-hidden="true">
        <span>OPEN 24 HOURS</span>
        <span>STOCK: QUESTIONABLE</span>
      </div>
      <div className={styles.composition}>
        <div className={styles.machine}>
          <svg
            viewBox="0 0 480 720"
            className={styles.cabinet}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`${uid}red`} x2="1" y2=".4">
                <stop stopColor="#ee7752" />
                <stop offset=".12" stopColor="#d5513e" />
                <stop offset=".8" stopColor="#bf3d31" />
                <stop offset="1" stopColor="#9d3229" />
              </linearGradient>
              <linearGradient id={`${uid}mint`} x2="1" y2="1">
                <stop stopColor="#c5d8b2" />
                <stop offset=".45" stopColor="#80a58f" />
                <stop offset="1" stopColor="#406f60" />
              </linearGradient>
              <linearGradient id={`${uid}well`} x2="0" y2="1">
                <stop stopColor="#634128" />
                <stop offset=".28" stopColor="#d49c48" />
                <stop offset="1" stopColor="#654021" />
              </linearGradient>
              <linearGradient id={`${uid}sign`} x2="0" y2="1">
                <stop stopColor="#fff4cf" />
                <stop offset=".7" stopColor="#f7d69b" />
                <stop offset="1" stopColor="#d7a76c" />
              </linearGradient>
              <linearGradient id={`${uid}side`} x2="1" y2="0">
                <stop stopColor="#99332b" />
                <stop offset=".7" stopColor="#af4432" />
                <stop offset="1" stopColor="#79332c" />
              </linearGradient>
              <radialGradient id={`${uid}glow`}>
                <stop stopColor="#ffdc83" stopOpacity=".55" />
                <stop offset="1" stopColor="#ffdc83" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse
              cx="256"
              cy="687"
              rx="207"
              ry="21"
              fill="#533a26"
              opacity=".17"
            />
            <path
              d="M84 648v36q12 12 29 0v-36M345 648v36q12 12 29 0v-36"
              fill="#3b3b30"
            />
            <path
              d="M385 34 445 69Q458 76 457 97V626Q457 645 437 651L385 674Z"
              fill={`url(#${uid}side)`}
              stroke="#883d2d"
              strokeWidth="2"
            />
            <path
              d="M406 147v205m9-198v205m9-198v205"
              stroke="#6c3029"
              strokeWidth="4"
              strokeDasharray="15 9"
            />
            <path
              d="M414 476v75m10-70v75"
              stroke="#6c3029"
              strokeWidth="3"
              strokeDasharray="10 6"
            />
            <rect
              x="42"
              y="24"
              width="360"
              height="647"
              rx="35"
              fill={`url(#${uid}mint)`}
              stroke="#4f7865"
              strokeWidth="3"
            />
            <rect
              x="51"
              y="32"
              width="342"
              height="630"
              rx="28"
              fill={`url(#${uid}red)`}
              stroke="#f0bb83"
              strokeWidth="2"
            />
            <path
              d="M60 62Q60 40 83 40H365"
              fill="none"
              stroke="#ffb383"
              strokeWidth="3"
              opacity=".7"
            />
            <rect
              x="69"
              y="51"
              width="305"
              height="87"
              rx="15"
              fill="#723f2d"
              stroke="#f4c986"
              strokeWidth="3"
            />
            <rect
              x="75"
              y="57"
              width="293"
              height="75"
              rx="11"
              fill={`url(#${uid}sign)`}
            />
            <text
              x="222"
              y="94"
              textAnchor="middle"
              fontFamily="Arial,sans-serif"
              fontWeight="900"
              fontSize="30"
              letterSpacing="-1"
              fill="#af382d"
            >
              NOTHING MART
            </text>
            <text
              x="222"
              y="115"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="9"
              letterSpacing="1"
              fill="#6e5033"
            >
              Everything you’re missing.
            </text>
            <rect
              x="70"
              y="152"
              width="304"
              height="352"
              rx="16"
              fill="#40362a"
              stroke="#dab57a"
              strokeWidth="3"
            />
            <rect
              x="78"
              y="160"
              width="288"
              height="336"
              rx="10"
              fill={`url(#${uid}well)`}
            />
            <ellipse
              cx="220"
              cy="204"
              rx="146"
              ry="66"
              fill={`url(#${uid}glow)`}
            />
            <path
              d="M90 174H352"
              stroke="#ffe2a0"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path d="M222 163V488" stroke="#503f29" strokeWidth="7" />
            <path
              d="M82 315H363M82 486H363"
              stroke="#513c28"
              strokeWidth="12"
            />
            <path d="M82 310H363M82 480H363" stroke="#d9b47a" strokeWidth="3" />
            <path
              d="M86 163 150 163 314 491 280 491Z"
              fill="#fff9cf"
              opacity=".06"
            />
            <rect
              x="86"
              y="528"
              width="208"
              height="109"
              rx="12"
              fill="#612f25"
              stroke="#f5b47e"
              strokeWidth="2"
            />
            <rect
              x="91"
              y="533"
              width="198"
              height="100"
              rx="9"
              fill="#292d27"
              stroke="#b3a57a"
              strokeWidth="3"
            />
            <path d="M100 620 116 583H266L281 620Z" fill="#60503a" />
            <path d="M102 621H280" stroke="#d7b978" strokeWidth="3" />
            <rect
              x="309"
              y="542"
              width="61"
              height="29"
              rx="5"
              fill="#6f2b23"
              stroke="#e9a279"
            />
            <rect
              x="314"
              y="547"
              width="51"
              height="19"
              rx="2"
              fill="#262f29"
            />
            <text
              x="339"
              y="560"
              textAnchor="middle"
              fontSize="8"
              fill="#f3d09a"
              fontFamily="monospace"
            >
              {phase === "idle"
                ? "READY"
                : phase === "coil" || phase === "drop"
                  ? state.product
                  : "THANK U"}
            </text>
            <path
              d="M324 604h33m-33 5h33m-33 5h33"
              stroke="#852e28"
              strokeWidth="3"
            />
            <text
              x="337"
              y="638"
              textAnchor="middle"
              fontSize="8"
              letterSpacing="2"
              fill="#f6bf91"
            >
              NO.404
            </text>
            <path
              d="M402 85h7v42h-7M402 561h7v42h-7"
              fill="#c7aa76"
              stroke="#5e5943"
              strokeWidth="2"
            />
          </svg>
          <div className={styles.shelves}>
            {products.map((p) => (
              <div
                className={styles.slot}
                key={p.id}
                data-slot={p.id}
                data-active={state.product === p.id}
              >
                <div className={styles.sample}>
                  <Product kind={p.kind} />
                </div>
                <div className={styles.coil} aria-hidden="true" />
                <span className={styles.productName} lang="en">
                  {p.name}
                </span>
                <button
                  ref={(el) => {
                    selectRefs.current[p.id] = el;
                  }}
                  className={styles.select}
                  aria-label={`${p.id} ${p.name}を選ぶ`}
                  aria-disabled={phase !== "idle"}
                  onClick={() => dispatch({ type: "select", id: p.id })}
                >
                  <span>{p.id}</span>
                  <i aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          {selected && (
            <div data-cargo="true" className={styles.cargo} aria-hidden="true">
              <Product kind={selected.kind} />
            </div>
          )}
          <button
            className={styles.flap}
            ref={collectRef}
            aria-label="フラップを開けて商品を取り出す"
            disabled={phase !== "ready"}
            onClick={() => dispatch({ type: "collect" })}
          >
            <span>PUSH TO COLLECT</span>
          </button>
          {taken && (
            <div className={styles.handspace}>
              {phase === "inspect" && (
                <button
                  className={styles.open}
                  ref={openRef}
                  onClick={() => dispatch({ type: "open" })}
                >
                  {selected?.action}
                  <span aria-hidden="true"> ↗</span>
                </button>
              )}
              {phase === "result" && (
                <div className={styles.receipt}>
                  <span lang="en">NOTHING MART</span>
                  <strong lang="en">404 NOT FOUND</strong>
                  <span lang="en">{selected?.stamp}</span>
                  <small lang="en">CHARGED: NOTHING</small>
                  <button ref={againRef} onClick={reset}>
                    もう一つ選ぶ ↻
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <p className={styles.status} role="status" aria-live="polite">
        {status}
      </p>
      <noscript>
        <p className={styles.noScript}>
          操作にはJavaScriptが必要です。Nothing is for sale.
        </p>
      </noscript>
    </section>
  );
}
