import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function TimeClock({ isRunning = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const clockGroup = new THREE.Group();
    scene.add(clockGroup);

    // Outer Dial Ring
    const outerRingGeo = new THREE.TorusGeometry(1.2, 0.04, 16, 100);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.6,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    clockGroup.add(outerRing);

    // Inner Dial Ring
    const innerRingGeo = new THREE.TorusGeometry(0.9, 0.02, 16, 60);
    const innerRingMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    clockGroup.add(innerRing);

    // Hour Hand
    const hourHandGeo = new THREE.BoxGeometry(0.05, 0.6, 0.02);
    hourHandGeo.translate(0, 0.3, 0);
    const handMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.8 });
    const hourHand = new THREE.Mesh(hourHandGeo, handMat);
    clockGroup.add(hourHand);

    // Minute Hand
    const minHandGeo = new THREE.BoxGeometry(0.03, 0.85, 0.02);
    minHandGeo.translate(0, 0.425, 0);
    const minHandMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 });
    const minHand = new THREE.Mesh(minHandGeo, minHandMat);
    clockGroup.add(minHand);

    // Center Pin
    const centerPinGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const centerPin = new THREE.Mesh(centerPinGeo, handMat);
    clockGroup.add(centerPin);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const speed = isRunning ? 0.05 : 0.005;
      minHand.rotation.z -= speed;
      hourHand.rotation.z -= speed / 12;
      innerRing.rotation.z += 0.008;
      outerRing.rotation.y += 0.003;

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
      outerRingGeo.dispose();
      outerRingMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      hourHandGeo.dispose();
      handMat.dispose();
      minHandGeo.dispose();
      minHandMat.dispose();
      centerPinGeo.dispose();
      renderer.dispose();
    };
  }, [isRunning]);

  return <div ref={containerRef} style={{ width: '100%', height: '200px' }} />;
}
