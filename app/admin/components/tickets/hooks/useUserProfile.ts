'use client';

import { useState } from 'react';
import { Ticket, UserProfile, UserTransaction } from '../types';

interface UseUserProfileReturn {
  viewingUser: UserProfile | null;
  setViewingUser: (user: UserProfile | null) => void;
  profileLoading: boolean;
  userReleases: any[];
  userPayouts: any[];
  userWithdrawals: any[];
  userTickets: any[];
  userTransactions: UserTransaction[];
  viewUserProfile: (ticket: Ticket) => Promise<void>;
}

export function useUserProfile(supabase: any): UseUserProfileReturn {
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [userReleases, setUserReleases] = useState<any[]>([]);
  const [userPayouts, setUserPayouts] = useState<any[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<any[]>([]);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<UserTransaction[]>([]);

  const viewUserProfile = async (ticket: Ticket) => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    setProfileLoading(true);
    
    try {
      // Получаем профиль пользователя
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ticket.user_id)
        .single();
      
      if (profileError || !profile) {
        console.error('Profile not found:', profileError);
        setProfileLoading(false);
        return;
      }
      
      setViewingUser(profile);
      
      // Загружаем все данные параллельно
      const [releasesBasic, releasesExclusive, payouts, withdrawals, ticketsData, transactions] = await Promise.all([
        supabase.from('releases_basic').select('*').eq('user_id', ticket.user_id).order('created_at', { ascending: false }),
        supabase.from('releases_exclusive').select('*').eq('user_id', ticket.user_id).order('created_at', { ascending: false }),
        supabase.from('payouts').select('*, transactions(*)').eq('user_id', ticket.user_id).order('created_at', { ascending: false }),
        supabase.from('withdrawal_requests').select('*').eq('user_id', ticket.user_id).order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('*').eq('user_id', ticket.user_id).order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').eq('user_id', ticket.user_id).order('created_at', { ascending: false })
      ]);

      // Объединяем релизы из обеих таблиц
      const basicReleases = (releasesBasic.data || []).map((r: any) => ({ ...r, release_type: 'basic' }));
      const exclusiveReleases = (releasesExclusive.data || []).map((r: any) => ({ ...r, release_type: 'exclusive' }));
      const allReleases = [...basicReleases, ...exclusiveReleases].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setUserReleases(allReleases);
      setUserPayouts(payouts.data || []);
      setUserWithdrawals(withdrawals.data || []);
      setUserTickets(ticketsData.data || []);
      
      // Объединяем транзакции и заявки на вывод
      const txList = (transactions.data || []).map((t: any) => ({ ...t, source: 'transaction' }));
      const wdList = (withdrawals.data || []).map((w: any) => ({ 
        ...w, 
        source: 'withdrawal_request', 
        type: 'withdrawal',
        amount: w.amount,
        description: `${w.bank_name} - ${w.card_number}`
      }));
      const allTransactions = [...txList, ...wdList].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setUserTransactions(allTransactions);
    } catch (e) {
      console.error('Ошибка загрузки профиля:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  return {
    viewingUser,
    setViewingUser,
    profileLoading,
    userReleases,
    userPayouts,
    userWithdrawals,
    userTickets,
    userTransactions,
    viewUserProfile,
  };
}
