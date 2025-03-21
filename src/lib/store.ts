import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Artifact {
  id: string;
  title: string;
  description?: string;
  type: 'react' | 'svg' | 'mermaid';
  tags: string[];
  folder?: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

interface ArtifactState {
  artifacts: Artifact[];
  loadArtifacts: () => Promise<Artifact[]>;
  getArtifact: (id: string) => Promise<Artifact | undefined>;
  saveArtifact: (id: string, artifactData: Partial<Artifact>) => Promise<void>;
  createArtifact: (artifactData: Omit<Artifact, 'id'>) => Promise<string>;
  deleteArtifact: (id: string) => Promise<void>;
  exportArtifacts: () => string;
  importArtifacts: (jsonData: string) => Promise<void>;
  // Tag and folder management
  addTag: (id: string, tag: string) => Promise<void>;
  removeTag: (id: string, tag: string) => Promise<void>;
  setFolder: (id: string, folder: string) => Promise<void>;
  getAllTags: () => string[];
  getAllFolders: () => string[];
}

export const useArtifactStore = create<ArtifactState>()(
  persist(
    (set, get) => ({
      artifacts: [],
      
      loadArtifacts: async () => {
        // Add new fields to existing artifacts if missing (backward compatibility)
        const currentArtifacts = get().artifacts;
        const updatedArtifacts = currentArtifacts.map(artifact => {
          const updates: Partial<Artifact> = {};
          
          if (!('type' in artifact)) {
            updates.type = 'react' as const;
          }
          
          if (!('tags' in artifact)) {
            updates.tags = [];
          }
          
          if (Object.keys(updates).length > 0) {
            return { ...artifact, ...updates };
          }
          
          return artifact;
        });
        
        if (JSON.stringify(currentArtifacts) !== JSON.stringify(updatedArtifacts)) {
          set({ artifacts: updatedArtifacts });
        }
        
        return updatedArtifacts;
      },
      
      getArtifact: async (id) => {
        return get().artifacts.find(a => a.id === id);
      },
      
      saveArtifact: async (id, artifactData) => {
        set(state => ({
          artifacts: state.artifacts.map(artifact => 
            artifact.id === id ? { ...artifact, ...artifactData } : artifact
          )
        }));
      },
      
      createArtifact: async (artifactData) => {
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        
        // Make sure tags are initialized properly
        const completeArtifact = {
          id,
          ...artifactData,
          tags: artifactData.tags || [],
        } as Artifact;
        
        set(state => ({
          artifacts: [...state.artifacts, completeArtifact]
        }));
        
        return id;
      },
      
      deleteArtifact: async (id) => {
        set(state => ({
          artifacts: state.artifacts.filter(artifact => artifact.id !== id)
        }));
      },
      
      exportArtifacts: () => {
        return JSON.stringify(get().artifacts, null, 2);
      },
      
      importArtifacts: async (jsonData) => {
        try {
          const importedArtifacts = JSON.parse(jsonData);
          if (Array.isArray(importedArtifacts)) {
            // Ensure all imported artifacts have the required fields
            const processedArtifacts = importedArtifacts.map(artifact => ({
              ...artifact,
              type: artifact.type || 'react',
              tags: artifact.tags || [],
              updatedAt: artifact.updatedAt || artifact.createdAt || new Date().toISOString()
            }));
            
            set({ artifacts: processedArtifacts });
          }
        } catch (err) {
          console.error('Failed to import artifacts:', err);
          throw new Error('Invalid JSON format');
        }
      },
      
      // Tag management methods
      addTag: async (id, tag) => {
        if (!tag.trim()) return;
        
        set(state => ({
          artifacts: state.artifacts.map(artifact => 
            artifact.id === id 
              ? { ...artifact, tags: artifact.tags.includes(tag) 
                  ? artifact.tags 
                  : [...artifact.tags, tag] }
              : artifact
          )
        }));
      },
      
      removeTag: async (id, tag) => {
        set(state => ({
          artifacts: state.artifacts.map(artifact => 
            artifact.id === id 
              ? { ...artifact, tags: artifact.tags.filter(t => t !== tag) }
              : artifact
          )
        }));
      },
      
      // Folder management methods
      setFolder: async (id, folder) => {
        set(state => ({
          artifacts: state.artifacts.map(artifact => 
            artifact.id === id 
              ? { ...artifact, folder: folder.trim() || undefined }
              : artifact
          )
        }));
      },
      
      // Get all unique tags and folders for filtering
      getAllTags: () => {
        const artifacts = get().artifacts;
        const tagsSet = new Set<string>();
        
        artifacts.forEach(artifact => {
          artifact.tags.forEach(tag => tagsSet.add(tag));
        });
        
        return Array.from(tagsSet).sort();
      },
      
      getAllFolders: () => {
        const artifacts = get().artifacts;
        const foldersSet = new Set<string>();
        
        artifacts.forEach(artifact => {
          if (artifact.folder) {
            foldersSet.add(artifact.folder);
          }
        });
        
        return Array.from(foldersSet).sort();
      }
    }),
    {
      name: 'artifact-storage',
    }
  )
);