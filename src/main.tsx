import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createHashRouter, createBrowserRouter } from 'react-router-dom';
import './index.css';
import { ArtifactGallery } from './components/ArtifactGallery';
import { ArtifactEditor } from './components/ArtifactEditor';
import { ArtifactRunner } from './components/ArtifactRunner';
import { ErrorPage } from './components/ErrorPage';
import { AboutPage } from './components/AboutPage';

// Define routes
const routes = [
  {
    path: '/',
    element: <ArtifactGallery />,
    errorElement: <ErrorPage />
  },
  {
    path: '/create',
    element: <ArtifactEditor />,
    errorElement: <ErrorPage />
  },
  {
    path: '/edit/:id',
    element: <ArtifactEditor />,
    errorElement: <ErrorPage />
  },
  {
    path: '/view/:id',
    element: <ArtifactRunner />,
    errorElement: <ErrorPage />
  },
  {
    path: '/about',
    element: <AboutPage />,
    errorElement: <ErrorPage />
  }
];

// Router options
const routerOptions = {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorBoundary: true
  }
};

// Use BrowserRouter for local development and HashRouter for production (GitHub Pages)
// You can adjust this logic based on your deployment needs
const isDevelopment = import.meta.env.DEV;

// Create the appropriate router
const router = isDevelopment 
  ? createBrowserRouter(routes, routerOptions) 
  : createHashRouter(routes, routerOptions);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);