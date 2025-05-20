import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { hexToRgb, replaceColorInLottie } from "@/lib/utils";
import { useProjectContext } from "@/context/ProjectContext";
import { useColorDetection } from "@/hooks/useColorDetection";

interface ColorItem {
  color: string;
  count: number;
  id: string;
}

export default function ColorEditor() {
  const { currentProject, updateLottieJson } = useProjectContext();
  const { toast } = useToast();
  const { detectedColors, detectColors } = useColorDetection();
  const [colorHistory, setColorHistory] = useState<string[]>([]);

  useEffect(() => {
    if (currentProject?.jsonData) {
      detectColors(currentProject.jsonData);
    }
  }, [currentProject?.jsonData, detectColors]);

  const updateColor = (oldColor: string, newColor: string) => {
    if (!currentProject || !currentProject.jsonData) return;
    
    // Add old color to history if it's not already the last item
    if (colorHistory.length === 0 || colorHistory[0] !== oldColor) {
      setColorHistory(prev => [oldColor, ...prev.slice(0, 19)]);
    }
    
    try {
      const updatedData = replaceColorInLottie(
        currentProject.jsonData,
        oldColor,
        newColor
      );
      
      updateLottieJson(currentProject.id, updatedData);
      
      toast({
        title: "Color updated",
        description: `Changed color from ${oldColor} to ${newColor}`
      });
    } catch (error) {
      toast({
        title: "Error updating color",
        description: "Failed to update the color in the animation.",
        variant: "destructive"
      });
      console.error("Color update error:", error);
    }
  };

  const handleColorInputChange = (id: string, newColor: string) => {
    const item = detectedColors.find(c => c.id === id);
    if (item) {
      updateColor(item.color, newColor);
    }
  };

  const restoreColor = (historyColor: string) => {
    // Find the current color that most closely matches this history color's position
    const currentColors = detectedColors.map(c => c.color);
    const colorIndex = colorHistory.indexOf(historyColor);
    
    if (colorIndex >= 0 && colorIndex < currentColors.length) {
      updateColor(currentColors[colorIndex], historyColor);
    } else if (currentColors.length > 0) {
      // Just update the first color if we can't find a match
      updateColor(currentColors[0], historyColor);
    }
  };

  const findElements = (color: string) => {
    // This would ideally highlight elements with this color in the editor
    toast({
      title: "Find elements",
      description: `Searching for elements with color ${color}`
    });
  };

  if (!currentProject) {
    return null;
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-12">
      <h3 className="text-lg font-semibold mb-4">Color Editor</h3>
      <p className="text-gray-600 mb-6">Edit colors directly in your animation by selecting elements below</p>
      
      <div className="mb-6">
        <h4 className="text-sm uppercase text-gray-500 font-medium mb-3">Detected Colors</h4>
        
        {detectedColors.length === 0 ? (
          <div className="text-gray-500 italic">No colors detected in this animation</div>
        ) : (
          detectedColors.map((item) => (
            <div key={item.id} className="mb-4 p-4 border border-gray-200 rounded-md hover:border-accent/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="color-swatch" 
                    style={{ backgroundColor: item.color }} 
                  />
                  <div>
                    <span className="font-mono text-sm">{item.color}</span>
                    <p className="text-xs text-gray-500">Used in {item.count} element{item.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    value={item.color}
                    className="w-8 h-8 rounded cursor-pointer appearance-none bg-transparent border-0" 
                    onChange={(e) => handleColorInputChange(item.id, e.target.value)}
                  />
                  <button 
                    className="p-2 text-gray-500 hover:text-accent"
                    onClick={() => findElements(item.color)}
                  >
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {colorHistory.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm uppercase text-gray-500 font-medium mb-3">Color History</h4>
          <div className="flex flex-wrap gap-2">
            {colorHistory.map((color, index) => (
              <div 
                key={`${color}-${index}`}
                className="color-swatch" 
                style={{ backgroundColor: color }} 
                title={color}
                onClick={() => restoreColor(color)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
