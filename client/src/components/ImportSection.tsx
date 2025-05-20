import { useState, FormEvent, useRef, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { isValidLottieURL } from "@/lib/utils";
import { useLocation } from "wouter";
import { useProjectContext } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ProjectsModal from "./modals/ProjectsModal";
import { sampleLottieJSON } from "@/lib/sampleLottie";

export default function ImportSection() {
  const [importUrl, setImportUrl] = useState<string>("");
  const [importMode, setImportMode] = useState<string>("url");
  const [jsonContent, setJsonContent] = useState<string>("");
  const [jsonFileName, setJsonFileName] = useState<string>("animation");
  const [isLoading, setIsLoading] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { importProject, createProject } = useProjectContext();

  const handleUrlImport = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isValidLottieURL(importUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid LottieFiles URL or direct JSON URL.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const projectId = await importProject(importUrl);
      toast({
        title: "Success!",
        description: "Animation imported successfully."
      });
      navigate(`/editor/${projectId}`);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import the animation.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJsonImport = async (e: FormEvent) => {
    e.preventDefault();
    
    // Use sample JSON data if the textarea is empty
    if (!jsonContent.trim()) {
      setJsonContent(JSON.stringify(sampleLottieJSON, null, 2));
      toast({
        title: "Sample JSON Loaded",
        description: "We've loaded a sample Lottie animation for you to try."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Parse the JSON to validate it
      const jsonData = JSON.parse(jsonContent);
      
      // Use the filename or fallback to "animation"
      const name = jsonFileName || "animation";
      
      // Create a project with this JSON data
      const projectId = createProject(name, jsonData, "local://json-import");
      
      toast({
        title: "Success!",
        description: "Animation imported successfully."
      });
      navigate(`/editor/${projectId}`);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Invalid JSON format. Please check your JSON content.",
        variant: "destructive"
      });
      console.error("JSON import error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's a JSON file
    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid File",
        description: "Please upload a .json file.",
        variant: "destructive"
      });
      return;
    }
    
    // Extract name from filename
    const fileName = file.name.replace('.json', '');
    setJsonFileName(fileName);
    
    // Read the file
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonContent(content);
    };
    reader.readAsText(file);
  };
  
  const clickFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <>
      <section className="mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Import Animation</h2>
          <p className="text-gray-600 mb-8">Import a Lottie animation from LottieFiles or use your own JSON file</p>
          
          <Tabs defaultValue="url" className="w-full" onValueChange={setImportMode}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="url">LottieFiles URL</TabsTrigger>
              <TabsTrigger value="paste">Paste JSON</TabsTrigger>
              <TabsTrigger value="file">Upload File</TabsTrigger>
            </TabsList>
            
            <TabsContent value="url">
              <form onSubmit={handleUrlImport} className="flex flex-col md:flex-row gap-4">
                <Input
                  type="text"
                  placeholder="https://lottiefiles.com/animations/example-animation"
                  className="flex-grow px-4 py-3 rounded-lg border border-gray-300 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors focus:ring-2 focus:ring-accent/50 outline-none font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Importing...</>
                  ) : (
                    <><i className="fas fa-file-import mr-2"></i>Import</>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="paste">
              <form onSubmit={handleJsonImport} className="flex flex-col gap-4">
                <Input
                  type="text"
                  placeholder="Animation Name"
                  className="px-4 py-3 rounded-lg border border-gray-300 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                  value={jsonFileName}
                  onChange={(e) => setJsonFileName(e.target.value)}
                  disabled={isLoading}
                />
                <Textarea
                  placeholder="{...paste your Lottie JSON here or click Import JSON to load a sample...}"
                  className="min-h-[200px] px-4 py-3 rounded-lg border border-gray-300 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none font-mono text-sm"
                  value={jsonContent}
                  onChange={(e) => setJsonContent(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors focus:ring-2 focus:ring-accent/50 outline-none font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</>
                  ) : (
                    <><i className="fas fa-code mr-2"></i>Import JSON</>
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="file">
              <div className="flex flex-col gap-4">
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-accent/50 transition-colors"
                  onClick={clickFileInput}
                >
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <i className="fas fa-file-upload text-4xl text-gray-400 mb-3"></i>
                  <p className="text-gray-600">Click to select a JSON file or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {jsonFileName !== "animation" ? `Selected: ${jsonFileName}.json` : "No file selected"}
                  </p>
                </div>
                <Button 
                  type="button" 
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors focus:ring-2 focus:ring-accent/50 outline-none font-medium"
                  disabled={isLoading || !jsonContent.trim()}
                  onClick={handleJsonImport}
                >
                  {isLoading ? (
                    <><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</>
                  ) : (
                    <><i className="fas fa-upload mr-2"></i>Import File</>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Or <button 
              className="text-accent hover:underline"
              onClick={() => setShowProjectsModal(true)}
            >select from your existing projects</button></p>
          </div>
        </div>
      </section>
      
      {showProjectsModal && (
        <ProjectsModal 
          onClose={() => setShowProjectsModal(false)} 
          onSelectProject={(id) => {
            setShowProjectsModal(false);
            navigate(`/editor/${id}`);
          }}
        />
      )}
    </>
  );
}
