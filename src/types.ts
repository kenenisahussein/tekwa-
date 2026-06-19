/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  nameOm: string;
  nameAm: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionOm: string;
  descriptionAm: string;
  price: number; // in ETB
  categoryId: string;
  image: string;
  isAvailable: boolean;
  isFeatured?: boolean;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  nameOm: string;
  nameAm: string;
  icon: string; // Lucide icon identifier
}

export interface HeroConfig {
  titleEn: string;
  titleAr: string;
  titleOm: string;
  titleAm: string;
  subtitleEn: string;
  subtitleAr: string;
  subtitleOm: string;
  subtitleAm: string;
  images: string[];
}

export interface RestaurantConfig {
  nameEn: string;
  nameAr: string;
  nameOm: string;
  nameAm: string;
  phone: string;
  email: string;
  addressEn: string;
  addressAr: string;
  addressOm: string;
  addressAm: string;
  openingHoursEn: string;
  openingHoursAr: string;
  openingHoursOm: string;
  openingHoursAm: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
}

export interface AppState {
  products: Product[];
  categories: Category[];
  hero: HeroConfig;
  restaurant: RestaurantConfig;
}
