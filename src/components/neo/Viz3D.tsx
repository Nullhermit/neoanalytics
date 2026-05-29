import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

export function Viz3D({ data }: { data: { name: string; value: number }[] }) {
  const bars = useMemo(() => {
    const max = Math.max(1, ...data.map((d) => d.value));
    return data.slice(0, 36).map((d, i) => {
      const h = (d.value / max) * 5;
      const x = (i % 6) * 1.4 - 3.5;
      const z = Math.floor(i / 6) * 1.4 - 3.5;
      const t = d.value / max;
      const color = new THREE.Color().setHSL(0.7 - t * 0.3, 0.85, 0.55);
      return { x, z, h, color, name: d.name };
    });
  }, [data]);

  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-border bg-background">
      <Canvas camera={{ position: [8, 8, 8], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#c25cff" />
        <pointLight position={[-10, 5, -10]} intensity={0.8} color="#5cd0ff" />
        <gridHelper args={[20, 20, "#3a2f6a", "#2a2548"]} />
        {bars.map((b, i) => (
          <mesh key={i} position={[b.x, b.h / 2, b.z]}>
            <boxGeometry args={[1, b.h, 1]} />
            <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
        <OrbitControls enablePan autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}