import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useProjectContext } from "@/context/ProjectContext";
import { formatTimestamp } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useVersionHistory } from "@/hooks/useVersionHistory";
import Editor, { OnMount } from "@monaco-editor/react";
import ColorEditor from "@/components/ColorEditor";

export default function EditorSection() {
  const { currentProject, updateLottieJson } = useProjectContext();
  const { toast } = useToast();
  const { addVersion, undo, redo, canUndo, canRedo } = useVersionHistory(
    currentProject?.jsonData || null, 
    (newData) => {
      if (currentProject) {
        updateLottieJson(currentProject.id, newData);
      }
    }
  );
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const lottieRef = useRef<HTMLElement | null>(null);
  const editorRef = useRef<any>(null);
  
  useEffect(() => {
    if (currentProject?.jsonData) {
      // Initialize with current data
      addVersion(currentProject.jsonData);
    }
  }, [currentProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    // Update editor when jsonData changes
    if (editorRef.current && currentProject?.jsonData) {
      const model = editorRef.current.getModel();
      const value = JSON.stringify(currentProject.jsonData, null, 2);
      if (model.getValue() !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [currentProject?.jsonData]);
  
  // Update lottie player when jsonData changes
  useEffect(() => {
    if (lottieRef.current && currentProject?.jsonData) {
      try {
        // Update player source
        lottieRef.current.load(JSON.stringify(currentProject.jsonData));
        
        // Restore play state
        if (isPlaying) {
          lottieRef.current.play();
        } else {
          lottieRef.current.pause();
        }
        
        // Set loop state
        lottieRef.current.setLooping(isLooping);
      } catch (error) {
        console.error('Error updating Lottie player:', error);
      }
    }
  }, [currentProject?.jsonData, isPlaying, isLooping]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    editor.onDidChangeModelContent(() => {
      try {
        const value = editor.getValue();
        const parsed = JSON.parse(value);
        if (currentProject) {
          addVersion(parsed);
        }
      } catch (error) {
        // Invalid JSON, don't update
        console.error('Invalid JSON:', error);
      }
    });
  };
  
  // Lottie player controls
  const togglePlay = () => {
    if (!lottieRef.current) return;
    
    if (isPlaying) {
      lottieRef.current.pause();
    } else {
      lottieRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const restartAnimation = () => {
    if (!lottieRef.current) return;
    lottieRef.current.stop();
    lottieRef.current.play();
    setIsPlaying(true);
  };
  
  const toggleLoop = () => {
    if (!lottieRef.current) return;
    const newLoopState = !isLooping;
    lottieRef.current.setLooping(newLoopState);
    setIsLooping(newLoopState);
    
    toast({
      title: newLoopState ? "Loop enabled" : "Loop disabled",
      description: newLoopState 
        ? "Animation will play continuously" 
        : "Animation will play once"
    });
  };
  
  if (!currentProject) {
    return (
      <div className="my-12 text-center text-gray-500">
        <p>No project selected. Import an animation to start editing.</p>
      </div>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{currentProject.name}</h2>
          <p className="text-gray-500 text-sm">
            Last modified: {formatTimestamp(currentProject.lastModified)}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={undo}
            disabled={!canUndo}
          >
            <i className="fas fa-undo mr-1"></i> Undo
          </Button>
          <Button 
            variant="outline" 
            onClick={redo}
            disabled={!canRedo}
          >
            <i className="fas fa-redo mr-1"></i> Redo
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Color Editor */}
        <div className="w-full md:w-1/2">
          <ColorEditor />
        </div>
        {/* Preview Panel */}
        <div className="w-full md:w-1/2 preview-container bg-white rounded-md border border-gray-200 shadow-sm flex flex-col md:sticky md:top-0 md:h-screen" style={{ maxHeight: '100vh' }}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Preview</h3>
            <div className="flex space-x-2">
              <button 
                className={`p-2 text-gray-500 hover:text-accent rounded-md hover:bg-gray-100 transition-colors`} 
                title={isPlaying ? "Pause" : "Play"}
                onClick={togglePlay}
              >
                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
              </button>
              <button 
                className="p-2 text-gray-500 hover:text-accent rounded-md hover:bg-gray-100 transition-colors" 
                title="Restart"
                onClick={restartAnimation}
              >
                <i className="fas fa-redo"></i>
              </button>
              <button 
                className={`p-2 ${isLooping ? 'text-accent' : 'text-gray-500'} hover:text-accent rounded-md hover:bg-gray-100 transition-colors`} 
                title={isLooping ? "Disable Loop" : "Enable Loop"}
                onClick={toggleLoop}
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
          <div className="flex-grow p-6 flex items-center justify-center bg-[#fafafa]" style={{ minHeight: 0 }}>
            <lottie-player
              ref={lottieRef}
              autoplay
              loop={isLooping}
              style={{ width: "100%", height: 'calc(100vh - 80px)' }}
            />
          </div>
        </div>
      </div>

      {/* Editor Panel pode ficar abaixo ou em aba separada se desejar */}
      <div className="w-full h-[500px] border border-gray-200 rounded-md overflow-hidden mt-6">
        <Editor
          height="100%"
          defaultLanguage="json"
          defaultValue={JSON.stringify(currentProject.jsonData, null, 2)}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            tabSize: 2,
          }}
          onMount={handleEditorMount}
        />
      </div>
    </section>
  );
}
