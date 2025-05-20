import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface EmbedCodeModalProps {
  embedCode: string;
  onClose: () => void;
}

export default function EmbedCodeModal({ embedCode, onClose }: EmbedCodeModalProps) {
  const { toast } = useToast();
  const codeRef = useRef<HTMLPreElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleCopyCode = () => {
    if (codeRef.current) {
      const text = codeRef.current.textContent || "";
      navigator.clipboard.writeText(text)
        .then(() => {
          setIsCopied(true);
          toast({
            title: "Copied!",
            description: "Embed code copied to clipboard"
          });
          
          // Reset copy state after 2 seconds
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          toast({
            title: "Copy failed",
            description: "Could not copy to clipboard",
            variant: "destructive"
          });
        });
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleClickOutside}
    >
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Embed Code</h3>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <p className="text-gray-600 mb-4">Copy this code to embed your animation on any website:</p>
        <div className="bg-gray-100 p-4 rounded-md mb-4 max-h-60 overflow-auto">
          <pre 
            ref={codeRef}
            className="font-mono text-sm overflow-auto whitespace-pre-wrap"
          >
            {embedCode}
          </pre>
        </div>
        <div className="flex justify-end space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90"
            onClick={handleCopyCode}
            disabled={isCopied}
          >
            {isCopied ? (
              <><i className="fas fa-check mr-1"></i> Copied</>
            ) : (
              <><i className="fas fa-copy mr-1"></i> Copy Code</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
