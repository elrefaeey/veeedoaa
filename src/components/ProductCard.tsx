import React, { useState, useEffect } from 'react';
import { Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const hasDiscount = typeof product.offerDiscount === 'number' && product.offerDiscount > 0;
  const newPrice = hasDiscount ? Math.round(product.price * (1 - product.offerDiscount / 100)) : product.price;

  // استخراج صورة المنتج الرئيسية: أول صورة من أول لون (images[0])، أو image لأول لون، أو صورة المنتج العامة، أو صورة افتراضية
  let mainImage = '';
  if (product.colors && product.colors.length > 0) {
    const firstColor = product.colors[0];
    if (Array.isArray((firstColor as any).images) && (firstColor as any).images.length > 0 && (firstColor as any).images[0]) {
      mainImage = (firstColor as any).images[0];
    } else if ((firstColor as any).image) {
      mainImage = (firstColor as any).image;
    }
  }
  if (!mainImage && product.image) {
    mainImage = product.image;
  }
  if (!mainImage) {
    mainImage = '/placeholder.svg';
  }

  return (
    <div 
      className="w-full bg-white rounded-xl shadow p-2 flex flex-col items-center cursor-pointer hover:shadow-lg transition"
      onClick={() => onClick(product)}
    >
      <div className="w-full aspect-[3/4] overflow-hidden bg-white mb-2 relative">
        {product.soldOut && (
          <div className="absolute top-2 left-2 bg-red-600 bg-opacity-90 text-white text-xs font-bold px-3 py-1 rounded z-10 shadow-lg select-none" style={{letterSpacing: 1}}>
            SOLD OUT
          </div>
        )}
        {mainImage && (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-contain rounded-lg border-4 border-white shadow-md bg-white"
          />
        )}
      </div>
      <div className="font-extrabold text-xl mb-1 text-center">{product.name}</div>
      {hasDiscount && (
        <div className="text-pink-600 font-bold mb-1">-{product.offerDiscount}% OFF</div>
      )}
      <div className="flex flex-col items-center mb-2">
        {hasDiscount ? (
          <>
            <span className="text-stone-400 line-through text-lg">EG {product.price}</span>
            <span className="text-black text-2xl font-bold">EG {newPrice}</span>
          </>
        ) : (
          <span className="text-black text-2xl font-bold">EG {product.price}</span>
        )}
      </div>
      <Button
        className="mt-2 px-6 py-2 rounded bg-pink-600 text-white font-bold hover:bg-pink-700 transition"
        onClick={e => {
          e.stopPropagation();
          onClick(product);
        }}
      >
        Shop Now
      </Button>
    </div>
  );
};

export default ProductCard;
