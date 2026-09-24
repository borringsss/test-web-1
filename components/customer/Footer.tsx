import Link from "next/link";
import { Phone, MapPin, Clock, CreditCard, ShieldCheck, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CustomerFooter() {
  return (
    <footer className="bg-charcoal-950 text-cream-100 pt-16 pb-12 border-t border-charcoal-800">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-charcoal-800/80">
          {/* Brand & Story */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-bold tracking-wider text-cream-50">
                L'UNION PIZZA
              </span>
              <span className="block text-[10px] tracking-[0.25em] text-cream-400 uppercase font-sans font-medium">
                Artisanal MYO Pizzeria
              </span>
            </Link>
            <p className="text-sm text-cream-300 leading-relaxed">
              Autentik Neapolitan craft meets intimate culinary creativity. Craft your own signature pizza right by our hearthside stone oven.
            </p>
            <div className="pt-2">
              <Link href="/reservation">
                <Button className="bg-tomato-600 hover:bg-tomato-700 text-white text-xs font-semibold px-4 h-9">
                  Book A Table Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-semibold text-cream-50 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-tomato-500" />
              Opening Hours
            </h4>
            <ul className="space-y-2 text-sm text-cream-300">
              <li className="flex justify-between border-b border-charcoal-800 pb-1.5">
                <span>Sunday – Thursday</span>
                <span className="font-mono text-cream-100">11:00 – 21:00</span>
              </li>
              <li className="flex justify-between border-b border-charcoal-800 pb-1.5">
                <span>Friday</span>
                <span className="font-mono text-cream-100">14:00 – 21:00</span>
              </li>
              <li className="flex justify-between border-b border-charcoal-800 pb-1.5">
                <span>Saturday</span>
                <span className="font-mono text-cream-100">11:00 – 21:00</span>
              </li>
              <li className="text-xs text-cream-400 italic pt-1">
                Interval reservasi per 15 menit. Slot terbatas per meja.
              </li>
            </ul>
          </div>

          {/* Location & Contact */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-semibold text-cream-50 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-tomato-500" />
              Location & Contact
            </h4>
            <div className="space-y-3 text-sm text-cream-300">
              <p className="leading-relaxed">
                Jl. Veteran No. 42, Artisan Dining Quarter<br />
                Pusat Kuliner Pilihan
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <Phone className="w-4 h-4 text-tomato-500 shrink-0" />
                <a
                  href="https://wa.me/6285226099883"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-tomato-400 transition-colors font-mono"
                >
                  0852-2609-9883 (WhatsApp)
                </a>
              </div>
              <a
                href="https://maps.google.com/?q=LUnion+Pizza"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-tomato-400 hover:underline inline-flex items-center"
              >
                View on Google Maps →
              </a>
            </div>
          </div>

          {/* Booking & Bank Info */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-semibold text-cream-50 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-tomato-500" />
              Booking Fee Payment
            </h4>
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-cream-300">
                <span>Booking Fee:</span>
                <span className="font-bold text-cream-50 font-mono">Rp10.000</span>
              </div>
              <div className="flex justify-between text-cream-300">
                <span>Bank:</span>
                <span className="font-semibold text-cream-50">SeaBank</span>
              </div>
              <div className="flex justify-between text-cream-300">
                <span>No. Rekening:</span>
                <span className="font-mono text-tomato-400 font-bold select-all">901702376579</span>
              </div>
              <p className="text-[11px] text-cream-400 pt-1 leading-normal">
                Sisa pembayaran produk pizza dilunasi langsung di kasir restoran.
              </p>
            </div>
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center text-xs text-charcoal-400 hover:text-cream-200 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Admin Back Office
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-400">
          <p>© {new Date().getFullYear()} L'Union Pizza. All rights reserved.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Crafted with <Heart className="w-3 h-3 text-tomato-500 mx-1 fill-tomato-500" /> for authentic pizza lovers.
          </p>
        </div>
      </div>
    </footer>
  );
}
