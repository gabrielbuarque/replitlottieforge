import { useEffect } from "react";
import { useProjectContext } from "@/context/ProjectContext";
import { formatTimestamp } from "@/lib/utils";

interface ProjectsModalProps {
  onClose: () => void;
  onSelectProject: (id: string) => void;
}

export default function ProjectsModal({ onClose, onSelectProject }: ProjectsModalProps) {
  const { projects, loadProjects } = useProjectContext();
  
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Your Projects</h3>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">You don't have any projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map(project => (
              <div 
                key={project.id}
                className="border border-gray-200 rounded-md p-4 cursor-pointer hover:border-accent/30 hover:shadow-sm transition-all"
                onClick={() => onSelectProject(project.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-[#fafafa] rounded flex items-center justify-center">
                    <i className="fas fa-file-code text-accent"></i>
                  </div>
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-gray-500">Modified {formatTimestamp(project.lastModified)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <button 
            className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
