'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThreePreviewCanvasProps {
  /** Kept for parity with `MediaPayload.modelFormat`; surfaced in the HUD. */
  modelFormat?: 'gltf' | 'glb' | 'obj' | 'fbx';
  title: string;
  className?: string;
  'data-testid'?: string;
}

interface OrbitState {
  /** Rotation in degrees. */
  yaw: number;
  pitch: number;
}

const PITCH_LIMIT = 78;
const ORBIT_SENSITIVITY = 0.35;
const IDLE_SPIN_SPEED = 0.12;

type Vec3 = [number, number, number];

function rotate([x, y, z]: Vec3, yawDeg: number, pitchDeg: number): Vec3 {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;

  // Yaw about Y, then pitch about X.
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const y2 = y * cosP - z1 * sinP;
  const z2 = y * sinP + z1 * cosP;

  return [x1, y2, z2];
}

function project(point: Vec3, width: number, height: number, distance: number): [number, number] {
  const perspective = distance / (distance - point[2] * 0.9);
  return [width / 2 + point[0] * perspective, height / 2 + point[1] * perspective];
}

/** Deterministic lattice so the wireframe is identical on server and client. */
const NODES: Vec3[] = (() => {
  const nodes: Vec3[] = [];
  const layers = 5;
  const perLayer = 8;
  for (let layer = 0; layer < layers; layer += 1) {
    const t = layer / (layers - 1) - 0.5;
    for (let index = 0; index < perLayer; index += 1) {
      const angle = (index / perLayer) * Math.PI * 2;
      const radius = 0.52 + Math.sin(angle * 3 + layer) * 0.08;
      nodes.push([Math.cos(angle) * radius, t * 1.25, Math.sin(angle) * radius]);
    }
  }
  return nodes;
})();

function buildEdges(): [number, number][] {
  const edges: [number, number][] = [];
  const perLayer = 8;
  const layers = 5;

  for (let layer = 0; layer < layers; layer += 1) {
    for (let index = 0; index < perLayer; index += 1) {
      const from = layer * perLayer + index;
      const next = layer * perLayer + ((index + 1) % perLayer);
      edges.push([from, next]);

      if (layer < layers - 1) {
        edges.push([from, (layer + 1) * perLayer + index]);
      }
    }
  }
  return edges;
}

const EDGES = buildEdges();

/**
 * Interactive wireframe preview.
 *
 * Rather than pulling in a WebGL runtime, the viewport projects a procedural
 * lattice on a 2D canvas. Orbit state is driven by pointer/touch capture so the
 * same gesture works with a mouse, a finger and a stylus, and an idle auto-spin
 * keeps the preview alive when untouched.
 */
export function ThreePreviewCanvas({
  modelFormat,
  title,
  className,
  ...rest
}: ThreePreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const orbitRef = useRef<OrbitState>({ yaw: 20, pitch: -12 });
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const render = useCallback((yaw: number, pitch: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
      canvas.width = width * ratio;
      canvas.height = height * ratio;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);

    const distance = 3.1;
    const projected = NODES.map((node) =>
      project(rotate(node, yaw, pitch), width, height, distance)
    );

    // Depth-sorted edges with a cyan depth gradient.
    const drawables = EDGES.map(([a, b]) => {
      const depth = (NODES[a][2] + NODES[b][2]) / 2;
      return { a, b, depth };
    }).sort((first, second) => second.depth - first.depth);

    drawables.forEach(({ a, b, depth }) => {
      const [x1, y1] = projected[a];
      const [x2, y2] = projected[b];
      const fade = Math.max(0.18, 0.85 - depth * 0.55);
      context.strokeStyle = `rgba(34, 211, 238, ${fade})`;
      context.lineWidth = 1.1;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    });

    NODES.forEach((node, index) => {
      const [x, y] = projected[index];
      const fade = Math.max(0.25, 0.95 - node[2] * 0.6);
      context.fillStyle = `rgba(167, 139, 250, ${fade})`;
      context.beginPath();
      context.arc(x, y, 1.7, 0, Math.PI * 2);
      context.fill();
    });
  }, []);

  useEffect(() => {
    let lastTime = 0;

    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (!draggingRef.current && delta < 100) {
        orbitRef.current.yaw += IDLE_SPIN_SPEED * (delta / 16.67);
      }
      render(orbitRef.current.yaw, orbitRef.current.pitch);
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [render]);

  useEffect(() => {
    const handleResize = () => render(orbitRef.current.yaw, orbitRef.current.pitch);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  const toggleFullscreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
      return;
    }
    canvas.requestFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
        className
      )}
      data-testid="three-preview-canvas"
      {...rest}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Interactive wireframe preview of ${title}. Drag to orbit the model.`}
        className={cn('block h-full w-full touch-none select-none', isDragging && 'cursor-grabbing')}
        data-testid="three-canvas"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          draggingRef.current = true;
          lastPointerRef.current = { x: event.clientX, y: event.clientY };
          setIsDragging(true);
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current || !lastPointerRef.current) return;
          const deltaX = event.clientX - lastPointerRef.current.x;
          const deltaY = event.clientY - lastPointerRef.current.y;
          lastPointerRef.current = { x: event.clientX, y: event.clientY };

          orbitRef.current = {
            yaw: orbitRef.current.yaw + deltaX * ORBIT_SENSITIVITY,
            pitch: Math.min(
              Math.max(orbitRef.current.pitch - deltaY * ORBIT_SENSITIVITY, -PITCH_LIMIT),
              PITCH_LIMIT
            ),
          };
        }}
        onPointerUp={(event) => {
          draggingRef.current = false;
          lastPointerRef.current = null;
          setIsDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
          lastPointerRef.current = null;
          setIsDragging(false);
        }}
      />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span className="rounded-full border border-white/15 bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 backdrop-blur-md">
          {modelFormat ? `${modelFormat.toUpperCase()} preview` : 'Wireframe preview'}
        </span>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen preview' : 'Enter fullscreen preview'}
          className={cn(
            'pointer-events-auto inline-flex size-11 items-center justify-center rounded-xl',
            'border border-white/15 bg-slate-950/80 text-slate-300 backdrop-blur-md',
            'transition-colors hover:bg-slate-950 hover:text-cyan-300',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
          )}
        >
          <Maximize2 aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-slate-950/95 to-transparent p-3 pt-8">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
          <RotateCw aria-hidden="true" className="size-3.5" />
          Drag to orbit
        </span>
        <span className="font-mono text-[11px] text-slate-500">
          {Math.round(((orbitRef.current.pitch + 90) / 180) * 100)}° elevation
        </span>
      </div>
    </div>
  );
}