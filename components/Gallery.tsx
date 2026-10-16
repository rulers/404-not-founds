"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { artworks } from "@/lib/artworks";
import { dailyIndex, jstDateKey, shuffleIndex } from "@/lib/selection";

export default function Gallery({ artworkId }: { artworkId?: string }) {
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      artworks.findIndex((art) => art.id === artworkId),
    ),
  );
  const [edition, setEdition] = useState(0);
  const day = useRef("");
  useEffect(() => {
    if (artworkId) return;
    const update = () => {
      const today = jstDateKey();
      if (today !== day.current) {
        day.current = today;
        setIndex(dailyIndex(artworks.length));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    window.addEventListener("focus", update);
    window.addEventListener("pointerdown", update);
    window.addEventListener("keydown", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", update);
      window.removeEventListener("pointerdown", update);
      window.removeEventListener("keydown", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [artworkId]);

  const artwork = artworks[index];
  const Art = artwork.component;
  function shuffle() {
    setIndex((current) => shuffleIndex(artworks.length, current));
    setEdition((current) => current + 1);
  }
  return (
    <div className="gallery-shell">
      <Header shuffle={artworkId ? undefined : shuffle} />
      <main className="exhibition">
        <div className="exhibition-topline">
          <span>
            <span className="live-dot" />{" "}
            {artworkId ? "NOW EXHIBITING" : "TODAY’S NONEXISTENCE"}
          </span>
          <span>{artwork.id} — 365</span>
        </div>
        <div className="artwork-wrap">
          <Art key={`${artwork.id}-${edition}`} />
        </div>
        <div className="artwork-info">
          <div className="artwork-identity">
            <span className="day-label">DAY / {artwork.id}</span>
            <h1>
              <Link href={`/404/${artwork.id}/`}>
                {artwork.title} <span>↗</span>
              </Link>
            </h1>
            <span className="category-tag">{artwork.category}</span>
          </div>
          <p className="interaction-hint">
            <span className="crosshair" aria-hidden="true">
              ⌖
            </span>{" "}
            MOVE TO DISTORT <span className="hint-divider">/</span> CLICK OR TAP
            TO DISRUPT
          </p>
        </div>
      </main>
      <footer className="site-footer">
        <p>
          A collection of things
          <br className="mobile-break" /> that shouldn’t exist.
        </p>
        <div className="project-progress">
          <span>365 DAYS OF NOTHING</span>
          <span className="progress-track">
            <i style={{ width: `${(artworks.length / 365) * 100}%` }} />
          </span>
          <span>{String(artworks.length).padStart(3, "0")} / 365</span>
        </div>
        <span className="footer-location">
          SOMEWHERE ON THE INTERNET <span>↗</span>
        </span>
      </footer>
    </div>
  );
}
