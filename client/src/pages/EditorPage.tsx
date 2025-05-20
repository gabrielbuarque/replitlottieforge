import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useProjectContext } from "@/context/ProjectContext";
import EditorSection from "@/components/EditorSection";
import ColorEditor from "@/components/ColorEditor";
import ExportSection from "@/components/ExportSection";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { loadProject, currentProject } = useProjectContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (id) {
      const loadSelectedProject = async () => {
        try {
          await loadProject(id);
        } catch (error) {
          toast({
            title: "Error loading project",
            description: "The selected project could not be loaded.",
            variant: "destructive"
          });
          navigate("/");
        }
      };
      
      loadSelectedProject();
    } else {
      // No ID provided, redirect to home
      navigate("/");
    }
  }, [id, loadProject, toast, navigate]);
  
  if (!currentProject) {
    return (
      <div className="container mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-accent animate-spin mb-4">
            <i className="fas fa-spinner fa-2x"></i>
          </div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <Helmet>
        <title>{currentProject.name} - LottieForge Editor</title>
        <meta name="description" content={`Edit and customize ${currentProject.name} Lottie animation in real-time.`} />
      </Helmet>
      
      <EditorSection />
      <ColorEditor />
      <ExportSection />
    </div>
  );
}
