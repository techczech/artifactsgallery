import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

interface SVGRendererProps {
  code: string;
  className?: string;
}

export function SVGRenderer({ code, className = '' }: SVGRendererProps) {
  const [sanitizedCode, setSanitizedCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('');
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Basic SVG validation - check for svg tag
      if (!code.includes('<svg') || !code.includes('</svg>')) {
        throw new Error('Invalid SVG: Missing <svg> tags');
      }

      // Configure DOMPurify to allow SVG tags
      DOMPurify.addHook('afterSanitizeAttributes', function(node) {
        // Fix namespaced attributes
        if(node.hasAttribute('xlink:href')) {
          node.setAttribute('xlink:href', 
            DOMPurify.sanitize(node.getAttribute('xlink:href')!)
          );
        }
      });

      // Use DOMPurify to sanitize the SVG
      const sanitized = DOMPurify.sanitize(code, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'text', 'tspan']
      });
      
      setSanitizedCode(sanitized);
      setError(null);
    } catch (err: any) {
      console.error('SVG rendering error:', err);
      setError(err.message || 'Failed to render SVG');
      setSanitizedCode('');
    }
  }, [code]);

  // Function to copy SVG as image to clipboard
  const copySvgAsImage = async () => {
    try {
      const svgElement = svgContainerRef.current?.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Get SVG data as string
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});

      try {
        // Try using the modern Clipboard API
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/svg+xml': svgBlob
          })
        ]);
        setCopyStatus('SVG copied to clipboard!');
      } catch (clipboardErr) {
        // Fallback to image conversion if direct SVG copy fails
        const img = new Image();
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = async () => {
          // Create a canvas and draw the SVG
          const canvas = document.createElement('canvas');
          const svgSize = svgElement.getBoundingClientRect();
          canvas.width = svgSize.width || svgElement.width.baseVal.value || 300;
          canvas.height = svgSize.height || svgElement.height.baseVal.value || 150;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');
          
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
      console.error('Error copying SVG:', err);
      setCopyStatus('Failed to copy SVG');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  // Function to download SVG as PNG
  const downloadSvgAsPng = () => {
    try {
      const svgElement = svgContainerRef.current?.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      // Create an image from the SVG
      const img = new Image();
      img.onload = function() {
        // Create canvas
        const canvas = document.createElement('canvas');
        const svgSize = svgElement.getBoundingClientRect();
        canvas.width = svgSize.width || svgElement.width.baseVal.value || 300;
        canvas.height = svgSize.height || svgElement.height.baseVal.value || 150;
        
        // Draw SVG to canvas
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get canvas context');
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to PNG and download
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = 'svg-diagram.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (err) {
      console.error('Error downloading SVG as PNG:', err);
      setCopyStatus('Failed to download as PNG');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  // Function to download raw SVG
  const downloadRawSvg = () => {
    try {
      const svgElement = svgContainerRef.current?.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.svg';
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
        <div className="text-red-500 mb-2">SVG Rendering Error</div>
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="svg-renderer">
      <div 
        ref={svgContainerRef}
        className={`svg-container ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedCode }}
      />
      
      {/* Image actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button 
          onClick={copySvgAsImage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Copy as Image
        </button>
        
        <button 
          onClick={downloadSvgAsPng}
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