import React from 'react';

const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div
        className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"
        aria-label="Loading"
      />
    </div>
  );
};

export default AuthLoadingScreen;
