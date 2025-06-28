import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTournamentDraftSystem, TournamentDraft } from '../../hooks/useTournamentDraftSystem';
import DraftRecoveryDialog from './DraftRecoveryDialog';
import DraftResumeCard from './DraftResumeCard';
import DraftStatusIndicator from './DraftStatusIndicator';
import { useAuditLog } from '../../hooks/useAuditLog';

interface DraftManagerProps {
  onCreateNew?: () => void;
  showRecoveryPrompt?: boolean;
}

const DraftManager: React.FC<DraftManagerProps> = ({
  onCreateNew,
  showRecoveryPrompt = false
}) => {
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  
  const {
    drafts,
    isLoading,
    isSaving,
    lastSaved,
    error,
    isOnline,
    loadDraft,
    deleteDraft,
    renameDraft,
    refreshDrafts,
    syncDrafts
  } = useTournamentDraftSystem();
  
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  useEffect(() => {
    // Show recovery dialog if requested and there are drafts
    if (showRecoveryPrompt && drafts.length > 0) {
      setShowRecoveryDialog(true);
    }
  }, [showRecoveryPrompt, drafts]);
  
  const handleResumeDraft = async (draftId: string) => {
    try {
      const draft = await loadDraft(draftId);
      if (draft) {
        // Log draft resume
        logAction({
          action: 'draft_resumed',
          details: {
            draft_id: draftId,
            draft_name: draft.name || 'Untitled Tournament'
          }
        });
        
        // Navigate to tournament setup with draft data
        if (onCreateNew) {
          onCreateNew();
        } else {
          navigate('/new-tournament', { state: { draftId } });
        }
      }
    } catch (err) {
      console.error('Error resuming draft:', err);
    }
  };
  
  const handleDiscardDraft = async (draftId: string) => {
    try {
      const success = await deleteDraft(draftId);
      
      if (success) {
        // Log draft discard
        logAction({
          action: 'draft_discarded',
          details: {
            draft_id: draftId
          }
        });
      }
      
      return success;
    } catch (err) {
      console.error('Error discarding draft:', err);
      return false;
    }
  };
  
  const handleSyncDrafts = async () => {
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      await syncDrafts();
    } catch (err) {
      console.error('Error syncing drafts:', err);
      setSyncError('Failed to sync drafts');
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <>
      {/* Draft Recovery Dialog */}
      <DraftRecoveryDialog
        isOpen={showRecoveryDialog}
        onClose={() => setShowRecoveryDialog(false)}
        drafts={drafts}
        onResumeDraft={handleResumeDraft}
        onDiscardDraft={handleDiscardDraft}
        onRenameDraft={renameDraft}
        isLoading={isLoading}
      />
      
      {/* Draft Status Indicator */}
      <div className="mb-6 flex items-center justify-between">
        <DraftStatusIndicator
          isSaving={isSaving}
          lastSaved={lastSaved}
          isOnline={isOnline}
          error={error}
        />
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncDrafts}
            disabled={isSyncing || !isOnline}
            className="flex items-center gap-1 px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200 text-xs font-jetbrains disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Drafts'}
          </button>
          
          <button
            onClick={() => setShowRecoveryDialog(true)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 hover:text-white rounded-lg text-xs font-jetbrains transition-all duration-200"
          >
            <Plus size={12} />
            Manage Drafts
          </button>
        </div>
      </div>
      
      {/* Sync Error */}
      {syncError && (
        <div className="mb-6 bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 font-jetbrains text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p>{syncError}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Drafts */}
      {drafts.length > 0 && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-bold text-white font-orbitron">
            Recent Drafts
          </h3>
          
          {drafts.slice(0, 3).map((draft) => (
            <DraftResumeCard
              key={draft.id}
              draft={draft}
              onResume={handleResumeDraft}
              onDelete={handleDiscardDraft}
            />
          ))}
          
          {drafts.length > 3 && (
            <button
              onClick={() => setShowRecoveryDialog(true)}
              className="text-blue-400 hover:text-blue-300 font-jetbrains text-sm"
            >
              View all {drafts.length} drafts
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default DraftManager;