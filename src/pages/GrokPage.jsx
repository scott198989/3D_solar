import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Html,
  OrbitControls,
  Stars,
  useTexture,
} from "@react-three/drei";
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import "./GrokPage.css";

/* ─── Data ─── */

const TEX = "https://threejs.org/examples/textures/planets";

const SCALE_MODES = {
  cinematic: { distance: 1, size: 1 },
  orbital: { distance: 1.8, size: 0.52 },
  trueSize: { distance: 2.35, size: 0.2 },
};

const SUN = {
  id: "sun",
  name: "Sun",
  radius: 2.6,
  color: "#ffcc55",
  emissive: "#ff9920",
  description:
    "A G-type star containing 99.86% of the Solar System's mass, powering fusion that sustains life on Earth.",
  facts: [
    ["Type", "G-type main-sequence"],
    ["Diameter", "1.39 million km"],
    ["Surface temp", "~5,500 °C"],
    ["Age", "~4.6 billion years"],
  ],
};

const PLANETS = [
  {
    id: "mercury",
    name: "Mercury",
    color: "#b8b2a8",
    radius: 0.2,
    orbit: 5.2,
    period: 0.24,
    spin: 58.6,
    description: "Closest to the Sun, with extreme temperatures and a cratered, airless surface.",
    facts: [["Diameter", "4,879 km"], ["Year", "88 Earth days"], ["Moons", "0"]],
  },
  {
    id: "venus",
    name: "Venus",
    color: "#e6d0a0",
    radius: 0.36,
    orbit: 7.4,
    period: 0.62,
    spin: -243,
    atmosphere: "#f2e2b0",
    description: "Thick CO₂ atmosphere creates a runaway greenhouse and surface pressure 92× Earth's.",
    facts: [["Diameter", "12,104 km"], ["Day", "243 days (retrograde)"], ["Moons", "0"]],
  },
  {
    id: "earth",
    name: "Earth",
    color: "#4a8ec4",
    radius: 0.38,
    orbit: 9.8,
    period: 1,
    spin: 1,
    texture: `${TEX}/earth_atmos_2048.jpg`,
    atmosphere: "#70b8ff",
    moons: [{ name: "Moon", radius: 0.1, orbit: 0.85, period: 0.07, texture: `${TEX}/moon_1024.jpg` }],
    description: "The only known world with liquid surface water, a magnetic field, and life.",
    facts: [["Diameter", "12,742 km"], ["Year", "365.25 days"], ["Moons", "1"]],
  },
  {
    id: "mars",
    name: "Mars",
    color: "#c1442e",
    radius: 0.26,
    orbit: 13,
    period: 1.88,
    spin: 1.03,
    atmosphere: "#e09080",
    moons: [
      { name: "Phobos", radius: 0.035, orbit: 0.5, period: 0.03 },
      { name: "Deimos", radius: 0.028, orbit: 0.78, period: 0.05 },
    ],
    description: "The red planet with Olympus Mons and polar ice caps—humanity's next frontier.",
    facts: [["Diameter", "6,779 km"], ["Year", "687 Earth days"], ["Moons", "2"]],
  },
  {
    id: "jupiter",
    name: "Jupiter",
    color: "#d4a060",
    radius: 1.1,
    orbit: 20,
    period: 11.86,
    spin: 0.41,
    atmosphere: "#e8c898",
    moons: [
      { name: "Io", radius: 0.1, orbit: 1.55, period: 0.06 },
      { name: "Europa", radius: 0.095, orbit: 1.95, period: 0.08 },
      { name: "Ganymede", radius: 0.12, orbit: 2.4, period: 0.1 },
      { name: "Callisto", radius: 0.11, orbit: 2.9, period: 0.12 },
    ],
    description: "Largest planet—a gas giant whose Great Red Spot could swallow Earth whole.",
    facts: [["Diameter", "139,820 km"], ["Year", "11.9 Earth years"], ["Moons", "95+"]],
  },
  {
    id: "saturn",
    name: "Saturn",
    color: "#e8d0a0",
    radius: 0.95,
    orbit: 28,
    period: 29.46,
    spin: 0.45,
    ring: true,
    atmosphere: "#f0e4c8",
    moons: [{ name: "Titan", radius: 0.12, orbit: 2.05, period: 0.09 }],
    description: "Famous for its spectacular ring system sculpted by gravity and shepherd moons.",
    facts: [["Diameter", "116,460 km"], ["Year", "29.5 Earth years"], ["Moons", "146+"]],
  },
  {
    id: "uranus",
    name: "Uranus",
    color: "#9ad8ec",
    radius: 0.68,
    orbit: 36,
    period: 84,
    spin: -0.72,
    ring: true,
    tilt: 1.4,
    atmosphere: "#b0e8f8",
    moons: [{ name: "Titania", radius: 0.075, orbit: 1.3, period: 0.07 }],
    description: "Ice giant tipped on its side, with faint rings and a methane-tinted cyan hue.",
    facts: [["Diameter", "50,724 km"], ["Year", "84 Earth years"], ["Moons", "28"]],
  },
  {
    id: "neptune",
    name: "Neptune",
    color: "#4a78e8",
    radius: 0.66,
    orbit: 44,
    period: 164.8,
    spin: 0.67,
    atmosphere: "#5888f0",
    moons: [{ name: "Triton", radius: 0.09, orbit: 1.4, period: -0.06 }],
    description: "Deep blue ice giant with the fastest winds in the Solar System.",
    facts: [["Diameter", "49,244 km"], ["Year", "165 Earth years"], ["Moons", "16"]],
  },
];

const EXTRAS = [
  {
    id: "ceres",
    name: "Ceres",
    color: "#9a9088",
    radius: 0.09,
    orbit: 15,
    period: 4.6,
    spin: 0.38,
    dwarf: true,
    description: "Largest body in the asteroid belt and the only dwarf planet in the inner system.",
    facts: [["Diameter", "939 km"], ["Class", "Dwarf planet"], ["Region", "Asteroid belt"]],
  },
  {
    id: "pluto",
    name: "Pluto",
    color: "#c8b8a8",
    radius: 0.11,
    orbit: 52,
    period: 247.9,
    spin: -6.39,
    dwarf: true,
    moons: [{ name: "Charon", radius: 0.07, orbit: 0.4, period: 0.05 }],
    description: "Kuiper belt dwarf planet with nitrogen plains and a binary dance with Charon.",
    facts: [["Diameter", "2,377 km"], ["Class", "Dwarf planet"], ["Region", "Kuiper belt"]],
  },
];

const TOUR = ["sun", ...PLANETS.map((p) => p.id), "asteroid-belt", "pluto"];

const ALL_BODIES = [
  SUN,
  ...PLANETS,
  ...EXTRAS,
  {
    id: "asteroid-belt",
    name: "Asteroid Belt",
    color: "#8a8078",
    description: "Millions of rocky remnants between Mars and Jupiter from the early Solar System.",
    facts: [["Location", "Mars–Jupiter"], ["Largest", "Ceres"], ["Origin", "Planetesimals"]],
  },
];

function getBody(id) {
  return ALL_BODIES.find((b) => b.id === id) ?? null;
}

function scaleOrbit(r, mode) {
  return r * (SCALE_MODES[mode]?.distance ?? 1);
}

function scaleSize(r, mode) {
  return r * (SCALE_MODES[mode]?.size ?? 1);
}

/* ─── Simulation context ─── */

const SimCtx = createContext(null);

function SimProvider({ children }) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [scaleMode, setScaleMode] = useState("cinematic");
  const [showLabels, setShowLabels] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [tourIdx, setTourIdx] = useState(-1);
  const positions = useRef(new Map());
  const elapsed = useRef(0);

  const register = useCallback((id, vec) => {
    positions.current.set(id, vec);
  }, []);

  const getPos = useCallback((id) => positions.current.get(id), []);

  const value = useMemo(
    () => ({
      playing,
      setPlaying,
      speed,
      setSpeed,
      scaleMode,
      setScaleMode,
      showLabels,
      setShowLabels,
      showOrbits,
      setShowOrbits,
      selectedId,
      setSelectedId,
      focusId,
      setFocusId,
      tourIdx,
      setTourIdx,
      register,
      getPos,
      elapsed,
    }),
    [
      playing,
      speed,
      scaleMode,
      showLabels,
      showOrbits,
      selectedId,
      focusId,
      tourIdx,
      register,
      getPos,
    ],
  );

  return <SimCtx.Provider value={value}>{children}</SimCtx.Provider>;
}

function useSim() {
  const ctx = useContext(SimCtx);
  if (!ctx) throw new Error("useSim");
  return ctx;
}

function SimulationClock() {
  const { playing, speed, elapsed } = useSim();
  useFrame((_, delta) => {
    if (playing) elapsed.current += delta * speed;
  });
  return null;
}

/* ─── 3D helpers ─── */

function BodyLabel({ name, isSun }) {
  return (
    <Html center distanceFactor={28} zIndexRange={[0, 0]}>
      <span className={`grok-label-3d${isSun ? " grok-label-3d--sun" : ""}`}>{name}</span>
    </Html>
  );
}

function OrbitLine({ radius, color = "#88f0ba" }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [points]);

  return (
    <line geometry={geom}>
      <lineBasicMaterial color={color} transparent opacity={0.22} />
    </line>
  );
}

function TexturedSphere({ texture, color, radius }) {
  const map = useTexture(texture);
  return (
    <mesh>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial map={map} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

function PlanetMesh({ body, scaleMode, onSelect }) {
  const group = useRef();
  const mesh = useRef();
  const { elapsed, register, showLabels, selectedId } = useSim();
  const orbitR = scaleOrbit(body.orbit ?? 0, scaleMode);
  const size = scaleSize(body.radius, scaleMode);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(() => {
    if (!group.current || body.orbit == null) return;
    const t = elapsed.current;
    const angle = (t / Math.max(body.period, 0.1)) * Math.PI * 2 + phase;
    group.current.position.set(Math.cos(angle) * orbitR, 0, Math.sin(angle) * orbitR);
    register(body.id, group.current.position);
    if (mesh.current) mesh.current.rotation.y += 0.008 * Math.sign(body.spin ?? 1);
  });

  const selected = selectedId === body.id;
  const hasTexture = Boolean(body.texture);

  const sphere = hasTexture ? (
    <Suspense fallback={
      <mesh ref={mesh}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={body.color} />
      </mesh>
    }>
      <group ref={mesh}>
        <TexturedSphere texture={body.texture} color={body.color} radius={size} />
      </group>
    </Suspense>
  ) : (
    <mesh ref={mesh} castShadow receiveShadow>
      <sphereGeometry args={[size, 40, 40]} />
      <meshStandardMaterial
        color={body.color}
        roughness={0.75}
        metalness={body.dwarf ? 0.1 : 0.15}
        emissive={selected ? body.color : "#000000"}
        emissiveIntensity={selected ? 0.35 : 0}
      />
    </mesh>
  );

  return (
    <group ref={group}>
      {body.tilt != null && (
        <group rotation={[body.tilt, 0, 0]}>
          {sphere}
        </group>
      )}
      {body.tilt == null && sphere}

      {body.atmosphere && (
        <mesh scale={1.12}>
          <sphereGeometry args={[size, 32, 32]} />
          <meshBasicMaterial
            color={body.atmosphere}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>
      )}

      {body.ring && (
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[size * 1.35, size * 2.1, 64]} />
          <meshBasicMaterial
            color="#e8dcc0"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {body.moons?.map((moon, i) => (
        <Moon key={moon.name + i} moon={moon} parentSize={size} />
      ))}

      <mesh
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(body.id);
        }}
      >
        <sphereGeometry args={[size * 1.35, 16, 16]} />
      </mesh>

      {showLabels && <BodyLabel name={body.name} />}
    </group>
  );
}

function Moon({ moon, parentSize }) {
  const ref = useRef();
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const { elapsed } = useSim();
  const r = moon.radius * parentSize * 2.2;
  const dist = moon.orbit * parentSize * 2.5;

  useFrame(() => {
    if (!ref.current) return;
    const t = elapsed.current;
    const angle = (t / Math.max(Math.abs(moon.period), 0.02)) * Math.PI * 2 * Math.sign(moon.period) + phase;
    ref.current.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
  });

  const inner = moon.texture ? (
    <Suspense fallback={
      <mesh>
        <sphereGeometry args={[r, 16, 16]} />
        <meshStandardMaterial color="#aaa" />
      </mesh>
    }>
      <TexturedMoon texture={moon.texture} radius={r} />
    </Suspense>
  ) : (
    <mesh>
      <sphereGeometry args={[r, 16, 16]} />
      <meshStandardMaterial color="#bbb" roughness={0.9} />
    </mesh>
  );

  return <group ref={ref}>{inner}</group>;
}

function TexturedMoon({ texture, radius }) {
  const map = useTexture(texture);
  return (
    <mesh>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  );
}

function SunMesh({ scaleMode, onSelect }) {
  const ref = useRef();
  const glow = useRef();
  const { elapsed, register, showLabels, selectedId } = useSim();
  const size = scaleSize(SUN.radius, scaleMode);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.04;
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(elapsed.current * 2) * 0.04 + 1.02);
    register("sun", new THREE.Vector3(0, 0, 0));
  });

  return (
    <group>
      <mesh ref={glow}>
        <sphereGeometry args={[size * 1.35, 32, 32]} />
        <meshBasicMaterial color="#ffaa44" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect("sun");
        }}
      >
        <sphereGeometry args={[size, 48, 48]} />
        <meshStandardMaterial
          color={SUN.color}
          emissive={SUN.emissive}
          emissiveIntensity={selectedId === "sun" ? 2.2 : 1.6}
          roughness={0.4}
        />
      </mesh>
      <pointLight intensity={4} distance={200} decay={1.2} color="#fff4e0" />
      <pointLight intensity={1.2} distance={120} decay={1.5} color="#88bbff" position={[30, 20, -20]} />
      {showLabels && <BodyLabel name="Sun" isSun />}
    </group>
  );
}

function AsteroidBelt({ scaleMode }) {
  const group = useRef();
  const meshes = useRef([]);
  const { elapsed, register } = useSim();
  const count = 320;
  const inner = scaleOrbit(14.5, scaleMode);
  const outer = scaleOrbit(17.5, scaleMode);

  const asteroids = useMemo(() => {
    return Array.from({ length: count }, () => {
      const a = Math.random() * Math.PI * 2;
      const r = inner + Math.random() * (outer - inner);
      return {
        r,
        y: (Math.random() - 0.5) * 0.4,
        speed: 0.1 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        size: 0.025 + Math.random() * 0.06,
      };
    });
  }, [inner, outer, count]);

  useFrame(() => {
    const t = elapsed.current;
    asteroids.forEach((ast, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const angle = t * ast.speed + ast.phase;
      m.position.set(Math.cos(angle) * ast.r, ast.y, Math.sin(angle) * ast.r);
    });
    register("asteroid-belt", new THREE.Vector3((inner + outer) / 2, 0, 0));
  });

  return (
    <group ref={group}>
      {asteroids.map((ast, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el;
          }}
          position={[
            Math.cos(ast.phase) * ast.r,
            ast.y,
            Math.sin(ast.phase) * ast.r,
          ]}
        >
          <dodecahedronGeometry args={[ast.size, 0]} />
          <meshStandardMaterial color="#7a7068" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig() {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls);
  const { focusId, getPos, tourIdx, setFocusId } = useSim();
  const target = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3(0, 28, 52));

  useEffect(() => {
    if (tourIdx >= 0) setFocusId(TOUR[tourIdx]);
  }, [tourIdx, setFocusId]);

  useFrame(() => {
    if (!controls) return;
    let focus = focusId;
    if (focus === "asteroid-belt") {
      target.current.set(16, 4, 0);
    } else if (focus) {
      const p = getPos(focus);
      if (p) target.current.copy(p);
      else if (focus === "sun") target.current.set(0, 0, 0);
    }

    if (focus) {
      const dist = focus === "sun" ? 14 : focus === "jupiter" || focus === "saturn" ? 10 : 6;
      desired.current.set(
        target.current.x + dist * 0.6,
        target.current.y + dist * 0.45,
        target.current.z + dist,
      );
      camera.position.lerp(desired.current, 0.04);
      controls.target.lerp(target.current, 0.06);
      controls.update();
    }
  });

  return null;
}

function SolarScene() {
  const {
    scaleMode,
    showOrbits,
    setSelectedId,
    setFocusId,
  } = useSim();

  const select = useCallback(
    (id) => {
      setSelectedId(id);
      setFocusId(id);
    },
    [setSelectedId, setFocusId],
  );

  return (
    <>
      <color attach="background" args={["#020408"]} />
      <fog attach="fog" args={["#020408", 80, 140]} />
      <ambientLight intensity={0.08} />
      <Stars radius={120} depth={60} count={8000} factor={3} saturation={0.15} fade speed={0.3} />

      <SunMesh scaleMode={scaleMode} onSelect={select} />

      {PLANETS.map((p) => (
        <group key={p.id}>
          {showOrbits && (
            <OrbitLine radius={scaleOrbit(p.orbit, scaleMode)} color="#88f0ba" />
          )}
          <PlanetMesh body={p} scaleMode={scaleMode} onSelect={select} />
        </group>
      ))}

      {EXTRAS.map((p) => (
        <group key={p.id}>
          {showOrbits && p.orbit && (
            <OrbitLine
              radius={scaleOrbit(p.orbit, scaleMode)}
              color={p.dwarf ? "#a09088" : "#88f0ba"}
            />
          )}
          <PlanetMesh body={p} scaleMode={scaleMode} onSelect={select} />
        </group>
      ))}

      <AsteroidBelt scaleMode={scaleMode} />

      <SimulationClock />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={2}
        maxDistance={95}
        rotateSpeed={0.5}
        zoomSpeed={0.85}
        maxPolarAngle={Math.PI / 2 + 0.15}
      />
      <CameraRig />
    </>
  );
}

/* ─── HUD ─── */

function GrokHud() {
  const sim = useSim();
  const body = sim.selectedId ? getBody(sim.selectedId) : null;

  useEffect(() => {
    if (sim.tourIdx < 0) return undefined;
    const id = TOUR[sim.tourIdx];
    sim.setFocusId(id);
    sim.setSelectedId(id);
    const timer = window.setInterval(() => {
      sim.setTourIdx((i) => (i + 1) % TOUR.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [sim.tourIdx, sim.setFocusId, sim.setSelectedId, sim.setTourIdx]);

  const pick = (id) => {
    sim.setSelectedId(id);
    sim.setFocusId(id);
  };

  return (
    <div className="grok-experience__hud">
      <aside className="grok-panel grok-controls">
        <h2>Flight deck</h2>
        <div className="grok-btn-row">
          <button
            type="button"
            className="grok-btn grok-btn--icon"
            onClick={() => sim.setPlaying(!sim.playing)}
            aria-label={sim.playing ? "Pause" : "Play"}
          >
            {sim.playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          {[0.25, 1, 5, 15].map((s) => (
            <button
              key={s}
              type="button"
              className={`grok-btn${sim.speed === s ? " is-active" : ""}`}
              onClick={() => sim.setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
        <div className="grok-field">
          <label>
            <span>Simulation speed</span>
            <span>{sim.speed.toFixed(2)}×</span>
          </label>
          <input
            type="range"
            min={0}
            max={20}
            step={0.25}
            value={sim.speed}
            onChange={(e) => sim.setSpeed(Number(e.target.value))}
          />
        </div>
        <div className="grok-btn-row">
          {Object.keys(SCALE_MODES).map((m) => (
            <button
              key={m}
              type="button"
              className={`grok-btn${sim.scaleMode === m ? " is-active" : ""}`}
              onClick={() => sim.setScaleMode(m)}
            >
              {m === "trueSize" ? "True" : m === "cinematic" ? "Cine" : "Orbit"}
            </button>
          ))}
        </div>
        <label className="grok-toggle">
          Show labels
          <input
            type="checkbox"
            checked={sim.showLabels}
            onChange={(e) => sim.showLabels(e.target.checked)}
          />
        </label>
        <label className="grok-toggle">
          Show orbits
          <input
            type="checkbox"
            checked={sim.showOrbits}
            onChange={(e) => sim.showOrbits(e.target.checked)}
          />
        </label>
        <div className="grok-btn-row">
          <button
            type="button"
            className="grok-btn"
            onClick={() => {
              sim.setTourIdx(0);
              sim.setPlaying(true);
            }}
          >
            Guided tour
          </button>
          <button
            type="button"
            className="grok-btn grok-btn--icon"
            onClick={() => {
              sim.setFocusId(null);
              sim.setSelectedId(null);
              sim.setTourIdx(-1);
            }}
            aria-label="Reset camera"
          >
            <RotateCcw size={15} />
          </button>
        </div>
        <div className="grok-body-list">
          {ALL_BODIES.filter((b) => b.orbit != null || b.id === "sun" || b.id === "asteroid-belt").map(
            (b) => (
              <button
                key={b.id}
                type="button"
                className={`grok-body-btn${sim.selectedId === b.id ? " is-selected" : ""}`}
                onClick={() => pick(b.id)}
              >
                <span className="grok-swatch" style={{ background: b.color ?? "#ffcc55" }} />
                {b.name}
              </button>
            ),
          )}
        </div>
      </aside>

      {body && (
        <aside className="grok-panel grok-info">
          <button
            type="button"
            className="grok-btn grok-btn--icon grok-info__close"
            onClick={() => {
              sim.setSelectedId(null);
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
          <h3>{body.name}</h3>
          <p className="grok-info__type">
            {body.id === "sun" ? "Star" : body.dwarf ? "Dwarf planet" : body.id === "asteroid-belt" ? "Region" : "Planet"}
          </p>
          <p>{body.description}</p>
          {body.facts && (
            <ul>
              {body.facts.map(([k, v]) => (
                <li key={k}>
                  <span>{k}</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      {sim.tourIdx >= 0 && (
        <div className="grok-panel grok-tour">
          <strong>Tour:</strong>
          <span>{getBody(TOUR[sim.tourIdx])?.name ?? TOUR[sim.tourIdx]}</span>
          <button
            type="button"
            className="grok-btn"
            onClick={() => sim.setTourIdx((i) => (i + 1) % TOUR.length)}
          >
            Next
          </button>
          <button type="button" className="grok-btn" onClick={() => sim.setTourIdx(-1)}>
            End
          </button>
        </div>
      )}

      <p className="grok-hint">Drag to orbit · Scroll to zoom · Click a body to inspect</p>
    </div>
  );
}

/* ─── Page ─── */

function GrokExperience() {
  return (
    <div className="grok-experience">
      <header className="grok-experience__header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link to="/" className="grok-experience__back">
            <ArrowLeft size={16} aria-hidden="true" />
            Arena
          </Link>
          <div className="grok-experience__title">
            <h1>Helios — Grok Solar System</h1>
            <p>Interactive 3D simulation · xAI</p>
          </div>
        </div>
        <span className="grok-experience__badge">
          <Sparkles size={14} aria-hidden="true" />
          Live simulation
        </span>
      </header>

      <div className="grok-experience__viewport">
        <Canvas
          className="grok-experience__canvas"
          camera={{ position: [0, 28, 52], fov: 50, near: 0.1, far: 200 }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onPointerMissed={() => {
            /* keep selection on miss — optional */
          }}
        >
          <Suspense fallback={null}>
            <SolarScene />
          </Suspense>
        </Canvas>
        <GrokHud />
      </div>
    </div>
  );
}

export default function GrokPage() {
  return (
    <SimProvider>
      <GrokExperience />
    </SimProvider>
  );
}