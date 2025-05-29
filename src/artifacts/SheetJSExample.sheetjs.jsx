import React, { useState, useEffect } from 'react';

// XLSX and window.fs.readFile are expected to be globally available or mocked by ArtifactRunner.
// We can declare them here for TypeScript's benefit if global types aren't set up.
// declare var XLSX: any;
// declare var window: any; // Or more specifically, declare var window: { fs?: { readFile: Function } };


function SheetJSArtifact() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('mockfile.xlsx'); // Default mock file

  const handleLoadFile = async () => {
    if (typeof window.fs === 'undefined' || typeof window.fs.readFile === 'undefined') {
      setError('window.fs.readFile is not available. This artifact requires a file system interface.');
      console.error('SheetJSArtifact: window.fs or window.fs.readFile is undefined.');
      return;
    }
    if (typeof XLSX === 'undefined') {
      setError('XLSX (SheetJS) library is not available.');
      console.error('SheetJSArtifact: XLSX is undefined.');
      return;
    }

    setError('');
    setData(null);

    try {
      // In a real scenario, 'filename.xlsx' would be a user-uploaded file path or chosen.
      // The mock in ArtifactRunner will intercept 'mockfile.xlsx' or any other filename.
      // For this example, we'll just use the state `fileName`.
      console.log(`SheetJSArtifact: Attempting to read file: ${fileName}`);
      
      // window.fs.readFile is expected to be async and take a callback,
      // or return a Promise if promisified. The mock in ArtifactRunner provides a callback style.
      // We'll wrap it in a Promise for easier async/await usage here.
      const fileContent = await new Promise((resolve, reject) => {
        window.fs.readFile(fileName, 'array', (err, content) => {
          if (err) {
            console.error('SheetJSArtifact: Error from window.fs.readFile:', err);
            return reject(err);
          }
          console.log('SheetJSArtifact: File content received from window.fs.readFile.');
          resolve(content);
        });
      });
      
      console.log('SheetJSArtifact: Reading workbook...');
      const workbook = XLSX.read(fileContent, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      console.log(`SheetJSArtifact: First sheet name: ${firstSheetName}`);
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log('SheetJSArtifact: Data parsed successfully:', jsonData.slice(0,5));
      setData(jsonData.slice(0, 5)); // Display first 5 rows
    } catch (e) {
      console.error('SheetJSArtifact: Error processing Excel file:', e);
      setError(`Error processing Excel file: ${e.message}. Check console for details. Ensure the mock file exists or the environment provides window.fs.readFile.`);
    }
  };

  // useEffect to attempt load on mount, if desired, or just rely on button.
  // For now, let's make it button-triggered only.
  // useEffect(() => {
  //   handleLoadFile();
  // }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h3>SheetJS Excel Viewer Artifact</h3>
      <p>
        This component demonstrates reading an Excel file (<code>{fileName}</code>) 
        using SheetJS and <code>window.fs.readFile</code>.
      </p>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="fileNameInput">Filename to load: </label>
        <input 
          type="text" 
          id="fileNameInput"
          value={fileName} 
          onChange={(e) => setFileName(e.target.value)} 
          style={{ marginRight: '10px', padding: '5px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={handleLoadFile} 
          style={{ padding: '8px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Load Excel Data
        </button>
      </div>
      
      {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}><strong>Error:</strong> {error}</p>}
      
      {data === null && !error && <p>Click the button to load data.</p>}
      
      {data && data.length === 0 && <p>No data found in the first sheet or the sheet is empty.</p>}

      {data && data.length > 0 && (
        <div>
          <h4>Displaying first {data.length} rows from "{workbook.SheetNames[0]}" sheet:</h4>
          <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                {Object.keys(data[0] || {}).map(key => (
                  <th key={key} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} style={{ border: '1px solid #ddd', padding: '8px' }}>{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SheetJSArtifact;
