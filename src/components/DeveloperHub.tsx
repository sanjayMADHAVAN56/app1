import React, { useState, useEffect } from "react";
import { FileCode, Terminal, Copy, Check, Play, Server, Database, Layers, ArrowRight, RefreshCw, Cpu } from "lucide-react";

interface FileItem {
  name: string;
  label: string;
  icon: string;
  type: string;
}

const JAVA_FILES: FileItem[] = [
  { name: "schema.sql", label: "schema.sql (MySQL)", icon: "Database", type: "SQL" },
  { name: "Product.java", label: "Product.java (JPA Model)", icon: "FileCode", type: "Java Entity" },
  { name: "ProductController.java", label: "ProductController.java", icon: "FileCode", type: "REST Controller" },
  { name: "AuthController.java", label: "AuthController.java", icon: "FileCode", type: "REST Controller" },
  { name: "OrderController.java", label: "OrderController.java", icon: "FileCode", type: "REST Controller" },
  { name: "RecommendationController.java", label: "RecommendationController.java", icon: "FileCode", type: "REST Controller" },
  { name: "RecommendationService.java", label: "RecommendationService.java", icon: "FileCode", type: "AI Service" },
  { name: "ApiResponse.java", label: "ApiResponse.java", icon: "FileCode", type: "DTO Wrapper" },
  { name: "SecurityConfig.java", label: "SecurityConfig.java", icon: "FileCode", type: "Spring Security" }
];

const API_ENDPOINTS = [
  { method: "GET", path: "/api/products", desc: "List refurbished gadgets with optional category/brand filters", payload: null },
  { method: "GET", path: "/api/products/1", desc: "Retrieve certified diagnostics details for a single item", payload: null },
  { method: "POST", path: "/api/recommendations", desc: "Trigger Gemini AI recommendations match scoring", payload: { productId: 1 } },
  { method: "GET", path: "/api/search?q=cheap apple", desc: "Trigger Gemini semantic search intent processing", payload: null },
  { method: "GET", path: "/api/cart", desc: "Retrieve active cart list matched with product detail structures", payload: null },
  { method: "GET", path: "/api/admin/analytics", desc: "Trigger Gemini BI store telemetry analyzer", payload: null }
];

const SAMPLE_SNIPPETS = [
  {
    name: "ProductGrid.tsx (React Component)",
    type: "Controller",
    code: `import React, { useState } from 'react';\n\ninterface Product {\n  id: number;\n  name: string;\n  price: number;\n  condition: string;\n}\n\nexport default function ProductGrid() {\n  const [items, setItems] = useState<Product[]>([]);\n  const [loading, setLoading] = useState(false);\n\n  const fetchProducts = async (category: string) => {\n    setLoading(true);\n    const res = await fetch(\`/api/products?category=\${category}\`);\n    const data = await res.json();\n    setItems(data.data);\n    setLoading(false);\n  };\n\n  return (\n    <div>\n      {loading ? <p>Loading...</p> : items.map(item => (\n        <div key={item.id}>\n          <h3>{item.name}</h3>\n          <p>Price: \${item.price}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`
  },
  {
    name: "types.ts (Data Interface)",
    type: "Entity",
    code: `export interface ProductDetails {\n  id: number;\n  title: string;\n  brand: string;\n  category: string;\n  retailPrice: number;\n  outletPrice: number;\n  conditionGrade: "LIKE_NEW" | "EXCELLENT" | "VERY_GOOD" | "FAIR";\n  hardwareScore: number;\n  refurbishedLog: string;\n  isFeatured: boolean;\n}`
  },
  {
    name: "OrderService.ts (Cart Checkout Service)",
    type: "Service",
    code: `export async function processCheckout(cartItems: any[], paymentMethod: string) {\n  const validation = cartItems.every(item => item.quantity > 0 && item.price > 0);\n  if (!validation) throw new Error("Invalid cart items detected.");\n\n  const orderTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);\n  \n  const response = await fetch("/api/orders", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ items: cartItems, total: orderTotal, paymentMethod })\n  });\n\n  return response.json();\n}`
  },
  {
    name: "DeviceDashboard.tsx (Interactive Web Widget)",
    type: "HTML",
    code: `import React, { useState } from 'react';\n\nexport default function DeviceDashboard() {\n  const [search, setSearch] = useState("");\n  const [warranty, setWarranty] = useState(true);\n  \n  const devices = [\n    { name: "Apple iPad Pro M2", price: 499, warranty: true },\n    { name: "Samsung Galaxy Tab S8", price: 299, warranty: false },\n    { name: "Sony WH-1000XM4 ANC", price: 180, warranty: true }\n  ];\n\n  const filtered = devices.filter(d => \n    d.name.toLowerCase().includes(search.toLowerCase()) &&\n    (!warranty || d.warranty)\n  );\n\n  return (\n    <div className="p-6 max-w-md mx-auto bg-slate-900 rounded-xl space-y-4 shadow-xl border border-slate-800">\n      <h2 className="text-xl font-bold text-white tracking-tight">Outlet Device Radar</h2>\n      \n      <input \n        type="text" \n        placeholder="Search devices..." \n        value={search} \n        onChange={(e) => setSearch(e.target.value)} \n        className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-indigo-500"\n      />\n\n      <label className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer select-none">\n        <input \n          type="checkbox" \n          checked={warranty} \n          onChange={(e) => setWarranty(e.target.checked)} \n          className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"\n        />\n        <span>Show only items with active warranty</span>\n      </label>\n\n      <div className="space-y-2">\n        {filtered.map((d, i) => (\n          <div key={i} className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-lg flex justify-between border border-slate-700/50 transition-all">\n            <span className="text-slate-200 text-xs">{d.name}</span>\n            <span className="text-indigo-400 font-bold text-xs">\${d.price}</span>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}`
  }
];

export default function DeveloperHub() {
  const [activeTab, setActiveTab] = useState<"explorer" | "compiler">("explorer");

  const [selectedFile, setSelectedFile] = useState<FileItem>(JAVA_FILES[0]);
  const [fileContent, setFileContent] = useState("");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [copied, setCopied] = useState(false);

  // REST API Simulator states
  const [selectedApi, setSelectedApi] = useState(API_ENDPOINTS[0]);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<number | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // TSX to Java Compiler states
  const [compilerInput, setCompilerInput] = useState(SAMPLE_SNIPPETS[0].code);
  const [compilerOutput, setCompilerOutput] = useState("");
  const [compilerTargetType, setCompilerTargetType] = useState<"Controller" | "Service" | "Entity" | "DTO" | "Any" | "HTML">("Controller");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerMessage, setCompilerMessage] = useState("");
  const [compilerCopied, setCompilerCopied] = useState(false);

  const loadFileContent = async (file: FileItem) => {
    setIsLoadingFile(true);
    try {
      const response = await fetch(`/api/developer/code/${file.name}`);
      const data = await response.json();
      if (data.success) {
        setFileContent(data.content);
      } else {
        setFileContent("// Code failed to load. Please verify workspace directory.");
      }
    } catch (err) {
      setFileContent("// Network error connecting to code microservice.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleExecuteApi = async (api: typeof API_ENDPOINTS[0]) => {
    setIsLoadingApi(true);
    setApiResponse(null);
    setApiStatus(null);
    try {
      const options: RequestInit = {
        method: api.method,
        headers: { "Content-Type": "application/json" }
      };
      if (api.payload) {
        options.body = JSON.stringify(api.payload);
      }
      
      const response = await fetch(api.path, options);
      setApiStatus(response.status);
      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setApiStatus(500);
      setApiResponse({ success: false, message: "Connection to simulation server lost." });
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setCompilerOutput("");
    setCompilerMessage("");
    try {
      const response = await fetch("/api/developer/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: compilerInput, targetType: compilerTargetType })
      });
      const data = await response.json();
      if (data.success) {
        setCompilerOutput(data.javaCode);
        if (data.aiPowered) {
          setCompilerMessage("Success: Translated successfully with Gemini 3.5 Flash!");
        } else {
          setCompilerMessage("Simulation Mode: React component simulated to Spring Boot equivalent.");
        }
      } else {
        setCompilerMessage("Error: " + (data.message || "Failed to compile TSX code."));
      }
    } catch (err) {
      setCompilerMessage("Error: Failed to connect to translation server.");
    } finally {
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    loadFileContent(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    // Auto run first API on load for cool factor
    handleExecuteApi(API_ENDPOINTS[0]);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCompiled = () => {
    navigator.clipboard.writeText(compilerOutput);
    setCompilerCopied(true);
    setTimeout(() => setCompilerCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-slate-100 flex items-center gap-2">
            Spring Boot Java & REST API Developer Hub
            <span className="text-xs bg-indigo-900/40 text-indigo-300 font-mono px-2.5 py-1 rounded-full border border-indigo-500/20">
              Internship Repository
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Explore production-ready Spring Boot controllers, repositories, databases, or translate your frontend React components into backend Java source files!
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab("explorer")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === "explorer"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Repository & Sandbox</span>
          </button>
          <button
            onClick={() => setActiveTab("compiler")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === "compiler"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span>TSX to Java AI Compiler</span>
          </button>
        </div>
      </div>

      {activeTab === "explorer" ? (
        /* Main Layout: Split into Java Files and REST Client */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Java Repository Explorer (7 Columns) */}
          <div className="xl:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
            
            {/* Hub Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Java Spring Boot Src Tree
                </span>
              </div>
              
              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs transition-colors cursor-pointer font-sans"
                title="Copy active code"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Body: Left sidebar, Right Code viewer */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              
              {/* Left Sidebar list */}
              <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/20 overflow-y-auto p-2 space-y-1 h-[140px] md:h-full shrink-0 md:shrink">
                {JAVA_FILES.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full flex flex-col items-start gap-1 p-2.5 rounded-lg transition-all text-left ${
                      selectedFile.name === file.name
                        ? "bg-emerald-600/10 border-l-2 border-emerald-500 text-emerald-300"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {file.name.endsWith(".sql") ? (
                        <Database className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      ) : (
                        <FileCode className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      )}
                      <span className="text-xs font-sans font-medium truncate max-w-[120px] sm:max-w-none">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider pl-5">
                      {file.type}
                    </span>
                  </button>
                ))}
              </div>

              {/* Right Terminal Panel */}
              <div className="flex-1 bg-slate-950/80 flex flex-col overflow-hidden relative h-[300px] md:h-full">
                {isLoadingFile ? (
                  <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
                    READING JAVA FILE...
                  </div>
                ) : (
                  <pre className="flex-1 overflow-auto p-4 text-[11px] sm:text-xs font-mono text-slate-300 leading-relaxed scrollbar-thin select-text">
                    <code>{fileContent}</code>
                  </pre>
                )}
              </div>

            </div>

          </div>

          {/* REST API Sandbox Console (5 Columns) */}
          <div className="xl:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
            
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Live REST API Playground
                </span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Connected to local Express simulator" />
            </div>

            {/* Sandbox Body */}
            <div className="p-4 space-y-4 flex-1 flex flex-col overflow-hidden">
              
              {/* Endpoints dropdown/selection */}
              <div className="space-y-1.5 shrink-0">
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Select API Endpoint to Execute
                </label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {API_ENDPOINTS.map((api, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedApi(api); handleExecuteApi(api); }}
                      className={`w-full p-2 border rounded-xl text-left transition-all ${
                        selectedApi.path === api.path
                          ? "bg-indigo-600/15 border-indigo-500/40 text-slate-100"
                          : "bg-slate-950/30 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                          api.method === "GET" ? "bg-emerald-500/10 text-emerald-400" : "bg-indigo-500/10 text-indigo-400"
                        }`}>
                          {api.method}
                        </span>
                        <span className="font-mono text-xs text-indigo-300 font-semibold truncate">
                          {api.path}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans mt-1">
                        {api.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Terminal Console Console */}
              <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col overflow-hidden relative">
                
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3 shrink-0">
                  <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full inline-block" />
                    HTTP CLIENT RESPONSE
                  </span>
                  
                  {apiStatus && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      apiStatus === 200 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {apiStatus} {apiStatus === 200 ? "OK" : "ERROR"}
                    </span>
                  )}
                </div>

                {/* JSON console content */}
                <div className="flex-1 overflow-auto text-left">
                  {isLoadingApi ? (
                    <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                      SENDING HTTP REQUEST...
                    </div>
                  ) : apiResponse ? (
                    <pre className="text-[10px] sm:text-xs font-mono text-slate-300 select-text leading-relaxed">
                      <code>{JSON.stringify(apiResponse, null, 2)}</code>
                    </pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 font-mono text-xs italic">
                      Select an endpoint above to see simulated backend responses.
                    </div>
                  )}
                </div>

                {/* Float executing button */}
                <button
                  onClick={() => handleExecuteApi(selectedApi)}
                  disabled={isLoadingApi}
                  className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-sans text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/40 transition-colors"
                >
                  <Play className="h-3 w-3 fill-white" />
                  <span>Re-run Request</span>
                </button>

              </div>

            </div>

          </div>

        </div>
      ) : (
        /* TSX to Java AI Compiler Tab */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* TSX Input Panel (6 Columns) */}
          <div className="xl:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4 h-[600px]">
            
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-400" />
                TSX/TypeScript Input Source
              </span>

              {/* Sample Presets */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans text-slate-400">Load Preset:</span>
                <select
                  onChange={(e) => {
                    const preset = SAMPLE_SNIPPETS.find(s => s.name === e.target.value);
                    if (preset) {
                      setCompilerInput(preset.code);
                      setCompilerTargetType(preset.type as any);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] px-2 py-1 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {SAMPLE_SNIPPETS.map((snippet, idx) => (
                    <option key={idx} value={snippet.name}>
                      {snippet.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Options */}
            <div className="flex items-center justify-between shrink-0 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400">Target Compilation Output:</span>
                <select
                  value={compilerTargetType}
                  onChange={(e) => setCompilerTargetType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Controller">REST Controller (@RestController)</option>
                  <option value="Entity">JPA Database Entity (@Entity)</option>
                  <option value="Service">Enterprise Service (@Service)</option>
                  <option value="DTO">Data Transfer Object (DTO / Record)</option>
                  <option value="Any">Automatic Mapping Wrapper</option>
                  <option value="HTML">Single-File HTML & Tailwind Webpage (.html)</option>
                </select>
              </div>
            </div>

            {/* Code Textarea Editor */}
            <div className="flex-1 relative">
              <textarea
                value={compilerInput}
                onChange={(e) => setCompilerInput(e.target.value)}
                placeholder="Paste your React component (.tsx) or TypeScript module (.ts) here..."
                className="w-full h-full bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500/80 resize-none leading-relaxed select-text shadow-inner"
              />
            </div>

            {/* Compile button */}
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-sans text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {isCompiling ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Converting via Gemini AI Model...</span>
                </>
              ) : (
                <>
                  <Cpu className="h-4 w-4" />
                  <span>
                    {compilerTargetType === "HTML" 
                      ? "Translate TSX to Standalone HTML Webpage" 
                      : "Translate TSX to Enterprise Spring Boot Java"}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Java Output Panel (6 Columns) */}
          <div className="xl:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4 h-[600px]">
            
            {/* Header Toolbar */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                {compilerTargetType === "HTML" ? (
                  <FileCode className="h-4 w-4 text-amber-400" />
                ) : (
                  <Database className="h-4 w-4 text-emerald-400" />
                )}
                {compilerTargetType === "HTML" ? "Standalone HTML Webpage Output (.html)" : "Spring Boot Java Source File Output"}
              </span>

              {compilerOutput && (
                <button
                  onClick={handleCopyCompiled}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {compilerCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Output compiler message or warnings */}
            {compilerMessage && (
              <div className={`p-3 rounded-xl border text-xs font-sans shrink-0 ${
                compilerMessage.startsWith("Error") 
                  ? "bg-rose-950/20 border-rose-800/40 text-rose-300"
                  : compilerMessage.includes("Simulation")
                  ? "bg-amber-950/20 border-amber-800/40 text-amber-300"
                  : "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
              }`}>
                {compilerMessage}
              </div>
            )}

            {/* Code Output Viewer */}
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-auto relative">
              {isCompiling ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                    <Cpu className="h-5 w-5 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-mono text-slate-200">GEMINI COMPILING PIPELINE ACTIVE</p>
                    <p className="text-[10px] text-slate-500 font-sans">
                      {compilerTargetType === "HTML" 
                        ? "Converting JSX layout to static HTML5 elements & Tailwind CSS..." 
                        : "Parsing AST, mapping state, and rewriting as Spring annotations..."}
                    </p>
                  </div>
                </div>
              ) : compilerOutput ? (
                <pre className="p-4 text-[11px] sm:text-xs font-mono text-slate-300 select-text leading-relaxed">
                  <code>{compilerOutput}</code>
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6 space-y-2">
                  <FileCode className="h-8 w-8 text-slate-700 animate-bounce" />
                  <p className="font-mono uppercase tracking-wider text-[11px]">
                    {compilerTargetType === "HTML" ? "HTML Translation Frame Empty" : "Java Translation Frame Empty"}
                  </p>
                  <p className="max-w-xs text-slate-600 font-sans text-[11px]">
                    {compilerTargetType === "HTML" 
                      ? "Paste React code or load a sample preset on the left, then click compile to generate an interactive standalone HTML5 webpage."
                      : "Paste React code or load a sample preset on the left, then click compile to generate equivalent Spring Boot architectures."}
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
