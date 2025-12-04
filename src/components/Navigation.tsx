import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Lock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

const Navigation = () => {
  const location = useLocation();
  const { items } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-pink-600 tracking-wider">
            Vee
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-pink-600 hover:text-pink-800 transition-colors ${
                isActive('/') ? 'text-pink-800 font-medium' : ''
              }`}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`text-pink-600 hover:text-pink-800 transition-colors ${
                isActive('/products') ? 'text-pink-800 font-medium' : ''
              }`}
            >
              Products
            </Link>
            <Link 
              to="/cart" 
              className={`relative text-pink-600 hover:text-pink-800 transition-colors ${
                isActive('/cart') ? 'text-pink-800 font-medium' : ''
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-300 text-stone-800 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
