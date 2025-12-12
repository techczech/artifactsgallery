// Test script to add a sample artifact using Lucide icons

// Create a test artifact with Lucide imports
const testArtifact = {
  "title": "Lucide Icons Test",
  "description": "This is a test component that imports various Lucide icons",
  "type": "react",
  "tags": ["test", "icons", "lucide"],
  "folder": "Test",
  "code": `import React from 'react';
import { 
  Image, 
  Cpu, 
  Lightbulb, 
  Sparkles, 
  Database, 
  Smartphone, 
  BrainCircuit, 
  LayoutDashboard,
  Bot, 
  LineChart, 
  DollarSign 
} from 'lucide-react';

const LucideIconsTest = () => {
  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Lucide Icons Test</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center p-3 border rounded">
          <Image size={24} className="text-blue-500" />
          <span className="mt-2 text-sm">Image</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <Cpu size={24} className="text-red-500" />
          <span className="mt-2 text-sm">Cpu</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <Lightbulb size={24} className="text-yellow-500" />
          <span className="mt-2 text-sm">Lightbulb</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <Sparkles size={24} className="text-purple-500" />
          <span className="mt-2 text-sm">Sparkles</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <Database size={24} className="text-green-500" />
          <span className="mt-2 text-sm">Database</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <Smartphone size={24} className="text-blue-500" />
          <span className="mt-2 text-sm">Smartphone</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <BrainCircuit size={24} className="text-indigo-500" />
          <span className="mt-2 text-sm">BrainCircuit</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <LayoutDashboard size={24} className="text-orange-500" />
          <span className="mt-2 text-sm">LayoutDashboard</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <Bot size={24} className="text-gray-500" />
          <span className="mt-2 text-sm">Bot</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <LineChart size={24} className="text-blue-700" />
          <span className="mt-2 text-sm">LineChart</span>
        </div>
        <div className="flex flex-col items-center p-3 border rounded">
          <DollarSign size={24} className="text-green-700" />
          <span className="mt-2 text-sm">DollarSign</span>
        </div>
      </div>
    </div>
  );
};

export default LucideIconsTest;`,
  "createdAt": new Date().toISOString(),
  "updatedAt": new Date().toISOString()
};

// Get the JSON string representation of the artifact
const artifactJson = JSON.stringify([testArtifact], null, 2);

// Log the JSON for importing
console.log("Import the following JSON in the Artifacts Gallery app:");
console.log(artifactJson);

// Copy the output to the clipboard if in browser environment
if (typeof navigator !== 'undefined' && navigator.clipboard) {
  navigator.clipboard.writeText(artifactJson).then(() => {
    console.log("Artifact JSON copied to clipboard!");
  });
}

// Write the artifact to a file for importing
if (typeof require !== 'undefined' && require('fs')) {
  const fs = require('fs');
  fs.writeFileSync('lucide-test-artifact.json', artifactJson);
  console.log("Artifact JSON written to 'lucide-test-artifact.json'");
}
