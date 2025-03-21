import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArtifactStore } from '../lib/store';
// Import libraries that we'll provide as globals to artifacts
import * as LucideIcons from 'lucide-react';
import * as Recharts from 'recharts';
// Import Babel for JSX transpilation
import * as Babel from '@babel/standalone';
// Import renderers
import { SVGRenderer } from './renderers/SVGRenderer';
import { MermaidRenderer } from './renderers/MermaidRenderer';

export function ArtifactRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getArtifact } = useArtifactStore();
  
  const [artifact, setArtifact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renderedComponent, setRenderedComponent] = useState<React.ReactNode>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

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
          if (artifactData.type === 'svg') {
            // For SVG, we just store the code and let the SVGRenderer handle it
            setRenderedComponent(<SVGRenderer code={artifactData.code} />);
          } else if (artifactData.type === 'mermaid') {
            // For Mermaid, use the MermaidRenderer component
            setRenderedComponent(<MermaidRenderer code={artifactData.code} />);
          } else {
            // Default to React component
            const component = executeComponentCode(artifactData.code);
            setRenderedComponent(component);
          }
        } catch (err: any) {
          console.error('Error rendering artifact:', err);
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
  }, [id, getArtifact]);

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
      ...Recharts
    };

    try {
      // Process the code to handle imports and exports
      let processedCode = code
        // Remove React imports
        .replace(/import React.+from\s+['"]react['"];?/g, '')
        .replace(/import {(.+)} from\s+['"]react['"];?/g, '')
        // Handle lucide-react imports
        .replace(/import {(.+)} from\s+['"]lucide-react['"];?/g, '')
        .replace(/import (\w+) from\s+['"]lucide-react['"];?/g, '')
        // Handle recharts imports
        .replace(/import {(.+)} from\s+['"]recharts['"];?/g, '')
        // Comment out other imports
        .replace(/import (.+) from\s+['"](.+)['"];?/g, '/* import $1 from "$2" */');

      // Replace export statements with variable declarations
      processedCode = processedCode
        .replace(/export\s+default\s+(\w+);?/g, 'var componentToRender = $1;')
        .replace(/export\s+default\s+/g, 'var componentToRender = ');

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
    } catch (err) {
      console.error('Component execution error:', err);
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
                  : 'bg-purple-100 text-purple-800'
            }`}>
              {artifact?.type === 'react' && 'React'}
              {artifact?.type === 'svg' && 'SVG'}
              {artifact?.type === 'mermaid' && 'Mermaid'}
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
            <div className="text-red-500 mb-4">Failed to render component</div>
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded font-mono text-sm overflow-auto">
              {renderError}
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
    </div>
  );
}