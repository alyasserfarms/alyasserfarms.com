"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import type { Plot } from "@/data/planning-demo";
import { cropOptions } from "@/data/planning-demo";

const fieldWidth = 10;
const fieldDepth = 6.6;

function Plant({ kind, x, z, scale = 1 }: { kind: string; x: number; z: number; scale?: number }) {
  if (kind === "empty") return null;
  if (kind === "palms" || kind === "olive" || kind === "citrus") return <group position={[x, 0, z]} scale={scale}><mesh position={[0,.48,0]}><cylinderGeometry args={[.06,.1,.95,6]} /><meshStandardMaterial color="#875c35" /></mesh>{kind === "palms" ? <><mesh position={[0,1.04,0]}><coneGeometry args={[.38,.54,7]} /><meshStandardMaterial color="#315e35" /></mesh><mesh position={[0,.82,0]} rotation={[0,.5,0]}><coneGeometry args={[.31,.38,7]} /><meshStandardMaterial color="#4c8c43" /></mesh></> : <mesh position={[0,1.02,0]}><sphereGeometry args={[.4,8,6]} /><meshStandardMaterial color={kind === "olive" ? "#687d51" : "#4f8c46"} /></mesh>}{kind === "citrus" && <mesh position={[.2,.92,.24]}><sphereGeometry args={[.08,7,5]} /><meshStandardMaterial color="#e6a43b" /></mesh>}</group>;
  if (["tomato","potato","vegetables","pepper","cucumber","zucchini","eggplant"].includes(kind)) return <group position={[x,0,z]} scale={scale}><mesh position={[0,.19,0]}><sphereGeometry args={[.24,7,5]} /><meshStandardMaterial color="#4b8741" /></mesh>{["tomato","pepper","eggplant","cucumber"].includes(kind) && <mesh position={[.16,.14,.09]}><sphereGeometry args={[.085,6,5]} /><meshStandardMaterial color={kind === "eggplant" ? "#604872" : kind === "cucumber" ? "#437746" : "#ba533b"} /></mesh>}</group>;
  if (kind === "clover") return <group position={[x,0,z]} scale={scale}><mesh position={[0,.13,0]}><sphereGeometry args={[.24,7,5]} /><meshStandardMaterial color="#4d9345" /></mesh><mesh position={[.12,.13,.08]}><sphereGeometry args={[.15,7,5]} /><meshStandardMaterial color="#72b158" /></mesh></group>;
  if (kind === "onion") return <group position={[x,0,z]} scale={scale}><mesh position={[0,.18,0]}><coneGeometry args={[.12,.38,5]} /><meshStandardMaterial color="#5b9c50" /></mesh></group>;
  if (kind === "corn") return <group position={[x,0,z]} scale={scale}><mesh position={[0,.32,0]}><cylinderGeometry args={[.025,.04,.65,5]} /><meshStandardMaterial color="#4a7839" /></mesh><mesh position={[.1,.38,0]} rotation={[0,0,-.5]}><coneGeometry args={[.14,.4,5]} /><meshStandardMaterial color="#74a94c" /></mesh><mesh position={[0,.7,0]}><coneGeometry args={[.08,.25,5]} /><meshStandardMaterial color="#bda45e" /></mesh></group>;
  return <group position={[x,0,z]} scale={scale}><mesh position={[0,.23,0]}><cylinderGeometry args={[.016,.025,.46,5]} /><meshStandardMaterial color={kind === "wheat" ? "#b18b45" : "#4f8c47"} /></mesh><mesh position={[0,.5,0]}><coneGeometry args={[kind === "wheat" ? .085 : .055,.25,5]} /><meshStandardMaterial color={kind === "wheat" ? "#e6bd62" : "#8dbb62"} /></mesh></group>;
}

function Field({ plot, selected, onSelect }: { plot: Plot; selected: boolean; onSelect: (id: string) => void }) {
  const x = (plot.x + plot.width / 2 - 50) / 100 * fieldWidth;
  const z = (plot.y + plot.height / 2 - 50) / 100 * fieldDepth;
  const w = plot.width / 100 * fieldWidth;
  const d = plot.height / 100 * fieldDepth;
  const option = cropOptions.find(item => item.name === plot.crop);
  const kind = option?.kind ?? "vegetables";
  const plants = useMemo(() => {
    const tree = ["palms","olive","citrus"].includes(kind);
    const cols = tree ? 3 : Math.max(3, Math.min(9, Math.floor(w / .45)));
    const rows = tree ? 2 : Math.max(2, Math.min(6, Math.floor(d / .5)));
    return Array.from({ length: cols * rows }, (_, i) => ({ x: (i % cols + .5) / cols * w - w / 2, z: (Math.floor(i / cols) + .5) / rows * d - d / 2 }));
  }, [w,d,kind]);
  return <group position={[x,0,z]} onClick={event => { event.stopPropagation(); onSelect(plot.id); }}>
    <mesh position={[0,.035,0]}><boxGeometry args={[w,.1,d]} /><meshStandardMaterial color={kind === "rice" ? "#648f6d" : kind === "empty" ? "#9c7954" : "#654c34"} /></mesh>
    <mesh position={[0,.095,0]}><boxGeometry args={[w,.012,d]} /><meshStandardMaterial color={selected ? "#dfb95b" : "#b6a074"} wireframe /></mesh>
    {plants.map((plant,index) => <Plant key={index} kind={kind} x={plant.x} z={plant.z} scale={["palms","olive","citrus"].includes(kind) ? .85 : .7} />)}
  </group>;
}

export default function Farm3D({ plots, selected, angle, onSelect }: { plots: Plot[]; selected: string; angle: number; onSelect: (id: string) => void }) {
  return <Canvas dpr={[1,1.5]} camera={{ position: [6.5,7.5,8.5], fov: 38 }} gl={{ antialias: true, powerPreference: "low-power" }} fallback={<div aria-hidden="true">العرض الثلاثي غير متاح على هذا الجهاز؛ استخدم وضع المخطط.</div>}>
    <color attach="background" args={["#dce8d2"]} />
    <ambientLight intensity={2.2} />
    <directionalLight position={[4,10,6]} intensity={2.5} />
    <group rotation={[0,angle,0]}>
      <mesh position={[0,-.16,0]}><boxGeometry args={[11,.28,7.6]} /><meshStandardMaterial color="#786748" /></mesh>
      <mesh position={[0,-.03,0]}><boxGeometry args={[10.4,.1,7]} /><meshStandardMaterial color="#b3aa79" /></mesh>
      {plots.map(plot => <Field key={plot.id} plot={plot} selected={selected === plot.id} onSelect={onSelect} />)}
    </group>
    <OrbitControls enablePan={false} enableDamping minDistance={9} maxDistance={23} minPolarAngle={.25} maxPolarAngle={1.35} target={[0,0,0]} />
  </Canvas>;
}
