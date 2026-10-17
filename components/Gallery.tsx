"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { artworks } from "@/lib/artworks";
import { randomIndex, shuffleIndex } from "@/lib/selection";

export default function Gallery({ artworkId }: { artworkId?: string }) {
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      artworks.findIndex((art) => art.id === artworkId),
    ),
  );
  const [edition, setEdition] = useState(0);
  useEffect(() => {
    if (artworkId) return;
    // Pick after hydration so static HTML and the first client render agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Choose a fresh artwork on each Home mount without hydration mismatch.
    setIndex(randomIndex(artworks.length));
  }, [artworkId]);

  const artwork = artworks[index];
  const Art = artwork.component;
  function shuffle() {
    setIndex((current) => shuffleIndex(artworks.length, current));
    setEdition((current) => current + 1);
  }
  return (
    <div className="gallery-shell" data-theme={artwork.theme ?? "dark"}>
      <Header immersive shuffle={artworkId ? undefined : shuffle} />
      <main className="exhibition">
        <div className="artwork-wrap">
          <Art key={`${artwork.id}-${edition}`} />
        </div>
        {!artwork.ownsArtworkInfo && (
          <div className="artwork-info">
            <div className="artwork-identity">
              <span className="day-label">DAY / {artwork.id}</span>
              <h1>
                <Link href={`/404/${artwork.id}/`}>
                  {artwork.title} <span>↗</span>
                </Link>
              </h1>
            </div>
            <p className="interaction-hint">{artwork.instructions}</p>
          </div>
        )}
      </main>
    </div>
  );
}
