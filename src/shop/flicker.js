// Cyberpunk flicker: hard on/off transitions (no smooth fade). A broken
// neon sign doesn't dim — it cuts. Multi-octave noise drives the timing
// of the dropouts so the pattern never visibly repeats.
//
// Returns either 1 (full) or (1 - amplitude) (dropped), depending on
// whether the noise dipped below a threshold this frame.
//
//   frequency  — how often the noise oscillates (higher = more flicker events)
//   amplitude  — how dark the dropout is (0 = no effect, 1 = fully off)
//   seed       — phase offset so multiple instances don't sync
export function flickerFactor(time, frequency = 3, amplitude = 0.6, seed = 0) {
  const t = time * frequency + seed;
  const n =
    Math.sin(t) * 0.5 +
    Math.sin(t * 2.31 + 1.7) * 0.3 +
    Math.sin(t * 4.93 + 3.1) * 0.2;
  // Hard threshold — instant on/off, no easing. Lower threshold = rarer
  // dropout events (n only dips this low occasionally).
  return n < -0.7 ? 1 - amplitude : 1;
}
