import React, { useEffect, useRef } from 'react';

// THREE is expected to be globally available via ArtifactRunner
// declare var THREE: any; // For TypeScript if global types aren't set up

function ThreeJSCube() {
  const mountRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    if (typeof THREE === 'undefined') {
      console.error('ThreeJSCube Artifact: THREE.js library is not loaded.');
      if (mountRef.current) {
        mountRef.current.innerText = 'Error: THREE.js library not loaded. Check console.';
      }
      return;
    }
    
    const currentMount = mountRef.current;
    if (!currentMount) {
      console.error('ThreeJSCube Artifact: mountRef.current is null.');
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee); // Light gray background

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);

    // Cube setup
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x0077ff, specular: 0x555555, shininess: 30 }); // Blue, shiny material
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.8); // Stronger white light from a point
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      cube.rotation.x += 0.005;
      cube.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (currentMount && renderer) {
        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      
      // Dispose of Three.js objects
      if (renderer) {
        renderer.dispose();
      }
      if (material) {
        material.dispose();
      }
      if (geometry) {
        geometry.dispose();
      }
      
      // Remove the canvas from the DOM
      if (currentMount && renderer && renderer.domElement) {
        // Check if domElement is still a child before removing
        if (currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }
      }
      // Clear scene children (optional, as scene itself is not reused here)
      // while(scene.children.length > 0){ 
      //   scene.remove(scene.children[0]); 
      // }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '400px', 
        border: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }} 
    />
  );
}

export default ThreeJSCube;
