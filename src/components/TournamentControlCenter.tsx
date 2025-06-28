import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, BarChart3, Settings, Share2, QrCode, Eye, AlertTriangle, UserPlus } from 'lucide-react';
import { supabase, testSupabaseConnection, handleSupabaseError } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Lazy-loaded components
const RoundManager = React.lazy(() => import('./RoundManager'));
const ScoreEntry = React.lazy(() => import('./ScoreEntry'));
const Standings = React.lazy(() => import('./Standings'));
const AdminPanel = React.lazy(() => import('./AdminPanel'));
const QRCodeModal = React.lazy(() => import('./QRCodeModal'));
const Statistics = React.lazy(() => import('./Statistics/Statistics'));
const PlayerRoster = React.lazy(() => import('./PlayerRoster'));
const AddPlayerModal = React.lazy(() => import('./AddPlayerModal'));
const PlayerRegistration = React.lazy(() => import('./PlayerRegistration'));

interface Tournament {
  id: string;
  name: string;
  status: string;
  current_round: number;
  rounds: number;
  team_mode: boolean;
  slug: string;
  public_sharing_enabled: boolean;
}

type ActiveTab = 'players' | 'rounds' | 'scores' | 'standings' | 'admin' | 'statistics' | 'registration';

const TournamentControlCenter: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('players');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasRegisteredPlayers, setHasRegisteredPlayers] = useState(false);

  useEffect(() => {
    initializeComponent();
  }, [tournamentId]);

  const initializeComponent = async () => {
    try {
      setLoading(true);
      setError(null);
      setConnectionError(null);

      // Test Supabase connection first
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        setConnectionError(`Database connection failed: ${connectionTest.error}`);
        setLoading(false);
        return;
      }

      // Get current user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(handleSupabaseError(sessionError, 'session check'));
      }

      if (!session?.user) {
        navigate('/auth/signin');
        return;
      }

      setUser(session.user);

      // Load tournament data
      await loadTournament();

    } catch (err: any) {
      console.error('Error initializing tournament control center:', err);
      setError(err.message || 'Failed to initialize tournament control center');
    } finally {
      setLoading(false);
    }
  };

  const loadTournament = async () => {
    if (!tournamentId) {
      setError('Tournament ID is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (error) {
        throw new Error(handleSupabaseError(error, 'tournament fetch'));
      }

      if (!data) {
        setError('Tournament not found');
        return;
      }

      setTournament(data);
      
      // Check if there are registered players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('tournament_id', tournamentId)
        .limit(1);
        
      if (!playersError && players && players.length > 0) {
        setHasRegisteredPlayers(true);
      } else {
        // If no players and this is a team tournament, start with registration tab
        if (data.team_mode) {
          setActiveTab('registration');
        }
      }
    } catch (err: any) {
      console.error('Error loading tournament:', err);
      setError(err.message || 'Failed to load tournament');
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleViewPublic = () => {
    if (tournament?.slug) {
      window.open(`/tournaments/${tournament.slug}`, '_blank');
    } else {
      window.open(`/t/${tournamentId}`, '_blank');
    }
  };

  const handleShowQR = () => {
    setShowQRModal(true);
  };

  const handleAddPlayer = () => {
    setShowAddPlayerModal(true);
  };

  const handlePlayerAdded = () => {
    setShowAddPlayerModal(false);
    setHasRegisteredPlayers(true);
    // Refresh player roster if needed
    if (activeTab === 'players') {
      // The PlayerRoster component will handle its own refresh
    }
  };

  const retryConnection = async () => {
    setConnectionError(null);
    await initializeComponent();
  };

  // Navigation handlers for PlayerRegistration
  const handlePlayerRegistrationBack = () => {
    navigate('/dashboard');
  };

  const handlePlayerRegistrationNext = () => {
    setHasRegisteredPlayers(true);
    setActiveTab('rounds');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-jetbrains">Loading tournament...</p>
        </div>
      </div>
    );
  }

  // Connection Error Screen
  if (connectionError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-yellow-300 mb-2 font-orbitron">Connection Issue</h2>
            <p className="text-yellow-200 mb-4 font-jetbrains text-sm">{connectionError}</p>
            <div className="space-y-3">
              <button
                onClick={retryConnection}
                className="w-full px-4 py-2 bg-yellow-600/20 border border-yellow-500/50 rounded text-yellow-200 hover:bg-yellow-600/30 transition-colors duration-200 font-jetbrains"
              >
                Retry Connection
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 bg-gray-600/20 border border-gray-500/50 rounded text-gray-300 hover:bg-gray-600/30 transition-colors duration-200 font-jetbrains"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-300 mb-2 font-orbitron">Error</h2>
            <p className="text-red-200 mb-4 font-jetbrains text-sm">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-red-600/20 border border-red-500/50 rounded text-red-200 hover:bg-red-600/30 transition-colors duration-200 font-jetbrains"
              >
                Reload Page
              </button>
              <button
                onClick={handleBack}
                className="w-full px-4 py-2 bg-gray-600/20 border border-gray-500/50 rounded text-gray-300 hover:bg-gray-600/30 transition-colors duration-200 font-jetbrains"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 font-jetbrains">Tournament not found</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-gray-600/20 border border-gray-500/50 rounded text-gray-300 hover:bg-gray-600/30 transition-colors duration-200 font-jetbrains"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Team tournament with no players - force registration
  if (tournament.team_mode && !hasRegisteredPlayers) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-gray-300 hover:text-white transition-all duration-200 border border-gray-700/50"
                >
                  <ArrowLeft size={18} />
                  <span className="font-jetbrains text-sm">Back</span>
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-white font-orbitron">{tournament.name}</h1>
                  <p className="text-gray-400 font-jetbrains text-sm">
                    Team Tournament • Registration Required
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-yellow-300 font-orbitron">
                Team Player Registration Required
              </h2>
            </div>
            <p className="text-gray-300 font-jetbrains mb-4">
              Before you can access the tournament control center, you need to register players for each team.
              This is a mandatory step for team tournaments.
            </p>
            <p className="text-yellow-200 font-jetbrains text-sm">
              Please complete the registration process below to continue.
            </p>
          </div>
          
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <PlayerRegistration 
              tournamentId={tournamentId!} 
              onBack={handlePlayerRegistrationBack}
              onNext={handlePlayerRegistrationNext}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'players' as ActiveTab, label: 'Players', icon: Users },
    { id: 'rounds' as ActiveTab, label: 'Rounds', icon: Trophy },
    { id: 'scores' as ActiveTab, label: 'Scores', icon: BarChart3 },
    { id: 'standings' as ActiveTab, label: 'Standings', icon: Trophy },
    { id: 'statistics' as ActiveTab, label: 'Statistics', icon: BarChart3 },
    { id: 'admin' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  const renderTabContent = () => {
    const commonProps = {
      tournamentId: tournamentId!,
      tournament,
      onTournamentUpdate: loadTournament
    };

    switch (activeTab) {
      case 'registration':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <PlayerRegistration 
              tournamentId={tournamentId!} 
              onBack={handleBack}
              onNext={() => setActiveTab('rounds')}
            />
          </Suspense>
        );
      case 'players':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <div className="space-y-6">
              {/* Add Player Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleAddPlayer}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 hover:text-white rounded-lg transition-all duration-200 font-jetbrains text-sm"
                >
                  <UserPlus size={16} />
                  Add Player
                </button>
              </div>
              
              <PlayerRoster 
                tournamentId={tournamentId!} 
                teamMode={tournament.team_mode}
              />
            </div>
          </Suspense>
        );
      case 'rounds':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <RoundManager 
              {...commonProps}
              currentRound={tournament.current_round}
              maxRounds={tournament.rounds}
              onBack={() => setActiveTab('players')}
              onNext={() => setActiveTab('scores')}
            />
          </Suspense>
        );
      case 'scores':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <ScoreEntry 
              {...commonProps}
              currentRound={tournament.current_round}
              onBack={() => setActiveTab('rounds')}
              onNext={() => setActiveTab('standings')}
            />
          </Suspense>
        );
      case 'standings':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <Standings 
              {...commonProps}
              currentRound={tournament.current_round}
              maxRounds={tournament.rounds}
              onBack={() => setActiveTab('scores')}
              onNextRound={() => {
                loadTournament();
                setActiveTab('rounds');
              }}
            />
          </Suspense>
        );
      case 'statistics':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <Statistics tournamentId={tournamentId} />
          </Suspense>
        );
      case 'admin':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <AdminPanel {...commonProps} />
          </Suspense>
        );
      default:
        return <div className="text-center py-12 text-gray-400">Select a tab to get started</div>;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-gray-300 hover:text-white transition-all duration-200 border border-gray-700/50"
              >
                <ArrowLeft size={18} />
                <span className="font-jetbrains text-sm">Back</span>
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-white font-orbitron">{tournament.name}</h1>
                <p className="text-gray-400 font-jetbrains text-sm">
                  Round {tournament.current_round} of {tournament.rounds} • {tournament.status}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {tournament.public_sharing_enabled && (
                <>
                  <button
                    onClick={handleViewPublic}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-400 hover:bg-blue-600/30 hover:text-white rounded-lg transition-all duration-200 font-jetbrains text-sm"
                  >
                    <Eye size={16} />
                    View Public
                  </button>
                  
                  <button
                    onClick={handleShowQR}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-400 hover:bg-purple-600/30 hover:text-white rounded-lg transition-all duration-200 font-jetbrains text-sm"
                  >
                    <QrCode size={16} />
                    QR Code
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-900/30 backdrop-blur-lg border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-jetbrains text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'text-blue-400 border-blue-500 bg-blue-500/10'
                      : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {renderTabContent()}
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <Suspense fallback={null}>
          <QRCodeModal
            isOpen={showQRModal}
            onClose={() => setShowQRModal(false)}
            tournamentId={tournamentId!}
            tournamentName={tournament.name}
          />
        </Suspense>
      )}

      {/* Add Player Modal */}
      {showAddPlayerModal && (
        <Suspense fallback={null}>
          <AddPlayerModal
            isOpen={showAddPlayerModal}
            onClose={() => setShowAddPlayerModal(false)}
            onPlayerAdded={handlePlayerAdded}
            tournamentId={tournamentId!}
            teamMode={tournament.team_mode}
          />
        </Suspense>
      )}
    </div>
  );
};

export default TournamentControlCenter;