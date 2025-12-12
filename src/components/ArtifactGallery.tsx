import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useArtifactStore } from '../lib/store';
import { Folder, Home, ChevronRight } from 'lucide-react';

export function ArtifactGallery() {
  const { artifacts, loadArtifacts, exportArtifacts, importArtifacts } = useArtifactStore();
  const [loading, setLoading] = useState(true);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filtering and sorting state
  const [filterType, setFilterType] = useState<'react' | 'svg' | 'mermaid' | 'all'>('all');
  const [filterFolder, setFilterFolder] = useState<string | 'all'>('all');
  
  // Folder navigation state
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFolder = searchParams.get('folder') || '';
  const navigate = useNavigate();
  const [filterTag, setFilterTag] = useState<string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
  
  // Get folders and subfolders for the current navigation
  const { foldersInCurrentPath, subFolders, currentFolderArtifacts } = useMemo(() => {
    // Extract all unique folders
    const allFolderPaths = new Set<string>();
    
    // Track which folders are in the current path
    const foldersInPath: string[] = [];
    if (currentFolder) {
      // Split the current folder path and add each level
      const folderParts = currentFolder.split('/');
      let path = '';
      
      for (const part of folderParts) {
        if (path) {
          path += '/' + part;
        } else {
          path = part;
        }
        foldersInPath.push(path);
      }
    }
    
    // Find direct subfolders of the current folder
    const subFoldersSet = new Set<string>();
    
    // Track artifacts in the current folder
    const artifactsInFolder: typeof artifacts = [];
    
    // Process all artifacts
    artifacts.forEach(artifact => {
      if (!artifact.folder) return;
      
      // Normalize folder path to use consistent separators
      const normalizedFolder = artifact.folder.replace(/\\/g, '/');
      allFolderPaths.add(normalizedFolder);
      
      // Check if this artifact is in the current folder
      const isInCurrentFolder = !currentFolder 
        ? !normalizedFolder.includes('/') // If at root, only show top-level folders
        : normalizedFolder.startsWith(currentFolder + '/') || normalizedFolder === currentFolder;
        
      if (isInCurrentFolder) {
        // If exactly in this folder (not in a subfolder)
        if (normalizedFolder === currentFolder) {
          artifactsInFolder.push(artifact);
        }
        // Extract direct subfolders
        else if (normalizedFolder.startsWith(currentFolder + '/')) {
          const remaining = normalizedFolder.substring(currentFolder.length + 1);
          const nextLevel = remaining.split('/')[0];
          if (nextLevel) {
            const subFolderPath = currentFolder ? `${currentFolder}/${nextLevel}` : nextLevel;
            subFoldersSet.add(subFolderPath);
          }
        }
      }
    });
    
    // For root level (no current folder), find all top-level folders
    if (!currentFolder) {
      artifacts.forEach(artifact => {
        if (!artifact.folder) {
          artifactsInFolder.push(artifact);
        } else {
          const normalizedFolder = artifact.folder.replace(/\\/g, '/');
          if (!normalizedFolder.includes('/')) {
            subFoldersSet.add(normalizedFolder);
          }
        }
      });
    }
    
    return {
      foldersInCurrentPath: foldersInPath,
      subFolders: Array.from(subFoldersSet).sort(),
      currentFolderArtifacts: artifactsInFolder
    };
  }, [artifacts, currentFolder]);

  // Apply additional filters and sorting to artifacts in current folder
  const filteredAndSortedArtifacts = useMemo(() => {
    // Filter artifacts based on other criteria (except folder which is handled by navigation)
    const filtered = currentFolderArtifacts.filter(artifact => {
      // Filter by type
      if (filterType !== 'all' && artifact.type !== filterType) {
        return false;
      }
      
      // Filter by tag
      if (filterTag !== 'all' && !artifact.tags.includes(filterTag)) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = artifact.title.toLowerCase().includes(searchLower);
        const descMatch = artifact.description?.toLowerCase().includes(searchLower) || false;
        const tagMatch = artifact.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!titleMatch && !descMatch && !tagMatch) {
          return false;
        }
      }
      
      return true;
    });
    
    // Then, sort the filtered artifacts
    return [...filtered].sort((a, b) => {
      // Handle different sort fields
      if (sortBy === 'title') {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        return sortOrder === 'asc' 
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      } else {
        // Sort by date (createdAt or updatedAt)
        const dateA = new Date(a[sortBy]).getTime();
        const dateB = new Date(b[sortBy]).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
  }, [currentFolderArtifacts, filterType, filterTag, searchTerm, sortBy, sortOrder]);

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

  // Navigation functions
  const navigateToFolder = (folderPath: string) => {
    setSearchParams(folderPath ? { folder: folderPath } : {});
    
    // Reset other filters when navigating
    setFilterType('all');
    setFilterTag('all');
    setSearchTerm('');
  };
  
  const navigateToParentFolder = () => {
    if (!currentFolder) return;
    
    const parts = currentFolder.split('/');
    if (parts.length <= 1) {
      // If at top level, go to root
      setSearchParams({});
    } else {
      // Go up one level
      parts.pop();
      const parentPath = parts.join('/');
      setSearchParams(parentPath ? { folder: parentPath } : {});
    }
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
        <h1 className="text-2xl font-bold mb-4">Artifacts Gallery</h1>
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
          <h1 className="text-2xl font-bold">Artifacts Gallery</h1>
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
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center mb-4 bg-gray-50 px-4 py-2 rounded border overflow-x-auto">
        <button 
          onClick={() => navigateToFolder('')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <Home size={16} className="mr-1" />
          <span>Home</span>
        </button>
        
        {foldersInCurrentPath.map((folder, index) => (
          <div key={folder} className="flex items-center">
            <ChevronRight size={16} className="mx-2 text-gray-400" />
            <button 
              onClick={() => navigateToFolder(folder)}
              className={`flex items-center ${index === foldersInCurrentPath.length - 1 
                ? 'font-semibold text-gray-800' 
                : 'text-blue-600 hover:text-blue-800'}`}
            >
              {folder.split('/').pop()}
            </button>
          </div>
        ))}
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

      {/* Folders */}
      {subFolders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-3">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {subFolders.map((folderPath) => {
              const folderName = folderPath.split('/').pop();
              return (
                <button
                  key={folderPath}
                  onClick={() => navigateToFolder(folderPath)}
                  className="flex items-center p-3 border rounded bg-white hover:bg-blue-50 transition-colors text-left"
                >
                  <Folder size={20} className="mr-2 text-blue-500" />
                  <span className="font-medium">{folderName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Artifacts */}
      <div className="mb-3 flex justify-between items-center">
        <h2 className="text-lg font-medium">
          {currentFolder ? 'Artifacts in this folder' : 'Artifacts without folder'}
        </h2>
        
        {/* Sorting controls (can be expanded later) */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updatedAt' | 'createdAt' | 'title')}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="updatedAt">Sort by: Last Updated</option>
            <option value="createdAt">Sort by: Created</option>
            <option value="title">Sort by: Title</option>
          </select>
          
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 border rounded hover:bg-gray-100"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
      
      {filteredAndSortedArtifacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSortedArtifacts.map((artifact) => (
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
          ) : subFolders.length > 0 && filteredAndSortedArtifacts.length === 0 && !searchTerm && filterType === 'all' && filterTag === 'all' ? (
            <>
              <p className="text-gray-600 mb-2">This folder contains subfolders but no direct artifacts</p>
              <p className="text-gray-500 text-sm mb-4">Navigate into a subfolder to view its contents</p>
            </>
          ) : currentFolder && filteredAndSortedArtifacts.length === 0 && !searchTerm && filterType === 'all' && filterTag === 'all' ? (
            <>
              <p className="text-gray-600 mb-2">This folder is empty</p>
              <div className="flex space-x-2 mt-4">
                <Link to="/create" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                  Create New Artifact
                </Link>
                <button
                  onClick={navigateToParentFolder}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Go Back
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">No artifacts match your filters</p>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your filter criteria</p>
              <button
                onClick={() => {
                  setFilterType('all');
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