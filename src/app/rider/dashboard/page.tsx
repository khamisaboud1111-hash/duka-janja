'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
// sonner removed to allow build to pass

import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

export default function RiderDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: userLoading } = useUser();

  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  async function loadRiderData() {
    if (!profile) return;
    const { data: rp } = await supabase
      .from('rider_profiles')
      .select('*')
      .eq('id', profile.id)
      .single();
    
    if (rp) {
      setRiderProfile(rp);
      setIsOnline(rp.is_online);
    }
    setLoadingData(false);
  }

  async function handleToggle() {
    if (!riderProfile) return;
    setTogglingOnline(true);
    
    const { error } = await supabase
      .from('rider_profiles')
      .update({ is_online: !isOnline })
      .eq('id', riderProfile.id);

    if (error) {
      // Using alert instead of toast to avoid dependency errors
      alert('Imeshindikana kubadilisha hali');
    } else {
      setIsOnline(!isOnline);
    }
    setTogglingOnline(false);
  }

  useEffect(() => {
    loadRiderData();
  }, [profile]);

  if (userLoading || loadingData) return <div>Loading...</div>;

  return (
    <div className="page-container py-6 sm:py-8 max-w-3xl mx-auto dark:bg-ink-950 min-h-screen">
      <h1 className="text-white text-xl font-bold mb-4">Rider Dashboard</h1>
      
      <div className="card dark:bg-ink-900 p-6 rounded shadow">
         <p className="mb-4">Status: {isOnline ? 'Online' : 'Offline'}</p>
         <button 
           onClick={handleToggle}
           className="bg-blue-600 text-white px-4 py-2 rounded"
         >
           {togglingOnline ? 'Inabadilisha...' : 'Badili Hali'}
         </button>
      </div>
    </div>
  );
}
