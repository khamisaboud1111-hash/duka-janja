export default function RiderDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: userLoading } = useUser();
  const [riderProfile, setRiderProfile] = useState<RiderProfileRow | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ todayEarnings: 0, weekEarnings: 0, completedToday: 0 });
  const [loadingData, setloadingData] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
  const [riderLatLng, setRiderLatlng] = useState<{ lat: number; lng: number } | null>(null);

  const { isOnline, setIsOnline, toggleOnline, offer, acceptOffer, declineOffer, activeDeliveryId } = useRiderTracking(profile?.id);

  // Load Data
  async function loadRiderData() {
    if (!profile) return;
    const { data: rp } = await supabase.from('rider_profiles').select('*').eq('id', profile.id).single();
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
    const ok = await toggleOnline(!isOnline);
    if (!ok) toast.error('Imeshindikana kubadilisha hali');
    setTogglingOnline(false);
  }

  // Initial Data Load
  useEffect(() => {
    loadRiderData();
  }, [profile]);

  // Loading/Role Checks
  if (userLoading || loadingData) return <PageLoader />;

  if (!profile || (profile.role as string) !== 'rider') {
    return (
      <div className="page-container py-16 text-center dark:bg-ink-950 min-h-screen">
        <p>Ukurasa huu ni kwa madereva tu.</p>
        <Button onClick={() => router.push('/rider/apply')}>Jiunge kama Dereva</Button>
      </div>
    );
  }

  // Verification Check (THE FIX)
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
      {/* Your existing dashboard JSX starts here */}
      <div className="flex items-center justify-between card dark:bg-ink-900 p-4">
         {/* ... Rest of your original code ... */}
         {/* Ensure you paste your original dashboard JSX here until the end of the div */}
      </div>
    </div>
  );
}
