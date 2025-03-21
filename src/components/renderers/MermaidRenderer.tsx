import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
  className?: string;
}

export function MermaidRenderer({ code, className = '' }: MermaidRendererProps) {
  const [svgCode, setSvgCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
      },
      fontFamily: 'sans-serif',
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code.trim()) {
        setError('No diagram code provided');
        return;
      }

      try {
        // Generate a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        
        // Try to parse the diagram to check for syntax errors
        await mermaid.parse(code);
        
        // Render the diagram
        const { svg } = await mermaid.render(id, code);
        
        // Set the SVG code
        setSvgCode(svg);
        setError(null);
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render Mermaid diagram');
        setSvgCode('');
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-red-500 mb-2">Mermaid Rendering Error</div>
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
          {error}
        </div>
        <div className="mt-4 p-3 bg-gray-100 rounded font-mono text-sm overflow-auto">
          <pre>{code}</pre>
        </div>
      </div>
    );
  }

  if (!svgCode) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Rendering diagram...</span>
      </div>
    );
  }

  return (
    <div 
      ref={mermaidRef}
      className={`mermaid-container ${className}`}
      dangerouslySetInnerHTML={{ __html: svgCode }}
    />
  );
}