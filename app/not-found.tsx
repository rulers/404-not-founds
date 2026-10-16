import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">AN ACTUAL ABSENCE</p>
      <h1>404</h1>
      <p>This one really doesn’t exist.</p>
      <Link className="shuffle-button" href="/">
        RETURN TO THE GALLERY ↗
      </Link>
    </main>
  );
}
