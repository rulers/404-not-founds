import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import { artworks } from "@/lib/artworks";

export const dynamicParams = false;
export function generateStaticParams() {
  return artworks.map(({ id }) => ({ id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artwork = artworks.find((art) => art.id === id);
  return { title: artwork ? `Day ${id} — ${artwork.title}` : "Not Found" };
}
export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!artworks.some((art) => art.id === id)) notFound();
  return <Gallery artworkId={id} />;
}
