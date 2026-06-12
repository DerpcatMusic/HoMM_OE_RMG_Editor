<script lang="ts">
  /**
   * Renders a 2D Perlin noise preview on a canvas.
   * Visualizes how NoiseMode amp/freq parameters shape the border.
   */

  let {
    amp = 1,
    freq = 12,
    label = "Noise",
    width = 200,
    height = 48,
  }: {
    amp?: number;
    freq?: number;
    label?: string;
    width?: number;
    height?: number;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();

  // Permutation table for Perlin noise
  const perm = new Uint8Array(512);
  const grad = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];

  // Initialize permutation table (fixed seed for consistency)
  (function initPerm() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates with fixed seed
    let seed = 42;
    for (let i = 255; i > 0; i--) {
      seed = (seed * 16807 + 0) % 2147483647;
      const j = seed % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  function fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  function dot2(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
  }

  function perlin(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);

    const aa = perm[perm[xi] + yi] & 7;
    const ab = perm[perm[xi] + yi + 1] & 7;
    const ba = perm[perm[xi + 1] + yi] & 7;
    const bb = perm[perm[xi + 1] + yi + 1] & 7;

    const x1 = lerp(dot2(grad[aa], xf, yf), dot2(grad[ba], xf - 1, yf), u);
    const x2 = lerp(dot2(grad[ab], xf, yf - 1), dot2(grad[bb], xf - 1, yf - 1), u);

    return lerp(x1, x2, v);
  }

  /** Sample multi-layer Perlin noise at (x, y) using amp/freq. */
  function sampleNoise(x: number, y: number, amplitude: number, frequency: number): number {
    // Standard Perlin: scale coordinates by freq, multiply result by amp
    const val = perlin(x * frequency / 64, y * frequency / 64) * amplitude;
    // Normalize to 0-1 range (Perlin output is roughly -1 to 1)
    return (val + 1) / 2;
  }

  function render() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    const a = amp ?? 1;
    const f = freq ?? 12;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const n = sampleNoise(x, y, a, f);
        // Clamp to 0-255
        const v = Math.max(0, Math.min(255, Math.round(n * 255)));
        const idx = (y * w + x) * 4;
        data[idx] = v;
        data[idx + 1] = v;
        data[idx + 2] = v;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Re-render when params change
  $effect(() => {
    void amp; void freq; void canvas;
    render();
  });
</script>

<div class="noise-preview">
  <span class="noise-label">{label}</span>
  <canvas bind:this={canvas} {width} {height} class="noise-canvas"></canvas>
  <span class="noise-meta">a:{amp} f:{freq}</span>
</div>

<style>
  .noise-preview {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
  }
  .noise-label {
    font-size: var(--font-size-xs);
    color: var(--color-muted, #888);
    min-width: 3rem;
  }
  .noise-canvas {
    border: var(--line, 1px) solid var(--color-line, #333);
    image-rendering: pixelated;
    width: 100%;
    height: 48px;
    flex: 1;
    min-width: 0;
  }
  .noise-meta {
    font-size: var(--font-size-xxs);
    color: var(--color-muted, #666);
    font-family: var(--font-mono, monospace);
    white-space: nowrap;
  }
</style>
