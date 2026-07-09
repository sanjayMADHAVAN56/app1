import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini API client to prevent crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ==========================================
// MOCK DATABASE CONFIG & INITIAL DATA
// ==========================================

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  originalPrice: number;
  price: number;
  rating: number;
  conditionGrade: "LIKE_NEW" | "EXCELLENT" | "VERY_GOOD" | "FAIR";
  stock: number;
  description: string;
  specifications: Record<string, string>;
  refurbishedDetails: string;
  imageUrl: string;
  isFeatured?: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Apple MacBook Pro 14\" (M2 Pro)",
    brand: "Apple",
    category: "Laptops",
    originalPrice: 199900,
    price: 129900,
    rating: 4.8,
    conditionGrade: "LIKE_NEW",
    stock: 5,
    description: "Certified Refurbished MacBook Pro featuring the high-performance Apple M2 Pro chip, 16GB of unified memory, and 512GB SSD. Perfect for developers, video editors, and power users seeking ultimate portability without compromising on performance.",
    specifications: {
      "Processor": "Apple M2 Pro (10-Core CPU, 16-Core GPU)",
      "RAM": "16GB Unified Memory",
      "Storage": "512GB Superfast SSD",
      "Display": "14.2-inch Liquid Retina XDR (120Hz ProMotion)",
      "Battery Health": "98% (Certified Genuine Battery)"
    },
    refurbishedDetails: "Passed our 45-point hardware diagnostic test. Includes original screen calibration, brand new original keyboard keys, and fresh thermal compound replacement. Covered under 1-Year OutletGadgets warranty.",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60",
    isFeatured: true
  },
  {
    id: 2,
    name: "Dell XPS 13 Plus 9320",
    brand: "Dell",
    category: "Laptops",
    originalPrice: 165000,
    price: 89900,
    rating: 4.5,
    conditionGrade: "EXCELLENT",
    stock: 3,
    description: "Sleek, futuristic ultra-portable laptop with capacitive touch function keys, invisible glass haptic trackpad, and stunning 4K OLED touch display. Driven by an Intel Core i7 12th Gen processor.",
    specifications: {
      "Processor": "Intel Core i7-1260P (Up to 4.7 GHz)",
      "RAM": "16GB LPDDR5 Dual Channel",
      "Storage": "1TB PCIe Gen4 NVMe SSD",
      "Display": "13.4-inch 4K OLED InfinityEdge Touch Screen",
      "Battery Health": "92% (Original High Capacity)"
    },
    refurbishedDetails: "Underwent rigorous screen diagnostic scan - zero dead pixels. Minor scuff on base plates (polished out). Fan vents thoroughly cleaned. Ships in customized shockproof eco-packaging.",
    imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=60",
    isFeatured: true
  },
  {
    id: 3,
    name: "iPhone 14 Pro Max 256GB",
    brand: "Apple",
    category: "Smartphones",
    originalPrice: 139900,
    price: 84900,
    rating: 4.9,
    conditionGrade: "LIKE_NEW",
    stock: 8,
    description: "Premium flagship iPhone in pristine cosmetic condition. Features the revolutionary Dynamic Island, 48MP high-resolution camera system, and Always-On display.",
    specifications: {
      "Chipset": "A16 Bionic Chip",
      "Storage": "256GB NVMe",
      "Camera": "Triple (48MP + 12MP + 12MP) with LIDAR Scanner",
      "Display": "6.7-inch Super Retina XDR OLED",
      "Battery Health": "100% (Brand New Certified Replacement Battery)"
    },
    refurbishedDetails: "Battery replaced with premium 100% health battery. TrueTone functionality restored and certified. Clean IMEI, unlocked for all national and international networks.",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60",
    isFeatured: true
  },
  {
    id: 4,
    name: "Samsung Galaxy S23 Ultra 256GB",
    brand: "Samsung",
    category: "Smartphones",
    originalPrice: 124999,
    price: 72900,
    rating: 4.7,
    conditionGrade: "EXCELLENT",
    stock: 6,
    description: "Ultimate Android powerhouse featuring a 200MP sensor, integrated S-Pen, and Snapdragon 8 Gen 2 for Galaxy chip. Minor scratch on the rear camera bezel, barely visible.",
    specifications: {
      "Processor": "Snapdragon 8 Gen 2 for Galaxy (4nm)",
      "RAM": "12GB RAM",
      "Storage": "256GB UFS 4.0",
      "Display": "6.8-inch Dynamic AMOLED 2X (120Hz)",
      "Battery Health": "94% (Original Battery)"
    },
    refurbishedDetails: "Display assembly is 100% pristine. Stylus connector and pressure sensors thoroughly tested. Motherboard micro-soldered & cleaned of dust.",
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=60",
    isFeatured: true
  },
  {
    id: 5,
    name: "iPad Pro 12.9\" (M2, Wi-Fi)",
    brand: "Apple",
    category: "Tablets",
    originalPrice: 112900,
    price: 82900,
    rating: 4.8,
    conditionGrade: "LIKE_NEW",
    stock: 4,
    description: "Professional drawing and productivity slate running on the ultra-powerful Apple M2 chip. Supports 2nd Generation Apple Pencil and Hover features.",
    specifications: {
      "Processor": "Apple M2 (8-Core CPU, 10-Core GPU)",
      "RAM": "8GB RAM",
      "Storage": "128GB High Speed Storage",
      "Display": "12.9-inch Liquid Retina XDR with Mini-LED",
      "Battery Health": "96% (Original)"
    },
    refurbishedDetails: "Screen and backlight assembly fully inspected. No mini-LED degradation. Includes premium matte glass screen guard pre-applied.",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=60",
    isFeatured: false
  },
  {
    id: 6,
    name: "Lenovo ThinkPad X1 Carbon Gen 10",
    brand: "Lenovo",
    category: "Laptops",
    originalPrice: 180000,
    price: 74900,
    rating: 4.6,
    conditionGrade: "VERY_GOOD",
    stock: 7,
    description: "The gold standard of enterprise laptops. Built from carbon fiber with legendary tactile keyboard, outstanding security features, and all-day battery performance.",
    specifications: {
      "Processor": "Intel Core i7-1260U (vPro)",
      "RAM": "16GB Soldered LPDDR5",
      "Storage": "512GB NVMe SSD OPAL2",
      "Display": "14-inch WUXGA Anti-Glare Display",
      "Battery Health": "89% (Original ThinkPad Cell)"
    },
    refurbishedDetails: "Tested for military-grade durability compliance (MIL-SPEC). Keyboard tested at 100% keycap response. Surface carbon texture fully deep-cleaned.",
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 7,
    name: "Apple Watch Series 8 GPS 45mm",
    brand: "Apple",
    category: "Smart Wearables",
    originalPrice: 45900,
    price: 26900,
    rating: 4.6,
    conditionGrade: "EXCELLENT",
    stock: 12,
    description: "Premium health and fitness tracker with advanced temperature sensing, sleep stage monitoring, crash detection, and ECG reading.",
    specifications: {
      "Case": "45mm Midnight Aluminum Case",
      "Sensors": "ECG, Blood Oxygen, Temp Sensor, Gyroscope",
      "Connectivity": "GPS, Bluetooth 5.3",
      "Battery Health": "91% (Original)"
    },
    refurbishedDetails: "Heart rate sensor array fully recalibrated. Aluminum chassis polished. Disinfected in medical-grade UV sterilization chamber. Ships with certified new sport band.",
    imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 8,
    name: "Sony WH-1000XM5 ANC Headphones",
    brand: "Sony",
    category: "Audio & Accessories",
    originalPrice: 34990,
    price: 21900,
    rating: 4.8,
    conditionGrade: "LIKE_NEW",
    stock: 10,
    description: "Industry-leading active noise cancelling overhead headphones with incredible smart listening features, pristine sound, and 30-hour battery life.",
    specifications: {
      "Drivers": "30mm High Quality Neodymium Dome",
      "ANC": "Dual Processor Custom HD Noise Cancelling QN1",
      "Battery Life": "Up to 30 Hours (ANC On)",
      "Condition": "Like New, Original carrying case included"
    },
    refurbishedDetails: "Passed audio sweep analysis. Multi-microphone beamforming tested. Ear cushions fully replaced with brand new OEM memory foam cups. Sanitized.",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60",
    isFeatured: true
  },
  {
    id: 9,
    name: "Apple AirPods Pro (2nd Generation)",
    brand: "Apple",
    category: "Audio & Accessories",
    originalPrice: 26900,
    price: 15900,
    rating: 4.7,
    conditionGrade: "LIKE_NEW",
    stock: 15,
    description: "Premium true wireless earbuds with active noise cancellation, adaptive transparency, and localized spatial audio tracking.",
    specifications: {
      "Processor": "Apple H2 Headphone Chip",
      "ANC": "Up to 2x more Active Noise Cancelling",
      "Case": "MagSafe charging case with speaker and lanyard loop"
    },
    refurbishedDetails: "Sterilized thoroughly. Left and right dynamic balanced drivers tested. Dynamic spatial audio tracking tested and certified. Brand new ear tips (S,M,L) included in box.",
    imageUrl: "https://images.unsplash.com/photo-1588449668338-d15168822481?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 10,
    name: "Keychron K2 Wireless Keyboard",
    brand: "Keychron",
    category: "Audio & Accessories",
    originalPrice: 9999,
    price: 5490,
    rating: 4.4,
    conditionGrade: "EXCELLENT",
    stock: 9,
    description: "75% compact tactile wireless mechanical keyboard featuring hot-swappable tactile brown switches and full customizable RGB backlighting.",
    specifications: {
      "Layout": "75% Compact (84 keys)",
      "Switches": "Gateron Brown Tactile Switches",
      "Battery": "4000mAh High Capacity Rechargeable"
    },
    refurbishedDetails: "Keycaps removed and ultrasonic-cleaned. PCB boards checked for solder corrosion. Stabilizers lubed for noise reduction. Fully tested wired and wireless modes.",
    imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=60"
  }
];

// Active mock databases in server memory
let USERS = [
  {
    id: 1,
    username: "intern",
    email: "sanjaymadhavan56@gmail.com",
    fullName: "Sanjay Madhavan",
    passwordHash: "secure_pass", // mock check
    role: "ADMIN",
    phone: "+91 98765 43210"
  }
];

let CART: { productId: number; quantity: number }[] = [];
let WISHLIST: number[] = [];
let ORDERS: any[] = [
  {
    id: "ORD-98472",
    date: "2026-06-25T14:32:00Z",
    total: 129900,
    status: "DELIVERED",
    paymentMethod: "UPI",
    items: [
      {
        id: 1,
        name: "Apple MacBook Pro 14\" (M2 Pro)",
        price: 129900,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60"
      }
    ],
    tracking: [
      { status: "Order Placed", date: "2026-06-25 14:32", done: true },
      { status: "Packed & Certified", date: "2026-06-25 18:00", done: true },
      { status: "Shipped", date: "2026-06-26 09:15", done: true },
      { status: "Out for Delivery", date: "2026-06-28 10:45", done: true },
      { status: "Delivered", date: "2026-06-28 12:30", done: true }
    ]
  }
];

let NOTIFICATIONS = [
  {
    id: 1,
    title: "Welcome to Outlet Gadgets!",
    message: "Thank you for checking out our internship prototype! Explore certified refurbished, open box, and clearance gadgets.",
    isRead: false,
    date: "2026-07-01T09:00:00.000Z"
  },
  {
    id: 2,
    title: "AI Recommendations Enabled",
    message: "Our integrated Gemini AI recommendation model has analyzed your profile and selected premium outlet deals.",
    isRead: false,
    date: "2026-07-02T10:15:00.000Z"
  }
];

let REVIEWS: any[] = [
  {
    id: 1,
    productId: 1,
    author: "Rohan S.",
    rating: 5,
    comment: "Absolutely amazing! Looks 100% brand new, and battery cycles were only 3! Best decision for my coding classes.",
    date: "2026-06-20"
  },
  {
    id: 2,
    productId: 3,
    author: "Sneha G.",
    rating: 5,
    comment: "TrueTone works, faceID is flawless, battery is 100%. Highly satisfied with the Outlet Gadget grade check.",
    date: "2026-06-28"
  }
];

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Auth REST APIs
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email);
  if (user) {
    res.json({
      success: true,
      message: "Login successful (Simulated JWT)",
      data: {
        token: "simulated-jwt-token-outlet-gadgets",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone
        }
      }
    });
  } else {
    // Auto-register to make the app friction-free for testing
    const newUser = {
      id: USERS.length + 1,
      username: email.split("@")[0],
      email: email,
      fullName: "Guest User",
      passwordHash: "secure_pass",
      role: "USER",
      phone: ""
    };
    USERS.push(newUser);
    res.json({
      success: true,
      message: "User registered & logged in automatically",
      data: {
        token: "simulated-jwt-token-outlet-gadgets",
        user: newUser
      }
    });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { email, username, fullName, password, phone } = req.body;
  if (USERS.some(u => u.email === email)) {
    return res.status(400).json({ success: false, message: "Email already registered" });
  }
  const newUser = {
    id: USERS.length + 1,
    username: username || email.split("@")[0],
    email: email,
    fullName: fullName || "New User",
    passwordHash: "secure",
    role: "USER",
    phone: phone || ""
  };
  USERS.push(newUser);
  res.json({
    success: true,
    message: "Registration successful!",
    data: {
      token: "simulated-jwt-token-new",
      user: newUser
    }
  });
});

app.post("/api/auth/forgot-password", (req, res) => {
  res.json({ success: true, message: "Simulated OTP reset code sent to email" });
});

app.post("/api/auth/verify-otp", (req, res) => {
  res.json({ success: true, message: "OTP code successfully verified!" });
});

// 2. Product Query REST APIs
app.get("/api/products", (req, res) => {
  let list = [...PRODUCTS];
  const { category, brand, condition, search } = req.query;

  if (category) {
    list = list.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }
  if (brand) {
    list = list.filter(p => p.brand.toLowerCase() === (brand as string).toLowerCase());
  }
  if (condition) {
    list = list.filter(p => p.conditionGrade.toLowerCase() === (condition as string).toLowerCase());
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }

  res.json({ success: true, data: list });
});

app.get("/api/products/categories", (req, res) => {
  const categories = Array.from(new Set(PRODUCTS.map(p => p.category)));
  res.json({ success: true, data: categories });
});

app.get("/api/products/:id", (req, res) => {
  const product = PRODUCTS.find(p => p.id === parseInt(req.params.id));
  if (product) {
    res.json({ success: true, data: product });
  } else {
    res.status(404).json({ success: false, message: "Product not found" });
  }
});

// 3. Cart REST APIs
app.get("/api/cart", (req, res) => {
  const cartItems = CART.map(item => {
    const product = PRODUCTS.find(p => p.id === item.productId);
    return {
      product,
      quantity: item.quantity
    };
  }).filter(item => item.product !== undefined);
  res.json({ success: true, data: cartItems });
});

app.post("/api/cart", (req, res) => {
  const { productId, quantity } = req.body;
  const existing = CART.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity || 1;
  } else {
    CART.push({ productId, quantity: quantity || 1 });
  }
  res.json({ success: true, message: "Item added to cart", data: CART });
});

app.delete("/api/cart/:productId", (req, res) => {
  CART = CART.filter(item => item.productId !== parseInt(req.params.productId));
  res.json({ success: true, message: "Item removed from cart" });
});

app.put("/api/cart/:productId", (req, res) => {
  const { quantity } = req.body;
  const existing = CART.find(item => item.productId === parseInt(req.params.productId));
  if (existing) {
    existing.quantity = quantity;
  }
  res.json({ success: true, message: "Cart updated" });
});

// 4. Wishlist REST APIs
app.get("/api/wishlist", (req, res) => {
  const items = WISHLIST.map(id => PRODUCTS.find(p => p.id === id)).filter(p => p !== undefined);
  res.json({ success: true, data: items });
});

app.post("/api/wishlist", (req, res) => {
  const { productId } = req.body;
  if (!WISHLIST.includes(productId)) {
    WISHLIST.push(productId);
  }
  res.json({ success: true, message: "Product added to wishlist", data: WISHLIST });
});

app.delete("/api/wishlist/:productId", (req, res) => {
  WISHLIST = WISHLIST.filter(id => id !== parseInt(req.params.productId));
  res.json({ success: true, message: "Product removed from wishlist" });
});

// 5. Orders REST APIs
app.get("/api/orders", (req, res) => {
  res.json({ success: true, data: ORDERS });
});

app.post("/api/orders", (req, res) => {
  const { items, total, paymentMethod, address } = req.body;
  const orderNumber = "ORD-" + Math.floor(10000 + Math.random() * 90000);
  const newOrder = {
    id: orderNumber,
    date: new Date().toISOString(),
    total: total,
    status: "CONFIRMED",
    paymentMethod: paymentMethod || "UPI",
    address: address || "Sanjay Madhavan, Chennai, Tamil Nadu, 600001",
    items: items,
    tracking: [
      { status: "Order Placed", date: new Date().toISOString().substring(0, 16).replace("T", " "), done: true },
      { status: "Packed & Certified", date: "Pending", done: false },
      { status: "Shipped", date: "Pending", done: false },
      { status: "Out for Delivery", date: "Pending", done: false },
      { status: "Delivered", date: "Pending", done: false }
    ]
  };
  ORDERS.unshift(newOrder);

  // Auto add order notification
  NOTIFICATIONS.unshift({
    id: NOTIFICATIONS.length + 1,
    title: `Order Placed: ${orderNumber}`,
    message: `Your refurbished gadget order of Rs. ${total.toLocaleString()} is confirmed. Our engineering team is currently packaging it and compiling the 45-point diagnostics certificate.`,
    isRead: false,
    date: new Date().toISOString()
  });

  // Clear cart
  CART = [];

  res.json({ success: true, message: "Order placed successfully!", data: newOrder });
});

// 6. Review REST APIs
app.get("/api/reviews/:productId", (req, res) => {
  const list = REVIEWS.filter(r => r.productId === parseInt(req.params.productId));
  res.json({ success: true, data: list });
});

app.post("/api/reviews", (req, res) => {
  const { productId, rating, comment, author } = req.body;
  const newReview = {
    id: REVIEWS.length + 1,
    productId: parseInt(productId),
    author: author || "Sanjay Madhavan",
    rating: parseInt(rating),
    comment,
    date: new Date().toISOString().substring(0, 10)
  };
  REVIEWS.unshift(newReview);

  // Recalculate average rating of products
  const product = PRODUCTS.find(p => p.id === parseInt(productId));
  if (product) {
    const productReviews = REVIEWS.filter(r => r.productId === product.id);
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    product.rating = parseFloat((sum / productReviews.length).toFixed(1));
  }

  res.json({ success: true, message: "Review posted successfully!", data: newReview });
});

// 7. Notifications REST APIs
app.get("/api/notifications", (req, res) => {
  res.json({ success: true, data: NOTIFICATIONS });
});

app.post("/api/notifications/read", (req, res) => {
  NOTIFICATIONS.forEach(n => (n.isRead = true));
  res.json({ success: true, message: "All notifications marked as read" });
});

// ==========================================
// GEMINI AI INTEGRATION ROUTES
// ==========================================

// Helper: safe JSON parsing
function cleanJSONString(raw: string): string {
  // strip potential markdown codeblock tags from gemini response
  return raw.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
}

// 1. GET /api/recommendations - Smart refurbished gadget recommendations
app.post("/api/recommendations", async (req, res) => {
  const { productId, currentCartIds } = req.body;
  const ai = getAI();

  if (!ai) {
    // Fallback static recommendations if no API Key provided
    const matchCategory = PRODUCTS.find(p => p.id === productId)?.category || "Laptops";
    const recs = PRODUCTS.filter(p => p.id !== productId && p.category === matchCategory).slice(0, 3);
    return res.json({
      success: true,
      aiPowered: false,
      message: "No Gemini Key detected. Displaying category fallbacks.",
      data: recs
    });
  }

  try {
    const targetProduct = PRODUCTS.find(p => p.id === productId);
    if (!targetProduct) return res.status(404).json({ success: false, message: "Product not found" });

    const systemPrompt = `You are the core Product Recommendation Engine of 'Outlet Gadgets' - an e-commerce platform specializing in refurbished, open box, and clearance items.
Your job is to read a user's active item, and match it with exactly 3 products from our actual database.

Available catalog:
${JSON.stringify(PRODUCTS.map(p => ({ id: p.id, name: p.name, brand: p.brand, category: p.category, price: p.price, conditionGrade: p.conditionGrade })))}

Rules:
1. You must select products from the provided catalog.
2. Recommend exactly 3 items that would appeal as alternatives or accessories (e.g. if looking at MacBook, recommend Sony WH-1000XM5 headphones or Keychron keyboard as companion accessories, or Dell XPS as direct alternative).
3. Provide a response strictly in the JSON format:
{
  "recommendations": [
    { "id": <product_id>, "reason": "<precise professional 1-sentence reason why this goes well or is an alternative to the target item>" }
  ]
}
Do not return any extra markdown styling, just the raw JSON string.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Recommend 3 items for the product: "${targetProduct.name}" (${targetProduct.category}) priced at Rs. ${targetProduct.price}.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(cleanJSONString(text));

    const matchedRecs = parsed.recommendations.map((rec: any) => {
      const prod = PRODUCTS.find(p => p.id === rec.id);
      if (prod) {
        return { ...prod, aiRecommendationReason: rec.reason };
      }
      return null;
    }).filter(Boolean);

    res.json({
      success: true,
      aiPowered: true,
      data: matchedRecs.length > 0 ? matchedRecs : PRODUCTS.slice(0, 3)
    });
  } catch (error: any) {
    console.error("Gemini recommendation error:", error);
    res.json({
      success: true,
      aiPowered: false,
      message: "Gemini server timed out. Using robust static fallbacks.",
      data: PRODUCTS.slice(0, 3)
    });
  }
});

// 2. GET /api/search - Semantic AI Search
app.get("/api/search", async (req, res) => {
  const query = req.query.q as string;
  const ai = getAI();

  if (!query) return res.json({ success: true, data: PRODUCTS });

  if (!ai) {
    // Normal fuzzy query match fallback
    const filtered = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
    );
    return res.json({ success: true, aiPowered: false, data: filtered });
  }

  try {
    const systemPrompt = `You are the smart search parser for 'Outlet Gadgets' e-commerce store.
The user will input an unstructured query (e.g. "I want a cheap apple laptop", "find a high end phone with good camera", "keyboards").
Your task is to analyze the user intent and filter/rank products from our catalog.

Available catalog:
${JSON.stringify(PRODUCTS.map(p => ({ id: p.id, name: p.name, brand: p.brand, category: p.category, price: p.price, conditionGrade: p.conditionGrade, desc: p.description })))}

Return a JSON array of parsed product IDs, ordered by matching relevance, together with an intent analysis summary.
Strict JSON schema:
{
  "matchedIds": [<id1>, <id2>],
  "reasoning": "<1-sentence summary of what intent you parsed (e.g., 'Looking for premium refurbished iOS devices')>"
}
If no matches, return matchedIds as empty array. Return only the JSON content.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Search query: "${query}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(cleanJSONString(response.text || "{}"));
    const matchedProds = (parsed.matchedIds || [])
      .map((id: number) => PRODUCTS.find(p => p.id === id))
      .filter(Boolean);

    res.json({
      success: true,
      aiPowered: true,
      reasoning: parsed.reasoning,
      data: matchedProds.length > 0 ? matchedProds : PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    });
  } catch (err) {
    console.error("AI Search Error:", err);
    // fallback
    const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    res.json({ success: true, aiPowered: false, data: filtered });
  }
});

// 3. POST /api/chat - AI Customer Assistant chatbot
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  const ai = getAI();

  if (!ai) {
    // fallback bot response
    return res.json({
      success: true,
      aiPowered: false,
      reply: `Hi there! I am the Outlet Gadgets Support Assistant. [MOCK MODE] Since the Gemini API key is currently not active in the Secrets tab, I'm running in simulation mode. 

To help you with our refurbished inventory:
1. **Refurbished grades**: We offer 'Like New' (perfect cosmetic condition, 100% battery), 'Excellent' (extremely light wear, 90%+ battery), and 'Very Good' (minor cosmetic marks).
2. **Warranty**: Every device comes with a free 1-Year OutletGadgets warranty and a 45-point diagnostic certificate.
3. **Featured products**: Right now, the Apple MacBook Pro 14" (M2 Pro) at Rs. 1,29,900 and iPhone 14 Pro Max at Rs. 84,900 are our top clearance deals!

How else can I assist you with your purchase?`
    });
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `You are 'OG-Assistant', the premier AI Sales and Support specialist at Outlet Gadgets.
We sell Certified Refurbished, Open Box, and Clearance electronics (laptops, smartphones, audio devices, smart wearables).

Product catalog for your reference:
${JSON.stringify(PRODUCTS.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category, condition: p.conditionGrade, warranty: "1-year warranty" })))}

Your tone is: professional, enthusiastic, helpful, and concise.

Key details about Outlet Gadgets to mention:
1. **45-Point diagnostics checks**: Every single device goes through strict micro-diagnostics, thermal pastes replacements, sensor scans, and battery quality assurances.
2. **Warranty**: All purchases are backed by an instant 1-Year warranty, with an easy 15-day return window.
3. **Refurb grades**: Explain our grade structures ('Like New', 'Excellent', 'Very Good') which save up to 45% compared to retail prices.
4. If a user asks for buying recommendations, match them with our actual products from the catalog and explain why it's a great deal for them. Keep replies within 3 paragraphs.`
      }
    });

    // Reconstruct history if any (in format accepted by SDK)
    // Send message
    const response = await chat.sendMessage({ message: message });
    res.json({
      success: true,
      aiPowered: true,
      reply: response.text
    });
  } catch (error: any) {
    console.error("AI chatbot error:", error);
    res.json({
      success: true,
      aiPowered: false,
      reply: "Hi! I experienced a connection issue with our AI center. Rest assured, our products come with a 45-point certified check, 1-year warranty, and free delivery across India. Ask me about our refurbished iPhones or MacBook Pros!"
    });
  }
});

// 4. GET /api/admin/analytics - AI Business Intelligence Dashboard
app.get("/api/admin/analytics", async (req, res) => {
  const ai = getAI();

  const salesActivity = {
    totalSales: ORDERS.reduce((sum, o) => sum + o.total, 0) + 245000,
    ordersCount: ORDERS.length + 14,
    averageOrderValue: 42100,
    topCategories: [
      { name: "Laptops", percentage: 55, revenue: 198000 },
      { name: "Smartphones", percentage: 30, revenue: 108000 },
      { name: "Audio", percentage: 15, revenue: 47000 }
    ],
    userRegistrations: USERS.length + 156
  };

  if (!ai) {
    return res.json({
      success: true,
      aiPowered: false,
      analytics: salesActivity,
      suggestions: [
        "Inventory is low on refurbished Laptops. Consider restocking high-demand Intel i7 systems.",
        "Refurbished Apple devices represent 64% of gross merchandise volume. Creating an 'Apple Certified Deal' banner is recommended.",
        "Offer a dynamic combo with Sony WH-1000XM5 headphones and MacBooks to boost average order values."
      ]
    });
  }

  try {
    const prompt = `Review this store sales telemetry:
${JSON.stringify(salesActivity)}
Analyze these metrics and write exactly 3 high-impact business insights / suggestions for our marketing and stock operations. Keep each suggestion to 1-2 powerful sentences. Return them strictly as a JSON array of strings:
[
  "<suggestion_1>",
  "<suggestion_2>",
  "<suggestion_3>"
]
Return only the raw JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(cleanJSONString(response.text || "[]"));
    res.json({
      success: true,
      aiPowered: true,
      analytics: salesActivity,
      suggestions: parsed
    });
  } catch (err) {
    res.json({
      success: true,
      aiPowered: false,
      analytics: salesActivity,
      suggestions: [
        "Laptops are our main revenue driver. Secure more clearance laptop lots from corporate liquidations.",
        "Average order value is Rs. 42,100. Promote accessory bundles on checkout to increase cart margins.",
        "Add localized payment modes (UPI / Instant NetBanking) for seamless checkout check-ins."
      ]
    });
  }
});

// 5. GET /api/developer/code/:file - Serving Java source files
app.get("/api/developer/code/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), "src", "java_code", filename);

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ success: true, content });
  } else {
    res.status(404).json({ success: false, message: `Java file ${filename} not found in repository structure.` });
  }
});

app.get("/api/developer/files", (req, res) => {
  const dirPath = path.join(process.cwd(), "src", "java_code");
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    res.json({ success: true, files });
  } else {
    res.json({ success: true, files: [] });
  }
});

// 6. POST /api/developer/convert - TSX/TS to Spring Boot Java & HTML Webpage Converter
app.post("/api/developer/convert", async (req, res) => {
  const { code, targetType } = req.body;
  const ai = getAI();

  if (!code) {
    return res.status(400).json({ success: false, message: "No source code content was provided." });
  }

  if (!ai) {
    // Simulated high-fidelity output for the UI if API key is not present
    if (targetType === "HTML") {
      return res.json({
        success: true,
        aiPowered: false,
        message: "No Gemini Key detected. Running in structural simulation mode.",
        javaCode: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refurbished Products Showcase</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Inter Google Font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30">
    <div class="max-w-2xl w-full bg-slate-900 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-5">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h1 class="text-lg sm:text-xl font-bold text-white tracking-tight">Refurbished Device Showcase</h1>
                </div>
                <p class="text-xs text-slate-400">Translated from React Component TSX input</p>
            </div>
            <span class="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono px-2.5 py-1 rounded-md">
                HTML5 + Tailwind
            </span>
        </div>

        <!-- Filter bar -->
        <div class="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div class="flex items-center gap-2.5">
                <span class="text-xs text-slate-400">Filter Grade:</span>
                <select id="gradeFilter" class="bg-slate-900 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-200">
                    <option value="ALL">All Grades</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="EXCELLENT">Excellent</option>
                </select>
            </div>
            <p class="text-[10px] font-mono text-slate-500">45-Point Certified Inspection</p>
        </div>

        <!-- Grid -->
        <div id="productGrid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Item 1 -->
            <div class="product-item bg-slate-950/40 p-4.5 rounded-xl border border-slate-800/80 hover:border-indigo-500/30 transition-all space-y-3" data-grade="LIKE_NEW">
                <div class="flex justify-between items-start">
                    <h3 class="text-sm font-semibold text-slate-200">Apple MacBook Pro M2</h3>
                    <span class="text-[9px] font-mono px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-md">LIKE NEW</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">Certified diagnostic checkout complete. Includes 1-year OutletGadgets warranty.</p>
                <div class="flex items-center justify-between pt-1">
                    <span class="text-indigo-400 font-mono text-xs font-bold">$1,299.00</span>
                    <button class="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-950/50">
                        View Details
                    </button>
                </div>
            </div>

            <!-- Item 2 -->
            <div class="product-item bg-slate-950/40 p-4.5 rounded-xl border border-slate-800/80 hover:border-indigo-500/30 transition-all space-y-3" data-grade="EXCELLENT">
                <div class="flex justify-between items-start">
                    <h3 class="text-sm font-semibold text-slate-200">Dell XPS 13 OLED</h3>
                    <span class="text-[9px] font-mono px-2 py-0.5 bg-indigo-500/15 text-indigo-400 rounded-md">EXCELLENT</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed">Capacitive touch, invisible haptic glass trackpad, 4K screen, polished finish.</p>
                <div class="flex items-center justify-between pt-1">
                    <span class="text-indigo-400 font-mono text-xs font-bold">$899.00</span>
                    <button class="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-950/50">
                        View Details
                    </button>
                </div>
            </div>
        </div>

        <!-- Footer Notice -->
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-slate-500 text-[11px] leading-relaxed">
            This is a fully self-contained HTML page generated from a TSX layout template.
            <br/>To enable dynamic AI generation on any customized pasted TSX code, add your Gemini API Key in the settings menu.
        </div>
    </div>

    <!-- Interactive script mapping the React State to Vanilla JS -->
    <script>
        document.getElementById('gradeFilter').addEventListener('change', function(e) {
            const selected = e.target.value;
            const items = document.querySelectorAll('.product-item');
            items.forEach(item => {
                if (selected === 'ALL' || item.getAttribute('data-grade') === selected) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>`
      });
    }

    const className = targetType === "Entity" ? "ProductEntity" : targetType === "Controller" ? "ProductController" : "ProductService";
    return res.json({
      success: true,
      aiPowered: false,
      message: "No Gemini Key detected. Running in structural simulation mode.",
      javaCode: `package com.outletgadget;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;

/**
 * [SIMULATED CLASS REPRESENTATION - ADD GEMINI SECRET KEY FOR REAL AI CODE GENERATION]
 *
 * This simulated Java class represents a translation of your ${code.length}-character TypeScript/TSX input.
 * In a fully licensed environment, the integrated Gemini model translates variables, logic, hooks,
 * and API structures into equivalent annotations, controllers, repositories, or entities.
 */
${targetType === "Entity" ? `
@Entity
@Table(name = "refurbished_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ${className} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Double price;

    @Column(name = "condition_grade")
    private String conditionGrade; // e.g. LIKE_NEW, EXCELLENT

    @Column(columnDefinition = "TEXT")
    private String description;
}` : targetType === "Controller" ? `
@RestController
@RequestMapping("/api/refurbished")
@CrossOrigin(origins = "*")
public class ${className} {

    // Auto-translated mappings for your components
    @GetMapping("/items")
    public ResponseEntity<List<String>> listTranslatedItems() {
        return ResponseEntity.ok(List.of("MacBook Pro M2 Refurbished", "iPhone 14 Pro Max"));
    }

    @PostMapping("/submit")
    public ResponseEntity<String> handleAction(@RequestBody String payload) {
        return ResponseEntity.ok("Successfully received payload under action handler.");
    }
}` : `
@Service
@RequiredArgsConstructor
public class ${className} {

    // Auto-generated business logic simulation
    public boolean processRefurbishedChecks(Long id) {
        // Runs 45-point diagnostics
        return true;
    }
}`}
`
    });
  }

  try {
    let systemPrompt = "";
    if (targetType === "HTML") {
      systemPrompt = `You are an Expert Senior Frontend Engineer, HTML5 Master, and UI/UX Designer.
Your job is to read user-submitted TypeScript or React (.tsx) frontend code, and generate a single, highly polished, fully responsive, self-contained standalone HTML5 (.html) page.

Guidelines:
1. Include Tailwind CSS CDN via <script src="https://cdn.tailwindcss.com"></script>.
2. Style the page to look premium, matching professional dark/light modes, with beautiful typography (use Google Fonts like 'Inter', imported inside <head>), elegant padding, modern cards, and responsive bento-like grid structures.
3. Translate React state hooks (useState, useEffect, event handlers) into elegant, high-quality, fully functional Vanilla JavaScript or lightweight Alpine.js CDN so that interactive UI features (tabs, filters, forms, dialogs) actually function in the browser!
4. Avoid loading external component dependencies that can't be resolved. Replace them with beautiful, semantic HTML equivalents styled with Tailwind.
5. Return ONLY the raw HTML code starting with <!DOCTYPE html>. Do NOT wrap the output in markdown code blocks or return any prose or intro/outro text.`;
    } else {
      systemPrompt = `You are a Senior Full Stack Software Architect, Java Spring Boot Developer, and Expert AI Systems Translator.
Your job is to read user-submitted TypeScript or React (.tsx) frontend code, and generate the equivalent, high-quality enterprise Java (Spring Boot) source file.

Depending on the requested 'targetType', compile the code as:
- 'Entity': A JPA Entity with appropriate annotations (@Entity, @Table, Lombok @Data, @Id, etc.) and relationships.
- 'Controller': A Spring Boot RestController with standard REST mapping annotations (@RestController, @RequestMapping, @GetMapping, @PostMapping, etc.) and proper Dependency Injection.
- 'Service': A Spring Boot Service class with standard Spring annotations (@Service, business logic, transactions, etc.).
- 'DTO': A Data Transfer Object or API Response wrapper class.
- 'Any': The most logical Spring Boot representation.

Rules:
1. Return ONLY the raw Java code inside a valid package (e.g., com.outletgadget.generated).
2. Do NOT wrap the output in markdown code blocks or return any prose or intro/outro text. Just the pure Java code.
3. Keep it professional, using industry best practices like lombok annotations, Jakarta persistence, clear naming conventions, and proper comments.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: targetType === "HTML" 
        ? `Translate the following React TSX/TypeScript code to a single, complete, fully responsive, and interactive standalone HTML webpage:\n\n${code}`
        : `Translate the following TypeScript/TSX code to a Spring Boot Java class of type "${targetType}":\n\n${code}`,
      config: {
        systemInstruction: systemPrompt
      }
    });

    let javaCode = response.text || "";
    // Clean markdown code blocks if the model returned them
    javaCode = javaCode.replace(/```(java|json|ts|tsx|html)?\n?/gi, "").replace(/```\n?/g, "").trim();

    res.json({
      success: true,
      aiPowered: true,
      javaCode
    });
  } catch (err: any) {
    console.error("TSX translation error:", err);
    res.status(500).json({ success: false, message: "Translation failed: " + err.message });
  }
});

// Serve the compiled, standalone, integrated single-file HTML directly
app.get("/standalone.html", (req, res) => {
  res.sendFile(path.join(process.cwd(), "standalone.html"));
});

// ==========================================
// VITE AND ASSETS ROUTING
// ==========================================

async function startServer() {
  // Vite dev mode integration
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
    console.log(`Outlet Gadgets Server booted successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
