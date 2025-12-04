import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProducts } from '@/hooks/useProducts';
import { EGYPT_GOVS } from '../lib/egyptGovs';


const Cart = () => {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart, addItem } = useCart();
  const { products } = useProducts();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    phone: '',
    governorate: '',
    center: '',
    additionalPhone: '',
  });

  // دالة للحصول على اسم محافظة قصير للعرض
  const getGovernorateDisplayName = (gov: string): string => {
    if (!gov) return '-';
    
    // إذا كان اسم المحافظة طويل جداً (أكثر من 20 حرف)، استخدم أول جزء فقط
    if (gov.length > 20) {
      // ابحث عن أول "و" لفصل الاسم (عادة يكون أول منطقة في القائمة)
      const firstAnd = gov.indexOf(' و');
      const firstComma = gov.indexOf('،');
      let firstSeparator = -1;
      
      // ابحث عن أول فاصل
      if (firstAnd > 0 && firstComma > 0) {
        firstSeparator = Math.min(firstAnd, firstComma);
      } else if (firstAnd > 0) {
        firstSeparator = firstAnd;
      } else if (firstComma > 0) {
        firstSeparator = firstComma;
      }
      
      // إذا وجد فاصل في مكان منطقي (بعد 3 أحرف على الأقل وقبل 25 حرف)
      if (firstSeparator > 3 && firstSeparator < 25) {
        return gov.substring(0, firstSeparator).trim();
      }
      
      // إذا لم يوجد فاصل منطقي، استخدم أول 20 حرف
      return gov.substring(0, 20).trim();
    }
    
    return gov.trim();
  };

  const handlePlaceOrder = async () => {
    if (!customerInfo.name || !customerInfo.address || !customerInfo.phone) {
      return;
    }
    if (items.length === 0) {
      return;
    }

    // التحقق من صحة المقاسات قبل الإرسال
    const validItems = items.filter(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return false; // المنتج غير موجود
      // التحقق من أن المقاس موجود في المنتج
      if (product.sizes && product.sizes.length > 0) {
        return product.sizes.includes(item.size);
      }
      return true; // إذا لم يكن هناك مقاسات محددة، قبول العنصر
    });

    if (validItems.length === 0) {
      alert('يرجى التحقق من المنتجات في السلة. بعض المنتجات غير صالحة.');
      return;
    }

    // التحقق من صحة المحافظة والمركز
    const validGovernorate = customerInfo.governorate && Object.keys(EGYPT_GOVS).includes(customerInfo.governorate) 
      ? getGovernorateDisplayName(customerInfo.governorate) 
      : '-';
    
    // التحقق من أن المركز موجود في المحافظة المختارة
    const validCenter = customerInfo.governorate && customerInfo.center 
      ? (EGYPT_GOVS[customerInfo.governorate]?.some(c => c.name === customerInfo.center) 
          ? customerInfo.center 
          : '-')
      : '-';

    // تكوين الرسالة بشكل آمن ويدعم أي عدد من المنتجات
    const orderDetailsArr = [
      'طلب جديد',
      `الاسم: ${customerInfo.name || '-'}`,
      `رقم الهاتف: ${customerInfo.phone || '-'}`,
      customerInfo.additionalPhone ? `رقم إضافي: ${customerInfo.additionalPhone}` : '',
      `المحافظة: ${validGovernorate}`,
      `المركز: ${validCenter}`,
      `العنوان: ${customerInfo.address || '-'}`,
      '',
      'المنتجات:',
      ...validItems.map((item, idx) => {
        const product = products.find(p => p.id === item.id);
        // التأكد من أن المقاس صحيح
        const validSize = product && product.sizes && product.sizes.length > 0 && product.sizes.includes(item.size) 
          ? item.size 
          : (product && product.sizes && product.sizes.length > 0 ? product.sizes[0] : '-');
        const validColor = item.color || '-';
        return `${idx+1}. ${item.name || '-'} - اللون: ${validColor} - المقاس: ${validSize} - الكمية: ${item.quantity || '-'} - السعر: EG ${item.price ? (item.price * item.quantity) : '-'}`;
      }),
      '',
      `الإجمالي: EG ${(getTotalPrice() + (deliveryPrice || 0)).toFixed(2)}`,
      `يرجى إرسال سعر التوصيل${deliveryPrice ? ` (${deliveryPrice})` : ''} لإتمام الطلب عن طريق إنستا باي أو فودافون كاش على الرقم: 01007361231`
    ];
    const orderDetails = orderDetailsArr.filter(Boolean).join('\n');

    // تنسيق الرقم بشكل صحيح مع كود الدولة
    const message = orderDetails
      .replace(/\n/g, '\r\n')
      .replace(/&/g, 'and');
    
    const whatsappUrl = `https://wa.me/+201559839407?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // مسح السلة وإعادة تعيين بيانات العميل بعد إرسال الطلب
    clearCart();
    setCustomerInfo({ name: '', address: '', phone: '', governorate: '', center: '', additionalPhone: '' });
  };

  const selectedCenterObj = EGYPT_GOVS[customerInfo.governorate]?.find(
    c => c.name === customerInfo.center
  );
  const deliveryPrice = selectedCenterObj ? selectedCenterObj.price : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">Shopping Cart</h1>
        
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600 text-lg mb-4">Your cart is empty</p>
            <Button onClick={() => window.location.href = '/products'}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, idx) => {
                const product = products.find(p => p.id === item.id);
                let mainImage = '';
                if (product && product.colors && product.colors.length > 0 && item.color) {
                  const selectedColorObj = product.colors.find(c => c.color === item.color);
                  if (selectedColorObj) {
                    if (Array.isArray((selectedColorObj as any).images) && (selectedColorObj as any).images.length > 0 && (selectedColorObj as any).images[0]) {
                      mainImage = (selectedColorObj as any).images[0];
                    } else if (selectedColorObj.image) {
                      mainImage = selectedColorObj.image;
                    }
                  }
                }
                if (!mainImage && product && product.image) {
                  mainImage = product.image;
                }
                if (!mainImage) {
                  mainImage = '/placeholder.svg';
                }
                return (
                  <div key={`${item.id}-${item.size}-${idx}`} className="bg-white rounded-lg p-6 shadow-sm border border-pink-200">
                    <div className="flex flex-col md:flex-row justify-center items-center md:space-x-4 space-y-4 md:space-y-0">
                      <img
                        src={mainImage}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-md mb-2 md:mb-0 border-2 border-pink-300"
                      />
                      <div className="flex-1 w-full text-center md:text-left md:pl-4">
                        <h3 className="font-bold text-pink-700 text-lg mb-1 text-center">{item.name}</h3>
                        <p className="text-stone-500 text-sm text-center">{item.category} • {item.type}</p>
                        {item.color && (
                          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                            <span className="text-pink-600 text-sm font-semibold">Color: {item.color}</span>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-center gap-2 justify-center md:justify-start mt-2">
                          <span className="text-pink-600 text-sm font-semibold">Size: {item.size}</span>
                          {product && product.sizes && product.sizes.length > 1 && (
                            <select
                              className="ml-0 sm:ml-2 border-2 border-pink-200 rounded px-2 py-1 text-sm bg-pink-50 text-pink-700 font-bold"
                              value={product.sizes.includes(item.size) ? item.size : (product.sizes[0] || '')}
                              onChange={e => {
                                const newSize = e.target.value;
                                // التحقق من أن المقاس موجود في المنتج
                                if (product.sizes.includes(newSize)) {
                                  removeItem(item.id, item.size, item.color);
                                  addItem({ ...item, size: newSize }, item.quantity);
                                }
                              }}
                            >
                              {product.sizes.map((size, sizeIdx) => (
                                <option key={size + '-' + sizeIdx} value={size}>{size}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <p className="font-extrabold text-xl text-pink-600 mt-2 text-center">EG {item.price}</p>
                      </div>
                      <div className="flex flex-row justify-center items-center space-x-2 mt-2 md:mt-0 w-full md:w-auto">
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, item.color)}
                          className="p-1 border-2 border-pink-300 rounded-md hover:bg-pink-50 text-pink-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold px-3 text-pink-700">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, item.color)}
                          className="p-1 border-2 border-pink-300 rounded-md hover:bg-pink-50 text-pink-700"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-center w-full md:w-auto mt-2 md:mt-0">
                        <p className="font-extrabold text-lg text-pink-700">
                          EG {(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(item.id, item.size, item.color)}
                          className="text-red-500 hover:text-red-700 mt-2 mx-auto block"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200 sticky top-20">
                <h2 className="text-2xl font-extrabold text-center text-stone-800 mb-4 tracking-wide">ملخص الطلب</h2>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-full flex flex-col items-center bg-pink-50 rounded-lg py-3 mb-4 border border-pink-100">
                    <span className="text-lg font-semibold text-stone-700 mb-1">الإجمالي:</span>
                    <span className="text-3xl font-extrabold text-pink-600">EG {getTotalPrice().toFixed(2)}</span>
                    {deliveryPrice && (
                      <>
                        <span className="mt-2 text-base font-bold text-stone-900 bg-pink-100 rounded px-3 py-1">+ سعر التوصيل: EG {deliveryPrice}</span>
                        <span className="mt-2 text-lg font-extrabold text-pink-600 block">= الإجمالي الكلي: EG {(getTotalPrice() + deliveryPrice).toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="font-bold text-stone-700 mb-1">الاسم بالكامل *</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ادخل اسمك بالكامل"
                      className="rounded-lg border-2 border-stone-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition px-4 py-2 text-base shadow-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="font-bold text-stone-700 mb-1">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="ادخل رقم الهاتف"
                      className="rounded-lg border-2 border-stone-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition px-4 py-2 text-base shadow-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="additionalPhone" className="font-bold text-stone-700 mb-1">رقم هاتف إضافي (اختياري)</Label>
                    <Input
                      id="additionalPhone"
                      value={customerInfo.additionalPhone || ''}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, additionalPhone: e.target.value }))}
                      placeholder="ادخل رقم هاتف إضافي (اختياري)"
                      className="rounded-lg border-2 border-stone-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition px-4 py-2 text-base shadow-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="governorate" className="font-bold text-stone-700 mb-1">المحافظة *</Label>
                    <select
                      id="governorate"
                      className="w-full rounded-lg border-2 border-stone-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition px-4 py-2 text-base shadow-sm bg-white"
                      value={customerInfo.governorate}
                      onChange={e => setCustomerInfo(prev => ({ ...prev, governorate: e.target.value, center: '' }))}
                    >
                      <option value="">اختر المحافظة</option>
                      {Object.keys(EGYPT_GOVS).map((gov, govIdx) => (
                        <option key={gov + '-' + govIdx} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                  {customerInfo.governorate && (
                    <div>
                      <Label htmlFor="center" className="font-bold text-stone-700 mb-1">المركز *</Label>
                      <select
                        id="center"
                        className="w-full rounded-lg border-2 border-stone-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition px-4 py-2 text-base shadow-sm bg-white"
                        value={customerInfo.center}
                        onChange={e => setCustomerInfo(prev => ({ ...prev, center: e.target.value }))}
                      >
                        <option value="">اختر المركز</option>
                        {EGYPT_GOVS[customerInfo.governorate]?.map((center, centerIdx) => (
                          <option key={center.name + '-' + customerInfo.governorate + '-' + centerIdx} value={center.name}>{center.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="address" className="font-bold text-stone-700 mb-1">العنوان *</Label>
                    <Input
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="ادخل العنوان بالتفصيل"
                      className="rounded-lg border-2 border-stone-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition px-4 py-2 text-base shadow-sm"
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-lg p-3 mb-2 text-center font-semibold text-base">
                    يرجى إرسال سعر التوصيل لإتمام الطلب عن طريق إنستا باي أو فودافون كاش على الرقم: 01007361231
                  </div>
                  <Button type="button" onClick={handlePlaceOrder} className="w-full mt-4 py-3 text-lg font-bold rounded-lg bg-pink-600 hover:bg-pink-700 transition shadow-pink-100 shadow">Place Order</Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
