import { useState, useCallback, useEffect } from "react";

export function useVersionHistory(initialData: any | null, onChange: (data: any) => void) {
  const [history, setHistory] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // Initialize with initial data if provided
  useEffect(() => {
    if (initialData !== null && history.length === 0) {
      setHistory([initialData]);
      setCurrentIndex(0);
    }
  }, [initialData, history.length]);
  
  const addVersion = useCallback((newData: any) => {
    // Don't add if it's the same as current version
    if (currentIndex >= 0 && JSON.stringify(history[currentIndex]) === JSON.stringify(newData)) {
      return;
    }
    
    // If we're not at the end of history, truncate forward history
    const newHistory = history.slice(0, currentIndex + 1);
    
    // Add the new version and update current index
    setHistory([...newHistory, newData]);
    setCurrentIndex(newHistory.length);
  }, [history, currentIndex]);
  
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [history, currentIndex, onChange]);
  
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [history, currentIndex, onChange]);
  
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  
  return { addVersion, undo, redo, canUndo, canRedo };
}
