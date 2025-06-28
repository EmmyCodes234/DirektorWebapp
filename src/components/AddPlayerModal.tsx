import React, { useState, useEffect } from 'react';
import { X, Save, User, UserCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Team } from '../types/database';
import { parsePlayerInput } from '../utils/playerParser';
import TeamLogo from './TeamLogo';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerAdded: () => void;
  tournamentId: string;
  teamMode?: boolean;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
  onPlayerAdded,
  tournamentId,
  teamMode = false
}) => {
  const [playerName, setPlayerName] = useState('');
  const [playerRating, setPlayerRating] = useState<number>(1500);
  const [teamName, setTeamName] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && teamMode) {
      loadTeams();
    }
  }, [isOpen, teamMode]);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('name');
        
      if (error) throw error;
      
      setTeams(data || []);
    } catch (err: any) {
      console.error('Error loading teams:', err);
      setError('Failed to load teams. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Player name is required');
      return;
    }
    
    if (isNaN(playerRating) || playerRating < 0 || playerRating > 3000) {
      setError('Rating must be between 0 and 3000');
      return;
    }
    
    if (teamMode && !teamName) {
      setError('Team selection is required for team tournaments');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([{
          name: playerName.trim(),
          rating: playerRating,
          tournament_id: tournamentId,
          team_name: teamMode ? teamName : undefined,
          participation_status: 'active'
        }])
        .select();
        
      if (error) throw error;
      
      // Success
      setPlayerName('');
      setPlayerRating(1500);
      setTeamName('');
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-jetbrains text-sm border border-green-500/50';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Player added successfully
        </div>
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
      
      onPlayerAdded();
    } catch (err: any) {
      console.error('Error adding player:', err);
      setError(err.message || 'Failed to add player');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900/95 backdrop-blur-lg border-2 border-green-500/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-green-500/30 bg-gradient-to-r from-green-900/30 to-blue-900/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              {teamMode ? (
                <UserCheck className="w-6 h-6 text-white" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-orbitron">
                Add New Player
              </h2>
              <p className="text-green-300 font-jetbrains">
                {teamMode ? 'Add player to team roster' : 'Add player to tournament'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300 font-jetbrains text-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Player Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 font-jetbrains">
                Player Name *
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-jetbrains"
                placeholder="Enter player name"
              />
            </div>
            
            {/* Player Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 font-jetbrains">
                Rating *
              </label>
              <input
                type="number"
                min="0"
                max="3000"
                value={playerRating}
                onChange={(e) => setPlayerRating(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-jetbrains"
                placeholder="Enter player rating"
              />
            </div>
            
            {/* Team Selection (Team Mode Only) */}
            {teamMode && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 font-jetbrains">
                  Team *
                </label>
                <select
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 font-jetbrains"
                >
                  <option value="">Select a team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-jetbrains font-medium transition-all duration-200"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-jetbrains font-medium transition-all duration-200"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Add Player
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlayerModal;