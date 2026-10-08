'use no memo';
// This file opts out of the React Compiler: react-three-fiber is driven by
// mutating Three.js objects inside useFrame from refs, which the compiler's
// purity rules (and its memoization) would fight. See the IMPORTANT note below.
/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/purity, react/no-unknown-property */
import { Canvas, useFrame, useLoader, type ThreeEvent } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

export type GlobeMarker = { code: string; lat: number; lng: number; count: number };

type Props = {
  markers: GlobeMarker[];
  selected: string | null;
  onSelect: (code: string) => void;
  height?: number;
  accentColor: string;
  selectedColor: string;
};

// IMPORTANT (lesson from the web prototype): never mutate Three.js objects
// from React state, effects, or event handlers. Everything that changes per
// frame lives in refs and is applied inside useFrame. Effects and gestures only
// write to refs.

const DEG = Math.PI / 180;
const RADIUS = 1;

/** Latitude/longitude to a point on the sphere, matching three's UV mapping. */
function toVector(lat: number, lng: number, r = RADIUS * 1.015) {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/** Rotation (x, y) that brings a lat/lng to the front of the globe. */
function facing(lat: number, lng: number) {
  const p = toVector(lat, lng, 1);
  return { x: lat * DEG, y: -Math.atan2(p.x, p.z) };
}

type Motion = {
  rotation: { x: number; y: number };
  target: { x: number; y: number } | null;
  idleUntil: number;
  selected: string | null;
};

function Earth({
  markers,
  motion,
  onSelect,
  accentColor,
  selectedColor,
}: Omit<Props, 'height' | 'selected'> & { motion: React.MutableRefObject<Motion> }) {
  // Bundled NASA Blue Marble texture (public domain); never fetched remotely.
  const texture = useLoader(THREE.TextureLoader, require('../../assets/textures/earth.jpg') as string);
  const group = useRef<THREE.Group>(null);
  const markerMeshes = useRef(new Map<string, THREE.Mesh>());
  const accent = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const highlight = useMemo(() => new THREE.Color(selectedColor), [selectedColor]);

  const placed = useMemo(
    () =>
      markers.map((m) => ({
        ...m,
        position: toVector(m.lat, m.lng),
        size: 0.024 + 0.01 * Math.log2(1 + m.count),
      })),
    [markers],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const m = motion.current;
    if (m.target) {
      // Ease toward the selected country.
      const k = Math.min(1, delta * 4);
      m.rotation.x += (m.target.x - m.rotation.x) * k;
      let dy = m.target.y - m.rotation.y;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy)); // shortest way round
      m.rotation.y += dy * k;
      if (Math.abs(dy) < 0.001 && Math.abs(m.target.x - m.rotation.x) < 0.001) m.target = null;
    } else if (Date.now() > m.idleUntil) {
      m.rotation.y += delta * 0.08; // gentle drift when nobody is touching it
    }
    g.rotation.set(m.rotation.x, m.rotation.y, 0);

    const pulse = 1 + 0.25 * Math.sin(state.clock.elapsedTime * 3);
    for (const [code, mesh] of markerMeshes.current) {
      const isSelected = code === m.selected;
      (mesh.material as THREE.MeshBasicMaterial).color.copy(isSelected ? highlight : accent);
      const s = isSelected ? 1.6 * pulse : 1;
      mesh.scale.set(s, s, s);
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={0.9} metalness={0} />
      </mesh>
      {placed.map((p) => (
        <group
          key={p.code}
          position={p.position}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onSelect(p.code);
          }}
        >
          <mesh
            ref={(mesh) => {
              if (mesh) markerMeshes.current.set(p.code, mesh);
              else markerMeshes.current.delete(p.code);
            }}
          >
            <sphereGeometry args={[p.size, 12, 12]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
          {/* Invisible, larger touch target so lights are easy to tap on a phone. */}
          <mesh>
            <sphereGeometry args={[Math.max(p.size * 3, 0.08), 8, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** If GL is unavailable, render nothing; the country list is the full alternative. */
class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Globe({ markers, selected, onSelect, height = 340, accentColor, selectedColor }: Props) {
  const motion = useRef<Motion>({ rotation: { x: 0.35, y: 0 }, target: null, idleUntil: 0, selected: null });

  // Selection comes from React; hand it to the frame loop through the ref.
  useEffect(() => {
    motion.current.selected = selected;
    const m = markers.find((x) => x.code === selected);
    if (m) {
      motion.current.target = facing(m.lat, m.lng);
      motion.current.idleUntil = Date.now() + 8000;
    }
  }, [selected, markers]);

  // Drags rotate the globe. Taps fall through to the markers.
  const pan = useMemo(() => {
    let start = { x: 0, y: 0 };
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        start = { ...motion.current.rotation };
        motion.current.target = null;
        motion.current.idleUntil = Date.now() + 1e9;
      },
      onPanResponderMove: (_e, g) => {
        motion.current.rotation.y = start.y + g.dx * 0.006;
        motion.current.rotation.x = Math.max(-1.2, Math.min(1.2, start.x + g.dy * 0.006));
      },
      onPanResponderRelease: () => {
        motion.current.idleUntil = Date.now() + 4000;
      },
      onPanResponderTerminate: () => {
        motion.current.idleUntil = Date.now() + 4000;
      },
    });
  }, []);

  return (
    <View
      style={[styles.wrap, { height }]}
      {...pan.panHandlers}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Globe showing where people are asking for prayer. Use the country list below to explore."
    >
      <GlobeBoundary>
        <Canvas camera={{ position: [0, 0, 2.9], fov: 42 }} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={1.4} />
          <directionalLight position={[3, 2, 4]} intensity={1.6} />
          <Suspense fallback={null}>
            <Earth markers={markers} motion={motion} onSelect={onSelect} accentColor={accentColor} selectedColor={selectedColor} />
          </Suspense>
        </Canvas>
      </GlobeBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
});
