
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, RefreshCw, Check, X } from "lucide-react";
import { toast } from "sonner";
import { generateImprovedScript } from "@/lib/api";

interface ScriptReviewModalProps {
  script: string;
  onClose: () => void;
  onConfirm: (finalScript: string) => void;
  isLoading: boolean;
}

const ScriptReviewModal: React.FC<ScriptReviewModalProps> = ({
  script,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [editedScript, setEditedScript] = useState(script);
  const [isEditing, setIsEditing] = useState(false);
  const [isImprovingWithAI, setIsImprovingWithAI] = useState(false);

  const handleManualEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    toast.success("Script updated");
  };

  const handleCancelEdit = () => {
    setEditedScript(script);
    setIsEditing(false);
  };

  const handleConfirm = () => {
    onConfirm(editedScript);
  };

  const handleImproveWithAI = async () => {
    setIsImprovingWithAI(true);
    try {
      const improvedScript = await generateImprovedScript(editedScript);
      setEditedScript(improvedScript);
      toast.success("Script improved with AI");
    } catch (error) {
      console.error("Error improving script with AI:", error);
      toast.error("Failed to improve script with AI");
    } finally {
      setIsImprovingWithAI(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-2xl w-full p-8 bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-quicktok-orange">Review Your Script</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium text-white">Generated Script</h3>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="border-zinc-700 hover:bg-zinc-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="bg-quicktok-orange hover:bg-quicktok-orange/90"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualEdit}
                    className="border-zinc-700 hover:bg-zinc-700"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImproveWithAI}
                    disabled={isImprovingWithAI}
                    className="border-zinc-700 hover:bg-zinc-700"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isImprovingWithAI ? 'animate-spin' : ''}`} />
                    Improve with AI
                  </Button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <Textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-quicktok-orange/50"
            />
          ) : (
            <div className="p-4 bg-zinc-800 rounded-md border border-zinc-700 text-white whitespace-pre-wrap max-h-96 overflow-y-auto">
              {editedScript}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 hover:bg-zinc-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-quicktok-orange hover:bg-quicktok-orange/90"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Continue with this Script"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ScriptReviewModal;
