import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import { CartContext } from "../context/CartContext";
import { ToastContext } from "../context/ToastContext";
import { WishlistContext } from "../context/WishlistContext";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import cartifyWelcomeBanner from "../assets/Cartify Welcome Banner.png";
import mensFashionBanner from "../assets/MensFashion.png";
import featuredGridBanner from "../assets/Carity_Banner.png";
import winterSaleBanner from "../assets/WinterSaleBanner.png";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n
  );
const PRODUCT_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80";

const PRODUCT_CARD_IMAGE_WRAPPER_STYLE = {
  width: "100%",
  aspectRatio: "4 / 5",
  background: "#fafafa",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 10,
  overflow: "hidden",
  minHeight: 0,
};

const PRODUCT_CARD_IMAGE_STYLE = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const IMAGE_VARIANT_WIDTHS = {
  small: 640,
  medium: 1920,
  large: 2400,
};

const getProductImageSources = (product, preference = "medium") => {
  if (!product) {
    return { src: PRODUCT_PLACEHOLDER_IMAGE, srcSet: "" };
  }

  const variants =
    (product.imageVariants && typeof product.imageVariants === "object"
      ? product.imageVariants
      : {}) || {};

  const preferenceOrder = {
    small: ["small", "medium", "large"],
    medium: ["medium", "large", "small"],
    large: ["large", "medium", "small"],
    default: ["medium", "large", "small"],
  };

  const orderedKeys = preferenceOrder[preference] || preferenceOrder.default;
  const resolvedVariant = orderedKeys.map((key) => variants[key]).find(Boolean);

  const arrayFallback =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null;

  const src =
    resolvedVariant ||
    arrayFallback ||
    product.image ||
    PRODUCT_PLACEHOLDER_IMAGE;

  const srcSet = Object.entries(IMAGE_VARIANT_WIDTHS)
    .map(([key, width]) => {
      const url = variants[key];
      return url ? `${url} ${width}w` : null;
    })
    .filter(Boolean)
    .join(", ");

  return { src, srcSet };
};

const VEG_FRUITS_BANNER_SVG = `
<svg width="1200" height="500" viewBox="0 0 1200 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vegetables and fruits growing, moving to cart, packaged, and arriving home" style="width:100%;height:auto;">
  <defs>
    <!-- Background pattern -->
    <pattern id="dots" patternUnits="userSpaceOnUse" width="40" height="40">
      <circle cx="5" cy="5" r="2" fill="#e8dfd6"/>
      <circle cx="25" cy="20" r="1.5" fill="#e8dfd6"/>
      <circle cx="15" cy="35" r="1" fill="#e8dfd6"/>
    </pattern>

    <!-- Soil gradient -->
    <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8b5a3c"/>
      <stop offset="100%" stop-color="#5f3a24"/>
    </linearGradient>

    <!-- Leaf gradient -->
    <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5fb55a"/>
      <stop offset="100%" stop-color="#2e7d32"/>
    </linearGradient>

    <!-- Fruit highlight -->
    <radialGradient id="fruitHighlight" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.7)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>

    <!-- Drop shadow -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.2"/>
    </filter>

    <!-- Arrow marker -->
    <marker id="arrowHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 Z" fill="#7f8c8d"/>
    </marker>

    <!-- Common animations -->
    <style>
      .pulse {
        animation: pulse 2.5s ease-in-out infinite;
        transform-origin: center;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1);}
        50% { transform: scale(1.04);}
      }

      .wiggle {
        animation: wiggle 3s ease-in-out infinite;
        transform-origin: center;
      }
      @keyframes wiggle {
        0%, 100% { transform: rotate(0deg);}
        50% { transform: rotate(1.2deg);}
      }

      .shine {
        animation: shine 4s linear infinite;
      }
      @keyframes shine {
        0% { opacity: 0.0;}
        40% { opacity: 0.5;}
        100% { opacity: 0.0;}
      }

      .float {
        animation: float 4s ease-in-out infinite;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0);}
        50% { transform: translateY(-3px);}
      }

      .fadeIn {
        animation: fadeIn 1.2s ease-out forwards;
      }
      @keyframes fadeIn {
        from { opacity: 0;}
        to { opacity: 1;}
      }
    </style>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="1200" height="500" fill="#f7f1e8"/>
  <rect x="0" y="0" width="1200" height="500" fill="url(#dots)"/>

  <!-- Scene labels -->
  <g font-family="Inter, system-ui, sans-serif" font-size="16" fill="#2c3e50">
    <text x="150" y="35">Growing</text>
    <text x="550" y="35">Into cart</text>
    <text x="950" y="35">Packaged &amp; delivered</text>
  </g>

  <!-- Scene 1: Garden growth -->
  <g id="scene1" transform="translate(40,60)">
    <!-- soil -->
    <rect x="0" y="250" width="360" height="120" fill="url(#soilGrad)" filter="url(#shadow)" rx="6"/>

    <!-- sprouts -->
    <g transform="translate(40,250)">
      <g class="pulse">
        <path d="M0,0 C10,-20 24,-8 22,0" fill="url(#leafGrad)"/>
        <path d="M4,0 C-8,-18 -20,-8 -18,0" fill="url(#leafGrad)"/>
        <rect x="-1.5" y="-12" width="3" height="12" fill="#795548"/>
      </g>
    </g>

    <g transform="translate(120,250)">
      <g class="pulse">
        <path d="M0,0 C10,-16 24,-6 22,0" fill="url(#leafGrad)"/>
        <path d="M4,0 C-8,-14 -20,-6 -18,0" fill="url(#leafGrad)"/>
        <rect x="-1.5" y="-10" width="3" height="10" fill="#795548"/>
      </g>
    </g>

    <g transform="translate(200,250)">
      <g class="pulse">
        <path d="M0,0 C10,-18 24,-7 22,0" fill="url(#leafGrad)"/>
        <path d="M4,0 C-8,-16 -20,-7 -18,0" fill="url(#leafGrad)"/>
        <rect x="-1.5" y="-11" width="3" height="11" fill="#795548"/>
      </g>
    </g>

    <!-- strawberry plant -->
    <g transform="translate(60,210)" class="wiggle">
      <path d="M0,40 C30,5 60,5 90,40" stroke="#2e7d32" stroke-width="6" fill="none"/>
      <circle cx="15" cy="30" r="12" fill="#e53935" filter="url(#shadow)"/>
      <circle cx="60" cy="25" r="13" fill="#e53935" filter="url(#shadow)"/>
      <circle cx="80" cy="38" r="11" fill="#e53935" filter="url(#shadow)"/>
      <!-- seeds -->
      <g fill="#ffe082">
        <circle cx="12" cy="30" r="1"/>
        <circle cx="18" cy="36" r="1"/>
        <circle cx="58" cy="21" r="1"/>
        <circle cx="64" cy="29" r="1"/>
        <circle cx="77" cy="34" r="1"/>
        <circle cx="83" cy="41" r="1"/>
      </g>
      <!-- leaves -->
      <path d="M10,20 C20,0 40,0 50,20" fill="#43a047"/>
      <path d="M55,15 C70,-5 90,-5 100,15" fill="#43a047"/>
    </g>

    <!-- carrot (partly in soil) -->
    <g transform="translate(240,240)">
      <path d="M0,0 C20,-40 40,-40 60,0" fill="#43a047"/>
      <ellipse cx="30" cy="40" rx="16" ry="40" fill="#fb8c00" filter="url(#shadow)"/>
      <rect x="14" y="40" width="32" height="30" fill="url(#soilGrad)"/>
    </g>

    <!-- watermelon on soil -->
    <g transform="translate(10,330)" class="float">
      <ellipse cx="70" cy="0" rx="70" ry="35" fill="#1b5e20" filter="url(#shadow)"/>
      <path d="M10,-5 Q20,-30 40,-5 M30,-5 Q40,-30 60,-5 M50,-5 Q60,-30 80,-5 M70,-5 Q80,-30 100,-5"
            stroke="#2e7d32" stroke-width="6" fill="none"/>
      <ellipse cx="70" cy="-5" rx="18" ry="10" fill="url(#fruitHighlight)" class="shine"/>
    </g>

    <!-- bananas -->
    <g transform="translate(150,315)" class="float">
      <path d="M0,0 C40,-10 80,-10 100,10 C80,30 40,30 0,20 Z" fill="#fdd835" filter="url(#shadow)"/>
      <path d="M15,8 C35,0 65,2 85,15" stroke="#fbc02d" stroke-width="6" fill="none"/>
    </g>

    <!-- avocado -->
    <g transform="translate(280,320)" class="float">
      <ellipse cx="35" cy="-10" rx="30" ry="40" fill="#2e7d32" filter="url(#shadow)"/>
      <ellipse cx="35" cy="-5" rx="22" ry="28" fill="#a5d6a7"/>
      <circle cx="35" cy="-5" r="10" fill="#6d4c41"/>
      <ellipse cx="50" cy="-20" rx="12" ry="6" fill="url(#fruitHighlight)" class="shine"/>
    </g>
  </g>

  <!-- Arrow to scene 2 -->
  <path d="M400,200 C470,120 520,120 600,160" stroke="#7f8c8d" stroke-width="3" fill="none" marker-end="url(#arrowHead)"/>

  <!-- Scene 2: Shopping cart -->
  <g id="scene2" transform="translate(440,60)">
    <!-- cart body -->
    <g filter="url(#shadow)">
      <rect x="40" y="220" width="260" height="120" rx="8" fill="#eceff1" stroke="#b0bec5" stroke-width="3"/>
      <rect x="60" y="240" width="220" height="80" rx="6" fill="#ffffff" stroke="#cfd8dc" stroke-width="2"/>
      <!-- mesh lines -->
      <g stroke="#cfd8dc" stroke-width="1.5">
        <line x1="60" y1="255" x2="280" y2="255"/>
        <line x1="60" y1="270" x2="280" y2="270"/>
        <line x1="60" y1="285" x2="280" y2="285"/>
        <line x1="60" y1="300" x2="280" y2="300"/>
        <line x1="90" y1="240" x2="90" y2="320"/>
        <line x1="120" y1="240" x2="120" y2="320"/>
        <line x1="150" y1="240" x2="150" y2="320"/>
        <line x1="180" y1="240" x2="180" y2="320"/>
        <line x1="210" y1="240" x2="210" y2="320"/>
        <line x1="240" y1="240" x2="240" y2="320"/>
      </g>
      <!-- handle -->
      <rect x="290" y="210" width="12" height="30" rx="6" fill="#66bb6a"/>
      <rect x="200" y="200" width="100" height="14" rx="7" fill="#66bb6a"/>
      <!-- wheels -->
      <circle cx="100" cy="350" r="20" fill="#66bb6a"/>
      <circle cx="260" cy="350" r="20" fill="#66bb6a"/>
      <circle cx="100" cy="350" r="10" fill="#2e7d32"/>
      <circle cx="260" cy="350" r="10" fill="#2e7d32"/>
    </g>

    <!-- cart contents (fruits/veg) -->
    <g class="fadeIn" style="animation-delay:1s">
      <!-- watermelon -->
      <g transform="translate(110,270)" class="float">
        <ellipse cx="50" cy="0" rx="45" ry="22" fill="#1b5e20"/>
        <path d="M10,-3 Q18,-18 30,-3 M26,-3 Q34,-18 46,-3 M42,-3 Q50,-18 62,-3 M58,-3 Q66,-18 78,-3"
              stroke="#2e7d32" stroke-width="5" fill="none"/>
      </g>
      <!-- bananas -->
      <g transform="translate(170,260)" class="float">
        <path d="M0,0 C25,-7 50,-7 65,7 C50,20 25,20 0,14 Z" fill="#fdd835"/>
      </g>
      <!-- strawberries -->
      <g transform="translate(210,250)" class="pulse">
        <circle cx="0" cy="10" r="10" fill="#e53935"/>
        <circle cx="18" cy="14" r="10" fill="#e53935"/>
        <circle cx="-18" cy="14" r="9" fill="#e53935"/>
        <g fill="#ffe082">
          <circle cx="0" cy="14" r="1"/>
          <circle cx="18" cy="18" r="1"/>
          <circle cx="-18" cy="18" r="1"/>
        </g>
      </g>
      <!-- carrot -->
      <g transform="translate(130,245)">
        <ellipse cx="0" cy="20" rx="10" ry="25" fill="#fb8c00"/>
        <path d="M-10,0 C-2,-15 2,-15 10,0" fill="#43a047"/>
      </g>
      <!-- avocado -->
      <g transform="translate(230,275)">
        <ellipse cx="0" cy="-5" rx="16" ry="24" fill="#2e7d32"/>
        <ellipse cx="0" cy="-2" rx="12" ry="18" fill="#a5d6a7"/>
        <circle cx="0" cy="-2" r="7" fill="#6d4c41"/>
      </g>
      <!-- cherries -->
      <g transform="translate(180,245)">
        <circle cx="-10" cy="0" r="6" fill="#c62828"/>
        <circle cx="4" cy="-2" r="6" fill="#c62828"/>
        <path d="M-10,-6 C-5,-14 0,-14 4,-6" stroke="#2e7d32" stroke-width="2" fill="none"/>
        <circle cx="0" cy="-10" r="2" fill="#2e7d32"/>
      </g>
    </g>
  </g>

  <!-- Arrow to scene 3 -->
  <path d="M800,190 C870,120 920,120 1000,160" stroke="#7f8c8d" stroke-width="3" fill="none" marker-end="url(#arrowHead)"/>

  <!-- Scene 3: Packaging and home -->
  <g id="scene3" transform="translate(820,60)">
    <!-- box -->
    <g filter="url(#shadow)">
      <rect x="20" y="260" width="160" height="100" rx="6" fill="#a1887f"/>
      <rect x="20" y="240" width="160" height="30" rx="6" fill="#8d6e63"/>
      <line x1="20" y1="240" x2="180" y2="240" stroke="#6d4c41" stroke-width="3"/>
      <!-- contents peeking -->
      <g transform="translate(60,250)" class="fadeIn" style="animation-delay:1.5s">
        <ellipse cx="0" cy="30" rx="12" ry="28" fill="#fb8c00"/>
        <ellipse cx="40" cy="20" rx="14" ry="22" fill="#2e7d32"/>
        <ellipse cx="40" cy="20" rx="10" ry="16" fill="#a5d6a7"/>
        <circle cx="40" cy="20" r="6" fill="#6d4c41"/>
        <path d="M-8,10 C0,-8 10,-8 18,10" fill="#43a047"/>
        <!-- bananas -->
        <path d="M70,22 C95,15 120,15 135,30 C120,40 95,40 70,35 Z" fill="#fdd835"/>
      </g>
    </g>

    <!-- strawberry pack -->
    <g transform="translate(220,240)" filter="url(#shadow)">
      <rect x="0" y="0" width="160" height="90" rx="8" fill="#e0f2f1" stroke="#80cbc4" stroke-width="3"/>
      <rect x="0" y="-10" width="160" height="20" rx="6" fill="rgba(255,255,255,0.6)" stroke="#b2dfdb" stroke-width="2"/>
      <!-- vents -->
      <g stroke="#b2dfdb" stroke-width="2">
        <line x1="20" y1="-5" x2="40" y2="-5"/>
        <line x1="60" y1="-5" x2="80" y2="-5"/>
        <line x1="100" y1="-5" x2="120" y2="-5"/>
      </g>
      <!-- strawberries inside -->
      <g transform="translate(24,20)" class="fadeIn" style="animation-delay:2s">
        <g transform="translate(0,0)">
          <circle cx="0" cy="0" r="12" fill="#e53935"/>
          <g fill="#ffe082">
            <circle cx="-3" cy="3" r="1"/>
            <circle cx="4" cy="2" r="1"/>
            <circle cx="-1" cy="-2" r="1"/>
          </g>
        </g>
        <g transform="translate(40,10)">
          <circle cx="0" cy="0" r="12" fill="#e53935"/>
          <g fill="#ffe082">
            <circle cx="-3" cy="3" r="1"/>
            <circle cx="4" cy="2" r="1"/>
            <circle cx="-1" cy="-2" r="1"/>
          </g>
        </g>
        <g transform="translate(80,0)">
          <circle cx="0" cy="0" r="12" fill="#e53935"/>
          <g fill="#ffe082">
            <circle cx="-3" cy="3" r="1"/>
            <circle cx="4" cy="2" r="1"/>
            <circle cx="-1" cy="-2" r="1"/>
          </g>
        </g>
        <g transform="translate(20,40)">
          <circle cx="0" cy="0" r="12" fill="#e53935"/>
          <g fill="#ffe082">
            <circle cx="-3" cy="3" r="1"/>
            <circle cx="4" cy="2" r="1"/>
            <circle cx="-1" cy="-2" r="1"/>
          </g>
        </g>
      </g>
    </g>

    <!-- simple home icon -->
    <g transform="translate(420,230)" class="fadeIn" style="animation-delay:2.5s">
      <polygon points="0,40 80,-20 160,40 160,140 0,140" fill="#81c784" filter="url(#shadow)"/>
      <rect x="20" y="60" width="40" height="60" fill="#66bb6a"/>
      <rect x="100" y="70" width="40" height="40" fill="#c8e6c9"/>
      <line x1="120" y1="70" x2="120" y2="110" stroke="#a5d6a7" stroke-width="3"/>
      <line x1="100" y1="90" x2="140" y2="90" stroke="#a5d6a7" stroke-width="3"/>
      <!-- delivery wave -->
      <path d="M-40,20 Q-20,0 0,20 Q20,40 40,20" stroke="#a5d6a7" stroke-width="4" fill="none"/>
    </g>
  </g>

  <!-- Motion path animations: move items from scene1 -> cart -> home -->
  <!-- group representing items to move -->
  <g id="motion">
    <!-- ghost copies that travel along paths -->
    <!-- strawberry ghost -->
    <circle id="ghostStrawberry" cx="100" cy="100" r="10" fill="#e53935" opacity="0.0"/>
    <!-- banana ghost -->
    <path id="ghostBanana" d="M0,0 C25,-7 50,-7 65,7 C50,20 25,20 0,14 Z" fill="#fdd835" opacity="0.0" transform="translate(180,120)"/>
    <!-- avocado ghost -->
    <g id="ghostAvocado" opacity="0.0">
      <ellipse cx="0" cy="0" rx="14" ry="20" fill="#2e7d32"/>
      <ellipse cx="0" cy="2" rx="10" ry="14" fill="#a5d6a7"/>
      <circle cx="0" cy="2" r="6" fill="#6d4c41"/>
    </g>
  </g>

  <!-- Paths -->
  <path id="path1" d="M320,220 C430,140 520,140 600,180" fill="none" stroke="transparent"/>
  <path id="path2" d="M720,220 C840,140 940,140 1040,180" fill="none" stroke="transparent"/>

  <!-- Animate ghosts along paths to imply movement -->
  <animateMotion xlink:href="#ghostStrawberry" dur="4s" begin="0.5s" fill="freeze" rotate="auto">
    <mpath xlink:href="#path1"/>
  </animateMotion>
  <animate attributeName="opacity" xlink:href="#ghostStrawberry" from="0" to="1" dur="0.5s" begin="0.5s" fill="freeze"/>
  <animate attributeName="opacity" xlink:href="#ghostStrawberry" from="1" to="0" dur="0.5s" begin="3.5s" fill="freeze"/>

  <animateMotion xlink:href="#ghostBanana" dur="4s" begin="0.8s" fill="freeze" rotate="auto">
    <mpath xlink:href="#path1"/>
  </animateMotion>
  <animate attributeName="opacity" xlink:href="#ghostBanana" from="0" to="1" dur="0.5s" begin="0.8s" fill="freeze"/>
  <animate attributeName="opacity" xlink:href="#ghostBanana" from="1" to="0" dur="0.5s" begin="3.8s" fill="freeze"/>

  <animateMotion xlink:href="#ghostAvocado" dur="4s" begin="1.1s" fill="freeze" rotate="auto">
    <mpath xlink:href="#path1"/>
  </animateMotion>
  <animate attributeName="opacity" xlink:href="#ghostAvocado" from="0" to="1" dur="0.5s" begin="1.1s" fill="freeze"/>
  <animate attributeName="opacity" xlink:href="#ghostAvocado" from="1" to="0" dur="0.5s" begin="4.1s" fill="freeze"/>

  <!-- Second leg to home -->
  <circle id="ghostStrawberry2" cx="800" cy="220" r="10" fill="#e53935" opacity="0.0"/>
  <path id="ghostBanana2" d="M0,0 C25,-7 50,-7 65,7 C50,20 25,20 0,14 Z" fill="#fdd835" opacity="0.0" transform="translate(820,220)"/>
  <g id="ghostAvocado2" opacity="0.0" transform="translate(840,220)">
    <ellipse cx="0" cy="0" rx="14" ry="20" fill="#2e7d32"/>
    <ellipse cx="0" cy="2" rx="10" ry="14" fill="#a5d6a7"/>
    <circle cx="0" cy="2" r="6" fill="#6d4c41"/>
  </g>

  <animateMotion xlink:href="#ghostStrawberry2" dur="4s" begin="4.5s" fill="freeze" rotate="auto">
    <mpath xlink:href="#path2"/>
  </animateMotion>
  <animate attributeName="opacity" xlink:href="#ghostStrawberry2" from="0" to="1" dur="0.5s" begin="4.5s" fill="freeze"/>
  <animate attributeName="opacity" xlink:href="#ghostStrawberry2" from="1" to="0" dur="0.5s" begin="7.8s" fill="freeze"/>

  <animateMotion xlink:href="#ghostBanana2" dur="4s" begin="4.8s" fill="freeze" rotate="auto">
    <mpath xlink:href="#path2"/>
  </animateMotion>
  <animate attributeName="opacity" xlink:href="#ghostBanana2" from="0" to="1" dur="0.5s" begin="4.8s" fill="freeze"/>
  <animate attributeName="opacity" xlink:href="#ghostBanana2" from="1" to="0" dur="0.5s" begin="8.1s" fill="freeze"/>

  <animateMotion xlink:href="#ghostAvocado2" dur="4s" begin="5.1s" fill="freeze" rotate="auto">
    <mpath xlink:href="#path2"/>
  </animateMotion>
  <animate attributeName="opacity" xlink:href="#ghostAvocado2" from="0" to="1" dur="0.5s" begin="5.1s" fill="freeze"/>
  <animate attributeName="opacity" xlink:href="#ghostAvocado2" from="1" to="0" dur="0.5s" begin="8.4s" fill="freeze"/>

  <!-- Gentle scene-wide entrance -->
  <g>
    <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="0s" fill="freeze"/>
  </g>
</svg>
`;

const slides = [
  {
    id: "s1",
    title: "",
    subtitle: "",
    color: "#f6d365",
    image: cartifyWelcomeBanner,
    alt: "Cartify welcome showcase",
  },
  {
    id: "s2",
    title: "",
    subtitle: "",
    image: mensFashionBanner,
    color: "#7e7878ff",
    alt: "Men's fashion collection",
  },
  {
    id: "s3",
    title: "",
    subtitle: "",
    color: "#e6e2e5ff",
    image: winterSaleBanner,
    alt: "Winter sale - up to 50% off",
  },
];

const Home = ({ user, onLogout }) => {
  const [index, setIndex] = useState(0);
  const { addToCart } = useContext(CartContext);
  const { showToast } = useContext(ToastContext);
  const { isInWishlist, toggleWishlistItem } = useContext(WishlistContext);
  const [products, setProducts] = useState([]);
  const handleAddToCart = (item) => {
    addToCart(item);
    showToast("Item added to cart successfully", { type: "success" });
  };

  const handleToggleWishlist = (item) => {
    const added = toggleWishlistItem(item);
    showToast(added ? "Item added to wishlist" : "Item removed from wishlist", {
      type: added ? "success" : "error",
    });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE}/api/products`)
      .then((res) => res.json())
      .then((body) => {
        if (!mounted) return;
        if (body && body.success) setProducts(body.data || []);
        else setError("Failed to load products");
      })
      .catch((err) => mounted && setError(err.message || "Failed to load"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  return (
    <div>
      <NavBar user={user} onLogout={onLogout} />

      <main style={{ padding: "0 2rem 2rem 2rem" }}>
        {/* Carousel */}
        <section className="hero-carousel" aria-label="Featured promotions">
          <div className="hero-carousel-frame">
            {slides.map((s, i) => {
              const slideStyle = {
                left: `${(i - index) * 100}%`,
                background: s.color,
                color: s.image ? "#fff" : "#1f2933",
              };

              return (
                <div
                  key={s.id}
                  className={`hero-slide ${s.image ? "hero-slide--image" : ""}`}
                  style={slideStyle}
                >
                  {s.image && (
                    <img
                      src={s.image}
                      alt={s.alt || s.title || "Carousel slide"}
                      className="hero-slide-image"
                    />
                  )}
                  <div className="hero-slide-content">
                    {s.title && <h2>{s.title}</h2>}
                    {s.subtitle && <div>{s.subtitle}</div>}
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              aria-label="Previous slide"
              className="hero-carousel-nav hero-carousel-nav--prev"
              onClick={() =>
                setIndex((i) => (i - 1 + slides.length) % slides.length)
              }
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next slide"
              className="hero-carousel-nav hero-carousel-nav--next"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
            >
              ›
            </button>

            <div className="hero-carousel-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`hero-carousel-dot ${
                    i === index ? "is-active" : ""
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {!loading && !error && products.length > 0 && (
            <div
              className="product-strip hero-product-strip"
              role="region"
              aria-label="Quick product peek"
            >
              <div className="product-strip-track">
                {products.slice(0, 10).map((p, index) => {
                  const pid = p._id || p.id || index;
                  const { src, srcSet } = getProductImageSources(p, "small");
                  return (
                    <Link
                      to={`/products/${pid}`}
                      className="product-strip-item"
                      key={pid}
                      title={p.title || "Product"}
                    >
                      <img
                        src={src}
                        srcSet={srcSet || undefined}
                        sizes="(max-width: 768px) 25vw, 110px"
                        alt={p.title || "Product"}
                        loading="lazy"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Featured + categories */}
        <section style={{ marginTop: 24 }}>
          <h2>Featured products</h2>

          {loading && <p>Loading featured products…</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && !error && (
            <div className="featured-grid">
              <div className="featured-grid-banner">
                <img
                  src={featuredGridBanner}
                  alt="Cartify featured collection"
                  loading="lazy"
                />
              </div>
              <div className="featured-grid-content">
                {[0, 1].map((rowIndex) => (
                  <div
                    key={`featured-row-${rowIndex}`}
                    className="featured-grid-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 260px)",
                      gap: 16,
                    }}
                  >
                    {products.slice(rowIndex * 3, rowIndex * 3 + 3).map((p) => {
                      const pid = p._id || p.id;
                      const { src, srcSet } = getProductImageSources(
                        p,
                        "medium"
                      );
                      return (
                        <div
                          key={pid}
                          className="product-card"
                          style={{
                            border: "1px solid #e6e6e6",
                            borderRadius: 4,
                            padding: 12,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            position: "relative",
                            width: 260,
                            minHeight: 350,
                          }}
                        >
                          <button
                            type="button"
                            className={`wishlist-toggle ${
                              isInWishlist(pid) ? "active" : ""
                            }`}
                            aria-label={
                              isInWishlist(pid)
                                ? "Remove from wishlist"
                                : "Add to wishlist"
                            }
                            aria-pressed={isInWishlist(pid)}
                            onClick={() =>
                              handleToggleWishlist({ ...p, id: pid })
                            }
                          >
                            {isInWishlist(pid) ? (
                              <FavoriteIcon fontSize="inherit" />
                            ) : (
                              <FavoriteBorderIcon fontSize="inherit" />
                            )}
                          </button>
                          <Link
                            to={`/products/${pid}`}
                            className="product-card-link"
                            aria-label={`View details for ${
                              p.title || "product"
                            }`}
                          >
                            <div style={PRODUCT_CARD_IMAGE_WRAPPER_STYLE}>
                              <img
                                src={src}
                                srcSet={srcSet || undefined}
                                sizes="(max-width: 1024px) 45vw, 260px"
                                alt={p.title || "Product image"}
                                loading="lazy"
                                style={PRODUCT_CARD_IMAGE_STYLE}
                              />
                            </div>
                            <h3 style={{ margin: "6px 0" }}>{p.title}</h3>
                          </Link>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: 12,
                            }}
                          >
                            <strong>{formatINR(p.price)}</strong>
                            <button
                              onClick={() => handleAddToCart({ ...p, id: pid })}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 6,
                              }}
                            >
                              Add to cart
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* categories */}
          {!loading && !error && (
            <div style={{ marginTop: 28 }}>
              <section className="home-banner-card">
                <div className="home-banner-content">
                  <h3>Upgrade Your Space</h3>
                  <p>Discover curated collections tailored for your home.</p>
                </div>
                <button type="button" className="home-banner-cta">
                  Know more <span aria-hidden="true">→</span>
                </button>
              </section>

              {(() => {
                const byCat = products.reduce((acc, p) => {
                  const cat = p.category || "Uncategorized";
                  acc[cat] = acc[cat] || [];
                  acc[cat].push(p);
                  return acc;
                }, {});

                return Object.keys(byCat).map((cat) => {
                  const displayName =
                    cat === "Veg & Fruits" ? "Cartify Fresh" : cat;
                  const showDealsLink = [
                    "Dress",
                    "Appliances",
                    "Electronics",
                  ].includes(cat);
                  const categoryQuery = encodeURIComponent(cat);

                  return (
                    <section key={cat} style={{ marginTop: 20 }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: showDealsLink ? 6 : 0,
                          alignItems: "flex-start",
                          marginBottom: showDealsLink ? 12 : 8,
                        }}
                      >
                        <h3 style={{ margin: 0 }}>{displayName}</h3>
                        {showDealsLink && (
                          <Link
                            to={`/products?category=${categoryQuery}`}
                            className="home-category-deals-link"
                          >
                            see more deals →
                          </Link>
                        )}
                      </div>
                      {cat === "Veg & Fruits" && (
                        <div
                          className="veg-fruits-banner"
                          style={{ marginBottom: 16, overflowX: "auto" }}
                          dangerouslySetInnerHTML={{
                            __html: VEG_FRUITS_BANNER_SVG,
                          }}
                        />
                      )}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px,1fr))",
                          gap: 12,
                        }}
                      >
                        {byCat[cat].slice(0, 4).map((p) => {
                          const pid = p._id || p.id;
                          const { src, srcSet } = getProductImageSources(
                            p,
                            "medium"
                          );
                          return (
                            <div
                              key={pid}
                              className="product-card"
                              style={{
                                border: "1px solid #e6e6e6",
                                borderRadius: 8,
                                padding: 12,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                position: "relative",
                              }}
                            >
                              <button
                                type="button"
                                className={`wishlist-toggle ${
                                  isInWishlist(pid) ? "active" : ""
                                }`}
                                aria-label={
                                  isInWishlist(pid)
                                    ? "Remove from wishlist"
                                    : "Add to wishlist"
                                }
                                aria-pressed={isInWishlist(pid)}
                                onClick={() =>
                                  handleToggleWishlist({ ...p, id: pid })
                                }
                              >
                                {isInWishlist(pid) ? (
                                  <FavoriteIcon fontSize="inherit" />
                                ) : (
                                  <FavoriteBorderIcon fontSize="inherit" />
                                )}
                              </button>
                              <Link
                                to={`/products/${pid}`}
                                className="product-card-link"
                                aria-label={`View details for ${
                                  p.title || "product"
                                }`}
                              >
                                <div style={PRODUCT_CARD_IMAGE_WRAPPER_STYLE}>
                                  <img
                                    src={src}
                                    srcSet={srcSet || undefined}
                                    sizes="(max-width: 768px) 45vw, 220px"
                                    alt={p.title || "Product image"}
                                    loading="lazy"
                                    style={PRODUCT_CARD_IMAGE_STYLE}
                                  />
                                </div>
                                <h4 style={{ margin: "6px 0" }}>{p.title}</h4>
                              </Link>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginTop: 12,
                                }}
                              >
                                <strong>{formatINR(p.price)}</strong>
                                <button
                                  onClick={() =>
                                    handleAddToCart({ ...p, id: pid })
                                  }
                                  style={{
                                    padding: "8px 12px",
                                    borderRadius: 6,
                                  }}
                                >
                                  Add to cart
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {showDealsLink && (
                        <hr className="home-category-divider" />
                      )}
                    </section>
                  );
                });
              })()}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
