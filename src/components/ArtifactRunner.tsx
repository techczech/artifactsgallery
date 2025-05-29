import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArtifactStore } from '../lib/store';
// Import libraries that we'll provide as globals to artifacts
import * as LucideIcons from 'lucide-react';
import * as Recharts from 'recharts';
// Import Babel for JSX transpilation
import * as Babel from '@babel/standalone';
// Import libraries for new artifact types
import * as Plotly from 'plotly.js';
import * as XLSX from 'xlsx';
// Import renderers
import { SVGRenderer } from './renderers/SVGRenderer';
import { MermaidRenderer } from './renderers/MermaidRenderer';

export function ArtifactRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getArtifact, deleteArtifact } = useArtifactStore();
  
  const [artifact, setArtifact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renderedComponent, setRenderedComponent] = useState<React.ReactNode>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [threeJsLoaded, setThreeJsLoaded] = useState(!!window.THREE);

  // Load Three.js from CDN
  useEffect(() => {
    if (!threeJsLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => {
        console.log('Three.js loaded from CDN');
        setThreeJsLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Three.js from CDN');
        // Potentially set an error state here if Three.js is critical for all artifacts
      };
      document.head.appendChild(script);

      return () => {
        // Clean up the script tag if the component unmounts before loading
        document.head.removeChild(script);
      };
    }
  }, [threeJsLoaded]);

  // Mock window.fs.readFile if not present (for local dev)
  useEffect(() => {
    if (typeof window.fs === 'undefined') {
      console.warn('window.fs is undefined. Mocking for local development.');
      window.fs = {
        readFile: (path, options, callback) => {
          const error = new Error(`Mock fs.readFile: File not found - ${path}. This is a mock for local development. In a Claude environment, actual file reading would occur.`);
          console.error(error);
          if (typeof options === 'function') { // If options are omitted
            options(error, null);
          } else if (callback) {
            callback(error, null);
          }
        },
        // Add other fs methods if needed by artifacts, though unlikely for readFile only cases
      };
    }
  }, []);


  useEffect(() => {
    const loadArtifact = async () => {
      if (!id) {
        setError('No artifact ID provided');
        setLoading(false);
        return;
      }

      try {
        const artifactData = await getArtifact(id);
        if (!artifactData) {
          setError('Artifact not found');
          setLoading(false);
          return;
        }

        setArtifact(artifactData);
        
        // Render based on artifact type
        try {
          // Improved type validation and rendering
          if (artifactData.type === 'svg') {
            setRenderedComponent(<SVGRenderer code={artifactData.code} />);
          } else if (artifactData.type === 'mermaid') {
            setRenderedComponent(<MermaidRenderer code={artifactData.code} />);
          } else if (artifactData.type === 'plotly') {
            try {
                const component = executeComponentCode(artifactData.code);
                setRenderedComponent(component);
            } catch (err: any) {
                console.error('Error rendering Plotly artifact:', err);
                setRenderError(err.message || 'Failed to render Plotly artifact');
            }
          } else if (artifactData.type === 'sheetjs') {
            try {
                const component = executeComponentCode(artifactData.code);
                setRenderedComponent(component);
            } catch (err: any) {
                console.error('Error rendering SheetJS artifact:', err);
                setRenderError(err.message || 'Failed to render SheetJS artifact');
            }
          } else if (artifactData.type === 'threejs') {
            try {
                if (threeJsLoaded && window.THREE) { // Ensure THREE is loaded
                    const component = executeComponentCode(artifactData.code);
                    setRenderedComponent(component);
                } else if (!threeJsLoaded) {
                    // Three.js is still loading, wait for it.
                    // This might require a re-render trigger once threeJsLoaded is true.
                    // The useEffect dependency on threeJsLoaded should handle this.
                    console.log('Three.js is loading, deferring component execution...');
                    setRenderError('Three.js is loading. Please wait...'); // Temporary message
                    // Optional: set up a listener or check in interval if component load needs to be re-triggered
                }
                 else {
                    throw new Error('Three.js library is not loaded yet or failed to load.');
                }
            } catch (err: any) {
                console.error('Error rendering Three.js artifact:', err);
                setRenderError(err.message || 'Failed to render Three.js artifact');
            }
          } else { // Default to React component execution
            if (shouldProcessAsReact(artifactData.code)) {
              const component = executeComponentCode(artifactData.code);
              setRenderedComponent(component);
            } else if (looksLikeSvg(artifactData.code)) {
              console.warn('Code appears to be SVG but was marked as React. Rendering as SVG.');
              setRenderedComponent(<SVGRenderer code={artifactData.code} />);
            } else if (looksLikeMermaid(artifactData.code)) {
              console.warn('Code appears to be Mermaid but was marked as React. Rendering as Mermaid.');
              setRenderedComponent(<MermaidRenderer code={artifactData.code} />);
            } else {
              const component = executeComponentCode(artifactData.code);
              setRenderedComponent(component);
            }
          }
        } catch (err: any) {
          console.error('Error rendering artifact (outer catch):', err);
          setRenderError(err.message || 'Failed to render artifact');
        }
      } catch (err) {
        console.error('Error loading artifact:', err);
        setError('Failed to load artifact');
      } finally {
        setLoading(false);
      }
    };

    loadArtifact();
  }, [id, getArtifact, threeJsLoaded]); // Added threeJsLoaded as a dependency

  // Helper functions to detect content types
  const looksLikeSvg = (content: string): boolean => {
    const trimmedContent = content.trim();
    return trimmedContent.includes('<svg') || 
           !!trimmedContent.match(/<svg\s+[^>]*>/i) ||
           (trimmedContent.includes('<') && 
            trimmedContent.includes('</') && 
            (trimmedContent.includes('circle') || 
             trimmedContent.includes('rect') || 
             trimmedContent.includes('path') || 
             trimmedContent.includes('polygon')));
  };
  
  const looksLikeMermaid = (content: string): boolean => {
    const trimmedContent = content.trim();
    const mermaidPatterns = [
      /^graph\s+[A-Za-z0-9]/i,
      /^flowchart\s+[A-Za-z0-9]/i,
      /^sequenceDiagram/i,
      /^classDiagram/i,
      /^stateDiagram/i,
      /^erDiagram/i,
      /^journey/i,
      /^gantt/i,
      /^pie/i,
      /^mindmap/i
    ];
    
    return mermaidPatterns.some(pattern => pattern.test(trimmedContent));
  };
  
  const shouldProcessAsReact = (content: string): boolean => {
    const trimmedContent = content.trim();
    
    // Check for clear indicators it's NOT React code
    if (looksLikeSvg(content) || looksLikeMermaid(content)) {
      return false;
    }
    
    // Check for XML/HTML comments which cause Babel to fail
    if (trimmedContent.includes('<!--')) {
      return false;
    }
    
    // Positive indicators it IS React code
    return trimmedContent.includes('import React') || 
           trimmedContent.includes('function') || 
           trimmedContent.includes('class') || 
           trimmedContent.includes('export default') ||
           trimmedContent.includes('useState') ||
           trimmedContent.includes('return') && 
           trimmedContent.includes('<') && 
           trimmedContent.includes('/>');
  };

  // Handle artifact deletion
  const handleDeleteArtifact = async () => {
    if (!id) return;
    
    try {
      await deleteArtifact(id);
      navigate('/'); // Redirect to gallery after deletion
    } catch (err) {
      console.error('Error deleting artifact:', err);
      alert('Failed to delete artifact');
    }
  };

  // Function to execute the component code with globals
  const executeComponentCode = (code: string) => {
    // Create globals that will be available to the component
    const globals: Record<string, any> = {
      React,
      useState: React.useState,
      useEffect: React.useEffect,
      useRef: React.useRef,
      useCallback: React.useCallback,
      useMemo: React.useMemo,
      useContext: React.useContext,
      
      // Add LucideIcons components
      ...LucideIcons,
      
      // Add Recharts components
      ...Recharts,
      Plotly,
      XLSX,
      THREE: window.THREE, // Use the globally loaded THREE
      
      // Extract potential Lucide icon imports from the code to ensure they're available
      ...extractLucideIconImports(code)
    };
    
    // Helper function to extract Lucide icon imports from code
    function extractLucideIconImports(sourceCode: string): Record<string, any> {
      const importedIcons: Record<string, any> = {};
      
      // Look for object destructuring imports: import { Icon1, Icon2 } from 'lucide-react'
      const objectImportRegex = /import\s+{\s*([^}]*)\s*}\s+from\s+['"]lucide-react['"];?/g;
      let objectMatch;
      
      while ((objectMatch = objectImportRegex.exec(sourceCode)) !== null) {
        const iconList = objectMatch[1];
        const icons = iconList.split(',').map(s => s.trim());
        
        for (const icon of icons) {
          if (icon && LucideIcons[icon as keyof typeof LucideIcons]) {
            importedIcons[icon] = LucideIcons[icon as keyof typeof LucideIcons];
          }
        }
      }
      
      // Look for named imports: import IconName from 'lucide-react'
      const namedImportRegex = /import\s+(\w+)\s+from\s+['"]lucide-react['"];?/g;
      let namedMatch;
      
      while ((namedMatch = namedImportRegex.exec(sourceCode)) !== null) {
        const iconName = namedMatch[1];
        if (iconName && LucideIcons[iconName as keyof typeof LucideIcons]) {
          importedIcons[iconName] = LucideIcons[iconName as keyof typeof LucideIcons];
        }
      }
      
      return importedIcons;
    }

    try {
      // Process the code to handle imports and exports
      let processedCode = code
        // Remove React imports
        .replace(/import\s+React\s*,?\s*{\s*([^}]*)\s*}\s+from\s+['"]react['"];?/g, '')
        .replace(/import\s+React\s+from\s+['"]react['"];?/g, '')
        .replace(/import\s+{\s*([^}]*)\s*}\s+from\s+['"]react['"];?/g, '')
        // Extract and process lucide-react imports
        .replace(/import\s+{\s*([^}]*)\s*}\s+from\s+['"]lucide-react['"];?/g, (match, iconList) => {
          // Leave a comment to show what was imported
          return `/* Imported Lucide icons: ${iconList} */`;
        })
        .replace(/import\s+(\w+)\s+from\s+['"]lucide-react['"];?/g, (match, iconName) => {
          return `/* Imported Lucide icon: ${iconName} */`;
        })
        // Handle recharts imports
        .replace(/import\s+{\s*([^}]*)\s*}\s+from\s+['"]recharts['"];?/g, '')
        // Comment out other imports
        .replace(/import\s+(.+)\s+from\s+['"](.+)['"];?/g, '/* import $1 from "$2" */');

      // Replace export statements with variable declarations
      processedCode = processedCode
        .replace(/export\s+default\s+(\w+);?/g, 'var componentToRender = $1;')
        .replace(/export\s+default\s+/g, 'var componentToRender = ');

      try {
        // Transform JSX to JavaScript using Babel
        const transformedCode = Babel.transform(processedCode, {
          presets: ['react'],
          filename: 'artifact.jsx' // Provide a filename to satisfy Babel
        }).code;

        if (!transformedCode) {
          throw new Error('Failed to transform component code');
        }
        
        // Create a module-like object to hold the component
        const module = { exports: {} };
        
        // Wrap the code to capture the component
        const wrappedCode = `
          ${transformedCode}
          
          // Return the component (either from an explicit declaration or the last defined component)
          if (typeof componentToRender !== 'undefined') {
            return componentToRender;
          } else {
            // Try to find a React component in the code
            // Look for function components or class components
            var components = Object.keys(this).filter(key => {
              var obj = this[key];
              return typeof obj === 'function' && 
                    (obj.prototype && obj.prototype.isReactComponent || 
                    /return\\s+React\\.createElement/.test(obj.toString()));
            });
            
            if (components.length > 0) {
              return this[components[components.length - 1]];
            }
            
            return null;
          }
        `;
        
        // Execute with all globals provided
        const componentFn = new Function(...Object.keys(globals), wrappedCode);
        const ComponentClass = componentFn.apply({}, Object.values(globals));
        
        // Check if we got a valid component
        if (!ComponentClass) {
          throw new Error('No component found in the artifact code');
        }
        
        // Return the React element
        return React.createElement(ComponentClass);
      } catch (err: any) {
        // Check if this looks like it might actually be SVG or Mermaid
        if (looksLikeSvg(code)) {
          throw new Error('This appears to be SVG code. Try changing the artifact type to "SVG Image".');
        } else if (looksLikeMermaid(code)) {
          throw new Error('This appears to be Mermaid diagram code. Try changing the artifact type to "Mermaid Diagram".');
        } else if (code.includes('<!--')) {
          throw new Error('HTML comments (<!-- -->) are not supported in React components. If this is SVG code, change the artifact type to "SVG Image".');
        } else {
          // Re-throw the original error
          throw err;
        }
      }

      // Code was moved inside the try/catch block
    } catch (err: any) {
      console.error('Component execution error:', err);
      
      // Check if the error might be related to missing Lucide icons
      if (err.message && (
          err.message.includes('is not defined') || 
          err.message.includes('is not a function'))) {
        
        // Extract the icon name from the error message
        const match = err.message.match(/([\w]+) is not defined/);
        const iconName = match ? match[1] : null;
        
        if (iconName && !globals[iconName] && code.includes(`'lucide-react'`)) {
          throw new Error(
            `Missing icon: "${iconName}". Make sure it's properly imported from 'lucide-react'. ` +
            `Available icons: ${Object.keys(LucideIcons).filter(name => 
              typeof LucideIcons[name as keyof typeof LucideIcons] === 'function').join(', ')}`
          );
        }
      }
      
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading artifact...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">{artifact?.title || 'Untitled Artifact'}</h1>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-0.5 rounded ${
              artifact?.type === 'react' 
                ? 'bg-blue-100 text-blue-800' 
                : artifact?.type === 'svg' 
                  ? 'bg-green-100 text-green-800' 
                  : artifact?.type === 'mermaid'
                    ? 'bg-purple-100 text-purple-800'
                    : artifact?.type === 'plotly'
                      ? 'bg-red-100 text-red-800'
                      : artifact?.type === 'sheetjs'
                        ? 'bg-yellow-100 text-yellow-800'
                        : artifact?.type === 'threejs'
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-gray-100 text-gray-800' // Default
            }`}>
              {artifact?.type === 'react' && 'React'}
              {artifact?.type === 'svg' && 'SVG'}
              {artifact?.type === 'mermaid' && 'Mermaid'}
              {artifact?.type === 'plotly' && 'Plotly'}
              {artifact?.type === 'sheetjs' && 'SheetJS'}
              {artifact?.type === 'threejs' && 'Three.js'}
            </span>
            
            {artifact?.folder && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                📁 {artifact.folder}
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/edit/${id}`)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => navigate('/')}
            className="border border-gray-300 hover:bg-gray-100 px-3 py-1 rounded text-sm"
          >
            Back to Gallery
          </button>
        </div>
      </div>
      
      {artifact?.description && (
        <div className="bg-gray-50 border rounded p-4 mb-4">
          <p>{artifact.description}</p>
        </div>
      )}
      
      {artifact?.tags && artifact.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {artifact.tags.map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        {renderError ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4 font-semibold text-lg">Failed to render component</div>
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded font-mono text-sm overflow-auto">
              {renderError}
              
              {/* Specific error guidance */}
              {renderError.includes('lucide-react') && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded">
                  <strong>Tip:</strong> This error appears to be related to Lucide icons. Make sure you're importing icons that are available in the library.
                  <div className="mt-2">Common icons include: Image, Cpu, Lightbulb, Sparkles, Database, Smartphone, BrainCircuit, LayoutDashboard, Bot, LineChart, DollarSign</div>
                </div>
              )}
              
              {renderError.includes('SVG') && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">
                  <strong>Tip:</strong> This appears to be SVG code. Try changing the artifact type to "SVG Image" in the editor.
                </div>
              )}
              
              {renderError.includes('Mermaid') && (
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded">
                  <strong>Tip:</strong> This appears to be Mermaid diagram code. Try changing the artifact type to "Mermaid Diagram" in the editor.
                </div>
              )}
              
              {renderError.includes('HTML comments') && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded">
                  <strong>Warning:</strong> HTML comments are causing issues with React transpilation. If this is SVG code, change the artifact type to "SVG Image".
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="artifact-container">
            {renderedComponent}
          </div>
        )}
        
        <div className="mt-4 border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Component Code</h3>
          <div className="flex space-x-2 mb-3">
            <button 
              onClick={() => {
                if (artifact?.code) {
                  navigator.clipboard.writeText(artifact.code);
                  alert('Code copied to clipboard!');
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              Copy to Clipboard
            </button>
            <a 
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(artifact?.code || '')}`} 
              download={`${artifact?.title || 'artifact'}.tsx`}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
            >
              Download as File
            </a>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Component Code</h2>
        <div className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-auto max-h-[500px]">
          <pre className="font-mono text-sm">
            <code>{artifact?.code || ''}</code>
          </pre>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Delete Artifact</h3>
            <p className="mb-6">
              Are you sure you want to delete <span className="font-semibold">{artifact?.title}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteArtifact}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}