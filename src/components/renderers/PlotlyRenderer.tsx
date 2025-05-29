import React, { useEffect, useRef, useState } from 'react';

// Plotly is expected to be global via ArtifactRunner or index.html
// declare var Plotly: any; // Declare Plotly if not using a global type definition

interface PlotlyRendererProps {
  code: string;
  className?: string;
}

export function PlotlyRenderer({ code, className = '' }: PlotlyRendererProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartRef.current) {
      console.warn('PlotlyRenderer: chartRef.current is null, cannot render.');
      return;
    }
    
    if (typeof Plotly === 'undefined') {
      console.error('PlotlyRenderer: Plotly.js library is not loaded.');
      setError("Plotly.js library is not loaded.");
      return;
    }

    // Attempt to clear previous plot before rendering a new one
    try {
      if (chartRef.current && chartRef.current.children.length > 0 && typeof Plotly.purge === 'function') {
        Plotly.purge(chartRef.current);
      }
    } catch (purgeError: any) {
      // Log purge error but don't stop rendering attempt
      console.warn('PlotlyRenderer: Error purging previous chart:', purgeError.message);
    }
    
    try {
      const spec = JSON.parse(code);
      Plotly.newPlot(chartRef.current, spec.data || [], spec.layout || {}, spec.config || {});
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('PlotlyRenderer: Plotly rendering error:', err);
      setError(err.message || 'Failed to render Plotly chart from JSON. Ensure the code is valid Plotly JSON spec.');
    }

    // Cleanup function
    return () => {
      if (chartRef.current && typeof Plotly !== 'undefined' && typeof Plotly.purge === 'function') {
        try {
          Plotly.purge(chartRef.current);
        } catch (cleanupError: any) {
          console.warn('PlotlyRenderer: Error during Plotly purge on cleanup:', cleanupError.message);
        }
      }
    };
  }, [code]); // Re-run effect if the code changes

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <strong className="font-bold">Plotly Error:</strong>
        <span className="block sm:inline ml-2">{error}</span>
      </div>
    );
  }

  return <div ref={chartRef} className={`plotly-chart-container ${className}`} style={{ width: '100%', height: '400px' }} />;
}
