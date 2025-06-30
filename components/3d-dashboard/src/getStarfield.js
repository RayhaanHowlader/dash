import * as THREE from 'three';

export default function getStarfield({ numStars = 2000 } = {}) {
  const vertices = [];
  const sizes = [];

  for (let i = 0; i < numStars; i++) {
    // Create a random position for each star
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    vertices.push(x, y, z);

    // Random size for each star
    sizes.push(Math.random() * 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    transparent: true,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(geometry, material);
  return stars;
} 