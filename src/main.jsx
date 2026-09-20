import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/components/demo/demoBootstrap'
import '@/index.css'
import '@/components/theme/enterprise.css'

// Load providers only after the demo storage/network boundary has been installed.
import('@/App.jsx').then(({ default: App }) => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
});