import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Float, Html, Sparkles as DreiSparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type Viz3DType = "bars" | "skyline" | "sphereCloud" | "helix" | "ribbon" | "rings" | "spheres" | "tower";

type Datum = { name: string; value: number };

function colorFor(t: number) {
  return new THREE.Color().setHSL(0.72 - t * 0.35, 0.9, 0.55);
}

/* ──── visualization variants ──── */

function Bars({ data }: { data: Datum[] }) {
  const grp = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { if (grp.current) grp.current.rotation.y += dt * 0.15; });
  const max = Math.max(1, ...data.map((d) => d.value));
  const items = data.slice(0, 36).map((d, i) => {
    const h = (d.value / max) * 5 + 0.1;
    const x = (i % 6) * 1.4 - 3.5;
    const z = Math.floor(i / 6) * 1.4 - 3.5;
    const c = colorFor(d.value / max);
    return { x, z, h, c, name: d.name };
  });
  return (
    <group ref={grp}>
      {items.map((b, i) => (
        <Float key={i} speed={1.2} floatIntensity={0.15} rotationIntensity={0}>
          <mesh position={[b.x, b.h / 2, b.z]} castShadow>
            <boxGeometry args={[1, b.h, 1]} />
            <meshStandardMaterial color={b.c} emissive={b.c} emissiveIntensity={0.6} metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[b.x, 0, b.z]}>
            <ringGeometry args={[0.7, 0.85, 32]} />
            <meshBasicMaterial color={b.c} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Skyline({ data }: { data: Datum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const N = data.length;
  const items = data.slice(0, 64).map((d, i) => {
    const a = (i / N) * Math.PI * 2;
    const r = 4.2;
    const h = (d.value / max) * 6 + 0.3;
    const c = colorFor(d.value / max);
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, h, c, rot: a };
  });
  return (
    <group>
      {items.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} rotation={[0, -b.rot, 0]}>
          <cylinderGeometry args={[0.35, 0.35, b.h, 6]} />
          <meshStandardMaterial color={b.c} emissive={b.c} emissiveIntensity={0.55} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function SphereCloud({ data }: { data: Datum[] }) {
  const ref = useRef<THREE.Points>(null!);
  const { positions, colors, sizes } = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const N = Math.max(800, data.length * 30);
    const p = new Float32Array(N * 3);
    const c = new Float32Array(N * 3);
    const s = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const d = data[i % Math.max(1, data.length)];
      const t = d ? d.value / max : Math.random();
      const r = 2 + t * 4 + (Math.random() - 0.5) * 0.6;
      const u = Math.random() * 2 - 1;
      const phi = Math.random() * Math.PI * 2;
      const sq = Math.sqrt(1 - u * u);
      p[i*3]   = r * sq * Math.cos(phi);
      p[i*3+1] = r * u;
      p[i*3+2] = r * sq * Math.sin(phi);
      const col = colorFor(t);
      c[i*3] = col.r; c[i*3+1] = col.g; c[i*3+2] = col.b;
      s[i] = 0.04 + t * 0.1;
    }
    return { positions: p, colors: c, sizes: s };
  }, [data]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.2; });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial size={0.09} vertexColors sizeAttenuation transparent opacity={0.95} />
    </points>
  );
}

function Helix({ data }: { data: Datum[] }) {
  const grp = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { if (grp.current) grp.current.rotation.y += dt * 0.4; });
  const max = Math.max(1, ...data.map((d) => d.value));
  const items = data.slice(0, 80).map((d, i) => {
    const a = (i / 12) * Math.PI;
    const y = i * 0.18 - 4;
    const r = 2.5 + (d.value / max) * 1.4;
    return { x: Math.cos(a) * r, y, z: Math.sin(a) * r, c: colorFor(d.value / max), s: 0.18 + (d.value / max) * 0.25 };
  });
  return (
    <group ref={grp}>
      {items.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <icosahedronGeometry args={[p.s, 1]} />
          <meshStandardMaterial color={p.c} emissive={p.c} emissiveIntensity={1} metalness={0.6} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function Ribbon({ data }: { data: Datum[] }) {
  const ref = useRef<THREE.Mesh>(null!);
  const geom = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value));
    const N = data.length;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / Math.max(1, N - 1);
      const x = (t - 0.5) * 10;
      const y = (data[i].value / max) * 3.5 - 1;
      const z = Math.sin(t * Math.PI * 3) * 1.5;
      pts.push(new THREE.Vector3(x, y, z));
    }
    if (pts.length < 2) pts.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0));
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 200, 0.18, 16, false);
  }, [data]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.25; });
  return (
    <mesh ref={ref} geometry={geom}>
      <meshStandardMaterial color="#c25cff" emissive="#7c5cff" emissiveIntensity={1.3} metalness={0.7} roughness={0.15} />
    </mesh>
  );
}

function Rings({ data }: { data: Datum[] }) {
  const grp = useRef<THREE.Group>(null!);
  useFrame((_, dt) => { if (grp.current) grp.current.rotation.z += dt * 0.15; });
  const max = Math.max(1, ...data.map((d) => d.value));
  const items = data.slice(0, 12).map((d, i) => ({
    r: 1 + i * 0.4,
    c: colorFor(d.value / max),
    tilt: (i % 2 === 0 ? 1 : -1) * (Math.PI / 5),
    op: 0.3 + (d.value / max) * 0.6,
  }));
  return (
    <group ref={grp}>
      {items.map((p, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + p.tilt * 0.3, 0, p.tilt]}>
          <torusGeometry args={[p.r, 0.05, 16, 96]} />
          <meshStandardMaterial color={p.c} emissive={p.c} emissiveIntensity={1.2} transparent opacity={p.op} />
        </mesh>
      ))}
    </group>
  );
}

function Spheres({ data }: { data: Datum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const items = data.slice(0, 30).map((d, i) => {
    const a = (i / 30) * Math.PI * 2;
    const r = 3 + (i % 3) * 1.2;
    const t = d.value / max;
    return { x: Math.cos(a) * r, y: Math.sin(i * 0.6) * 1.4, z: Math.sin(a) * r, s: 0.25 + t * 0.7, c: colorFor(t) };
  });
  return (
    <group>
      {items.map((b, i) => (
        <Float key={i} speed={1.2 + (i % 5) * 0.1} rotationIntensity={0.4} floatIntensity={0.8}>
          <mesh position={[b.x, b.y, b.z]}>
            <sphereGeometry args={[b.s, 32, 32]} />
            <meshStandardMaterial color={b.c} emissive={b.c} emissiveIntensity={0.7} metalness={0.6} roughness={0.2} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Tower({ data }: { data: Datum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const items = data.slice(0, 30).map((d, i) => ({
    y: i * 0.4 - 3,
    s: 0.5 + (d.value / max) * 2,
    c: colorFor(d.value / max),
  }));
  return (
    <group>
      {items.map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]} rotation={[0, i * 0.4, 0]}>
          <boxGeometry args={[b.s, 0.3, b.s]} />
          <meshStandardMaterial color={b.c} emissive={b.c} emissiveIntensity={0.6} metalness={0.7} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/* ──── main canvas ──── */

export function Viz3D({ data, type = "bars" }: { data: Datum[]; type?: Viz3DType }) {
  const cam: [number, number, number] =
    type === "tower"  ? [10, 0, 10] :
    type === "helix"  ? [10, 2, 10] :
    type === "rings"  ? [0, 8, 10]  :
                        [8, 8, 8];

  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-border bg-background relative">
      <Canvas camera={{ position: cam, fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={["#07061a"]} />
        <fog attach="fog" args={["#07061a", 14, 32]} />
        <ambientLight intensity={0.35} />
        <pointLight position={[10, 10, 10]} intensity={1.4} color="#c25cff" />
        <pointLight position={[-10, 5, -10]} intensity={1.0} color="#5cd0ff" />
        <Stars radius={50} depth={30} count={1500} factor={2} fade speed={0.4} />
        <DreiSparkles count={120} scale={14} size={2.5} speed={0.4} color="#a78bff" />
        <gridHelper args={[20, 20, "#3a2f6a", "#1f1a3a"]} position={[0, type === "tower" ? -3.2 : -0.01, 0]} />

        {type === "bars"        && <Bars data={data} />}
        {type === "skyline"     && <Skyline data={data} />}
        {type === "sphereCloud" && <SphereCloud data={data} />}
        {type === "helix"       && <Helix data={data} />}
        {type === "ribbon"      && <Ribbon data={data} />}
        {type === "rings"       && <Rings data={data} />}
        {type === "spheres"     && <Spheres data={data} />}
        {type === "tower"       && <Tower data={data} />}

        <Html position={[0, type === "tower" ? 5.5 : 5, 0]} center style={{ pointerEvents: "none" }}>
          <div className="px-2 py-1 rounded-md border border-primary/40 bg-background/70 backdrop-blur text-[9px] uppercase tracking-[0.3em] text-primary whitespace-nowrap">
            WebGL · {type}
          </div>
        </Html>

        <OrbitControls enablePan autoRotate autoRotateSpeed={0.7} maxDistance={22} minDistance={3} />
      </Canvas>
    </div>
  );
}