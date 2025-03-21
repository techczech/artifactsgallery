# Artifacts Gallery

A comprehensive gallery and runtime environment for Claude AI-generated artifacts - store, organize, and run various types of artifacts in one place.

## 🚀 [Try Artifacts Gallery Now!](https://techczech.github.io/artifactsgallery/) - No installation required

![ArtifactVault Screenshot](./screenshot.png)

## Overview

Artifacts Gallery allows you to:

1. **Create and save** artifacts generated by Claude AI
2. **Organize** them with tags and folders in a hierarchical structure
3. **Run** different types of artifacts:
   - React components (with full reactivity)
   - SVG images 
   - Mermaid diagrams
4. **Filter and search** to find exactly what you need
5. **Import and export** your artifact collections
6. **Auto-detect** artifact types based on content
7. **Manage artifacts** with edit and delete functionality

## Origin

Artifacts Gallery was created by Dominik Lukeš ([@techczech](https://github.com/techczech)) using Claude AI. It is based on the original "Claude Artifact Runner" project by Claudio Silva ([original repository](https://github.com/claudio-silva/claude-artifact-runner)), which provided a foundation for running Claude-generated artifacts.

The original project was substantially extended with:
- Support for multiple artifact types (SVG, Mermaid)
- Organization features (tags, hierarchical folders)
- Advanced filtering and search
- Improved user interface
- Automatic type detection
- Artifact management features

This project maintains the MIT License of the original work.

## Key Features

- **Live Component Rendering**: Run React components with JSX syntax directly in the browser
- **SVG Rendering**: Display and edit SVG images with proper sanitization
- **Mermaid Diagrams**: Create and render Mermaid diagrams for flowcharts, sequence diagrams, etc.
- **Hierarchical Folder System**: Navigate through folders like a file explorer
- **Organization System**: Organize artifacts with folders and tags
- **Advanced Filtering**: Filter artifacts by type, folder, tag, or search text
- **Import/Export**: Share collections with others via JSON files
- **GitHub Pages Compatibility**: Works both locally and when deployed
- **Smart Type Detection**: Automatically detects the correct artifact type based on content
- **Download Options**: Download SVG diagrams directly
- **Complete Management**: Edit and delete artifacts as needed

## Recent Improvements

### 1. Hierarchical Folder Navigation
- Browse through folders like a file system
- Navigate with intuitive breadcrumb controls
- See only artifacts in the current folder
- Create subfolders for deeper organization

### 2. Enhanced Folder Selection
- Select from existing folders in a dropdown
- Create new folders with intuitive UI
- Support for creating subfolders
- Real-time path preview

### 3. Automatic Type Detection
- Smart detection of SVG, Mermaid, or React content
- Toggle auto-detection on/off
- Color-coded indicators for different content types
- Improved error handling for incorrect type selection

### 4. Better SVG Support
- Improved detection and rendering of SVG content
- Proper handling of HTML comments in SVG
- Graceful fallback for incorrectly typed content
- Helpful error messages when issues occur

### 5. Image Export Options
- Download SVG diagrams in their original format
- Copy and download functionality for diagram sharing

### 6. Delete Functionality
- Delete button in the artifact view
- Confirmation dialog to prevent accidental deletions
- Redirect to gallery after successful deletion

## How Artifacts Gallery Works

### Browser Storage
Artifacts Gallery uses browser localStorage to store your artifacts, which means:
- Your data persists between sessions without needing a server
- No login or account required
- Your artifacts stay on your device (private by default)
- You can export artifacts to files for sharing or backup

### Artifact Execution
The application uses various technologies to render different types of content:
- React components are transpiled and executed directly in the browser
- SVG images are sanitized and rendered safely
- Mermaid diagrams are processed by the Mermaid.js library

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/techczech/artifactsgallery.git
   cd artifactsgallery
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173` to see the gallery

## Creating and Running Artifacts

1. Click "Create New Artifact" in the gallery
2. Give your artifact a title and description
3. Select the appropriate type (auto-detection will help)
4. Choose an existing folder or create a new one
5. Add relevant tags for better organization
6. Paste your code (type will be automatically detected if enabled)
7. Click "Save Artifact"
8. The artifact will be rendered in the view page

## Artifact Management

### Viewing Artifacts
- Navigate to an artifact to see it rendered
- View the code used to create it
- Access download, edit, and delete options

### Editing Artifacts
- Modify title, description, tags, and folder
- Change the artifact type if needed
- Update the code with new content
- Preview changes before saving

### Deleting Artifacts
- Delete button in the artifact view screen
- Confirmation dialog prevents accidental deletions
- Navigate back to gallery after deletion

## Organization and Filtering

### Folder Navigation
- Navigate through folders with breadcrumb controls
- View subfolders and artifacts in the current folder
- Create nested subfolders for deeper organization
- Return to the root directory with the Home button

### Tagging System
- Add multiple tags to each artifact for categorization
- Filter the gallery by tag to find related artifacts
- Common tags might include purpose (e.g., "dashboard", "form"), style (e.g., "dark", "minimalist"), or status (e.g., "complete", "draft")

### Search and Filtering
- Filter artifacts by type (React, SVG, Mermaid)
- Filter by tags or folders
- Search by title, description, or tags
- Combine filters for precise results
- Sort artifacts by various criteria

## Example Content

### React Component Example
```jsx
import React, { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Counter Example</h2>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setCount(count - 1)}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          -
        </button>
        <span className="text-2xl">{count}</span>
        <button 
          onClick={() => setCount(count + 1)}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;
```

### SVG Example
```html
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Circle and Rectangle -->
  <circle cx="50" cy="50" r="40" stroke="blue" stroke-width="2" fill="red" />
  <rect x="10" y="10" width="30" height="30" fill="green" />
  <text x="50" y="50" font-family="Arial" font-size="10" text-anchor="middle" fill="white">SVG Test</text>
</svg>
```

### Mermaid Example
```
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
```

## Deployment

### GitHub Pages Deployment

1. Update the repository information in package.json:
   ```json
   "homepage": "https://yourusername.github.io/artifactsgallery",
   "repository": {
     "type": "git",
     "url": "https://github.com/yourusername/artifactsgallery.git"
   }
   ```

2. Run the deploy command:
   ```
   npm run deploy
   ```

## Technical Details

Artifacts Gallery is built using:
- **React** with **TypeScript** for the UI framework
- **Vite** for build and development tooling
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Router** for navigation
- **Mermaid.js** for diagram rendering
- **DOMPurify** for SVG sanitization
- **Babel** for JSX transpilation
- **Lucide Icons** for UI elements

## License

This project is open source and available under the [MIT License](LICENSE), the same as the original Claude Artifact Runner.

## Acknowledgements

- [Claudio Silva](https://github.com/claudio-silva) for the original Claude Artifact Runner
- [Claude AI](https://claude.ai) used for development assistance and extending the original project
- All contributors to the libraries and tools used in this project