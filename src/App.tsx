import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Settings, 
  BookOpen, 
  Palette, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Truck,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
  ExternalLink,
  RefreshCw,
  Sliders,
  Send,
  Eye
} from 'lucide-react';
import { Vendor, Product, Order, SplitOrder, Payout, Theme, Page, BlogPost, ThemeSection, CartItem } from './types';

export default function App() {
  // Navigation & Global States
  const [activeTab, setActiveTab] = useState<'shop' | 'vendor' | 'admin' | 'cms' | 'theme' | 'copilot'>('shop');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Core Data States (Linked directly to Medusa & Payload APIs)
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Shop States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: 'Prashant WeTech',
    email: 'prashantwetech@gmail.com',
    address: '100 Sunset Blvd, Los Angeles, CA 90028'
  });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', customerName: '' });

  // Vendor Space States
  const [selectedVendorSpace, setSelectedVendorSpace] = useState<string>('vendor-1');
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [vendorPayouts, setVendorPayouts] = useState<Payout[]>([]);
  const [newProductForm, setNewProductForm] = useState({
    title: '', description: '', price: '', imageUrl: '', category: 'Kitchen', inventory: '10'
  });
  const [editProductForm, setEditProductForm] = useState<Product | null>(null);
  const [payoutClaimAmount, setPayoutClaimAmount] = useState('');
  
  // Vendor Registration Form
  const [registerForm, setRegisterForm] = useState({
    name: '', description: '', stripeAccount: '', commission: '10', bio: ''
  });

  // CMS States
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '', content: '', metaTitle: '', metaDescription: '' });
  const [newPostForm, setNewPostForm] = useState({ title: '', content: '', excerpt: '', author: '', imageUrl: '' });

  // AI Copilot States
  const [copilotMode, setCopilotMode] = useState<'theme-suggestion' | 'seo' | 'blog'>('theme-suggestion');
  const [copilotPrompt, setCopilotPrompt] = useState('An organic, calming woodshop atmosphere with warm amber accents');
  const [copilotContext, setCopilotContext] = useState('');
  const [copilotResult, setCopilotResult] = useState<any>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  // ==========================================
  // API INTEGRATION HANDLERS
  // ==========================================

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAnalytics();
    }
    if (activeTab === 'vendor') {
      fetchVendorDetails(selectedVendorSpace);
    }
  }, [activeTab, selectedVendorSpace]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resVendors, resProducts, resThemes, resActiveTheme, resPages, resPosts] = await Promise.all([
        fetch('/api/medusa/vendors').then(r => r.json()),
        fetch('/api/medusa/products').then(r => r.json()),
        fetch('/api/payload/themes').then(r => r.json()),
        fetch('/api/payload/themes/active').then(r => r.json()),
        fetch('/api/payload/pages').then(r => r.json()),
        fetch('/api/payload/posts').then(r => r.json()),
      ]);

      setVendors(resVendors);
      setProducts(resProducts);
      setThemes(resThemes);
      setActiveTheme(resActiveTheme);
      setPages(resPages);
      setPosts(resPosts);
    } catch (err) {
      console.error('Error loading initial data:', err);
      showToast('Error downloading resources from decoupled backends.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/medusa/products').then(r => r.json());
      setProducts(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVendorDetails = async (vId: string) => {
    try {
      const [resOrders, resPayouts] = await Promise.all([
        fetch(`/api/medusa/vendors/${vId}/orders`).then(r => r.json()),
        fetch(`/api/medusa/vendors/${vId}/payouts`).then(r => r.json())
      ]);
      setVendorOrders(resOrders);
      setVendorPayouts(resPayouts);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/medusa/analytics').then(r => r.json());
      setAnalytics(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.description) return;
    try {
      const res = await fetch('/api/medusa/vendors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          description: registerForm.description,
          stripe_account_id: registerForm.stripeAccount,
          commission_rate: registerForm.commission,
          bio: registerForm.bio
        })
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`Vendor "${data.name}" successfully registered!`, 'success');
        setRegisterForm({ name: '', description: '', stripeAccount: '', commission: '10', bio: '' });
        fetchInitialData();
      }
    } catch (err) {
      showToast('Registration failed.', 'error');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.title || !newProductForm.price) return;
    try {
      const res = await fetch('/api/medusa/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProductForm,
          vendor_id: selectedVendorSpace
        })
      });
      if (res.ok) {
        showToast('Product launched successfully to Medusa Catalog!', 'success');
        setNewProductForm({ title: '', description: '', price: '', imageUrl: '', category: 'Kitchen', inventory: '10' });
        fetchProducts();
        fetchVendorDetails(selectedVendorSpace);
      }
    } catch (err) {
      showToast('Launch failed.', 'error');
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductForm) return;
    try {
      const res = await fetch(`/api/medusa/products/${editProductForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProductForm)
      });
      if (res.ok) {
        showToast('Product updated successfully!', 'success');
        setEditProductForm(null);
        fetchProducts();
        fetchVendorDetails(selectedVendorSpace);
      }
    } catch (err) {
      showToast('Edit failed.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      const res = await fetch(`/api/medusa/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Product removed from listing.', 'success');
        fetchProducts();
        fetchVendorDetails(selectedVendorSpace);
      }
    } catch (err) {
      showToast('Deletion failed.', 'error');
    }
  };

  const handleShipSuborder = async (splitOrderId: string) => {
    try {
      const res = await fetch(`/api/medusa/vendors/${selectedVendorSpace}/orders/${splitOrderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' })
      });
      if (res.ok) {
        showToast('Sub-order marked as Shipped! Notification sent to master queue.', 'success');
        fetchVendorDetails(selectedVendorSpace);
        fetchAnalytics();
      }
    } catch (err) {
      showToast('Status update failed.', 'error');
    }
  };

  const handleClaimPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payoutClaimAmount);
    if (!amt || amt <= 0) return;
    try {
      const res = await fetch(`/api/medusa/vendors/${selectedVendorSpace}/payouts/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt })
      });
      if (res.ok) {
        showToast(`Stripe instant payout of $${amt.toFixed(2)} transferred successfully!`, 'success');
        setPayoutClaimAmount('');
        fetchVendorDetails(selectedVendorSpace);
      }
    } catch (err) {
      showToast('Payout transfer failed.', 'error');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !reviewForm.comment) return;
    try {
      const res = await fetch(`/api/medusa/products/${selectedProduct.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });
      if (res.ok) {
        showToast('Thank you! Review published directly to Medusa product node.', 'success');
        setReviewForm({ rating: 5, comment: '', customerName: '' });
        // Refresh product in view
        const updatedProducts = await fetch('/api/medusa/products').then(r => r.json());
        setProducts(updatedProducts);
        const refetchedProd = updatedProducts.find((p: Product) => p.id === selectedProduct.id);
        if (refetchedProd) {
          setSelectedProduct(refetchedProd);
        }
      }
    } catch (err) {
      showToast('Failed to submit review.', 'error');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;
    try {
      const itemsPayload = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));
      const res = await fetch('/api/medusa/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: checkoutForm.name,
          customerEmail: checkoutForm.email,
          shippingAddress: checkoutForm.address,
          items: itemsPayload
        })
      });
      if (res.ok) {
        const orderData = await res.json();
        showToast('Checkout Complete! Order successfully split across workshops.', 'success');
        setCart([]);
        setIsCheckoutOpen(false);
        fetchProducts(); // Refresh stocks
        // Switch tab to look at order splits visually
        setActiveTab('admin');
      }
    } catch (err) {
      showToast('Checkout failed.', 'error');
    }
  };

  const handleActivateTheme = async (themeId: string) => {
    try {
      const res = await fetch(`/api/payload/themes/active/${themeId}`, { method: 'POST' });
      if (res.ok) {
        const newTheme = await res.json();
        setActiveTheme(newTheme);
        showToast(`CMS theme changed to "${newTheme.name}"!`, 'success');
      }
    } catch (err) {
      showToast('Theme change failed.', 'error');
    }
  };

  const handleUpdateThemeSection = async (sectionId: string, updatedFields: Partial<ThemeSection>) => {
    if (!activeTheme) return;
    const updatedSections = activeTheme.sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, ...updatedFields };
      }
      return s;
    });
    try {
      const res = await fetch(`/api/payload/themes/${activeTheme.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections })
      });
      if (res.ok) {
        const freshTheme = await res.json();
        setActiveTheme(freshTheme);
        // also update theme array
        setThemes(themes.map(t => t.id === freshTheme.id ? freshTheme : t));
        showToast('Section configurations persisted to PayloadCMS!', 'success');
      }
    } catch (err) {
      showToast('Theme update failed.', 'error');
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageForm.title || !newPageForm.slug || !newPageForm.content) return;
    try {
      const res = await fetch('/api/payload/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPageForm)
      });
      if (res.ok) {
        showToast('CMS Custom Page published successfully!', 'success');
        setNewPageForm({ title: '', slug: '', content: '', metaTitle: '', metaDescription: '' });
        const updatedPages = await fetch('/api/payload/pages').then(r => r.json());
        setPages(updatedPages);
      }
    } catch (err) {
      showToast('Page publish failed.', 'error');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostForm.title || !newPostForm.content) return;
    try {
      const res = await fetch('/api/payload/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostForm)
      });
      if (res.ok) {
        showToast('CMS Blog post published successfully!', 'success');
        setNewPostForm({ title: '', content: '', excerpt: '', author: '', imageUrl: '' });
        const updatedPosts = await fetch('/api/payload/posts').then(r => r.json());
        setPosts(updatedPosts);
      }
    } catch (err) {
      showToast('Post publish failed.', 'error');
    }
  };

  const runAiCopilot = async () => {
    if (!copilotPrompt) return;
    setAiGenerating(true);
    setCopilotResult(null);
    try {
      const res = await fetch('/api/copilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: copilotMode,
          prompt: copilotPrompt,
          context: copilotContext
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCopilotResult(data);
        showToast('AI suggestions successfully structured!', 'success');
      }
    } catch (err) {
      showToast('AI generation errored out.', 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAiThemeSuggestion = async () => {
    if (!copilotResult || !activeTheme) return;
    const { primary, secondary, background, text, font, headline } = copilotResult;
    
    // Update active theme sections & core styling on Payload CMS
    const updatedSections = activeTheme.sections.map(s => {
      if (s.type === 'hero') {
        return { ...s, title: headline || s.title };
      }
      return s;
    });

    try {
      const res = await fetch(`/api/payload/themes/${activeTheme.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor: primary,
          secondaryColor: secondary,
          backgroundColor: background,
          textColor: text,
          fontFamily: font,
          sections: updatedSections
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTheme(updated);
        setThemes(themes.map(t => t.id === updated.id ? updated : t));
        showToast('AI color palette & headline applied to CMS theme!', 'success');
        setActiveTab('shop'); // view results instantly!
      }
    } catch (err) {
      showToast('Failed to apply custom styles.', 'error');
    }
  };

  // ==========================================
  // HELPER ACTIONS & COMPONENT DRAWERS
  // ==========================================

  const showToast = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const addToCart = (product: Product) => {
    if (product.inventory <= 0) {
      showToast('Product out of stock!', 'error');
      return;
    }
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: Math.min(product.inventory, item.quantity + 1) } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    showToast(`"${product.title}" added to checkout cart.`, 'success');
  };

  const removeFromCart = (pId: string) => {
    setCart(cart.filter(item => item.product.id !== pId));
  };

  const getCartTotal = () => {
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    return Number(total.toFixed(2));
  };

  // Format dynamic CSS variables depending on Payload's active theme configuration
  const themeStyles = {
    '--theme-primary': activeTheme?.primaryColor || '#2e7d32',
    '--theme-secondary': activeTheme?.secondaryColor || '#4e342e',
    '--theme-bg': activeTheme?.backgroundColor || '#f1f8e9',
    '--theme-text': activeTheme?.textColor || '#1b5e20',
    fontFamily: activeTheme?.fontFamily === 'serif' ? '"Lora", Georgia, serif' : activeTheme?.fontFamily === 'mono' ? '"JetBrains Mono", monospace' : '"Inter", sans-serif'
  } as React.CSSProperties;

  return (
    <div className="w-full min-h-screen bg-grid bg-[#050505] text-zinc-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* GLOBAL NOTIFICATION ALERTS */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-zinc-900 border border-green-500/40 text-green-400 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in max-w-md">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-6 right-6 z-50 bg-zinc-900 border border-red-500/40 text-red-400 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in max-w-md">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* HEADER SECTION (Aesthetic Bold Theme) */}
      <header className="border-b border-white/10 p-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black uppercase tracking-tight text-white">Medusa</span>
              <span className="text-zinc-500 font-light font-sans">×</span>
              <span className="text-xl font-black uppercase tracking-tight text-purple-400">Payload</span>
            </div>
            <p className="mono text-[10px] uppercase tracking-widest text-zinc-400">Environment: Full-Stack Container / Live</p>
          </div>
        </div>

        {/* NAVIGATION RAIL */}
        <nav className="flex flex-wrap items-center gap-2">
          {[
            { id: 'shop', label: 'Marketplace', icon: ShoppingBag },
            { id: 'vendor', label: 'Vendor Portal', icon: Store },
            { id: 'admin', label: 'Platform Control', icon: Settings },
            { id: 'cms', label: 'CMS & Blogs', icon: BookOpen },
            { id: 'theme', label: 'Theme Builder', icon: Palette },
            { id: 'copilot', label: 'Gemini Co-Pilot', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedProduct(null);
                  setSelectedBlogPost(null);
                  setSelectedPage(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-bold transition-all duration-150 ${
                  active 
                    ? 'bg-white text-black shadow-lg rounded-md' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* CORE DISPLAY STAGE */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
        
        {/* ==========================================
            TAB 1: SHOPPING CATALOG (CUSTOMER VIEW)
            ========================================== */}
        {activeTab === 'shop' && (
          <div style={themeStyles} className="transition-all duration-300">
            
            {/* RENDER ACTIVE BLOCK SECTIONS FROM PAYLOAD CMS */}
            {activeTheme?.sections.filter(s => s.enabled).map(section => {
              if (section.type === 'hero') {
                return (
                  <div key={section.id} className="relative rounded-3xl overflow-hidden mb-12 border-outline min-h-[420px] flex items-center bg-zinc-900/40">
                    <div className="absolute inset-0 z-0 bg-cover bg-center opacity-20 filter grayscale" style={{ backgroundImage: `url(${section.imageUrl})` }}></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-0"></div>
                    <div className="relative z-10 px-8 py-16 md:p-16 max-w-2xl">
                      <span className="mono text-xs uppercase tracking-[0.3em] font-bold mb-4 block underline underline-offset-8" style={{ color: 'var(--theme-primary)' }}>
                        Payload Decoupled Content
                      </span>
                      <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6 leading-tight">
                        {section.title}
                      </h1>
                      <p className="text-zinc-300 font-medium text-lg mb-4">{section.subtitle}</p>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-8">{section.content}</p>
                      {section.buttonText && (
                        <a 
                          href={section.buttonText.includes('Explore') ? '#catalog' : section.buttonLink} 
                          className="inline-block px-8 py-4 font-black uppercase tracking-widest text-xs transition-colors"
                          style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                        >
                          {section.buttonText}
                        </a>
                      )}
                    </div>
                  </div>
                );
              }

              if (section.type === 'testimonials') {
                return (
                  <div key={section.id} className="border-outline bg-zinc-950/80 p-8 md:p-12 rounded-3xl mb-12 text-center relative overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-64 h-64 opacity-10 rounded-full blur-[80px]" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
                    <div className="relative z-10 max-w-3xl mx-auto">
                      <span className="mono text-xs uppercase tracking-widest text-zinc-500 mb-3 block">{section.title}</span>
                      <p className="text-xl md:text-2xl font-light italic text-zinc-200 leading-relaxed">
                        {section.content}
                      </p>
                      <div className="w-12 h-1 mx-auto my-6" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
                      <p className="text-zinc-400 mono text-xs uppercase tracking-widest">Handmade Sourcing Pledge Verified</p>
                    </div>
                  </div>
                );
              }

              if (section.type === 'promo_banner') {
                return (
                  <div key={section.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 rounded-3xl overflow-hidden mb-12 border-outline bg-zinc-950">
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <span className="mono text-xs uppercase tracking-widest text-zinc-500 mb-2">Featured Workshop Focus</span>
                      <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-4">{section.title}</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed mb-6">{section.subtitle}</p>
                      {section.buttonText && (
                        <button 
                          onClick={() => {
                            // Find the Sylvan Craft woodshop
                            const sylvan = vendors.find(v => v.slug === 'sylvan-craft');
                            if (sylvan) {
                              setSelectedVendorId(sylvan.id);
                              document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="self-start px-6 py-3 font-bold uppercase tracking-widest text-[10px] bg-white text-black hover:bg-zinc-200 transition-colors"
                        >
                          {section.buttonText}
                        </button>
                      )}
                    </div>
                    <div className="bg-cover bg-center h-64 md:h-auto" style={{ backgroundImage: `url(${section.imageUrl})` }}></div>
                  </div>
                );
              }
              return null;
            })}

            {/* UNIFIED PRODUCT CATALOG & DECOUPLED FILTER CONTROLS */}
            <div id="catalog" className="scroll-mt-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* FILTER RAIL */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 mb-4 pb-2 border-b border-zinc-800">
                    Filter Category
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {['All', 'Kitchen', 'Home & Living', 'Apparel', 'Accessories'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSelectedProduct(null);
                        }}
                        className={`text-left px-3 py-2 text-xs uppercase font-bold tracking-wider transition-all ${
                          selectedCategory === cat 
                            ? 'bg-zinc-800 text-white pl-4 border-l-2' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        style={{ borderLeftColor: selectedCategory === cat ? 'var(--theme-primary)' : 'transparent' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 mb-4 pb-2 border-b border-zinc-800">
                    Browse Workshops
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedVendorId('All');
                        setSelectedProduct(null);
                      }}
                      className={`text-left px-3 py-2 text-xs uppercase font-bold tracking-wider transition-all ${
                        selectedVendorId === 'All' 
                          ? 'bg-zinc-800 text-white pl-4 border-l-2' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      style={{ borderLeftColor: selectedVendorId === 'All' ? 'var(--theme-primary)' : 'transparent' }}
                    >
                      All Artisans
                    </button>
                    {vendors.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVendorId(v.id);
                          setSelectedProduct(null);
                        }}
                        className={`text-left px-3 py-2 text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-between ${
                          selectedVendorId === v.id 
                            ? 'bg-zinc-800 text-white pl-4 border-l-2' 
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        style={{ borderLeftColor: selectedVendorId === v.id ? 'var(--theme-primary)' : 'transparent' }}
                      >
                        <span>{v.name}</span>
                        <span className="text-[10px] mono text-zinc-500">({v.commission_rate}% Platform)</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* VISUAL CART BOX */}
                <div className="border border-white/5 bg-zinc-950 p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-5 rounded-full blur-xl" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
                  <h3 className="mono text-xs uppercase tracking-widest text-zinc-400 font-bold mb-4 flex items-center justify-between">
                    <span>Unified Cart</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-white">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
                  </h3>
                  
                  {cart.length === 0 ? (
                    <p className="text-zinc-500 text-xs italic py-4">Your cart is empty. Pick handcrafted goods to start splitting your order.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {cart.map(item => (
                          <div key={item.product.id} className="flex justify-between items-center text-xs py-1 border-b border-zinc-900">
                            <div className="truncate max-w-[140px]">
                              <p className="font-bold truncate text-white">{item.product.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate">by {vendors.find(v => v.id === item.product.vendor_id)?.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="mono text-zinc-400">×{item.quantity}</span>
                              <span className="mono text-zinc-300 font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                              <button onClick={() => removeFromCart(item.product.id)} className="text-zinc-600 hover:text-red-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex justify-between text-xs">
                        <span className="font-bold">Total Bill:</span>
                        <span className="mono text-white font-black">${getCartTotal().toFixed(2)}</span>
                      </div>

                      <button 
                        onClick={() => setIsCheckoutOpen(true)}
                        className="w-full text-center py-3 text-xs uppercase font-black tracking-widest text-black bg-white hover:bg-zinc-200 transition-colors"
                      >
                        Proceed to Split-Out
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* PRODUCT DISPLAY AREA */}
              <div className="lg:col-span-3 space-y-8">
                {selectedProduct ? (
                  /* PRODUCT DETAIL SUBSTAGE */
                  <div className="border-outline bg-zinc-900/40 rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="w-full aspect-square object-cover rounded-2xl border border-white/5" />
                      <button 
                        onClick={() => setSelectedProduct(null)}
                        className="mt-4 text-xs font-bold text-zinc-400 hover:text-white uppercase flex items-center gap-1.5"
                      >
                        ← Back to Unified Grid
                      </button>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-300 rounded">
                            {selectedProduct.category}
                          </span>
                          <span className={`text-[10px] mono uppercase ${selectedProduct.inventory > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {selectedProduct.inventory > 0 ? `Stock: ${selectedProduct.inventory} units` : 'Sold Out'}
                          </span>
                        </div>

                        <h2 className="text-3xl font-black uppercase text-white mb-2">{selectedProduct.title}</h2>
                        
                        {/* Vendor attribution details */}
                        {(() => {
                          const itemVendor = vendors.find(v => v.id === selectedProduct.vendor_id);
                          return itemVendor ? (
                            <div className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl mb-4 border border-zinc-800">
                              <img src={itemVendor.logoUrl} className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <p className="text-xs font-bold text-zinc-300">Hand-finished by {itemVendor.name}</p>
                                <p className="text-[10px] text-zinc-500">Stripe ID verified: {itemVendor.stripe_account_id}</p>
                              </div>
                            </div>
                          ) : null;
                        })()}

                        <p className="text-2xl mono font-bold text-white mb-4">${selectedProduct.price.toFixed(2)}</p>
                        <p className="text-zinc-400 text-xs leading-relaxed mb-6">{selectedProduct.description}</p>
                      </div>

                      <div className="space-y-6">
                        <button 
                          onClick={() => addToCart(selectedProduct)}
                          disabled={selectedProduct.inventory <= 0}
                          className="w-full text-center py-4 text-xs uppercase font-black tracking-widest text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                          style={{ backgroundColor: selectedProduct.inventory > 0 ? 'var(--theme-primary)' : '' }}
                        >
                          {selectedProduct.inventory > 0 ? 'Acquire & Split Cart' : 'Out of Stock'}
                        </button>

                        {/* REVIEWS SEGMENT */}
                        <div className="border-t border-zinc-800 pt-6">
                          <h4 className="mono text-xs uppercase tracking-widest text-zinc-400 font-bold mb-4">
                            Sourcing Customer Feedback ({selectedProduct.reviews.length})
                          </h4>
                          
                          <div className="space-y-3 mb-6 max-h-40 overflow-y-auto pr-1">
                            {selectedProduct.reviews.length === 0 ? (
                              <p className="text-zinc-500 text-xs italic">No verification ratings yet.</p>
                            ) : (
                              selectedProduct.reviews.map(rev => (
                                <div key={rev.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-white">{rev.customerName}</span>
                                    <span className="text-[10px] text-zinc-500">{rev.date}</span>
                                  </div>
                                  <div className="flex gap-1 mb-1.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} />
                                    ))}
                                  </div>
                                  <p className="text-zinc-400 text-xs leading-snug">{rev.comment}</p>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Write Review Form */}
                          <form onSubmit={handleAddReview} className="bg-zinc-950 p-4 rounded-xl space-y-3">
                            <h5 className="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Write a verified rating</h5>
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                type="text"
                                placeholder="Your Name"
                                value={reviewForm.customerName}
                                onChange={e => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                                className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white"
                                required
                              />
                              <select 
                                value={reviewForm.rating}
                                onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                                className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-300"
                              >
                                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                              </select>
                            </div>
                            <textarea 
                              placeholder="Describe your tactile sourcing experience with this craft product..."
                              rows={2}
                              value={reviewForm.comment}
                              onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                              required
                            />
                            <button type="submit" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] uppercase font-bold tracking-widest">
                              Publish Review
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* THEMED PRODUCT GRID */
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                        <span>Unified Sourced Drops</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-normal">
                          {selectedCategory} / {selectedVendorId === 'All' ? 'All Workshops' : 'Single Artisan'}
                        </span>
                      </h2>
                    </div>

                    {products.filter(p => {
                      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
                      const matchVendor = selectedVendorId === 'All' || p.vendor_id === selectedVendorId;
                      return matchCat && matchVendor && p.status === 'approved';
                    }).length === 0 ? (
                      <div className="border border-white/5 bg-zinc-950 p-12 text-center rounded-3xl">
                        <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-400 font-bold mb-1">No products currently match</p>
                        <p className="text-zinc-600 text-xs">Try shifting filters or browse individual workshops.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {products.filter(p => {
                          const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
                          const matchVendor = selectedVendorId === 'All' || p.vendor_id === selectedVendorId;
                          return matchCat && matchVendor && p.status === 'approved';
                        }).map(prod => {
                          const vendor = vendors.find(v => v.id === prod.vendor_id);
                          return (
                            <div 
                              key={prod.id} 
                              onClick={() => setSelectedProduct(prod)}
                              className="border-outline bg-zinc-900/20 hover:bg-zinc-900/40 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 flex flex-col justify-between"
                            >
                              <div>
                                <div className="relative aspect-video overflow-hidden">
                                  <img 
                                    src={prod.imageUrl} 
                                    alt={prod.title} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                  />
                                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                    {prod.category}
                                  </div>
                                </div>
                                <div className="p-5">
                                  <h4 className="font-black text-lg uppercase text-white truncate group-hover:text-[var(--theme-primary)] transition-colors">
                                    {prod.title}
                                  </h4>
                                  <p className="text-zinc-500 text-xs truncate mb-3">by {vendor?.name}</p>
                                  <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed mb-4">{prod.description}</p>
                                </div>
                              </div>

                              <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-zinc-900/80">
                                <span className="mono text-white font-bold">${prod.price.toFixed(2)}</span>
                                <span className="text-[10px] mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 hover:text-white">
                                  <span>Examine</span>
                                  <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* BLOCK RENDERING: PAYLOAD CMS FOOTER BLOCK */}
            {activeTheme?.sections.find(s => s.type === 'footer' && s.enabled) && (
              <footer className="mt-16 pt-12 pb-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="mono text-xs text-zinc-500">
                  <p className="font-bold text-white uppercase">{activeTheme.sections.find(s => s.type === 'footer')?.title}</p>
                  <p className="mt-1">{activeTheme.sections.find(s => s.type === 'footer')?.subtitle}</p>
                </div>
                <div className="text-right">
                  <span className="mono text-[10px] text-zinc-600 uppercase tracking-widest">Hydrated CMS Configuration API</span>
                </div>
              </footer>
            )}

          </div>
        )}

        {/* ==========================================
            TAB 2: VENDOR PORTAL (SELLER DASHBOARD)
            ========================================== */}
        {activeTab === 'vendor' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* VENDOR SELECTOR & OVERVIEW */}
            <div className="border-outline bg-zinc-900/40 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="mono text-xs uppercase tracking-widest text-zinc-500 mb-1 block">Active Workshop Context</span>
                <div className="flex items-center gap-3">
                  <select 
                    value={selectedVendorSpace}
                    onChange={e => setSelectedVendorSpace(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none"
                  >
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  <span className="mono text-xs text-zinc-500">Stripe KYC: Verified</span>
                </div>
              </div>

              {/* STATS PREVIEW */}
              {(() => {
                const activeVendorObj = vendors.find(v => v.id === selectedVendorSpace);
                return activeVendorObj ? (
                  <div className="flex gap-8">
                    <div className="mono">
                      <p className="text-[10px] text-zinc-500 uppercase mb-0.5">Medusa Fee</p>
                      <p className="text-lg font-bold text-purple-400">{activeVendorObj.commission_rate}% commission</p>
                    </div>
                    <div className="mono">
                      <p className="text-[10px] text-zinc-500 uppercase mb-0.5">Total Products</p>
                      <p className="text-lg font-bold text-white">{products.filter(p => p.vendor_id === selectedVendorSpace).length} online</p>
                    </div>
                    <div className="mono">
                      <p className="text-[10px] text-zinc-500 uppercase mb-0.5">Joined Collective</p>
                      <p className="text-sm text-zinc-300 font-medium">{new Date(activeVendorObj.joinedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* SELLER TOOLS STAGE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LAUNCH NEW ITEM OR EDIT EXISTING */}
              <div className="space-y-6">
                
                {editProductForm ? (
                  /* EDIT PRODUCT FORM */
                  <div className="border-outline bg-zinc-950 p-6 rounded-3xl">
                    <h3 className="text-lg font-black uppercase text-white mb-4 pb-2 border-b border-zinc-800 flex justify-between items-center">
                      <span>Edit Medusa Product</span>
                      <button onClick={() => setEditProductForm(null)} className="text-zinc-500 text-xs hover:text-white">Cancel</button>
                    </h3>
                    <form onSubmit={handleEditProduct} className="space-y-4">
                      <div>
                        <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Title</label>
                        <input 
                          type="text" 
                          value={editProductForm.title}
                          onChange={e => setEditProductForm({ ...editProductForm, title: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Price ($)</label>
                          <input 
                            type="number" 
                            value={editProductForm.price}
                            onChange={e => setEditProductForm({ ...editProductForm, price: Number(e.target.value) })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Inventory Stock</label>
                          <input 
                            type="number" 
                            value={editProductForm.inventory}
                            onChange={e => setEditProductForm({ ...editProductForm, inventory: Number(e.target.value) })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Image URL</label>
                        <input 
                          type="text" 
                          value={editProductForm.imageUrl}
                          onChange={e => setEditProductForm({ ...editProductForm, imageUrl: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Category</label>
                        <select 
                          value={editProductForm.category}
                          onChange={e => setEditProductForm({ ...editProductForm, category: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                        >
                          {['Kitchen', 'Home & Living', 'Apparel', 'Accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Description</label>
                        <textarea 
                          rows={4} 
                          value={editProductForm.description}
                          onChange={e => setEditProductForm({ ...editProductForm, description: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                        />
                      </div>
                      <button type="submit" className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-xs">
                        Save Changes
                      </button>
                    </form>
                  </div>
                ) : (
                  /* LAUNCH NEW PRODUCT FORM */
                  <div className="border-outline bg-zinc-950 p-6 rounded-3xl">
                    <h3 className="text-lg font-black uppercase text-white mb-4 pb-2 border-b border-zinc-800">
                      Launch Medusa Listing
                    </h3>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div>
                        <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Product Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Live-Edge Cedar Coaster Set"
                          value={newProductForm.title}
                          onChange={e => setNewProductForm({ ...newProductForm, title: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Price ($)</label>
                          <input 
                            type="number" 
                            placeholder="45"
                            value={newProductForm.price}
                            onChange={e => setNewProductForm({ ...newProductForm, price: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Inventory Stock</label>
                          <input 
                            type="number" 
                            placeholder="10"
                            value={newProductForm.inventory}
                            onChange={e => setNewProductForm({ ...newProductForm, inventory: e.target.value })}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Image URL</label>
                        <input 
                          type="text" 
                          placeholder="https://images.unsplash.com/..."
                          value={newProductForm.imageUrl}
                          onChange={e => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Category</label>
                        <select 
                          value={newProductForm.category}
                          onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                        >
                          {['Kitchen', 'Home & Living', 'Apparel', 'Accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Description</label>
                        <textarea 
                          rows={3} 
                          placeholder="Milled and sealed carefully..."
                          value={newProductForm.description}
                          onChange={e => setNewProductForm({ ...newProductForm, description: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                        />
                      </div>
                      <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase tracking-widest text-xs">
                        Publish to Marketplace
                      </button>
                    </form>
                  </div>
                )}

                {/* STRIPE INSTANT PAYOUT CLAIMS */}
                <div className="border-outline bg-zinc-950 p-6 rounded-3xl">
                  <h3 className="text-lg font-black uppercase text-white mb-4 pb-2 border-b border-zinc-800">
                    Stripe Payout Center
                  </h3>
                  
                  {/* Payout History List */}
                  <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                    {vendorPayouts.length === 0 ? (
                      <p className="text-zinc-500 text-xs italic">No payouts claimed this period.</p>
                    ) : (
                      vendorPayouts.map(pay => (
                        <div key={pay.id} className="flex justify-between items-center text-xs p-2 bg-zinc-900 rounded">
                          <div>
                            <p className="font-bold text-white">${pay.amount.toFixed(2)} Payout</p>
                            <p className="text-[10px] text-zinc-500">{new Date(pay.date).toLocaleDateString()}</p>
                          </div>
                          <span className="text-[10px] uppercase font-black tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                            {pay.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleClaimPayout} className="space-y-3">
                    <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Claim Payout Amount ($)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="e.g. 150"
                        value={payoutClaimAmount}
                        onChange={e => setPayoutClaimAmount(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded p-2.5 text-xs text-white"
                        required
                      />
                      <button type="submit" className="px-4 py-2.5 bg-white text-black text-xs uppercase font-black tracking-widest">
                        Payout
                      </button>
                    </div>
                    <span className="mono text-[10px] text-zinc-500 block">Funds will deposit directly to your registered bank routing.</span>
                  </form>
                </div>

              </div>

              {/* ACTIVE PRODUCTS LIST */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4">
                    Active Catalog Listings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.filter(p => p.vendor_id === selectedVendorSpace).map(prod => (
                      <div key={prod.id} className="border-outline bg-zinc-950 p-4 rounded-2xl flex gap-4">
                        <img src={prod.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/5" />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold uppercase text-white truncate text-xs">{prod.title}</h4>
                            <p className="mono text-[10px] text-zinc-400 mt-0.5">${prod.price.toFixed(2)} • Stock: {prod.inventory}</p>
                          </div>
                          <div className="flex gap-2 justify-end pt-1">
                            <button 
                              onClick={() => setEditProductForm(prod)}
                              className="px-2 py-1 text-[9px] uppercase font-bold tracking-wider bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="px-2 py-1 text-[9px] uppercase font-bold tracking-wider bg-red-950 text-red-400 hover:bg-red-900 rounded"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VENDOR SUB-ORDERS STATED TRACING */}
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4">
                    Orders Split-Out Queue
                  </h3>

                  {vendorOrders.length === 0 ? (
                    <div className="border border-white/5 bg-zinc-950 p-8 text-center rounded-2xl">
                      <p className="text-zinc-500 text-xs italic">No checkout orders registered for your workshop yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {vendorOrders.map((sub, index) => (
                        <div key={index} className="border-outline bg-zinc-950 p-5 rounded-2xl space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="mono text-xs uppercase text-zinc-400">Order Ref: {sub.orderId}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">Customer: {sub.customerName} ({sub.customerEmail})</p>
                            </div>
                            <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded ${
                              sub.splitStatus === 'shipped' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {sub.splitStatus}
                            </span>
                          </div>

                          <div className="border-t border-b border-zinc-900 py-3 space-y-2">
                            {sub.items.map((it: any, i: number) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-zinc-300 truncate max-w-[250px]">{it.product.title} × {it.quantity}</span>
                                <span className="mono text-white">${(it.product.price * it.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="grid grid-cols-3 gap-4 text-left">
                              <div className="mono">
                                <p className="text-[9px] text-zinc-500 uppercase">Gross Subtotal</p>
                                <p className="text-xs text-white font-bold">${sub.subtotal.toFixed(2)}</p>
                              </div>
                              <div className="mono">
                                <p className="text-[9px] text-purple-400 uppercase">Platform Fee</p>
                                <p className="text-xs text-purple-400 font-bold">-${sub.commission.toFixed(2)}</p>
                              </div>
                              <div className="mono">
                                <p className="text-[9px] text-green-400 uppercase">Net Earnings</p>
                                <p className="text-xs text-green-400 font-bold">${sub.payoutAmount.toFixed(2)}</p>
                              </div>
                            </div>

                            {sub.splitStatus !== 'shipped' && (
                              <button 
                                onClick={() => handleShipSuborder(sub.splitOrderId)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] uppercase font-bold tracking-widest rounded transition-all"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Mark Shipped</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB 3: PLATFORM CONTROL (ADMIN VIEW)
            ========================================== */}
        {activeTab === 'admin' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* REAL-TIME MARKETPLACE ANALYTICS DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="border-outline bg-zinc-900/40 p-6 rounded-2xl relative overflow-hidden">
                <p className="mono text-xs uppercase tracking-widest text-zinc-500 mb-1">Gross Marketplace Sales</p>
                <h3 className="text-3xl font-black text-white">${analytics?.totalSales.toFixed(2) || '0.00'}</h3>
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl"></div>
              </div>
              <div className="border-outline bg-zinc-900/40 p-6 rounded-2xl relative overflow-hidden">
                <p className="mono text-xs uppercase tracking-widest text-zinc-500 mb-1">Platform Commissions</p>
                <h3 className="text-3xl font-black text-purple-400">${analytics?.totalCommissions.toFixed(2) || '0.00'}</h3>
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl"></div>
              </div>
              <div className="border-outline bg-zinc-900/40 p-6 rounded-2xl relative overflow-hidden">
                <p className="mono text-xs uppercase tracking-widest text-zinc-500 mb-1">Total Checkout Orders</p>
                <h3 className="text-3xl font-black text-white">{analytics?.totalOrders || '0'}</h3>
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
              </div>
              <div className="border-outline bg-zinc-900/40 p-6 rounded-2xl relative overflow-hidden">
                <p className="mono text-xs uppercase tracking-widest text-zinc-500 mb-1">Active Sourced Artisans</p>
                <h3 className="text-3xl font-black text-white">{analytics?.totalVendors || '0'}</h3>
                <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full blur-xl"></div>
              </div>
            </div>

            {/* ARTISAN PERFORMANCE & VENDOR ONBOARDING */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* VENDOR ONBOARDING FORM */}
              <div className="border-outline bg-zinc-950 p-6 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-lg font-black uppercase text-white pb-2 border-b border-zinc-800">
                    Onboard New Artisan
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1">Add custom commission rates and direct payment routing instantly.</p>
                </div>

                <form onSubmit={handleRegisterVendor} className="space-y-4">
                  <div>
                    <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Artisan Brand Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hearth & Loom"
                      value={registerForm.name}
                      onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:border-zinc-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">One-Line Headline</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Loom-woven heritage flax rugs..."
                      value={registerForm.description}
                      onChange={e => setRegisterForm({ ...registerForm, description: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:border-zinc-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Stripe Routing Account</label>
                      <input 
                        type="text" 
                        placeholder="acct_hearth09"
                        value={registerForm.stripeAccount}
                        onChange={e => setRegisterForm({ ...registerForm, stripeAccount: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Commission rate (%)</label>
                      <input 
                        type="number" 
                        value={registerForm.commission}
                        onChange={e => setRegisterForm({ ...registerForm, commission: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white"
                        min="5" 
                        max="50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Brand Bio</label>
                    <textarea 
                      rows={3}
                      placeholder="Describe the workshop location, sourcing philosophy, and materials commitment..."
                      value={registerForm.bio}
                      onChange={e => setRegisterForm({ ...registerForm, bio: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:border-zinc-500 focus:outline-none"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-xs transition-colors hover:bg-zinc-200">
                    Register Brand Node
                  </button>
                </form>
              </div>

              {/* SPLIT ORDER DIAGRAMS & COMMISSIONS SUMMARY */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* ACTIVE COLLECTIVE PERFORMANCE */}
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4">
                    Artisan Performance Nodes
                  </h3>
                  <div className="border-outline bg-zinc-950 p-6 rounded-3xl space-y-4">
                    {analytics?.vendorPerformance.map((vp: any, i: number) => {
                      const vendorFull = vendors.find(v => v.id === vp.vendorId);
                      return (
                        <div key={i} className="flex justify-between items-center text-xs pb-3 border-b border-zinc-900 last:border-0 last:pb-0">
                          <div>
                            <p className="font-bold text-white uppercase">{vp.vendorName}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              Stripe: {vendorFull?.stripe_account_id} • Commission: {vendorFull?.commission_rate}%
                            </p>
                          </div>
                          <div className="text-right mono">
                            <p className="text-zinc-300 font-semibold">${vp.sales.toFixed(2)} gross</p>
                            <p className="text-[10px] text-purple-400">Commissioned: ${vp.commission.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* VISUAL ORDER SPLITTING SCHEMATIC */}
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white mb-4">
                    Master Decoupled Order Splits
                  </h3>

                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <p className="text-zinc-500 text-xs italic">No orders registered yet.</p>
                    ) : (
                      orders.map(order => (
                        <div key={order.id} className="border border-white/5 bg-zinc-950 p-6 rounded-3xl space-y-4">
                          <div className="flex justify-between items-start pb-2 border-b border-zinc-900">
                            <div>
                              <span className="mono text-[10px] uppercase text-zinc-500">Order ID: {order.id}</span>
                              <h4 className="font-bold text-white uppercase text-sm mt-0.5">{order.customerName}</h4>
                              <p className="text-[10px] text-zinc-500">{order.customerEmail} • {order.shippingAddress}</p>
                            </div>
                            <div className="text-right">
                              <span className="mono text-zinc-500 text-xs block">{new Date(order.date).toLocaleDateString()}</span>
                              <span className="text-xs font-black mono text-white">${order.total.toFixed(2)} grand total</span>
                            </div>
                          </div>

                          {/* Visualization diagram */}
                          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-900 relative">
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold mono bg-purple-500/15 text-purple-400">Medusa Splitter</span>
                            <p className="mono text-[10px] text-zinc-400 mb-3">Split-Order Slices generated dynamically:</p>
                            
                            <div className="space-y-4">
                              {order.splitOrders.map((split, idx) => {
                                const vObj = vendors.find(v => v.id === split.vendor_id);
                                return (
                                  <div key={idx} className="border-l-2 pl-4 py-1.5 space-y-2" style={{ borderLeftColor: idx === 0 ? '#3b82f6' : idx === 1 ? '#a855f7' : '#ec4899' }}>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-white uppercase">Slice {idx + 1}: {vObj?.name || split.vendor_id}</span>
                                      <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold mono bg-zinc-800 text-zinc-300">
                                        {split.status}
                                      </span>
                                    </div>
                                    <div className="max-w-md text-[10px] text-zinc-500">
                                      Items: {split.items.map(it => `${it.product.title} (×${it.quantity})`).join(', ')}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-[10px] mono">
                                      <div>Subtotal: <span className="text-zinc-300 font-bold">${split.subtotal.toFixed(2)}</span></div>
                                      <div>Fee Collected: <span className="text-purple-400 font-bold">${split.commission.toFixed(2)}</span></div>
                                      <div>Artisan Payout: <span className="text-green-400 font-bold">${split.payoutAmount.toFixed(2)}</span></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB 4: CMS CONTENT & PAGES (PAYLOAD CMS)
            ========================================== */}
        {activeTab === 'cms' && (
          <div className="space-y-8 animate-fade-in">
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* PAGE & BLOG CREATOR SIDEBAR */}
              <div className="space-y-6">
                
                {/* CREATE CUSTOM STATIC PAGE */}
                <div className="border-outline bg-zinc-950 p-6 rounded-3xl">
                  <h3 className="mono text-xs uppercase tracking-widest text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-900">
                    Create Custom Page
                  </h3>
                  <form onSubmit={handleCreatePage} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Page Title"
                      value={newPageForm.title}
                      onChange={e => setNewPageForm({ ...newPageForm, title: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Slug (e.g. materials)"
                      value={newPageForm.slug}
                      onChange={e => setNewPageForm({ ...newPageForm, slug: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="SEO Title Tag"
                      value={newPageForm.metaTitle}
                      onChange={e => setNewPageForm({ ...newPageForm, metaTitle: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                    />
                    <textarea 
                      placeholder="Meta Description..."
                      rows={2}
                      value={newPageForm.metaDescription}
                      onChange={e => setNewPageForm({ ...newPageForm, metaDescription: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                    />
                    <textarea 
                      placeholder="Page Content (supports markdown)..."
                      rows={4}
                      value={newPageForm.content}
                      onChange={e => setNewPageForm({ ...newPageForm, content: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-xs text-white"
                      required
                    />
                    <button type="submit" className="w-full py-2.5 bg-white text-black font-bold uppercase tracking-widest text-[10px]">
                      Publish Page
                    </button>
                  </form>
                </div>

                {/* CREATE BLOG POST */}
                <div className="border-outline bg-zinc-950 p-6 rounded-3xl">
                  <h3 className="mono text-xs uppercase tracking-widest text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-900">
                    Publish Blog Entry
                  </h3>
                  <form onSubmit={handleCreatePost} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Post Title"
                      value={newPostForm.title}
                      onChange={e => setNewPostForm({ ...newPostForm, title: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Author (e.g. Sylvan Studio)"
                      value={newPostForm.author}
                      onChange={e => setNewPostForm({ ...newPostForm, author: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="Teaser excerpt..."
                      value={newPostForm.excerpt}
                      onChange={e => setNewPostForm({ ...newPostForm, excerpt: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                    />
                    <input 
                      type="text" 
                      placeholder="Image URL"
                      value={newPostForm.imageUrl}
                      onChange={e => setNewPostForm({ ...newPostForm, imageUrl: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                    />
                    <textarea 
                      placeholder="Post body..."
                      rows={4}
                      value={newPostForm.content}
                      onChange={e => setNewPostForm({ ...newPostForm, content: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-xs text-white"
                      required
                    />
                    <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase tracking-widest text-[10px]">
                      Publish Post
                    </button>
                  </form>
                </div>

              </div>

              {/* BLOGS & PAGES DISPLAY SPACE */}
              <div className="lg:col-span-3 space-y-8">
                
                {/* CMS PAGES LINKS */}
                <div>
                  <h3 className="text-xs uppercase font-black tracking-widest text-zinc-400 mb-4 pb-2 border-b border-zinc-800">
                    CMS Static Pages
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {pages.map(page => (
                      <button
                        key={page.id}
                        onClick={() => {
                          setSelectedPage(page);
                          setSelectedBlogPost(null);
                        }}
                        className={`px-4 py-3 border rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${
                          selectedPage?.id === page.id 
                            ? 'bg-zinc-800 border-white text-white' 
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        <span>{page.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SHOW SELECTABLE SUB-STAGE OR DEFAULT LISTINGS */}
                {selectedPage ? (
                  /* RENDER SELECTED CMS PAGE */
                  <div className="border-outline bg-zinc-900/40 p-8 rounded-3xl space-y-6">
                    <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">{selectedPage.title}</h2>
                        <p className="mono text-[10px] text-zinc-500 mt-1">Slug: /{selectedPage.slug}</p>
                      </div>
                      <button onClick={() => setSelectedPage(null)} className="text-zinc-400 text-xs hover:text-white uppercase font-bold">
                        Close Page View
                      </button>
                    </div>

                    <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed space-y-4 whitespace-pre-line">
                      {selectedPage.content}
                    </div>

                    {/* Meta tag viewer to show off SEO metadata values */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2">
                      <p className="mono text-[10px] uppercase text-zinc-400 font-bold">Payload SEO Metadata fields</p>
                      <p className="text-xs text-white"><span className="text-zinc-500">Title Tag:</span> {selectedPage.metaTitle}</p>
                      <p className="text-xs text-zinc-400"><span className="text-zinc-500">Description Tag:</span> {selectedPage.metaDescription}</p>
                    </div>
                  </div>
                ) : selectedBlogPost ? (
                  /* RENDER SELECTED CMS BLOG POST */
                  <div className="border-outline bg-zinc-900/40 p-8 rounded-3xl space-y-6">
                    <div className="flex justify-between items-start pb-4 border-b border-zinc-800">
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight text-white">{selectedBlogPost.title}</h2>
                        <p className="mono text-[10px] text-zinc-500 mt-1">by {selectedBlogPost.author} • {new Date(selectedBlogPost.date).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => setSelectedBlogPost(null)} className="text-zinc-400 text-xs hover:text-white uppercase font-bold">
                        Back to Feed
                      </button>
                    </div>

                    <img src={selectedBlogPost.imageUrl} className="w-full max-h-80 object-cover rounded-2xl border border-white/5" />

                    <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed space-y-4 whitespace-pre-line">
                      {selectedBlogPost.content}
                    </div>
                  </div>
                ) : (
                  /* RENDER BLOG ARTICLES GRID */
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white mb-6">
                      Decoupled Creative Feed
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {posts.map(post => (
                        <div 
                          key={post.id}
                          onClick={() => {
                            setSelectedBlogPost(post);
                            setSelectedPage(null);
                          }}
                          className="border-outline bg-zinc-900/20 hover:bg-zinc-900/40 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
                        >
                          <div>
                            <img src={post.imageUrl} className="w-full aspect-video object-cover" />
                            <div className="p-5">
                              <span className="mono text-[9px] uppercase tracking-widest text-zinc-500">
                                {new Date(post.date).toLocaleDateString()} • by {post.author}
                              </span>
                              <h4 className="font-bold text-lg uppercase text-white mt-1 mb-2 truncate hover:text-purple-400 transition-colors">
                                {post.title}
                              </h4>
                              <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">{post.excerpt}</p>
                            </div>
                          </div>
                          <div className="px-5 pb-5 pt-2 flex justify-between items-center border-t border-zinc-900">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Read Article</span>
                            <ChevronRight className="w-4.5 h-4.5 text-zinc-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB 5: SHOPIFY-STYLE THEME BUILDER
            ========================================== */}
        {activeTab === 'theme' && (
          <div className="space-y-8 animate-fade-in">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* THEME SWAPPER & LIVE EDITOR SIDEBAR */}
              <div className="space-y-6">
                
                {/* LIST SAVED PALETTES */}
                <div className="border-outline bg-zinc-950 p-6 rounded-3xl">
                  <h3 className="text-lg font-black uppercase text-white mb-4 pb-2 border-b border-zinc-800">
                    Saved Themes
                  </h3>
                  <div className="space-y-2">
                    {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleActivateTheme(t.id)}
                        className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                          t.isActive 
                            ? 'bg-zinc-900 border-white text-white' 
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <div>
                          <p className="text-xs uppercase font-black">{t.name}</p>
                          <p className="mono text-[9px] text-zinc-500 mt-0.5">Font: {t.fontFamily}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: t.primaryColor }}></span>
                          <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: t.secondaryColor }}></span>
                          <span className="w-3.5 h-3.5 rounded-full border border-white/10" style={{ backgroundColor: t.backgroundColor }}></span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* THEME BLOCK CONFIGURATOR */}
                {activeTheme && (
                  <div className="border-outline bg-zinc-950 p-6 rounded-3xl">
                    <h3 className="text-lg font-black uppercase text-white mb-4 pb-2 border-b border-zinc-800">
                      Block Sections
                    </h3>
                    
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                      {activeTheme.sections.map(sec => (
                        <div key={sec.id} className="p-4 bg-zinc-900/40 rounded-xl space-y-3 border border-zinc-900">
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                            <span className="mono text-[10px] uppercase font-bold text-zinc-400">Block: {sec.type}</span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={sec.enabled}
                                onChange={e => handleUpdateThemeSection(sec.id, { enabled: e.target.checked })}
                                className="rounded bg-zinc-950 border-zinc-800 text-purple-600 focus:ring-0"
                              />
                              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Enabled</span>
                            </label>
                          </div>

                          {sec.enabled && (
                            <div className="space-y-2">
                              <input 
                                type="text"
                                placeholder="Section Title"
                                value={sec.title || ''}
                                onChange={e => handleUpdateThemeSection(sec.id, { title: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-white"
                              />
                              {sec.subtitle !== undefined && (
                                <input 
                                  type="text"
                                  placeholder="Subtitle"
                                  value={sec.subtitle || ''}
                                  onChange={e => handleUpdateThemeSection(sec.id, { subtitle: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300"
                                />
                              )}
                              {sec.content !== undefined && (
                                <textarea 
                                  placeholder="Block Description"
                                  rows={2}
                                  value={sec.content || ''}
                                  onChange={e => handleUpdateThemeSection(sec.id, { content: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* LIVE SIMULATED SHOPPING FRONT PREVIEW CONTAINER */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-purple-400" />
                    <span>CMS Live Visualizer</span>
                  </h3>
                  <button 
                    onClick={() => setActiveTab('shop')}
                    className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1.5"
                  >
                    <span>View Live Shop</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* THE LIVE WORKSHOP PREVIEW iframe-style container */}
                <div style={themeStyles} className="border-2 border-dashed border-zinc-800 rounded-3xl p-6 transition-all duration-300">
                  <span className="mono text-[10px] uppercase text-zinc-500 tracking-widest block text-center mb-4">
                    [ PREVIEW CONTAINER STATE: LIVE SYNCED ]
                  </span>
                  
                  {activeTheme?.sections.filter(s => s.enabled).map(section => {
                    if (section.type === 'hero') {
                      return (
                        <div key={section.id} className="relative rounded-2xl overflow-hidden mb-6 border-outline min-h-[220px] flex items-center bg-zinc-900/40">
                          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent z-10"></div>
                          <div className="relative z-10 p-6 max-w-md">
                            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight text-white mb-2">
                              {section.title}
                            </h1>
                            <p className="text-zinc-300 text-xs mb-3 truncate">{section.subtitle}</p>
                            <a 
                              href="#" 
                              className="inline-block px-4 py-2 font-bold uppercase tracking-widest text-[9px]"
                              style={{ backgroundColor: 'var(--theme-primary)', color: 'white' }}
                              onClick={e => e.preventDefault()}
                            >
                              {section.buttonText || 'Discover'}
                            </a>
                          </div>
                        </div>
                      );
                    }

                    if (section.type === 'testimonials') {
                      return (
                        <div key={section.id} className="border-outline bg-zinc-950/80 p-6 rounded-2xl mb-6 text-center">
                          <p className="text-xs italic text-zinc-300">
                            {section.content}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })}

                  <div className="bg-zinc-950 p-6 rounded-2xl text-center border border-zinc-900">
                    <p className="mono text-[11px] text-zinc-500 uppercase">Product Catalog Block Render Segment</p>
                    <p className="text-xs text-zinc-600 mt-1">Products grid is styled in real-time according to font families and color palette configs.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB 6: AI CO-PILOT (GEMINI AI PLAYGROUND)
            ========================================== */}
        {activeTab === 'copilot' && (
          <div className="space-y-8 animate-fade-in">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* COMPILER CONFIGURATION INPUT RAIL */}
              <div className="border-outline bg-zinc-950 p-6 rounded-3xl space-y-6">
                <div>
                  <h3 className="text-lg font-black uppercase text-white pb-1 border-b border-zinc-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    <span>Gemini AI Engine</span>
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1">Formulate dynamic CMS assets or shop styles instantly using Google models.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mono text-[10px] uppercase text-zinc-400 mb-1.5 block">Operation Mode</label>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { id: 'theme-suggestion', label: 'AI Theme Color Architect', desc: 'Outputs hexadecimal color palette JSON lists.' },
                        { id: 'seo', label: 'AI Product SEO Tags Generator', desc: 'Crafts high CTR titles and tags metadata.' },
                        { id: 'blog', label: 'AI Artisan Blog Post Copywriter', desc: 'Compiles full narrative markdown drafts.' },
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setCopilotMode(mode.id as any);
                            setCopilotPrompt(
                              mode.id === 'theme-suggestion' 
                                ? 'An organic, calming woodshop atmosphere with warm amber accents' 
                                : mode.id === 'seo' 
                                  ? 'Live-Edge Walnut Catchall Tray' 
                                  : 'Tactile woodturning and ocean coastal clay rituals'
                            );
                            setCopilotResult(null);
                          }}
                          className={`text-left p-3 border rounded-xl transition-all ${
                            copilotMode === mode.id 
                              ? 'bg-zinc-900 border-yellow-400 text-white' 
                              : 'bg-zinc-900/40 border-zinc-900 hover:border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <p className="text-xs font-bold uppercase">{mode.label}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{mode.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Topic Prompt / Description</label>
                    <textarea 
                      rows={4}
                      value={copilotPrompt}
                      onChange={e => setCopilotPrompt(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
                      required
                    />
                  </div>

                  {copilotMode !== 'theme-suggestion' && (
                    <div>
                      <label className="mono text-[10px] uppercase text-zinc-400 mb-1 block">Secondary Sourcing Context (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sourced from fallen Oregon maples"
                        value={copilotContext}
                        onChange={e => setCopilotContext(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-white focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  )}

                  <button 
                    onClick={runAiCopilot}
                    disabled={aiGenerating || !copilotPrompt}
                    className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase tracking-widest text-xs disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors flex items-center justify-center gap-2"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>Run AI Generation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* DYNAMIC COMPILER LOGS & STRUCTURAL JSON INTERPRETER */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-black uppercase tracking-tight text-white pb-2 border-b border-zinc-800">
                  AI Generation Result
                </h3>

                {copilotResult ? (
                  <div className="border-outline bg-zinc-950 p-6 rounded-3xl space-y-6 animate-fade-in">
                    
                    {/* OPTION 1: THEME AESTHETIC PALETTES */}
                    {copilotMode === 'theme-suggestion' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
                          <span className="mono text-xs uppercase text-zinc-400">Structured Style Output</span>
                          <button 
                            onClick={applyAiThemeSuggestion}
                            className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                          >
                            Apply to active CMS Theme
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-zinc-900 rounded-xl space-y-2">
                            <span className="text-[10px] mono text-zinc-500 block">Primary Accents</span>
                            <div className="h-10 rounded border border-white/10" style={{ backgroundColor: copilotResult.primary }}></div>
                            <span className="mono text-xs text-white block text-center font-bold">{copilotResult.primary}</span>
                          </div>
                          <div className="p-3 bg-zinc-900 rounded-xl space-y-2">
                            <span className="text-[10px] mono text-zinc-500 block">Secondary elements</span>
                            <div className="h-10 rounded border border-white/10" style={{ backgroundColor: copilotResult.secondary }}></div>
                            <span className="mono text-xs text-white block text-center font-bold">{copilotResult.secondary}</span>
                          </div>
                          <div className="p-3 bg-zinc-900 rounded-xl space-y-2">
                            <span className="text-[10px] mono text-zinc-500 block">Background shade</span>
                            <div className="h-10 rounded border border-white/10" style={{ backgroundColor: copilotResult.background }}></div>
                            <span className="mono text-xs text-white block text-center font-bold">{copilotResult.background}</span>
                          </div>
                          <div className="p-3 bg-zinc-900 rounded-xl space-y-2">
                            <span className="text-[10px] mono text-zinc-500 block">Text Contrast</span>
                            <div className="h-10 rounded border border-white/10" style={{ backgroundColor: copilotResult.text }}></div>
                            <span className="mono text-xs text-white block text-center font-bold">{copilotResult.text}</span>
                          </div>
                        </div>

                        <div className="p-4 bg-zinc-900 rounded-xl space-y-1.5">
                          <span className="text-[10px] mono text-zinc-500 uppercase">Suggested Headline Typography:</span>
                          <p className="text-xl font-black uppercase text-white tracking-tight">{copilotResult.headline}</p>
                          <p className="mono text-[10px] text-zinc-400">Font pairing profile: {copilotResult.font}</p>
                        </div>
                      </div>
                    )}

                    {/* OPTION 2: SEO META FIELDS */}
                    {copilotMode === 'seo' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
                          <span className="mono text-xs uppercase text-zinc-400">SEO Schema Structured JSON</span>
                          <button 
                            onClick={async () => {
                              try {
                                const activePg = pages[0]; // Apply to primary page or create new
                                const res = await fetch(`/api/payload/pages/${activePg.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    metaTitle: copilotResult.metaTitle,
                                    metaDescription: copilotResult.metaDescription
                                  })
                                });
                                if (res.ok) {
                                  showToast('SEO Tags persisted into PayloadCMS Static page!', 'success');
                                  const updated = await fetch('/api/payload/pages').then(r => r.json());
                                  setPages(updated);
                                }
                              } catch (err) {
                                showToast('Failed to apply SEO tags.', 'error');
                              }
                            }}
                            className="px-4 py-2 bg-zinc-800 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-zinc-700"
                          >
                            Apply to static page [About]
                          </button>
                        </div>

                        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
                          <div>
                            <span className="mono text-[9px] uppercase text-zinc-500">Google SERP Preview Title</span>
                            <p className="text-sm text-white font-bold">{copilotResult.metaTitle}</p>
                          </div>
                          <div>
                            <span className="mono text-[9px] uppercase text-zinc-500">Google Snippet Preview Description</span>
                            <p className="text-xs text-zinc-400 leading-relaxed">{copilotResult.metaDescription}</p>
                          </div>
                          <div>
                            <span className="mono text-[9px] uppercase text-zinc-500">Structured Search Keywords</span>
                            <div className="flex gap-2 flex-wrap mt-1">
                              {copilotResult.tags?.map((tag: string, idx: number) => (
                                <span key={idx} className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] mono">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OPTION 3: BLOG narrative WRITING */}
                    {copilotMode === 'blog' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
                          <span className="mono text-xs uppercase text-zinc-400">Structured blog markup</span>
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/payload/posts', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    title: copilotResult.title,
                                    excerpt: copilotResult.excerpt,
                                    content: copilotResult.content,
                                    author: 'Gemini Assistant'
                                  })
                                });
                                if (res.ok) {
                                  showToast('Blog successfully published to PayloadCMS Collective stream!', 'success');
                                  const updated = await fetch('/api/payload/posts').then(r => r.json());
                                  setPosts(updated);
                                  setActiveTab('cms');
                                }
                              } catch (err) {
                                showToast('Publish failed.', 'error');
                              }
                            }}
                            className="px-4 py-2 bg-purple-600 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-purple-700"
                          >
                            Publish directly to PayloadCMS Feed
                          </button>
                        </div>

                        <div className="p-4 bg-zinc-900 rounded-xl space-y-4 max-h-[380px] overflow-y-auto pr-1">
                          <div>
                            <span className="mono text-[9px] uppercase text-zinc-500 block">Dynamic Headline</span>
                            <h4 className="text-lg font-black uppercase text-white">{copilotResult.title}</h4>
                            <span className="mono text-[9px] text-zinc-400 block mt-0.5">Teaser excerpt: {copilotResult.excerpt}</span>
                          </div>
                          
                          <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                            {copilotResult.content}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="border border-white/5 bg-zinc-950 p-12 text-center rounded-3xl">
                    <Sparkles className="w-10 h-10 text-zinc-700 mx-auto mb-3 animate-pulse" />
                    <p className="text-zinc-500 text-xs">Run a prompt compiler check to get real-time structured content structures.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER SYSTEM DETAILS TRACKER */}
      <footer className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-end gap-6 border-t border-white/10 bg-black/40 mt-auto">
        <div className="flex flex-wrap gap-8">
          <div className="mono">
            <p className="text-[10px] text-zinc-500 uppercase mb-0.5">Deployment Domain</p>
            <p className="text-xs text-zinc-400">ais-dev-shmywelyw6bardghwqdfgi-131388218643.run.app</p>
          </div>
          <div className="mono">
            <p className="text-[10px] text-zinc-500 uppercase mb-0.5">Decoupled Databases</p>
            <p className="text-xs text-green-500 font-bold">CONNECTED</p>
          </div>
          <div className="mono">
            <p className="text-[10px] text-zinc-500 uppercase mb-0.5">Commerce Sync Nodes</p>
            <p className="text-xs text-zinc-400">Medusa.js v2 / Custom Multi-Vendor</p>
          </div>
        </div>

        <div className="text-right">
          <p className="mono text-[10px] text-zinc-500 uppercase mb-0.5">Active Session Scribe</p>
          <p className="mono text-xs text-purple-400">prashantwetech@gmail.com</p>
        </div>
      </footer>

      {/* ==========================================
          MODAL: CHECKOUT SPLIT-ORDER VISUALIZER
          ========================================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-scale-in">
            <div className="flex justify-between items-start pb-2 border-b border-zinc-900">
              <div>
                <span className="mono text-xs uppercase tracking-widest text-zinc-500">Decoupled Checkout Node</span>
                <h3 className="text-2xl font-black uppercase text-white mt-1">Place Sourced Split-Order</h3>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="text-zinc-400 hover:text-white font-bold uppercase text-xs"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-6">
              
              {/* Billing Customer Details */}
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-900 space-y-4">
                <p className="mono text-[10px] uppercase text-zinc-400 font-bold">Customer Contact Info</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 mb-1 block">Full Name</label>
                    <input 
                      type="text" 
                      value={checkoutForm.name}
                      onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-zinc-500 mb-1 block">Email Address</label>
                    <input 
                      type="email" 
                      value={checkoutForm.email}
                      onChange={e => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase text-zinc-500 mb-1 block">Shipping Destination</label>
                  <input 
                    type="text" 
                    value={checkoutForm.address}
                    onChange={e => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              {/* DYNAMIC SPLIT ORDER PRE-CALCULATION BLOCK */}
              <div className="space-y-3">
                <p className="mono text-xs uppercase text-zinc-400 font-bold">Checkout Split Slices Preview:</p>
                
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {(() => {
                    // Group cart items by vendor ID to simulate the split order beforehand
                    const groups: { [key: string]: CartItem[] } = {};
                    cart.forEach(it => {
                      const vId = it.product.vendor_id;
                      if (!groups[vId]) groups[vId] = [];
                      groups[vId].push(it);
                    });

                    return Object.keys(groups).map((vendorId, idx) => {
                      const groupItems = groups[vendorId];
                      const vObj = vendors.find(v => v.id === vendorId);
                      const sub = groupItems.reduce((s, item) => s + (item.product.price * item.quantity), 0);
                      const commRate = vObj ? vObj.commission_rate : 10;
                      const commAmount = Number((sub * (commRate / 100)).toFixed(2));
                      const payAmount = Number((sub - commAmount).toFixed(2));

                      return (
                        <div key={idx} className="p-4 bg-zinc-900 rounded-xl border border-zinc-900 flex flex-col justify-between text-xs gap-3">
                          <div className="flex justify-between items-center pb-2 border-b border-zinc-950">
                            <span className="font-bold text-white uppercase">Slice {idx + 1}: {vObj?.name}</span>
                            <span className="mono text-zinc-500">Routing Stripe: {vObj?.stripe_account_id}</span>
                          </div>
                          
                          <div className="space-y-1">
                            {groupItems.map((gi, i) => (
                              <div key={i} className="flex justify-between text-[11px] text-zinc-400">
                                <span>{gi.product.title} (×{gi.quantity})</span>
                                <span>${(gi.product.price * gi.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[10px] mono pt-2 border-t border-zinc-950/40">
                            <div>Subtotal: <span className="text-zinc-300 font-bold">${sub.toFixed(2)}</span></div>
                            <div>Platform {commRate}%: <span className="text-purple-400 font-bold">${commAmount.toFixed(2)}</span></div>
                            <div>Artisan Payout: <span className="text-green-400 font-bold">${payAmount.toFixed(2)}</span></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Order total & Submit action */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                <div className="mono">
                  <p className="text-[10px] text-zinc-500 uppercase">Gross total bill</p>
                  <p className="text-lg font-black text-white">${getCartTotal().toFixed(2)}</p>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsCheckoutOpen(false)}
                    className="px-5 py-3 text-xs uppercase font-bold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs uppercase font-black tracking-widest"
                  >
                    Authorize Split-Order
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
