import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/hooks/useProducts';
import { useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink
} from '@/components/ui/navigation-menu';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCategories } from '@/hooks/useCategories';

// Countdown Timer component
const getDefaultEndTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now.getTime();
};

function CountdownTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(endTime - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000));
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="w-full flex flex-col items-center">
      <span className="text-white text-base mb-1 font-semibold tracking-wide">Offer ends in</span>
      <div className="flex items-center justify-center gap-1 text-white text-base font-extrabold tracking-widest select-none">
        <span className="led-glow text-white drop-shadow-[0_0_8px_#fff,0_0_16px_#fff,0_0_32px_#fff] animate-pulse">{String(days).padStart(2, '0')}</span>
        <span className="led-sep">:</span>
        <span className="led-glow text-white drop-shadow-[0_0_8px_#fff,0_0_16px_#fff,0_0_32px_#fff] animate-pulse">{String(hours).padStart(2, '0')}</span>
        <span className="led-sep">:</span>
        <span className="led-glow text-white drop-shadow-[0_0_8px_#fff,0_0_16px_#fff,0_0_32px_#fff] animate-pulse">{String(minutes).padStart(2, '0')}</span>
        <span className="led-sep">:</span>
        <span className="led-glow text-white drop-shadow-[0_0_8px_#fff,0_0_16px_#fff,0_0_32px_#fff] animate-pulse">{String(seconds).padStart(2, '0')}</span>
      </div>
      <div className="flex items-center justify-center gap-4 text-white text-xs mt-1 opacity-80">
        <span>D</span>
        <span>H</span>
        <span>M</span>
        <span>S</span>
      </div>
    </div>
  );
}

const Products = () => {
  const { products, loading } = useProducts();
  const location = useLocation();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Product | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    priceSort: ''
  });
  // التصنيفات من hook مركزي
  const { categories, loading: categoriesLoading, addCategory } = useCategories();
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category && ['Men', 'Women', 'Kids'].includes(category)) {
      setFilters((prev) => ({ ...prev, category }));
    }
  }, [location.search]);

  // إضافة تصنيف جديد
  const handleAddCategory = async () => {
    if (newCategory && !categories.some(cat => cat.name === newCategory)) {
      await addCategory(newCategory);
      setNewCategory('');
      setAddingCategory(false);
      setFilters(prev => ({ ...prev, category: newCategory, type: '' }));
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    if (filters.priceSort === 'low-to-high') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (filters.priceSort === 'high-to-low') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, filters]);

  const offerProducts = useMemo(() =>
    products.filter(p => p.offer && (!p.offerEndTime || p.offerEndTime > Date.now())),
    [products]
  );

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800 mx-auto mb-4"></div>
          <p className="text-pink-600 text-3xl font-bold tracking-widest">Vee</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* عروض Section Title */}
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-pink-600 mb-6 text-center tracking-wide">Special Offers</h2>
          {offerProducts.length > 0 ? (
            <>
              {/* Main Countdown Timer for all offers */}
              <div className="rounded-xl bg-red-600 shadow-2xl py-1 mb-8 w-full flex justify-center" style={{ boxShadow: '0 0 40px 0 #ef4444aa, 0 0 20px 4px #fff3' }}>
                <CountdownTimer endTime={Math.min(...offerProducts.map(p => p.offerEndTime || Date.now()))} />
              </div>
              {/* Offers List */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {offerProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => { setSelectedOffer(product); setIsOfferModalOpen(true); setSelectedSize(''); }}
                  />
                ))}
              </div>
              {/* Offer Modal */}
              {selectedOffer && (
                <ProductModal
                  product={selectedOffer}
                  isOpen={isOfferModalOpen}
                  onClose={() => setIsOfferModalOpen(false)}
                />
              )}
            </>
          ) : (
            <div className="rounded-xl bg-white shadow p-8 mb-8 w-full flex flex-col justify-center items-center min-h-[80px]">
              <span className="text-stone-400 text-base">Stay tuned for upcoming offers in the coming days!</span>
            </div>
          )}
        </div>
        {/* إضافة واجهة التصنيفات */}
        {/* احذف كود Dropdown التصنيفات وأي كود متعلق به من صفحة المنتجات */}
        {/* أزرار التصنيفات (صف أول 3، والباقي في صف ثاني) */}
        {categories.length > 0 && (
          <>
            <div className="flex gap-3 md:gap-4 mb-2 flex-wrap justify-center">
              <button
                className={`px-6 py-2 rounded-full font-extrabold text-base md:text-lg border transition-colors text-pink-600 shadow-sm ${!filters.category ? 'bg-pink-100/80 border-pink-300 shadow-pink-100' : 'bg-white border-pink-200 hover:bg-pink-50'}`}
                onClick={() => setFilters(prev => ({ ...prev, category: '', type: '' }))}
              >
                All Products
              </button>
              {categories.slice(0, 3).map(category => (
                <button
                  key={category.id}
                  className={`px-6 py-2 rounded-full font-extrabold text-base md:text-lg border transition-colors text-pink-600 capitalize shadow-sm ${filters.category === category.name ? 'bg-pink-100/80 border-pink-300 shadow-pink-100' : 'bg-white border-pink-200 hover:bg-pink-50'}`}
                  onClick={() => setFilters(prev => ({ ...prev, category: category.name, type: '' }))}
                >
                  {category.name}
                </button>
              ))}
            </div>
            {categories.length > 3 && (
              <div className="flex gap-3 md:gap-4 mb-4 flex-wrap justify-center">
                {categories.slice(3).map(category => (
                  <button
                    key={category.id}
                    className={`px-6 py-2 rounded-full font-extrabold text-base md:text-lg border transition-colors text-pink-600 capitalize shadow-sm ${filters.category === category.name ? 'bg-pink-100/80 border-pink-300 shadow-pink-100' : 'bg-white border-pink-200 hover:bg-pink-50'}`}
                    onClick={() => setFilters(prev => ({ ...prev, category: category.name, type: '' }))}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600 text-lg">
              {products.length === 0 
                ? "No products available yet. Check back soon!" 
                : "No products match your current filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
              />
            ))}
          </div>
        )}
      </div>
      
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Products;
