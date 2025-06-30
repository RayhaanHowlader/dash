import * as THREE from 'three';

export function getFresnelMat() {
  const fresnelMat = new THREE.ShaderMaterial({
    uniforms: {
      mRefractionRatio: { value: 0.9 },
      mFresnelBias: { value: 0.1 },
      mFresnelScale: { value: 4.0 },
      mFresnelPower: { value: 2.0 },
    },
    vertexShader: `
      uniform float mRefractionRatio;
      uniform float mFresnelBias;
      uniform float mFresnelScale;
      uniform float mFresnelPower;
      
      varying vec3 vReflect;
      varying vec3 vRefract[3];
      varying float vReflectionFactor;
      
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        
        vec3 worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
        
        vec3 I = worldPosition.xyz - cameraPosition;
        
        vReflect = reflect(I, worldNormal);
        vRefract[0] = refract(normalize(I), worldNormal, mRefractionRatio);
        vRefract[1] = refract(normalize(I), worldNormal, mRefractionRatio * 0.99);
        vRefract[2] = refract(normalize(I), worldNormal, mRefractionRatio * 0.98);
        vReflectionFactor = mFresnelBias + mFresnelScale * pow(1.0 + dot(normalize(I), worldNormal), mFresnelPower);
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vReflect;
      varying vec3 vRefract[3];
      varying float vReflectionFactor;
      
      void main() {
        vec4 reflectedColor = vec4(0.2, 0.6, 1.0, 1.0);
        vec4 refractedColor = vec4(0.1, 0.3, 0.5, 1.0);
        
        gl_FragColor = mix(refractedColor, reflectedColor, clamp(vReflectionFactor, 0.0, 1.0));
      }
    `,
    transparent: true,
    opacity: 0.6,
  });

  return fresnelMat;
} 