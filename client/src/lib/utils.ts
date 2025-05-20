import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 172800) {
    return "Yesterday";
  } else {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
  }
}

export function downloadFile(content: string, filename: string, contentType: string) {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<F>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function isValidLottieURL(url: string): boolean {
  return url.trim() !== '' && (
    url.includes('lottiefiles.com') || 
    url.endsWith('.json') || 
    url.endsWith('.lottie')
  );
}

export function extractColorsFromLottie(lottieData: any): string[] {
  const colors = new Set<string>();
  
  function traverseObject(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    
    // Check if this is a color field (expecting array of RGB values)
    if (obj.k && Array.isArray(obj.k) && obj.k.length === 3 && 
        obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
      // Convert RGB 0-1 to hex
      const hexColor = rgbToHex(obj.k[0], obj.k[1], obj.k[2]);
      colors.add(hexColor);
    }
    
    // Recursively check all properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        traverseObject(obj[key]);
      }
    }
  }
  
  traverseObject(lottieData);
  return Array.from(colors);
}

function rgbToHex(r: number, g: number, b: number): string {
  // Convert from 0-1 scale to 0-255
  const rInt = Math.min(255, Math.max(0, Math.round(r * 255)));
  const gInt = Math.min(255, Math.max(0, Math.round(g * 255)));
  const bInt = Math.min(255, Math.max(0, Math.round(b * 255)));
  
  // Convert to hex
  return `#${rInt.toString(16).padStart(2, '0')}${
    gInt.toString(16).padStart(2, '0')}${
    bInt.toString(16).padStart(2, '0')}`.toUpperCase();
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  return [r, g, b];
}

export function replaceColorInLottie(lottieData: any, oldColor: string, newColor: string): any {
  const oldRgb = hexToRgb(oldColor);
  const newRgb = hexToRgb(newColor);
  
  if (!oldRgb || !newRgb) return lottieData;
  
  // Create a deep copy to avoid mutating the original
  const updatedData = JSON.parse(JSON.stringify(lottieData));
  
  function traverseAndReplace(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    
    // Check if this is a color field (expecting array of RGB values)
    if (obj.k && Array.isArray(obj.k) && obj.k.length === 3 && 
        obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
      // Compare with allowed tolerance
      const tolerance = 0.01;
      const r = oldRgb[0];
      const g = oldRgb[1];
      const b = oldRgb[2];
      
      if (
        Math.abs(obj.k[0] - r) < tolerance &&
        Math.abs(obj.k[1] - g) < tolerance &&
        Math.abs(obj.k[2] - b) < tolerance
      ) {
        // Replace with new color
        const [nr, ng, nb] = newRgb;
        obj.k = [nr, ng, nb];
      }
    }
    
    // Recursively check all properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        traverseAndReplace(obj[key]);
      }
    }
  }
  
  traverseAndReplace(updatedData);
  return updatedData;
}

export function replaceAllColorsInLottie(lottieData: any, newColor: string): any {
  const newRgb = hexToRgb(newColor);
  
  if (!newRgb) return lottieData;
  
  // Create a deep copy to avoid mutating the original
  const updatedData = JSON.parse(JSON.stringify(lottieData));
  
  function traverseAndReplaceAll(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    
    // Check if this is a color field (expecting array of RGB values)
    if (obj.k && Array.isArray(obj.k) && obj.k.length === 3 && 
        obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
      // Replace with new color, regardless of original color
      const [r, g, b] = newRgb;
      obj.k = [r, g, b];
    }
    
    // Recursively check all properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        traverseAndReplaceAll(obj[key]);
      }
    }
  }
  
  traverseAndReplaceAll(updatedData);
  return updatedData;
}
