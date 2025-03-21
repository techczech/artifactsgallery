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

  // Function to copy Mermaid diagram as image
  const copyDiagramAsImage = async () => {
    try {
      const svgElement = mermaidRef.current?.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Clone SVG to clean it up (mermaid adds specific IDs)
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Ensure viewBox is set correctly
      if (!clonedSvg.getAttribute('viewBox') && 
          clonedSvg.getAttribute('width') && 
          clonedSvg.getAttribute('height')) {
        const width = clonedSvg.getAttribute('width') || '100';
        const height = clonedSvg.getAttribute('height') || '100';
        clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
      
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});

      try {
        // Try using the modern Clipboard API
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/svg+xml': svgBlob
          })
        ]);
        setCopyStatus('Diagram copied to clipboard!');
      } catch (clipboardErr) {
        // Fallback to image conversion if direct SVG copy fails
        const img = new Image();
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = async () => {
          // Create a canvas and draw the SVG
          const canvas = document.createElement('canvas');
          const svgSize = svgElement.getBoundingClientRect();
          canvas.width = svgSize.width || svgElement.viewBox.baseVal.width || 300;
          canvas.height = svgSize.height || svgElement.viewBox.baseVal.height || 150;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');
          
          // Fill with white background (diagrams often have transparent backgrounds)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          try {
            // Try to copy the canvas as an image
            canvas.toBlob(async (blob) => {
              if (blob) {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob })
                ]);
                setCopyStatus('Image copied to clipboard!');
              } else {
                throw new Error('Failed to create image');
              }
            });
          } catch (canvasErr) {
            setCopyStatus('Copy failed. Try downloading instead.');
            console.error('Canvas copy error:', canvasErr);
          }
          
          URL.revokeObjectURL(url);
        };
        
        img.src = url;
      }
      
      // Clear the status after 3 seconds
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      console.error('Error copying diagram:', err);
      setCopyStatus('Failed to copy diagram');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  // Function to download Mermaid diagram as PNG
  const downloadDiagramAsPng = () => {
    try {
      const svgElement = mermaidRef.current?.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Clone SVG to clean it up
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Ensure viewBox is set correctly
      if (!clonedSvg.getAttribute('viewBox') && 
          clonedSvg.getAttribute('width') && 
          clonedSvg.getAttribute('height')) {
        const width = clonedSvg.getAttribute('width') || '100';
        const height = clonedSvg.getAttribute('height') || '100';
        clonedSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
      
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      // Create an image from the SVG
      const img = new Image();
      img.onload = function() {
        // Create canvas
        const canvas = document.createElement('canvas');
        const svgSize = svgElement.getBoundingClientRect();
        canvas.width = svgSize.width || svgElement.viewBox.baseVal.width || 300;
        canvas.height = svgSize.height || svgElement.viewBox.baseVal.height || 150;
        
        // Draw SVG to canvas with white background
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');
        
        // Fill with white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to PNG and download
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'mermaid-diagram.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (err) {
      console.error('Error downloading diagram as PNG:', err);
      setCopyStatus('Failed to download as PNG');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

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
      
      {/* Image actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button 
          onClick={copyDiagramAsImage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Copy as Image
        </button>
        
        <button 
          onClick={downloadDiagramAsPng}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download as PNG
        </button>
        
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