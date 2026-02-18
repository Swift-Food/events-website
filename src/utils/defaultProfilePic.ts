const DEFAULT_PROFILE_PICS = [
  "ASCII Prof 1 - _P.png",
  "ASCII Prof 2 - _).png",
  "ASCII Prof 2 - _)(1).png",
  "ASCII Prof 3 - _O.png",
  "ASCII Prof 4 - _x.png",
  "ASCII Prof 5 - __.png",
  "ASCII Prof 6 - _}.png",
  "ASCII Prof 8 - _O(1).png",
  "ASCII Prof 9 - _■.png",
  "ASCII Prof 10 - _€.png",
  "ASCII Prof 12 - _i.png",
  "ASCII Prof 13 - _3 correction.png",
  "ASCII Prof 14 - _1 correction.png",
  "ASCII Prof 15 - _+.png",
  "ASCII Prof 16 - _A.png",
  "ASCII Prof 17 - _7.png",
  "ASCII Prof 18 - _U.png",
  "ASCII Prof 19 - _¬.png",
  "ASCII Prof 20 - _D.png",
  "ASCII Prof 21 - _].png",
  "ASCII Prof 22 - _j.png",
  "ASCII Prof 23 - _Δ.png",
  "ASCII Prof 24 - _Q.png",
  "ASCII Prof 25 - _~.png",
  "ASCII Prof 26 - _..png",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic default profile picture URL based on a seed (e.g. user ID).
 * The same seed always returns the same picture.
 */
export function getDefaultProfilePic(seed: string): string {
  const index = hashString(seed) % DEFAULT_PROFILE_PICS.length;
  const filename = DEFAULT_PROFILE_PICS[index];
  return `/default_profile_pics/${encodeURIComponent(filename)}`;
}
