import Link from "next/link";

export default function Header({
  discover = false,
  shuffle,
}: {
  discover?: boolean;
  shuffle?: () => void;
}) {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="404 NOT FOUNDS — Home">
        404
        <span className="wordmark-divider" />
        NOT FOUNDS<span className="wordmark-dot">®</span>
      </Link>
      <span className="header-note">AN EXPERIMENT IN NONEXISTENCE</span>
      <nav aria-label="Main navigation">
        <Link
          href="/discover/"
          className={discover ? "nav-link active" : "nav-link"}
        >
          DISCOVER <span>↗</span>
        </Link>
        {shuffle ? (
          <button className="shuffle-button" onClick={shuffle}>
            <span aria-hidden="true">⤨</span> SHUFFLE
          </button>
        ) : (
          <Link className="nav-link home-link" href="/">
            HOME <span>↗</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
