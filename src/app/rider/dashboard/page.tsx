'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
// This import path matches your file structure (src/lib/supabase/client.ts)
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

  useEffect(() => {
    loadRiderData();
  }, [profile]);

  if (userLoading || loadingData) return <div>Loading...</div>;

  return (
    <div className="page-container py-6 sm:py-8 max-w-3xl mx-auto dark:bg-ink-950 min-h-screen">
      <h1 className="text-white text-xl">Rider Dashboard</h1>
      {/* Your dashboard content */}
    </div>
  );
}
