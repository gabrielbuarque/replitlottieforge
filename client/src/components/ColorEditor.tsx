import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { hexToRgb, replaceColorInLottie, replaceAllColorsInLottie, extractAllColorsFromLottie } from "@/lib/utils";
import { useProjectContext } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DetectedColor = { color: string; type: string; path: string };

// Função utilitária para comparar cores (hex) com tolerância
function hexColorDistance(hex1: string, hex2: string) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 999;
  // Distância euclidiana
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
}

// Agrupa cores próximas e conta ocorrências
function groupColors(colors: DetectedColor[], tolerance = 0.04) {
  const groups: { color: string, paths: string[], type: string[], count: number }[] = [];
  colors.forEach((item) => {
    let found = false;
    for (const group of groups) {
      if (hexColorDistance(group.color, item.color) < tolerance) {
        group.paths.push(item.path);
        group.type.push(item.type);
        group.count++;
        found = true;
        break;
      }
    }
    if (!found) {
      groups.push({ color: item.color, paths: [item.path], type: [item.type], count: 1 });
    }
  });
  // Ordena: menos frequentes primeiro
  groups.sort((a, b) => a.count - b.count);
  return groups;
}

export default function ColorEditor() {
  const { currentProject, updateLottieJson } = useProjectContext();
  const { toast } = useToast();
  const [detectedColors, setDetectedColors] = useState<DetectedColor[]>([]);
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [globalColor, setGlobalColor] = useState<string>("#0066CC");
  const [hexInput, setHexInput] = useState<Record<string, string>>({});
  const groupedColors = useMemo(() => groupColors(detectedColors), [detectedColors]);

  useEffect(() => {
    if (currentProject?.jsonData) {
      // Nova extração completa
      const allColors = extractAllColorsFromLottie(currentProject.jsonData);
      setDetectedColors(allColors);
    }
  }, [currentProject?.jsonData]);

  useEffect(() => {
    // Initialize hex input values for all detected colors
    const initialHexValues: Record<string, string> = {};
    detectedColors.forEach((item, idx) => {
      initialHexValues[item.path] = item.color.toUpperCase();
    });
    setHexInput(initialHexValues);
  }, [detectedColors]);

  const updateColorAtPath = (path: string, newColor: string) => {
    if (!currentProject || !currentProject.jsonData) return;
    
    // Add old color to history if it's not already the last item
    if (colorHistory.length === 0 || colorHistory[0] !== newColor) {
      setColorHistory(prev => [newColor, ...prev.slice(0, 19)]);
    }
    
    try {
      const updatedData = replaceColorInLottie(
        currentProject.jsonData,
        detectedColors.find(c => c.path === path)?.color || '',
        newColor
      );
      
      updateLottieJson(currentProject.id, updatedData);
      
      toast({
        title: "Color updated",
        description: `Changed color from ${detectedColors.find(c => c.path === path)?.color} to ${newColor}`
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

  const handleColorInputChange = (path: string, newColor: string) => {
    setHexInput(prev => ({ ...prev, [path]: newColor.toUpperCase() }));
    updateColorAtPath(path, newColor);
  };

  const handleHexInputChange = (path: string, value: string) => {
    setHexInput(prev => ({ ...prev, [path]: value.toUpperCase() }));
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      updateColorAtPath(path, value);
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
      updateColorAtPath(detectedColors[colorIndex].path, historyColor);
    } else if (currentColors.length > 0) {
      // Just update the first color if we can't find a match
      updateColorAtPath(detectedColors[0].path, historyColor);
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
            
            {groupedColors.length === 0 ? (
              <div className="text-gray-500 italic">No colors detected in this animation</div>
            ) : (
              groupedColors.map((group, idx) => (
                <div key={group.color + idx} className="mb-4 p-4 border border-gray-200 rounded-md hover:border-accent/30 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 mr-2">
                      {group.type.includes('static') ? 'Static' : group.type.includes('keyframe-s') && group.type.includes('keyframe-e') ? 'Keyframe Start/End' : group.type[0]}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md" style={{ backgroundColor: group.color }} />
                      {group.paths.length > 0 && (
                        <>
                          <input
                            type="color"
                            value={hexInput[group.paths[0]]}
                            onChange={e => group.paths.forEach(path => handleColorInputChange(path, e.target.value))}
                            className="w-8 h-8 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={hexInput[group.paths[0]]}
                            onChange={e => group.paths.forEach(path => handleHexInputChange(path, e.target.value))}
                            className="w-24 font-mono"
                            maxLength={7}
                          />
                        </>
                      )}
                      <span className="text-xs text-gray-400 ml-2">{group.count}x</span>
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
                  <div key={item.path} className="p-3 border border-gray-200 rounded-md flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-md flex-shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <Input
                      type="text"
                      value={hexInput[item.path] || item.color}
                      onChange={(e) => handleHexInputChange(item.path, e.target.value)}
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
