import type { SyntheticEvent } from "react";

// Neutral "no photo" placeholder shown when an image URL fails to load — e.g. a
// photo whose storage bucket was deleted. Inline SVG so it can never 404 itself.
export const NO_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>" +
      "<rect width='100%' height='100%' fill='#e2e8f0'/>" +
      "<text x='50%' y='52%' fill='#94a3b8' font-family='sans-serif' font-size='22' text-anchor='middle' dominant-baseline='middle'>No photo</text>" +
      "</svg>"
  );

// onError handler that swaps a broken image for the placeholder, guarding
// against an infinite loop if the placeholder itself somehow fails.
export const onImgError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.fallback) return;
  img.dataset.fallback = "1";
  img.src = NO_PHOTO;
};
