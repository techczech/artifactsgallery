import React from 'react';
import { useNavigate } from 'react-router-dom';

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">About Artifacts Gallery</h1>
        <button
          onClick={() => navigate('/')}
          className="border border-gray-300 hover:bg-gray-100 px-3 py-1 rounded text-sm"
        >
          Back to Gallery
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">What is Artifacts Gallery?</h2>
          <p className="text-gray-700">
            Artifacts Gallery is a comprehensive tool for creating, managing, and running artifacts generated by Claude AI. 
            It allows you to save, organize, and view various types of content:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
            <li>React components (with full reactivity)</li>
            <li>SVG images</li>
            <li>Mermaid diagrams</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Key Features</h2>
          <ul className="list-disc ml-6 space-y-1 text-gray-700">
            <li>Live component rendering with state management</li>
            <li>SVG rendering with sanitization</li>
            <li>Mermaid diagram visualization</li>
            <li>Tagging system for organization</li>
            <li>Folder categorization</li>
            <li>Advanced filtering and search</li>
            <li>Import/export functionality for sharing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">How It Works</h2>
          <p className="text-gray-700">
            ArtifactVault uses browser localStorage to store your artifacts, which means:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
            <li>Your data persists between sessions without needing a server</li>
            <li>No login or account required</li>
            <li>Your artifacts stay on your device (private by default)</li>
            <li>You can export artifacts to files for sharing or backup</li>
          </ul>
          <p className="mt-3 text-gray-700">
            The application uses various technologies to render different types of content:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
            <li>React components are transpiled and executed directly in the browser</li>
            <li>SVG images are sanitized and rendered safely</li>
            <li>Mermaid diagrams are processed by the Mermaid.js library</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Origins</h2>
          <p className="text-gray-700">
            Artifacts Gallery was created by Dominik Lukeš (techczech on GitHub and X) using Claude AI. It is based on the original "Claude Artifact Runner" 
            project by Claudio Silva, which provided a foundation for running Claude-generated artifacts.
          </p>
          <p className="mt-2 text-gray-700">
            The original project was extended with:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1 text-gray-700">
            <li>Support for multiple artifact types (SVG, Mermaid)</li>
            <li>Organization features (tags, folders)</li>
            <li>Advanced filtering and search</li>
            <li>Improved user interface</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">License</h2>
          <p className="text-gray-700">
            This project is open source and available under the MIT License, the same as the original Claude Artifact Runner.
          </p>
        </section>

        <div className="pt-4 border-t text-center text-gray-500 text-sm">
          Created by Dominik Lukeš (@techczech) with ❤️ and Claude AI (2025)
        </div>
      </div>
    </div>
  );
}
