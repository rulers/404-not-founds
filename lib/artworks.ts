import type { ComponentType } from "react";
import Glitch404 from "@/components/artworks/Glitch404";
import Glass404 from "@/components/artworks/Glass404";
import Liquid404 from "@/components/artworks/Liquid404";
import Smoke404 from "@/components/artworks/Smoke404";
import Break404 from "@/components/artworks/Break404";

export type Artwork = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  description: string;
  instructions: string;
  thumbnail: string;
  /** Controls the whole exhibition, including navigation. Defaults to dark. */
  theme?: "dark" | "light";
  /** The artwork renders its own title, instructions and caption. */
  ownsArtworkInfo?: boolean;
  component: ComponentType;
};

export const artworks: readonly Artwork[] = [
  {
    id: "001",
    title: "Glitch 404",
    category: "Glitch",
    createdAt: "2026-10-17",
    description:
      "A signal in search of a destination. Move closer. Break the silence.",
    instructions: "Move to distort / Click, tap or press Enter to disrupt",
    thumbnail: "/thumbnails/001.svg",
    theme: "dark",
    component: Glitch404,
  },
  {
    id: "002",
    title: "Break the 404",
    category: "Game",
    createdAt: "2026-10-17",
    description:
      "Break the signal, one block at a time. Everything disappears.",
    instructions: "Tilt, drag or move the mouse / Tap or click to launch",
    thumbnail: "/thumbnails/002.svg",
    theme: "dark",
    ownsArtworkInfo: true,
    component: Break404,
  },
  {
    id: "003",
    title: "Glass 404",
    category: "Material",
    createdAt: "2026-10-18",
    description:
      "Shatter the missing world. There is something on the other side.",
    instructions:
      "Drag to score / Tap or hold to strike / Arrows aim, Enter strikes",
    thumbnail: "/thumbnails/003.svg",
    theme: "dark",
    component: Glass404,
  },
  {
    id: "004",
    title: "Liquid 404",
    category: "Material",
    createdAt: "2026-10-18",
    description: "Nothing holds its shape. Pull apart. Bring together.",
    instructions:
      "Grab, stretch, split and merge / Enter grabs, arrows move, Enter releases",
    thumbnail: "/thumbnails/004.svg",
    theme: "light",
    component: Liquid404,
  },
  {
    id: "005",
    title: "Lost in Smoke 404",
    category: "Atmosphere",
    createdAt: "2026-10-19",
    description: "It was here. Part the smoke. Find what never moved.",
    instructions:
      "Move or swipe to part the smoke / Tap to blow / Arrows + Enter",
    thumbnail: "/thumbnails/005.svg",
    theme: "dark",
    component: Smoke404,
  },
];

export function assetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
