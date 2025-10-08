import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import BackButton from "@/components/back-button";
import { type CartItem, type Game, formatPrice } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Minus, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect } from "react";
import React from "react";

export default function Cart() {
  // All hooks must be called at the top level
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Get cart items and all games
  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
  });
  
  const { data: allGames = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });
  
  // Cart store operations
  const { getTotalPrice, getTotalItems, setItems } = useCartStore();
  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();
  
  // Update cart store when cart items change
  useEffect(() => {
    if (cartItems.length > 0) {
      setItems(cartItems);
    }
  }, [cartItems, setItems]);
  
  // Calculate derived values
  const otherGames = allGames.slice(0, 5);
  const regularPrice = cartItems?.reduce((sum: number, item: CartItem) => 
    sum + (item.game?.price || 0) * item.quantity, 0) || 0;
  const savings = regularPrice - totalPrice;
  
  // Helper functions
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ gameId, quantity }: { gameId: number; quantity: number }) => {
      return apiRequest("PUT", `/api/cart/${gameId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (gameId: number) => {
      return apiRequest("DELETE", `/api/cart/${gameId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading cart...</div>
      </div>
    );
  }
  
  // Determine which discount tier applies
  const getDiscountTier = (count: number) => {
    if (count >= 10) return { rate: 20, minItems: 10 };
    if (count >= 5) return { rate: 15, minItems: 5 };
    if (count >= 3) return { rate: 10, minItems: 3 };
    return null;
  };
  
  const discountTier = getDiscountTier(totalItems);
  const discountActive = !!discountTier;

  const handleQuantityChange = (gameId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemMutation.mutate(gameId);
    } else {
      updateQuantityMutation.mutate({ gameId, quantity });
    }
  };

  const handleRemoveItem = (gameId: number) => {
    removeItemMutation.mutate(gameId);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton fallbackUrl="/" />
        </div>
        {/* Cart Header */}
        <Card className="bg-card border border-border mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">
                MY CART({cartItems?.length || 0})
              </h1>
              <div className="text-right">
                {discountActive && (
                  <div className="text-sm text-green-600 mb-1">
                    🎉 Special Offer: {discountTier.minItems}+ cards get {discountTier.rate}% off
                    {savings > 0 && (
                      <span> (Save {formatPrice(savings)})</span>
                    )}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">TOTAL - </span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(totalPrice)}
                  </span>
                  {savings > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground line-through">
                      {formatPrice(regularPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cart Items */}
        <div className="space-y-6 mb-8">
          {!cartItems || cartItems.length === 0 ? (
            <Card className="bg-card border border-border">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Link href="/">
                  <Button>Continue Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            cartItems?.map((item: CartItem) => (
              <Card key={item.id} className="bg-card border border-border">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
                    <div className="w-full md:w-24 h-48 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.game.image}
                        alt={item.game.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="text-foreground font-semibold text-lg">
                          {item.game.title}
                        </h3>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center bg-muted/50 rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md"
                              onClick={() => handleQuantityChange(item.gameId, item.quantity - 1)}
                              disabled={updateQuantityMutation.isPending}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-foreground font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-md"
                              onClick={() => handleQuantityChange(item.gameId, item.quantity + 1)}
                              disabled={updateQuantityMutation.isPending}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-foreground font-bold text-base whitespace-nowrap">
                            {formatPrice(item.game.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveItem(item.gameId)}
                        disabled={removeItemMutation.isPending}
                        className="w-full md:w-auto flex items-center justify-center md:justify-start gap-2 md:mt-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Checkout Button */}
        {cartItems && cartItems.length > 0 && (
          <div className="text-center mb-16">
            <Link href="/checkout">
              <Button className="px-12 py-4 text-lg font-bold">
                Check-out {totalItems} Items
              </Button>
            </Link>
          </div>
        )}

        {/* Other Games Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">OTHER GAMES</h2>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="text-primary hover:text-primary/80">
                  View All
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => scroll('left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => scroll('right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex items-stretch overflow-x-auto space-x-6 pb-4 no-scrollbar"
          >
            {otherGames.map((game) => (
              <div key={game.id} className="flex-shrink-0 w-[270px]">
                <GameCard game={game} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
