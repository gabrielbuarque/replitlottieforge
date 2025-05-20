import { useCallback, useState } from "react";
import { extractColorsFromLottie } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface ColorItem {
  color: string;
  count: number;
  id: string;
}

export function useColorDetection() {
  const [detectedColors, setDetectedColors] = useState<ColorItem[]>([]);
  
  // Counts occurrences of each color
  const countColorOccurrences = (lottieData: any, colors: string[]): Record<string, number> => {
    const colorCounts: Record<string, number> = {};
    colors.forEach(color => colorCounts[color] = 0);
    
    const countInObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      // Check if this is a color field
      if (obj.k && Array.isArray(obj.k) && obj.k.length === 3 && 
          obj.k.every((val: any) => typeof val === 'number' && val >= 0 && val <= 1)) {
        const r = Math.round(obj.k[0] * 255);
        const g = Math.round(obj.k[1] * 255);
        const b = Math.round(obj.k[2] * 255);
        
        const hex = `#${r.toString(16).padStart(2, '0')}${
          g.toString(16).padStart(2, '0')}${
          b.toString(16).padStart(2, '0')}`.toUpperCase();
        
        if (colorCounts[hex] !== undefined) {
          colorCounts[hex]++;
        }
      }
      
      // Recursively check all properties
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          countInObject(obj[key]);
        }
      }
    };
    
    countInObject(lottieData);
    return colorCounts;
  };
  
  const detectColors = useCallback((lottieData: any) => {
    // Extract unique colors from the animation
    const uniqueColors = extractColorsFromLottie(lottieData);
    
    // Count occurrences of each color
    const counts = countColorOccurrences(lottieData, uniqueColors);
    
    // Format as ColorItems
    const colorItems: ColorItem[] = uniqueColors.map(color => ({
      color,
      count: counts[color] || 0,
      id: uuidv4()
    }));
    
    // Sort by occurrence count (descending)
    colorItems.sort((a, b) => b.count - a.count);
    
    setDetectedColors(colorItems);
  }, []);
  
  return { detectedColors, detectColors };
}
