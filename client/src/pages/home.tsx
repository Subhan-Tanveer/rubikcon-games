import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/game-card";
import { type Game } from "@/lib/types";
import { Link } from "wouter";
import { Star } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React, { useEffect, useRef } from "react";

export default function Home() {
  const {
    data: games,
    isLoading,
    error,
  } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading games...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          Failed to load games. Please try again.
        </div>
      </div>
    );
  }

  const cardGames = games?.filter((game) => game.isOnline === 0) || [];
  const onlineGames = games?.filter((game) => game.isOnline === 1) || [];
  const featuredGame =
    cardGames.find((game) => game.slug === "crypto-charades") || cardGames[0];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Side - Testimonials */}
            <div className="h-[300px] relative rounded-2xl overflow-hidden bg-cover bg-center"
              style={{
                backgroundImage: "url('/images/review-bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backgroundBlendMode: 'overlay'
              }}
            >
              <Slider
                vertical={true}
                verticalSwiping={true}
                dots={true}
                infinite={true}
                speed={500}
                slidesToShow={1}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={5000}
                arrows={false}
                className="h-full"
                dotsClass="slick-dots !bottom-2"
                appendDots={dots => {
                  return (
                    <div className="!flex justify-center !w-full">
                      <ul className="!m-0 !p-0 flex space-x-2">
                        {React.Children.map(dots, (dot, index) => {
                          if (!React.isValidElement(dot)) return null;
                          const dotProps = dot.props as { className: string; onClick: () => void };
                          return (
                            <li key={index} className="!m-0">
                              <button 
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  dotProps.className.includes('slick-active') ? 'bg-primary' : 'bg-primary/30'
                                }`}
                                onClick={dotProps.onClick}
                                type="button"
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                }}
              >
                {/* Testimonial 1 */}
                <div className="h-[280px] !flex items-center">
                  <Card className="bg-card/80 backdrop-blur-sm border-border/50 w-full">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">O</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-foreground">
                              @Onyithegod
                            </span>
                            <div className="flex text-primary">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            "Got the Web3 Trivia game at one of the online events, been fun playing ever since with friends and colleagues, guess who is winning crypto games now. ME!"
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Testimonial 2 */}
                <div className="h-[280px] !flex items-center">
                  <Card className="bg-card/80 backdrop-blur-sm border-border/50 w-full">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">L</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-foreground">
                              @lmsalgirls
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            <span className="font-medium text-foreground">
                              "Alpha Players' Reviews"
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Add more testimonials by duplicating the above block */}
              </Slider>
            </div>

            {/* Right Side - Hero Product */}
            <div className="relative flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-primary p-8 overflow-hidden">
                <Link href={featuredGame ? `/games/${featuredGame.slug}` : "/games/crypto-charades"}>
                  <div className="w-full h-full">
                    <img src="/images/charade.png" alt="" className="w-full h-full object-cover" />
                  </div>
                </Link>
              </div>

              <div className="w-full sm:w-64">
                <div 
                  className="h-full rounded-xl p-4 flex flex-col relative overflow-hidden"
                  style={{
                    backgroundImage: "url('/images/viewgamesinaction.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backgroundBlendMode: 'multiply'
                  }}
                >
                  <div className="flex-1">
                    <p className="text-white/80 text-sm font-medium mb-1">
                      SEE SOME GAMES IN ACTION →
                    </p>
                    <p className="text-white font-semibold">
                      Then Grab Yours & Join the fun!
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-2 border-primary text-primary hover:bg-primary/10"
                    >
                      ▶ Watch
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card Games Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">CARD GAMES</h2>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80"
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {cardGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>

      {/* Online Games Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground">ONLINE GAMES</h2>
            <Button
              variant="ghost"
              className="text-primary hover:text-primary/80"
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {onlineGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
