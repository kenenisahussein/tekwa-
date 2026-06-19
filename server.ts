import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { AppState, Product, Category, HeroConfig, RestaurantConfig } from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Memory-based rate limiter to protect the server
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // block after 100 requests per IP per minute

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown-client";
  const now = Date.now();
  
  let record = rateLimits.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimits.set(ip, record);
    return next();
  }

  record.count++;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    console.warn(`[RATE LIMIT EXCEEDED] Suspicious traffic from IP: ${ip} on route ${req.originalUrl}`);
    return res.status(429).json({ error: "Too many requests. Please try again in a minute." });
  }
  next();
};

// Express Custom Logging middleware
const customLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const elapsed = Date.now() - start;
    console.log(`[ACCESS LOG] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${elapsed}ms | IP: ${req.ip}`);
  });
  next();
};

// Default initial state matching the request: Shashemene, no Middle East or Africa mentions, full 4-language translations
const defaultState: AppState = {
  categories: [
    { 
      id: "mains", 
      nameEn: "Signature Mains", 
      nameAr: "الأطباق الرئيسية والأصيلة", 
      nameOm: "Nyaata Filatamo",
      nameAm: "ልዩ ምግቦች",
      icon: "Beef" 
    },
    { 
      id: "appetizers", 
      nameEn: "Golden Appetizers", 
      nameAr: "المقبلات الذهبية والمقرمشة", 
      nameOm: "Nyaata Salphaa",
      nameAm: "መክሰስ", 
      icon: "Utensils" 
    },
    { 
      id: "desserts", 
      nameEn: "Sweet Indulgences", 
      nameAr: "الحلويات الفاخرة", 
      nameOm: "Mi'aawaa",
      nameAm: "ጣፋጭ ምግቦች", 
      icon: "Cake" 
    },
    { 
      id: "beverages", 
      nameEn: "Refreshing Drinks", 
      nameAr: "مشروبات منعشة ودافئة", 
      nameOm: "Dhugaatii",
      nameAm: "መጠጦች", 
      icon: "Coffee" 
    }
  ],
  products: [
    {
      id: "prod-1",
      nameEn: "Taqwa Royale Mandi",
      nameAr: "أرز مندي الملكي باللحم",
      nameOm: "Mandi Royale",
      nameAm: "ተቅዋ የላቀ ማንዲ",
      descriptionEn: "Fragrant seasoned rice cooked under hickory wood, served with melt-in-the-mouth roasted lamb, toasted almonds, golden raisins, and dynamic house salsa.",
      descriptionAr: "أرز ذو نكهة عطرة مطبوخ تحت خشب الجوز، يقدم مع لحم ضأن مشوي يذوب في الفم، ولوز محمص، وزبيب ذهبي، وصلصة منزلية حيوية.",
      descriptionOm: "Basmatii urgaahu nuffee mukaan bilchaate, foon hoolaa lallaafaa, boddee fi salsa saxamaa waliin dhiyaata.",
      descriptionAm: "በሚያምር መዓዛ የተቀመመ የተጠበሰ የበግ ስጋ፣ ለውዝ፣ ዘቢብ እና ልዩ ሰልሳ ጋር የሚቀርብ ምርጥ ባህላዊ ማንዲ።",
      price: 1800,
      categoryId: "mains",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
      isAvailable: true,
      isFeatured: true
    },
    {
      id: "prod-2",
      nameEn: "Flame-Grilled Shish Kabab",
      nameAr: "كباب لحم مشوي على الفحم",
      nameOm: "Kabaab Gilaalame",
      nameAm: "በከሰል የተጠበሰ ሽሽ ካባብ",
      descriptionEn: "Three skewers of succulent beef strip-loin marinated in Taqwa's signature spices, grilled over open coals with roasted peppers and onions.",
      descriptionAr: "ثلاثة أسياخ من اللحم اللذيذ المتبل ببهارات تقوى الخاصة، مشوي على الجمر المفتوح مع الفلفل والبصل المشوي.",
      descriptionOm: "Shish kabaab foon sa'aa cuunfaan addaa kootiin laaffate, koshomii fi burtukaana wajjiin gubbaa dhumarratti qophaaye.",
      descriptionAm: "በተቅዋ ልዩ ቅመማ ቅመም የተቀመመ፣ በከሰል እሳት ላይ ከቃሪያና ሽንኩርት ጋር የሚጠበስ ሶስት ሲክ ምርጥ የበሬ ስጋ።",
      price: 1450,
      categoryId: "mains",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
      isAvailable: true,
      isFeatured: true
    },
    {
      id: "prod-3",
      nameEn: "Savoury Gourmet Sambusa",
      nameAr: "سمبوسة مقرمشة متميزة",
      nameOm: "Sambusaa Taqwa",
      nameAm: "ጥራት ያለው ሳምቡሳ",
      descriptionEn: "Crisp golden pastry skins loaded with spiced organic minced beef, fresh coriander, green onions, and mild green chillies.",
      descriptionAr: "عجينة مقرمشة ذهبية محشوة بلحم بقري مفروم متبل، كزبرة طازجة، بصل أخضر وفلفل حار خفيف.",
      descriptionOm: "Sambusaa mi'aawaa foon laafaa mi'eessaan, shunkurtaa dhangalaa'aa wajjiin.",
      descriptionAm: "በቅመማ ቅመም፣ በሽንኩርትና በቃሪያ የተቀመመ የበሬ ስጋ የያዘ ወርቃማና ተወዳጅ ሳምቡሳ።",
      price: 380,
      categoryId: "appetizers",
      image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop&q=80",
      isAvailable: true,
      isFeatured: false
    },
    {
      id: "prod-5",
      nameEn: "Pistachio Honey Baklava Royale",
      nameAr: "بقلاوة ملكية بالفستق والعسل",
      nameOm: "Baklavaa Dammaa",
      nameAm: "በፒስታቺዮ እና ማር የተዘጋጀ ባቅላቫ",
      descriptionEn: "Delicate layers of crisp, butter-baked phyllo pastry stuffed with crushed high-grade pistachios and steeped in cardamom-infused local honey.",
      descriptionAr: "طبقات رقيقة من فطيرة الفيلو المخبوزة بالزبدة، محشوة بالفستق المطحون عالي الجودة والمغموسة في عسل محلي معطر بالهيل.",
      descriptionOm: "Baklavaa killiingii dammaa fi pistashiyoo baay'ee mi'aawaa.",
      descriptionAm: "በቅቤና በፒስታቺዮ ተሞልቶ በሻሸመኔ ማር የተነከረ ምርጥ ጣፋጭ ባቅላቫ።",
      price: 650,
      categoryId: "desserts",
      image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&auto=format&fit=crop&q=80",
      isAvailable: true,
      isFeatured: true
    },
    {
      id: "prod-6",
      nameEn: "Taqwa Shashemene Espresso Macchiato",
      nameAr: "ماكياتو شاشامان المتميز",
      nameOm: "Espresso Machiyaatoo",
      nameAm: "የተቅዋ ሻሸመኔ ማኪያቶ",
      descriptionEn: "Shashemene's premium sun-dried Arabica coffee, slow-roasted, freshly ground, double shot of espresso topped with silky steamed milk microfoam.",
      descriptionAr: "حبوب بن أرابيكا الممتازة المجففة بالشمس من شاشامان، محمصة ببطء، مطحونة طازجة، كحول مزدوج من إسبريسو تعلوها رغوة حليب ناعمة.",
      descriptionOm: "Buna oomisha Shashamanee beekamaa ta'e irraa qophaaye.",
      descriptionAm: "በአካባቢው ከሚመረት ጥራት ያለው ቡና የሚዘጋጅ፣ ጣፋጭ ወተት የተጨመረበት ማኪያቶ።",
      price: 190,
      categoryId: "beverages",
      image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&auto=format&fit=crop&q=80",
      isAvailable: true,
      isFeatured: false
    }
  ],
  hero: {
    titleEn: "Splendor of Hospitality & Traditional Craft",
    titleAr: "روعة الضيافة وفخامة الطهي الأصيل",
    titleOm: "Aadaa fi Kabajaa Keessummeessaa",
    titleAm: "የአስተናጋጅነት ክብርና ባህላዊ አዘገጃጀት",
    subtitleEn: "Indulge in a beautiful union of culinary majesty and heart-warming traditional local tastes in Shashemene. Every ingredient is hand-picked, cooked slow with absolute respect.",
    subtitleAr: "استمتع بمزيج رائع يجمع بين روعة عالم الطهي المتميز والجمال الدافئ للنكهات التقليدية الأصيلة في شاشامان. كل مكون مختار بعناية ومطهو ببطء.",
    subtitleOm: "Magaalaa bareeddii Shashamanee keessatti dhandhama nyaata addaa fi keessummeessaa mi'aawaa fidaa. Nyaatni keenya hunduu jaalalaan qophaaye.",
    subtitleAm: "በውቧ ሻሸመኔ ከተማ ውስጥ የምግብ አዘገጃጀት ጥበብንና ባህላዊ ጣዕምን ያጣጥሙ። እያንዳንዱ ምግብ በፍቅርና በጥንቃቄ የተዘጋጀ ነው።",
    images: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&auto=format&fit=crop&q=90",
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1600&auto=format&fit=crop&q=90",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=90"
    ]
  },
  restaurant: {
    nameEn: "Taqwa Restaurant",
    nameAr: "مطعم تقوى",
    nameOm: "Nyaata Taqwa",
    nameAm: "ተቅዋ ሬስቶራንት",
    phone: "+251 91 123 4567",
    email: "hospitality@taqwafood.com",
    addressEn: "Main Street, Area 02, Shashemene, Oromia, Ethiopia",
    addressAr: "الشارع الرئيسي، حي ٢، شاشامان، أوروميا، إثيوبيا",
    addressOm: "Karaa Guddaa, Kutaa 02, Shashamanee, Oromiyaa, Itoophiyaa",
    addressAm: "ዋናው መንገድ፣ ቀበሌ 02፣ ሻሸመኔ፣ ኦሮሚያ፣ ኢትዮጵያ",
    openingHoursEn: "Daily from 11:30 AM to 11:30 PM",
    openingHoursAr: "يومياً من الساعة ١١:٣٠ صباحاً حتى ١١:٣٠ مساءً",
    openingHoursOm: "Guyyaa guyyaatti sa'aatii 11:30 AM hanga 11:30 PM",
    openingHoursAm: "በየቀኑ ከጠዋቱ 5፡30 እስከ ምሽቱ 5፡30",
    instagramUrl: "https://instagram.com/taqwa_restaurant",
    facebookUrl: "https://facebook.com/taqwafood",
    twitterUrl: "https://twitter.com/taqwafood"
  }
};

// Help load and save database state
function loadDatabase(): AppState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsedData = JSON.parse(data);
      // Fallback fields mapping if DB existed but lacked new language fields on root level
      if (parsedData.hero && !parsedData.hero.titleOm) {
        parsedData.hero.titleOm = defaultState.hero.titleOm;
        parsedData.hero.titleAm = defaultState.hero.titleAm;
        parsedData.hero.subtitleOm = defaultState.hero.subtitleOm;
        parsedData.hero.subtitleAm = defaultState.hero.subtitleAm;
      }
      if (parsedData.restaurant && !parsedData.restaurant.nameOm) {
        parsedData.restaurant.nameOm = defaultState.restaurant.nameOm;
        parsedData.restaurant.nameAm = defaultState.restaurant.nameAm;
        parsedData.restaurant.addressOm = defaultState.restaurant.addressOm;
        parsedData.restaurant.addressAm = defaultState.restaurant.addressAm;
        parsedData.restaurant.openingHoursOm = defaultState.restaurant.openingHoursOm;
        parsedData.restaurant.openingHoursAm = defaultState.restaurant.openingHoursAm;
      }
      return parsedData;
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), "utf-8");
      return defaultState;
    }
  } catch (error) {
    console.error("Failed to load database, using defaults", error);
    return defaultState;
  }
}

function saveDatabase(state: AppState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save database state", error);
  }
}

// Initialize active in-memory state
let state: AppState = loadDatabase();

async function start() {
  app.use(express.json());
  app.use(customLogger);
  app.use(rateLimiter);

  // Authenticate Admin Passcode strictly
  const verifyAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const passcode = req.headers["x-admin-passcode"] || req.query.passcode;
    if (passcode === "taqwa") {
      return next();
    }
    console.warn(`[UNAUTHORIZED ACCESS] Attempt to update data without valid passcode from ${req.ip}`);
    return res.status(403).json({ error: "Access denied. Invalid signature passcode credentials." });
  };

  // API 1: Fetch overall state (Public)
  app.get("/api/state", (req, res) => {
    res.json(state);
  });

  // API 2: Update overall restaurant properties (Secured)
  app.post("/api/restaurant", verifyAdmin, (req, res) => {
    const freshConfig: RestaurantConfig = req.body;
    state.restaurant = { ...state.restaurant, ...freshConfig };
    saveDatabase(state);
    res.json({ message: "Restaurant configuration updated successfully", restaurant: state.restaurant });
  });

  // API 3: Update Hero Content & Images list (Secured)
  app.post("/api/hero", verifyAdmin, (req, res) => {
    const freshHero: HeroConfig = req.body;
    state.hero = { ...state.hero, ...freshHero };
    saveDatabase(state);
    res.json({ message: "Hero configuration updated successfully", hero: state.hero });
  });

  // API 4: Add a new Product (Secured)
  app.post("/api/products", verifyAdmin, (req, res) => {
    const item: Partial<Product> = req.body;
    if (!item.nameEn || !item.nameAr || !item.categoryId || isNaN(Number(item.price))) {
      return res.status(400).json({ error: "Required fields nameEn, nameAr, categoryId and numeric price are missing." });
    }
    const newProduct: Product = {
      id: "prod-" + Date.now(),
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      nameOm: item.nameOm || item.nameEn,
      nameAm: item.nameAm || item.nameEn,
      descriptionEn: item.descriptionEn || "",
      descriptionAr: item.descriptionAr || "",
      descriptionOm: item.descriptionOm || "",
      descriptionAm: item.descriptionAm || "",
      price: Number(item.price),
      categoryId: item.categoryId,
      image: item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      isAvailable: item.isAvailable !== false,
      isFeatured: !!item.isFeatured
    };

    state.products.push(newProduct);
    saveDatabase(state);
    res.json({ message: "Product created successfully", product: newProduct });
  });

  // API 5: Update a Product (Secured)
  app.put("/api/products/:id", verifyAdmin, (req, res) => {
    const id = req.params.id;
    const idx = state.products.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Product not found" });
    }
    const item: Partial<Product> = req.body;
    const original = state.products[idx];
    
    state.products[idx] = {
      ...original,
      nameEn: item.nameEn !== undefined ? item.nameEn : original.nameEn,
      nameAr: item.nameAr !== undefined ? item.nameAr : original.nameAr,
      nameOm: item.nameOm !== undefined ? item.nameOm : original.nameOm,
      nameAm: item.nameAm !== undefined ? item.nameAm : original.nameAm,
      descriptionEn: item.descriptionEn !== undefined ? item.descriptionEn : original.descriptionEn,
      descriptionAr: item.descriptionAr !== undefined ? item.descriptionAr : original.descriptionAr,
      descriptionOm: item.descriptionOm !== undefined ? item.descriptionOm : original.descriptionOm,
      descriptionAm: item.descriptionAm !== undefined ? item.descriptionAm : original.descriptionAm,
      price: item.price !== undefined ? Number(item.price) : original.price,
      categoryId: item.categoryId !== undefined ? item.categoryId : original.categoryId,
      image: item.image !== undefined ? item.image : original.image,
      isAvailable: item.isAvailable !== undefined ? !!item.isAvailable : original.isAvailable,
      isFeatured: item.isFeatured !== undefined ? !!item.isFeatured : original.isFeatured
    };

    saveDatabase(state);
    res.json({ message: "Product updated successfully", product: state.products[idx] });
  });

  // API 6: Delete a Product (Secured)
  app.delete("/api/products/:id", verifyAdmin, (req, res) => {
    const id = req.params.id;
    const initialLength = state.products.length;
    state.products = state.products.filter(p => p.id !== id);
    if (state.products.length === initialLength) {
      return res.status(404).json({ error: "Product not found" });
    }
    saveDatabase(state);
    res.json({ message: "Product deleted successfully" });
  });

  // API 7: Add a Category (Secured)
  app.post("/api/categories", verifyAdmin, (req, res) => {
    const cat: Partial<Category> = req.body;
    if (!cat.nameEn || !cat.nameAr) {
      return res.status(400).json({ error: "nameEn and nameAr are required for a category" });
    }
    const slug = cat.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newCategory: Category = {
      id: slug || "cat-" + Date.now(),
      nameEn: cat.nameEn,
      nameAr: cat.nameAr,
      nameOm: cat.nameOm || cat.nameEn,
      nameAm: cat.nameAm || cat.nameEn,
      icon: cat.icon || "Utensils"
    };

    // prevent duplicate id
    const exists = state.categories.some(c => c.id === newCategory.id);
    if (exists) {
      newCategory.id = newCategory.id + "-" + Date.now().toString().slice(-4);
    }

    state.categories.push(newCategory);
    saveDatabase(state);
    res.json({ message: "Category created successfully", category: newCategory });
  });

  // API 8: Update critical category keys (Secured)
  app.put("/api/categories/:id", verifyAdmin, (req, res) => {
    const id = req.params.id;
    const idx = state.categories.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Category not found" });
    }
    const cat: Partial<Category> = req.body;
    state.categories[idx] = {
      ...state.categories[idx],
      nameEn: cat.nameEn !== undefined ? cat.nameEn : state.categories[idx].nameEn,
      nameAr: cat.nameAr !== undefined ? cat.nameAr : state.categories[idx].nameAr,
      nameOm: cat.nameOm !== undefined ? cat.nameOm : state.categories[idx].nameOm,
      nameAm: cat.nameAm !== undefined ? cat.nameAm : state.categories[idx].nameAm,
      icon: cat.icon !== undefined ? cat.icon : state.categories[idx].icon
    };
    saveDatabase(state);
    res.json({ message: "Category updated successfully", category: state.categories[idx] });
  });

  // API 9: Delete a Category & disassociate or cascade its products (Secured)
  app.delete("/api/categories/:id", verifyAdmin, (req, res) => {
    const id = req.params.id;
    const initialLen = state.categories.length;
    state.categories = state.categories.filter(c => c.id !== id);
    if (state.categories.length === initialLen) {
      return res.status(404).json({ error: "Category not found" });
    }
    // Delete or reassign corresponding products to a dummy
    state.products = state.products.filter(p => p.categoryId !== id);
    saveDatabase(state);
    res.json({ message: "Category and corresponding products deleted successfully" });
  });

  // Integrate Vite dynamically based on local configuration scripts
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Taqwa fully dynamic Express server listening on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to bootstrap the Express digital menu backend server.", err);
});
