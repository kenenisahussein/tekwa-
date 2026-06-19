/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Utensils, Phone, Mail, MapPin, Clock, ArrowUpRight, Heart } from "lucide-react";
import { translations, Language } from "../utils/translations";
import { RestaurantConfig } from "../types";

interface FooterProps {
  restaurant: RestaurantConfig;
  lang: Language;
  onTabChange: (tab: "home" | "menu" | "admin") => void;
}

export default function Footer({ restaurant, lang, onTabChange }: FooterProps) {
  const t = translations[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const getLocalizedRestaurantName = () => {
    if (lang === "ar") return restaurant.nameAr || restaurant.nameEn;
    if (lang === "om") return restaurant.nameOm || restaurant.nameEn;
    if (lang === "am") return restaurant.nameAm || restaurant.nameEn;
    return restaurant.nameEn;
  };

  const getLocalizedAddress = () => {
    if (lang === "ar") return restaurant.addressAr || restaurant.addressEn;
    if (lang === "om") return restaurant.addressOm || restaurant.addressEn;
    if (lang === "am") return restaurant.addressAm || restaurant.addressEn;
    return restaurant.addressEn;
  };

  const getLocalizedOpeningHours = () => {
    if (lang === "ar") return restaurant.openingHoursAr || restaurant.openingHoursEn;
    if (lang === "om") return restaurant.openingHoursOm || restaurant.openingHoursEn;
    if (lang === "am") return restaurant.openingHoursAm || restaurant.openingHoursEn;
    return restaurant.openingHoursEn;
  };

  return (
    <footer id="taqwa-footer" className="bg-[#141210] text-[#eae2d5] border-t border-[#2d2824] pt-16 pb-8" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-sm">
          
          {/* Column 1: Brand details */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-ambient-gold text-primary-950">
                <Utensils className="h-5 w-5" />
              </div>
              <span className="font-serif font-bold text-2xl text-white tracking-wide">
                {getLocalizedRestaurantName()}
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed font-sans mt-2">
              {t.footerQuote}
            </p>
            <div className="pt-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
              {t.tagline}
            </div>
          </div>

          {/* Column 2: Opening Hours */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-serif text-lg text-white font-semibold uppercase tracking-wide border-b border-[#2d2824] pb-2">
              {t.openingHours}
            </h4>
            <div className="flex items-start gap-2.5 text-gray-400 leading-relaxed">
              <Clock className="h-4 w-4 mt-1 text-ambient-glow flex-shrink-0" />
              <div>
                <p className="font-medium text-white">Daily Operations</p>
                <p>{getLocalizedOpeningHours()}</p>
              </div>
            </div>
            <div className="text-xs text-amber-500/80 font-bold">
              * Recommended to book for weekends
            </div>
          </div>

          {/* Column 3: Contact & Address */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-serif text-lg text-white font-semibold uppercase tracking-wide border-b border-[#2d2824] pb-2">
              {t.contactUs}
            </h4>
            <div className="flex items-start gap-2.5 text-gray-400">
              <MapPin className="h-4 w-4 mt-1 text-ambient-glow flex-shrink-0" />
              <span>{getLocalizedAddress()}</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-400">
              <Phone className="h-4 w-4 text-ambient-glow flex-shrink-0" />
              <span>{restaurant.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-400">
              <Mail className="h-4 w-4 text-ambient-glow flex-shrink-0" />
              <span className="break-all">{restaurant.email}</span>
            </div>
          </div>

          {/* Column 4: Quick links & Socials */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-serif text-lg text-white font-semibold uppercase tracking-wide border-b border-[#2d2824] pb-2">
              {t.quickLinks}
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onTabChange("home")}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="h-3 w-3" />
                  <span>{t.navHome}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onTabChange("menu")}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="h-3 w-3" />
                  <span>{t.navMenu}</span>
                </button>
              </li>
            </ul>

            <div className="pt-4">
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                {t.socialMedia}
              </span>
              <div className="flex items-center gap-3">
                {restaurant.instagramUrl && (
                  <a
                    href={restaurant.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#1c1a17] text-xs text-gray-400 hover:text-white hover:bg-ambient-gold hover:text-primary-950 transition-all duration-300 font-bold"
                  >
                    Instagram
                  </a>
                )}
                {restaurant.facebookUrl && (
                  <a
                    href={restaurant.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#1c1a17] text-xs text-gray-400 hover:text-white hover:bg-ambient-gold hover:text-primary-950 transition-all duration-300 font-bold"
                  >
                    Facebook
                  </a>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="mt-16 pt-8 border-t border-[#2d2824] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-sans">
          <p>© {new Date().getFullYear()} {getLocalizedRestaurantName()}. All Rights Reserved.</p>
          <div className="flex items-center gap-1 font-semibold">
            <span>Crafted for premium gastronomy at Shashemene, Oromia</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          </div>
        </div>

      </div>
    </footer>
  );
}
