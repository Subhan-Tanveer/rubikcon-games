import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import BackButton from "@/components/back-button";
import { PaymentMethodModal } from "@/components/payment-method-modal";
import { type CartItem, formatPrice } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useCartStore } from "@/lib/store";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
  });

  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      country: "",
      state: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutForm) => {
      const orderItems = cartItems.map(item => ({
        gameId: item.gameId,
        title: item.game.title,
        price: item.game.price,
        quantity: item.quantity,
      }));

      const total = cartItems.reduce((sum, item) => sum + (item.game.price * item.quantity), 0);

      return apiRequest("POST", "/api/orders", {
        customerInfo: data,
        items: orderItems,
        total,
      });
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order. We'll process it soon.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading checkout...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button onClick={() => setLocation("/")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = useCartStore(state => state.getTotalPrice());
  const regularPrice = cartItems.reduce((sum, item) => sum + (item.game.price * item.quantity), 0);

  // Calculate discount information
  const getDiscountInfo = () => {
    if (totalItems < 3) return null;
    
    if (totalItems >= 10) {
      const discountRate = 0.2;
      const discountAmount = regularPrice * discountRate;
      return {
        message: `🎉 Special Offer: 10+ cards get 20% off`,
        discount: discountAmount,
        tier: '10+',
        rate: discountRate * 100
      };
    } else if (totalItems >= 5) {
      const discountRate = 0.15;
      const discountAmount = regularPrice * discountRate;
      return {
        message: `🎉 Special Offer: 5+ cards get 15% off`,
        discount: discountAmount,
        tier: '5+',
        rate: discountRate * 100
      };
    } else if (totalItems >= 3) {
      const discountRate = 0.1;
      const discountAmount = regularPrice * discountRate;
      return {
        message: `🎉 Special Offer: 3+ cards get 10% off`,
        discount: discountAmount,
        tier: '3+',
        rate: discountRate * 100
      };
    }
    return null;
  };
  
  const discountInfo = getDiscountInfo();
  const bulkDiscountActive = totalItems >= 3;

  const handlePaymentMethodSelect = (method: 'fiat' | 'crypto') => {
    const proceed = (data: CheckoutForm) => {
      const orderData = {
        customerInfo: data,
        items: cartItems.map(item => ({
          gameId: item.gameId,
          title: item.game.title,
          price: item.game.price,
          quantity: item.quantity,
        })),
        total: totalPrice,
      };
      
      // Save order data to localStorage
      localStorage.setItem('checkoutOrder', JSON.stringify(orderData));
      
      if (method === 'fiat') {
        setLocation('/fiat-payment');
      } else if (method === 'crypto') {
        setLocation('/crypto-payment');
      }
    };

    setShowPaymentMethod(false);
    form.handleSubmit(proceed)();
  };

  const processOrder = (method: 'fiat' | 'crypto', formData: CheckoutForm) => {
    setIsProcessingPayment(true);
    
    // Here you would typically handle the payment processing
    // For now, we'll just submit the order
    createOrderMutation.mutate(formData, {
      onSettled: () => {
        setIsProcessingPayment(false);
      }
    });
  };

  const onSubmit = (data: CheckoutForm) => {
    // Show payment method selection modal instead of directly submitting
    setShowPaymentMethod(true);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton fallbackUrl="/cart" />
        </div>
        <Card className="bg-card border border-border">
          <CardContent className="p-8">
            {/* Order Items Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Order Items({cartItems.length})
              </h2>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.game.image}
                        alt={item.game.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <span className="text-foreground font-medium">{item.game.title}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-muted-foreground">Qty: {item.quantity}</span>
                      <span className="text-foreground font-bold">
                        {formatPrice(item.game.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Delivery Information</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Delivery takes 2 days within Lagos, 5-7 days outside Lagos and 2 weeks or more
                outside Nigeria depending on country
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <div className="flex space-x-2">
                          <Select defaultValue="+234">
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+234">+234</SelectItem>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="+44">+44</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormControl>
                            <Input placeholder="Phone number" className="flex-1" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Nigeria">Nigeria</SelectItem>
                            <SelectItem value="Ghana">Ghana</SelectItem>
                            <SelectItem value="Kenya">Kenya</SelectItem>
                            <SelectItem value="South Africa">South Africa</SelectItem>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state/province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Total to Pay */}
                  <div className="pt-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">Total to Pay</h3>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">
                            Order Summary (Qty: {totalItems})
                          </span>
                          {discountInfo ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-green-600 font-medium">
                                {discountInfo.message}
                              </span>
                              <span className="text-xs text-green-500">
                                You save: {formatPrice(discountInfo.discount)}
                              </span>
                            </div>
                          ) : totalItems >= 2 ? (
                            <span className="text-xs text-amber-600">
                              Add {3 - totalItems} more card{totalItems === 2 ? '' : 's'} to get 10% off!
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <span className="text-foreground font-bold">
                            {formatPrice(totalPrice)}
                          </span>
                          {discountInfo && (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatPrice(regularPrice)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Delivery Amount</span>
                        <span className="text-foreground">------</span>
                      </div>

                      <hr className="border-border" />

                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-bold text-lg">Total Check-out</span>
                        <span className="text-foreground font-bold text-lg">
                          {formatPrice(totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Proceed Button */}
                  <Button 
                    type="submit" 
                    className="w-full mt-6"
                    size="lg"
                    disabled={createOrderMutation.isPending || isProcessingPayment}
                  >
                    {isProcessingPayment 
                      ? 'Processing Payment...' 
                      : createOrderMutation.isPending 
                        ? 'Placing Order...' 
                        : 'Continue to Payment'}
                  </Button>
                </form>
                
                <PaymentMethodModal 
                  isOpen={showPaymentMethod}
                  onClose={() => setShowPaymentMethod(false)}
                  onSelect={handlePaymentMethodSelect}
                  isLoading={isProcessingPayment}
                />
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
