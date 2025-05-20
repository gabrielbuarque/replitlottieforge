import { useEffect } from "react";
import { useLocation } from "wouter";
import { useProjectContext } from "@/context/ProjectContext";
import { formatTimestamp } from "@/lib/utils";

export default function ProjectsSection({ limit = 3 }) {
  const { projects, loadProjects } = useProjectContext();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  
  const recentProjects = projects.slice(0, limit);
  
  const openProject = (id: string) => {
    navigate(`/editor/${id}`);
  };
  
  const createNewProject = () => {
    navigate("/");
  };
  
  const viewAllProjects = () => {
    navigate("/projects");
  };
  
  const showProjectOptions = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // This would show a dropdown with project options
    console.log("Show options for project", id);
  };

  if (projects.length === 0) {
    return (
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Your Projects</h3>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 mb-4">You don't have any projects yet.</p>
          <button 
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
            onClick={createNewProject}
          >
            Import Your First Animation
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Your Projects</h3>
        <button 
          className="text-accent hover:underline flex items-center"
          onClick={viewAllProjects}
        >
          View All <i className="fas fa-chevron-right ml-1 text-xs"></i>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentProjects.map(project => (
          <div 
            key={project.id}
            className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all hover:border-accent/30 cursor-pointer" 
            onClick={() => openProject(project.id)}
          >
            <div className="h-40 bg-[#fafafa] flex items-center justify-center">
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
                <button 
                  className="text-gray-400 hover:text-accent"
                  onClick={(e) => showProjectOptions(e, project.id)}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <div 
          className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all hover:border-accent/30 border-dashed flex items-center justify-center cursor-pointer"
          onClick={createNewProject}
        >
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-plus text-accent"></i>
            </div>
            <h4 className="font-medium text-accent">Create New Project</h4>
          </div>
        </div>
      </div>
    </section>
  );
}
