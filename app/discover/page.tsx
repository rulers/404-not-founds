import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { artworks, assetPath } from "@/lib/artworks";

export const metadata: Metadata = { title: "Discover" };
export default function Discover() {
  return (
    <div className="discover-shell">
      <Header discover />
      <main className="discover-main">
        <div className="collection-heading">
          <div>
            <p className="eyebrow">
              <span className="live-dot" /> THE COLLECTION
            </p>
            <h1>
              Lost.
              <br />
              <span>And found.</span>
            </h1>
          </div>
          <div className="collection-description">
            <p>
              Different days. Different ways to disappear.
              <br />
              An ongoing collection of interactive 404s.
            </p>
            <span>
              {String(artworks.length).padStart(3, "0")} WORK{" "}
              {artworks.length === 1 ? "EXISTS" : "EXIST"} / 365 PLANNED
            </span>
          </div>
        </div>
        <div className="collection-toolbar">
          <span>
            ALL EXPERIMENTS{" "}
            <span className="count">
              {String(artworks.length).padStart(2, "0")}
            </span>
          </span>
          <span>INDEX / CHRONOLOGICAL ↓</span>
        </div>
        <div className="artwork-grid">
          {artworks.map((art) => (
            <Link href={`/404/${art.id}/`} className="art-card" key={art.id}>
              <div className="thumbnail">
                <img
                  src={assetPath(art.thumbnail)}
                  width="900"
                  height="600"
                  alt={`${art.title} — Day ${art.id} preview`}
                />
                <span className="thumbnail-day">DAY {art.id}</span>
                <span className="card-open" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className="card-caption">
                <div>
                  <span className="day-label">{art.id} /</span>
                  <h2>{art.title}</h2>
                </div>
                <span className="category-tag">{art.category}</span>
              </div>
            </Link>
          ))}
          <div className="coming-next">
            <span>{String(artworks.length + 1).padStart(3, "0")}</span>
            <p>Nothing yet.</p>
            <span>THE ABSENCE CONTINUES</span>
          </div>
        </div>
      </main>
      <footer className="discover-footer">
        <span>A collection of things that shouldn’t exist.</span>
        <Link href="/">BACK TO THE VOID ↗</Link>
      </footer>
    </div>
  );
}
