import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Html, Line, OrbitControls, Stars } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { orbitPathPoints, positionAtDay } from "./orbitMath.js";
import { AU_TO_SCENE_UNITS, solarBodies } from "./solarData.js";

const TAU = Math.PI * 2;

function makeTexture(body) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const palette = body.texture ?? [body.color, "#ffffff"];
  const gradient = context.createLinearGradient(0, 0, 512, 0);
  palette.forEach((color, index) => {
    gradient.addColorStop(index / Math.max(palette.length - 1, 1), color);
  });
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 256);

  let seed = body.id.length * 997;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  if (body.id === "jupiter" || body.id === "saturn") {
    for (let y = 0; y < 256; y += 1) {
      const wave = Math.sin(y * 0.11) * 18 + Math.sin(y * 0.037) * 32;
      context.fillStyle = `rgba(255,255,255,${0.04 + random() * 0.08})`;
      context.fillRect(0, y, 512, 1);
      context.fillStyle = `rgba(35,18,6,${0.04 + random() * 0.09})`;
      context.fillRect((wave + 512) % 512, y, 180 + random() * 180, 1);
    }
  } else {
    for (let index = 0; index < 1200; index += 1) {
      const radius = random() * 13 + 1;
      context.beginPath();
      context.fillStyle =
        body.id === "earth"
          ? random() > 0.54
            ? "rgba(110,180,96,0.66)"
            : "rgba(240,248,255,0.28)"
          : `rgba(255,255,255,${random() * 0.22})`;
      context.ellipse(random() * 512, random() * 256, radius * 1.8, radius, random() * TAU, 0, TAU);
      context.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function CameraFollow({ target }) {
  const controls = useRef(null);
  const targetVector = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();

  useFrame(() => {
    if (!controls.current) return;
    targetVector.set(target[0], target[1], target[2]);
    controls.current.target.lerp(targetVector, 0.055);
    controls.current.update();
  });

  useEffect(() => {
    camera.position.set(0, 42, 118);
  }, [camera]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.065}
      rotateSpeed={0.48}
      zoomSpeed={0.75}
      minDistance={5}
      maxDistance={310}
    />
  );
}

function Sun({ selected, onSelect }) {
  const group = useRef(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.045;
    }
  });

  return (
    <group ref={group}>
      <pointLight intensity={7.8} distance={340} decay={1.4} color="#ffd08a" />
      <mesh onClick={(event) => { event.stopPropagation(); onSelect("sun"); }}>
        <sphereGeometry args={[3.4, 96, 48]} />
        <meshBasicMaterial color="#ffce7a" />
      </mesh>
      <mesh scale={selected ? 1.42 : 1.28}>
        <sphereGeometry args={[3.4, 96, 48]} />
        <meshBasicMaterial
          color="#ff9b40"
          transparent
          opacity={selected ? 0.24 : 0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.92}>
        <sphereGeometry args={[3.4, 64, 32]} />
        <meshBasicMaterial
          color="#ffb347"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <BodyLabel name="Sun" visible selected={selected} position={[0, 4.6, 0]} />
    </group>
  );
}

function Planet({ body, simulationDay, selected, layers, onSelect }) {
  const group = useRef(null);
  const mesh = useRef(null);
  const texture = useMemo(() => makeTexture(body), [body]);
  const position = positionAtDay(body, simulationDay);
  const rotationSign = body.rotationDays < 0 ? -1 : 1;
  const rotationRate = Math.min(2.2, 1 / Math.max(Math.abs(body.rotationDays), 0.22));

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * rotationRate * rotationSign;
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh
        ref={mesh}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(body.id);
        }}
      >
        <sphereGeometry args={[body.visualRadius, 64, 32]} />
        <meshStandardMaterial
          map={texture}
          color="#ffffff"
          roughness={0.76}
          metalness={0.02}
          emissive={selected ? body.color : "#000000"}
          emissiveIntensity={selected ? 0.16 : 0}
        />
      </mesh>

      {layers.atmospheres && body.atmosphere && (
        <mesh scale={1.08}>
          <sphereGeometry args={[body.visualRadius, 64, 32]} />
          <meshBasicMaterial
            color={body.atmosphere}
            transparent
            opacity={selected ? 0.22 : 0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {body.ring && <Ring body={body} />}
      {body.moonSystem && <MoonSystem body={body} simulationDay={simulationDay} />}

      {selected && (
        <mesh scale={1.32}>
          <sphereGeometry args={[body.visualRadius, 48, 24]} />
          <meshBasicMaterial
            color={body.color}
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {layers.labels && (
        <BodyLabel
          name={body.name}
          visible={layers.labels}
          selected={selected}
          position={[0, body.visualRadius + 0.46, 0]}
        />
      )}
    </group>
  );
}

function Ring({ body }) {
  return (
    <mesh rotation={[Math.PI / 2.18, 0, body.id === "uranus" ? Math.PI / 2.7 : 0]}>
      <ringGeometry args={[body.ring.inner, body.ring.outer, 160]} />
      <meshBasicMaterial
        color={body.ring.color}
        side={THREE.DoubleSide}
        transparent
        opacity={body.id === "uranus" ? 0.22 : 0.4}
        depthWrite={false}
      />
    </mesh>
  );
}

function MoonSystem({ body, simulationDay }) {
  return (
    <group>
      {body.moonSystem.map((moon, index) => {
        const angle = (simulationDay / moon.periodDays) * TAU + index * 1.7;
        const x = Math.cos(angle) * moon.distance;
        const z = Math.sin(angle) * moon.distance;

        return (
          <group key={moon.name}>
            <mesh position={[x, Math.sin(angle * 0.4) * 0.05, z]}>
              <sphereGeometry args={[moon.radius, 24, 12]} />
              <meshStandardMaterial color={moon.color} roughness={0.9} />
            </mesh>
            <Line
              points={Array.from({ length: 80 }, (_, pointIndex) => {
                const orbitAngle = (pointIndex / 79) * TAU;
                return [
                  Math.cos(orbitAngle) * moon.distance,
                  0,
                  Math.sin(orbitAngle) * moon.distance,
                ];
              })}
              color="#ffffff"
              lineWidth={0.4}
              transparent
              opacity={0.17}
            />
          </group>
        );
      })}
    </group>
  );
}

function BodyLabel({ name, visible, selected, position }) {
  if (!visible) return null;

  return (
    <Billboard position={position}>
      <Html center distanceFactor={34} zIndexRange={[2, 1]} className="codex-space-label-wrap">
        <span className={selected ? "codex-space-label is-selected" : "codex-space-label"}>
          {name}
        </span>
      </Html>
    </Billboard>
  );
}

function OrbitPath({ body }) {
  const points = useMemo(() => orbitPathPoints(body, 360), [body]);
  return (
    <Line
      points={points}
      color={body.color}
      lineWidth={0.65}
      transparent
      opacity={body.id === "mercury" || body.id === "venus" ? 0.45 : 0.27}
    />
  );
}

function EclipticGrid() {
  const rings = [0.5, 1, 1.5, 2, 5, 10, 20, 30].map((au) =>
    Array.from({ length: 240 }, (_, index) => {
      const angle = (index / 239) * TAU;
      const radius = au * AU_TO_SCENE_UNITS;
      return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
    }),
  );

  const radialLines = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * TAU;
    return [
      [Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5],
      [Math.cos(angle) * 215, 0, Math.sin(angle) * 215],
    ];
  });

  return (
    <group>
      {rings.map((points, index) => (
        <Line key={`ring-${index}`} points={points} color="#6dbce9" lineWidth={0.35} transparent opacity={0.14} />
      ))}
      {radialLines.map((points, index) => (
        <Line key={`radial-${index}`} points={points} color="#ffffff" lineWidth={0.25} transparent opacity={0.08} />
      ))}
    </group>
  );
}

function HabitableZone() {
  const optimistic = useMemo(() => {
    const geometry = new THREE.RingGeometry(0.75 * AU_TO_SCENE_UNITS, 1.77 * AU_TO_SCENE_UNITS, 192);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);
  const conservative = useMemo(() => {
    const geometry = new THREE.RingGeometry(0.95 * AU_TO_SCENE_UNITS, 1.67 * AU_TO_SCENE_UNITS, 192);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);

  return (
    <group>
      <mesh geometry={optimistic}>
        <meshBasicMaterial color="#2bff9a" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh geometry={conservative}>
        <meshBasicMaterial color="#8dffc3" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function AsteroidBelt() {
  const geometry = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    let seed = 42;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let index = 0; index < count; index += 1) {
      const angle = random() * TAU;
      const au = 2.15 + random() * 1.28;
      const radius = au * AU_TO_SCENE_UNITS;
      const eccentricOffset = (random() - 0.5) * 2.2;
      positions[index * 3] = Math.cos(angle) * radius + eccentricOffset;
      positions[index * 3 + 1] = (random() - 0.5) * 0.9;
      positions[index * 3 + 2] = Math.sin(angle) * radius + eccentricOffset;
    }

    const points = new THREE.BufferGeometry();
    points.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return points;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#bca783" size={0.055} transparent opacity={0.42} sizeAttenuation />
    </points>
  );
}

function SceneContents({ simulationDay, selectedId, selectedPosition, layers, onSelectBody }) {
  return (
    <>
      <color attach="background" args={["#01030a"]} />
      <fog attach="fog" args={["#01030a", 90, 440]} />
      <ambientLight intensity={0.16} color="#8fc7ff" />
      <Stars radius={480} depth={96} count={9000} factor={4.4} saturation={0} fade speed={0.04} />
      <CameraFollow target={selectedPosition} />
      <Sun selected={selectedId === "sun"} onSelect={onSelectBody} />
      {layers.habitable && <HabitableZone />}
      {layers.grid && <EclipticGrid />}
      {layers.belt && <AsteroidBelt />}
      {layers.orbits &&
        solarBodies
          .filter((body) => body.orbit)
          .map((body) => <OrbitPath key={body.id} body={body} />)}
      {solarBodies
        .filter((body) => body.orbit)
        .map((body) => (
          <Planet
            key={body.id}
            body={body}
            simulationDay={simulationDay}
            selected={selectedId === body.id}
            layers={layers}
            onSelect={onSelectBody}
          />
        ))}
    </>
  );
}

export default function CodexScene({
  simulationDay,
  selectedId,
  selectedPosition,
  layers,
  onSelectBody,
}) {
  return (
    <Canvas
      camera={{ position: [0, 42, 118], fov: 47, near: 0.1, far: 650 }}
      dpr={[1, 1.8]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        alpha: false,
      }}
      onPointerMissed={() => onSelectBody("sun")}
    >
      <Suspense fallback={null}>
        <SceneContents
          simulationDay={simulationDay}
          selectedId={selectedId}
          selectedPosition={selectedPosition}
          layers={layers}
          onSelectBody={onSelectBody}
        />
      </Suspense>
    </Canvas>
  );
}
