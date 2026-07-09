import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, Heart, User, Bell, Search, Bot, Sparkles, RefreshCw, Cpu, 
  Database, Star, ArrowLeft, CheckCircle2, Trash2, Plus, Minus, ChevronRight, 
  ShieldCheck, Truck, ArrowRight, Lock, Mail, Phone, MapPin, CreditCard, HelpCircle
} from "lucide-react";
import { Product, CartItem, Order, Notification, Review } from "./types";
import Navbar from "./components/Navbar";
import ChatAssistant from "./components/ChatAssistant";
import AdminAnalytics from "./components/AdminAnalytics";
import DeveloperHub from "./components/DeveloperHub";

export default function App() {
  // Navigation & View Tabs
  const [activeTab, setActiveTab] = useState<string>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Authentication Overlay States
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "otp">("login");
  const [user, setUser] = useState<any>(null);
  const [authForm, setAuthForm] = useState({
    email: "sanjaymadhavan56@gmail.com",
    username: "",
    fullName: "Sanjay Madhavan",
    password: "",
    phone: "+91 98765 43210",
    otp: ""
  });

  // Storefront catalog data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchFeedback, setSearchFeedback] = useState<string>("");
  const [isSearchAi, setIsSearchAi] = useState<boolean>(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Cart & Wishlist & Coupons
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [couponCode, setCouponCode] = useState<string>("");
  const [activeCoupon, setActiveCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string>("");
  
  // Checkout & Shipping
  const [checkoutAddress, setCheckoutAddress] = useState({
    street: "12, College Road, Nungambakkam",
    city: "Chennai",
    state: "Tamil Nadu",
    zip: "600006",
    country: "India"
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [upiId, setUpiId] = useState<string>("sanjay@okaxis");
  const [cardNumber, setCardNumber] = useState<string>("4321 8899 4433 1111");

  // Orders and Tracking Timeline
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);

  // Notifications alerts
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Product reviews
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });

  // Floating Chat Assistant Widget
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Active product recommendations (via Gemini)
  const [aiRecommendations, setAiRecommendations] = useState<Product[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);
  const [recsAiPowered, setRecsAiPowered] = useState<boolean>(false);

  // ==========================================
  // INITIALIZATIONS & API LOADING FLOWS
  // ==========================================

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      let url = "/api/products";
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedCondition) params.append("condition", selectedCondition);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/products/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      if (data.success) {
        setCart(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist");
      const data = await res.json();
      if (data.success) {
        setWishlist(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchFeedback("");
      loadProducts();
      return;
    }
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setIsSearchAi(data.aiPowered);
        setSearchFeedback(data.reasoning || "Fuzzy catalog match");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, selectedCondition]);

  useEffect(() => {
    loadCategories();
    loadCart();
    loadWishlist();
    loadOrders();
    loadNotifications();

    // Auto log in simulated user on initial load for demo convenience
    handleMockLogin();
  }, []);

  // ==========================================
  // PRODUCT DETAIL & AI RECS FLOWS
  // ==========================================

  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product);
    setActiveTab("product-detail");
    setNewReview({ rating: 5, comment: "" });
    setAiRecommendations([]);
    setIsLoadingRecs(true);
    
    // Load reviews
    try {
      const revRes = await fetch(`/api/reviews/${product.id}`);
      const revData = await revRes.json();
      if (revData.success) {
        setProductReviews(revData.data);
      }
    } catch (e) {
      console.error(e);
    }

    // Load AI product recommendations
    try {
      const recRes = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id })
      });
      const recData = await recRes.json();
      if (recData.success) {
        setAiRecommendations(recData.data);
        setRecsAiPowered(recData.aiPowered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  // ==========================================
  // TRANSACTION / ACTION handlers
  // ==========================================

  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity })
      });
      const data = await res.json();
      if (data.success) {
        loadCart();
        // Notification bubble
        triggerLocalNotification(
          "Cart Updated",
          "Excellent choice! Product added successfully to your shopping bag."
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCartQty = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    try {
      const res = await fetch(`/api/cart/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity })
      });
      const data = await res.json();
      if (data.success) {
        loadCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    try {
      const res = await fetch(`/api/cart/${productId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        loadCart();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWishlist = async (product: Product) => {
    const isWished = wishlist.some(w => w.id === product.id);
    try {
      if (isWished) {
        await fetch(`/api/wishlist/${product.id}`, { method: "DELETE" });
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id })
        });
      }
      loadWishlist();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyCoupon = () => {
    setCouponError("");
    if (couponCode.toUpperCase() === "REFURB20") {
      setActiveCoupon({
        code: "REFURB20",
        discountPercentage: 20,
        maxDiscount: 5000
      });
    } else {
      setCouponError("Invalid or expired coupon code. Try 'REFURB20'!");
    }
  };

  const handlePlaceOrder = async () => {
    const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const discount = activeCoupon ? Math.min((cartSubtotal * activeCoupon.discountPercentage) / 100, activeCoupon.maxDiscount) : 0;
    const finalTotal = cartSubtotal - discount;

    const checkoutPayload = {
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl
      })),
      total: finalTotal,
      paymentMethod,
      address: `${checkoutAddress.street}, ${checkoutAddress.city}, ${checkoutAddress.state} - ${checkoutAddress.zip}`
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload)
      });
      const data = await res.json();
      if (data.success) {
        loadCart();
        loadOrders();
        loadNotifications();
        setActiveTrackingOrder(data.data);
        setActiveTab("order-success");
        setActiveCoupon(null);
        setCouponCode("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newReview.comment.trim()) return;

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          rating: newReview.rating,
          comment: newReview.comment,
          author: user ? user.fullName : "Sanjay Madhavan"
        })
      });
      const data = await res.json();
      if (data.success) {
        // reload product details and reviews
        handleSelectProduct(selectedProduct);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // AUTH PROCEDURES (Simulated)
  // ==========================================

  const handleMockLogin = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, password: "secure" })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setShowAuthModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "login") {
      handleMockLogin();
    } else if (authMode === "register") {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authForm)
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.data.user);
          setAuthMode("otp");
        }
      } catch (err) {
        console.error(err);
      }
    } else if (authMode === "otp") {
      setShowAuthModal(false);
      triggerLocalNotification("Account Verified", "Your account security token has been fully compiled!");
    } else if (authMode === "forgot") {
      setAuthMode("otp");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab("home");
  };

  // Helper utility for alert messages
  const triggerLocalNotification = (title: string, message: string) => {
    const newAlert: Notification = {
      id: Date.now(),
      title,
      message,
      isRead: false,
      date: new Date().toISOString()
    };
    setNotifications(prev => [newAlert, ...prev]);
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  // Price calculation helper
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartDiscount = activeCoupon ? Math.min((cartSubtotal * activeCoupon.discountPercentage) / 100, activeCoupon.maxDiscount) : 0;
  const cartTotal = cartSubtotal - cartDiscount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* 1. Header Navigation */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        notificationCount={unreadNotifications}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchSubmit={triggerSearch}
        user={user}
        onLogout={handleLogout}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW: HOME / DISCOVER STOREFRONT */}
        {activeTab === "home" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* HERO BANNER SECTION (Glassmorphism & Gradients) */}
            <div className="relative bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-teal-950/80 rounded-3xl border border-slate-800/80 p-6 sm:p-10 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 hidden lg:block">
                <Bot className="h-48 w-48 text-emerald-400 animate-pulse" />
              </div>
              <div className="relative z-10 max-w-xl space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400 font-mono">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  INTERNSHIP PROTOTYPE DISPLAY
                </span>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-sans text-slate-100 leading-tight">
                  Premium Tech, <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    Refurbished Prices
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                  Specializing in <strong>certified open box electronics</strong>, <strong>clearance deals</strong>, and <strong>outlet devices</strong>. Backed by an automated 45-Point engineering diagnosis check and 1-Year warranty.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    onClick={() => { setSelectedCategory("Laptops"); loadProducts(); }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:scale-[1.02] rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-950/30 flex items-center gap-1.5"
                  >
                    <span>Browse Refurbished Laptops</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => { setActiveTab("developer-hub"); }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Database className="h-4 w-4" />
                    <span>View Java Source Files</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AI QUERY intent ribbons (Triggered when user has run an AI search query) */}
            {searchFeedback && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 px-5 py-3 rounded-2xl flex items-start gap-3 relative overflow-hidden">
                <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                    {isSearchAi ? "Gemini Smart Parser Results" : "Store Filter Analysis"}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1">
                    Matched {products.length} gadgets for: <strong className="text-emerald-300">&ldquo;{searchQuery}&rdquo;</strong>. {searchFeedback}
                  </p>
                </div>
                <button 
                  onClick={() => { setSearchQuery(""); setSearchFeedback(""); loadProducts(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white underline font-sans"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* FILTERS & CATEGORIES HORIZONTAL NAVIGATION */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
              
              {/* Category selector capsules */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar whitespace-nowrap">
                <button
                  onClick={() => { setSelectedCategory(""); }}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    selectedCategory === ""
                      ? "bg-slate-100 text-slate-950 border-slate-200"
                      : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedCategory(cat); }}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                      selectedCategory === cat
                        ? "bg-slate-100 text-slate-950 border-slate-200"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Condition Grade Filters */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Condition:</span>
                <select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                >
                  <option value="">All Grades</option>
                  <option value="LIKE_NEW">Like New (10/10)</option>
                  <option value="EXCELLENT">Excellent (9/10)</option>
                  <option value="VERY_GOOD">Very Good (8/10)</option>
                </select>
              </div>

            </div>

            {/* PRODUCT CARDS LIST GRID */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 space-y-3 animate-pulse h-96">
                    <div className="h-44 bg-slate-800/80 rounded-xl" />
                    <div className="h-5 bg-slate-800/80 rounded-md w-3/4" />
                    <div className="h-4 bg-slate-800/80 rounded-md w-1/2" />
                    <div className="h-8 bg-slate-800/80 rounded-md mt-4" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-slate-400 font-mono text-sm">NO GADGETS MATCHED SELECTED FILTER RANGE</p>
                <button 
                  onClick={() => { setSelectedCategory(""); setSelectedCondition(""); setSearchQuery(""); setSearchFeedback(""); loadProducts(); }}
                  className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs hover:bg-slate-700 border border-slate-700"
                >
                  Reset Catalog Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((prod) => (
                  <div 
                    key={prod.id} 
                    className="bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700/60 rounded-2xl overflow-hidden shadow-lg transition-all duration-250 flex flex-col group relative"
                  >
                    
                    {/* Condition Grade floating label */}
                    <span className={`absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border shadow ${
                      prod.conditionGrade === "LIKE_NEW" 
                        ? "bg-emerald-950/95 text-emerald-400 border-emerald-500/30" 
                        : prod.conditionGrade === "EXCELLENT" 
                        ? "bg-blue-950/95 text-blue-400 border-blue-500/30" 
                        : "bg-amber-950/95 text-amber-400 border-amber-500/30"
                    }`}>
                      {prod.conditionGrade.replace("_", " ")}
                    </span>

                    {/* Wishlist toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleWishlist(prod); }}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-slate-950/80 text-slate-400 hover:text-rose-400 hover:bg-slate-950 border border-slate-800/50 transition-colors"
                    >
                      <Heart className={`h-4 w-4 ${wishlist.some(w => w.id === prod.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>

                    {/* Image Area */}
                    <div 
                      onClick={() => handleSelectProduct(prod)}
                      className="h-48 overflow-hidden bg-slate-950 relative cursor-pointer"
                    >
                      <img 
                        src={prod.imageUrl} 
                        alt={prod.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Details Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      
                      <div className="space-y-1.5 cursor-pointer" onClick={() => handleSelectProduct(prod)}>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono tracking-wider">
                          <span>{prod.brand}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-700" />
                          <span>{prod.category}</span>
                        </div>
                        <h3 className="font-sans font-bold text-sm sm:text-base text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {prod.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 text-amber-400 text-xs font-mono">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span>{prod.rating}</span>
                        </div>
                      </div>

                      {/* Prices & Actions */}
                      <div className="space-y-3 pt-2 border-t border-slate-800/60">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-bold text-slate-100 font-mono">
                            Rs. {prod.price.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 line-through font-mono">
                            Rs. {prod.originalPrice.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddToCart(prod.id, 1)}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-emerald-950/20 text-center"
                          >
                            Add to Bag
                          </button>
                          <button
                            onClick={() => handleSelectProduct(prod)}
                            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer transition-all"
                          >
                            View Details
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* VIEW: PRODUCT DETAILS PAGE */}
        {activeTab === "product-detail" && selectedProduct && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Back to Home action */}
            <button
              onClick={() => { setActiveTab("home"); setSelectedProduct(null); }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" />
              BACK TO OUTLET CATALOG
            </button>

            {/* Main Product Frame split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
              
              {/* Left Column: Image & Cert (5 Columns) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="h-72 sm:h-96 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative">
                  <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-500/20">
                    {selectedProduct.conditionGrade.replace("_", " ")} Grade
                  </span>
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Refurb Diagnostics Certificate Panel */}
                <div className="bg-slate-950/50 border border-slate-800/80 p-5 rounded-2xl space-y-3">
                  <h4 className="font-sans font-bold text-xs text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                    Certified Engineering Diagnosis
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {selectedProduct.refurbishedDetails}
                  </p>
                  
                  {/* Milestones check list */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-sans pt-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Diagnostics Passed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Sanitization Done</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Securely Boxed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>1-Year Warranty</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Information, Specs, Reviews, Action (7 Columns) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Headers */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 tracking-wider">
                    <span>{selectedProduct.brand}</span>
                    <span className="h-1 w-1 bg-slate-800 rounded-full" />
                    <span>{selectedProduct.category}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight text-slate-100">
                    {selectedProduct.name}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span className="font-bold">{selectedProduct.rating}</span>
                    </div>
                    <span>• {productReviews.length} User Reviews</span>
                    <span>• In Stock: {selectedProduct.stock}</span>
                  </div>
                </div>

                {/* Price block */}
                <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Special Clearance Price</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
                        Rs. {selectedProduct.price.toLocaleString()}
                      </span>
                      <span className="text-xs sm:text-sm text-slate-500 line-through font-mono">
                        Rs. {selectedProduct.originalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-600/10 text-emerald-400 px-3 py-1 rounded-xl font-mono border border-emerald-500/20 uppercase tracking-wider">
                    Save {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}%
                  </span>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="font-sans font-bold text-xs text-slate-300 uppercase tracking-wider">Product Overview</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Specifications Grid */}
                <div className="space-y-3">
                  <h3 className="font-sans font-bold text-xs text-slate-300 uppercase tracking-wider">Hardware Specifications</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                      <div key={key} className="bg-slate-950/20 border border-slate-800 p-3 rounded-xl">
                        <span className="block text-[10px] font-mono text-slate-500 uppercase">{key}</span>
                        <span className="block text-xs text-slate-200 font-sans mt-0.5 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleAddToCart(selectedProduct.id, 1)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer transition-all shadow-lg shadow-emerald-900/20 text-center flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="h-4.5 w-4.5" />
                    <span>Add to Shopping Bag</span>
                  </button>
                  <button
                    onClick={() => handleToggleWishlist(selectedProduct)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-medium border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Heart className={`h-4.5 w-4.5 ${wishlist.some(w => w.id === selectedProduct.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                    <span>Wishlist</span>
                  </button>
                </div>

              </div>

            </div>

            {/* REVIEWS & RATINGS BLOCK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Existing Reviews Panel (7 columns) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <h3 className="font-sans font-semibold text-sm sm:text-base text-slate-200">
                  Customer Reviews ({productReviews.length})
                </h3>

                {productReviews.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic">No reviews written for this product grade. Be the first to post a certificate feedback!</p>
                ) : (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
                    {productReviews.map((rev) => (
                      <div key={rev.id} className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-sans font-semibold text-slate-200">{rev.author}</span>
                          <span className="font-mono text-slate-500">{rev.date}</span>
                        </div>
                        
                        {/* stars */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < rev.rating ? "fill-amber-400" : "text-slate-700"}`} 
                            />
                          ))}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Feedback Form (5 columns) */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="font-sans font-semibold text-sm sm:text-base text-slate-200">
                  Write Product Feedback
                </h3>
                
                <form onSubmit={handlePostReview} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase">Diagnostic Quality Rating</label>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((starVal) => (
                        <button
                          type="button"
                          key={starVal}
                          onClick={() => setNewReview(prev => ({ ...prev, rating: starVal }))}
                          className="p-1 focus:outline-none"
                        >
                          <Star className={`h-6 w-6 ${starVal <= newReview.rating ? "fill-amber-400" : "text-slate-700"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase">Review Feedback Comment</label>
                    <textarea
                      required
                      rows={3}
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your feedback about diagnostic standards, cosmetic grade, and box packing quality..."
                      className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-xs font-semibold font-sans cursor-pointer transition-colors"
                  >
                    Post Certified Feedback
                  </button>
                </form>
              </div>

            </div>

            {/* AI COMPANION RECOMMENDATIONS AND BUNDLES (Gemini Powered) */}
            <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900/60 border border-indigo-500/10 p-6 sm:p-8 rounded-3xl space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500 rounded-lg text-slate-900">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-sm sm:text-base text-slate-200">
                      Gemini Recommendation Engine
                    </h3>
                    <span className="block text-[10px] text-indigo-300 font-mono">
                      {recsAiPowered ? "LIVE GEMINI METADATA SYNCS ACTIVE" : "LOCAL COGNITIVE FALLBACK DEALS"}
                    </span>
                  </div>
                </div>
              </div>

              {isLoadingRecs ? (
                <div className="flex items-center justify-center h-48 text-xs font-mono text-slate-500 gap-1.5">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                  ANALYZING BUNDLES VIA GEMINI...
                </div>
              ) : aiRecommendations.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono">No companion bundles compiled.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {aiRecommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      onClick={() => handleSelectProduct(rec)}
                      className="bg-slate-950/70 border border-slate-800 hover:border-indigo-500/20 rounded-2xl overflow-hidden p-4 flex flex-col justify-between space-y-4 cursor-pointer group"
                    >
                      <div className="space-y-2">
                        {/* Image */}
                        <div className="h-32 bg-slate-950 rounded-xl overflow-hidden relative border border-slate-900">
                          <img 
                            src={rec.imageUrl} 
                            alt={rec.name} 
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        <span className="inline-block text-[9px] font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/10">
                          {rec.brand} • {rec.category}
                        </span>
                        
                        <h4 className="font-sans font-bold text-xs sm:text-sm text-slate-200 line-clamp-1 group-hover:text-indigo-300">
                          {rec.name}
                        </h4>
                        
                        {/* Gemini Recommendation Custom explanation reason */}
                        {rec.aiRecommendationReason && (
                          <p className="text-[10px] text-emerald-400 italic font-sans leading-relaxed pt-1">
                            &ldquo;{rec.aiRecommendationReason}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/80 shrink-0">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          Rs. {rec.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                          Inspect Deal
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

        {/* VIEW: CART PAGE */}
        {activeTab === "cart" && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-100 flex items-center gap-2">
              My Shopping Bag
              <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full">
                {cart.length} Item Grades
              </span>
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <p className="text-slate-400 font-mono text-sm">YOUR SHOPPING BAG IS CURRENTLY EMPTY</p>
                <button 
                  onClick={() => setActiveTab("home")}
                  className="px-5 py-2.5 bg-emerald-600 text-slate-950 text-xs font-semibold rounded-xl cursor-pointer hover:bg-emerald-500"
                >
                  Explore Clearance Deals
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Cart list (8 columns) */}
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  {cart.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 bg-slate-950/40 p-4 border border-slate-800/60 rounded-2xl"
                    >
                      {/* image */}
                      <div className="h-20 w-20 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Name details */}
                      <div className="flex-1 space-y-1">
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                          {item.product.conditionGrade.replace("_", " ")}
                        </span>
                        <h4 className="font-sans font-bold text-xs sm:text-sm text-slate-200 line-clamp-1 mt-1">
                          {item.product.name}
                        </h4>
                        <span className="block font-mono text-xs font-medium text-slate-300">
                          Rs. {item.product.price.toLocaleString()}
                        </span>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 text-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-xs font-bold text-slate-200 w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700 text-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </div>
                  ))}
                </div>

                {/* Bill details (4 columns) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Promo coupons block */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase">Apply Outlet Coupon</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Try 'REFURB20'"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {activeCoupon && (
                      <span className="block text-[10px] text-emerald-400 font-mono">
                        Active Coupon: &ldquo;{activeCoupon.code}&rdquo; Applied!
                      </span>
                    )}
                    {couponError && (
                      <span className="block text-[10px] text-rose-400 font-mono">
                        {couponError}
                      </span>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                    <h3 className="font-sans font-bold text-xs text-slate-400 uppercase tracking-wider">Bill Summary</h3>
                    
                    <div className="space-y-2 text-xs font-sans text-slate-300 border-b border-slate-800/80 pb-3">
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span className="font-mono">Rs. {cartSubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>Coupon Discount</span>
                        <span className="font-mono">- Rs. {cartDiscount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Certified Shipping</span>
                        <span className="font-mono text-emerald-400">FREE</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-xs font-semibold text-slate-100">Final Price</span>
                      <span className="text-lg font-bold font-mono text-slate-100">
                        Rs. {cartTotal.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveTab("checkout")}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 font-sans"
                    >
                      <span>Proceed to Secure Checkout</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW: SECURE CHECKOUT PAGE */}
        {activeTab === "checkout" && (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-100 flex items-center gap-2">
              Secure Delivery & Payment
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Checkout details Form (8 columns) */}
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                
                {/* Section: Shipping Address */}
                <div className="space-y-4">
                  <h3 className="font-sans font-semibold text-sm sm:text-base text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    1. Shipping Address (Diagnostics Recipient)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block font-mono text-slate-400 uppercase">Street Address</label>
                      <input
                        type="text"
                        value={checkoutAddress.street}
                        onChange={(e) => setCheckoutAddress(prev => ({ ...prev, street: e.target.value }))}
                        className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-mono text-slate-400 uppercase">City</label>
                      <input
                        type="text"
                        value={checkoutAddress.city}
                        onChange={(e) => setCheckoutAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-mono text-slate-400 uppercase">State</label>
                      <input
                        type="text"
                        value={checkoutAddress.state}
                        onChange={(e) => setCheckoutAddress(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Payment Modes selection */}
                <div className="space-y-4">
                  <h3 className="font-sans font-semibold text-sm sm:text-base text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    2. Certified Payment Gateway Method
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    {["UPI", "CREDIT_CARD", "COD"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 border rounded-xl font-sans text-xs sm:text-sm text-center font-medium transition-all cursor-pointer ${
                          paymentMethod === method
                            ? "bg-emerald-600/10 border-emerald-500 text-emerald-400"
                            : "bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {method === "COD" ? "Cash On Delivery" : method.replace("_", " ")}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl text-xs font-sans space-y-3">
                    {paymentMethod === "UPI" && (
                      <div className="space-y-1.5">
                        <label className="block font-mono text-slate-500 uppercase">UPI Identifier Virtual ID</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full max-w-xs bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none"
                        />
                      </div>
                    )}

                    {paymentMethod === "CREDIT_CARD" && (
                      <div className="space-y-1.5">
                        <label className="block font-mono text-slate-500 uppercase">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full max-w-xs bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none font-mono text-xs"
                        />
                      </div>
                    )}

                    {paymentMethod === "COD" && (
                      <p className="text-slate-400 font-sans italic leading-relaxed text-[11px]">
                        Diagnostics and 1-year coverage documents will be verified on-hand upon cash delivery collection.
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* Order summary invoice check (4 columns) */}
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="font-sans font-bold text-xs text-slate-400 uppercase tracking-wider">Checkout Total</h3>
                
                <div className="space-y-3 max-h-[160px] overflow-y-auto border-b border-slate-800 pb-3 pr-1">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs font-sans text-slate-300">
                      <span className="line-clamp-1 max-w-[150px]">{item.product.name} (x{item.quantity})</span>
                      <span className="font-mono text-slate-400">Rs. {(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs font-sans text-slate-300 border-b border-slate-800/80 pb-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">Rs. {cartSubtotal.toLocaleString()}</span>
                  </div>
                  {activeCoupon && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Refurb discount</span>
                      <span className="font-mono">- Rs. {cartDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Diagnostic Packing</span>
                    <span className="text-emerald-400 font-semibold font-mono">FREE</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-semibold text-slate-100">Amount to Pay</span>
                  <span className="text-lg font-bold font-mono text-slate-100">
                    Rs. {cartTotal.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 font-sans uppercase tracking-wider"
                >
                  <Lock className="h-4 w-4 text-slate-950" />
                  <span>Execute Payment Gateway</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* VIEW: ORDER PLACEMENT SUCCESS timeline */}
        {activeTab === "order-success" && activeTrackingOrder && (
          <div className="max-w-2xl mx-auto space-y-8 py-8 animate-fade-in text-center">
            
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 shadow">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-sans text-slate-100">
                Order Diagnostic Activated!
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Your order ID is <strong className="text-emerald-400 font-mono">{activeTrackingOrder.id}</strong>. Our engineering team is currently fetching your gadget, running the 45-point diagnostics sweep, and stamping the custom 1-Year warranty certificate.
              </p>
            </div>

            {/* Tracking Milestones Tracker timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left space-y-4">
              <h3 className="font-sans font-bold text-xs text-slate-300 uppercase tracking-wider">
                Live Delivery Milestones
              </h3>
              
              <div className="space-y-4 relative pl-5 border-l-2 border-slate-800">
                {activeTrackingOrder.tracking.map((step, idx) => (
                  <div key={idx} className="relative space-y-0.5">
                    
                    {/* Bullet marker */}
                    <span className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                      step.done 
                        ? "bg-emerald-500 border-emerald-500 animate-pulse" 
                        : "bg-slate-900 border-slate-800"
                    }`} />
                    
                    <h4 className={`text-xs font-sans font-semibold ${step.done ? "text-emerald-400" : "text-slate-500"}`}>
                      {step.status}
                    </h4>
                    <span className="block text-[10px] font-mono text-slate-500">{step.date}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setActiveTab("home")}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700"
              >
                Back to Deals
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className="px-5 py-2 bg-slate-100 hover:bg-white text-slate-950 rounded-xl text-xs font-semibold cursor-pointer"
              >
                View My Orders
              </button>
            </div>

          </div>
        )}

        {/* VIEW: USER PROFILE & NOTIFICATIONS & WISHLIST DRAWER (Standard views) */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-100">
                My Profile Dashboard
              </h2>
              {user && (
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-rose-900/20 text-rose-400 hover:bg-rose-950 text-xs rounded-xl font-mono border border-rose-500/20 uppercase"
                >
                  Sign Out
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Profile Details */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-emerald-600 rounded-full flex items-center justify-center text-slate-900 font-sans font-extrabold text-lg">
                    {user ? user.fullName[0] : "G"}
                  </div>
                  <div>
                    <h3 className="font-sans font-bold text-base text-slate-200">
                      {user ? user.fullName : "Guest Developer"}
                    </h3>
                    <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded uppercase border border-slate-700">
                      {user ? user.role : "USER"} ROLE
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800 text-xs font-sans text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span>{user ? user.email : "guest@outletgadgets.com"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>{user ? user.phone : "Not Configured"}</span>
                  </div>
                </div>
              </div>

              {/* My Orders Section */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="font-sans font-semibold text-sm sm:text-base text-slate-200 border-b border-slate-800 pb-2">
                  My Refurbished Orders History ({orders.length})
                </h3>

                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic">No purchase histories available.</p>
                ) : (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {orders.map((ord, idx) => (
                      <div key={idx} className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-400">{ord.id}</span>
                            <span className="text-[10px] text-slate-500">• {ord.date.substring(0, 10)}</span>
                          </div>
                          
                          <div className="mt-1 font-sans text-xs text-slate-300">
                            {ord.items.map((i: any) => `${i.name} (x${i.quantity})`).join(", ")}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-start">
                          <span className="font-mono text-xs font-bold text-slate-200">
                            Rs. {ord.total.toLocaleString()}
                          </span>
                          <button
                            onClick={() => { setActiveTrackingOrder(ord); setActiveTab("order-success"); }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs hover:text-white border border-slate-700 transition-colors"
                          >
                            Track Package
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* VIEW: NOTIFICATIONS PAGE */}
        {activeTab === "notifications" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-100 flex items-center gap-2">
                Alert Notifications
                {unreadNotifications > 0 && (
                  <span className="text-xs bg-amber-500 text-slate-900 font-mono font-semibold px-2 py-0.5 rounded-full">
                    {unreadNotifications} New
                  </span>
                )}
              </h2>
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-slate-400 hover:text-emerald-400 underline font-sans"
              >
                Mark all as read
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="text-center text-slate-500 font-mono text-xs py-16">NO ALERTS OR DIAGNOSTIC CERTIFICATE COMPILATIONS TRIGGERED.</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 border rounded-2xl flex items-start gap-3.5 transition-all ${
                      notif.isRead 
                        ? "bg-slate-900/40 border-slate-800/80 text-slate-300" 
                        : "bg-slate-900 border-amber-500/20 text-slate-200 shadow"
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${notif.isRead ? "bg-slate-800 text-slate-500" : "bg-amber-500/10 text-amber-400"}`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-sans font-bold text-xs sm:text-sm">{notif.title}</h4>
                        <span className="text-[9px] font-mono text-slate-500">{new Date(notif.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: WISHLIST VIEW */}
        {activeTab === "wishlist" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-100">
              My Gadget Wishlist ({wishlist.length})
            </h2>

            {wishlist.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-slate-400 font-mono text-sm">YOUR WISHLIST IS CURRENTLY EMPTY</p>
                <button
                  onClick={() => setActiveTab("home")}
                  className="px-4 py-2 bg-emerald-600 text-slate-950 text-xs font-semibold rounded-xl"
                >
                  Explore Clearance Deals
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map((prod) => (
                  <div 
                    key={prod.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow p-4 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="h-32 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative">
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <h3 className="font-sans font-bold text-xs sm:text-sm text-slate-200 line-clamp-1">{prod.name}</h3>
                      <span className="block font-mono text-xs font-bold text-slate-300">Rs. {prod.price.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(prod.id, 1)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Add to bag
                      </button>
                      <button
                        onClick={() => handleToggleWishlist(prod)}
                        className="p-1.5 text-rose-400 hover:bg-slate-800 rounded-lg border border-slate-800"
                        title="Delete from wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: INTEGRATED SPRING BOOT REPO HUB (CENTERPIECE FOR INTRO EVALUATION) */}
        {activeTab === "developer-hub" && (
          <div className="animate-fade-in">
            <DeveloperHub />
          </div>
        )}

        {/* VIEW: ADMIN ANALYTICS PANEL */}
        {activeTab === "admin-dashboard" && (
          <div className="animate-fade-in">
            <AdminAnalytics />
          </div>
        )}

      </main>

      {/* 3. FLOAT CHAT ASSISTANT WIDGET BOX */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen ? (
          <div className="w-[320px] sm:w-[420px] mb-3 shadow-2xl">
            <ChatAssistant 
              onClose={() => setIsChatOpen(false)}
              onNavigateToProduct={(id) => {
                const item = products.find(p => p.id === id);
                if (item) handleSelectProduct(item);
                setIsChatOpen(false);
              }}
            />
          </div>
        ) : null}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="p-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:scale-105 rounded-full shadow-2xl cursor-pointer transition-all flex items-center gap-2 group relative border border-emerald-400/20"
          title="Open AI support chatbot"
        >
          <Bot className="h-6 w-6 animate-spin-slow group-hover:rotate-12 transition-transform text-slate-950" />
          <span className="font-sans font-bold text-xs max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 tracking-tight whitespace-nowrap text-slate-950">
            Chat with AI Expert
          </span>
          {/* Active pulse */}
          <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-emerald-300 border-2 border-slate-950 animate-pulse" />
        </button>
      </div>

      {/* 4. FOOTER CREDITS */}
      <footer className="bg-slate-950 text-slate-500 border-t border-slate-900 py-8 text-center mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 space-y-3 font-sans">
          <p className="text-xs sm:text-sm">
            &copy; 2026 <strong>Outlet Gadgets</strong>. Built specifically for Sanjay Madhavan&apos;s College & Internship Project evaluation.
          </p>
          <div className="flex justify-center gap-4 text-[10px] font-mono tracking-wider">
            <span>MySQL DATABASE: ACTIVE</span>
            <span>REST API: RUNNING PORT 3000</span>
            <span>AI ENGINE: GEMINI 3.5 FLASH</span>
          </div>
        </div>
      </footer>

      {/* 5. MOCK LOGIN VERIFICATION TRIGGER BUTTON overlay (If user logs out) */}
      {!user && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-scale-up">
            
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="font-sans font-extrabold text-xl text-slate-100 tracking-tight mt-1">
                Authenticate Outlet Workspace
              </h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Log in to explore the certified refurbished deals, checkout timelines, and the Spring Boot controller source code files.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Diagnostics Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="sanjaymadhavan56@gmail.com"
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Security Code / Password
                </label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-sans text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-950/20 cursor-pointer text-center"
              >
                Access Prototype Store
              </button>
            </form>

            <div className="text-[10px] text-slate-500 font-mono">
              Note: Entering any credentials automatically registers and initiates a simulated secure JWT token session.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
