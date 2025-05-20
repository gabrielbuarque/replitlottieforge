import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { hexToRgb, replaceColorInLottie, replaceAllColorsInLottie } from "@/lib/utils";
import { useProjectContext } from "@/context/ProjectContext";
import { useColorDetection } from "@/hooks/useColorDetection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [globalColor, setGlobalColor] = useState<string>("#0066CC");
  const [hexInput, setHexInput] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentProject?.jsonData) {
      detectColors(currentProject.jsonData);
    }
  }, [currentProject?.jsonData, detectColors]);

  useEffect(() => {
    // Initialize hex input values for all detected colors
    const initialHexValues: Record<string, string> = {};
    detectedColors.forEach(item => {
      initialHexValues[item.id] = item.color.toUpperCase();
    });
    setHexInput(initialHexValues);
  }, [detectedColors]);

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
      setHexInput(prev => ({ ...prev, [id]: newColor.toUpperCase() }));
      updateColor(item.color, newColor);
    }
  };

  const handleHexInputChange = (id: string, value: string) => {
    // Update the input value
    setHexInput(prev => ({ ...prev, [id]: value.toUpperCase() }));
    
    // Only update the color if it's a valid hex value
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      const item = detectedColors.find(c => c.id === id);
      if (item) {
        updateColor(item.color, value);
      }
    }
  };

  const setAllColorsToGlobal = () => {
    if (!currentProject || !currentProject.jsonData) return;
    
    try {
      // Keep track of all the original colors for history
      const originalColors = detectedColors.map(c => c.color);
      setColorHistory(prev => [...originalColors, ...prev].slice(0, 20));
      
      // Replace all colors with the global color
      const updatedData = replaceAllColorsInLottie(
        currentProject.jsonData,
        globalColor
      );
      
      // Update the project data
      updateLottieJson(currentProject.id, updatedData);
      
      toast({
        title: "All colors updated",
        description: `All colors changed to ${globalColor}`
      });
    } catch (error) {
      toast({
        title: "Error updating colors",
        description: "Failed to update all colors in the animation.",
        variant: "destructive"
      });
      console.error("Global color update error:", error);
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
      
      <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
        <h4 className="text-sm uppercase text-gray-500 font-medium mb-3">Global Color Replacement</h4>
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-md" 
              style={{ backgroundColor: globalColor }}
            />
            <Input
              type="text"
              value={globalColor}
              onChange={(e) => setGlobalColor(e.target.value.toUpperCase())}
              className="w-32 font-mono"
              placeholder="#RRGGBB"
              maxLength={7}
            />
            <input 
              type="color" 
              value={globalColor}
              className="w-8 h-8 cursor-pointer" 
              onChange={(e) => setGlobalColor(e.target.value.toUpperCase())}
            />
          </div>
          <Button
            onClick={setAllColorsToGlobal}
            className="whitespace-nowrap"
          >
            Apply to All Colors
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">This will replace all colors in the animation with the selected color</p>
      </div>
      
      <Tabs defaultValue="visual" className="w-full mb-6">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="visual">Visual Color Picker</TabsTrigger>
          <TabsTrigger value="hex">Hex Code Editor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visual">
          <div>
            <h4 className="text-sm uppercase text-gray-500 font-medium mb-3">Detected Colors</h4>
            
            {detectedColors.length === 0 ? (
              <div className="text-gray-500 italic">No colors detected in this animation</div>
            ) : (
              detectedColors.map((item) => (
                <div key={item.id} className="mb-4 p-4 border border-gray-200 rounded-md hover:border-accent/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-md" 
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
        </TabsContent>
        
        <TabsContent value="hex">
          <div>
            <h4 className="text-sm uppercase text-gray-500 font-medium mb-3">Edit Hex Color Codes</h4>
            
            {detectedColors.length === 0 ? (
              <div className="text-gray-500 italic">No colors detected in this animation</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detectedColors.map((item) => (
                  <div key={item.id} className="p-3 border border-gray-200 rounded-md flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-md flex-shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <Input
                      type="text"
                      value={hexInput[item.id] || item.color}
                      onChange={(e) => handleHexInputChange(item.id, e.target.value)}
                      className="font-mono text-sm"
                      placeholder="#RRGGBB"
                      maxLength={7}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {colorHistory.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm uppercase text-gray-500 font-medium mb-3">Color History</h4>
          <div className="flex flex-wrap gap-2">
            {colorHistory.map((color, index) => (
              <div 
                key={`${color}-${index}`}
                className="w-8 h-8 rounded-md cursor-pointer border border-gray-200 hover:border-accent transition-colors" 
                style={{ backgroundColor: color }} 
                title={color}
                onClick={() => restoreColor(color)}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Click on a color to restore it</p>
        </div>
      )}
    </section>
  );
}
