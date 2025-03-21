import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
  className?: string;
}

export function MermaidRenderer({ code, className = '' }: MermaidRendererProps) {
  const [svgCode, setSvgCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('');
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

  // Function to download raw SVG of Mermaid diagram
  const downloadRawSvg = () => {
    try {
      const svgElement = mermaidRef.current?.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Clone SVG to clean it up
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mermaid-diagram.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      setCopyStatus('SVG downloaded successfully!');
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      console.error('Error downloading SVG:', err);
      setCopyStatus('Failed to download SVG');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

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
    <div className="mermaid-renderer">
      <div 
        ref={mermaidRef}
        className={`mermaid-container ${className}`}
        dangerouslySetInnerHTML={{ __html: svgCode }}
      />
      
      {/* Download action */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button 
          onClick={downloadRawSvg}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded text-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download as SVG
        </button>
        
        {copyStatus && (
          <span className="px-3 py-1.5 bg-gray-100 rounded text-sm">{copyStatus}</span>
        )}
      </div>
    </div>
  );
}