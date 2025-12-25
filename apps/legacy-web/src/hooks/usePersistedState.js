import { useState, useEffect } from 'react';

/**
 * Hook for persisting state to localStorage
 * @param {string} key - localStorage key
 * @param {any} defaultValue - default value if nothing in localStorage
 * @returns {[any, function]} - [state, setState]
 */
export const usePersistedState = (key, defaultValue) => {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading persisted state for key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving persisted state for key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};

/**
 * Hook for persisting filters to URL query params
 * @param {object} defaultFilters - default filter values
 * @returns {[object, function]} - [filters, setFilters]
 */
export const useUrlFilters = (defaultFilters = {}) => {
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFilters = {};
    
    Object.keys(defaultFilters).forEach(key => {
      const value = params.get(key);
      if (value !== null) {
        // Try to parse as JSON, fallback to string
        try {
          urlFilters[key] = JSON.parse(value);
        } catch {
          urlFilters[key] = value;
        }
      }
    });

    return { ...defaultFilters, ...urlFilters };
  });

  useEffect(() => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== defaultFilters[key] && value !== null && value !== undefined && value !== '') {
        params.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [filters, defaultFilters]);

  return [filters, setFilters];
};

export default usePersistedState;
