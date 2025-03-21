import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useArtifactStore } from '../lib/store';

export function ArtifactEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getArtifact, saveArtifact, createArtifact } = useArtifactStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'react' | 'svg' | 'mermaid'>('react');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [folder, setFolder] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!id;

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
            setFolder(artifact.folder || '');
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'react' | 'svg' | 'mermaid')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="react">React Component</option>
            <option value="svg">SVG Image</option>
            <option value="mermaid">Mermaid Diagram</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {type === 'react' && 'A React component that will be executed in the browser'}
            {type === 'svg' && 'An SVG image defined with XML tags'}
            {type === 'mermaid' && 'A diagram created with Mermaid syntax'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Folder (optional)</label>
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., UIs, Diagrams, Icons"
          />
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
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
            placeholder={
              type === 'react' 
                ? 'Paste your React component code here' 
                : type === 'svg' 
                  ? 'Paste your SVG code here (must include <svg> tags)'
                  : 'Paste your Mermaid diagram syntax here'
            }
          />
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