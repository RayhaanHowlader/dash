'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore - Ignore TypeScript errors for OrbitControls import
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Helper function to check if WebGL is available
const isWebGLAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
};

const EarthGlobe = () => {
  // Explicitly type the ref as HTMLDivElement
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Check if WebGL is available
    if (!isWebGLAvailable()) {
      setError('WebGL is not supported by your browser');
      return;
    }

    try {
      // Scene setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      // Create renderer with error handling
      let renderer: any;
      try {
        renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          canvas: document.createElement('canvas'),
          alpha: true
        });
      } catch (err) {
        console.error('Error creating WebGL renderer:', err);
        setError('Failed to initialize WebGL renderer');
        return;
      }

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      containerRef.current.appendChild(renderer.domElement);

      // Earth group
      const earthGroup = new THREE.Group();
      earthGroup.rotation.z = -23.4 * Math.PI / 180;
      scene.add(earthGroup);

      // Controls
      new OrbitControls(camera, renderer.domElement);

      // Earth setup
      const loader = new THREE.TextureLoader();
      const geometry = new THREE.IcosahedronGeometry(1, 12);
      
      // Earth material with texture
      const material = new THREE.MeshPhongMaterial({
        map: loader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-blue-marble.jpg'),
        bumpMap: loader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-topology.png'),
        bumpScale: 0.04,
      });
      
      const earthMesh = new THREE.Mesh(geometry, material);
      earthGroup.add(earthMesh);

      // Atmosphere glow effect
      const atmosphereGeometry = new THREE.IcosahedronGeometry(1.02, 12);
      const atmosphereMaterial = new THREE.MeshPhongMaterial({
        color: 0x3388ff,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      earthGroup.add(atmosphere);

      // Clouds with adjusted opacity and scale
      const cloudsMat = new THREE.MeshStandardMaterial({
        map: loader.load('https://unpkg.com/three-globe@2.24.10/example/img/earth-clouds.png'),
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
      });
      const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
      cloudsMesh.scale.setScalar(1.003);
      earthGroup.add(cloudsMesh);

      // Enhanced lighting setup
      const ambientLight = new THREE.AmbientLight(0x333333, 0.3);
      scene.add(ambientLight);
      
      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
      scene.add(hemisphereLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
      directionalLight.position.set(5, 3, 5);
      scene.add(directionalLight);

      const backLight = new THREE.DirectionalLight(0x444444, 1);
      backLight.position.set(-5, -2, -5);
      scene.add(backLight);

      // Stars
      const starGeometry = new THREE.BufferGeometry();
      const starVertices: number[] = [];
      for (let i = 0; i < 2000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starVertices.push(x, y, z);
      }
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
      const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);

      // Animation
      const animate = () => {
        requestAnimationFrame(animate);
        
        // Ultra-fast rotation speeds
        earthMesh.rotation.y += 0.08; // Extremely fast rotation
        cloudsMesh.rotation.y += 0.085; // Slightly faster than Earth
        stars.rotation.y -= 0.01; // Fast star rotation in opposite direction
        
        renderer.render(scene, camera);
      };
      animate();

      // Resize handler
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    } catch (err) {
      console.error('Error initializing 3D scene:', err);
      setError('Failed to initialize 3D scene');
    }
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">3D Globe Error</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm text-gray-400">
            Try using a different browser or device with WebGL support
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className='w-full h-full' />;
};

export default EarthGlobe; 