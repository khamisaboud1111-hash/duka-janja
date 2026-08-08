"use client";

import { useState } from "react";
import { Send, MapPin, Phone, Mail, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import toast from "react-hot-toast";
import { useLangStore } from "@/store";
import { t } from "@/i18n/translations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function Footer() {
  const lang = useLangStore((s) => s.lang);
  const [email, setEmail] = useState("");

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/dukajanja", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/dukajanja", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/dukajanja", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/dukajanja", label: "LinkedIn" },
  ];

  const footerLinks = [
    {
      title: t("buying", lang),
      links: [
        { label: t("allProducts", lang), href: "/search" },
        { label: t("madeInZanzibar", lang), href: "/search?made_in_zanzibar=true" },
        { label: t("orders", lang), href: "/orders" },
        { label: t("wishlist", lang), href: "/wishlist" },
      ],
    },
    {
      title: t("selling", lang),
      links: [
        { label: t("openStore", lang), href: "/register?type=seller" },
        { label: t("sellerDashboard", lang), href: "/seller/dashboard" },
        { label: t("sellerHelp", lang), href: "/help/seller" },
      ],
    },
    {
      title: t("support", lang),
      links: [
        { label: t("contactUs", lang), href: "/contact" },
        { label: t("shippingPolicy", lang), href: "/help/shipping" },
        { label: t("returnPolicy", lang), href: "/help/returns" },
        { label: t("privacyPolicy", lang), href: "/privacy" },
        { label: t("termsOfService", lang), href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-950 mt-16">
      <div className="page-container py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Newsletter */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 via-brand-400 to-amber-400 flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">DJ</span>
              </div>
              <span className="font-display font-black text-xl text-ink-900 dark:text-white">Duka Janja</span>
            </div>
            <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs">
              {t("footerTagline", lang)}
            </p>

            {/* Newsletter form */}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                toast.success(t("subscribe", lang));
                setEmail("");
              }}
            >
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder", lang)}
                className="bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:ring-brand-500 min-w-[220px]"
                aria-label={t("emailPlaceholder", lang)}
              />
              <Button type="submit" variant="primary" size="md" aria-label={t("subscribe", lang)}>
                <Send className="w-4 h-4" />
              </Button>
            </form>

            {/* Social links */}
            <div className="flex items-center gap-2 pt-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-xl bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 flex items-center justify-center text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 dark:hover:border-brand-600 transition-all hover:-translate-y-0.5"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Footer columns */}
          {footerLinks.map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="font-display font-bold text-sm text-ink-900 dark:text-white tracking-wider uppercase">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact info */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="font-display font-bold text-sm text-ink-900 dark:text-white tracking-wider uppercase">
              {t("contactInfo", lang)}
            </h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <span className="text-ink-600 dark:text-ink-300">
                  {t("footerLocation", lang)}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <span className="text-ink-600 dark:text-ink-300">
                  {t("whatsapp", lang)}: +255 777 000 000
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                <span className="text-ink-600 dark:text-ink-300">
                  info@dukajanja.co.tz
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-ink-200 dark:border-ink-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-4 text-xs text-ink-500 dark:text-ink-400">
          <span>
            {t("copyright", lang).replace("{year}", String(new Date().getFullYear()))}
          </span>
          <span className="sm:text-right">{t("footerLocation", lang)}</span>
        </div>
      </div>
    </footer>
  );
}
