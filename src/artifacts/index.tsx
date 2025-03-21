import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Define proper TypeScript interfaces
interface TSXFile {
  name: string;
  path: string;
  lastModified?: string;
}

// Mock data to use when API fails
const mockTsxFiles: TSXFile[] = [
  {
    name: 'Button.tsx',
    path: './src/artifacts/Button.tsx',
    lastModified: new Date().toISOString()
  },
  {
    name: 'Card.tsx',
    path: './src/artifacts/Card.tsx',
    lastModified: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    name: 'Navbar.tsx',
    path: './src/artifacts/Navbar.tsx',
    lastModified: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  }
];

const TSXFileNavigator: React.FC = () => {
  const [tsxFiles, setTsxFiles] = useState<TSXFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);

  useEffect(() => {
    const fetchTSXFiles = async () => {
      try {
        // Fetch TSX files from an API endpoint
        const response = await fetch('/api/tsx-files?directory=./src/artifacts');
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        // Check content type to prevent JSON parse errors
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Expected JSON response but received a different format');
        }
        
        const data = await response.json();
        
        if (Array.isArray(data.files)) {
          setTsxFiles(data.files);
        } else {
          console.error('Expected array of files but got:', data);
          setError('Invalid data format received from server.');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching TSX files:', err);
        
        // Use mock data instead of showing error
        setTsxFiles(mockTsxFiles);
        setUsingMockData(true);
        setLoading(false);
      }
    };

    fetchTSXFiles();
  }, []);

  // Function to handle file selection
  const handleFileSelect = (file: TSXFile) => {
    setSelectedFile(file.path);
    // You could implement additional functionality here, like:
    // - Loading the file content in a preview pane
    // - Dispatching an action to a global state manager
    // - Navigating to a detail view with proper routing
  };

  // Function to retry with a different endpoint if needed
  const retryWithAlternativeEndpoint = () => {
    // Try an alternative endpoint 
    setLoading(true);
    setError(null);
    setUsingMockData(false);
    
    // Use setTimeout to avoid immediate state changes
    setTimeout(async () => {
      try {
        // Try an alternative endpoint that might work
        const response = await fetch('/api/artifacts');
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data.files)) {
          setTsxFiles(data.files);
        } else if (Array.isArray(data)) {
          // Handle case where API returns direct array
          setTsxFiles(data);
        } else {
          throw new Error('Invalid data format received from server.');
        }
      } catch (err) {
        console.error('Error in retry attempt:', err);
        // Use mock data instead
        setTsxFiles(mockTsxFiles);
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Function to manually use mock data
  const useMockData = () => {
    setTsxFiles(mockTsxFiles);
    setUsingMockData(true);
    setError(null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">TSX File Navigator</h2>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading files from ./src/artifacts...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">TSX File Navigator</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <div className="mt-3 flex space-x-2">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
            >
              Reload Page
            </button>
            <button 
              onClick={retryWithAlternativeEndpoint} 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
            >
              Try Alternative API
            </button>
            <button 
              onClick={useMockData} 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
            >
              Use Demo Data
            </button>
          </div>
          <p className="mt-3 text-xs text-red-600">
            Note: This error typically appears when the API endpoint is not set up correctly.
            Check your backend server configuration or API routes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">TSX Files in ./src/artifacts</h2>
      
      {usingMockData && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-sm">
          Using demo data because API is unavailable. 
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 underline hover:no-underline"
          >
            Try real API again
          </button>
        </div>
      )}
      
      {tsxFiles.length > 0 ? (
        <ul className="space-y-2">
          {tsxFiles.map((file, index) => (
            <li 
              key={index} 
              className={`border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer ${selectedFile === file.path ? 'bg-blue-50 border-blue-300' : ''}`}
              onClick={() => handleFileSelect(file)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span className="text-blue-600">{file.name}</span>
                </div>
                <Link 
                  to={`/view/${encodeURIComponent(file.path)}`} 
                  className="ml-2 text-xs bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open
                </Link>
              </div>
              {file.lastModified && (
                <div className="text-xs text-gray-500 mt-1 ml-7">
                  Last modified: {new Date(file.lastModified).toLocaleString()}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
          </svg>
          <p className="text-gray-500">No .tsx files found in ./src/artifacts directory.</p>
          <p className="text-sm text-gray-400 mt-1">Try adding some component files to this directory.</p>
        </div>
      )}
    </div>
  );
};

export default TSXFileNavigator;