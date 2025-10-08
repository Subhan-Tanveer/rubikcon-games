import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import BackButton from "@/components/back-button";
import { type Game as BaseGame, formatPrice } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useCartStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface Game extends BaseGame {
  howToPlay: string; // Instructions for playing the game
  image: string;
  images: string[]; // Ensure images is defined as an array of strings to match the base type
  isOnline: number;
}

export default function GameDetail() {
  const [, params] = useRoute("/games/:slug");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: game, isLoading, error } = useQuery<Game>({
    queryKey: [`/api/games/${params?.slug}`],
    enabled: !!params?.slug,
  });

  const { data: allGames } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });


  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!game) throw new Error("Game not loaded");
      return apiRequest("POST", "/api/cart", {
        gameId: game.id,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart!",
        description: `${quantity} x ${game!.title} added to your cart.`,
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading game details...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          Game not found or failed to load.
        </div>
      </div>
    );
  }

  const images = [game.image, ...(game.images || [])];

  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index);
  };

  const handleNavClick = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
        setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
        setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const isOnline = game.isOnline === 1;
  const otherGames = allGames?.filter(g => g.id !== game.id).slice(0, 5) || [];

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6">
        <BackButton fallbackUrl="/" />
      </div>

      {/* Main Product Section */}
      <div className="grid lg:grid-cols-5 gap-12">
        {/* Left Side - Product Images */}
        <div className="space-y-4 lg:col-span-2">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-card border border-border group">
            <img
              src={images[activeImageIndex]}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => handleNavClick('prev')} className="bg-black/20 hover:bg-black/50 text-white">
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleNavClick('next')} className="bg-black/20 hover:bg-black/50 text-white">
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`w-20 h-20 flex-shrink-0 rounded-lg border-2 cursor-pointer hover:border-primary transition-colors ${activeImageIndex === index ? 'border-primary' : 'border-transparent'}`}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img
                    src={image}
                    alt={`${game.title} image ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side - Product Details */}
        <div className="space-y-6 flex flex-col lg:col-span-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-4">{game.title}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {game.description}
            </p>
          </div>

          {/* Quantity and Price */}
          {!isOnline && (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-foreground font-semibold text-lg">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(game.price)} per card
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button variant="outline" className="flex-1" onClick={handleAddToCart} disabled={addToCartMutation.isPending}>
              Buy Now
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
            >
              {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-16 grid lg:grid-cols-5 gap-12">
        {/* How to Play Section */}
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold text-foreground mb-6">How to Play</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-base whitespace-pre-wrap">{game.howToPlay}</p>
          </div>
        </div>
        
        {/* Kindly Take Note */}
        <div className="lg:col-span-2">
          <Card className="bg-card/50 border border-border h-full">
            <CardContent className="p-6">
              <h3 className="text-primary font-semibold mb-3">Kindly Take Note</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• CARDS COMES WITH A FREE ACCESS CARD TO ANY OF RUBIKCON NEXUS EVENTS</li>
                <li>• DELIVERY TAKES 2 DAYS WITHIN LAGOS, 5-7 DAYS OUTSIDE LAGOS AND 2 WEEKS OR MORE OUTSIDE NIGERIA DEPENDING ON COUNTRY</li>
                <li>• NO REFUNDS</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Other Games Section */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Other Games</h2>
          <Button variant="outline">View More</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {otherGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
}
