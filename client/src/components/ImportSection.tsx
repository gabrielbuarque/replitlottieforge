import { useState, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { isValidLottieURL } from "@/lib/utils";
import { useLocation } from "wouter";
import { useProjectContext } from "@/context/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectsModal from "./modals/ProjectsModal";

export default function ImportSection() {
  const [importUrl, setImportUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { importProject } = useProjectContext();

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isValidLottieURL(importUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid LottieFiles URL.",
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

  return (
    <>
      <section className="mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Import Animation from LottieFiles</h2>
          <p className="text-gray-600 mb-8">Paste a LottieFiles URL to start editing and customizing your animation</p>
          
          <form onSubmit={handleImport} className="flex flex-col md:flex-row gap-4">
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
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Or <button 
              className="text-accent hover:underline"
              onClick={() => setShowProjectsModal(true)}
            >select from your projects</button></p>
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
