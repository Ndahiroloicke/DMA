/**
 * SEARCH HISTORY — in-memory list updated AFTER a successful API response.
 * SearchScreen and WordDetailScreen call addToHistory(word) when searchWord() succeeds.
 * Drawer shows this list; tapping a word navigates without wordData → detail screen re-fetches API.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const SearchHistoryContext = createContext(null);

export const SearchHistoryProvider = ({ children }) => {
  const [history, setHistory] = useState([]);

  /** Called after API success — keeps last 50 unique words for the drawer (Activity 4). */
  const addToHistory = useCallback((word) => {
    const normalized = word.trim().toLowerCase();
    setHistory((prev) => {
      if (prev.includes(normalized)) return prev;
      return [normalized, ...prev].slice(0, 50);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return (
    <SearchHistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </SearchHistoryContext.Provider>
  );
};

export const useSearchHistory = () => {
  const ctx = useContext(SearchHistoryContext);
  if (!ctx) throw new Error('useSearchHistory must be used within SearchHistoryProvider');
  return ctx;
};
