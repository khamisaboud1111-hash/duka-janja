import dynamic from "next/dynamic";

// This dynamically loads the Navbar only on the client side.
// It bypasses all build-time server prerendering checks and handles both default/named exports!
const Navbar = dynamic(
  () => import("@/components/layout/Navbar").then((mod) => mod.Navbar || mod.default),
  { ssr: false }
);

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Navbar will render safely on the client browser without crashing the build */}
      <Navbar />
      
      <div className="min-h-screen">{children}</div>
      
      <footer className="hidden sm:block bg-ink-900 text-ink-300 py-10 mt-8">
        <div className="page-container">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-sm">DJ</span>
                </div>
                <span className="font-display font-black text-white text-lg">Duka Janja</span>
              </div>
              <p className="text-xs text-ink-400 leading-relaxed">
                Soko bora la bidhaa Zanzibar. Nunua na uuze kwa urahisi.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Kununua</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="/search" className="hover:text-white transition-colors">Bidhaa zote</a></li>
                <li><a href="/search?made_in_zanzibar=true" className="hover:text-white transition-colors">Bidhaa za Zanzibar</a></li>
                <li><a href="/orders" className="hover:text-white transition-colors">Maagizo yangu</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Kuuza</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="/register?type=seller" className="hover:text-white transition-colors">Fungua duka</a></li>
                <li><a href="/seller/dashboard" className="hover:text-white transition-colors">Dashibodi ya muuzaji</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Msaada</h4>
              <ul className="space-y-2 text-xs">
                <li><span className="text-ink-400">WhatsApp: +255 777 000 000</span></li>
                <li><span className="text-ink-400">info@dukavanja.co.tz</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-ink-800 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs">
            <span>© 2024 Duka Janja. Haki zote zimehifadhiwa.</span>
            <span>Zanzibar, Tanzania</span>
          </div>
        </div>
      </footer>
    </>
  );
}
