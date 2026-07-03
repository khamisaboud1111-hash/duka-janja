if (riderProfile && !riderProfile.is_verified) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-ink-950 dark:via-ink-950 dark:to-black flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-xl p-8 text-center">

        {/* Status Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-amber-600 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-ink-900 dark:text-white">
          Inasubiri Uthibitisho
        </h1>

        {/* Description */}
        <p className="mt-4 text-sm leading-7 text-ink-600 dark:text-ink-300">
          Maombi yako ya kuwa Rider wa Duka Janja yamepokelewa na yanakaguliwa
          na timu yetu.
        </p>

        {/* Progress */}
        <div className="mt-8">
          <div className="flex justify-between text-xs text-ink-500 mb-2">
            <span>Maombi Yamepokelewa</span>
            <span>Yanakaguliwa</span>
          </div>

          <div className="h-3 rounded-full bg-slate-200 dark:bg-ink-800 overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ⏳ Kwa kawaida uthibitisho huchukua ndani ya saa 24–48.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col gap-3">

          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 text-white py-3 font-semibold transition"
          >
            Angalia Tena
          </button>

          <button
            className="w-full rounded-xl border border-slate-300 dark:border-ink-700 py-3 text-ink-700 dark:text-white hover:bg-slate-50 dark:hover:bg-ink-800 transition"
          >
            Wasiliana na Support
          </button>

        </div>

      </div>
    </div>
  );
}
