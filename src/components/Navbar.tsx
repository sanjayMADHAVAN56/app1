import React, { useState } from "react";
import { 
  ShoppingBag, Heart, User, Bell, Search, Cpu, Database, RefreshCw, Menu, X, ChevronRight 
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  wishlistCount: number;
  notificationCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  user: any;
  onLogout: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  cartCount,
  wishlistCount,
  notificationCount,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  user,
  onLogout,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => { setActiveTab("home"); setSearchQuery(""); setIsOpen(false); }} 
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <div className="p-2 bg-emerald-600 rounded-lg group-hover:bg-emerald-500 transition-all duration-200 shadow-md shadow-emerald-900/30">
              <RefreshCw className="h-5 w-5 text-white animate-spin-slow" />
            </div>
            <div>
              <span className="font-sans font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                Outlet Gadgets
              </span>
              <span className="block text-[10px] font-mono text-emerald-400 tracking-wider uppercase">
                Refurbished Premium
              </span>
            </div>
          </div>

          {/* AI-Powered Search Bar (Shown on md/large screens, hidden on mobile) */}
          <form onSubmit={onSearchSubmit} className="flex-1 max-w-lg relative hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask AI search (e.g., 'Apple laptop for developers under 1.5L')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 placeholder-slate-400 border border-slate-700 rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all duration-150 font-sans"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Search Catalogs"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Desktop Nav Controls (Hidden on mobile, visible on md and up) */}
          <div className="hidden md:flex items-center gap-2 md:gap-4">
            
            {/* Core Views */}
            <button
              onClick={() => setActiveTab("home")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "home" || activeTab === "products" || activeTab === "product-detail"
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              Store
            </button>

            {/* Developer Hub Option (The absolute centerpiece for Internship projects!) */}
            <button
              onClick={() => setActiveTab("developer-hub")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "developer-hub"
                  ? "bg-indigo-600/25 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="Spring Boot & Database Controller Files"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Spring Boot Hub</span>
            </button>

            {/* Admin Console Option */}
            {user && user.role === "ADMIN" && (
              <button
                onClick={() => setActiveTab("admin-dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "admin-dashboard"
                    ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Cpu className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Divider */}
            <span className="h-5 w-px bg-slate-800" />

            {/* Wishlist */}
            <button
              onClick={() => setActiveTab("wishlist")}
              className="relative p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
              title="My Wishlist"
            >
              <Heart className={`h-5 w-5 ${activeTab === "wishlist" ? "fill-rose-500 text-rose-500" : ""}`} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => setActiveTab("cart")}
              className="relative p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Shopping Cart"
            >
              <ShoppingBag className={`h-5 w-5 ${activeTab === "cart" ? "text-emerald-400" : ""}`} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 text-[10px] font-bold bg-emerald-500 text-white rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Alert Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 text-[10px] font-bold bg-amber-500 text-slate-900 rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all flex items-center gap-1`}
              title="My Profile"
            >
              <User className="h-5 w-5" />
              <span className="text-xs font-medium hidden lg:inline max-w-[80px] truncate">
                {user ? user.fullName.split(" ")[0] : "Guest"}
              </span>
            </button>

          </div>

          {/* Mobile Navigation Bar Toggle (Shown on screens < 768px, hidden on md+) */}
          <div className="flex md:hidden items-center gap-1.5">
            
            {/* Quick Access Cart Button for high conversion */}
            <button
              onClick={() => { setActiveTab("cart"); setIsOpen(false); }}
              className="relative p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Shopping Cart"
            >
              <ShoppingBag className={`h-5 w-5 ${activeTab === "cart" ? "text-emerald-400" : ""}`} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 text-[10px] font-bold bg-emerald-500 text-white rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all focus:outline-none"
              title="Toggle Menu"
            >
              {isOpen ? <X className="h-5 w-5 text-emerald-400" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Slide-down Menu Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/95 backdrop-blur-md transition-all duration-300">
          <div className="px-4 pt-2 pb-6 space-y-4">
            
            {/* AI-Powered Search bar inside drawer */}
            <form onSubmit={(e) => { onSearchSubmit(e); setIsOpen(false); }} className="relative mt-2">
              <input
                type="text"
                placeholder="Ask AI search (e.g., 'Apple under 1.5L')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 placeholder-slate-400 border border-slate-700 rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all font-sans"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Search Catalogs"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Links and Buttons */}
            <div className="flex flex-col gap-1.5 pt-2">
              
              <button
                onClick={() => { setActiveTab("home"); setIsOpen(false); }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "home" || activeTab === "products" || activeTab === "product-detail"
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Store Catalog</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>

              <button
                onClick={() => { setActiveTab("developer-hub"); setIsOpen(false); }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "developer-hub"
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                  <span>Spring Boot Hub</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>

              {user && user.role === "ADMIN" && (
                <button
                  onClick={() => { setActiveTab("admin-dashboard"); setIsOpen(false); }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "admin-dashboard"
                      ? "bg-amber-600/20 text-amber-400 border border-amber-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Cpu className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                    <span>Admin Dashboard</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </button>
              )}

              <hr className="border-slate-800 my-2" />

              <button
                onClick={() => { setActiveTab("wishlist"); setIsOpen(false); }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "wishlist"
                    ? "bg-slate-800 text-rose-400 border border-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Heart className={`h-4.5 w-4.5 ${activeTab === "wishlist" ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                  <span>My Wishlist</span>
                </div>
                {wishlistCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-bold font-mono">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab("notifications"); setIsOpen(false); }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "notifications"
                    ? "bg-slate-800 text-amber-400 border border-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className={`h-4.5 w-4.5 ${activeTab === "notifications" ? "text-amber-400" : "text-slate-400"}`} />
                  <span>Notifications</span>
                </div>
                {notificationCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] bg-amber-500 text-slate-900 rounded-full font-bold font-mono">
                    {notificationCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab("profile"); setIsOpen(false); }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "profile"
                    ? "bg-slate-800 text-emerald-400 border border-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="h-4.5 w-4.5 text-slate-400" />
                  <span className="truncate">
                    My Account ({user ? user.fullName : "Guest"})
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>

              {user && (
                <button
                  onClick={() => { onLogout(); setIsOpen(false); }}
                  className="w-full text-center py-2.5 text-sm font-semibold text-rose-400 bg-rose-950/10 hover:bg-rose-950/20 rounded-xl mt-3 border border-rose-500/20 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              )}

            </div>
          </div>
        </div>
      )}
    </header>
  );
}
