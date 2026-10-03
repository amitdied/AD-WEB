import * as THREE from "three";

/**
 * Creates lightweight procedural CanvasTextures for in-world signage,
 * CRT surveillance feeds, wall stencils, and cinema projection screens.
 */

function getSafeCanvas(width: number, height: number): HTMLCanvasElement | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function createStencilTexture(
  title: string,
  subtitle?: string,
  color: string = "#e0e0e5"
): THREE.CanvasTexture {
  const canvas = getSafeCanvas(1024, 256);
  if (!canvas) {
    return new THREE.CanvasTexture(null as any);
  }

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = color;
    ctx.font = "bold 64px monospace";
    ctx.letterSpacing = "6px";
    ctx.fillText(title, 40, 90);

    if (subtitle) {
      ctx.fillStyle = "#888892";
      ctx.font = "28px monospace";
      ctx.letterSpacing = "4px";
      ctx.fillText(subtitle, 44, 150);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createCctvMonitorTexture(
  title: string,
  status: string,
  isLive: boolean = false
): THREE.CanvasTexture {
  const canvas = getSafeCanvas(512, 384);
  if (!canvas) {
    return new THREE.CanvasTexture(null as any);
  }

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = isLive ? "#061214" : "#0d0b0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 2);
    }

    ctx.fillStyle = isLive ? "#34d399" : "#ef4444";
    ctx.font = "bold 24px monospace";
    ctx.fillText(`CAM // ${title}`, 30, 48);

    ctx.fillStyle = "#6b7280";
    ctx.font = "20px monospace";
    ctx.fillText("03:47:22 AM  REC", 30, 84);

    ctx.fillStyle = isLive ? "#6ee7b7" : "#fca5a5";
    ctx.font = "bold 28px monospace";
    ctx.fillText(status, 30, 200);

    ctx.fillStyle = isLive ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.1)";
    ctx.fillRect(30, 240, canvas.width - 60, 40);

    ctx.strokeStyle = isLive ? "#059669" : "#7f1d1d";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createAsphaltGrainTexture(): THREE.CanvasTexture {
  const canvas = getSafeCanvas(512, 512);
  if (!canvas) return new THREE.CanvasTexture(null as any);

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, 512, 512);

    // Grain Noise Aggregates
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle Asphalt Faded Seams
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 3;
    for (let x = 0; x < 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.needsUpdate = true;
  return texture;
}

export function createConcreteTexture(): THREE.CanvasTexture {
  const canvas = getSafeCanvas(512, 512);
  if (!canvas) return new THREE.CanvasTexture(null as any);

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 14;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Concrete Tile Seam Grid Lines
    ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 512, 512);
    ctx.strokeRect(0, 0, 256, 256);
    ctx.strokeRect(256, 256, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.needsUpdate = true;
  return texture;
}

export function createBrickPatternTexture(): THREE.CanvasTexture {
  const canvas = getSafeCanvas(512, 512);
  if (!canvas) return new THREE.CanvasTexture(null as any);

  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Mortar Background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const cols = 8;
    const rowHeight = 512 / rows;
    const colWidth = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (colWidth / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * colWidth + offset;
        const y = r * rowHeight;
        // Brick Color Variation
        const shade = Math.floor(130 + Math.random() * 40);
        ctx.fillStyle = `rgb(${shade + 30}, ${Math.floor(shade * 0.3)}, ${Math.floor(shade * 0.1)})`;
        ctx.fillRect(x + 2, y + 2, colWidth - 4, rowHeight - 4);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

export function createCinemaProjectionTexture(
  state: "offline" | "idle" | "projecting" | boolean
): THREE.CanvasTexture {
  const canvas = getSafeCanvas(1024, 576);
  if (!canvas) {
    return new THREE.CanvasTexture(null as any);
  }

  const ctx = canvas.getContext("2d");
  if (ctx) {
    const normalizedState =
      typeof state === "boolean"
        ? state
          ? "projecting"
          : "offline"
        : state;

    if (normalizedState === "offline") {
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 56px monospace";
      ctx.textAlign = "center";
      ctx.fillText("[ NO SIGNAL ]", canvas.width / 2, canvas.height / 2 - 20);

      ctx.fillStyle = "#6b7280";
      ctx.font = "28px monospace";
      ctx.fillText("ARCHIVE OPTICAL FEED OFFLINE", canvas.width / 2, canvas.height / 2 + 40);
    } else if (normalizedState === "idle") {
      ctx.fillStyle = "#080406";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 56px monospace";
      ctx.textAlign = "center";
      ctx.fillText("AMITDIED CINEMA", canvas.width / 2, canvas.height / 2 - 30);

      ctx.fillStyle = "#f43f5e";
      ctx.font = "bold 32px monospace";
      ctx.fillText("SELECT A TRANSMISSION", canvas.width / 2, canvas.height / 2 + 40);

      ctx.fillStyle = "#71717a";
      ctx.font = "22px monospace";
      ctx.fillText("NODE 03 // OPTICAL SYSTEM READY", canvas.width / 2, canvas.height / 2 + 100);
    } else {
      // Active Projection state
      ctx.fillStyle = "#090204";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Film frame border
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 36px monospace";
      ctx.textAlign = "center";
      ctx.fillText("[ NOW PROJECTING ]", canvas.width / 2, canvas.height / 2 - 60);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 56px monospace";
      ctx.fillText("AMITDIED // ARCHIVE", canvas.width / 2, canvas.height / 2 + 10);

      ctx.fillStyle = "#f87171";
      ctx.font = "bold 26px monospace";
      ctx.fillText("OPTICAL TRANSMISSION // REEL 03", canvas.width / 2, canvas.height / 2 + 70);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
