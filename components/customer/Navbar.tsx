"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, X, Pizza, Calendar, ShieldCheck, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  { label: "MYO Experience", href: "/#myo-experience" },
  { label: "Reservation", href: "/reservation" },
  { label: "Track Booking", href: "/reservation/track" },
  { label: "Story", href: "/#story" },
  { label: "Location", href: "/#location" },
];

export function CustomerNavbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-cream-50/95 backdrop-blur-md shadow-sm border-b border-cream-200/60 py-3"
          : "bg-cream-50/80 backdrop-blur-sm py-4"
      )}
    >
      <div className="container flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex flex-col group">
          <span className="font-serif text-2xl md:text-3xl font-bold tracking-wider text-charcoal-900 group-hover:text-tomato-600 transition-colors">
            L'UNION PIZZA
          </span>
          <span className="text-[10px] tracking-[0.25em] text-charcoal-500 uppercase font-sans font-medium">
            Artisanal MYO Pizzeria
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-7">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.href === pathname ||
              (link.href !== "/" && !link.href.includes("#") && pathname.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-tomato-600",
                  isActive ? "text-tomato-600 font-semibold" : "text-charcoal-700"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center space-x-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-xs text-charcoal-600 hover:text-charcoal-900">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Back Office
            </Button>
          </Link>
          <Link href="/reservation">
            <Button className="bg-tomato-600 hover:bg-tomato-700 text-white font-medium shadow-sm">
              <Calendar className="w-4 h-4 mr-1.5" />
              Reserve Now
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 text-charcoal-800 hover:text-tomato-600 focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bg-cream-50 border-b border-cream-200/80 shadow-xl px-6 py-6 transition-all duration-300 animate-fade-in max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col space-y-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium py-2 border-b border-cream-200/40 text-charcoal-800 hover:text-tomato-600"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col space-y-3">
              <Link href="/reservation" onClick={() => setIsOpen(false)}>
                <Button className="w-full bg-tomato-600 hover:bg-tomato-700 text-white py-3 font-semibold">
                  <Calendar className="w-4 h-4 mr-2" />
                  Reserve Your MYO Experience
                </Button>
              </Link>
              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-charcoal-500 hover:text-charcoal-800 flex items-center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Back Office Admin
                </Link>
                <a
                  href="https://wa.me/6285226099883"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-olive-600 hover:underline flex items-center"
                >
                  <PhoneCall className="w-3.5 h-3.5 mr-1" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
