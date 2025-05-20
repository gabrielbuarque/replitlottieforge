import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useProjectContext } from "@/context/ProjectContext";
import { formatTimestamp } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

export default function AllProjectsPage() {
  const { projects, loadProjects, deleteProject } = useProjectContext();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        await loadProjects();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [loadProjects]);
  
  const handleOpenProject = (id: string) => {
    navigate(`/editor/${id}`);
  };
  
  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    setShowDeleteConfirm(null);
    
    toast({
      title: "Project deleted",
      description: "The project has been permanently deleted."
    });
  };
  
  const handleCreateNew = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-accent animate-spin mb-4">
            <i className="fas fa-spinner fa-2x"></i>
          </div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <Helmet>
        <title>My Projects - LottieForge</title>
        <meta name="description" content="Manage all your Lottie animation projects in one place. View, edit and organize your animations." />
      </Helmet>
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <button 
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
          onClick={handleCreateNew}
        >
          <i className="fas fa-plus mr-2"></i> New Project
        </button>
      </div>
      
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-folder-open text-2xl text-gray-400"></i>
          </div>
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-gray-500 mb-6">Import your first Lottie animation to get started</p>
          <button 
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
            onClick={handleCreateNew}
          >
            Import Animation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div 
              key={project.id}
              className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all hover:border-accent/30"
            >
              <div 
                className="h-40 bg-[#fafafa] flex items-center justify-center cursor-pointer"
                onClick={() => handleOpenProject(project.id)}
              >
                <lottie-player 
                  src={JSON.stringify(project.jsonData)}
                  background="transparent"
                  speed="1" 
                  style={{ width: "120px", height: "120px" }}
                  loop
                  autoplay>
                </lottie-player>
              </div>
              <div className="p-4">
                <h4 className="font-medium mb-1">{project.name}</h4>
                <p className="text-sm text-gray-500 mb-3">Modified {formatTimestamp(project.lastModified)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">JSON</span>
                  <div className="flex space-x-2">
                    <button 
                      className="text-gray-400 hover:text-accent p-1"
                      onClick={() => handleOpenProject(project.id)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="text-gray-400 hover:text-red-500 p-1"
                      onClick={() => setShowDeleteConfirm(project.id)}
                      title="Delete"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Delete Confirmation */}
              {showDeleteConfirm === project.id && (
                <div className="p-4 bg-red-50 border-t border-red-100">
                  <p className="text-sm text-red-700 mb-3">Are you sure you want to delete this project?</p>
                  <div className="flex justify-end space-x-2">
                    <button 
                      className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Create New Project Card */}
          <div 
            className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all hover:border-accent/30 border-dashed flex items-center justify-center cursor-pointer h-[238px]"
            onClick={handleCreateNew}
          >
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-plus text-accent"></i>
              </div>
              <h4 className="font-medium text-accent">Create New Project</h4>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
