import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { Vendor, Product, Order, SplitOrder, Payout, Theme, Page, BlogPost, ThemeSection } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==========================================
// MOCK DATABASES (In-Memory Server State)
// ==========================================

let vendors: Vendor[] = [
  {
    id: 'vendor-1',
    name: 'Sylvan Craft',
    slug: 'sylvan-craft',
    stripe_account_id: 'acct_1sylvan001',
    commission_rate: 10, // 10% platform commission
    status: 'approved',
    description: 'Artisanal heirloom woodenware carved from fallen maple, walnut, and cherry trees.',
    logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=120&auto=format&fit=crop&q=60',
    bannerUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=60',
    bio: 'Each piece of Sylvan Craft woodware is hand-turned and finished with organic, food-safe oils in our rural Oregon workshop. We source our timber exclusively from local arborists and naturally fallen forest trees.',
    joinedAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'vendor-2',
    name: 'Solar Thread',
    slug: 'solar-thread',
    stripe_account_id: 'acct_2solarthread02',
    commission_rate: 12, // 12% commission
    status: 'approved',
    description: 'Upcycled technical garments and outdoor apparel utilizing high-performance recycled composites.',
    logoUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&auto=format&fit=crop&q=60',
    bannerUrl: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=60',
    bio: 'Solar Thread builds technical outerwear for conscious adventurers. By rescuing industrial textile waste, climbing ropes, and sailing canvas, we craft extreme-weather gear that keeps plastics out of oceans and you warm in the peaks.',
    joinedAt: '2026-02-10T12:30:00Z',
  },
  {
    id: 'vendor-3',
    name: 'Clay & Coast',
    slug: 'clay-and-coast',
    stripe_account_id: 'acct_3claycoast03',
    commission_rate: 15, // 15% commission
    status: 'approved',
    description: 'Minimalist hand-thrown stoneware ceramics inspired by Pacific North-West shorelines.',
    logoUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=120&auto=format&fit=crop&q=60',
    bannerUrl: 'https://images.unsplash.com/photo-1525974160448-038dcf1944da?w=800&auto=format&fit=crop&q=60',
    bio: 'Clay & Coast ceramics are born on the rugged coast. Utilizing local iron-rich clays and sea-salt reduction firing techniques, we make highly durable mugs, bowls, and pour-overs designed to bring grounding moments into daily routines.',
    joinedAt: '2026-03-01T15:45:00Z',
  }
];

let products: Product[] = [
  // Sylvan Craft (Vendor 1)
  {
    id: 'prod-101',
    title: 'Live-Edge Walnut Catchall',
    description: 'A gorgeous catchall tray milled from solid Oregon Black Walnut. Features striking sapwood borders and a smooth, food-safe beeswax finish. Perfect for keys, coins, or desk organization.',
    price: 68.00,
    imageUrl: 'https://images.unsplash.com/photo-1581428982868-e410dd047a90?w=600&auto=format&fit=crop&q=80',
    vendor_id: 'vendor-1',
    category: 'Home & Living',
    inventory: 14,
    status: 'approved',
    rating: 4.8,
    reviews: [
      { id: 'rev-1', rating: 5, comment: 'Absolutely beautiful grain! Looks incredible on my entryway console table.', customerName: 'Emilia R.', date: '2026-05-12' },
      { id: 'rev-2', rating: 4, comment: 'Great craft quality, though slightly smaller than I anticipated.', customerName: 'Julian T.', date: '2026-05-20' }
    ]
  },
  {
    id: 'prod-102',
    title: 'Hand-Turned Maple Mixing Bowl',
    description: 'Turned from a single block of Oregon Bigleaf Maple. This deep wooden bowl showcases the elegant curly wood-grain patterns. Durable enough for daily culinary use or as a dining centerpiece.',
    price: 145.00,
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&auto=format&fit=crop&q=80',
    vendor_id: 'vendor-1',
    category: 'Kitchen',
    inventory: 5,
    status: 'approved',
    rating: 5.0,
    reviews: [
      { id: 'rev-3', rating: 5, comment: 'A masterpiece. The wood feels so organic and the craft detail is amazing. Highly recommend!', customerName: 'Sophia V.', date: '2026-06-02' }
    ]
  },
  // Solar Thread (Vendor 2)
  {
    id: 'prod-201',
    title: 'Cascade Ascent Jacket',
    description: 'An ultra-light, windproof, and highly water-resistant shell designed for mountain scrambles. Engineered using upcycled ripstop sails and reinforced at the elbows with recycled climbing ropes.',
    price: 210.00,
    imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
    vendor_id: 'vendor-2',
    category: 'Apparel',
    inventory: 22,
    status: 'approved',
    rating: 4.7,
    reviews: [
      { id: 'rev-4', rating: 5, comment: 'Incredibly light and blocks the wind flawlessly. Love that it comes from recycled sails!', customerName: 'Marcus D.', date: '2026-04-18' },
      { id: 'rev-5', rating: 4, comment: 'Outstanding cut. Sleeves are a tiny bit long, but cuffs adjust nicely.', customerName: 'Aria K.', date: '2026-05-10' }
    ]
  },
  {
    id: 'prod-202',
    title: 'Summit Pack 28L',
    description: 'A fully waterproof roll-top backpack constructed from rescued marine-grade vinyl and safety webbing. Designed to handle rugged alpine treks or urban bike commutes with dedicated compartments.',
    price: 135.00,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    vendor_id: 'vendor-2',
    category: 'Accessories',
    inventory: 8,
    status: 'approved',
    rating: 4.9,
    reviews: [
      { id: 'rev-6', rating: 5, comment: 'Extremely rugged. Took it out on a heavy rainy weekend hike and everything inside stayed bone dry.', customerName: 'Ethan W.', date: '2026-06-15' }
    ]
  },
  // Clay & Coast (Vendor 3)
  {
    id: 'prod-301',
    title: 'Silt & Sea Pour-Over Set',
    description: 'A two-piece ceramic pour-over brewer and matching carafe. Glazed in a dual-tone satin-iron speckle with a deep shoreline-blue border. Designed to hold standard V60-02 filters.',
    price: 74.00,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    vendor_id: 'vendor-3',
    category: 'Kitchen',
    inventory: 18,
    status: 'approved',
    rating: 4.9,
    reviews: [
      { id: 'rev-7', rating: 5, comment: 'My morning ritual has been completely upgraded. The glaze detail is stunning.', customerName: 'Clara S.', date: '2026-05-28' }
    ]
  },
  {
    id: 'prod-302',
    title: 'Fjord Speckled Coffee Mug',
    description: 'A comfortable, stout ceramic mug with a wide handle. Features raw, textured clay on the base and a coastal gray speckled salt glaze inside and out. Holds 14 oz.',
    price: 36.00,
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0ec6?w=600&auto=format&fit=crop&q=80',
    vendor_id: 'vendor-3',
    category: 'Kitchen',
    inventory: 30,
    status: 'approved',
    rating: 4.6,
    reviews: [
      { id: 'rev-8', rating: 5, comment: 'Perfect handle size. Keeps my latte hot for ages.', customerName: 'Leo G.', date: '2026-06-08' },
      { id: 'rev-9', rating: 4, comment: 'Beautiful mug, fits comfortably in both hands. Wish they sold them in sets!', customerName: 'Nora M.', date: '2026-06-12' }
    ]
  }
];

let orders: Order[] = [
  {
    id: 'ord-9001',
    customerName: 'Prashant WeTech',
    customerEmail: 'prashantwetech@gmail.com',
    shippingAddress: '100 Sunset Blvd, Los Angeles, CA 90028',
    items: [
      {
        product: products[0], // Live-Edge Walnut Catchall (vendor-1, $68.00)
        quantity: 1
      },
      {
        product: products[4], // Silt & Sea Pour-Over Set (vendor-3, $74.00)
        quantity: 1
      }
    ],
    total: 142.00,
    status: 'processing',
    date: '2026-07-02T10:15:00Z',
    splitOrders: [
      {
        id: 'split-9001-v1',
        vendor_id: 'vendor-1',
        items: [{ product: products[0], quantity: 1 }],
        subtotal: 68.00,
        commission: 6.80, // 10%
        payoutAmount: 61.20,
        status: 'pending'
      },
      {
        id: 'split-9001-v3',
        vendor_id: 'vendor-3',
        items: [{ product: products[4], quantity: 1 }],
        subtotal: 74.00,
        commission: 11.10, // 15%
        payoutAmount: 62.90,
        status: 'pending'
      }
    ]
  }
];

let payouts: Payout[] = [
  {
    id: 'pay-001',
    vendor_id: 'vendor-1',
    amount: 122.40,
    period: 'June 2026',
    status: 'paid',
    date: '2026-06-30T23:00:00Z'
  },
  {
    id: 'pay-002',
    vendor_id: 'vendor-2',
    amount: 374.00,
    period: 'June 2026',
    status: 'paid',
    date: '2026-06-30T23:00:00Z'
  }
];

// Payload CMS Themes list
let themes: Theme[] = [
  {
    id: 'theme-forest',
    name: 'Cosmic Forest',
    primaryColor: '#2e7d32', // Emerald Forest
    secondaryColor: '#4e342e', // Deep wood brown
    backgroundColor: '#f1f8e9', // Soft light olive
    textColor: '#1b5e20', // Forest Charcoal
    fontFamily: 'serif',
    isActive: true,
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        enabled: true,
        title: 'Makers of Intentional Goods',
        subtitle: 'A collective of independent master craftsmen, offering hand-built creations designed to last a lifetime.',
        content: 'Discover heirloom woodenwares, sustainable outdoor apparel, and marine speckled stoneware fired on raw coasts.',
        buttonText: 'Explore the Collective',
        buttonLink: '#catalog',
        imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&auto=format&fit=crop&q=80'
      },
      {
        id: 'sec-collections',
        type: 'featured_collections',
        enabled: true,
        title: 'Curated Collections',
        subtitle: 'Browse authentic, small-batch releases direct from their workshops.'
      },
      {
        id: 'sec-testimonials',
        type: 'testimonials',
        enabled: true,
        title: 'Words from Conscious Spaces',
        content: '"The craftsmanship is unbelievable. You can literally smell the cedar wood and Oregon beeswax. It feels grounding to own items made with such integrity."'
      },
      {
        id: 'sec-promo',
        type: 'promo_banner',
        enabled: true,
        title: 'Meet Sylvan Craft Studio',
        subtitle: 'Watch our latest master weaver session showing raw kiln and turning techniques.',
        buttonText: 'Read Their Journey',
        buttonLink: '#blog',
        imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80'
      },
      {
        id: 'sec-footer',
        type: 'footer',
        enabled: true,
        title: 'Medusa x Payload Marketplace',
        subtitle: 'Curated and secured in self-hosted modular nodes.'
      }
    ]
  },
  {
    id: 'theme-minimalist',
    name: 'Solar Minimalist',
    primaryColor: '#e65100', // Amber
    secondaryColor: '#263238', // Charcoal
    backgroundColor: '#fafafa', // Minimal offwhite
    textColor: '#212121', // Obsidian
    fontFamily: 'sans',
    isActive: false,
    sections: [
      {
        id: 'sec-hero-min',
        type: 'hero',
        enabled: true,
        title: 'Direct From Master Hand to Yours',
        subtitle: 'Zero intermediaries. Authentic materials. Mindful scale.',
        buttonText: 'View Studio Drops',
        buttonLink: '#catalog',
        imageUrl: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1600&auto=format&fit=crop&q=80'
      },
      {
        id: 'sec-collections-min',
        type: 'featured_collections',
        enabled: true,
        title: 'Seasonal Drops',
        subtitle: 'Extremely limited stock. Pre-ordered and custom-finished.'
      },
      {
        id: 'sec-testimonials-min',
        type: 'testimonials',
        enabled: false,
        title: 'Reviews',
        content: 'Minimalist beauty and incredibly resilient.'
      },
      {
        id: 'sec-promo-min',
        type: 'promo_banner',
        enabled: true,
        title: 'Resilient Design Philosophy',
        subtitle: 'All items are backed by our lifetime materials guarantee.',
        buttonText: 'Our Manifesto',
        buttonLink: '#manifesto',
        imageUrl: 'https://images.unsplash.com/photo-1525974160448-038dcf1944da?w=1200&auto=format&fit=crop&q=80'
      },
      {
        id: 'sec-footer-min',
        type: 'footer',
        enabled: true,
        title: 'Resilient Living Co.',
        subtitle: 'Made sustainably on earth.'
      }
    ]
  },
  {
    id: 'theme-brutalist',
    name: 'Cyber Brutalist',
    primaryColor: '#ccff00', // Neon Volt Lime
    secondaryColor: '#1a1a1a', // Obsidian Charcoal
    backgroundColor: '#0a0a0a', // Dark void
    textColor: '#f5f5f5', // Clean ivory
    fontFamily: 'mono',
    isActive: false,
    sections: [
      {
        id: 'sec-hero-brut',
        type: 'hero',
        enabled: true,
        title: '[CRAFT_NET_LIVE]',
        subtitle: 'MODULAR MULTI-VENDOR NETWORKS CONVERGING COMMERCE + CONTENT.',
        buttonText: 'CATALOG.EXE',
        buttonLink: '#catalog',
        imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0ec6?w=1600&auto=format&fit=crop&q=80'
      },
      {
        id: 'sec-collections-brut',
        type: 'featured_collections',
        enabled: true,
        title: 'NODES_EXPLORE',
        subtitle: 'DIRECT WORKSHOP STREAMS.'
      },
      {
        id: 'sec-testimonials-brut',
        type: 'testimonials',
        enabled: true,
        title: 'SYSTEM_FEEDBACK',
        content: '"High functional performance. Water resistance and shell weight are optimized. Heavy brutalist design aesthetics."'
      },
      {
        id: 'sec-promo-brut',
        type: 'promo_banner',
        enabled: false,
        title: 'ZERO_WASTE_COMPOSITES',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&auto=format&fit=crop&q=80'
      },
      {
        id: 'sec-footer-brut',
        type: 'footer',
        enabled: true,
        title: 'TERMINAL_COMMERCE_v2.0',
        subtitle: 'CURATED BY PLATFORM DIRECTIVE.'
      }
    ]
  }
];

let pages: Page[] = [
  {
    id: 'page-about',
    title: 'About the Platform',
    slug: 'about',
    content: `## Bridging Commerce and Content

Welcome to the Medusa & Payload Multi-Vendor Marketplace. This application represents the ultimate convergence of headless technology:

1. **Medusa.js** manages the underlying complex commerce mechanics, cataloging variants, orchestrating inventory levels across multiple workshops, splitting unified carts into individual vendor sub-orders, and calculating automated commission rates.
2. **PayloadCMS** powers the content, managing the pages, structural blogging features, SEO schema fields, and our real-time visual Theme Builder system.

By decoupling commerce from content, we provide a lightning-fast, highly resilient marketplace experience that empowers local artisans to sell on their own terms.`,
    metaTitle: 'About Our Collective | Medusa x Payload CMS',
    metaDescription: 'Learn how we are bridging modern commerce and content with a decentralized multi-vendor marketplace.',
    published: true,
  },
  {
    id: 'page-sustainability',
    title: 'Sustainability Standard',
    slug: 'sustainability',
    content: `## Our Low-Impact Manifesto

We believe that retail should enrich communities and environments, rather than drain them. Every seller in our collective commits to our core material and labor practices:

- **Ethical Forestry**: Woodware must be turned from salvaged or certified fallen timber. No live timber is harvested for our wooden catalogs.
- **Rescued Synthetics**: Upcycled textile lines are built from high-performance industrial wastes, marine sails, or post-consumer climbing ropes.
- **Local Clays**: Clay bodies are sourced locally, reducing transport emission loads, and kiln firings are optimized using renewable community electricity credits.

By backing quality over quantity, we stand behind the durability of our catalog with life-long materials support.`,
    metaTitle: 'Sourcing Sustainably | Decoupled Commerce Collective',
    metaDescription: 'Review our materials standards and low-impact guidelines required for all approved workshop vendors.',
    published: true,
  }
];

let blogPosts: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Curating Intentional Spaces',
    slug: 'curating-intentional-spaces',
    excerpt: 'How tactile wooden objects and local shoreline ceramics create a sense of grounding in a digital world.',
    content: `We spend most of our waking hours looking at glass surfaces and digital interfaces. The pixels fly past, and with them, our attention spans. 

Curating a physical, intentional home is an act of quiet defiance. Bringing tactile, organic, and imperfect objects into our spaces grounds us in physical reality:

### The Magic of the Live-Edge Black Walnut
When you hold a catchall tray carved out of black walnut sapwood, your fingers trace the actual growth rings of a tree. You feel the grain variations, the heavy density of the hardwood, and the organic beeswax finish. These small physical touches provide a quiet sensory break that an iPad screen can never replicate.

### Sea Salt and Earthy Textures
Similarly, a coffee mug fired in sea-salt reduction retains the actual mineral textures of Pacific coasts. Its raw clay base provides an active grip, reminding us of the kiln and the master thrower's hands.

By populating our workspace and breakfast tables with items of high craftsmanship, we elevate our routines into conscious rituals.`,
    author: 'Clara S. (Clay & Coast)',
    date: '2026-06-25T10:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0ec6?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'post-2',
    title: 'Craftsmanship in the Digital Age',
    slug: 'craftsmanship-in-the-digital-age',
    excerpt: 'How modern software patterns help independent workshops scale sustainable manufacturing.',
    content: `For decades, independent workshops had to make a tough choice: sell local at farmers markets or surrender 30% to giant corporate marketplaces that buried their identity under search result ads.

With open-source, serverless, and decoupled software, the scale of power is shifting back to the creators.

### decoupled headless engines
By setting up a decoupled platform with **Medusa** on commerce and **Payload** on content, we run a unified catalog without washing away the individual branding or story of our workshops.

- **Split Order Slices**: When you checkout with a wool coat and a ceramic bowl, Medusa's split-order engine splits the transaction cleanly. The coat workshop ships immediately, while the potter prepares the glaze.
- **Dynamic Content Injection**: Payload allows creators to maintain their own mini-storefront blogs, explaining the origin of their clays and textiles, dynamically injected into the product metadata.

We are entering an era of resilient, decentralized retail—where master craftsmen don't have to become corporate SEO gurus just to share their masterpieces with the world.`,
    author: 'Sylvan Craft Workshop',
    date: '2026-07-01T09:15:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
  }
];

// ==========================================
// API ROUTES
// ==========================================

// Health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ------------------------------------------
// MEDUSA COMMERCE API
// ------------------------------------------

// Get all vendors
app.get('/api/medusa/vendors', (req, res) => {
  res.json(vendors);
});

// Register a new vendor
app.post('/api/medusa/vendors/register', (req, res) => {
  const { name, description, stripe_account_id, commission_rate, logoUrl, bannerUrl, bio } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and Description are required.' });
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newVendor: Vendor = {
    id: `vendor-${Date.now()}`,
    name,
    slug,
    stripe_account_id: stripe_account_id || `acct_sim_${Math.random().toString(36).substring(7)}`,
    commission_rate: commission_rate ? Number(commission_rate) : 10,
    status: 'approved', // Auto-approve for demo convenience
    description,
    logoUrl: logoUrl || 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=120&auto=format&fit=crop&q=60',
    bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=60',
    bio: bio || `Welcome to ${name}! We craft incredible items with care and attention to detail.`,
    joinedAt: new Date().toISOString(),
  };
  vendors.push(newVendor);
  res.status(201).json(newVendor);
});

// Get products
app.get('/api/medusa/products', (req, res) => {
  const { vendor_id, category, status } = req.query;
  let filtered = [...products];
  if (vendor_id) {
    filtered = filtered.filter(p => p.vendor_id === vendor_id);
  }
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  if (status) {
    filtered = filtered.filter(p => p.status === status);
  } else {
    // By default, only show approved products to visitors
    filtered = filtered.filter(p => p.status === 'approved' || p.status === 'pending_approval');
  }
  res.json(filtered);
});

// Add new product
app.post('/api/medusa/products', (req, res) => {
  const { title, description, price, imageUrl, vendor_id, category, inventory } = req.body;
  if (!title || !price || !vendor_id || !category) {
    return res.status(400).json({ error: 'Title, Price, Vendor ID, and Category are required.' });
  }
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    title,
    description: description || '',
    price: Number(price),
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    vendor_id,
    category,
    inventory: inventory ? Number(inventory) : 10,
    status: 'approved', // Auto-approve for seamless simulation
    rating: 5.0,
    reviews: []
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Edit product
app.put('/api/medusa/products/:id', (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const current = products[index];
  products[index] = {
    ...current,
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : current.price,
    inventory: req.body.inventory !== undefined ? Number(req.body.inventory) : current.inventory,
  };
  res.json(products[index]);
});

// Delete product
app.delete('/api/medusa/products/:id', (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  products.splice(index, 1);
  res.json({ success: true });
});

// Add Review
app.post('/api/medusa/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { rating, comment, customerName } = req.body;
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const review = {
    id: `rev-${Date.now()}`,
    rating: Number(rating) || 5,
    comment: comment || '',
    customerName: customerName || 'Verified Buyer',
    date: new Date().toISOString().split('T')[0]
  };
  product.reviews.push(review);
  
  // Recalculate average rating
  const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = Number((totalRating / product.reviews.length).toFixed(1));
  
  res.status(201).json(review);
});

// Submit a multi-vendor Order (Orders splitting and commission calculations!)
app.post('/api/medusa/orders', (req, res) => {
  const { customerName, customerEmail, shippingAddress, items } = req.body;
  if (!customerName || !customerEmail || !items || !items.length) {
    return res.status(400).json({ error: 'Customer and cart items details are required.' });
  }

  // Double check item stocks and fetch full product structures
  const orderItems = items.map((item: any) => {
    const product = products.find(p => p.id === item.product_id);
    if (!product) throw new Error(`Product ${item.product_id} not found.`);
    // Reduce inventory safely
    product.inventory = Math.max(0, product.inventory - item.quantity);
    return {
      product,
      quantity: item.quantity
    };
  });

  const grandTotal = orderItems.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);

  // Split Order by Vendor
  const itemsByVendor: { [vendorId: string]: any[] } = {};
  orderItems.forEach((item: any) => {
    const vId = item.product.vendor_id;
    if (!itemsByVendor[vId]) itemsByVendor[vId] = [];
    itemsByVendor[vId].push(item);
  });

  const splitOrders: SplitOrder[] = Object.keys(itemsByVendor).map(vendorId => {
    const vItems = itemsByVendor[vendorId];
    const subtotal = vItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    // Find vendor to fetch commission rate
    const vendor = vendors.find(v => v.id === vendorId);
    const commRate = vendor ? vendor.commission_rate : 10;
    const commission = Number((subtotal * (commRate / 100)).toFixed(2));
    const payoutAmount = Number((subtotal - commission).toFixed(2));

    return {
      id: `split-${Date.now()}-${vendorId}`,
      vendor_id: vendorId,
      items: vItems,
      subtotal,
      commission,
      payoutAmount,
      status: 'pending'
    };
  });

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    customerName,
    customerEmail,
    shippingAddress,
    items: orderItems,
    total: grandTotal,
    status: 'pending',
    date: new Date().toISOString(),
    splitOrders
  };

  orders.unshift(newOrder); // Add to the top of list
  res.status(201).json(newOrder);
});

// Get all orders (Platform Admin)
app.get('/api/medusa/orders', (req, res) => {
  res.json(orders);
});

// Get orders for a specific Vendor
app.get('/api/medusa/vendors/:vendorId/orders', (req, res) => {
  const { vendorId } = req.params;
  
  // Filter and build a view of sub-orders belonging to this vendor
  const vendorSuborders = orders.filter(o => 
    o.splitOrders.some(so => so.vendor_id === vendorId)
  ).map(o => {
    const splitRecord = o.splitOrders.find(so => so.vendor_id === vendorId)!;
    return {
      orderId: o.id,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      date: o.date,
      overallStatus: o.status,
      splitOrderId: splitRecord.id,
      items: splitRecord.items,
      subtotal: splitRecord.subtotal,
      commission: splitRecord.commission,
      payoutAmount: splitRecord.payoutAmount,
      splitStatus: splitRecord.status
    };
  });
  
  res.json(vendorSuborders);
});

// Update vendor sub-order status
app.put('/api/medusa/vendors/:vendorId/orders/:splitOrderId/status', (req, res) => {
  const { vendorId, splitOrderId } = req.params;
  const { status } = req.body; // 'shipped' | 'paid' etc.
  
  let found = false;
  orders.forEach(o => {
    const splitIndex = o.splitOrders.findIndex(so => so.id === splitOrderId && so.vendor_id === vendorId);
    if (splitIndex !== -1) {
      o.splitOrders[splitIndex].status = status;
      found = true;
      
      // If all split orders are shipped, update main order status
      if (o.splitOrders.every(so => so.status === 'shipped')) {
        o.status = 'shipped';
      }
    }
  });

  if (!found) {
    return res.status(404).json({ error: 'Split order not found' });
  }
  res.json({ success: true });
});

// Get vendor payouts
app.get('/api/medusa/vendors/:vendorId/payouts', (req, res) => {
  const { vendorId } = req.params;
  const vendorPayouts = payouts.filter(p => p.vendor_id === vendorId);
  res.json(vendorPayouts);
});

// Claim payout
app.post('/api/medusa/vendors/:vendorId/payouts/claim', (req, res) => {
  const { vendorId } = req.params;
  const { amount } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Valid claim amount is required.' });
  }

  const newPayout: Payout = {
    id: `pay-${Date.now()}`,
    vendor_id: vendorId,
    amount: Number(amount),
    period: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    status: 'paid', // Simulate automated quick Stripe payout transfer
    date: new Date().toISOString()
  };

  payouts.unshift(newPayout);
  res.status(201).json(newPayout);
});

// Get Admin analytics dashboard data
app.get('/api/medusa/analytics', (req, res) => {
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCommissions = orders.reduce((sum, o) => 
    sum + o.splitOrders.reduce((s, so) => s + so.commission, 0), 0);
  
  const vendorPerformance = vendors.map(v => {
    const vendorSuborders = orders.filter(o => o.splitOrders.some(so => so.vendor_id === v.id));
    const sales = vendorSuborders.reduce((sum, o) => {
      const so = o.splitOrders.find(s => s.vendor_id === v.id)!;
      return sum + so.subtotal;
    }, 0);
    const commCollected = vendorSuborders.reduce((sum, o) => {
      const so = o.splitOrders.find(s => s.vendor_id === v.id)!;
      return sum + so.commission;
    }, 0);

    return {
      vendorId: v.id,
      vendorName: v.name,
      sales,
      commission: commCollected,
      orderCount: vendorSuborders.length
    };
  });

  res.json({
    totalSales,
    totalCommissions,
    totalOrders: orders.length,
    totalVendors: vendors.length,
    vendorPerformance
  });
});

// ------------------------------------------
// PAYLOAD CMS API
// ------------------------------------------

// Get all themes
app.get('/api/payload/themes', (req, res) => {
  res.json(themes);
});

// Get active theme configuration
app.get('/api/payload/themes/active', (req, res) => {
  const active = themes.find(t => t.isActive);
  res.json(active || themes[0]);
});

// Set active theme
app.post('/api/payload/themes/active/:id', (req, res) => {
  const { id } = req.params;
  const exists = themes.some(t => t.id === id);
  if (!exists) {
    return res.status(404).json({ error: 'Theme not found.' });
  }
  themes = themes.map(t => ({
    ...t,
    isActive: t.id === id
  }));
  const active = themes.find(t => t.isActive);
  res.json(active);
});

// Update theme blocks/styling (Live Shopify-style Customizer endpoint!)
app.put('/api/payload/themes/:id', (req, res) => {
  const { id } = req.params;
  const index = themes.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Theme not found.' });
  }
  
  const current = themes[index];
  themes[index] = {
    ...current,
    ...req.body,
    // ensure ID is preserved
    id: current.id
  };
  res.json(themes[index]);
});

// Get all pages
app.get('/api/payload/pages', (req, res) => {
  res.json(pages);
});

// Create/Edit Page
app.post('/api/payload/pages', (req, res) => {
  const { title, slug, content, metaTitle, metaDescription } = req.body;
  if (!title || !slug || !content) {
    return res.status(400).json({ error: 'Title, slug, and content are required' });
  }
  const newPage: Page = {
    id: `page-${Date.now()}`,
    title,
    slug,
    content,
    metaTitle: metaTitle || `${title} | Medusa Collective`,
    metaDescription: metaDescription || `Discover the finest sustainable works from local master crafters on our multi-vendor site.`,
    published: true
  };
  pages.push(newPage);
  res.status(201).json(newPage);
});

app.put('/api/payload/pages/:id', (req, res) => {
  const { id } = req.params;
  const idx = pages.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Page not found' });
  }
  pages[idx] = {
    ...pages[idx],
    ...req.body
  };
  res.json(pages[idx]);
});

// Get blog posts
app.get('/api/payload/posts', (req, res) => {
  res.json(blogPosts);
});

// Create/Edit Blog
app.post('/api/payload/posts', (req, res) => {
  const { title, excerpt, content, author, imageUrl } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and Content are required.' });
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newPost: BlogPost = {
    id: `post-${Date.now()}`,
    title,
    slug,
    excerpt: excerpt || content.substring(0, 150) + '...',
    content,
    author: author || 'Platform Editor',
    date: new Date().toISOString(),
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80'
  };
  blogPosts.unshift(newPost);
  res.status(201).json(newPost);
});

app.put('/api/payload/posts/:id', (req, res) => {
  const { id } = req.params;
  const idx = blogPosts.findIndex(p => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  blogPosts[idx] = {
    ...blogPosts[idx],
    ...req.body
  };
  res.json(blogPosts[idx]);
});

// ------------------------------------------
// GEMINI AI CO-PILOT
// ------------------------------------------

app.post('/api/copilot/generate', async (req, res) => {
  const { mode, prompt, context } = req.body; // modes: 'seo', 'blog', 'hero', 'theme-suggestion'
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  // Define structured schemas to retrieve perfect structural JSON outputs from Gemini
  try {
    if (!ai) {
      // High-Fidelity Local Simulation fallback if GEMINI_API_KEY is not defined
      console.log("No GEMINI_API_KEY defined. Generating mock intelligent response.");
      if (mode === 'theme-suggestion') {
        const lowerPrompt = prompt.toLowerCase();
        let palette = { primary: '#0f766e', secondary: '#0f172a', background: '#f8fafc', text: '#334155', font: 'sans', headline: 'Bespoke Goods Built to Ground You' };
        if (lowerPrompt.includes('forest') || lowerPrompt.includes('autumn') || lowerPrompt.includes('wood')) {
          palette = { primary: '#854d0e', secondary: '#451a03', background: '#fefcfb', text: '#27272a', font: 'serif', headline: 'Carved out of Native Timber' };
        } else if (lowerPrompt.includes('ocean') || lowerPrompt.includes('coast') || lowerPrompt.includes('blue') || lowerPrompt.includes('sea')) {
          palette = { primary: '#0369a1', secondary: '#1e293b', background: '#f0f9ff', text: '#1e3a8a', font: 'serif', headline: 'Fired by Seaglass and Waves' };
        } else if (lowerPrompt.includes('neon') || lowerPrompt.includes('cyber') || lowerPrompt.includes('dark')) {
          palette = { primary: '#00ffcc', secondary: '#111111', background: '#050505', text: '#fafafa', font: 'mono', headline: '[NODE_STATION_LAUNCHED]' };
        }
        return res.json(palette);
      } else if (mode === 'seo') {
        return res.json({
          metaTitle: `${prompt} | Handcrafted Sustainable Goods`,
          metaDescription: `Discover the finest premium ${prompt.toLowerCase()} created sustainably by our network of independent workshop masters. Highly durable and hand-tested.`,
          tags: ['Handcrafted', 'Sustainable', 'Artisanal', 'Organic']
        });
      } else if (mode === 'blog') {
        return res.json({
          title: `The Story of Handcrafted ${prompt}`,
          slug: prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          excerpt: `A look behind the artisanal curtains to learn how master crafters formulate premium designs from raw elements.`,
          content: `## The Art of Conscious Creation\n\nWhen we talk about "${prompt}", we are looking at more than just a consumer good. We are observing the physical convergence of hours of human attention, refined workshop methodologies, and raw organic ingredients.\n\n### The Creator's Lens\nEvery piece carries a silent testament. Our artisan shops work directly with raw materials sourced sustainably from neighboring coastal beds, fallen timbers, or upcycled sail arrays. There are no corporate boardrooms setting quarterly margins; there is only a dedication to longevity and quality.\n\nWe hope this item adds a moment of intentional grounding to your active life.`
        });
      } else {
        return res.json({
          headline: `A New Era of ${prompt}`,
          subtitle: 'Sustainable drops hand-turned and salt-fired in local workshops.',
          buttonText: 'Acquire Drop'
        });
      }
    }

    // Call actual Gemini API if key is present
    if (mode === 'theme-suggestion') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Create a structural theme aesthetic based on this style request: "${prompt}". Suggest HEX colors and a headline. Respond in JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primary: { type: Type.STRING, description: 'HEX code of primary color (e.g. #0f766e)' },
              secondary: { type: Type.STRING, description: 'HEX code of secondary color' },
              background: { type: Type.STRING, description: 'HEX code of canvas background color (light warm colors work best)' },
              text: { type: Type.STRING, description: 'HEX code of body text color' },
              font: { type: Type.STRING, description: 'Select either "sans", "serif", or "mono"' },
              headline: { type: Type.STRING, description: 'High converting, atmospheric hero headline matching this theme (under 6 words)' }
            },
            required: ['primary', 'secondary', 'background', 'text', 'font', 'headline']
          }
        }
      });
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else if (mode === 'seo') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Generate SEO titles, descriptions, and tag descriptors for a product named: "${prompt}" with details: "${context || ''}". Respond in JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metaTitle: { type: Type.STRING, description: 'High clickability SEO title under 60 chars' },
              metaDescription: { type: Type.STRING, description: 'Compelling SEO meta description under 150 chars' },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 or 4 relevant single-word product tags'
              }
            },
            required: ['metaTitle', 'metaDescription', 'tags']
          }
        }
      });
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else if (mode === 'blog') {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Write a beautifully written blog post about: "${prompt}". Introduce artisan concepts, sustainable practices, and mindfulness. Context: "${context || ''}". Respond in JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Poetic, striking title' },
              slug: { type: Type.STRING, description: 'URL friendly slug' },
              excerpt: { type: Type.STRING, description: 'Engaging teaser under 100 characters' },
              content: { type: Type.STRING, description: 'Rich markdown formatted blog body' }
            },
            required: ['title', 'slug', 'excerpt', 'content']
          }
        }
      });
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      // Hero Copy Mode
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Create short high-converting hero headlines, subtitles, and CTA button copy for a marketplace focusing on: "${prompt}". Respond in JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: 'Stunning display title' },
              subtitle: { type: Type.STRING, description: 'Deep descriptive subtitle under 15 words' },
              buttonText: { type: Type.STRING, description: 'Dynamic call to action under 4 words' }
            },
            required: ['headline', 'subtitle', 'buttonText']
          }
        }
      });
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    }
  } catch (err: any) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: 'Failed to generate content using AI. Please try again.', details: err.message });
  }
});

// ==========================================
// VITE CLIENT INTEGRATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
