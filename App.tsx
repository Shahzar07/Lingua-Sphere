
import React from 'react';
import { Dashboard } from './components/Dashboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen selection:bg-red-900/30">
      <Dashboard />
    </div>
  );
};

export default App;
