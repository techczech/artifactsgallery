import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

interface SVGRendererProps {
  code: string;
  className?: string;
}

export function SVGRenderer({ code, className = '' }: SVGRendererProps) {
  const [sanitizedCode, setSanitizedCode] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    <div 
      className={`svg-container ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedCode }}
    />
  );
}