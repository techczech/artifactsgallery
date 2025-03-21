import React from 'react';
import { useRouteError, Link } from 'react-router-dom';

export function ErrorPage() {
  const error = useRouteError();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Oops!</h1>
        <p className="mb-4">Sorry, an unexpected error has occurred.</p>
        <p className="p-3 bg-gray-100 rounded mb-4 font-mono text-sm overflow-auto">
          {error instanceof Error 
            ? error.message
            : (typeof error === 'object' && error !== null && 'statusText' in error)
              ? (error as any).statusText
              : 'Unknown error'}
        </p>
        <div className="text-center mt-6">
          <Link to="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Go to Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}