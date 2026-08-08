import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  return (
    <main className="pb-20 sm:pb-8">
      <div className="page-container py-8 sm:py-12 max-w-3xl">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink-900 dark:text-white mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">1. Information We Collect</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              We collect information you provide directly when you create an account, list products, place orders, or contact us. This includes your name, email, phone number, delivery address, and payment information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">2. How We Use Your Information</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              We use your information to process orders, facilitate deliveries, communicate with you about your account, improve our services, and ensure platform security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">3. Data Sharing</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              We share necessary information with sellers to fulfill orders and with delivery riders to complete deliveries. We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">4. Data Security</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              We implement industry-standard security measures to protect your data, including encryption, secure servers, and access controls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">5. Your Rights</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              You have the right to access, correct, or delete your personal data. You can export your data or request account deletion at any time from your settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ink-900 dark:text-white mb-3">6. Contact</h2>
            <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
              For privacy-related inquiries, contact us at privacy@dukajanja.co.tz.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
