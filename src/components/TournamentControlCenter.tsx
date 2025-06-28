import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Trophy, BarChart3, Settings, Share2, QrCode, Eye, AlertTriangle } from 'lucide-react';
import { supabase, testSupabaseConnection, handleSupabaseError } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Lazy-loaded components
const PlayerRegistration = React.lazy(() => import('./PlayerRegistration'));
const RoundManager = React.lazy(() => import('./RoundManager'));
const ScoreEntry = React.lazy(() => import('./ScoreEntry'));
const Standings = React.lazy(() => import('./Standings'));
const AdminPanel = React.lazy(() => import('./AdminPanel'));
const QRCodeModal = React.lazy(() => import('./QRCodeModal'));
const Statistics = React.lazy(() => import('./Statistics/Statistics'));

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

type ActiveTab = 'players' | 'rounds' | 'scores' | 'standings' | 'admin' | 'statistics';

const TournamentControlCenter: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('players');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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

  const retryConnection = async () => {
    setConnectionError(null);
    await initializeComponent();
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
      case 'players':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <PlayerRegistration {...commonProps} />
          </Suspense>
        );
      case 'rounds':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <RoundManager {...commonProps} />
          </Suspense>
        );
      case 'scores':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <ScoreEntry {...commonProps} />
          </Suspense>
        );
      case 'standings':
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <Standings {...commonProps} />
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
            slug={tournament.slug}
          />
        </Suspense>
      )}
    </div>
  );
};

export default TournamentControlCenter;