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
    
    // Detect [r, g, b] 0-1 (padrão)
    if (obj.k && Array.isArray(obj.k) && obj.k.length === 3 &&
        obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
      const hexColor = rgbToHex(obj.k[0], obj.k[1], obj.k[2]);
      colors.add(hexColor);
    }
    // Detect [r, g, b, a] 0-1
    else if (obj.k && Array.isArray(obj.k) && obj.k.length === 4 &&
        obj.k.slice(0, 3).every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
      const hexColor = rgbToHex(obj.k[0], obj.k[1], obj.k[2]);
      colors.add(hexColor);
    }
    // Detect [r, g, b] 0-255
    else if (obj.k && Array.isArray(obj.k) && obj.k.length === 3 &&
        obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 255)) {
      const hexColor = rgbToHex(obj.k[0] / 255, obj.k[1] / 255, obj.k[2] / 255);
      colors.add(hexColor);
    }
    // Detect [r, g, b, a] 0-255
    else if (obj.k && Array.isArray(obj.k) && obj.k.length === 4 &&
        obj.k.slice(0, 3).every((val: any) => typeof val === 'number' && val >= 0 && val <= 255)) {
      const hexColor = rgbToHex(obj.k[0] / 255, obj.k[1] / 255, obj.k[2] / 255);
      colors.add(hexColor);
    }
    // Detect hex string
    else if (typeof obj.k === 'string' && /^#([A-Fa-f0-9]{6})$/.test(obj.k)) {
      colors.add(obj.k.toUpperCase());
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

function isColorContext(obj: any, parentKey: string | null, parentObj: any): boolean {
  // Se a chave do pai for 'c', é cor
  if (parentKey === 'c') return true;
  // Se o objeto pai tem ty: 'st' (stroke) ou 'fl' (fill), é cor
  if (parentObj && (parentObj.ty === 'st' || parentObj.ty === 'fl')) return true;
  return false;
}

function logColorChange(context: string, oldVal: any, newVal: any, parentKey: string | null, parentObj: any) {
  // eslint-disable-next-line no-console
  console.log(`[LottieColorEdit] ${context} | parentKey: ${parentKey} | parentObj.ty: ${parentObj?.ty} | from:`, oldVal, '| to:', newVal);
}

export function replaceColorInLottie(lottieData: any, oldColor: string, newColor: string): any {
  const oldRgb = hexToRgb(oldColor);
  const newRgb = hexToRgb(newColor);
  if (!oldRgb || !newRgb) return lottieData;
  const updatedData = JSON.parse(JSON.stringify(lottieData));
  function traverseAndReplace(obj: any, parentKey: string | null = null, parentObj: any = null) {
    if (!obj || typeof obj !== 'object') return;
    // [r, g, b] 0-1
    if (isColorContext(obj, parentKey, parentObj) && obj.k && Array.isArray(obj.k) && obj.k.length === 3 &&
        obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
      const tolerance = 0.01;
      if (
        oldRgb && newRgb &&
        Math.abs(obj.k[0] - oldRgb[0]) < tolerance &&
        Math.abs(obj.k[1] - oldRgb[1]) < tolerance &&
        Math.abs(obj.k[2] - oldRgb[2]) < tolerance
      ) {
        logColorChange('replaceColorInLottie [0-1]', obj.k, newRgb, parentKey, parentObj);
        obj.k = [...newRgb];
      }
    }
    // [r, g, b, a] 0-1
    else if (isColorContext(obj, parentKey, parentObj) && obj.k && Array.isArray(obj.k) && obj.k.length === 4 &&
        obj.k.slice(0, 3).every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
      const tolerance = 0.01;
      if (
        oldRgb && newRgb &&
        Math.abs(obj.k[0] - oldRgb[0]) < tolerance &&
        Math.abs(obj.k[1] - oldRgb[1]) < tolerance &&
        Math.abs(obj.k[2] - oldRgb[2]) < tolerance
      ) {
        logColorChange('replaceColorInLottie [0-1, alpha]', obj.k, [...newRgb, obj.k[3]], parentKey, parentObj);
        obj.k = [...newRgb, obj.k[3]];
      }
    }
    // [r, g, b] 0-255
    else if (isColorContext(obj, parentKey, parentObj) && obj.k && Array.isArray(obj.k) && obj.k.length === 3 &&
        obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 255)) {
      const tolerance = 2; // 0-255 scale
      if (
        oldRgb && newRgb &&
        Math.abs(obj.k[0] - oldRgb[0] * 255) < tolerance &&
        Math.abs(obj.k[1] - oldRgb[1] * 255) < tolerance &&
        Math.abs(obj.k[2] - oldRgb[2] * 255) < tolerance
      ) {
        logColorChange('replaceColorInLottie [0-255]', obj.k, [newRgb[0] * 255, newRgb[1] * 255, newRgb[2] * 255], parentKey, parentObj);
        obj.k = [newRgb[0] * 255, newRgb[1] * 255, newRgb[2] * 255];
      }
    }
    // [r, g, b, a] 0-255
    else if (isColorContext(obj, parentKey, parentObj) && obj.k && Array.isArray(obj.k) && obj.k.length === 4 &&
        obj.k.slice(0, 3).every((val: any) => typeof val === 'number' && val >= 0 && val <= 255)) {
      const tolerance = 2;
      if (
        oldRgb && newRgb &&
        Math.abs(obj.k[0] - oldRgb[0] * 255) < tolerance &&
        Math.abs(obj.k[1] - oldRgb[1] * 255) < tolerance &&
        Math.abs(obj.k[2] - oldRgb[2] * 255) < tolerance
      ) {
        logColorChange('replaceColorInLottie [0-255, alpha]', obj.k, [newRgb[0] * 255, newRgb[1] * 255, newRgb[2] * 255, obj.k[3]], parentKey, parentObj);
        obj.k = [newRgb[0] * 255, newRgb[1] * 255, newRgb[2] * 255, obj.k[3]];
      }
    }
    // hex string
    else if (isColorContext(obj, parentKey, parentObj) && typeof obj.k === 'string' && /^#([A-Fa-f0-9]{6})$/.test(obj.k)) {
      if (obj.k.toUpperCase() === oldColor.toUpperCase()) {
        logColorChange('replaceColorInLottie [hex]', obj.k, newColor.toUpperCase(), parentKey, parentObj);
        obj.k = newColor.toUpperCase();
      }
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        traverseAndReplace(obj[key], key, obj);
      }
    }
  }
  traverseAndReplace(updatedData);
  return updatedData;
}

export function replaceAllColorsInLottie(lottieData: any, newColor: string): any {
  const newRgb = hexToRgb(newColor);
  if (!newRgb) return lottieData;
  const updatedData = JSON.parse(JSON.stringify(lottieData));
  function traverseAndReplaceAll(obj: any, parentKey: string | null = null, parentObj: any = null) {
    if (!obj || typeof obj !== 'object') return;
    // [r, g, b] 0-1
    if (isColorContext(obj, parentKey, parentObj) && obj.k && Array.isArray(obj.k) && obj.k.length === 3 &&
        obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
      if (newRgb) {
        logColorChange('replaceAllColorsInLottie [0-1]', obj.k, [newRgb[0], newRgb[1], newRgb[2]], parentKey, parentObj);
        obj.k = [newRgb[0], newRgb[1], newRgb[2]];
      }
    }
    // [r, g, b, a] 0-1
    else if (isColorContext(obj, parentKey, parentObj) && obj.k && Array.isArray(obj.k) && obj.k.length === 4 &&
        obj.k.slice(0, 3).every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
      if (newRgb) {
        logColorChange('replaceAllColorsInLottie [0-1, alpha]', obj.k, [newRgb[0], newRgb[1], newRgb[2], obj.k[3]], parentKey, parentObj);
        obj.k = [newRgb[0], newRgb[1], newRgb[2], obj.k[3]];
      }
    }
    // [r, g, b] 0-255
    else if (isColorContext(obj, parentKey, parentObj) && obj.k && Array.isArray(obj.k) && obj.k.length === 3 &&
        obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 255)) {
      if (newRgb) {
        logColorChange('replaceAllColorsInLottie [0-255]', obj.k, [newRgb[0] * 255, newRgb[1] * 255, newRgb[2] * 255], parentKey, parentObj);
        obj.k = [newRgb[0] * 255, newRgb[1] * 255, newRgb[2] * 255];
      }
    }
    // [r, g, b, a] 0-255
    else if (isColorContext(obj, parentKey, parentObj) && obj.k && Array.isArray(obj.k) && obj.k.length === 4 &&
        obj.k.slice(0, 3).every((val: any) => typeof val === 'number' && val >= 0 && val <= 255)) {
      if (newRgb) {
        logColorChange('replaceAllColorsInLottie [0-255, alpha]', obj.k, [newRgb[0] * 255, newRgb[1] * 255, newRgb[2] * 255, obj.k[3]], parentKey, parentObj);
        obj.k = [newRgb[0] * 255, newRgb[1] * 255, newRgb[2] * 255, obj.k[3]];
      }
    }
    // hex string
    else if (isColorContext(obj, parentKey, parentObj) && typeof obj.k === 'string' && /^#([A-Fa-f0-9]{6})$/.test(obj.k)) {
      logColorChange('replaceAllColorsInLottie [hex]', obj.k, newColor.toUpperCase(), parentKey, parentObj);
      obj.k = newColor.toUpperCase();
    }
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        traverseAndReplaceAll(obj[key], key, obj);
      }
    }
  }
  traverseAndReplaceAll(updatedData);
  return updatedData;
}
