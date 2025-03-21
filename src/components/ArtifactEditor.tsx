import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArtifactStore } from '../lib/store';
import { Folder, FolderPlus, ChevronDown } from 'lucide-react';

export function ArtifactEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getArtifact, saveArtifact, createArtifact, getAllFolders } = useArtifactStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'react' | 'svg' | 'mermaid'>('react');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [folder, setFolder] = useState('');
  const [folderMode, setFolderMode] = useState<'select' | 'create'>('select');
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState('');
  const [isSubfolder, setIsSubfolder] = useState(false);
  const [parentFolder, setParentFolder] = useState('');
  const [code, setCode] = useState('');
  const [autodetectType, setAutodetectType] = useState(true);
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!id;

  // Load existing folders
  useEffect(() => {
    const loadFolders = async () => {
      const folders = getAllFolders();
      
      // Sort folders by path depth, then alphabetically
      const sortedFolders = [...folders].sort((a, b) => {
        const depthA = a.split('/').length;
        const depthB = b.split('/').length;
        if (depthA !== depthB) return depthA - depthB;
        return a.localeCompare(b);
      });
      
      setExistingFolders(sortedFolders);
    };
    
    loadFolders();
  }, [getAllFolders]);

  // Load artifact for editing
  useEffect(() => {
    const loadArtifact = async () => {
      if (id) {
        try {
          const artifact = await getArtifact(id);
          if (artifact) {
            setTitle(artifact.title || '');
            setDescription(artifact.description || '');
            setType(artifact.type);
            setTags(artifact.tags || []);
            
            // Handle folder
            if (artifact.folder) {
              setFolder(artifact.folder);
              // If it's a subfolder, set the parent
              if (artifact.folder.includes('/')) {
                setIsSubfolder(true);
                const lastSlashIndex = artifact.folder.lastIndexOf('/');
                setParentFolder(artifact.folder.substring(0, lastSlashIndex));
                setNewFolder(artifact.folder.substring(lastSlashIndex + 1));
              } else {
                setNewFolder(artifact.folder);
              }
            }
            
            setCode(artifact.code || '');
          } else {
            setError('Artifact not found');
          }
        } catch (err) {
          setError('Failed to load artifact');
          console.error(err);
        }
        setLoading(false);
      }
    };

    loadArtifact();
  }, [id, getArtifact]);

  // Handle folder changes
  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setFolderMode('create');
      setFolder('');
      setNewFolder('');
      setIsSubfolder(false);
      setParentFolder('');
    } else {
      setFolderMode('select');
      setFolder(value);
    }
  };

  // Update the final folder path when subfolder inputs change
  useEffect(() => {
    if (folderMode === 'create') {
      if (isSubfolder && parentFolder && newFolder) {
        setFolder(`${parentFolder}/${newFolder}`);
      } else if (!isSubfolder && newFolder) {
        setFolder(newFolder);
      } else {
        setFolder('');
      }
    }
  }, [folderMode, isSubfolder, parentFolder, newFolder]);
  
  // Detect artifact type from code content
  useEffect(() => {
    if (!autodetectType || !code.trim()) return;
    
    // Function to detect type based on code content
    const detectType = (codeContent: string) => {
      const trimmedCode = codeContent.trim();
      
      // Check for SVG - more comprehensive detection
      if (trimmedCode.includes('<svg') || 
          trimmedCode.match(/<svg\s+[^>]*>/i) ||
          trimmedCode.includes('<!--') && // HTML comments often indicate SVG
          (trimmedCode.includes('<rect') || 
           trimmedCode.includes('<circle') || 
           trimmedCode.includes('<path') || 
           trimmedCode.includes('<g') || 
           trimmedCode.includes('<polygon'))) {
        return 'svg' as const;
      }
      
      // Check for Mermaid - common mermaid diagram types
      const mermaidPatterns = [
        /^graph\s+[A-Za-z0-9]/i,
        /^flowchart\s+[A-Za-z0-9]/i,
        /^sequenceDiagram/i,
        /^classDiagram/i,
        /^stateDiagram/i,
        /^stateDiagram-v2/i,
        /^erDiagram/i,
        /^journey/i,
        /^gantt/i,
        /^pie/i,
        /^pie\s+title/i,
        /^mindmap/i
      ];
      
      if (mermaidPatterns.some(pattern => pattern.test(trimmedCode))) {
        return 'mermaid' as const;
      }
      
      // Check for React-like syntax
      // Don't detect as React if it contains HTML comments
      if (!trimmedCode.includes('<!--') && (
          trimmedCode.includes('import React') || 
          trimmedCode.includes('function') && trimmedCode.includes('return') ||
          trimmedCode.includes('class') && trimmedCode.includes('extends') ||
          trimmedCode.includes('useState') || 
          trimmedCode.includes('useEffect') ||
          trimmedCode.includes('export default'))) {
        return 'react' as const;
      }
      
      // Don't change type if we can't confidently detect it
      return null;
    };
    
    const detectedType = detectType(code);
    if (detectedType && detectedType !== type) {
      setType(detectedType);
    }
  }, [code, type, autodetectType]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!code.trim()) {
      setError('Code is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const artifactData = {
        title,
        description,
        type,
        tags,
        folder: folder.trim() || undefined,
        code,
        updatedAt: new Date().toISOString()
      };

      if (isEditing && id) {
        await saveArtifact(id, artifactData);
        setSaving(false);
        navigate(`/view/${id}`);
      } else {
        const newId = await createArtifact({
          ...artifactData,
          tags: tags || [],
          createdAt: new Date().toISOString()
        });
        setSaving(false);
        navigate(`/view/${newId}`);
      }
    } catch (err) {
      console.error('Error saving artifact:', err);
      setError('Failed to save artifact');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading artifact...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Artifact' : 'Create New Artifact'}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter artifact title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter artifact description"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-700">Type</label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autodetect-type"
                checked={autodetectType}
                onChange={(e) => setAutodetectType(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="autodetect-type" className="text-xs text-gray-600">
                Auto-detect from code
              </label>
            </div>
          </div>
          
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'react' | 'svg' | 'mermaid')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              autodetectType ? 'bg-gray-50' : ''
            }`}
          >
            <option value="react">React Component</option>
            <option value="svg">SVG Image</option>
            <option value="mermaid">Mermaid Diagram</option>
          </select>
          
          <div className="mt-1 flex items-start">
            <div className={`h-4 w-4 mt-0.5 rounded-full ${
              type === 'react' ? 'bg-blue-500' : 
              type === 'svg' ? 'bg-green-500' : 
              'bg-purple-500'
            }`}></div>
            <p className="ml-2 text-sm text-gray-500">
              {type === 'react' && 'A React component that will be executed in the browser'}
              {type === 'svg' && 'An SVG image defined with XML tags'}
              {type === 'mermaid' && 'A diagram created with Mermaid syntax'}
            </p>
          </div>
          
          {autodetectType && (
            <p className="mt-1 text-xs text-gray-500 italic">
              Type will be automatically detected as you enter code
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Folder (optional)</label>
          
          <div className="space-y-3">
            {/* Folder Mode Selection */}
            <div className="flex items-center space-x-3">
              <div className={`flex items-center flex-grow ${folderMode === 'select' ? 'border-2 border-blue-500' : 'border'} rounded-md overflow-hidden`}>
                <div className="bg-gray-100 p-2">
                  <Folder size={20} className="text-gray-600" />
                </div>
                <select
                  value={folderMode === 'select' ? folder : 'new'}
                  onChange={handleFolderChange}
                  className="w-full px-3 py-2 border-none focus:ring-0 focus:outline-none"
                >
                  <option value="">No Folder</option>
                  {existingFolders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="new">+ Create New Folder</option>
                </select>
              </div>
            </div>
            
            {/* New Folder Creation UI */}
            {folderMode === 'create' && (
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                <div className="flex items-center mb-2">
                  <FolderPlus size={18} className="mr-2 text-blue-500" />
                  <span className="font-medium">Create New Folder</span>
                </div>
                
                <div className="space-y-3">
                  {/* Subfolder Option */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is-subfolder"
                      checked={isSubfolder}
                      onChange={(e) => {
                        setIsSubfolder(e.target.checked);
                        if (!e.target.checked) {
                          setParentFolder('');
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="is-subfolder" className="text-sm">
                      Create as subfolder
                    </label>
                  </div>
                  
                  {/* Parent Folder Selection */}
                  {isSubfolder && (
                    <div>
                      <label className="block text-sm mb-1">Parent Folder</label>
                      <select
                        value={parentFolder}
                        onChange={(e) => setParentFolder(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Select a parent folder</option>
                        {existingFolders.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* New Folder Name */}
                  <div>
                    <label className="block text-sm mb-1">
                      {isSubfolder ? 'Subfolder Name' : 'Folder Name'}
                    </label>
                    <input
                      type="text"
                      value={newFolder}
                      onChange={(e) => setNewFolder(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Components, Charts, Icons"
                    />
                  </div>
                  
                  {/* Preview of full path */}
                  {newFolder && (
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Full path:</span> {folder || "(none)"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <p className="mt-1 text-sm text-gray-500">
            Organize artifacts in folders for easier navigation
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <div key={tag} className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => setTags(tags.filter(t => t !== tag))}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag.trim()) {
                  e.preventDefault();
                  if (!tags.includes(newTag.trim())) {
                    setTags([...tags, newTag.trim()]);
                  }
                  setNewTag('');
                }
              }}
              className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={() => {
                if (newTag.trim() && !tags.includes(newTag.trim())) {
                  setTags([...tags, newTag.trim()]);
                  setNewTag('');
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r-md"
            >
              Add
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Tags help with filtering and finding related artifacts
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'react' && 'Component Code'}
            {type === 'svg' && 'SVG Code'}
            {type === 'mermaid' && 'Mermaid Syntax'}
          </label>
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={15}
              className={`w-full px-3 py-2 border-2 rounded-md shadow-sm focus:outline-none focus:ring-0 font-mono ${
                type === 'react' 
                  ? 'border-blue-200 focus:border-blue-500' 
                  : type === 'svg' 
                    ? 'border-green-200 focus:border-green-500'
                    : 'border-purple-200 focus:border-purple-500'
              }`}
              placeholder={
                type === 'react' 
                  ? 'Paste your React component code here' 
                  : type === 'svg' 
                    ? 'Paste your SVG code here (must include <svg> tags)'
                    : 'Paste your Mermaid diagram syntax here'
              }
            />
            {autodetectType && code && (
              <div className="absolute top-3 right-3">
                <div className={`px-2 py-1 rounded text-xs text-white ${
                  type === 'react' ? 'bg-blue-500' : 
                  type === 'svg' ? 'bg-green-500' : 
                  'bg-purple-500'
                }`}>
                  {type === 'react' && 'React'}
                  {type === 'svg' && 'SVG'}
                  {type === 'mermaid' && 'Mermaid'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Artifact'}
        </button>
        
        <button
          onClick={() => navigate(id ? `/view/${id}` : '/')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          {id ? 'View Artifact' : 'Cancel'}
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded"
        >
          Back to Gallery
        </button>
      </div>
    </div>
  );
}