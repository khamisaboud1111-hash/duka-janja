'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner'; // Ensure this matches your toast library
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
// Import your components and types here
// import { PageLoader } from '@/components/PageLoader';
// import { Button } from '@/components/ui/button';

export default function RiderDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: userLoading } = useUser();

  // State
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>({ todayEarnings: 0, weekEarnings: 0, completedTotal: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<any>(null);
  const [riderLatLng, setRiderLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Load Data
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

  // Handle Toggle
  async function handleToggle() {
    if (!riderProfile) return;
    setTogglingOnline(true);
    
    const { error } = await supabase
      .from('rider_profiles')
      .update({ is_online: !isOnline })
      .eq('id', riderProfile.id);

    if (error) {
      toast.error('Imeshindikana kubadilisha hali');
    } else {
      setIsOnline(!isOnline);
    }
    setTogglingOnline(false);
  }

  // Initial Data Load
  useEffect(() => {
    loadRiderData();
  }, [profile]);

  // Loading/Role Checks
  if (userLoading || loadingData) return <div>Loading...</div>; // Swap with <PageLoader />

  if (!profile || (profile.role as string) !== 'rider') {
    return (
      <div className="page-container py-16 text-center dark:bg-ink-950 min-h-screen">
        <p>Ukurasa huu ni kwa madereva tu.</p>
        <button onClick={() => router.push('/rider/apply')} className="mt-4 p-2 bg-blue-600 text-white rounded">
            Jiunge kama Dereva
        </button>
      </div>
    );
  }

  // Verification Check
  if (riderProfile && !riderProfile.is_verified) {
    return (
      <div className="page-container py-16 text-center dark:bg-ink-950 min-h-screen">
        <h1 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-2">
          Inasubiri Uthibitisho
        </h1>
        <p className="text-ink-600 dark:text-ink-300 text-sm">
          Maombi yako yanahakikiwa na msimamizi. Utaweza kuanza kupokea safari pindi utakapothibitishwa.
        </p>
      </div>
    );
  }

  // Main Dashboard Render
  return (
    <div className="page-container py-6 sm:py-8 max-w-3xl mx-auto dark:bg-ink-950 min-h-screen">
      <div className="flex items-center justify-between card dark:bg-ink-900 p-4">
        {/* Your original content goes here */}
        <h1>Rider Dashboard</h1>
        <button onClick={handleToggle} disabled={togglingOnline}>
            {togglingOnline ? 'Inabadilisha...' : (isOnline ? 'Online' : 'Offline')}
        </button>
      </div>
    </div>
  );
}
