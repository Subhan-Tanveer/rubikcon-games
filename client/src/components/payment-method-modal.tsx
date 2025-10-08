import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Bitcoin } from "lucide-react";

type PaymentMethod = 'fiat' | 'crypto' | null;

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: 'fiat' | 'crypto') => void;
  isLoading?: boolean;
}

export function PaymentMethodModal({ isOpen, onClose, onSelect, isLoading }: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);

  const handleContinue = () => {
    if (selectedMethod) {
      onSelect(selectedMethod);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Select Payment Method</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how you would like to complete your purchase
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup 
            value={selectedMethod || ''} 
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-4 p-4 border rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value="fiat" id="fiat" className="h-5 w-5" />
              <div className="flex-1 flex items-center justify-between">
                <Label htmlFor="fiat" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <div>
                    <span className="block">Pay with Card/Mobile Money</span>
                    <span className="text-xs text-muted-foreground">Flutterwave • Cards, M-Pesa, Bank Transfer</span>
                  </div>
                </Label>
                <div className="flex space-x-1">
                  <div className="h-6 w-8 rounded-sm bg-blue-500 flex items-center justify-center text-xs text-white font-bold">FW</div>
                  <div className="h-6 w-8 rounded-sm bg-green-500 flex items-center justify-center text-xs text-white">📱</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 border rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value="crypto" id="crypto" className="h-5 w-5" />
              <Label htmlFor="crypto" className="flex-1 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-yellow-500" />
                  <div>
                    <span className="block">Pay with Crypto</span>
                    <span className="text-xs text-muted-foreground">Swypt.io • BTC, ETH, USDT, USDC</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono">₿ Ξ ₮</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedMethod || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : 'Continue to Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
