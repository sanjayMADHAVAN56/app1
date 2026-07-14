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
  },
  {
    id: 11,
    name: "PlayStation 5 Slim Digital Edition",
    brand: "Sony",
    category: "Gaming & Consoles",
    originalPrice: 44900,
    price: 32900,
    rating: 4.9,
    conditionGrade: "LIKE_NEW",
    stock: 6,
    description: "Certified refurbished PlayStation 5 Slim digital console. Features ultra-high speed 1TB SSD, near-instant load times, ray-tracing capability, and 3D Audio support. Includes original DualSense controller.",
    specifications: {
      "Storage": "1TB Custom High-Speed NVMe SSD",
      "Performance": "4K 120Hz Output, HDR Support",
      "Graphics": "Custom AMD RDNA 2 GPU with Ray Tracing",
      "Accessories": "1x DualSense Wireless Controller included",
      "Warranty": "1-Year OutletGadgets Warranty"
    },
    refurbishedDetails: "Thermal liquid metal compound refreshed on APU. Internal fans vacuumed of microdust. Blu-ray controller board firmware authenticated and optical ports sterilized.",
    imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=60",
    isFeatured: true
  },
  {
    id: 12,
    name: "Steam Deck OLED 512GB Handheld",
    brand: "Valve",
    category: "Gaming & Consoles",
    originalPrice: 59900,
    price: 41900,
    rating: 4.8,
    conditionGrade: "EXCELLENT",
    stock: 4,
    description: "Portable gaming powerhouse featuring a high-brightness HDR OLED panel, 90Hz refresh rate, longer battery performance, and premium haptics. Perfect for your entire Steam library on the go.",
    specifications: {
      "Display": "7.4-inch HDR OLED (90Hz, 1000 nits peak)",
      "Processor": "6nm AMD APU (4 Cores / 8 Threads)",
      "Storage": "512GB PCIe Gen3 NVMe SSD",
      "Battery Life": "3 - 12 hours depending on TDP settings",
      "Battery Health": "95% Capacity Certified"
    },
    refurbishedDetails: "Analogue thumbsticks inspected for potential stick drift (fully recalibrated). Battery test verified over 4.5 hours of continuous heavy load. Complete system factory reset and sanitization.",
    imageUrl: "https://images.unsplash.com/photo-1598550476439-6847785fce6e?w=800&auto=format&fit=crop&q=60",
    isFeatured: true
  },
  {
    id: 13,
    name: "Nintendo Switch OLED Model",
    brand: "Nintendo",
    category: "Gaming & Consoles",
    originalPrice: 34900,
    price: 23900,
    rating: 4.7,
    conditionGrade: "VERY_GOOD",
    stock: 8,
    description: "Refurbished hybrid gaming system with a vibrant 7-inch OLED screen, adjustable wide stand, dock with a wired LAN port, and 64GB of internal storage.",
    specifications: {
      "Display": "7.0-inch OLED Touch Screen",
      "Storage": "64GB Internal (Expandable with MicroSD)",
      "Play Modes": "TV, Tabletop, Handheld Modes supported",
      "Joy-Cons": "Detachable Neon Red/Blue Controllers"
    },
    refurbishedDetails: "Rail sliders cleaned and lubed. Kickstand hinge tension optimized. Game card reader pin verification performed. Joy-Con joystick potentiometers thoroughly replaced to prevent drift.",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 14,
    name: "Sony Alpha A7 IV Mirrorless Camera",
    brand: "Sony",
    category: "Cameras & Content",
    originalPrice: 219900,
    price: 154900,
    rating: 4.9,
    conditionGrade: "EXCELLENT",
    stock: 2,
    description: "Exceptional hybrid mirrorless camera with 33MP Exmor R sensor, high-speed BIONZ XR processing engine, 4K 60p video, and real-time Autofocus tracking. Professional grade.",
    specifications: {
      "Sensor": "33.0 Megapixel Full-Frame Back-Illuminated CMOS",
      "Stabilization": "5-Axis In-Body Image Stabilization (IBIS)",
      "Autofocus": "759-point Phase Detection Real-time Eye AF",
      "ISO Range": "Auto, 100 - 51200",
      "Shutter Count": "Only 4,120 actuations"
    },
    refurbishedDetails: "Full sensor wet-clean performed by in-house camera laboratory. Viewfinder and main LCD screen scratch-inspected. Dial encoders lubricated for exact tactile feedback. Includes battery and charger.",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60",
    isFeatured: true
  },
  {
    id: 15,
    name: "DJI Mini 3 Pro Fly More Combo",
    brand: "DJI",
    category: "Cameras & Content",
    originalPrice: 94900,
    price: 59900,
    rating: 4.8,
    conditionGrade: "EXCELLENT",
    stock: 3,
    description: "Lightweight, sub-249g foldable camera drone with 4K HDR video capability, true vertical shooting, tri-directional obstacle sensing, and 34-minute flight time per battery pack.",
    specifications: {
      "Weight": "249g (No registration required in most areas)",
      "Video Quality": "4K HDR at 60fps / 48MP Photo Sensor",
      "Sensing": "Forward, Backward, and Downward Obstacle Detection",
      "Kit Includes": "RC Remote Controller, 3x Intelligent Flight Batteries, Charger Hub, Bag"
    },
    refurbishedDetails: "IMU and gimbal calibration verified. Brushless motors tested for perfect concentric rotation. Propeller blades fully replaced with brand new original parts. Includes comprehensive flight test log.",
    imageUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 16,
    name: "Google Pixel 8 Pro 128GB",
    brand: "Google",
    category: "Smartphones",
    originalPrice: 109999,
    price: 62900,
    rating: 4.7,
    conditionGrade: "LIKE_NEW",
    stock: 5,
    description: "Premium Google flagship smartphone with cutting edge Google Tensor G3 chip, AI Magic Eraser, Best Take photography capabilities, and a gorgeous 120Hz LTPO OLED display.",
    specifications: {
      "Chipset": "Google Tensor G3 with Titan M2 security",
      "Display": "6.7-inch Super Actua OLED (120Hz, 2400 nits peak)",
      "Camera": "50MP Main + 48MP Wide + 48MP 5x Zoom with Telephoto",
      "Battery Health": "96% (Original Battery)"
    },
    refurbishedDetails: "Screen digitizer and biometric face/fingerprint scanners passed absolute performance check. Motherboard flashed with the latest clean Android image. Clean IMEI, unlocked.",
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 17,
    name: "Samsung Galaxy Tab S9 Ultra (Wi-Fi)",
    brand: "Samsung",
    category: "Tablets",
    originalPrice: 108999,
    price: 74900,
    rating: 4.8,
    conditionGrade: "LIKE_NEW",
    stock: 4,
    description: "Colossal 14.6-inch Android tablet featuring Snapdragon 8 Gen 2 processor, dynamic 120Hz AMOLED screen, IP68 water resistance rating, and professional-grade S-Pen stylus.",
    specifications: {
      "Display": "14.6-inch Dynamic AMOLED 2X (120Hz, HDR10+)",
      "Processor": "Snapdragon 8 Gen 2 for Galaxy",
      "RAM/Storage": "12GB RAM, 256GB Storage (Expandable)",
      "Accessories": "Included S-Pen, Premium cover guard"
    },
    refurbishedDetails: "Prisine condition screen with zero OLED burn-in. Pressure sensitivity mapping on glass tested perfectly against included S-Pen. Cleaned and factory reset.",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 18,
    name: "Asus ROG Zephyrus G14 Gaming Laptop",
    brand: "Asus",
    category: "Laptops",
    originalPrice: 149900,
    price: 98900,
    rating: 4.8,
    conditionGrade: "EXCELLENT",
    stock: 2,
    description: "Compact ultraportable gaming marvel driven by Ryzen 9 processor and NVIDIA RTX 4060 graphics. High-contrast 120Hz Display, AniMe Matrix back lid, and outstanding cooling system.",
    specifications: {
      "Processor": "AMD Ryzen 9 7940HS (8 Cores, 16 Threads)",
      "Graphics": "NVIDIA GeForce RTX 4060 8GB GDDR6",
      "RAM/Storage": "16GB DDR5 RAM, 1TB NVMe Gen4 SSD",
      "Display": "14-inch QHD+ 165Hz ROG Nebula Display",
      "Battery Health": "93% Original Capacity"
    },
    refurbishedDetails: "Completely repasted CPU and GPU with premium Noctua thermal compound. Fans deep cleaned and fan bearings lubricated. Keyboard backlighting and key-stroke responses verified at 100%.",
    imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 19,
    name: "Microsoft Surface Pro 9",
    brand: "Microsoft",
    category: "Laptops",
    originalPrice: 115000,
    price: 68900,
    rating: 4.6,
    conditionGrade: "VERY_GOOD",
    stock: 5,
    description: "Perfect 2-in-1 hybrid laptop combining tablet versatility with laptop performance. Powered by Intel Evo Core i5, gorgeous PixelSense touchscreen, and adjustable kickstand.",
    specifications: {
      "Processor": "12th Gen Intel Core i5-1235U",
      "RAM": "8GB LPDDR5 RAM",
      "Storage": "256GB Removable SSD",
      "Display": "13-inch PixelSense Flow Display (120Hz Refresh)",
      "Battery Health": "90% capacity"
    },
    refurbishedDetails: "Kickstand pivot friction test passed. Surface Type-Cover connectors thoroughly cleaned with contact cleaner. Screen has a tiny microscopic line on backplate casing, purely cosmetic.",
    imageUrl: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 20,
    name: "Apple HomePod (2nd Generation)",
    brand: "Apple",
    category: "Smart Home & IoT",
    originalPrice: 32900,
    price: 21900,
    rating: 4.7,
    conditionGrade: "LIKE_NEW",
    stock: 6,
    description: "Immersive high-fidelity smart speaker featuring advanced acoustic design, beamforming tweeters, room-sensing technology, spatial audio, and smart Siri integrations.",
    specifications: {
      "Audio": "4-inch high-excursion woofer, array of 5 horn-loaded tweeters",
      "Sensors": "Room-sensing, Temperature, Humidity sensors, Accelerometer",
      "Connectivity": "802.11n Wi-Fi, Bluetooth 5.0, Thread, AirPlay 2",
      "Condition": "Pristine white fabric, original power cord included"
    },
    refurbishedDetails: "Internal microphone array calibrated. Bass woofer air-pressure relief valve checked. Mesh fabric detailed and sanitized with dry-steam technology.",
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 21,
    name: "Philips Hue Starter Kit (Warm to Cool White)",
    brand: "Philips",
    category: "Smart Home & IoT",
    originalPrice: 15999,
    price: 8900,
    rating: 4.5,
    conditionGrade: "EXCELLENT",
    stock: 9,
    description: "Premium smart lighting starter kit. Includes 3 smart LED bulbs (fitting standard B22 bases), the Hue Bridge router, and a custom wireless dimmer remote. Command millions of custom scenes.",
    specifications: {
      "Light Output": "800 Lumens per bulb, 2200K - 6500K spectrum",
      "Bridge Connectivity": "Zigbee protocol (Supports up to 50 smart bulbs)",
      "Compatibility": "Apple HomeKit, Google Home, Alexa, SmartThings"
    },
    refurbishedDetails: "Bridge micro-controller flashed with the latest secure firmware. Bulb elements checked for lumen degradation. Dimmer switch batteries replaced with fresh CR2032 cells.",
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 22,
    name: "Google Nest Hub Max Smart Display",
    brand: "Google",
    category: "Smart Home & IoT",
    originalPrice: 22900,
    price: 12900,
    rating: 4.6,
    conditionGrade: "VERY_GOOD",
    stock: 7,
    description: "Ultimate smart home commander with 10-inch HD screen, built-in Nest Security Camera, stereo speakers with integrated subwoofer, and Google Assistant.",
    specifications: {
      "Display": "10-inch HD Touchscreen",
      "Camera": "6.5-megapixel camera with 127-degree wide field-of-view",
      "Speakers": "Stereo (2x 18mm tweeters, 1x 75mm woofer)",
      "Privacy": "Hardware mute switch for microphone and camera"
    },
    refurbishedDetails: "Slight cosmetic scuffing on fabric base. Camera lens tested for focus clarity. Speaker array tested at full volume with bass sweeps; no acoustic distortion detected.",
    imageUrl: "https://images.unsplash.com/photo-1567449303078-57bd995bd375?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 23,
    name: "Bose QuietComfort Ultra Headphones",
    brand: "Bose",
    category: "Audio & Accessories",
    originalPrice: 35900,
    price: 24900,
    rating: 4.8,
    conditionGrade: "LIKE_NEW",
    stock: 5,
    description: "Bose flagship active noise-cancelling headphones featuring groundbreaking Immersive Audio, world-class quietness, CustomTune custom sound profiling, and premium luxury leather design.",
    specifications: {
      "ANC Modes": "Quiet Mode, Aware Mode, Immersion Mode",
      "Battery": "Up to 24 hours playback on a single charge",
      "Microphones": "12 microphones total for incredible voice capture",
      "Weight": "252 grams"
    },
    refurbishedDetails: "Sanitized and detailed. Dynamic driver frequency swept from 10Hz to 22kHz to verify absolute performance. Memory foam headband and ear pads replaced with brand new Bose OEM replacements.",
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 24,
    name: "Sonos Era 100 Smart Speaker",
    brand: "Sonos",
    category: "Audio & Accessories",
    originalPrice: 29900,
    price: 19900,
    rating: 4.7,
    conditionGrade: "EXCELLENT",
    stock: 6,
    description: "Superb acoustics meet next-gen design. The Sonos Era 100 delivers room-filling stereo sound, deep rich bass, and dual-angled tweeters. Supports Wi-Fi, Bluetooth, and Aux inputs.",
    specifications: {
      "Amplifiers": "Three class-D digital amplifiers tuned for acoustics",
      "Tweeters": "Two angled tweeters create high-frequency response",
      "Woofer": "One mid-woofer ensures deep low-frequency bass",
      "Trueplay Tuning": "Acoustic space calibration technology"
    },
    refurbishedDetails: "Ethernet and line-in ports connectivity checked. Trueplay spatial calibration mic module tested and verified. Chassis deep-cleaned and detailed.",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 25,
    name: "Logitech MX Master 3S Wireless Mouse",
    brand: "Logitech",
    category: "Audio & Accessories",
    originalPrice: 10995,
    price: 6900,
    rating: 4.9,
    conditionGrade: "LIKE_NEW",
    stock: 12,
    description: "Master productivity mouse with 8K DPI tracking, ultra-quiet MagSpeed electromagnetic scrolling wheel, ergonomic thumb cradle, and dual Bluetooth/Logi Bolt wireless connectivity.",
    specifications: {
      "Sensor": "8000 DPI Darkfield high precision glass tracker",
      "Scroll Wheel": "MagSpeed electromagnetic steel smart scroll",
      "Buttons": "7 customizable buttons, gesture button, thumb wheel",
      "Battery Life": "Up to 70 days on a full charge (USB-C)"
    },
    refurbishedDetails: "Thumb wheel potentiometer and primary switches replaced with fresh heavy-duty Silent-Clicks. Teflon glide pads replaced on bottom surface. Sanitized and packed.",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60"
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
