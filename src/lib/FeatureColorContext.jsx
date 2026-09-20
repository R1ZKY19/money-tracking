import React, { createContext, useState, useContext, useEffect } from 'react';

const FeatureColorContext = createContext();

const FEATURE_COLORS = [
  { name: 'Hijau',  primary: '#367C62', bg: ['bg-emerald-400/20', 'bg-emerald-500/20', 'bg-emerald-600/20'] },
  { name: 'Biru',   primary: '#24658E', bg: ['bg-blue-400/20', 'bg-blue-500/20', 'bg-blue-600/20'] },
  { name: 'Ungu',   primary: '#646988', bg: ['bg-purple-400/20', 'bg-purple-500/20', 'bg-purple-600/20'] },
  { name: 'Merah',  primary: '#AD4B4B', bg: ['bg-red-400/20', 'bg-red-500/20', 'bg-red-600/20'] },
  { name: 'Oranye', primary: '#966C37', bg: ['bg-orange-400/20', 'bg-orange-500/20', 'bg-orange-600/20'] },
  { name: 'Cyan',   primary: '#367F8B', bg: ['bg-cyan-400/20', 'bg-cyan-500/20', 'bg-cyan-600/20'] },
];

export const FeatureColorProvider = ({ children }) => {
  const [colorIndex, setColorIndex] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem('featureColorIndex');
    if (saved) setColorIndex(parseInt(saved));
  }, []);

  const setColor = (index) => {
    setColorIndex(index);
    localStorage.setItem('featureColorIndex', index);
  };

  const currentColor = FEATURE_COLORS[colorIndex];

  return (
    <FeatureColorContext.Provider value={{ colorIndex, setColor, currentColor, FEATURE_COLORS }}>
      {children}
    </FeatureColorContext.Provider>
  );
};

export const useFeatureColor = () => {
  const context = useContext(FeatureColorContext);
  if (!context) throw new Error('useFeatureColor must be used within FeatureColorProvider');
  return context;
};