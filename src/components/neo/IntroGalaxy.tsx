import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Float, Html } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Zap } from "lucide-react";

type NodeDef = { id: string; label: string; pos: [number, number, number]; color: string; demo: string };

const NODES: NodeDef[] = [
  { id: "sales",      label: "Sales Galaxy",       pos: [ 4,  1.5,  0],   color: "#7c5cff", demo: "sales" },
  { id: "household",  label: "Household Nebula",   pos: [-4,  1.0,  1.5], color: "#5cd0ff", demo: "household" },
  { id: "churn",      label: "Churn Cluster",      pos: [ 0,  2.2, -3.5], color: "#c25cff", demo: "churn" },
  { id: "healthcare", label: "Healthcare Pulsar",  pos: [-3, -1.5, -2],   color: "#5cffae", demo: "healthcare" },
  { id: "fraud",      label: "Fraud Quasar",       pos: [ 3, -1.8,  2],   color: "#ffd55c", demo: "fraud" },
];

function ScatterField() {
  const ref = useRef<THREE.Points>(null!);
  const { positions, colors } = useMemo(() => {
    const N = 1200;
    const p = new Float32Array(N * 3);
    const c = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 6 + Math.random() * 6;
      const t = Math.random() * Math.PI * 2;
      const u = (Math.random() - 0.5) * 0.6;
      p[i*3]   = Math.cos(t) * r;
      p[i*3+1] = u * r;
      p[i*3+2] = Math.sin(t) * r;
      const col = new THREE.Color().setHSL(0.65 + Math.random() * 0.2, 0.9, 0.55);
      c[i*3] = col.r; c[i*3+1] = col.g; c[i*3+2] = col.b;
    }
    return { positions: p, colors: c };
  }, []);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.05; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors sizeAttenuation transparent opacity={0.85} />
    </points>
  );
}

function BarRing() {
  const grp = useRef<THREE.Group>(null!);
  const bars = useMemo(() => Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const h = 0.6 + Math.sin(i * 0.7) * 0.5 + Math.random() * 0.6;
    return { x: Math.cos(a) * 3.2, z: Math.sin(a) * 3.2, h, hue: 0.7 - (h / 2) * 0.3 };
  }), []);
  useFrame((_, dt) => { if (grp.current) grp.current.rotation.y -= dt * 0.15; });
  return (
    <group ref={grp}>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2 - 1.8, b.z]}>
          <boxGeometry args={[0.35, b.h, 0.35]} />
          <meshStandardMaterial color={new THREE.Color().setHSL(b.hue, 0.85, 0.55)} emissive={new THREE.Color().setHSL(b.hue, 0.85, 0.45)} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Node({ node, onPick }: { node: NodeDef; onPick: (n: NodeDef) => void }) {
  const [hover, setHover] = useState(false);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * (hover ? 1.6 : 0.5); });
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8}>
      <group position={node.pos}>
        <mesh
          ref={ref}
          onClick={(e) => { e.stopPropagation(); onPick(node); }}
          onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
          onPointerOut={() => { setHover(false); document.body.style.cursor = "default"; }}
          scale={hover ? 1.25 : 1}
        >
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={hover ? 1.4 : 0.7} metalness={0.6} roughness={0.2} wireframe={hover} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.85, 24, 24]} />
          <meshBasicMaterial color={node.color} transparent opacity={hover ? 0.18 : 0.08} />
        </mesh>
        <Html distanceFactor={10} position={[0, 1.1, 0]} center style={{ pointerEvents: "none" }}>
          <div className="px-2 py-1 rounded-md border border-border bg-background/80 backdrop-blur text-[10px] uppercase tracking-[0.25em] text-foreground whitespace-nowrap" style={{ boxShadow: `0 0 18px ${node.color}55` }}>
            {node.label}
          </div>
        </Html>
      </group>
    </Float>
  );
}

export function IntroGalaxy({ onPickDemo }: { onPickDemo?: (id: string) => void }) {
  const [picked, setPicked] = useState<NodeDef | null>(null);

  const pick = (n: NodeDef) => {
    setPicked(n);
    // brief transition then load
    setTimeout(() => {
      onPickDemo?.(n.demo);
    }, 650);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <Canvas camera={{ position: [0, 3, 11], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={["#07061a"]} />
        <fog attach="fog" args={["#07061a", 10, 28]} />
        <ambientLight intensity={0.35} />
        <pointLight position={[10, 8, 10]} intensity={1.4} color="#c25cff" />
        <pointLight position={[-10, -4, -8]} intensity={1.1} color="#5cd0ff" />
        <Stars radius={60} depth={40} count={4000} factor={3} fade speed={0.6} />
        <ScatterField />
        <BarRing />
        {NODES.map((n) => <Node key={n.id} node={n} onPick={pick} />)}
        <OrbitControls enablePan={false} enableZoom autoRotate autoRotateSpeed={0.4} maxDistance={20} minDistance={6} />
      </Canvas>

      {/* overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-4 sm:p-6 flex items-start justify-between">
        <div className="rounded-md border border-primary/40 bg-background/70 backdrop-blur px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] text-primary">
          Interactive Galaxy · click a node
        </div>
        <div className="hidden sm:block rounded-md border border-border bg-background/70 backdrop-blur px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          drag to orbit · scroll to zoom
        </div>
      </div>

      {picked && (
        <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-primary mb-3">
              <Zap className="size-3" /> Materializing
            </div>
            <div className="text-2xl font-bold text-glow">{picked.label}</div>
            <div className="mt-2 text-sm text-muted-foreground">Booting workspace…</div>
          </div>
        </div>
      )}
    </div>
  );
}