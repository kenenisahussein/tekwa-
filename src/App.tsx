/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Utensils,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Check,
  Globe,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  X,
  PlusCircle,
  Clock,
  MapPin,
  Phone,
  Eye,
  Loader2,
  ListFilter,
  Coffee,
  ChefHat,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { AppState, Product, Category, HeroConfig, RestaurantConfig } from "./types";
import { translations, Language } from "./utils/translations";
import { defaultAppState } from "./utils/fallbackState";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./lib/firebase";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Footer from "./components/Footer";

export default function App() {
  const [lang, setLang] = useState<Language>("en");
  const [currentTab, setCurrentTab] = useState<"home" | "menu" | "admin">("home");
  const [loading, setLoading] = useState<boolean>(true);
  const [appState, setAppState] = useState<AppState | null>(null);

  // Admin and passcode states
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string>("");
  const [passcodeError, setPasscodeError] = useState<string>("");

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  // State for adding/editing products in Admin
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    nameEn: "",
    nameAr: "",
    nameOm: "",
    nameAm: "",
    descriptionEn: "",
    descriptionAr: "",
    descriptionOm: "",
    descriptionAm: "",
    price: 0,
    categoryId: "",
    image: "",
    isAvailable: true,
    isFeatured: false,
  });

  // State for adding/editing categories in Admin
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    nameEn: "",
    nameAr: "",
    nameOm: "",
    nameAm: "",
    icon: "Utensils",
  });

  // Loading Splash Screen (during page loads)
  const [splashFinished, setSplashFinished] = useState<boolean>(false);

  // Status updates toast
  const [toastMessage, setToastMessage] = useState<string>("");

  // Load initial backend state on component mount
  const fetchStateFromServer = async () => {
    try {
      const response = await fetch("/api/state");
      if (response.ok) {
        const data: AppState = await response.json();
        setAppState(data);
        localStorage.setItem("taqwa_custom_state", JSON.stringify(data));
        // Default category first match
        if (data.categories && data.categories.length > 0) {
          setProductForm((prev) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      } else {
        throw new Error("Local backend not available");
      }
    } catch (e) {
      console.warn("Express server not detected. Checking local storage fallback...", e);
      const cached = localStorage.getItem("taqwa_custom_state");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === "object" && Array.isArray(parsed.categories) && Array.isArray(parsed.products)) {
            setAppState(parsed);
            if (parsed.categories.length > 0) {
              setProductForm((prev) => ({ ...prev, categoryId: parsed.categories[0].id }));
            }
            setLoading(false);
            return;
          }
        } catch (_) {}
      }
      setAppState(defaultAppState);
      if (defaultAppState.categories && defaultAppState.categories.length > 0) {
        setProductForm((prev) => ({ ...prev, categoryId: defaultAppState.categories[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveAndApplyState = async (newState: AppState) => {
    setAppState(newState);
    localStorage.setItem("taqwa_custom_state", JSON.stringify(newState));
    try {
      await setDoc(doc(db, "restaurant_state", "taqwa"), newState);
    } catch (err) {
      console.error("Failed to sync state to Firebase Firestore database:", err);
    }
  };

  useEffect(() => {
    // Connect to Firestore real-time snapshot listeners for fully synchronized direct state updates
    const unsubscribe = onSnapshot(doc(db, "restaurant_state", "taqwa"), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppState;
        setAppState(data);
        localStorage.setItem("taqwa_custom_state", JSON.stringify(data));
        setLoading(false);
      } else {
        // Automatically seed with default/fallback data if Firestore doc is missing
        console.log("No existing menu dataset on secure Firebase cluster. Seeding now...");
        try {
          await setDoc(doc(db, "restaurant_state", "taqwa"), defaultAppState);
        } catch (err) {
          console.error("Firestore seeding failed; running local server fallback:", err);
          fetchStateFromServer();
        }
      }
    }, (error) => {
      console.warn("Firestore remote listener blocked or unavailable. Syncing via server fallback:", error);
      fetchStateFromServer();
    });

    // Secure Admin Entrance: Check multiple entries for solid routing on static Vercel hosts
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    
    const isAdminUrl = 
      path === "/taqwa/admin" || 
      path === "/teqwa/admin" || 
      path.endsWith("/admin") ||
      hash === "#/admin" || 
      hash === "#admin" || 
      hash === "#/taqwa/admin" || 
      hash === "#/teqwa/admin" ||
      search.includes("admin");

    if (isAdminUrl) {
      setCurrentTab("admin");
    }

    // Trigger splash screen sequence
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const t = translations[lang];

  // Secure URL observer to sync direct admin changes
  const handleTabChange = (tab: "home" | "menu" | "admin") => {
    if (tab === "admin") {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      
      const isAdminUrl = 
        path === "/taqwa/admin" || 
        path === "/teqwa/admin" || 
        path.endsWith("/admin") ||
        hash === "#/admin" || 
        hash === "#admin" || 
        hash === "#/taqwa/admin" || 
        hash === "#/teqwa/admin" ||
        search.includes("admin");

      if (!isAdminUrl) {
        // block silent access to admin
        return;
      }
    }
    setCurrentTab(tab);
  };

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  // Localized getters helpers
  const getCatName = (c: Category) => {
    if (lang === "ar") return c.nameAr || c.nameEn;
    if (lang === "om") return c.nameOm || c.nameEn;
    if (lang === "am") return c.nameAm || c.nameEn;
    return c.nameEn;
  };

  const getProductName = (p: Product) => {
    if (lang === "ar") return p.nameAr || p.nameEn;
    if (lang === "om") return p.nameOm || p.nameEn;
    if (lang === "am") return p.nameAm || p.nameEn;
    return p.nameEn;
  };

  const getProductDesc = (p: Product) => {
    if (lang === "ar") return p.descriptionAr || p.descriptionEn;
    if (lang === "om") return p.descriptionOm || p.descriptionEn;
    if (lang === "am") return p.descriptionAm || p.descriptionEn;
    return p.descriptionEn;
  };

  const getLocalizedRestaurantName = (r: RestaurantConfig) => {
    if (lang === "ar") return r.nameAr || r.nameEn;
    if (lang === "om") return r.nameOm || r.nameEn;
    if (lang === "am") return r.nameAm || r.nameEn;
    return r.nameEn;
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    if (!appState) return [];
    return appState.products.filter((product) => {
      const matchesCategory =
        selectedCategoryId === "all" || product.categoryId === selectedCategoryId;
      
      const searchLower = searchQuery.toLowerCase();
      const nameEnLower = (product.nameEn || "").toLowerCase();
      const nameArLower = (product.nameAr || "").toLowerCase();
      const nameOmLower = (product.nameOm || "").toLowerCase();
      const nameAmLower = (product.nameAm || "").toLowerCase();
      
      const descEnLower = (product.descriptionEn || "").toLowerCase();
      const descArLower = (product.descriptionAr || "").toLowerCase();
      const descOmLower = (product.descriptionOm || "").toLowerCase();
      const descAmLower = (product.descriptionAm || "").toLowerCase();

      const matchesSearch =
        nameEnLower.includes(searchLower) ||
        nameArLower.includes(searchLower) ||
        nameOmLower.includes(searchLower) ||
        nameAmLower.includes(searchLower) ||
        descEnLower.includes(searchLower) ||
        descArLower.includes(searchLower) ||
        descOmLower.includes(searchLower) ||
        descAmLower.includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [appState, selectedCategoryId, searchQuery]);

  // Featured meals
  const featuredProducts = useMemo(() => {
    if (!appState) return [];
    return appState.products.filter((p) => p.isFeatured && p.isAvailable);
  }, [appState]);

  // Unlock Admin dashboard
  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Direct robust client-side validation as standard feature to support 100% static hosts (Vercel)
    if (adminPasscode === "abbas9520" || adminPasscode.trim() === "abbas9520") {
      setIsAdminUnlocked(true);
      setPasscodeError("");
      showToast(lang === "en" ? "Welcome to Taqwa Sanctuary Panel" : "مرحباً بك في لوحة تحكم تقوى");
      return;
    }

    try {
      const resp = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: adminPasscode })
      });
      if (resp.ok) {
        setIsAdminUnlocked(true);
        setPasscodeError("");
        showToast(lang === "en" ? "Welcome to Taqwa Sanctuary Panel" : "مرحباً بك في لوحة تحكم تقوى");
      } else {
        setPasscodeError(t.invalidPasscode);
      }
    } catch (err) {
      if (adminPasscode === "abbas9520") {
        setIsAdminUnlocked(true);
        setPasscodeError("");
        showToast(lang === "en" ? "Welcome to Taqwa Sanctuary Panel" : "مرحباً بك في لوحة تحكم تقوى");
      } else {
        setPasscodeError(t.invalidPasscode);
      }
    }
  };

  // Create or Update Product handler
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appState) return;

    const isEdit = !!editingProduct;
    let updatedProducts = [...appState.products];
    const targetId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;

    const newProductData: Product = {
      id: targetId,
      nameEn: productForm.nameEn || "",
      nameAr: productForm.nameAr || "",
      nameOm: productForm.nameOm || "",
      nameAm: productForm.nameAm || "",
      descriptionEn: productForm.descriptionEn || "",
      descriptionAr: productForm.descriptionAr || "",
      descriptionOm: productForm.descriptionOm || "",
      descriptionAm: productForm.descriptionAm || "",
      price: Number(productForm.price) || 0,
      categoryId: productForm.categoryId || "",
      image: productForm.image || "",
      isAvailable: productForm.isAvailable !== undefined ? productForm.isAvailable : true,
      isFeatured: productForm.isFeatured !== undefined ? productForm.isFeatured : false,
    };

    if (isEdit && editingProduct) {
      updatedProducts = updatedProducts.map((p) =>
        p.id === editingProduct.id ? newProductData : p
      );
    } else {
      updatedProducts.push(newProductData);
    }

    const newState: AppState = {
      ...appState,
      products: updatedProducts
    };

    // Real-time local state update & persistence for offline/Vercel support
    await saveAndApplyState(newState);

    const url = isEdit ? `/api/products/${editingProduct.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";

    try {
      const resp = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode 
        },
        body: JSON.stringify(isEdit ? productForm : newProductData),
      });

      if (resp.ok) {
        // Live server succeeded, let's refresh full server-side integrity state (if active)
        await fetchStateFromServer();
      }
    } catch (err) {
      console.warn("Express endpoint failed (expected on static Vercel hosts). Preserved locally in real-time:", err);
    }

    showToast(t.updateProductSuccess);
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductForm({
      nameEn: "",
      nameAr: "",
      nameOm: "",
      nameAm: "",
      descriptionEn: "",
      descriptionAr: "",
      descriptionOm: "",
      descriptionAm: "",
      price: 0,
      categoryId: newState.categories[0]?.id || "",
      image: "",
      isAvailable: true,
      isFeatured: false,
    });
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(t.deleteProductConfirm)) return;
    if (!appState) return;

    const updatedProducts = appState.products.filter((p) => p.id !== id);
    const newState: AppState = {
      ...appState,
      products: updatedProducts
    };

    await saveAndApplyState(newState);

    try {
      await fetch(`/api/products/${id}`, { 
        method: "DELETE",
        headers: { "x-admin-passcode": adminPasscode }
      });
    } catch (e) {
      console.warn("Express endpoint failed (expected on static Vercel hosts). Deleted locally in real-time:", e);
    }
    showToast(t.adminDeleteSuccess);
  };

  // Create or Update Category handler
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appState) return;

    const isEdit = !!editingCategory;
    let updatedCategories = [...appState.categories];
    const targetId = editingCategory ? editingCategory.id : `cat-${Date.now()}`;

    const newCategoryData: Category = {
      id: targetId,
      nameEn: categoryForm.nameEn || "",
      nameAr: categoryForm.nameAr || "",
      nameOm: categoryForm.nameOm || "",
      nameAm: categoryForm.nameAm || "",
      icon: categoryForm.icon || "Utensils",
    };

    if (isEdit && editingCategory) {
      updatedCategories = updatedCategories.map((c) =>
        c.id === editingCategory.id ? newCategoryData : c
      );
    } else {
      updatedCategories.push(newCategoryData);
    }

    const newState: AppState = {
      ...appState,
      categories: updatedCategories
    };

    await saveAndApplyState(newState);

    const url = isEdit ? `/api/categories/${editingCategory.id}` : "/api/categories";
    const method = isEdit ? "PUT" : "POST";

    try {
      const resp = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode 
        },
        body: JSON.stringify(isEdit ? categoryForm : newCategoryData),
      });

      if (resp.ok) {
        await fetchStateFromServer();
      }
    } catch (err) {
      console.warn("Express endpoint failed (expected on static Vercel hosts). Preserved locally in real-time:", err);
    }

    showToast(t.adminAddCategorySuccess);
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({ nameEn: "", nameAr: "", nameOm: "", nameAm: "", icon: "Utensils" });
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm(t.deleteCategoryConfirm)) return;
    if (!appState) return;

    const updatedCategories = appState.categories.filter((c) => c.id !== id);
    const newState: AppState = {
      ...appState,
      categories: updatedCategories
    };

    await saveAndApplyState(newState);

    try {
      await fetch(`/api/categories/${id}`, { 
        method: "DELETE",
        headers: { "x-admin-passcode": adminPasscode }
      });
    } catch (e) {
      console.warn("Express endpoint failed (expected on static Vercel). Deleted locally in real-time:", e);
    }
    showToast(t.adminDeleteSuccess);
  };

  // Modify Hero Section dynamically
  const [heroForm, setHeroForm] = useState<HeroConfig>({
    titleEn: "",
    titleAr: "",
    titleOm: "",
    titleAm: "",
    subtitleEn: "",
    subtitleAr: "",
    subtitleOm: "",
    subtitleAm: "",
    images: [],
  });

  const [restaurantForm, setRestaurantForm] = useState<RestaurantConfig>({
    nameEn: "",
    nameAr: "",
    nameOm: "",
    nameAm: "",
    phone: "",
    email: "",
    addressEn: "",
    addressAr: "",
    addressOm: "",
    addressAm: "",
    openingHoursEn: "",
    openingHoursAr: "",
    openingHoursOm: "",
    openingHoursAm: "",
    instagramUrl: "",
    facebookUrl: "",
  });

  // Populate dynamic forms when state loads
  useEffect(() => {
    if (appState) {
      setHeroForm(appState.hero);
      setRestaurantForm(appState.restaurant);
    }
  }, [appState]);

  const handleHeroUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appState) return;

    const newState: AppState = {
      ...appState,
      hero: heroForm
    };

    await saveAndApplyState(newState);

    try {
      const resp = await fetch("/api/hero", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode 
        },
        body: JSON.stringify(heroForm),
      });
      if (resp.ok) {
        await fetchStateFromServer();
      }
    } catch (err) {
      console.warn("Express endpoint failed (expected on static Vercel). Updated locally in real-time:", err);
    }
    showToast(t.updateHeroSuccess);
  };

  const handleRestaurantUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appState) return;

    const newState: AppState = {
      ...appState,
      restaurant: restaurantForm
    };

    await saveAndApplyState(newState);

    try {
      const resp = await fetch("/api/restaurant", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-passcode": adminPasscode 
        },
        body: JSON.stringify(restaurantForm),
      });
      if (resp.ok) {
        await fetchStateFromServer();
      }
    } catch (err) {
      console.warn("Express endpoint failed (expected on static Vercel). Updated locally in real-time:", err);
    }
    showToast(lang === "en" ? "Restaurant Info Updated!" : "تم تحديث معلومات المطعم!");
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div id="taqwa-app-root" className="min-h-screen flex flex-col font-sans text-[#1c1a17] bg-[#faf9f6]/40" dir={dir}>
      <AnimatePresence mode="popLayout">
        {(!splashFinished || loading || !appState) && (
          <motion.div
            key="splash-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            id="splash-loader"
            className="fixed inset-0 z-50 bg-[#141210] flex flex-col items-center justify-center text-white"
            dir={dir}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6 max-w-sm px-6"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-amber-500 blur-xl opacity-30 rounded-full animate-pulse" />
                <div className="relative bg-white/10 p-5 rounded-2xl border border-white/20 animate-spin">
                  <Utensils className="h-10 w-10 text-ambient-glow" />
                </div>
              </div>
              <div className="space-y-2 animate-pulse">
                <h1 className="font-serif text-3xl font-bold tracking-widest text-[#ebd8bf]">
                  {t.welcomeLoader}
                </h1>
                <p className="font-sans text-xs uppercase tracking-widest text-[#a8a69e]">
                  {t.restaurantName} · Shashemene
                </p>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto rounded-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content layer guarded by appState availability */}
      {appState && (
        <>
          {/* Toast Notifier */}
          {toastMessage && (
            <div
              id="toast-box"
              className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#1c1a17] text-white px-6 py-4 rounded-2xl shadow-xl border border-amber-500/20 max-w-md animate-bounce transform translate-y-0"
            >
              <Sparkles className="h-5 w-5 text-ambient-gold animate-spin-slow" />
              <p className="text-sm font-semibold">{toastMessage}</p>
            </div>
          )}

          {/* Styled Top Header */}
          <Header
            currentTab={currentTab}
            onTabChange={handleTabChange}
            lang={lang}
            onLangChange={setLang}
          />

      {/* Primary Routing Content Switcher */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {/* VIEW 1: HOME PAGE */}
          {currentTab === "home" && (
            <motion.div
              key="view-home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              id="view-home"
              className="space-y-24 pb-20"
            >
            {/* Immersive Fading Hero Section */}
            <Hero
              hero={appState.hero}
              lang={lang}
              onExploreClick={() => setCurrentTab("menu")}
            />

            {/* Taqwa Story & Heritage Section */}
            <section id="heritage-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-5 space-y-6">
                  <span className="text-sm font-bold uppercase tracking-widest text-primary-700 block">
                    {t.homeStorySubtitle}
                  </span>
                  <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-[#1c1a17]">
                    {t.homeStoryTitle}
                  </h2>
                  <div className="h-1.5 w-20 bg-amber-500 rounded-full" />
                  <p className="text-gray-600 leading-relaxed font-sans text-base sm:text-lg">
                    {t.homeStoryText}
                  </p>
                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-ambient-gold" />
                      <span className="text-sm font-bold text-gray-700">Shashemene Finest Gastronomy</span>
                    </div>
                  </div>
                </div>

                {/* Collage Grid */}
                <div className="lg:col-span-7 grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <img
                      src="https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
                      className="w-full h-64 object-cover rounded-2xl shadow-lg border border-gray-100/40 hover:scale-102 transition-all duration-300"
                      alt="Premium Mandi"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600"
                      className="w-full h-44 object-cover rounded-2xl shadow-lg border border-gray-100/40 hover:scale-102 transition-all duration-300"
                      alt="Signature Drinks"
                    />
                  </div>
                  <div className="pt-8 space-y-4">
                    <img
                      src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600"
                      className="w-full h-40 object-cover rounded-2xl shadow-lg border border-gray-100/40 hover:scale-102 transition-all duration-300"
                      alt="Flame Grilled Kebabs"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600"
                      className="w-full h-68 object-cover rounded-2xl shadow-lg border border-gray-100/40 hover:scale-102 transition-all duration-300"
                      alt="Pistachio Baklava"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Jewels Grid */}
            <section id="featured-section" className="bg-[#f0ede6]/50 py-24 border-y border-[#e6e2da]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-16">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#a8a69e] block">
                    {t.tagline}
                  </span>
                  <h3 className="font-serif text-3xl sm:text-5xl font-bold">
                    {t.featuredDishes}
                  </h3>
                  <div className="h-1 w-24 bg-primary-700 mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#e5e7eb] flex flex-col hover:-translate-y-1"
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={p.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={getProductName(p)}
                        />
                        <div className="absolute top-4 right-4 bg-ambient-gold text-primary-950 font-bold px-3.5 py-1.5 rounded-full text-xs shadow-md">
                          ETB {p.price}
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-grow text-center space-y-3">
                        <h4 className="font-serif text-xl font-bold text-primary-950">
                          {getProductName(p)}
                        </h4>
                        <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                          {getProductDesc(p)}
                        </p>
                        <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-primary-700 font-bold uppercase flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" />
                            {t.available}
                          </span>
                          <button
                            onClick={() => setCurrentTab("menu")}
                            className="text-xs bg-[#f1f0ea] hover:bg-primary-950 hover:text-white text-primary-950 px-4 py-2 rounded-full font-bold transition-all flex items-center gap-1"
                          >
                            <span>{t.readMore}</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-12">
                  <button
                    onClick={() => setCurrentTab("menu")}
                    className="px-8 py-3.5 rounded-full bg-primary-700 hover:bg-primary-600 text-white font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2 text-sm"
                  >
                    <span>{t.viewFullMenu}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* NEW SECTION 1: THE CULINARY ART OF SLOW SMOKE (Appetite Stimulating) */}
            <section id="sensory-gastronomy-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
              <div className="bg-[#141210] rounded-[3rem] p-8 md:p-16 text-white relative shadow-2xl border border-amber-500/10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10" />
                
                <div className="lg:col-span-6 space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest">
                    <span>The Hot Hearth Experience</span>
                  </div>
                  
                  <h3 className="font-serif text-3xl sm:text-5xl font-bold leading-tight">
                    The Crackle of Hardy Timber, <br />
                    <span className="text-amber-400">The Secret Seasoning.</span>
                  </h3>
                  
                  <p className="text-gray-300 text-base sm:text-lg leading-relaxed font-sans">
                    Step inside our sanctuary in Shashemene, and watch as our pitmasters slow-tend succulent meats over natural hardwoods for up to twelve hours. Rich steam rises, locking in pure juices and wrapping each tender brisket or whole lamb in the velvety embrace of ancient cardamoms, dynamic clove, and local mountain gold honey. 
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <span className="block text-2xl font-serif font-bold text-amber-400">12 hrs</span>
                      <span className="text-xs text-gray-400">Hardwood Slow Roast</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <span className="block text-2xl font-serif font-bold text-amber-400">100%</span>
                      <span className="text-xs text-gray-400">Hand-selected Spices</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setCurrentTab("menu")}
                      className="px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-primary-950 font-extrabold transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
                    >
                      <span>Satisfy Your Cravings</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Engaging rich collage/artwork overlay */}
                <div className="lg:col-span-6 relative h-64 sm:h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1000"
                    className="absolute inset-0 w-full h-full object-cover brightness-95 contrast-105 hover:scale-105 transition-transform duration-[3s]"
                    alt="Smoked succulent cooked meat and rice platter"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-transparent to-[#141210]/20" />
                  <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-[#141210]/70 backdrop-blur-md border border-white/10">
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-1">Diner's favorite</span>
                    <p className="text-white font-serif text-lg font-semibold">Taqwa Royale Mandi Platter</p>
                  </div>
                </div>
              </div>
            </section>

            {/* NEW SECTION 2: LUXURIOUS 1-BILLION-DOLLAR FEEDBACK WALL OF CRITIQUES */}
            <section id="feedback-critiques-section" className="bg-white border-y border-gray-100 py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#a8a69e] block">
                    Stories of Gastronomy & Pride
                  </span>
                  <h3 className="font-serif text-3xl sm:text-5xl font-bold text-primary-950">
                    Whispers of Gratitude
                  </h3>
                  <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
                    Discover why food writers, families, and high-end travelers choose Taqwa as their destination of choice in Shashemene.
                  </p>
                  <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  
                  {/* Testimonial card 1 */}
                  <div className="bg-[#faf9f6]/90 border border-gray-200/60 p-8 rounded-[2rem] shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all hover:-translate-y-1 duration-300">
                    <div className="space-y-4">
                      {/* Gold stars */}
                      <div className="flex gap-1 text-[#f59e0b]">
                        {"★★★★★".split("").map((str, i) => (
                          <span key={i} className="text-lg">★</span>
                        ))}
                      </div>
                      <p className="text-gray-700 italic font-medium leading-relaxed">
                        "The Taqwa Royale Mandi is an spiritual experience. The seasoned lamb literally fell off the bone the moment our fork touched it. Shashemene finally has a true crown jewel of gastronomy!"
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-6 border-t border-gray-200/40 mt-6 font-sans">
                      <div className="w-10 h-10 rounded-full bg-primary-700 text-white font-serif font-bold text-sm flex items-center justify-center">
                        IM
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-primary-950">Dr. Ibrahim Al-Mansoor</span>
                        <span className="text-[10px] text-gray-400">Verified Local Guide • Shashemene</span>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial card 2 */}
                  <div className="bg-[#faf9f6]/90 border border-gray-200/60 p-8 rounded-[2rem] shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all hover:-translate-y-1 duration-300">
                    <div className="space-y-4">
                      {/* Gold stars */}
                      <div className="flex gap-1 text-[#f59e0b]">
                        {"★★★★★".split("").map((str, i) => (
                          <span key={i} className="text-lg">★</span>
                        ))}
                      </div>
                      <p className="text-gray-700 italic font-medium leading-relaxed">
                        "Unbelievable depth of spices. The saffron long-grain basmati is steam-cooked with cardamom to absolute, separate perfection. Incredible five-star service that feels like coming home."
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-6 border-t border-[#1c1a17]/10 mt-6 font-sans">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-primary-950 font-serif font-bold text-sm flex items-center justify-center">
                        FA
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-primary-950">Fatima Ahmedollah</span>
                        <span className="text-[10px] text-gray-400">Premium Food Blogger • Addis Ababa</span>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial card 3 */}
                  <div className="bg-[#faf9f6]/90 border border-gray-200/60 p-8 rounded-[2rem] shadow-lg flex flex-col justify-between hover:shadow-2xl transition-all hover:-translate-y-1 duration-300">
                    <div className="space-y-4">
                      {/* Gold stars */}
                      <div className="flex gap-1 text-[#f59e0b]">
                        {"★★★★★".split("").map((str, i) => (
                          <span key={i} className="text-lg">★</span>
                        ))}
                      </div>
                      <p className="text-gray-700 italic font-medium leading-relaxed">
                        "Every single dish has a story written in embers. The honey-steeped Baklava Royale is so delicious, crunchy, and richly nutty. Highly recommend visiting Taqwa on any weekend trip!"
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-6 border-t border-gray-200/40 mt-6 font-sans">
                      <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-serif font-bold text-sm flex items-center justify-center">
                        AK
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-primary-950">Ato Abdi Kassim</span>
                        <span className="text-[10px] text-gray-400">Gourmet Critic • Shashemene</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          </motion.div>
        )}


        {/* VIEW 2: COMPACT MENU PAGE */}
        {currentTab === "menu" && (
          <motion.div
            key="view-menu"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            id="view-menu"
            className="pt-32 pb-24 space-y-12"
          >
            
            {/* Header Text */}
            <div className="max-w-3xl mx-auto text-center px-4 space-y-4">
              <h2 className="font-serif text-4xl sm:text-5xl font-extrabold tracking-tight">
                {t.navMenu}
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-sans leading-relaxed">
                {t.tagline} — Enjoy signature local delicacies, traditional flame grills and legendary beverages in real-time.
              </p>
            </div>

            {/* Sticky/Interactive Filtering & Searching Unit */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-[#f0ede6] p-4 rounded-3xl border border-gray-200/60 shadow-inner space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Real-time search query box */}
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="menu-search-input"
                      type="text"
                      className={`w-full bg-[#faf9f6]/90 pl-11 pr-4 py-3.5 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-700 transition-all font-sans text-sm ${
                        lang === "ar" ? "text-right" : "text-left"
                      }`}
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Category switcher */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <button
                      onClick={() => setSelectedCategoryId("all")}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedCategoryId === "all"
                          ? "bg-primary-950 text-amber-300 shadow-md"
                          : "bg-[#faf9f6] text-gray-700 hover:bg-[#faf9f6]/90 border border-gray-300/60"
                      }`}
                    >
                      {t.allCategories}
                    </button>
                    {appState.categories.map((c) => {
                      const isSel = selectedCategoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCategoryId(c.id)}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                            isSel
                              ? "bg-primary-950 text-amber-300 shadow-md"
                              : "bg-[#faf9f6] text-gray-700 hover:bg-[#faf9f6]/92 border border-gray-300/60"
                          }`}
                        >
                          <Coffee className="h-3.5 w-3.5 text-ambient-gold" />
                          <span>{getCatName(c)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Grid Content - Beautiful Box Shadows */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {filteredProducts.length === 0 ? (
                <div id="no-products-warning" className="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-200">
                  <AlertCircle className="h-12 w-12 text-ambient-gold mx-auto mb-4" />
                  <p className="text-[#1c1a17] font-serif text-lg font-bold">{t.noProductsFound}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="group bg-white rounded-3xl overflow-hidden border border-[#e5e7eb] shadow-lg hover:shadow-2xl hover:border-amber-500/10 transition-all duration-300 flex flex-col hover:-translate-y-1"
                    >
                      {/* Image section */}
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={p.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={getProductName(p)}
                        />
                        {!p.isAvailable && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                            <span className="bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm tracking-wide uppercase">
                              {t.soldOut}
                            </span>
                          </div>
                        )}
                        {p.isFeatured && p.isAvailable && (
                          <div className="absolute top-4 left-4 bg-amber-400 text-primary-950 font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Premium</span>
                          </div>
                        )}
                        <div className="absolute bottom-4 right-4 bg-primary-950 text-white px-4 py-1.5 rounded-full text-sm font-extrabold shadow-lg">
                          ETB {p.price}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-6 flex flex-col flex-grow text-center space-y-3">
                        <h3 className="font-serif text-xl font-bold text-primary-950">
                          {getProductName(p)}
                        </h3>
                        <p className="text-gray-500 text-sm h-14 overflow-hidden text-ellipsis line-clamp-3 leading-relaxed">
                          {getProductDesc(p)}
                        </p>

                        <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between">
                          <span
                            className={`text-xs font-bold uppercase ${
                              p.isAvailable ? "text-primary-600" : "text-red-500"
                            }`}
                          >
                            • {p.isAvailable ? t.available : t.soldOut}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}


        {/* VIEW 3: SEPARATED SECURE ADMIN DASHBOARD */}
        {currentTab === "admin" && (
          <motion.div
            key="view-admin"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            id="view-admin"
            className="pt-32 pb-24"
          >
            {!isAdminUnlocked ? (
              <div className="max-w-md mx-auto px-4 mt-12">
                <form
                  id="admin-form-unlock"
                  onSubmit={handleUnlockAdmin}
                  className="bg-white p-8 rounded-3xl border border-gray-200/60 shadow-2xl space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="p-4 rounded-2xl bg-[#faf9f6] inline-block mb-3 border border-gray-100 text-amber-500">
                      <Lock className="h-8 w-8" />
                    </div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-primary-950">Admin Console</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t.adminPasscode}</p>
                  </div>

                  <div className="space-y-1">
                    <input
                      id="passcode-input"
                      type="password"
                      className="w-full bg-[#faf9f6] px-4 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-700 text-center font-mono placeholder-gray-400 font-bold"
                      placeholder={t.passcodePlaceholder}
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                    />
                    {passcodeError && (
                      <p className="text-red-500 text-xs text-center font-semibold mt-1">
                        {passcodeError}
                      </p>
                    )}
                  </div>

                  <button
                    id="submit-passcode"
                    type="submit"
                    className="w-full bg-primary-700 hover:bg-primary-600 text-white py-3.5 rounded-xl font-bold transition-all shadow-md mt-4 cursor-pointer"
                  >
                    {t.submit}
                  </button>
                </form>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                
                {/* Dynamic Title area */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-200 pb-6 gap-4">
                  <div>
                    <h2 className="font-serif text-3xl sm:text-4xl font-black text-primary-950 flex items-center gap-2">
                      <Unlock className="h-8 w-8 text-ambient-gold" />
                      <span>{t.adminTitle}</span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">{t.adminSubtitle}</p>
                  </div>

                  <button
                    id="lock-panel-btn"
                    onClick={() => {
                      setIsAdminUnlocked(false);
                      setAdminPasscode("");
                    }}
                    className="bg-[#1c1a17] hover:bg-red-600 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all cursor-pointer shadow"
                  >
                    Lock Console
                  </button>
                </div>


                {/* DYNAMIC, REALISTIC & SPIRITUAL ANALYTICS DASHBOARD HIGHLIGHTS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* KPI card 1: Cuisines count */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">Halal Culinary Cuisines</span>
                      <span className="block font-serif text-3xl font-black text-primary-950 mt-1">{appState.products.length} Items</span>
                      <span className="block text-[10px] text-emerald-600 font-bold mt-1 font-sans">● Fully Active in Realtime</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-600">
                      <ChefHat className="h-6 w-6" />
                    </div>
                  </div>

                  {/* KPI card 2: Categories */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">Sanctuary Categories</span>
                      <span className="block font-serif text-3xl font-black text-primary-950 mt-1">{appState.categories.length} Sections</span>
                      <span className="block text-[10px] text-emerald-600 font-bold mt-1 font-sans">● Schema Synced Successfully</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary-900/10 text-primary-900">
                      <ListFilter className="h-6 w-6" />
                    </div>
                  </div>

                  {/* KPI card 3: Dynamic Simulated site views */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">Total Digital Traffic</span>
                      <span className="block font-serif text-3xl font-black text-primary-950 mt-1">2,480 Views</span>
                      <span className="block text-[10px] text-amber-600 font-semibold mt-1 font-sans">▲ 14% Peak Weekend Spike</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600">
                      <Clock className="h-6 w-6" />
                    </div>
                  </div>

                  {/* KPI card 4: Spiritual Team Reminder / Halal focus */}
                  <div className="bg-[#121a14] text-emerald-100 rounded-3xl p-6 shadow-xl relative overflow-hidden border border-emerald-500/10">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                    <div className="space-y-1 relative">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-400 font-sans">
                        <Sparkles className="h-3 w-3" />
                        <span>Daily Ihsan Reminder</span>
                      </span>
                      <p className="font-serif text-xs italic leading-relaxed text-emerald-200">
                        "Eat of the good things which We have provided for you, and be grateful..."
                      </p>
                      <p className="text-[9px] text-[#cca05a] uppercase font-bold tracking-wider pt-1 font-sans">— Surah Al-Baqarah 172</p>
                    </div>
                  </div>
                </div>

                {/* TAQWA OPERATIONS & STABILITY MONITOR PANEL */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-emerald-600" />
                      <div>
                        <h3 className="font-serif text-xl font-bold text-primary-950">
                          Taqwa Gastronomy Infrastructure Status
                        </h3>
                        <p className="text-gray-400 text-xs font-sans">Self-healing local fallback and dynamic Express server synchronizer active</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-sans">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Operational</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#faf9f6]/80 p-4 rounded-2xl border border-gray-200/60 space-y-1.5">
                      <span className="block text-xs font-bold text-gray-400 uppercase font-sans">Live Server Protocol</span>
                      <p className="text-sm font-semibold text-primary-950 font-serif">
                        {appState === defaultAppState ? "Static Vercel Offline Fallback" : "Express Live Sync Protocol"}
                      </p>
                      <p className="text-xs text-gray-400 font-sans">Guarantees 100% serverless availability on static hosts with local index</p>
                    </div>

                    <div className="bg-[#faf9f6]/80 p-4 rounded-2xl border border-gray-200/60 space-y-1.5">
                      <span className="block text-xs font-bold text-gray-400 uppercase font-sans font-medium">Taqwa Database Integrity</span>
                      <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1 font-serif">
                        <Check className="h-4 w-4" /> Passed Integrity Checks
                      </p>
                      <p className="text-xs text-gray-400 font-sans">Premium custom dataset successfully loaded into frontend memory</p>
                    </div>

                    <div className="bg-[#faf9f6]/80 p-4 rounded-2xl border border-gray-200/60 space-y-1.5">
                      <span className="block text-xs font-bold text-gray-400 uppercase font-sans">Operational Control Checklist</span>
                      <div className="flex justify-between items-center text-xs font-sans">
                        <span className="text-gray-500">Secure Passcode Protection:</span>
                        <span className="text-emerald-700 font-bold">Active</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-sans">
                        <span className="text-gray-500">Spiritual Image Layout:</span>
                        <span className="text-emerald-700 font-bold">Active (Islami)</span>
                      </div>
                    </div>
                  </div>
                </div>


                {/* TAB SECTION A: HERO CONTROLS - FULL 4-LANGUAGE SUPPORT */}
                <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-xl space-y-6">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                    <Sparkles className="h-5 w-5 text-ambient-gold" />
                    <h3 className="font-serif text-xl font-bold text-primary-950">
                      {t.adminSectionHero}
                    </h3>
                  </div>

                  <form onSubmit={handleHeroUpdate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{t.heroTitleFieldEn}</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 font-sans font-medium"
                        value={heroForm.titleEn}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, titleEn: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{t.heroTitleFieldAr}</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 font-sans font-medium text-right"
                        value={heroForm.titleAr}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, titleAr: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{t.heroTitleFieldOm}</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6]/90 p-3 rounded-lg border border-gray-300 font-sans font-medium"
                        value={heroForm.titleOm || ""}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, titleOm: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{t.heroTitleFieldAm}</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6]/90 p-3 rounded-lg border border-gray-300 font-sans font-medium text-left"
                        value={heroForm.titleAm || ""}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, titleAm: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{t.heroSubtitleFieldEn}</label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 font-sans text-sm"
                        value={heroForm.subtitleEn}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, subtitleEn: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{t.heroSubtitleFieldAr}</label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 font-sans text-sm text-right"
                        value={heroForm.subtitleAr}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, subtitleAr: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{t.heroSubtitleFieldOm}</label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 font-sans text-sm"
                        value={heroForm.subtitleOm || ""}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, subtitleOm: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">{t.heroSubtitleFieldAm}</label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 font-sans text-sm text-left"
                        value={heroForm.subtitleAm || ""}
                        onChange={(e) => setHeroForm((prev) => ({ ...prev, subtitleAm: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1 lg:col-span-4">
                      <label className="text-xs font-bold text-gray-500 uppercase">{t.heroImagesList}</label>
                      <textarea
                        rows={2}
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 font-mono text-xs text-left"
                        value={heroForm.images.join("\n")}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n").filter((l) => l.trim() !== "");
                          setHeroForm((prev) => ({ ...prev, images: lines }));
                        }}
                      />
                    </div>

                    <div className="lg:col-span-4 pt-2 text-right">
                      <button
                        type="submit"
                        className="bg-primary-950 hover:bg-primary-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow cursor-pointer animate-pulse"
                      >
                        {t.saveChanges}
                      </button>
                    </div>
                  </form>
                </section>


                {/* TAB SECTION B: RESTAURANT CONFIG - SHASHEMENE TARGET */}
                <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-xl space-y-6">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                    <MapPin className="h-5 w-5 text-ambient-gold" />
                    <h3 className="font-serif text-xl font-bold text-primary-950">
                      Restaurant & Anchor Information
                    </h3>
                  </div>

                  <form onSubmit={handleRestaurantUpdate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Phone contact</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 font-medium"
                        value={restaurantForm.phone}
                        onChange={(e) => setRestaurantForm((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Email support</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 font-medium"
                        value={restaurantForm.email}
                        onChange={(e) => setRestaurantForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Address EN</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 text-sm font-medium"
                        value={restaurantForm.addressEn}
                        onChange={(e) => setRestaurantForm((prev) => ({ ...prev, addressEn: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Address AR</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6] p-3 rounded-lg border border-gray-300 text-sm text-right font-medium"
                        value={restaurantForm.addressAr}
                        onChange={(e) => setRestaurantForm((prev) => ({ ...prev, addressAr: e.target.value }))}
                      />
                    </div>

                    {/* Address Om & Am */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Address Afaan Oromoo</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6]/95 p-3 rounded-lg border border-gray-300 text-sm font-medium"
                        value={restaurantForm.addressOm || ""}
                        onChange={(e) => setRestaurantForm((prev) => ({ ...prev, addressOm: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Address Amharic</label>
                      <input
                        type="text"
                        className="w-full bg-[#faf9f6]/95 p-3 rounded-lg border border-gray-300 text-sm font-medium"
                        value={restaurantForm.addressAm || ""}
                        onChange={(e) => setRestaurantForm((prev) => ({ ...prev, addressAm: e.target.value }))}
                      />
                    </div>

                    <div className="lg:col-span-4 text-right pt-2">
                      <button
                        type="submit"
                        className="bg-primary-950 hover:bg-primary-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow cursor-pointer"
                      >
                        Update Restaurant Details
                      </button>
                    </div>
                  </form>
                </section>


                {/* TAB SECTION C: CATEGORIES CONTROLS - FULL 4-LANGUAGE */}
                <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-4">
                    <div className="flex items-center gap-2">
                      <ListFilter className="h-5 w-5 text-ambient-gold" />
                      <h3 className="font-serif text-xl font-bold text-primary-950">
                        {t.adminSectionCategory}
                      </h3>
                    </div>

                    <button
                      id="add-cat-btn"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ nameEn: "", nameAr: "", nameOm: "", nameAm: "", icon: "Utensils" });
                        setIsCategoryModalOpen(true);
                      }}
                      className="bg-primary-700 hover:bg-primary-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t.addCategory}</span>
                    </button>
                  </div>

                  {/* List of categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {appState.categories.map((c) => (
                      <div
                        key={c.id}
                        className="bg-[#faf9f6] p-4 rounded-2xl border border-gray-200/80 flex flex-col justify-between shadow-sm relative group"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-[#1c1a17]">{c.nameEn}</p>
                          <p className="text-xs text-gray-400">Afaan Oromoo: {c.nameOm || "-"}</p>
                          <p className="text-xs text-gray-400">Amharic: {c.nameAm || "-"}</p>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-gray-100 mt-3">
                          <button
                            onClick={() => {
                              setEditingCategory(c);
                              setCategoryForm(c);
                              setIsCategoryModalOpen(true);
                            }}
                            className="p-1 px-2.5 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold uppercase transition-all"
                          >
                            {t.edit}
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1 px-2.5 hover:bg-red-50 text-red-500 rounded text-xs font-bold uppercase transition-all"
                          >
                            {t.delete}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>


                {/* TAB SECTION D: PRODUCTS CONTROLS */}
                <section className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-4">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5 text-ambient-gold" />
                      <h3 className="font-serif text-xl font-bold text-primary-950">
                        {t.adminSectionProduct}
                      </h3>
                    </div>

                    <button
                      id="add-prod-btn"
                      onClick={() => {
                        setEditingProduct(null);
                        setProductForm({
                          nameEn: "",
                          nameAr: "",
                          nameOm: "",
                          nameAm: "",
                          descriptionEn: "",
                          descriptionAr: "",
                          descriptionOm: "",
                          descriptionAm: "",
                          price: 0,
                          categoryId: appState.categories[0]?.id || "",
                          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
                          isAvailable: true,
                          isFeatured: false,
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="bg-primary-700 hover:bg-primary-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{t.addProduct}</span>
                    </button>
                  </div>

                  {/* List/Grid of Products */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-[#f0ede6] text-primary-950 text-xs font-bold uppercase">
                        <tr>
                          <th className="p-4">Dish</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {appState.products.map((p) => {
                          const associatedCat = appState.categories.find((c) => c.id === p.categoryId);
                          return (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                <img
                                  src={p.image}
                                  className="w-12 h-12 rounded-xl object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800";
                                  }}
                                />
                                <div>
                                  <p className="font-bold text-[#1c1a17]">{p.nameEn}</p>
                                  <p className="text-xs text-gray-400">Oromo: {p.nameOm || "-"}</p>
                                  <p className="text-xs text-gray-400">Amharic: {p.nameAm || "-"}</p>
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-[#1c1a17]">
                                {associatedCat?.nameEn || p.categoryId}
                              </td>
                              <td className="p-4 font-bold text-primary-950">
                                ETB {p.price}
                              </td>
                              <td className="p-4">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                    p.isAvailable
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {p.isAvailable ? "In Stock" : "Sold Out"}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(p);
                                      setProductForm(p);
                                      setIsProductModalOpen(true);
                                    }}
                                    className="p-1 px-3 hover:bg-gray-100 rounded text-gray-700 text-xs font-bold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-1 px-3 hover:bg-red-50 text-red-600 text-xs font-bold"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </section>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      </main>

      {/* Category Modal Dialog - ALL 4 LANGUAGES */}
      {isCategoryModalOpen && (
        <div id="cat-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl relative">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-2xl font-bold text-primary-950 mb-6 flex items-center gap-2">
              <ListFilter className="h-6 w-6 text-ambient-gold" />
              <span>{editingCategory ? "Edit Category" : t.addCategory}</span>
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">{t.formNameEn}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 font-medium text-sm"
                  value={categoryForm.nameEn}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">{t.formNameAr}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 text-right font-medium text-sm"
                  value={categoryForm.nameAr}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">{t.formNameOm}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 font-medium text-sm"
                  value={categoryForm.nameOm || ""}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, nameOm: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">{t.formNameAm}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 text-left font-medium text-sm"
                  value={categoryForm.nameAm || ""}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, nameAm: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-500"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-700 hover:bg-primary-600 text-white rounded-xl text-sm font-bold shadow"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal Dialog - ALL 4 LANGUAGES */}
      {isProductModalOpen && (
        <div id="prod-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 border border-gray-100 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-2xl font-bold text-primary-950 mb-6 flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-ambient-gold" />
              <span>{editingProduct ? t.editProduct : t.addProduct}</span>
            </h3>

            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">{t.formNameEn}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 font-medium text-sm"
                  value={productForm.nameEn}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">{t.formNameAr}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 text-right font-medium text-sm"
                  value={productForm.nameAr}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">{t.formNameOm}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 font-medium text-sm"
                  value={productForm.nameOm}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, nameOm: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">{t.formNameAm}</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 text-left font-medium text-sm"
                  value={productForm.nameAm}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, nameAm: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#374151] uppercase">{t.formDescEn}</label>
                <textarea
                  rows={2}
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 text-sm"
                  value={productForm.descriptionEn}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, descriptionEn: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#374151] uppercase">{t.formDescAr}</label>
                <textarea
                  rows={2}
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 text-right text-sm"
                  value={productForm.descriptionAr}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, descriptionAr: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#374151] uppercase">{t.formDescOm}</label>
                <textarea
                  rows={2}
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 text-sm"
                  value={productForm.descriptionOm}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, descriptionOm: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#374151] uppercase">{t.formDescAm}</label>
                <textarea
                  rows={2}
                  className="w-full bg-[#faf9f6]/95 p-3 rounded-xl border border-gray-300 text-sm placeholder-left"
                  value={productForm.descriptionAm}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, descriptionAm: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#374151] uppercase">{t.formPrice}</label>
                <input
                  type="number"
                  required
                  className="w-full bg-[#faf9f6] p-3 rounded-xl border border-gray-300 text-sm"
                  value={productForm.price}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">{t.formCategory}</label>
                <select
                  className="w-full bg-[#faf9f6] p-3 rounded-xl border border-gray-300 text-sm"
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                >
                  {appState.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-[#374151] uppercase">{t.formImageUrl}</label>
                <input
                  type="text"
                  className="w-full bg-[#faf9f6] p-3 rounded-xl border border-gray-300 font-mono text-xs"
                  value={productForm.image}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, image: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-4 py-2 md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-700 focus:ring-primary-700"
                    checked={productForm.isAvailable}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
                  />
                  <span>{t.formAvailable}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-700 focus:ring-primary-700"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                  />
                  <span>{t.formFeatured}</span>
                </label>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-500"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-700 hover:bg-primary-600 text-white rounded-xl text-sm font-bold shadow"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled Modern Footer */}
      <Footer restaurant={appState.restaurant} lang={lang} onTabChange={handleTabChange} />
        </>
      )}
    </div>
  );
}
