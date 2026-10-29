import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // textScale: 'compact' | 'normal' | 'large'
  const [textScale, setTextScale] = useState(() => {
    return localStorage.getItem('khataking_text_scale') || 'normal';
  });

  // density: 'compact' | 'normal' | 'spacious'
  const [density, setDensity] = useState(() => {
    return localStorage.getItem('khataking_density') || 'compact';
  });

  useEffect(() => {
    localStorage.setItem('khataking_text_scale', textScale);
    document.documentElement.setAttribute('data-text-scale', textScale);
  }, [textScale]);

  useEffect(() => {
    localStorage.setItem('khataking_density', density);
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  return (
    <SettingsContext.Provider value={{ textScale, setTextScale, density, setDensity }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

