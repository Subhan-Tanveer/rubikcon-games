import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './lib/wagmi';
import Header from "@/components/header";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import GameDetail from "@/pages/game-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import CryptoPayment from "@/pages/crypto-payment";
import FiatPayment from "@/pages/fiat-payment";
import PaymentSuccess from "@/pages/payment-success";
import NotFound from "@/pages/not-found";
import WalletTest from '@/components/WalletTest';



function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/games/:slug" component={GameDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/crypto-payment" component={CryptoPayment} />
      <Route path="/fiat-payment" component={FiatPayment} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/wallet-test" component={WalletTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground">
              <Header />
              <main className="min-h-[calc(100vh-160px)]">
                <Router />
              </main>
              <Footer />
            </div>
            <Toaster />
          </TooltipProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
