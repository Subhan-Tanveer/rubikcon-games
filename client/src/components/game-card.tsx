import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice, type Game } from "@/lib/types";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useCartStore } from "@/lib/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addItemToStore = useCartStore((state) => state.addItem);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", {
        gameId: game.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      // Invalidate cart queries to refresh the cart
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      
      toast({
        title: "Added to cart!",
        description: `${game.title} has been added to your cart.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  const isOnline = game.isOnline === 1;
  const price = isOnline ? "Free play" : formatPrice(game.price);

  return (
    <Card className="game-card bg-card border border-border hover:border-primary transition-all duration-300 group">
      <CardContent className="p-4">
        <Link href={`/games/${game.slug}`}>
          <div className="relative mb-4">
            <img
              src={game.image}
              alt={game.title}
              className="w-full h-32 object-cover rounded-lg"
            />
            {isOnline && (
              <div className="absolute top-2 right-2">
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Online
                </span>
              </div>
            )}
          </div>
        </Link>
        
        <h3 className="font-semibold text-foreground mb-2">{game.title}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {game.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <span className={`font-bold ${isOnline ? 'text-muted-foreground' : 'text-foreground'}`}>
            {price} {!isOnline && 'per card box'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {addToCartMutation.isPending
              ? "Adding..."
              : isOnline
              ? "Play Now"
              : "Buy Now"}
          </Button>
          <Link href={`/games/${game.slug}`} className="block w-full">
            <Button variant="default" size="sm" className="w-full">
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
