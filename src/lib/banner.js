/**
 * A deterministic banner colour per event.
 *
 * The repository ships exactly one event photograph. Repeating it on sixteen
 * cards looks like a placeholder, so a card banner is a gradient derived from
 * the event id instead: stable across reloads, distinct between neighbours, and
 * nothing to download.
 */

const PALETTE = [
  ["#2f6df0", "#5aa0ff"],
  ["#7b4bd8", "#b07cf0"],
  ["#128a6e", "#4cc4a0"],
  ["#d1734b", "#f0a87c"],
  ["#1b6ca8", "#54b0d8"],
  ["#a8446e", "#e07fa4"],
];

export const bannerStyle = (id) => {
  const index = Math.abs(Number(id) || 0) % PALETTE.length;
  const [from, to] = PALETTE[index];
  return { background: `linear-gradient(130deg, ${from} 0%, ${to} 100%)` };
};

export const BANNER_COLOUR_COUNT = PALETTE.length;
