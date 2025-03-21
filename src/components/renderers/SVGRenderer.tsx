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

  // More reliable way to copy SVG as image to clipboard
  const copySvgAsImage = async () => {
    try {
      const svgElement = svgContainerRef.current?.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Create a canvas with appropriate dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Get SVG dimensions
      let width = svgElement.width?.baseVal?.value;
      let height = svgElement.height?.baseVal?.value;
      
      if (!width || !height) {
        // Try to get dimensions from viewBox
        const viewBox = svgElement.viewBox?.baseVal;
        if (viewBox) {
          width = viewBox.width;
          height = viewBox.height;
        }
      }
      
      if (!width || !height) {
        // Fallback to getBoundingClientRect
        const bbox = svgElement.getBoundingClientRect();
        width = bbox.width;
        height = bbox.height;
      }
      
      // Ensure minimum dimensions
      width = Math.max(width || 0, 100);
      height = Math.max(height || 0, 100);
      
      // Scale for better quality
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      // Create a blob from the SVG string
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Load the SVG as an image
      const img = new Image();
      img.src = url;
      
      // Draw the image to canvas when loaded
      img.onload = async () => {
        // Fill with white background for better visibility
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        try {
          // Convert to PNG blob and copy to clipboard
          canvas.toBlob(async (pngBlob) => {
            if (pngBlob) {
              try {
                // Try the clipboard item approach
                const clipboardItem = new ClipboardItem({ 'image/png': pngBlob });
                await navigator.clipboard.write([clipboardItem]);
                setCopyStatus('Image copied to clipboard!');
              } catch (clipErr) {
                console.error('Clipboard API error:', clipErr);
                setCopyStatus('Copy failed - browser may not support clipboard images');
              }
            } else {
              setCopyStatus('Failed to create PNG data');
            }
          }, 'image/png');
        } catch (err) {
          console.error('Canvas to Blob error:', err);
          setCopyStatus('Copy failed due to browser limitations');
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setCopyStatus('Failed to load SVG as image');
      };
      
      // Clear the status after 3 seconds
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      console.error('Error copying SVG:', err);
      setCopyStatus('Failed to copy image. Try download instead.');
      setTimeout(() => setCopyStatus(''), 3000);
    }
  };

  // Improved SVG to PNG download
  const downloadSvgAsPng = () => {
    try {
      const svgElement = svgContainerRef.current?.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // Create a canvas with appropriate dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Get SVG dimensions
      let width = svgElement.width?.baseVal?.value;
      let height = svgElement.height?.baseVal?.value;
      
      if (!width || !height) {
        // Try to get dimensions from viewBox
        const viewBox = svgElement.viewBox?.baseVal;
        if (viewBox) {
          width = viewBox.width;
          height = viewBox.height;
        }
      }
      
      if (!width || !height) {
        // Fallback to getBoundingClientRect
        const bbox = svgElement.getBoundingClientRect();
        width = bbox.width;
        height = bbox.height;
      }
      
      // Ensure minimum dimensions
      width = Math.max(width || 0, 100);
      height = Math.max(height || 0, 100);
      
      // Scale for better quality
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      // Create a blob from the SVG string
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Load the SVG as an image
      const img = new Image();
      img.src = url;
      
      // Draw the image to canvas when loaded
      img.onload = () => {
        // Fill with white background for better visibility
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        
        // Convert to data URL and download
        const imgURL = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = imgURL;
        a.download = 'svg-image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setCopyStatus('Failed to load SVG as image');
        setTimeout(() => setCopyStatus(''), 3000);
      };
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

      // Get SVG data with correct XML declaration
      const svgData = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + 
                      new XMLSerializer().serializeToString(svgElement);
      
      // Create download link
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
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