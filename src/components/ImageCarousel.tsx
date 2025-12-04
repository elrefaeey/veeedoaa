import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const images = [
  '/image (3).jpg', // يمين (now left image is here)
  '/image (2).jpg', // وسط
  '/image (1).jpg', // شمال (now right image is here)
];

const ImageGridHero = () => {
  const isMobile = useIsMobile();
  const [mobileIndex, setMobileIndex] = useState(0);

  useEffect(() => {
    if (!isMobile) return;
    
    const interval = setInterval(() => {
      setMobileIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= images.length) {
          // وصلنا لآخر صورة، توقف عن التكرار
          clearInterval(interval);
          return prev; // ابقى على آخر صورة
        }
        return nextIndex;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isMobile]);

  return (
    <div className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-center bg-black overflow-hidden">
      {/* الصور */}
      <div className="absolute inset-0 flex w-full h-full">
        {/* Desktop: 3 صور - Mobile: صورة واحدة تتبدل */}
        {isMobile ? (
          <img
            src={images[mobileIndex]}
            alt="mobile-slide"
            className="w-full h-full object-cover object-center mx-auto transition-all duration-500"
          />
        ) : (
          <>
        {/* يمين */}
        <img
          src={images[0]}
          alt="right"
          className="hidden md:block w-1/3 h-full object-cover object-center"
        />
        {/* وسط */}
        <img
          src={images[1]}
          alt="center"
          className="w-full md:w-1/3 h-full object-cover object-center mx-auto"
        />
        {/* شمال */}
        <img
          src={images[2]}
          alt="left"
          className="hidden md:block w-1/3 h-full object-cover object-center"
        />
          </>
        )}
      </div>
      {/* الأزرار */}
      <div className="relative z-10 flex flex-col items-center w-full px-2 mt-60 md:mt-80">
        <div className="text-center text-white mb-4 md:mb-6 mt-8 md:mt-12">
          <h1
            className="text-4xl xs:text-5xl md:text-8xl font-bold mb-2 md:mb-3 tracking-wider text-pink-600"
            style={{ WebkitTextStroke: '1px white' }}
          >
            Vee
          </h1>
          <p className="text-lg xs:text-xl md:text-2xl mb-1 md:mb-2 opacity-90 drop-shadow-lg">
            Let's shop!
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/products'}
          className="flex items-center border-2 border-pink-600 px-6 py-3 font-bold text-black bg-white hover:bg-stone-100 transition-colors text-base md:text-lg tracking-wide group mx-auto mb-3 rounded-md w-full max-w-xs md:max-w-fit justify-center"
        >
          Shop Now
          <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
      {/* تغطية شفافة خفيفة */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
};

export default ImageGridHero;
