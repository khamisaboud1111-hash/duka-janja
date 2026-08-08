export default function TermsPage() {
  return (
    <main className="pb-20 sm:pb-8">
      <div className="page-container py-8 sm:py-12 max-w-3xl">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 dark:text-white mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              By accessing or using Duka Janja, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">2. User Accounts</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              You are responsible for maintaining the security of your account and for all activities that occur under your account. You must provide accurate and complete information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">3. Seller Terms</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              Sellers must provide accurate product descriptions, honor listed prices, and fulfill orders in a timely manner. Sellers are subject to a commission on completed sales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">4. Buyer Terms</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              Buyers must provide accurate delivery information and make payment promptly. Buyers can return items according to our return policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">5. Prohibited Activities</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              Users may not engage in fraudulent activities, list prohibited items, harass other users, or attempt to circumvent platform fees.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">6. Limitation of Liability</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              Duka Janja is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">7. Governing Law</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              These terms are governed by the laws of Tanzania. Any disputes shall be resolved in the courts of Zanzibar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">8. Contact</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              For questions about these terms, contact us at legal@dukajanja.co.tz.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
