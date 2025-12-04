import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  // All hooks must be before any return
  const [quantity, setQuantity] = useState(1);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['']);
  const { addItem } = useCart();
  const quantityRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  // إعداد الصور: صور الألوان ثم صور المقاسات (بدون تكرار)
  const colorImages = (product?.colors || []).flatMap(c => (Array.isArray((c as any).images) ? (c as any).images : (c as any).image ? [(c as any).image] : [])).filter(Boolean);
  const colorNames = (product?.colors || []).map(c => c.color).filter(Boolean);
  const sizeImages = (product?.sizeImages || []).flatMap(si => (Array.isArray((si as any).images) ? (si as any).images : (si as any).image ? [(si as any).image] : [])).filter(Boolean);
  // دمج الصور بدون تكرار
  const images = Array.from(new Set([...colorImages, ...sizeImages]));

  // تحديد الفهرس المناسب عند اختيار لون أو مقاس
  const [imgIdx, setImgIdx] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState<number | null>(null);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState<number | null>(null);

  // إزالة منطق colorImagesState بالكامل
  // عند تغيير اللون، فقط غير مؤشر الصورة الرئيسية (imgIdx) ليشير لأول صورة من صور اللون المختار في الصور الجانبية (images)
  useEffect(() => {
    if (selectedColorIdx !== null && product?.colors && product.colors[selectedColorIdx]) {
      const colorObj = product.colors[selectedColorIdx];
      let imgs: string[] = [];
      if (Array.isArray((colorObj as any).images)) {
        imgs = (colorObj as any).images.filter(Boolean);
      } else if ((colorObj as any).image) {
        imgs = [(colorObj as any).image];
      }
      // ابحث عن أول صورة لهذا اللون في مصفوفة images الجانبية
      if (imgs.length > 0) {
        const idx = images.indexOf(imgs[0]);
        if (idx !== -1) setImgIdx(idx);
      }
    }
  }, [selectedColorIdx, product?.id]);

  // عند اختيار مقاس: انتقل لصورة المقاس إن وجدت
  useEffect(() => {
    if (selectedSizes[0]) {
      const sizeImg = (product?.sizeImages || []).find(si => si.size === selectedSizes[0] && si.image);
      if (sizeImg) {
        const idx = images.indexOf(sizeImg.image);
        if (idx !== -1) setImgIdx(idx);
      }
    }
  }, [selectedSizes]);

  // عند تغيير المنتج، أعد ضبط المؤشرات
  useEffect(() => {
    setImgIdx(0);
    setSelectedSizeIdx(null);
    // لو المنتج فيه ألوان، اختار أول لون تلقائيًا
    if (product?.colors && product.colors.length > 0) {
      setSelectedColorIdx(0);
    } else {
      setSelectedColorIdx(null);
    }
    // لو المنتج فيه مقاس واحد فقط، اختاره تلقائيًا
    if (product?.sizes && product.sizes.length === 1) {
      setSelectedSizes([product.sizes[0]]);
    } else {
      setSelectedSizes(['']);
    }
    setQuantity(1);
  }, [product?.id, isOpen]);

  // الصورة المعروضة حاليًا
  const displayImage = images[imgIdx];

  useEffect(() => {
    setSelectedSizes((prev) => {
      if (quantity > prev.length) {
        return [...prev, ...Array(quantity - prev.length).fill('')];
      } else if (quantity < prev.length) {
        return prev.slice(0, quantity);
      }
      return prev;
    });
  }, [quantity]);

  // Carousel effect: automatic slideshow
  useEffect(() => {
    if (selectedColorIdx !== null || selectedSizeIdx !== null || images.length < 2) return;
    
    const interval = setInterval(() => {
      setImgIdx(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= images.length) {
          // وصلنا لآخر صورة، ارجع لأول صورة ثم توقف
          setTimeout(() => {
            setImgIdx(0);
          }, 2000);
          clearInterval(interval);
          return prev;
        }
        return nextIndex;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [images.length, selectedColorIdx, selectedSizeIdx, imgIdx]);

  // Reset carousel when modal opens
  useEffect(() => {
    if (isOpen && images.length > 1) {
      setImgIdx(0);
      // Start carousel after a brief delay
      const startCarousel = setTimeout(() => {
        if (selectedColorIdx === null && selectedSizeIdx === null) {
          const interval = setInterval(() => {
            setImgIdx(prev => {
              const nextIndex = prev + 1;
              if (nextIndex >= images.length) {
                // عند الوصول لآخر صورة، ارجع لأول صورة ثم توقف
                setTimeout(() => {
                  setImgIdx(0);
                }, 2000);
                clearInterval(interval);
                return prev;
              }
              return nextIndex;
            });
          }, 2000);
        }
      }, 1000);
      
      return () => clearTimeout(startCarousel);
    }
  }, [isOpen, images.length]);

  // When a size is selected, show size image
  useEffect(() => {
    if (selectedSizes[0] && product?.image) {
      setSelectedSizeIdx(null); // Reset color selection when size is selected
    } else {
      setSelectedSizeIdx(null);
    }
  }, [selectedSizes, product?.image]);

  if (!isOpen || !product) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the user clicks directly on the backdrop, not on the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddToCart = () => {
    if (selectedSizes.some(size => !size)) {
      return;
    }
    // حساب السعر النهائي (مع الخصم إن وجد)
    const finalPrice = product.offerDiscount && product.offerDiscount > 0
      ? Math.round(product.price * (1 - product.offerDiscount / 100))
      : product.price;
    
    selectedSizes.forEach((size) => {
      addItem({
        id: product.id,
        name: product.name,
        price: finalPrice,
        size,
        image: product.image,
        category: product.category,
        type: product.type,
        color: selectedColorIdx !== null ? colorNames[selectedColorIdx] : undefined
      }, 1);
    });
    onClose();
    setSelectedSizes(['']);
    setQuantity(1);
    // تم حذف navigate('/cart') بناءً على طلب المستخدم
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg w-full max-w-xs sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* اسم المنتج */}
        <div className="flex justify-between items-center p-3 sm:p-6 border-b border-stone-200">
          <h2 className="text-2xl font-bold text-stone-800">{product.name}</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-3 sm:p-6">
          {/* الصور */}
          <div className="grid md:grid-cols-[80px_1fr] gap-4 md:gap-6 items-start">
            {/* Thumbnails */}
            <div className="flex md:flex-col flex-row gap-2 md:gap-3 md:overflow-y-auto overflow-x-auto max-h-96 md:max-h-[400px] mb-2 md:mb-0">
              {images.map((img, idx) => (
                <img
                  key={img + '-' + idx}
                  src={img}
                  alt={product.name + ' thumbnail'}
                  className={`w-16 h-16 object-contain rounded border cursor-pointer transition-all duration-150 ${imgIdx === idx ? 'border-pink-600 ring-2 ring-pink-300' : 'border-stone-200'}`}
                  onClick={() => setImgIdx(idx)}
                />
              ))}
            </div>
            {/* Main Image + Carousel */}
            <div ref={quantityRef} className="w-full flex flex-col items-center justify-center mb-4">
              <div className="aspect-square w-full max-w-xs mx-auto overflow-hidden rounded-lg flex items-center justify-center bg-white border border-stone-200 shadow-md" style={{margin: '0 auto'}}>
                {images.length > 0 && (
                  <div className="relative w-full h-full flex items-center justify-center" style={{minHeight: 280, minWidth: 280}}>
                    <img
                      src={images[imgIdx]}
                      alt={product.name}
                      className="w-full h-full object-contain bg-white rounded-lg max-h-80 max-w-80 mx-auto"
                      style={{ aspectRatio: '1/1', background: '#fff', display: 'block', margin: '0 auto' }}
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-pink-100 transition"
                          style={{transform: 'translateY(-50%)'}}
                          onClick={e => { e.stopPropagation(); setImgIdx((imgIdx - 1 + images.length) % images.length); }}
                          aria-label="Previous image"
                        >
                          &#8592;
                        </button>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 shadow hover:bg-pink-100 transition"
                          style={{transform: 'translateY(-50%)'}}
                          onClick={e => { e.stopPropagation(); setImgIdx((imgIdx + 1) % images.length); }}
                          aria-label="Next image"
                        >
                          &#8594;
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* الألوان */}
              {product.colors && product.colors.length === 1 && (
                <div className="flex gap-3 mt-6 mb-2 items-center flex-wrap justify-center w-full mx-auto text-center">
                  <span className="text-sm">اللون:</span>
                  <span className="px-4 py-2 rounded-lg border text-base font-semibold mx-1 bg-pink-600 text-white border-pink-600">
                    {product.colors[0].color}
                  </span>
                </div>
              )}
              {product.colors && product.colors.length > 1 && (
                <div className="flex gap-3 mt-6 mb-2 items-center flex-wrap justify-center w-full mx-auto text-center">
                  <span className="text-sm">اللون:</span>
                  {product.colors.map((colorObj, idx) => (
                    <button
                      key={colorObj.color}
                      onClick={() => setSelectedColorIdx(idx)}
                      className={`px-4 py-2 rounded-lg border text-base font-semibold mx-1 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-pink-400 ${selectedColorIdx === idx ? 'bg-pink-600 text-white border-pink-600' : 'border-stone-300 bg-white text-stone-700 hover:border-pink-400'}`}
                    >
                      {colorObj.color}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* النوع والسعر والوصف والمقاس والكمية */}
          <div className="space-y-4 flex flex-col items-center justify-center text-center mx-auto w-full md:max-w-xs mt-4">
            {/* النوع */}
            <div className="text-stone-600 mb-2">{product.category} {product.type && <>• {product.type}</>}</div>
            {/* السعر */}
            {product.offerDiscount && product.offerDiscount > 0 ? (
              <div className="mb-2">
                <span className="text-stone-400 line-through text-lg mr-2">EG {product.price}</span>
                <span className="text-black text-2xl font-bold mr-2">EG {Math.round(product.price * (1 - product.offerDiscount / 100))}</span>
                <span className="text-pink-600 font-bold">-{product.offerDiscount}% OFF</span>
              </div>
            ) : (
              <p className="text-base md:text-xl lg:text-2xl font-bold text-stone-900 mb-2">EG {product.price}</p>
            )}
            {/* الوصف */}
            <p className="text-stone-600">{product.description}</p>
            {/* المقاس */}
            <div className="flex flex-col items-center justify-center w-full">
              <label className="block text-sm font-medium text-stone-700 mb-2">Size</label>
              {product.sizes.length === 1 ? (
                <span className="px-4 py-2 border rounded-md border-stone-800 bg-stone-800 text-white font-bold">
                  {product.sizes[0]}
                </span>
              ) : quantity === 1 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSizes([size]);
                        setTimeout(() => {
                          quantityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 50);
                      }}
                      className={`px-4 py-2 border rounded-md ${selectedSizes[0] === size ? 'border-stone-800 bg-stone-800 text-white' : 'border-stone-300 hover:border-stone-400'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: quantity }).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2 justify-center">
                      <span className="text-xs text-stone-500 w-16">Piece {idx + 1}:</span>
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={selectedSizes[idx] || ''}
                        onChange={e => {
                          const newSizes = [...selectedSizes];
                          newSizes[idx] = e.target.value;
                          setSelectedSizes(newSizes);
                        }}
                      >
                        <option value="">Select size</option>
                        {product.sizes.map((size, idx) => (
                          <option key={size + '-' + idx} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* الكمية */}
            <div ref={quantityRef} className="w-full flex flex-col items-center justify-center">
              <label className="block text-sm font-medium text-stone-700 mb-2">Quantity</label>
              <div className="flex items-center space-x-3 justify-center">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 border border-stone-300 rounded-md hover:bg-stone-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium text-lg px-4">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 border border-stone-300 rounded-md hover:bg-stone-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {/* زر الإضافة للسلة */}
          <div className="flex flex-col gap-2 mt-6">
            {product.soldOut ? (
              <>
                <button
                  className="w-full bg-gray-300 text-gray-600 font-bold py-3 rounded-lg cursor-not-allowed"
                  disabled
                >
                  Sold Out
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition"
                >
                  Cancel
                </button>
                <div className="w-full text-center text-pink-600 font-bold mt-2">Available in the coming days</div>
              </>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-stone-900 text-white font-bold py-3 rounded-lg hover:bg-stone-800 transition"
                  disabled={
                    product.soldOut ||
                    (product.colors.length > 1 && selectedColorIdx === null) ||
                    (product.sizes.length > 1 && selectedSizes.some(size => !size))
                  }
                >
                  Add to Cart
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;

