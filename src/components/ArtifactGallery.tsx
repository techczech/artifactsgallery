import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useArtifactStore } from '../lib/store';

export function ArtifactGallery() {
  const { artifacts, loadArtifacts, exportArtifacts, importArtifacts } = useArtifactStore();
  const [loading, setLoading] = useState(true);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filtering state
  const [filterType, setFilterType] = useState<'react' | 'svg' | 'mermaid' | 'all'>('all');
  const [filterFolder, setFilterFolder] = useState<string | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get all available tags and folders for filter dropdowns
  const allFolders = useArtifactStore(state => state.getAllFolders());
  const allTags = useArtifactStore(state => state.getAllTags());

  useEffect(() => {
    // Load artifacts from store when component mounts
    const fetchArtifacts = async () => {
      await loadArtifacts();
      setLoading(false);
    };
    
    fetchArtifacts();
  }, [loadArtifacts]);
  
  // Filter artifacts based on current filter settings
  const filteredArtifacts = useMemo(() => {
    return artifacts.filter(artifact => {
      // Filter by type
      if (filterType !== 'all' && artifact.type !== filterType) {
        return false;
      }
      
      // Filter by folder
      if (filterFolder !== 'all') {
        if (filterFolder === '<No Folder>' && artifact.folder) {
          return false;
        } else if (filterFolder !== '<No Folder>' && artifact.folder !== filterFolder) {
          return false;
        }
      }
      
      // Filter by tag
      if (filterTag !== 'all' && !artifact.tags.includes(filterTag)) {
        return false;
      }
      
      // Filter by search term (title, description)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = artifact.title.toLowerCase().includes(searchLower);
        const descMatch = artifact.description?.toLowerCase().includes(searchLower) || false;
        
        if (!titleMatch && !descMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [artifacts, filterType, filterFolder, filterTag, searchTerm]);

  const handleExport = () => {
    const jsonData = exportArtifacts();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'artifacts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      await importArtifacts(text);
      setImportMessage({ type: 'success', text: 'Artifacts imported successfully!' });
    } catch (err) {
      setImportMessage({ type: 'error', text: 'Failed to import artifacts. Please check the file format.' });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setImportMessage(null);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Artifact Gallery</h1>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading artifacts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">ArtifactVault</h1>
          <Link 
            to="/about" 
            className="ml-4 text-blue-600 hover:text-blue-800 text-sm underline underline-offset-2"
          >
            About
          </Link>
        </div>
        <div className="flex space-x-2">
          <Link to="/create" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Create New Artifact
          </Link>
          <button onClick={handleExport} className="px-4 py-2 border rounded hover:bg-gray-100">Export All</button>
          <button onClick={handleImport} className="px-4 py-2 border rounded hover:bg-gray-100">Import</button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-gray-50 border rounded-lg p-4 mb-4">
        <h2 className="text-lg font-medium mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search artifacts..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Type filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'react' | 'svg' | 'mermaid' | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="react">React Components</option>
              <option value="svg">SVG Images</option>
              <option value="mermaid">Mermaid Diagrams</option>
            </select>
          </div>
          
          {/* Folder filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Folder</label>
            <select
              value={filterFolder}
              onChange={(e) => setFilterFolder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Folders</option>
              <option value="<No Folder>">No Folder</option>
              {allFolders.map(folder => (
                <option key={folder} value={folder}>{folder}</option>
              ))}
            </select>
          </div>
          
          {/* Tag filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Clear filters button */}
        {(filterType !== 'all' || filterFolder !== 'all' || filterTag !== 'all' || searchTerm) && (
          <div className="mt-3 text-right">
            <button
              onClick={() => {
                setFilterType('all');
                setFilterFolder('all');
                setFilterTag('all');
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
      
      {importMessage && (
        <div className={`p-3 mb-4 rounded ${
          importMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {importMessage.text}
        </div>
      )}

      {filteredArtifacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArtifacts.map((artifact) => (
            <div key={artifact.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <h2 className="text-xl font-semibold">{artifact.title || 'Untitled Artifact'}</h2>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    artifact.type === 'react' 
                      ? 'bg-blue-100 text-blue-800' 
                      : artifact.type === 'svg' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                  }`}>
                    {artifact.type === 'react' && 'React'}
                    {artifact.type === 'svg' && 'SVG'}
                    {artifact.type === 'mermaid' && 'Mermaid'}
                  </span>
                </div>
                
                {artifact.folder && (
                  <div className="text-sm mb-2">
                    <span className="text-gray-600">📁 </span>
                    <span className="text-gray-700">{artifact.folder}</span>
                  </div>
                )}
                
                <p className="text-gray-600 mb-2 line-clamp-2">{artifact.description || 'No description'}</p>
                
                {artifact.tags && artifact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {artifact.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="text-sm text-gray-500 mb-4">
                  Created: {new Date(artifact.createdAt).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Link 
                    to={`/view/${artifact.id}`} 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    View
                  </Link>
                  <Link 
                    to={`/edit/${artifact.id}`} 
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          {artifacts.length === 0 ? (
            <>
              <p className="text-gray-600 mb-4">No artifacts found</p>
              <Link to="/create" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Create Your First Artifact
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">No artifacts match your filters</p>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your filter criteria</p>
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterFolder('all');
                  setFilterTag('all');
                  setSearchTerm('');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Clear All Filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}