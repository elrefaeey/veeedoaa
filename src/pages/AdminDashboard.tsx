import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirebase } from '@/contexts/FirebaseContext';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { LogOut, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/hooks/useProducts';
import { EGYPT_GOVS } from '../lib/egyptGovs';

const AdminDashboard = () => {
  const { user } = useFirebase();
  const { logout } = useFirebaseAuth();
  const { products, loading } = useProducts();
  const navigate = useNavigate();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'offers'>('products');
  
  // عند تحميل منتج قديم أو تهيئة افتراضية
  const normalizeColors = (colors: any[] = []) =>
    colors.map(c => ({
      color: c.color || '',
      images: c.images ? c.images : c.image ? [c.image] : ['']
    }));

  // 1. تعديل تهيئة sizeImages في formData و newOfferForm
  const normalizeSizeImages = (arr: any[] = []) =>
    arr.map(s => ({
      size: s.size,
      images: s.images ? s.images : s.image ? [s.image] : ['']
    }));

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    type: '',
    sizes: [] as string[],
    image: '',
    description: '',
    colors: normalizeColors([{ color: '', images: [''] }]),
    sizeImages: normalizeSizeImages([]),
    soldOut: false,
  });

  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [offerTab, setOfferTab] = useState<'existing' | 'new'>('existing');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [offerTime, setOfferTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [offerDiscount, setOfferDiscount] = useState('');
  const [newOffer, setNewOffer] = useState({
    name: '',
    price: '',
    image: '',
    offerDiscount: ''
  });
  const [newOfferTime, setNewOfferTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [editOfferProduct, setEditOfferProduct] = useState(null);
  const [editOfferOpen, setEditOfferOpen] = useState(false);
  const [editOfferDiscount, setEditOfferDiscount] = useState(0);
  const [editOfferTime, setEditOfferTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [typeOptions, setTypeOptions] = useState<string[]>([]);

  const [editingCategory, setEditingCategory] = useState(false);
  const [editedCategory, setEditedCategory] = useState('');



  const offerProducts = products.filter(p => p.offer && (!p.offerEndTime || p.offerEndTime > Date.now()));

  // Get unique categories from products
  const categoryOptions = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(set);
  }, [products]);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    products.forEach(product => {
      if (!map.has(product.category)) map.set(product.category, []);
      map.get(product.category)!.push(product);
    });
    return map;
  }, [products]);

  // 1. Define all delivery areas from EGYPT_GOVS
  const DELIVERY_AREAS = Object.entries(EGYPT_GOVS || {}).flatMap(
    ([governorate, centers]) => centers.map(center => ({ ...center, governorate }))
  );

  // 1. إضافة حالة للعداد الموحد
  const [globalOfferTime, setGlobalOfferTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [globalOfferEndTime, setGlobalOfferEndTime] = useState<number|null>(null);

  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [newOfferForm, setNewOfferForm] = useState({
    name: '',
    price: '',
    category: '',
    type: '',
    sizes: [] as string[],
    image: '',
    description: '',
    colors: normalizeColors([{ color: '', images: [''] }]),
    sizeImages: normalizeSizeImages([]),
    offerDiscount: '',
  });

  React.useEffect(() => {
    if (!user) {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      type: '',
      sizes: [],
      image: '',
      description: '',
      colors: normalizeColors([{ color: '', images: [''] }]),
      sizeImages: normalizeSizeImages([]),
      soldOut: false,
    });
  };

  const handleSizeToggle = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      alert('يجب اختيار تصنيف للمنتج');
      return;
    }
    try {
      await addDoc(collection(db, 'products'), {
        ...formData,
        price: parseFloat(formData.price),
        category: formData.category, // always a string
        colors: formData.colors.filter(c => c.color && c.images && c.images.length > 0),
      });
      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!formData.category) {
      alert('يجب اختيار تصنيف للمنتج');
      return;
    }
    try {
      const { ...dataToUpdate } = formData;
      await updateDoc(doc(db, 'products', editingProduct.id), {
        ...dataToUpdate,
        price: parseFloat(formData.price),
        category: formData.category, // always a string
        colors: formData.colors.filter(c => c.color && c.images && c.images.length > 0),
      });
      resetForm();
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const openEditModal = async (product: Product) => {
    // جلب أحدث بيانات المنتج من Firestore
    const docRef = doc(db, 'products', product.id);
    const snap = await getDoc(docRef);
    let freshProduct: Product = product;
    if (snap.exists()) {
      const data = snap.data();
      freshProduct = {
        id: snap.id,
        name: data.name || '',
        price: data.price || '',
        category: data.category || '',
        type: data.type || '',
        sizes: data.sizes || [],
        image: data.image || '',
        description: data.description || '',
        colors: data.colors || [],
        sizeImages: data.sizeImages || [],
        soldOut: data.soldOut || false,
        offer: data.offer,
        offerDiscount: data.offerDiscount,
        offerEndTime: data.offerEndTime,
      };
    }
    setEditingProduct(freshProduct);
    setFormData({
      name: freshProduct.name,
      price: freshProduct.price.toString(),
      category: freshProduct.category,
      type: freshProduct.type,
      sizes: freshProduct.sizes || [],
      image: freshProduct.image,
      description: freshProduct.description,
      colors: normalizeColors(freshProduct.colors),
      sizeImages: normalizeSizeImages(freshProduct.sizeImages),
      soldOut: freshProduct.soldOut || false,
    });
    setIsEditModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];



  // 2. دالة لضبط العداد وتحديث كل المنتجات التي عليها عرض
  const handleSetGlobalOfferTimer = async () => {
    const totalMs = (globalOfferTime.days * 24 * 60 * 60 + globalOfferTime.hours * 60 * 60 + globalOfferTime.minutes * 60 + globalOfferTime.seconds) * 1000;
    const endTime = Date.now() + totalMs;
    setGlobalOfferEndTime(endTime);
    // تحديث كل المنتجات التي عليها عرض
    const batch = offerProducts.map(p => updateDoc(doc(db, 'products', p.id), { offerEndTime: endTime }));
    await Promise.all(batch);
  };

  const handleAddNewOfferProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferForm.name || !newOfferForm.price || !newOfferForm.image) {
      toast({
        title: 'يجب ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }
    const price = parseFloat(newOfferForm.price);
    const offerDiscount = parseFloat(newOfferForm.offerDiscount || '0');
    const endTime = globalOfferEndTime || null;

    try {
      await addDoc(collection(db, 'products'), {
        ...newOfferForm,
        price,
        offer: true,
        offerDiscount,
        offerEndTime: endTime,
        category: newOfferForm.category, // Use the selected category
        type: '', // Default to empty
        sizes: newOfferForm.sizes,
        colors: newOfferForm.colors.filter(c => c.color && c.images && c.images.length > 0),
        sizeImages: newOfferForm.sizeImages,
        image: newOfferForm.image, // Use the provided image
        description: newOfferForm.description,
      });
      setIsAddOfferOpen(false);
      setNewOfferForm({
        name: '',
        price: '',
        category: '',
        type: '',
        sizes: [],
        image: '',
        description: '',
        colors: normalizeColors([{ color: '', images: [''] }]),
        sizeImages: normalizeSizeImages([]),
        offerDiscount: '',
      });
      toast({
        title: 'تم إضافة المنتج بنجاح مع العرض',
        variant: 'default',
      });
    } catch (err) {
      console.error('Error adding new offer product:', err);
      toast({
        title: 'حدث خطأ أثناء إضافة المنتج',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
      <h1 className="text-xl font-semibold text-stone-800 mr-6">Vee Admin Dashboard</h1>
      <div className="flex items-center space-x-4">
        <span className="text-stone-600 text-sm font-medium">Welcome, {user.email}</span>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            className={`px-6 py-2 rounded-lg font-bold text-lg border transition-colors ${activeTab === 'products' ? 'bg-pink-100 text-pink-600 border-pink-300' : 'bg-white text-stone-900 border-stone-200 hover:bg-stone-50'}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button
            className={`px-6 py-2 rounded-lg font-bold text-lg border transition-colors ${activeTab === 'offers' ? 'bg-pink-100 text-pink-600 border-pink-300' : 'bg-white text-stone-900 border-stone-200 hover:bg-stone-50'}`}
            onClick={() => setActiveTab('offers')}
          >
            Offers
          </button>

        </div>

        {/* Tab Content */}
        {activeTab === 'products' && (
          <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-stone-800">Products ({products.length})</h2>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة منتج جديد</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                أدخل بيانات المنتج ثم اضغط حفظ لإضافة منتج جديد.
              </DialogDescription>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">اسم المنتج</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      placeholder="ادخل اسم المنتج"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">السعر (جنيه)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      required
                      placeholder="ادخل السعر"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">التصنيف</Label>
                        <div className="flex gap-2 items-center">
                      <select
                        id="category"
                        value={formData.category}
                        onChange={e => {
                          if (e.target.value === '+new') {
                            setShowNewCategoryInput(true);
                            setNewCategory('');
                          } else {
                            setShowNewCategoryInput(false);
                            setFormData(prev => ({ ...prev, category: e.target.value as string }));
                          }
                        }}
                        className="w-full border border-stone-300 rounded-md px-3 py-2"
                      >
                        {formData.category === '' && <option value="">اختر التصنيف</option>}
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                        <option value="+new">+ إضافة تصنيف جديد</option>
                      </select>
                            {!showNewCategoryInput && formData.category && !editingCategory && (
                              <button
                                type="button"
                                className="ml-2 px-2 py-1 rounded bg-stone-200 text-stone-700 hover:bg-pink-100 hover:text-pink-600 transition text-xs"
                                onClick={() => {
                                  setEditingCategory(true);
                                  setEditedCategory(formData.category);
                                }}
                              >
                                تعديل
                              </button>
                            )}
                          </div>
                        {showNewCategoryInput && (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              className="flex-1 border border-stone-300 rounded-md px-3 py-2"
                              placeholder="ادخل اسم التصنيف الجديد"
                              value={newCategory}
                              onChange={e => setNewCategory(e.target.value)}
                            />
                            <button
                              type="button"
                              className="px-4 py-2 rounded bg-pink-500 text-white font-bold hover:bg-pink-600 transition"
                              onClick={async () => {
                                if (newCategory.trim()) {
                                  await addCategory(newCategory);
                                  setShowNewCategoryInput(false);
                                  setNewCategory('');
                                  setFormData(prev => ({ ...prev, category: newCategory }));
                                }
                              }}
                            >
                              حفظ
                            </button>
                    </div>
                        )}
                        {editingCategory && (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              className="flex-1 border border-stone-300 rounded-md px-3 py-2"
                              value={editedCategory}
                              onChange={e => setEditedCategory(e.target.value)}
                            />
                            <button
                              type="button"
                              className="px-4 py-2 rounded bg-pink-500 text-white font-bold hover:bg-pink-600 transition"
                              onClick={async () => {
                                // Find the category object by name
                                const catObj = categories.find(cat => cat.name === formData.category);
                                if (catObj && editedCategory.trim() && editedCategory !== catObj.name) {
                                  await updateCategory(catObj.id, editedCategory.trim());
                                  setFormData(prev => ({ ...prev, category: editedCategory.trim() }));
                                }
                                setEditingCategory(false);
                              }}
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 rounded bg-stone-300 text-stone-700 hover:bg-stone-400 transition"
                              onClick={() => setEditingCategory(false)}
                            >
                              إلغاء
                            </button>
                          </div>
                        )}
                  </div>
                </div>
                
                {/* After the dropdown, render a list of categories with delete buttons: */}
                <div className="mt-2 flex flex-col gap-1">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <span>{cat.name}</span>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 text-xs"
                        onClick={async () => {
                          if (window.confirm(`هل أنت متأكد من حذف التصنيف '${cat.name}'؟`)) {
                            await deleteCategory(cat.id);
                            if (formData.category === cat.name) {
                              setFormData(prev => ({ ...prev, category: '' }));
                            }
                          }
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* الألوان */}
                <div>
                  <Label>الألوان</Label>
                  {formData.colors.map((c, idx) => (
                    <div key={idx} className="flex flex-col gap-2 mb-2 border p-2 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <Input
                          placeholder="لون المنتج (مثال: أحمر)"
                          value={c.color}
                          onChange={e => {
                            const newColors = [...formData.colors];
                            newColors[idx].color = e.target.value;
                            setFormData(prev => ({ ...prev, colors: newColors }));
                          }}
                          className="w-1/3"
                        />
                        {formData.colors.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" onClick={() => {
                            setFormData(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
                          }}>حذف اللون</Button>
                        )}
                      </div>
                      {/* صور اللون */}
                      {(c.images || []).map((img, imgIdx) => (
                        <div key={imgIdx} className="flex items-center gap-2 mb-1">
                          <Input
                            placeholder="رابط صورة اللون"
                            value={img}
                            onChange={e => {
                              const newColors = [...formData.colors];
                              newColors[idx].images[imgIdx] = e.target.value;
                              setFormData(prev => ({ ...prev, colors: newColors }));
                            }}
                            className="flex-1"
                          />
                          {c.images.length > 1 && (
                            <Button type="button" variant="destructive" size="sm" onClick={() => {
                              const newColors = [...formData.colors];
                              newColors[idx].images.splice(imgIdx, 1);
                              setFormData(prev => ({ ...prev, colors: newColors }));
                            }}>حذف الصورة</Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        const newColors = [...formData.colors];
                        newColors[idx].images.push('');
                        setFormData(prev => ({ ...prev, colors: newColors }));
                      }}>
                        إضافة صورة أخرى
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, colors: [...prev.colors, { color: '', images: [''] }] }))}>
                    إضافة لون آخر
                  </Button>
                </div>
                {/* اختيار المقاسات المتاحة مع حقل صورة لكل مقاس مختار */}
                <div className="mb-4">
                  <Label className="block mb-2 font-bold">المقاسات المتاحة</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {availableSizes.map(size => (
                      <button
                        type="button"
                        key={size}
                        className={`px-4 py-2 rounded border font-bold ${formData.sizes.includes(size) ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-stone-700 border-stone-300'}`}
                        onClick={() => {
                          setFormData(prev => {
                            let newSizes = prev.sizes.includes(size)
                              ? prev.sizes.filter(s => s !== size)
                              : [...prev.sizes, size];
                            // إذا أضفت مقاس جديد أضف له images افتراضية
                            let newSizeImages = prev.sizeImages.filter(si => newSizes.includes(si.size));
                            if (!prev.sizes.includes(size)) {
                              newSizeImages.push({ size, images: [''] });
                            }
                            return { ...prev, sizes: newSizes, sizeImages: newSizeImages };
                          });
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {/* حقول صور كل مقاس */}
                  <div className="space-y-2">
                    {formData.sizes.map((size) => {
                      const si = formData.sizeImages.find(img => img.size === size) || { size, images: [''] };
                      return (
                        <div key={size} className="flex flex-col gap-2 border p-2 rounded-md mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold">{size}</span>
                            <Button type="button" variant="destructive" size="sm" onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                sizes: prev.sizes.filter(s => s !== size),
                                sizeImages: prev.sizeImages.filter(img => img.size !== size)
                              }));
                            }}>حذف المقاس</Button>
                          </div>
                          {si.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="flex items-center gap-2 mb-1">
                              <Input
                                placeholder={`لينك صورة المقاس (${size}) (اختياري)`}
                                value={img}
                                onChange={e => {
                                  const newSizeImages = prev => prev.sizeImages.map(imgObj =>
                                    imgObj.size === size
                                      ? { ...imgObj, images: imgObj.images.map((im, i) => i === imgIdx ? e.target.value : im) }
                                      : imgObj
                                  );
                                  setFormData(prev => ({ ...prev, sizeImages: newSizeImages(prev) }));
                                }}
                                className="flex-1"
                              />
                              {si.images.length > 1 && (
                                <Button type="button" variant="destructive" size="sm" onClick={() => {
                                  const newSizeImages = prev => prev.sizeImages.map(imgObj =>
                                    imgObj.size === size
                                      ? { ...imgObj, images: imgObj.images.filter((_, i) => i !== imgIdx) }
                                      : imgObj
                                  );
                                  setFormData(prev => ({ ...prev, sizeImages: newSizeImages(prev) }));
                                }}>حذف الصورة</Button>
                              )}
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            const newSizeImages = prev => prev.sizeImages.map(imgObj =>
                              imgObj.size === size
                                ? { ...imgObj, images: [...imgObj.images, ''] }
                                : imgObj
                            );
                            setFormData(prev => ({ ...prev, sizeImages: newSizeImages(prev) }));
                          }}>
                            إضافة صورة أخرى
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* صوره المقاس (اختياري) */}
                {/* تم حذف حقل صوره المقاس بناءً على طلب المستخدم */}
                
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-stone-300 rounded-md px-3 py-2 h-20"
                    required
                    placeholder="اكتب وصف المنتج هنا"
                  />
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="soldOut"
                    checked={formData.soldOut || false}
                    onChange={e => setFormData(prev => ({ ...prev, soldOut: e.target.checked }))}
                  />
                  <Label htmlFor="soldOut">نفد من المخزون (Sold Out)</Label>
                </div>
                
                <Button type="submit" className="w-full">
                  إضافة المنتج
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800 mx-auto mb-4"></div>
            <p className="text-stone-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, idx) => (
                  <Card key={product.id + '-' + idx}>
                <CardHeader>
                  <img
                    src={product.colors && product.colors.length > 0
                      ? ((product.colors[0] as any).images && (product.colors[0] as any).images.length > 0
                          ? (product.colors[0] as any).images[0]
                          : (product.colors[0] as any).image)
                      : product.image}
                    alt={product.name}
                    className="w-full h-40 object-contain rounded mb-2"
                  />
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
                      <p className="text-stone-600 text-sm mb-2">{product.category}</p>
                  <p className="font-semibold text-lg mb-2">${product.price}</p>
                  <p className="text-stone-600 text-sm mb-2">Sizes: {product.sizes.join(', ')}</p>
                  <p className="text-stone-600 text-sm mb-4">{product.description}</p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(product)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Fill in the product details below and click Save to update the product.
            </DialogDescription>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Product Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Price ($)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                      <div className="flex gap-2 items-center">
                  <select
                    id="edit-category"
                          value={showNewCategoryInput ? '+new' : formData.category}
                          onChange={e => {
                            if (e.target.value === '+new') {
                              setShowNewCategoryInput(true);
                              setNewCategory('');
                            } else {
                              setShowNewCategoryInput(false);
                              setFormData(prev => ({ ...prev, category: e.target.value as string }));
                            }
                          }}
                    className="w-full border border-stone-300 rounded-md px-3 py-2"
                  >
                          {categoryOptions.map((opt, idx) => (
                            <option key={opt + '-' + idx} value={opt}>{opt}</option>
                          ))}
                          <option value="+new">+ Add new category</option>
                  </select>
                        {!showNewCategoryInput && formData.category && !editingCategory && (
                          <button
                            type="button"
                            className="ml-2 px-2 py-1 rounded bg-stone-200 text-stone-700 hover:bg-pink-100 hover:text-pink-600 transition text-xs"
                            onClick={() => {
                              setEditingCategory(true);
                              setEditedCategory(formData.category);
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {showNewCategoryInput && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            className="flex-1 border border-stone-300 rounded-md px-3 py-2"
                            placeholder="Enter new category"
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                          />
                          <button
                            type="button"
                            className="px-4 py-2 rounded bg-pink-500 text-white font-bold hover:bg-pink-600 transition"
                            onClick={() => {
                              if (['Men', 'Women', 'Kids'].includes(newCategory)) {
                                setFormData(prev => ({ ...prev, category: newCategory as any }));
                                setShowNewCategoryInput(false);
                              }
                            }}
                          >
                            Save
                          </button>
                </div>
                      )}
                      {editingCategory && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            className="flex-1 border border-stone-300 rounded-md px-3 py-2"
                            value={editedCategory}
                            onChange={e => setEditedCategory(e.target.value)}
                          />
                          <button
                            type="button"
                            className="px-4 py-2 rounded bg-pink-500 text-white font-bold hover:bg-pink-600 transition"
                            onClick={async () => {
                              if (['Men', 'Women', 'Kids'].includes(editedCategory) && editedCategory !== formData.category) {
                                // Replace old category with new in options
                                const oldCategory = formData.category;
                                const idx = categoryOptions.indexOf(oldCategory);
                                if (idx !== -1) categoryOptions[idx] = editedCategory;
                                setFormData(prev => ({ ...prev, category: editedCategory as any }));
                                setEditingCategory(false);
                                // Update all products in Firestore with oldCategory
                                try {
                                  const q = query(collection(db, 'products'), where('category', '==', oldCategory));
                                  const snapshot = await getDocs(q);
                                  const batch = [];
                                  snapshot.forEach(docSnap => {
                                    batch.push(updateDoc(doc(db, 'products', docSnap.id), { category: editedCategory as any }));
                                  });
                                  await Promise.all(batch);
                                } catch (err) {
                                  console.error('Error updating category in products:', err);
                                }
                              } else {
                                setEditingCategory(false);
                              }
                            }}
                          >
                            Save
                          </button>
                            <button
                              type="button"
                              className="px-4 py-2 rounded bg-stone-300 text-stone-700 hover:bg-stone-400 transition"
                              onClick={() => setEditingCategory(false)}
                            >
                              Cancel
                            </button>
                        </div>
                      )}
                </div>
              </div>
              
              <div>
                <Label>Colors</Label>
                {formData.colors.map((c, idx) => (
                  <div key={idx} className="flex flex-col gap-2 mb-2 border p-2 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <Input
                        placeholder="لون المنتج (مثال: أحمر)"
                        value={c.color}
                        onChange={e => {
                          const newColors = [...formData.colors];
                          newColors[idx].color = e.target.value;
                          setFormData(prev => ({ ...prev, colors: newColors }));
                        }}
                        className="w-1/3"
                      />
                      {formData.colors.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => {
                          setFormData(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
                        }}>حذف اللون</Button>
                      )}
                    </div>
                    {/* صور اللون */}
                    {(c.images || []).map((img, imgIdx) => (
                      <div key={imgIdx} className="flex items-center gap-2 mb-1">
                        <Input
                          placeholder="رابط صورة اللون"
                          value={img}
                          onChange={e => {
                            const newColors = [...formData.colors];
                            newColors[idx].images[imgIdx] = e.target.value;
                            setFormData(prev => ({ ...prev, colors: newColors }));
                          }}
                          className="flex-1"
                        />
                        {c.images.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" onClick={() => {
                            const newColors = [...formData.colors];
                            newColors[idx].images.splice(imgIdx, 1);
                            setFormData(prev => ({ ...prev, colors: newColors }));
                          }}>حذف الصورة</Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => {
                      const newColors = [...formData.colors];
                      newColors[idx].images.push('');
                      setFormData(prev => ({ ...prev, colors: newColors }));
                    }}>
                      إضافة صورة أخرى
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, colors: [...prev.colors, { color: '', images: [''] }] }))}>
                  إضافة لون آخر
                </Button>
              </div>
              
              <div>
                <Label>Available Sizes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                      {availableSizes.map((size, idx) => (
                    <button
                          key={size + '-' + idx}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        formData.sizes.includes(size)
                          ? 'border-stone-800 bg-stone-800 text-white'
                          : 'border-stone-300 hover:border-stone-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              {/* صور كل مقاس */}
              {formData.sizes.length > 0 && (
                <div className="mb-4">
                  <Label className="block mb-2 font-bold text-pink-700">صور كل مقاس (اختياري)</Label>
                  <div className="space-y-2">
                    {formData.sizes.map((size) => {
                      const si = formData.sizeImages.find(img => img.size === size) || { size, images: [''] };
                      return (
                        <div key={size} className="flex flex-col gap-2 border p-2 rounded-md mb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold">{size}</span>
                            <Button type="button" variant="destructive" size="sm" onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                sizes: prev.sizes.filter(s => s !== size),
                                sizeImages: prev.sizeImages.filter(img => img.size !== size)
                              }));
                            }}>حذف المقاس</Button>
                          </div>
                          {si.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="flex items-center gap-2 mb-1">
                              <Input
                                placeholder={`لينك صورة المقاس (${size}) (اختياري)`}
                                value={img}
                                onChange={e => {
                                  const newSizeImages = prev => prev.sizeImages.map(imgObj =>
                                    imgObj.size === size
                                      ? { ...imgObj, images: imgObj.images.map((im, i) => i === imgIdx ? e.target.value : im) }
                                      : imgObj
                                  );
                                  setFormData(prev => ({ ...prev, sizeImages: newSizeImages(prev) }));
                                }}
                                className="flex-1"
                              />
                              {si.images.length > 1 && (
                                <Button type="button" variant="destructive" size="sm" onClick={() => {
                                  const newSizeImages = prev => prev.sizeImages.map(imgObj =>
                                    imgObj.size === size
                                      ? { ...imgObj, images: imgObj.images.filter((_, i) => i !== imgIdx) }
                                      : imgObj
                                  );
                                  setFormData(prev => ({ ...prev, sizeImages: newSizeImages(prev) }));
                                }}>حذف الصورة</Button>
                              )}
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            const newSizeImages = prev => prev.sizeImages.map(imgObj =>
                              imgObj.size === size
                                ? { ...imgObj, images: [...imgObj.images, ''] }
                                : imgObj
                            );
                            setFormData(prev => ({ ...prev, sizeImages: newSizeImages(prev) }));
                          }}>
                            إضافة صورة أخرى
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-stone-300 rounded-md px-3 py-2 h-20"
                  required
                />
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="soldOut"
                    checked={formData.soldOut || false}
                    onChange={e => setFormData(prev => ({ ...prev, soldOut: e.target.checked }))}
                  />
                  <Label htmlFor="soldOut">نفد من المخزون (Sold Out)</Label>
                </div>
                
              <Button type="submit" className="w-full">
                Update Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        )}
        {activeTab === 'offers' && (
          <div>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold">Manage Offers</h2>
              <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-2 items-end bg-white rounded shadow p-2 w-full sm:w-auto">
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    <span className="mb-1 font-semibold text-xs">Days</span>
                    <input type="number" min="0" className="w-full sm:w-12 border rounded px-2 py-1 text-center" value={globalOfferTime.days} onChange={e => setGlobalOfferTime(t => ({ ...t, days: +e.target.value }))} />
                  </div>
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    <span className="mb-1 font-semibold text-xs">Hours</span>
                    <input type="number" min="0" max="23" className="w-full sm:w-10 border rounded px-2 py-1 text-center" value={globalOfferTime.hours} onChange={e => setGlobalOfferTime(t => ({ ...t, hours: +e.target.value }))} />
                  </div>
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    <span className="mb-1 font-semibold text-xs">Minutes</span>
                    <input type="number" min="0" max="59" className="w-full sm:w-10 border rounded px-2 py-1 text-center" value={globalOfferTime.minutes} onChange={e => setGlobalOfferTime(t => ({ ...t, minutes: +e.target.value }))} />
                  </div>
                  <div className="flex flex-col items-center w-full sm:w-auto">
                    <span className="mb-1 font-semibold text-xs">Seconds</span>
                    <input type="number" min="0" max="59" className="w-full sm:w-10 border rounded px-2 py-1 text-center" value={globalOfferTime.seconds} onChange={e => setGlobalOfferTime(t => ({ ...t, seconds: +e.target.value }))} />
                  </div>
                  <Button type="button" className="ml-0 sm:ml-2 w-full sm:w-auto mt-2 sm:mt-0" onClick={handleSetGlobalOfferTimer}>Set Timer</Button>
                </div>
                <Dialog open={isAddOfferOpen} onOpenChange={setIsAddOfferOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsAddOfferOpen(true)} className="w-full sm:w-auto">Add Offer</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Offer</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                      Fill in the offer details below and click Save to add a new offer.
                    </DialogDescription>
                    <div className="flex mb-4 gap-2">
                      <button
                        className={`px-4 py-2 rounded font-bold border ${offerTab === 'existing' ? 'bg-pink-100 text-pink-600 border-pink-300' : 'bg-white text-stone-900 border-stone-200 hover:bg-stone-50'}`}
                        onClick={() => setOfferTab('existing')}
                      >
                        منتج موجود
                      </button>
                      <button
                        className={`px-4 py-2 rounded font-bold border ${offerTab === 'new' ? 'bg-pink-100 text-pink-600 border-pink-300' : 'bg-white text-stone-900 border-stone-200 hover:bg-stone-50'}`}
                        onClick={() => setOfferTab('new')}
                      >
                        منتج جديد
                      </button>
                    </div>
                    {offerTab === 'existing' && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!selectedProductId) return;
                        const endTime = globalOfferEndTime || null;
                        try {
                          await updateDoc(doc(db, 'products', selectedProductId), {
                            offer: true,
                            offerDiscount: Number(offerDiscount),
                            offerEndTime: endTime
                          });
                          setIsAddOfferOpen(false);
                          setSelectedProductId('');
                          setOfferDiscount('');
                        } catch (err) {
                          console.error('Error saving offer:', err);
                        }
                      }}>
                        <div>
                          <label className="block mb-1 font-semibold">Select Product</label>
                          <select
                            className="w-full border rounded px-3 py-2"
                            value={selectedProductId}
                            onChange={e => setSelectedProductId(e.target.value)}
                          >
                            <option value="">-- Select --</option>
                            {Array.from(productsByCategory.entries() as IterableIterator<[string, Product[]]> )
                              .filter(([category]) => !!category)
                              .map(([category, prods], idx) => (
                                <optgroup key={String(category) + '-' + idx} label={String(category)}>
                                  {prods.map((product, idx) => (
                                    <option key={product.id + '-' + idx} value={product.id}>{product.name}</option>
                                  ))}
                                </optgroup>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 font-semibold">Offer Discount (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full border rounded px-3 py-2"
                            value={offerDiscount}
                            onChange={e => setOfferDiscount(e.target.value)}
                          />
                        </div>
                        <Button type="submit" className="w-full">Save Offer</Button>
                      </form>
                    )}
                    {offerTab === 'new' && (
                      <form onSubmit={handleAddNewOfferProduct} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="new-offer-name">اسم المنتج</Label>
                            <Input
                              id="new-offer-name"
                              value={newOfferForm.name}
                              onChange={e => setNewOfferForm(prev => ({ ...prev, name: e.target.value }))}
                              required
                              placeholder="ادخل اسم المنتج"
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-offer-price">السعر (جنيه)</Label>
                            <Input
                              id="new-offer-price"
                              type="number"
                              step="0.01"
                              value={newOfferForm.price}
                              onChange={e => setNewOfferForm(prev => ({ ...prev, price: e.target.value }))}
                              required
                              placeholder="ادخل السعر"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="new-offer-category">التصنيف</Label>
                            <select
                              id="new-offer-category"
                              value={newOfferForm.category}
                              onChange={e => setNewOfferForm(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full border border-stone-300 rounded-md px-3 py-2"
                            >
                              <option value="">اختر التصنيف</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {/* الألوان */}
                        <div>
                          <Label>الألوان</Label>
                          {newOfferForm.colors.map((c, idx) => (
                            <div key={idx} className="flex flex-col gap-2 mb-2 border p-2 rounded-md">
                              <div className="flex items-center gap-2 mb-1">
                                <Input
                                  placeholder="لون المنتج (مثال: أحمر)"
                                  value={c.color}
                                  onChange={e => {
                                    const newColors = [...newOfferForm.colors];
                                    newColors[idx].color = e.target.value;
                                    setNewOfferForm(prev => ({ ...prev, colors: newColors }));
                                  }}
                                  className="w-1/3"
                                />
                                {newOfferForm.colors.length > 1 && (
                                  <Button type="button" variant="destructive" size="sm" onClick={() => {
                                    setNewOfferForm(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
                                  }}>حذف اللون</Button>
                                )}
                              </div>
                              {/* صور اللون */}
                              {(c.images || []).map((img, imgIdx) => (
                                <div key={imgIdx} className="flex items-center gap-2 mb-1">
                                  <Input
                                    placeholder="رابط صورة اللون"
                                    value={img}
                                    onChange={e => {
                                      const newColors = [...newOfferForm.colors];
                                      if (!newColors[idx].images) newColors[idx].images = [''];
                                      newColors[idx].images[imgIdx] = e.target.value;
                                      setNewOfferForm(prev => ({ ...prev, colors: newColors }));
                                    }}
                                    className="flex-1"
                                  />
                                  {c.images.length > 1 && (
                                    <Button type="button" variant="destructive" size="sm" onClick={() => {
                                      const newColors = [...newOfferForm.colors];
                                      newColors[idx].images.splice(imgIdx, 1);
                                      setNewOfferForm(prev => ({ ...prev, colors: newColors }));
                                    }}>حذف الصورة</Button>
                                  )}
                                </div>
                              ))}
                              <Button type="button" variant="outline" size="sm" onClick={() => {
                                const newColors = [...newOfferForm.colors];
                                if (!newColors[idx].images) newColors[idx].images = [''];
                                newColors[idx].images.push('');
                                setNewOfferForm(prev => ({ ...prev, colors: newColors }));
                              }}>
                                إضافة صورة أخرى
                              </Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => setNewOfferForm(prev => ({ ...prev, colors: [...prev.colors, { color: '', images: [''] }] }))}>
                            إضافة لون آخر
                          </Button>
                        </div>
                        {/* المقاسات */}
                        <div className="mb-4">
                          <Label className="block mb-2 font-bold">المقاسات المتاحة</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {availableSizes.map(size => (
                              <button
                                key={size}
                                type="button"
                                className={`px-3 py-1 rounded border ${newOfferForm.sizes.includes(size) ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-stone-700 border-stone-300'}`}
                                onClick={() => {
                                  setNewOfferForm(prev => prev.sizes.includes(size)
                                    ? { ...prev, sizes: prev.sizes.filter(s => s !== size) }
                                    : { ...prev, sizes: [...prev.sizes, size] });
                                }}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* صور كل مقاس */}
                        {newOfferForm.sizes.length > 0 && (
                          <div className="mb-4">
                            <Label className="block mb-2 font-bold text-pink-700">صور كل مقاس (اختياري)</Label>
                            <div className="space-y-2">
                              {newOfferForm.sizes.map((size) => {
                                const si = newOfferForm.sizeImages.find(img => img.size === size) || { size, images: [''] };
                                return (
                                  <div key={size} className="flex flex-col gap-2 border p-2 rounded-md mb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold">{size}</span>
                                      <Button type="button" variant="destructive" size="sm" onClick={() => {
                                        setNewOfferForm(prev => ({
                                          ...prev,
                                          sizes: prev.sizes.filter(s => s !== size),
                                          sizeImages: prev.sizeImages.filter(img => img.size !== size)
                                        }));
                                      }}>حذف المقاس</Button>
                                    </div>
                                    {si.images.map((img, imgIdx) => (
                                      <div key={imgIdx} className="flex items-center gap-2 mb-1">
                                        <Input
                                          placeholder={`لينك صورة المقاس (${size}) (اختياري)`}
                                          value={img}
                                          onChange={e => {
                                            const newSizeImages = prev => prev.sizeImages.map(imgObj =>
                                              imgObj.size === size
                                                ? { ...imgObj, images: imgObj.images.map((im, i) => i === imgIdx ? e.target.value : im) }
                                                : imgObj
                                            );
                                            setNewOfferForm(prev => ({ ...prev, sizeImages: newSizeImages(prev) }));
                                          }}
                                          className="flex-1"
                                        />
                                        {si.images.length > 1 && (
                                          <Button type="button" variant="destructive" size="sm" onClick={() => {
                                            const newSizeImages = prev => prev.sizeImages.map(imgObj =>
                                              imgObj.size === size
                                                ? { ...imgObj, images: imgObj.images.filter((_, i) => i !== imgIdx) }
                                                : imgObj
                                            );
                                            setNewOfferForm(prev => ({ ...prev, sizeImages: newSizeImages(prev) }));
                                          }}>حذف الصورة</Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => {
                                      const newSizeImages = prev => prev.sizeImages.map(imgObj =>
                                        imgObj.size === size
                                          ? { ...imgObj, images: [...imgObj.images, ''] }
                                          : imgObj
                                      );
                                      setNewOfferForm(prev => ({ ...prev, sizeImages: newSizeImages(prev) }));
                                    }}>
                                      إضافة صورة أخرى
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* الوصف */}
                        <div>
                          <Label htmlFor="new-offer-description">الوصف</Label>
                          <textarea
                            id="new-offer-description"
                            value={newOfferForm.description}
                            onChange={e => setNewOfferForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full border border-stone-300 rounded-md px-3 py-2 h-20"
                            required
                            placeholder="اكتب وصف المنتج هنا"
                          />
                        </div>
                        {/* نسبة الخصم */}
                        <div>
                          <Label htmlFor="new-offer-discount">نسبة الخصم (%)</Label>
                          <Input
                            id="new-offer-discount"
                            type="number"
                            min="0"
                            max="100"
                            value={newOfferForm.offerDiscount}
                            onChange={e => setNewOfferForm(prev => ({ ...prev, offerDiscount: e.target.value }))}
                            placeholder="ادخل نسبة الخصم (اختياري)"
                          />
                        </div>
                        <Button type="submit" className="w-full">حفظ المنتج مع العرض</Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Current Offers</h3>
              {offerProducts.length === 0 ? (
                <div className="text-stone-500">No current offers.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offerProducts.map((product, idx) => {
                    const hasDiscount = product.offerDiscount && product.offerDiscount > 0;
                    const newPrice = hasDiscount ? Math.round(product.price * (1 - product.offerDiscount / 100)) : product.price;
                    return (
                      <div key={product.id + '-' + idx} className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
                        <img src={product.image} alt={product.name} className="w-full h-40 object-contain rounded mb-2" />
                        <div className="font-extrabold text-xl mb-1 text-center">{product.name}</div>
                        {hasDiscount && (
                          <div className="text-pink-600 font-bold mb-1">-{product.offerDiscount}% OFF</div>
                        )}
                        <div className="flex flex-col items-center mb-2">
                          {hasDiscount && (
                            <span className="text-stone-400 line-through text-lg">EG {product.price}</span>
                          )}
                          <span className="text-black text-2xl font-bold">EG {newPrice}</span>
                        </div>
                        <div className="text-stone-500 text-sm mb-2">
                          Ends: {product.offerEndTime ? new Date(product.offerEndTime).toLocaleString() : 'N/A'}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            className="px-4 py-2 rounded bg-pink-500 text-white font-bold hover:bg-pink-600 transition"
                            onClick={() => {
                              setEditOfferProduct(product);
                              setEditOfferDiscount(product.offerDiscount || 0);
                              setEditOfferOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="px-4 py-2 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition"
                            onClick={async () => {
                              await updateDoc(doc(db, 'products', product.id), { offer: false, offerDiscount: 0, offerEndTime: null });
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
