import type { ComponentType } from "react";
import Glitch404 from "@/components/artworks/Glitch404";

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
];

export function assetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
