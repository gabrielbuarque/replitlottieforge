import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { downloadFile } from "@/lib/utils";
import { convertJsonToLottie, generateEmbedCode } from "@/lib/lottieService";
import { useProjectContext } from "@/context/ProjectContext";
import EmbedCodeModal from "./modals/EmbedCodeModal";

export default function ExportSection() {
  const { currentProject } = useProjectContext();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedCode, setEmbedCode] = useState("");

  if (!currentProject) {
    return null;
  }

  const handleExportJSON = () => {
    setIsExporting("json");
    try {
      const jsonString = JSON.stringify(currentProject.jsonData, null, 2);
      downloadFile(
        jsonString,
        `${currentProject.name}.json`,
        "application/json"
      );
      
      toast({
        title: "Export Successful",
        description: "JSON file has been downloaded"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export JSON file",
        variant: "destructive"
      });
      console.error("JSON export error:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportLottie = async () => {
    setIsExporting("lottie");
    try {
      const lottieBlob = await convertJsonToLottie(
        currentProject.jsonData, 
        currentProject.name
      );
      
      const url = URL.createObjectURL(lottieBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name}.lottie`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: ".lottie file has been downloaded"
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export .lottie file",
        variant: "destructive"
      });
      console.error("Lottie export error:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportHTML = () => {
    setIsExporting("html");
    try {
      // Create a temporary JSON Blob to host for the embed code
      // In a real app, this would be a hosted URL for the animation
      const jsonString = JSON.stringify(currentProject.jsonData);
      const jsonUrl = URL.createObjectURL(new Blob([jsonString], { type: 'application/json' }));
      
      const code = generateEmbedCode(jsonUrl);
      setEmbedCode(code);
      setShowEmbedModal(true);
    } catch (error) {
      toast({
        title: "Generate Embed Failed",
        description: "Failed to generate HTML embed code",
        variant: "destructive"
      });
      console.error("HTML embed error:", error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <>
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-12">
        <h3 className="text-lg font-semibold mb-4">Export Animation</h3>
        <p className="text-gray-600 mb-6">Export your customized animation in various formats</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-md hover:border-accent/30 hover:shadow-sm transition-all">
            <div className="mb-3">
              <i className="fas fa-file-code text-xl text-accent"></i>
            </div>
            <h4 className="font-medium mb-2">JSON File</h4>
            <p className="text-sm text-gray-500 mb-4">Export the raw animation JSON file for use in any Lottie player</p>
            <button 
              className="w-full px-4 py-2 bg-accent/10 text-accent font-medium rounded hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExportJSON}
              disabled={isExporting !== null}
            >
              {isExporting === "json" ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Exporting...</>
              ) : (
                "Export JSON"
              )}
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-md hover:border-accent/30 hover:shadow-sm transition-all">
            <div className="mb-3">
              <i className="fas fa-file-archive text-xl text-accent"></i>
            </div>
            <h4 className="font-medium mb-2">Lottie Package</h4>
            <p className="text-sm text-gray-500 mb-4">Export as .lottie package with all assets included</p>
            <button 
              className="w-full px-4 py-2 bg-accent/10 text-accent font-medium rounded hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExportLottie}
              disabled={isExporting !== null}
            >
              {isExporting === "lottie" ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Exporting...</>
              ) : (
                "Export .lottie"
              )}
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-md hover:border-accent/30 hover:shadow-sm transition-all">
            <div className="mb-3">
              <i className="fas fa-code text-xl text-accent"></i>
            </div>
            <h4 className="font-medium mb-2">HTML Embed</h4>
            <p className="text-sm text-gray-500 mb-4">Get code snippet to embed this animation on your website</p>
            <button 
              className="w-full px-4 py-2 bg-accent/10 text-accent font-medium rounded hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExportHTML}
              disabled={isExporting !== null}
            >
              {isExporting === "html" ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Generating...</>
              ) : (
                "Get Embed Code"
              )}
            </button>
          </div>
        </div>
      </section>
      
      {showEmbedModal && (
        <EmbedCodeModal 
          embedCode={embedCode} 
          onClose={() => setShowEmbedModal(false)} 
        />
      )}
    </>
  );
}
