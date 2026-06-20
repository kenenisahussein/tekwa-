/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Utensils, Menu, X, ChevronDown, Check } from "lucide-react";
import { translations, Language } from "../utils/translations";

interface HeaderProps {
  currentTab: "home" | "menu" | "admin";
  onTabChange: (tab: "home" | "menu" | "admin") => void;
  lang: Language;
  onLangChange: (lang: Language) => void;
}

export default function Header({ currentTab, onTabChange, lang, onLangChange }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter out 'admin' from public headers. Admin is only reached via URL path directly.
  const publicNavItems: { id: "home" | "menu"; label: string }[] = [
    { id: "home", label: t.navHome },
    { id: "menu", label: t.navMenu }
  ];

  const languages: { code: Language; name: string; local: string }[] = [
    { code: "en", name: "English", local: "English" },
    { code: "ar", name: "Arabic", local: "العربية" },
    { code: "om", name: "Oromo", local: "Afaan Oromoo" },
    { code: "am", name: "Amharic", local: "አማርኛ" }
  ];

  const currentLangLabel = languages.find(l => l.code === lang)?.local || "English";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <header
      id="taqwa-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-[#faf9f6]/95 backdrop-blur-md shadow-lg border-b border-[#e5e7eb] py-3"
          : "bg-gradient-to-b from-[#1c1a17]/70 to-transparent py-5"
      }`}
      dir={dir}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Brand */}
          <button
            id="brand-logo-btn"
            onClick={() => { onTabChange("home"); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              isScrolled ? "bg-primary-600 text-white" : "bg-white/20 text-ambient-glow backdrop-blur"
            } group-hover:rotate-12`}>
              <Utensils className="h-6 w-6" />
            </div>
            <div>
              <span className={`block font-serif font-bold text-2xl tracking-wide ${
                isScrolled ? "text-primary-950" : "text-white"
              }`}>
                {t.restaurantName}
              </span>
              <span className={`block text-[10px] tracking-widest uppercase ${
                isScrolled ? "text-primary-600 font-semibold" : "text-amber-300 font-extrabold"
              }`}>
                Shashemene · Oromia
              </span>
            </div>
          </button>

          {/* Large Screen Nav */}
          <nav id="desktop-nav" className="hidden md:flex items-center space-x-2">
            <div className={`flex items-center gap-1 bg-black/15 p-1 rounded-full backdrop-blur-xs ${
              isScrolled ? "bg-[#f1f0ea]" : ""
            }`}>
              {publicNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}-btn`}
                    onClick={() => onTabChange(item.id)}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                      isActive
                        ? isScrolled
                          ? "bg-primary-700 text-white shadow-sm"
                          : "bg-[#faf9f6] text-primary-950 shadow-md font-extrabold"
                        : isScrolled
                        ? "text-primary-950 hover:bg-[#faf9f6]/80 hover:text-primary-700"
                        : "text-white/90 hover:bg-white/15"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="h-5 w-[1px] bg-gray-300/30 mx-3"></div>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                id="header-lang-toggle"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-300 hover:scale-103 cursor-pointer ${
                  isScrolled
                    ? "border-primary-700/30 text-primary-700 hover:bg-primary-50 hover:border-primary-700"
                    : "border-white/30 text-white hover:bg-white/10 hover:border-white"
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>{currentLangLabel}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              <AnimatePresence>
                {langDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setLangDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden ${
                        lang === "ar" ? "left-0 right-auto" : "right-0"
                      }`}
                    >
                      <div className="py-1">
                        {languages.map((l) => (
                          <button
                            key={l.code}
                            onClick={() => {
                              onLangChange(l.code);
                              setLangDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-xs text-left cursor-pointer transition-colors duration-200 flex items-center justify-between font-medium ${
                              lang === l.code ? "bg-primary-50 text-primary-700 font-bold" : "text-gray-700 hover:bg-gray-100"
                            } ${lang === "ar" ? "text-right" : "text-left"}`}
                          >
                            <span>{l.local}</span>
                            {lang === l.code && <Check className="h-3.5 w-3.5" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            {/* Quick multi-language cycle button for mobile */}
            <button
              id="mobile-lang-cycle"
              onClick={() => {
                const currentIndex = languages.findIndex(l => l.code === lang);
                const nextIndex = (currentIndex + 1) % languages.length;
                onLangChange(languages[nextIndex].code);
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 font-bold text-xs ${
                isScrolled
                  ? "border-primary-700/30 text-primary-700 bg-white"
                  : "border-white/25 text-white bg-white/10"
              }`}
              title="Cycle Language"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase text-[10px]">{lang}</span>
            </button>

            {/* Hamburger Button */}
            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 rounded-xl transition-all focus:outline-none cursor-pointer ${
                isScrolled ? "text-primary-950" : "text-white bg-white/10"
              }`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            id="mobile-drawer"
            className="md:hidden fixed inset-0 top-[60px] bg-black/60 backdrop-blur-md z-40"
          >
            <div className={`bg-[#faf9f6]/95 backdrop-blur-md w-full shadow-2xl p-6 border-b-2 border-primary-600 transition-transform ${
              lang === "ar" ? "text-right" : "text-left"
            }`}>
              <div className="flex flex-col space-y-3">
                {publicNavItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`mobile-nav-${item.id}-btn`}
                      onClick={() => {
                        onTabChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full py-4 px-4 rounded-xl text-md font-bold transition-all ${
                        isActive
                          ? "bg-primary-950 text-amber-300 font-extrabold"
                          : "text-primary-950 hover:bg-[#f1f0ea]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <span className="block text-xs font-semibold text-gray-400 mb-3">Languages</span>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        onLangChange(l.code);
                        setMobileMenuOpen(false);
                      }}
                      className={`py-2 px-3 text-xs rounded-lg text-center font-bold ${
                        lang === l.code ? "bg-primary-700 text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {l.local}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-6">
                  <span>{t.tagline}</span>
                  <span>Taqwa © 2026</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
