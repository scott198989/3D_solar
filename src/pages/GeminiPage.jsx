import React, { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft, Sparkles, FastForward, Pause, Play, Info } from "lucide-react";
import { Link } from "react-router-dom";

// Solar System Data
const PLANETS = [
  { name: 'Mercury', radius: 0.4, distance: 12, speed: 0.04, color: '#b5a7a7', roughness: 0.8 },
  { name: 'Venus', radius: 0.9, distance: 18, speed: 0.015, color: '#e3bb76', roughness: 0.4 },
  { name: 'Earth', radius: 1, distance: 26, speed: 0.01, color: '#4b94f9', roughness: 0.6, hasMoon: true },
  { name: 'Mars', radius: 0.5, distance: 34, speed: 0.008, color: '#e27b58', roughness: 0.9 },
  { name: 'Jupiter', radius: 2.8, distance: 50, speed: 0.002, color: '#c8a885', roughness: 0.5 },
  { name: 'Saturn', radius: 2.3, distance: 68, speed: 0.0009, color: '#e3d5a2', roughness: 0.5, ringColor: '#c8b888' },
  { name: 'Uranus', radius: 1.6, distance: 84, speed: 0.0004, color: '#a0d8e0', roughness: 0.5, ringColor: '#ffffff' },
  { name: 'Neptune', radius: 1.5, distance: 98, speed: 0.0001, color: '#5b5ddf', roughness: 0.5 },
];

const PLANET_INFO = {
  Sun: "The star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, accounting for 99.86% of the mass in the Solar System.",
  Mercury: "The smallest planet in the Solar System and the closest to the Sun. Its surface is heavily cratered and similar in appearance to Earth's Moon.",
  Venus: "The second planet from the Sun. It is the hottest planet in our solar system, with surface temperatures hot enough to melt lead.",
  Earth: "Our home planet, the third from the Sun, and the only astronomical object known to harbor life. About 71% of its surface is covered with water.",
  Mars: "The fourth planet from the Sun, often called the 'Red Planet' due to the iron oxide prevalent on its surface, which gives it a reddish appearance.",
  Jupiter: "The largest planet in the Solar System. It's a gas giant whose mass is more than two and a half times that of all the other planets combined.",
  Saturn: "The sixth planet from the Sun, most famous for its stunning and complex ring system, which is composed mostly of ice particles.",
  Uranus: "The seventh planet from the Sun. It has a unique retrograde rotation and rotates on its side, likely due to a massive collision in its past.",
  Neptune: "The eighth and farthest-known planet from the Sun. It is a dark, cold, and very windy ice giant."
};

function Orbit({ distance }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance));
    }
    return pts;
  }, [distance]);

  return (
    <Line points={points} color="#ffffff" opacity={0.12} transparent lineWidth={1} />
  );
}

function Moon({ parentRadius }) {
  const moonRef = useRef();
  const orbitRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (orbitRef.current) orbitRef.current.rotation.y = t * 0.8;
    if (moonRef.current) moonRef.current.rotation.y = t;
  });

  return (
    <group ref={orbitRef}>
      <mesh ref={moonRef} position={[parentRadius + 1.5, 0, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#aaaaaa" roughness={1} />
      </mesh>
    </group>
  );
}

function Planet({ planet, setFocusedPlanet, focusedPlanet, timeScale }) {
  const ref = useRef();
  const orbitRef = useRef();
  const isFocused = focusedPlanet === planet.name;
  
  // We keep track of our own local angle so timeScale changes are smooth
  const currentAngle = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (!ref.current || !orbitRef.current) return;
    
    // Orbital rotation
    currentAngle.current += planet.speed * timeScale * delta * 50;
    orbitRef.current.rotation.y = currentAngle.current;
    
    // Self rotation
    ref.current.rotation.y += delta * timeScale * 1;
  });

  return (
    <group ref={orbitRef}>
      <group position={[planet.distance, 0, 0]}>
        <mesh 
          ref={ref} 
          onClick={(e) => {
            e.stopPropagation();
            setFocusedPlanet(planet.name);
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <sphereGeometry args={[planet.radius, 32, 32]} />
          <meshStandardMaterial 
            color={planet.color} 
            roughness={planet.roughness}
            metalness={0.1}
          />
        </mesh>

        {/* Rings */}
        {planet.name === 'Saturn' && (
          <mesh rotation={[Math.PI / 2 + 0.3, 0, 0]}>
            <ringGeometry args={[planet.radius * 1.4, planet.radius * 2.2, 64]} />
            <meshStandardMaterial color={planet.ringColor} transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        )}
        {planet.name === 'Uranus' && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.radius * 1.5, planet.radius * 1.6, 64]} />
            <meshStandardMaterial color={planet.ringColor} transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        )}

        {/* Moon */}
        {planet.hasMoon && <Moon parentRadius={planet.radius} />}

        {/* Label */}
        <Text
          position={[0, planet.radius + 1.5, 0]}
          fontSize={1.2}
          color={isFocused ? "#4bd5ff" : "white"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.15}
          outlineColor="#000000"
        >
          {planet.name}
        </Text>
      </group>
    </group>
  );
}

function Sun({ setFocusedPlanet, focusedPlanet, timeScale }) {
  const sunRef = useRef();
  const isFocused = focusedPlanet === 'Sun';

  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * timeScale * 0.2;
    }
  });

  return (
    <group 
      onClick={(e) => {
        e.stopPropagation();
        setFocusedPlanet('Sun');
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <mesh ref={sunRef}>
        <sphereGeometry args={[6, 64, 64]} />
        <meshBasicMaterial color="#ffcc00" />
      </mesh>
      {/* Sun glow effects */}
      <mesh>
        <sphereGeometry args={[7, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[9, 32, 32]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      
      {/* Sun Light Source */}
      <pointLight intensity={3.5} distance={300} decay={1.5} color="#fff1e0" />
      <ambientLight intensity={0.08} color="#404050" />
      
      <Text
        position={[0, 9, 0]}
        fontSize={2}
        color={isFocused ? "#4bd5ff" : "white"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.2}
        outlineColor="#000000"
      >
        Sun
      </Text>
    </group>
  );
}

export default function GeminiPage() {
  const [focusedPlanet, setFocusedPlanet] = useState(null);
  const [timeScale, setTimeScale] = useState(1);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#020204', position: 'relative', overflow: 'hidden' }}>
      
      {/* Left UI Panel */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8, color: '#f6f8fb', 
            textDecoration: 'none', background: 'rgba(255,255,255,0.08)', 
            padding: '10px 18px', borderRadius: 8, backdropFilter: 'blur(12px)',
            fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content'
          }}
        >
          <ArrowLeft size={16} /> Back to Arena
        </Link>
        
        <div style={{
          background: 'rgba(5, 7, 11, 0.85)', padding: '20px', borderRadius: 12,
          border: '1px solid rgba(75, 213, 255, 0.3)', backdropFilter: 'blur(12px)',
          color: 'white', fontFamily: 'system-ui, sans-serif', width: 320,
          boxShadow: '0 24px 50px rgba(0,0,0,0.5)'
        }}>
          <h1 style={{ margin: '0 0 12px 0', fontSize: '22px', display: 'flex', alignItems: 'center', gap: 10, color: '#4bd5ff' }}>
            <Sparkles size={22} /> Gemini Simulation
          </h1>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#aab4c0', lineHeight: 1.6 }}>
            Interactive 3D Solar System. Drag to orbit the sun, scroll to zoom. Click any celestial body to view details.
          </p>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button 
              onClick={() => setTimeScale(0)}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '10px', background: timeScale === 0 ? '#4bd5ff' : 'rgba(255,255,255,0.1)', color: timeScale === 0 ? '#000' : '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
            >
              <Pause size={16} /> Pause
            </button>
            <button 
              onClick={() => setTimeScale(1)}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '10px', background: timeScale === 1 ? '#4bd5ff' : 'rgba(255,255,255,0.1)', color: timeScale === 1 ? '#000' : '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
            >
              <Play size={16} /> Play
            </button>
            <button 
              onClick={() => setTimeScale(5)}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '10px', background: timeScale === 5 ? '#4bd5ff' : 'rgba(255,255,255,0.1)', color: timeScale === 5 ? '#000' : '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
            >
              <FastForward size={16} /> Fast
            </button>
          </div>
        </div>
      </div>

      {/* Right UI Panel - Info */}
      {focusedPlanet && (
        <div style={{
          position: 'absolute', top: 20, right: 20, zIndex: 10,
          background: 'rgba(5, 7, 11, 0.85)', padding: '24px', borderRadius: 12,
          border: '1px solid rgba(248, 178, 63, 0.4)', backdropFilter: 'blur(12px)',
          color: 'white', fontFamily: 'system-ui, sans-serif', width: 320,
          boxShadow: '0 24px 50px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#f8b23f', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={24} /> {focusedPlanet}
            </h2>
            <button 
              onClick={() => setFocusedPlanet(null)}
              style={{ background: 'transparent', border: 'none', color: '#aab4c0', cursor: 'pointer', fontSize: '18px' }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '15px', color: '#d1d8df', lineHeight: 1.6 }}>
            {PLANET_INFO[focusedPlanet]}
          </p>
          
          {focusedPlanet !== 'Sun' && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#aab4c0', fontSize: '13px' }}>Distance from Sun</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>
                  {PLANETS.find(p => p.name === focusedPlanet)?.distance.toFixed(1)} AU (scaled)
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#aab4c0', fontSize: '13px' }}>Relative Size</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>
                  {PLANETS.find(p => p.name === focusedPlanet)?.radius.toFixed(1)}x Earth
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3D Canvas Container */}
      <Suspense fallback={
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#4bd5ff', fontFamily: 'system-ui', fontSize: 20 }}>
          Initializing Universe...
        </div>
      }>
        <Canvas camera={{ position: [0, 60, 140], fov: 45 }} onPointerMissed={() => setFocusedPlanet(null)}>
          <color attach="background" args={['#020204']} />
          
          <Stars radius={200} depth={50} count={7000} factor={5} saturation={0} fade speed={1} />
          
          <Sun setFocusedPlanet={setFocusedPlanet} focusedPlanet={focusedPlanet} timeScale={timeScale} />
          
          {PLANETS.map((planet) => (
            <React.Fragment key={planet.name}>
              <Orbit distance={planet.distance} />
              <Planet 
                planet={planet} 
                focusedPlanet={focusedPlanet} 
                setFocusedPlanet={setFocusedPlanet} 
                timeScale={timeScale}
              />
            </React.Fragment>
          ))}

          <OrbitControls 
            makeDefault 
            minDistance={15} 
            maxDistance={350} 
            enablePan={false}
            zoomSpeed={1.2}
            rotateSpeed={0.8}
          />
        </Canvas>
      </Suspense>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
