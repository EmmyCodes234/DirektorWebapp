import React, { useState } from 'react';
import { Clock, ArrowRight, Trash2, Edit3, Check, X } from 'lucide-react';
import { TournamentDraft } from '../../hooks/useTournamentDraftSystem';
import MobileResponsiveTable from '../UI/MobileResponsiveTable';

interface DraftsListProps {
  drafts: TournamentDraft[];
  onResume: (draftId: string) => void;
  onDelete: (draftId: string) => Promise<boolean>;
  onRename: (draftId: string, newName: string) => Promise<boolean>;
  isLoading?: boolean;
}

const DraftsList: React.FC<DraftsListProps> = ({
  drafts,
  onResume,
  onDelete,
  onRename,
  isLoading = false
}) => {
  const [renamingDraftId, setRenamingDraftId] = useState<string | null>(null);
  const [newDraftName, setNewDraftName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const success = await onRename(draftId, newDraftName.trim());
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
        await onDelete(draftId);
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

  const columns = [
    {
      key: 'name',
      header: 'Tournament Name',
      render: (draft: TournamentDraft) => (
        renamingDraftId === draft.id ? (
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
              >
                <X size={14} />
              </button>
              
              <button
                onClick={() => handleSubmitRename(draft.id)}
                disabled={isRenaming}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-jetbrains text-sm transition-all duration-200"
              >
                {isRenaming ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={14} />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-white font-medium font-jetbrains">
            {draft.name || 'Untitled Tournament'}
          </div>
        )
      )
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      render: (draft: TournamentDraft) => (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock size={14} />
          <span title={formatDate(draft.last_updated)}>
            {getTimeSince(draft.last_updated)}
          </span>
        </div>
      )
    },
    {
      key: 'step',
      header: 'Progress',
      render: (draft: TournamentDraft) => (
        <div>
          {draft.data.step && (
            <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded text-xs font-jetbrains inline-block">
              {draft.data.step}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (draft: TournamentDraft) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStartRename(draft);
            }}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
            title="Rename draft"
          >
            <Edit3 size={16} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteDraft(draft.id);
            }}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDeleting === draft.id
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-gray-700 hover:bg-red-600/30 text-gray-300 hover:text-red-300'
            }`}
            title={isDeleting === draft.id ? 'Click again to confirm' : 'Delete draft'}
          >
            <Trash2 size={16} />
          </button>
          
          <button
            onClick={() => onResume(draft.id)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-jetbrains text-sm transition-all duration-200"
          >
            Resume
            <ArrowRight size={16} />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 font-jetbrains text-sm mb-4">
          {error}
        </div>
      )}
      
      <MobileResponsiveTable
        data={drafts}
        columns={columns}
        keyExtractor={(draft) => draft.id}
        emptyMessage="No saved drafts found"
        onRowClick={(draft) => onResume(draft.id)}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DraftsList;