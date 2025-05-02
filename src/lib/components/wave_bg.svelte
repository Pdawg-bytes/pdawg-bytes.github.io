<script lang="ts">
  import { onMount } from "svelte";

  export let primaryColor = "#1b3101";
  export let secondaryColor = "#c4c700";

  let wave1: SVGPathElement;
  let wave2: SVGPathElement;
  let sparklesContainer: HTMLDivElement;

  interface WaveSetting {
    baseY: number;
    amplitude: number;
    speed: number;
    phase: number;
  }

  const waveSettings: WaveSetting[] = [
    { baseY: 50, amplitude: 26, speed: 0.6, phase: 0 },
    { baseY: 55, amplitude: 27, speed: 0.8, phase: 0.2 },
  ];

  type RGB = [number, number, number];

  const hexToRgb = (hex: string): RGB => {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  const blendColors = (color1: RGB, color2: RGB, ratio: number): RGB =>
    color1.map((c, i) => Math.round(c + (color2[i] - c) * ratio)) as RGB;

  const rgbToCss = ([r, g, b]: RGB, a = 1): string =>
    `rgba(${r},${g},${b},${a})`;
  const getRandom = (min: number, max: number): number =>
    Math.random() * (max - min) + min;

  const sineCache: number[] = new Array(360).fill(0).map((_, i) => Math.sin((i * Math.PI) / 180));
  const cosineCache: number[] = new Array(360).fill(0).map((_, i) => Math.cos((i * Math.PI) / 180));

  function animate(): void {
    waveSettings.forEach((wave, i) => {
      const element = i === 0 ? wave1 : wave2;
      wave.phase = (wave.phase + wave.speed) % 360;
      const cp1y = wave.baseY - 5 + sineCache[Math.floor(wave.phase)] * wave.amplitude;
      const cp2y = wave.baseY + 5 + cosineCache[Math.floor(wave.phase)] * wave.amplitude;
      element?.setAttribute(
        "d",
        `M0,${wave.baseY} C25,${cp1y} 75,${cp2y} 100,${wave.baseY} L100,100 L0,100 Z`,
      );
    });
    requestAnimationFrame(animate);
  }

  $: if (primaryColor && secondaryColor) {
    if (
      /^#[\da-f]{6}$/i.test(primaryColor) &&
      /^#[\da-f]{6}$/i.test(secondaryColor)
    ) {
      const topRgb = hexToRgb(primaryColor);
      const bottomRgb = hexToRgb(secondaryColor);
      const avgColor = blendColors(topRgb, bottomRgb, 0.8);
      const lightWave = blendColors(avgColor, [255, 255, 255], 0.4);

      if (typeof document !== "undefined") {
        document.body.style.background = `linear-gradient(to bottom right, ${rgbToCss(topRgb)}, ${rgbToCss(bottomRgb)})`;
        [wave1, wave2].forEach((wave) => {
          wave?.setAttribute("fill", rgbToCss(lightWave, 0.5));
          wave?.setAttribute("stroke", rgbToCss(lightWave, 0.7));
        });
      }
    } else {
      console.error("Invalid hex color code provided");
    }
  }

  const MAX_SPARKLES = 100;
  const sparklePool: HTMLDivElement[] = [];
  const activeSparkles: Set<HTMLDivElement> = new Set();

  function initSparkles(): void {
    for (let i = 0; i < MAX_SPARKLES; i++) {
      const sparkle = document.createElement("div");
      sparkle.className = "sparkle";
      sparkle.style.display = "none";
      sparklesContainer?.appendChild(sparkle);
      sparklePool.push(sparkle);
    }
  }

  function createSparkles(): void {
    setInterval(() => {
      if (sparklePool.length === 0) return;

      const sparkle = sparklePool.pop();
      if (!sparkle) return;

      activeSparkles.add(sparkle);

      const w1 = Math.random() > 0.5;
      const wave = w1 ? wave1 : wave2;
      if (!wave) return;

      const len = wave.getTotalLength();
      const point = wave.getPointAtLength(getRandom(0.0045, 0.34) * len);

      sparkle.style.left = `${point.x}%`;
      sparkle.style.top = `${point.y + (w1 ? 15 : 14)}%`;
      sparkle.style.setProperty("--moveX", `${(Math.random() * 2 - 1) * 90}px`);
      sparkle.style.setProperty("--moveY", `${(Math.random() * 2 - 1) * 90}px`);

      sparkle.style.display = "block";
      sparkle.classList.remove("reset");

      setTimeout(() => {
        sparkle.style.display = "none";
        activeSparkles.delete(sparkle);
        sparklePool.push(sparkle);
      }, 3000);
    }, 100);
  }

  onMount(() => {
    initSparkles();
    createSparkles();
    animate();
  });
</script>

<svg
  viewBox="0 0 100 100"
  xmlns="http://www.w3.org/2000/svg"
  class="wave-container"
  preserveAspectRatio="none"
>
  <path bind:this={wave1} d="M0,50 C25,40 75,60 100,50 L100,100 L0,100 Z" />
  <path bind:this={wave2} d="M0,55 C25,45 75,65 100,55 L100,100 L0,100 Z" />
</svg>

<div bind:this={sparklesContainer} class="sparkles-container"></div>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    width: 100%;
    background: black;
  }

  .wave-container {
    position: absolute;
    bottom: 0;
    height: 70%;
    left: -5%;
    width: 115%;
    overflow: hidden;
    pointer-events: none;
  }

  path {
    stroke-width: 0.2;
  }

  .sparkles-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }

  :global(.sparkle) {
    position: absolute;
    width: 0.3vw;
    height: 0.3vw;
    border-radius: 50%;
    background-color: #ffffff;
    opacity: 0.8;
    transform: scale(0.7);
    pointer-events: none;
    animation: sparkle-animation 3s ease-in-out forwards;
    box-shadow:
      0 0 8px rgba(255, 255, 255, 0.6),
      0 0 16px rgba(255, 255, 255, 0.4);
    will-change: transform, opacity;
    contain: layout paint style;
  }

  @keyframes sparkle-animation {
    0% {
      opacity: 0.9;
      transform: scale(0.7);
    }
    100% {
      opacity: 0;
      transform: translateX(var(--moveX)) translateY(var(--moveY)) scale(0.2);
    }
  }
</style>