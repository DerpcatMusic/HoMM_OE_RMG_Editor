<script lang="ts">
  import type { ZoneLayoutConfig } from "../../../core/rmg/rmgTypes.js";

  let {
    layout,
    width = 220,
    height = 132,
  }: {
    layout?: ZoneLayoutConfig;
    width?: number;
    height?: number;
  } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();

  const perm = new Uint8Array(512);
  const grad = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];

  (function initPerm() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i += 1) p[i] = i;
    let seed = 97;
    for (let i = 255; i > 0; i -= 1) {
      seed = (seed * 16807) % 2147483647;
      const j = seed % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i += 1) perm[i] = p[i & 255];
  })();

  function clamp01(value: number | undefined, fallback: number) {
    if (value === undefined || !Number.isFinite(value)) return fallback;
    return Math.max(0, Math.min(1, value));
  }

  function fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a: number, b: number, t: number) {
    return a + t * (b - a);
  }

  function dot2(g: number[], x: number, y: number) {
    return g[0] * x + g[1] * y;
  }

  function perlin(x: number, y: number) {
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

  function noise(x: number, y: number, scale: number, offset = 0) {
    return (perlin(x * scale + offset, y * scale - offset) + 1) / 2;
  }

  function hash(x: number, y: number) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function weightedElevationTarget() {
    const modes = layout?.elevationModes ?? [];
    if (modes.length === 0) return 0;
    let weighted = 0;
    let total = 0;
    for (const mode of modes) {
      const weight = typeof mode.weight === "number" ? Math.max(0, mode.weight) : 1;
      const min = typeof mode.minElevatedFraction === "number" ? mode.minElevatedFraction : 0.2;
      const max = typeof mode.maxElevatedFraction === "number" ? mode.maxElevatedFraction : 0.4;
      weighted += ((min + max) / 2) * weight;
      total += weight;
    }
    return total > 0 ? Math.max(0, Math.min(1, weighted / total)) : 0;
  }

  function render() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const image = ctx.createImageData(w, h);
    const data = image.data;

    const obstacleFill = clamp01(layout?.obstaclesFill, 0.4);
    const obstacleVoid = clamp01(layout?.obstaclesFillVoid, 0.5);
    const lakesFill = clamp01(layout?.lakesFill, 0);
    const elevationScale = clamp01(layout?.elevationClusterScale, 0.15);
    const elevationTarget = weightedElevationTarget();
    const ambient = layout?.ambientPickupDistribution as { noise?: number; groupSizeWeights?: number[] } | undefined;
    const pickupNoise = Math.max(0, Math.min(2, ambient?.noise ?? 0.3));
    const pickupWeight = Math.max(1, (ambient?.groupSizeWeights ?? [4, 1, 1]).reduce((sum, item) => sum + Math.max(0, item), 0));

    for (let py = 0; py < h; py += 1) {
      for (let px = 0; px < w; px += 1) {
        const x = px / w;
        const y = py / h;
        const water = lakesFill > 0 && noise(x, y, 8, 21) > 1 - lakesFill;
        const elevated = elevationTarget > 0 && noise(x, y, 2 + elevationScale * 18, 7) > 1 - elevationTarget;
        const obstacle = noise(x, y, 12, 3) > 1 - obstacleFill;
        const voidObstacle = obstacle && noise(x, y, 22, 43) > 1 - obstacleVoid;

        let r = elevated ? 214 : 242;
        let g = elevated ? 214 : 242;
        let b = elevated ? 214 : 242;
        if (obstacle) {
          r = voidObstacle ? 54 : 98;
          g = voidObstacle ? 54 : 98;
          b = voidObstacle ? 54 : 98;
        }
        if (water) {
          r = 115;
          g = 151;
          b = 181;
        }

        const idx = (py * w + px) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(image, 0, 0);

    ctx.fillStyle = "#171717";
    const pickupChance = Math.min(0.03, 0.003 * pickupWeight * (1 + pickupNoise));
    for (let py = 4; py < h; py += 6) {
      for (let px = 4; px < w; px += 6) {
        if (hash(px, py) < pickupChance && noise(px / w, py / h, 16, 65) > 0.45) {
          ctx.fillRect(px, py, 2, 2);
        }
      }
    }
  }

  $effect(() => {
    void layout;
    void canvas;
    render();
  });
</script>

<div class="layout-preview">
  <canvas bind:this={canvas} {width} {height} class="layout-canvas"></canvas>
  <div class="preview-legend" aria-hidden="true">
    <span><i class="legend-base"></i>free</span>
    <span><i class="legend-obstacle"></i>obstacle</span>
    <span><i class="legend-water"></i>lake</span>
    <span><i class="legend-elevated"></i>elevated</span>
    <span><i class="legend-pickup"></i>pickup</span>
  </div>
</div>

<style>
  .layout-preview {
    display: grid;
    gap: var(--space-1);
  }
  .layout-canvas {
    width: 100%;
    height: auto;
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    image-rendering: pixelated;
  }
  .preview-legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    color: var(--color-muted);
    font-size: 0.5625rem;
    line-height: 1;
  }
  .preview-legend span {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .preview-legend i {
    width: 0.625rem;
    height: 0.625rem;
    border: var(--line) solid var(--color-line);
  }
  .legend-base { background: #f2f2f2; }
  .legend-obstacle { background: #626262; }
  .legend-water { background: #7397b5; }
  .legend-elevated { background: #d6d6d6; }
  .legend-pickup { background: #171717; }
</style>
