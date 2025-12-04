import React from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-stone-100 text-stone-800 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-8 md:gap-8 text-center md:text-left items-center md:items-start">
          <div className="mb-6 md:mb-0">
            <h3 className="text-2xl font-bold mb-4 text-pink-600">Vee</h3>
            <p className="text-stone-600 max-w-xs mx-auto md:mx-0">
              Elegance redefined through timeless fashion and contemporary style.
            </p>
          </div>
          <div className="mb-6 md:mb-0">
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-stone-700">
              <li><a href="/" className="hover:text-stone-900 transition-colors">Home</a></li>
              <li><a href="/products" className="hover:text-stone-900 transition-colors">Products</a></li>
              <li><a href="/cart" className="hover:text-stone-900 transition-colors">Cart</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="flex flex-col gap-2 items-center justify-center md:items-start md:justify-start">
              <div className="flex gap-4 items-center justify-center md:justify-start">
                <a
                  href="https://api.whatsapp.com/send/?phone=201559839407&text=السلام عليكم"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-stone-700 hover:text-green-600 transition-colors"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  WhatsApp
                </a>
                <a
                  href="https://www.instagram.com/vee.desi9n/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-stone-700 hover:text-pink-600 transition-colors"
                >
                  <FaInstagram className="w-5 h-5" />
                  Instagram
                </a>
              </div>
              <a
                href="mailto:doaaatalla5@gmail.com"
                className="flex items-center gap-2 text-stone-700 hover:text-blue-600 transition-colors mt-2"
              >
                <span className="font-semibold">Email:</span> doaaatalla5@gmail.com
              </a>
              <div className="text-stone-600 text-sm mt-1">Qalyubia, Banha, Egypt</div>
            </div>
          </div>
        </div>
        <div className="border-t border-stone-300 mt-8 pt-6 flex flex-col items-center">
          <div className="flex flex-col items-center gap-1">
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-stone-500 hover:underline text-[10px] md:text-xs">Privacy Policy</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Privacy Policy</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  <div className="text-stone-700 text-base space-y-2 mt-2">
                    <p>At VEE, we respect your privacy. We only collect the necessary information to process your orders and improve your shopping experience.</p>
                    <p>Your data will never be sold or shared with third parties without your consent, unless required by law.</p>
                    <p>We use secure technologies to protect your personal information.</p>
                  </div>
                </DialogDescription>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-stone-500 hover:underline text-[10px] md:text-xs">Refund & Exchange Policy</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Refund & Exchange Policy</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  <div className="text-stone-700 text-base space-y-2 mt-2">
                    <p>You can request a refund or exchange within 14 days of receiving your order, provided the item is unused, in its original condition, and with original tags attached.</p>
                    <p>Refunds are processed within 7 business days after we receive the returned item.</p>
                    <p>Shipping fees are non-refundable unless the item is defective or a mistake occurred on our part.</p>
                    <p>To initiate a return or exchange, please contact us:<br/>
                    📧 doaaatalla5@gmail.com<br/>
                    📞 01030972737
                    </p>
                  </div>
                </DialogDescription>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-stone-500 hover:underline text-[10px] md:text-xs">Shipping & Delivery Policy</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Shipping & Delivery Policy</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  <div className="text-stone-700 text-base space-y-2 mt-2">
                    <p>Orders are processed within 1–2 business days.</p>
                    <p>Delivery within Egypt takes 2 to 7 business days, depending on your location.</p>
                    <p>You will receive a tracking number once your order is shipped.</p>
                    <p>In case of delays, we will contact you directly via phone or email.</p>
                  </div>
                </DialogDescription>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-stone-500 hover:underline text-[10px] md:text-xs">Terms & Conditions</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Terms & Conditions</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  <div className="text-stone-700 text-base space-y-2 mt-2">
                    <p>By using our website, you agree to the following terms:</p>
                    <p>All content (images, text, designs) on this website is the property of VEE and may not be copied or reused without permission.</p>
                    <p>Prices and product availability are subject to change without notice.</p>
                    <p>We reserve the right to cancel any order for any reason.</p>
                    <p>Any misuse, fraud, or violation of our policies may result in termination of service.</p>
                  </div>
                </DialogDescription>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-stone-500 hover:underline text-[10px] md:text-xs">About Us</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About Us</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  <div className="text-stone-700 text-base space-y-2 mt-2">
                    <p>VEE is a modern Egyptian brand that specializes in modest fashion for hijabi women.</p>
                    <p>We proudly create and sell pieces that reflect Egyptian identity, modesty, and elegance — all tailored for modern veiled women.</p>
                    <p>Our mission is to empower hijabis with fashionable, comfortable, and confident styles that blend tradition with trend.</p>
                    <p>At VEE, quality and modesty come together to celebrate the beauty of Egyptian women.</p>
                  </div>
                </DialogDescription>
              </DialogContent>
            </Dialog>
            <div className="flex items-center gap-2 justify-center mt-4">
              <p className="text-stone-500 text-center text-xs md:text-sm">© 2025 Vee. All rights reserved.</p>
              <button
                onClick={() => navigate('/admin-login')}
                className="text-stone-500 hover:text-stone-800 transition-colors"
                title="Admin Login"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
