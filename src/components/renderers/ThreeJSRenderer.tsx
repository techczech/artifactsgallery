import React, { useEffect, useRef, useState } from 'react';

// THREE is expected to be global via ArtifactRunner or index.html
// declare var THREE: any; // If needed for TypeScript if not properly typed globally

interface ThreeJSRendererProps {
  code: string;
  className?: string;
}

export function ThreeJSRenderer({ code, className = '' }: ThreeJSRendererProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null); // Store cleanup function

  useEffect(() => {
    if (!mountRef.current) {
      console.warn('ThreeJSRenderer: mountRef.current is null, cannot render.');
      return;
    }
    
    if (typeof THREE === 'undefined') {
      console.error('ThreeJSRenderer: Three.js library is not loaded.');
      setError("Three.js library is not loaded. Please ensure it's included in your project.");
      return;
    }

    const container = mountRef.current;
    let animationFrameId: number;

    // Clear previous content and call existing cleanup
    if (cleanupRef.current) {
        cleanupRef.current();
    }
    container.innerHTML = ''; // Clear previous canvas/elements

    try {
      // Create a new Function to execute the code.
      // This provides a sandboxed environment with access to THREE and the container.
      // The user's code should handle creating the scene, camera, renderer,
      // and appending the renderer.domElement to the container.
      // It should also return a cleanup function if it sets up an animation loop.
      const scriptFn = new Function('THREE', 'container', code);
      const result = scriptFn(THREE, container);

      if (typeof result === 'function') {
        cleanupRef.current = result; // Assume the script returns a cleanup function
      } else if (result && typeof result.dispose === 'function') {
        // If the script returns an object with a dispose method (e.g., a main class)
        cleanupRef.current = () => result.dispose();
      } else {
        // Default cleanup if the script doesn't provide one
        cleanupRef.current = () => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
          // Try to find and dispose of typical Three.js objects if possible,
          // though this is speculative and might not always work.
          if (container.children.length > 0 && container.children[0] instanceof HTMLCanvasElement) {
            const canvas = container.children[0] as HTMLCanvasElement;
            if (canvas.getContext('webgl') || canvas.getContext('webgl2')) {
              // A WebGL context exists, often managed by a THREE.Renderer.
              // Proper cleanup involves disposing the renderer, scene, geometries, materials.
              // This is hard to do generically from outside the script.
              // The script itself is responsible for robust cleanup.
              console.warn('ThreeJSRenderer: Script did not return a cleanup function. Generic cleanup might be incomplete.');
            }
          }
          container.innerHTML = ''; // Fallback: clear the container
        };
      }
      
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('ThreeJSRenderer: Error executing Three.js script:', err);
      setError(err.message || 'Failed to execute Three.js script. Check console for details.');
      cleanupRef.current = null; // No cleanup if script failed
    }

    // The main cleanup function to be called when the component unmounts or code changes
    return () => {
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch (cleanupError: any) {
          console.error('ThreeJSRenderer: Error during script cleanup:', cleanupError.message);
        }
      }
      // Ensure container is cleared if cleanup didn't do it
      if (container) {
        container.innerHTML = '';
      }
      cleanupRef.current = null;
    };
  }, [code]); // Re-run effect if the code changes

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <strong className="font-bold">Three.js Error:</strong>
        <span className="block sm:inline ml-2">{error}</span>
      </div>
    );
  }

  // Ensure the mountRef div has a defined size or inherits it.
  // The user's script is responsible for setting the renderer size, often based on this container.
  return <div ref={mountRef} className={`threejs-container ${className}`} style={{ width: '100%', height: '400px', position: 'relative' }} />;
}
