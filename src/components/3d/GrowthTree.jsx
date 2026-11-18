import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function GrowthTree({ progress = 65 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.25, 1.5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.5 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.25;
    group.add(trunk);

    // Leaves / Crystal Nodes based on progress
    const scaleFactor = Math.max(0.3, progress / 100);
    const foliageGeo = new THREE.DodecahedronGeometry(0.95, 1);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      wireframe: true,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 1.3;
    foliage.scale.set(scaleFactor, scaleFactor, scaleFactor);
    group.add(foliage);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x34d399, 2);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      group.rotation.y += 0.008;
      foliage.rotation.x += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      trunkGeo.dispose();
      trunkMat.dispose();
      foliageGeo.dispose();
      foliageMat.dispose();
      renderer.dispose();
    };
  }, [progress]);

  return <div ref={containerRef} style={{ width: '100%', height: '200px' }} />;
}
