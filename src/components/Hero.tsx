/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { translations, Language } from "../utils/translations";
import { HeroConfig } from "../types";

interface HeroProps {
  hero: HeroConfig;
  lang: Language;
  onExploreClick: () => void;
}

export default function Hero({ hero, lang, onExploreClick }: HeroProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const t = translations[lang];

  // Auto-play / cross-fade between hero images
  useEffect(() => {
    const imagesCount = hero.images?.length || 1;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % imagesCount);
    }, 6000);
    return () => clearInterval(interval);
  }, [hero.images]);

  // Track scroll for clean parallax on titles
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  // Safe fallback renderer for languages
  const getHeroFields = () => {
    let title = hero.titleEn || "";
    let subtitle = hero.subtitleEn || "";

    if (lang === "ar") {
      title = hero.titleAr || hero.titleEn;
      subtitle = hero.subtitleAr || hero.subtitleEn;
    } else if (lang === "om") {
      title = hero.titleOm || hero.titleEn;
      subtitle = hero.subtitleOm || hero.subtitleEn;
    } else if (lang === "am") {
      title = hero.titleAm || hero.titleEn;
      subtitle = hero.subtitleAm || hero.subtitleEn;
    }

    return { title, subtitle };
  };

  const { title, subtitle } = getHeroFields();

  return (
    <section
      id="taqwa-hero-section"
      className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-[#141210]"
      dir={dir}
    >
      {/* Background Images with Fade In/Out Transitions */}
      <div className="absolute inset-0 z-0">
        {hero.images?.map((img, idx) => {
          const isActive = idx === activeImageIndex;
          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                isActive ? "opacity-80 scale-100" : "opacity-0 scale-95"
              }`}
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          );
        })}
        {/* Multilayered radial and linear dark overlays for readability and premium look */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-[#141210]/40 to-[#141211]/50 z-10" />
      </div>

      {/* Hero Content Container */}
      <div 
        id="hero-content-box"
        className="relative z-20 max-w-5xl mx-auto px-4 text-center text-white select-none transition-transform duration-75"
        style={{ transform: `translateY(${scrollY * 0.22}px)` }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="h-4 w-4" />
          <span>{t.tagline}</span>
        </div>

        <h1 
          id="hero-title-header"
          className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-2xl"
        >
          <span className="block">{title}</span>
        </h1>

        <p 
          id="hero-subtitle-p"
          className="max-w-2xl mx-auto text-sm sm:text-lg md:text-xl text-[#ebd8bf]/95 leading-relaxed font-sans mb-10 drop-shadow-md"
        >
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="hero-explore-btn"
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-ambient-gold text-primary-950 font-extrabold hover:bg-ambient-glow transition-all duration-300 shadow-[0_12px_40px_rgba(245,158,11,0.25)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.45)] hover:scale-105 active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t.viewFullMenu}</span>
            <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${lang === "ar" ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Floating Sparkles indicator bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 animate-pulse text-primary-950/80">
        <span className="text-[10px] uppercase tracking-widest font-bold text-primary-700">Scroll to Explore</span>
        <ChevronDown className="h-4 w-4 text-primary-700 animate-bounce" />
      </div>
    </section>
  );
}
