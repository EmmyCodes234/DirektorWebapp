import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuditLog } from './useAuditLog';

export interface TournamentDraft {
  id: string;
  data: any;
  last_updated: string;
  status: 'draft' | 'completed';
  created_at: string;
}

export function useTournamentDrafts() {
  const [drafts, setDrafts] = useState<TournamentDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logAction } = useAuditLog();

  const loadDrafts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('tournament_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('last_updated', { ascending: false });

      if (fetchError) throw fetchError;
      setDrafts(data || []);
    } catch (err: any) {
      console.error('Error loading tournament drafts:', err);
      setError(err.message || 'Failed to load drafts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const saveDraft = async (draftData: any, draftId?: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (draftId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('tournament_drafts')
          .update({
            data: draftData,
            last_updated: new Date().toISOString()
          })
          .eq('id', draftId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        
        // Log update
        logAction({
          action: 'tournament_draft_updated',
          details: {
            draft_id: draftId
          }
        });
        
        return data.id;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('tournament_drafts')
          .insert([{
            user_id: user.id,
            data: draftData,
            status: 'draft'
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Log creation
        logAction({
          action: 'tournament_draft_created',
          details: {
            draft_id: data.id
          }
        });
        
        return data.id;
      }
    } catch (err: any) {
      console.error('Error saving tournament draft:', err);
      return null;
    }
  };

  const completeDraft = async (draftId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tournament_drafts')
        .update({
          status: 'completed',
          last_updated: new Date().toISOString()
        })
        .eq('id', draftId);

      if (error) throw error;
      
      // Log completion
      logAction({
        action: 'tournament_draft_completed',
        details: {
          draft_id: draftId
        }
      });
      
      await loadDrafts();
      return true;
    } catch (err: any) {
      console.error('Error completing tournament draft:', err);
      return false;
    }
  };

  const deleteDraft = async (draftId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tournament_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      
      // Log deletion
      logAction({
        action: 'tournament_draft_deleted',
        details: {
          draft_id: draftId
        }
      });
      
      await loadDrafts();
      return true;
    } catch (err: any) {
      console.error('Error deleting tournament draft:', err);
      return false;
    }
  };

  const getDraft = async (draftId: string): Promise<TournamentDraft | null> => {
    try {
      const { data, error } = await supabase
        .from('tournament_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error getting tournament draft:', err);
      return null;
    }
  };

  return {
    drafts,
    isLoading,
    error,
    loadDrafts,
    saveDraft,
    completeDraft,
    deleteDraft,
    getDraft
  };
}