import type { ComponentType } from "react";
import Glitch404 from "@/components/artworks/Glitch404";

export type Artwork = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  description: string;
  thumbnail: string;
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
    thumbnail: "/thumbnails/001.svg",
    component: Glitch404,
  },
];

export function assetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
