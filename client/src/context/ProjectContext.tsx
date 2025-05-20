import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { extractLottieFromUrl, getLottieJsonData } from "@/lib/lottieService";

interface Project {
  id: string;
  name: string;
  jsonData: any;
  jsonUrl: string;
  lastModified: number;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  loadProject: (id: string) => Promise<void>;
  createProject: (name: string, jsonData: any, jsonUrl: string) => string;
  updateLottieJson: (id: string, newData: any) => void;
  importProject: (url: string) => Promise<string>;
  loadProjects: () => void;
  deleteProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = "lottieforge_projects";

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  const loadProjects = useCallback(() => {
    try {
      const storedProjects = localStorage.getItem(STORAGE_KEY);
      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  
  const saveProjects = useCallback((updatedProjects: Project[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
    }
  }, []);
  
  const loadProject = useCallback(async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setCurrentProject(project);
    } else {
      console.error(`Project with id ${id} not found`);
    }
  }, [projects]);
  
  const createProject = useCallback((name: string, jsonData: any, jsonUrl: string): string => {
    const id = uuidv4();
    const newProject: Project = {
      id,
      name,
      jsonData,
      jsonUrl,
      lastModified: Date.now()
    };
    
    const updatedProjects = [newProject, ...projects];
    saveProjects(updatedProjects);
    setCurrentProject(newProject);
    return id;
  }, [projects, saveProjects]);
  
  const updateLottieJson = useCallback((id: string, newData: any) => {
    const updatedProjects = projects.map(project => {
      if (project.id === id) {
        const updated = {
          ...project,
          jsonData: newData,
          lastModified: Date.now()
        };
        
        if (currentProject?.id === id) {
          setCurrentProject(updated);
        }
        
        return updated;
      }
      return project;
    });
    
    saveProjects(updatedProjects);
  }, [projects, currentProject, saveProjects]);
  
  const importProject = useCallback(async (url: string): Promise<string> => {
    try {
      // 1. Extract metadata from URL
      const metadata = await extractLottieFromUrl(url);
      
      let jsonData: any;
      
      // 2. Get the actual JSON data
      if (metadata.jsonData) {
        // If the server already sent us the JSON data (e.g., from a .lottie file)
        jsonData = metadata.jsonData;
      } else if (metadata.jsonUrl) {
        // If we got a URL, fetch the JSON
        jsonData = await getLottieJsonData(metadata.jsonUrl);
      } else {
        throw new Error("No animation data found");
      }
      
      // 3. Create a new project with the data
      return createProject(metadata.name, jsonData, metadata.jsonUrl || "local://import");
    } catch (error) {
      console.error("Failed to import project", error);
      throw new Error("Failed to import animation from URL");
    }
  }, [createProject]);
  
  const deleteProject = useCallback((id: string) => {
    const updatedProjects = projects.filter(project => project.id !== id);
    saveProjects(updatedProjects);
    
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  }, [projects, currentProject, saveProjects]);
  
  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      loadProject,
      createProject,
      updateLottieJson,
      importProject,
      loadProjects,
      deleteProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
}
