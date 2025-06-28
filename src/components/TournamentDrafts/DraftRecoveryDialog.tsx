import React, { useState } from 'react';
import { X, RefreshCw, Clock, Edit3, Trash2, Check } from 'lucide-react';
import { TournamentDraft } from '../../hooks/useTournamentDraftSystem';

interface DraftRecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: TournamentDraft[];
  onResumeDraft: (draftId: string) => void;
  onDiscardDraft: (draftId: string) => Promise<boolean>;
  onRenameDraft: (draftId: string, newName: string) => Promise<boolean>;
  isLoading?: boolean;
}

const DraftRecoveryDialog: React.FC<DraftRecoveryDialogProps> = ({
  isOpen,
  onClose,
  drafts,
  onResumeDraft,
  onDiscardDraft,
  onRenameDraft,
  isLoading = false
}) => {
  const [renamingDraftId, setRenamingDraftId] = useState<string | null>(null);
  const [newDraftName, setNewDraftName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  };

  const handleStartRename = (draft: TournamentDraft) => {
    setRenamingDraftId(draft.id);
    setNewDraftName(draft.name || 'Untitled Tournament');
    setError(null);
  };

  const handleCancelRename = () => {
    setRenamingDraftId(null);
    setNewDraftName('');
    setError(null);
  };

  const handleSubmitRename = async (draftId: string) => {
    if (!newDraftName.trim()) {
      setError('Draft name cannot be empty');
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      const success = await onRenameDraft(draftId, newDraftName.trim());
      if (success) {
        setRenamingDraftId(null);
        setNewDraftName('');
      } else {
        setError('Failed to rename draft');
      }
    } catch (err) {
      console.error('Error renaming draft:', err);
      setError('An error occurred while renaming the draft');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (isDeleting === draftId) {
      setIsDeleting(null);
      
      try {
        await onDiscardDraft(draftId);
      } catch (err) {
        console.error('Error deleting draft:', err);
        setError('Failed to delete draft');
      }
    } else {
      setIsDeleting(draftId);
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setIsDeleting(null);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gray-900/95 backdrop-blur-lg border-2 border-blue-500/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-blue-500/30 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-orbitron">
                Resume Tournament Draft
              </h2>
              <p className="text-blue-300 font-jetbrains">
                Continue where you left off
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
            aria-label="Close dialog"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : drafts.length > 0 ? (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 font-jetbrains text-sm mb-4">
                  {error}
                </div>
              )}
              
              {drafts.map((draft) => (
                <div 
                  key={draft.id}
                  className="bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 rounded-lg p-4 transition-all duration-200"
                >
                  {renamingDraftId === draft.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={newDraftName}
                        onChange={(e) => setNewDraftName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-jetbrains focus:border-blue-500 focus:outline-none"
                        placeholder="Enter draft name"
                        autoFocus
                      />
                      
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelRename}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg font-jetbrains text-sm transition-all duration-200"
                          aria-label="Cancel rename"
                        >
                          Cancel
                        </button>
                        
                        <button
                          onClick={() => handleSubmitRename(draft.id)}
                          disabled={isRenaming}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-jetbrains text-sm transition-all duration-200"
                          aria-label="Save new name"
                        >
                          {isRenaming ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check size={14} />
                              Save
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white font-orbitron mb-1">
                          {draft.name || 'Untitled Tournament'}
                        </h3>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span title={formatDate(draft.last_updated)}>
                              {getTimeSince(draft.last_updated)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartRename(draft)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
                          title="Rename draft"
                          aria-label="Rename draft"
                        >
                          <Edit3 size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            isDeleting === draft.id
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-gray-700 hover:bg-red-600/30 text-gray-300 hover:text-red-300'
                          }`}
                          title={isDeleting === draft.id ? 'Click again to confirm' : 'Delete draft'}
                          aria-label={isDeleting === draft.id ? 'Confirm delete' : 'Delete draft'}
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <button
                          onClick={() => onResumeDraft(draft.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-jetbrains text-sm transition-all duration-200"
                        >
                          Resume
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 font-jetbrains">
              No saved drafts found
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400 font-jetbrains">
              {drafts.length} draft{drafts.length !== 1 ? 's' : ''} available
            </div>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg font-jetbrains text-sm transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftRecoveryDialog;