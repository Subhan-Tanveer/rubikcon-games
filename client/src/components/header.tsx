import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { type CartItem } from "@/lib/types";
import { useState } from "react";

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
  });

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 text-xl font-bold">
          <div className="flex h-24 w-24 items-center justify-center rounded ">
           <img src="/images/logo1.png" alt="" />
          </div>
        
        </Link>

        {/* Welcome Message - Hidden on mobile */}
        <div className="hidden md:block">
          <p className="text-sm text-primary text-muted-foreground font-medium">
            Welcome Adventurer to the fun of Web3!
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Cart Button */}
          <Link href="/cart">
            <Button variant="default" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">My Cart</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-xs font-bold text-primary-foreground">
                {totalItems}
              </span>
            </Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-card border-b md:hidden">
            <div className="container mx-auto p-4">
              <p className="text-sm text-primary font-medium text-center">
                Welcome Adventurer to the fun of Web3!
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
