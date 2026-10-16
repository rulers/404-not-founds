import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "404 NOT FOUNDS — 365 Days of Nothing",
    template: "%s — 404 NOT FOUNDS",
  },
  description:
    "A collection of things that shouldn’t exist. 365 interactive 404 artworks. A new absence, every day.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <div id="content">{children}</div>
      </body>
    </html>
  );
}
