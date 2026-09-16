'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useThemeStore } from '@/stores/theme-store';
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { ShoppingCart, Search, Package, Plus, Minus, Trash2, CreditCard, Image as ImageIcon } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  spec: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string;
  unit: string;
  isDisplayed: boolean;
  vendor: { name: string };
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function ShopPurchasePage() {
  const { shopSlug } = useParams();
  const [mounted, setMounted] = useState(false);
  const store = useThemeStore();
  useEffect(() => setMounted(true), []);
  const theme = mounted ? store.theme : getTheme(DEFAULT_THEME_ID);
  const c = theme.colors;

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('전체');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/admin/vendor-products');
        if (res.ok) {
          const data = await res.json();
          // 진열 ON인 상품만 표시
          setProducts((data || []).filter((p: Product) => p.isDisplayed !== false));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchProducts();
  }, [shopSlug]);

  const categories = ['전체', ...new Set(products.map(p => p.category || '기타'))];
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === '전체' || p.category === category;
    return matchSearch && matchCat;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exist = prev.find(c => c.product.id === product.id);
      if (exist) return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.product.id !== productId) return c;
      const newQty = c.quantity + delta;
      return newQty > 0 ? { ...c, quantity: newQty } : c;
    }).filter(c => c.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const getDisplayPrice = (p: Product) => p.discountPrice || p.price;
  const totalAmount = cart.reduce((sum, c) => sum + getDisplayPrice(c.product) * c.quantity, 0);
  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="p-4 md:p-6 space-y-4" style={{ color: c.text }}>
      {/* 검색/필터 */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: c.textLight }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="상품명, 브랜드 검색"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: c.border, background: c.surface }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
              style={{ background: category === cat ? c.primary : c.surfaceHover, color: category === cat ? 'white' : c.textLight }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* 상품 목록 */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-20 text-sm" style={{ color: c.textLight }}>상품을 불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package className="mx-auto mb-3 h-10 w-10" style={{ color: c.borderLight }} />
              <p className="text-sm" style={{ color: c.textLight }}>등록된 상품이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(product => {
                const inCart = cart.find(c => c.product.id === product.id);
                const displayPrice = getDisplayPrice(product);
                return (
                  <div key={product.id} className="rounded-xl border overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
                    style={{ borderColor: inCart ? c.primary : c.borderLight, background: c.surface }}
                    onClick={() => addToCart(product)}>
                    <div className="aspect-square relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: c.surfaceHover }}>
                          <Package className="h-8 w-8" style={{ color: c.borderLight }} />
                        </div>
                      )}
                      {inCart && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: c.primary }}>{inCart.quantity}</div>
                      )}
                      {product.discountPrice && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-red-500">
                          {Math.round((1 - product.discountPrice / product.price) * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] font-medium mb-0.5" style={{ color: c.textLight }}>{product.brand || product.vendor?.name || '미분류'}</div>
                      <div className="text-xs font-bold truncate" style={{ color: c.text }}>{product.name}</div>
                      {product.spec && <div className="text-[10px] mt-0.5" style={{ color: c.textLight }}>{product.spec}</div>}
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        {product.discountPrice ? (<>
                          <span className="text-sm font-extrabold text-red-500">{product.discountPrice.toLocaleString()}원</span>
                          <span className="text-[10px] line-through" style={{ color: c.textLight }}>{product.price.toLocaleString()}</span>
                        </>) : (
                          <span className="text-sm font-extrabold" style={{ color: c.primary }}>{product.price.toLocaleString()}원</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 장바구니 */}
        <div className="lg:w-80 xl:w-96">
          <div className="rounded-2xl border sticky top-20" style={{ borderColor: c.border, background: c.surface }}>
            <div className="p-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${c.borderLight}` }}>
              <ShoppingCart className="h-4 w-4" style={{ color: c.primary }} />
              <span className="text-sm font-bold" style={{ color: c.text }}>장바구니</span>
              {totalItems > 0 && (
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: c.primary }}>{totalItems}</span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="mx-auto mb-2 h-8 w-8" style={{ color: c.borderLight }} />
                <p className="text-xs" style={{ color: c.textLight }}>상품을 클릭하여 추가하세요</p>
              </div>
            ) : (
              <>
                <div className="p-3 space-y-2 max-h-[40vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 rounded-xl p-2" style={{ background: c.surfaceHover }}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: c.borderLight }}>
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4" style={{ color: c.textLight }} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: c.text }}>{item.product.name}</div>
                        <div className="text-xs font-semibold" style={{ color: c.primary }}>{(getDisplayPrice(item.product) * item.quantity).toLocaleString()}원</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); updateQty(item.product.id, -1); }}
                          className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: c.surface, border: `1px solid ${c.borderLight}` }}>
                          <Minus className="h-3 w-3" style={{ color: c.textLight }} />
                        </button>
                        <span className="text-xs font-bold w-5 text-center" style={{ color: c.text }}>{item.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); updateQty(item.product.id, 1); }}
                          className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: c.surface, border: `1px solid ${c.borderLight}` }}>
                          <Plus className="h-3 w-3" style={{ color: c.textLight }} />
                        </button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.product.id); }}
                        className="p-1"><Trash2 className="h-3.5 w-3.5" style={{ color: '#EF4444' }} /></button>
                    </div>
                  ))}
                </div>

                <div className="p-4" style={{ borderTop: `1px solid ${c.borderLight}` }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium" style={{ color: c.textLight }}>합계</span>
                    <span className="text-lg font-extrabold" style={{ color: c.text }}>{totalAmount.toLocaleString()}원</span>
                  </div>
                  <button className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
                    style={{ background: c.primary }}>
                    <CreditCard className="h-4 w-4" />
                    주문하기 ({totalItems}개)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
