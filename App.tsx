import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { UserProfile } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'app'>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentView('app');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-red-900/20">
      {currentView === 'landing' && (
        <LandingPage onEnter={() => setCurrentView('onboarding')} />
      )}
      
      {currentView === 'onboarding' && (
        <Onboarding 
          onComplete={handleOnboardingComplete} 
          onBack={() => setCurrentView('landing')} 
        />
      )}

      {currentView === 'app' && (
        <Dashboard 
          userProfile={userProfile} 
          onLogout={() => setCurrentView('landing')} 
        />
      )}
    </div>
  );
};

export default App;