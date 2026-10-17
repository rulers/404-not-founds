import type { ComponentType } from "react";
import Glitch404 from "@/components/artworks/Glitch404";
import Glass404 from "@/components/artworks/Glass404";
import Liquid404 from "@/components/artworks/Liquid404";
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
    description: "Something fragile. Every touch leaves a trace.",
    instructions:
      "Aim and tap to chip / Hold then release to smash / Enter or Space",
    thumbnail: "/thumbnails/003.svg",
    theme: "dark",
    component: Glass404,
  },
  {
    id: "004",
    title: "Liquid 404",
    category: "Material",
    createdAt: "2026-10-18",
    description: "Nothing holds its shape. Move closer. Pull gently. Let go.",
    instructions:
      "Move to ripple / Drag to stretch / Release to restore / Arrow keys to stir",
    thumbnail: "/thumbnails/004.svg",
    theme: "dark",
    component: Liquid404,
  },
];

export function assetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
