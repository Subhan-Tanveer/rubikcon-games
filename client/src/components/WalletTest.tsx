import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';

export default function WalletTest() {
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-8 border rounded-lg shadow-xl bg-card text-card-foreground max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Wallet Connection Test</h2>
        
        <div className="mb-6 flex justify-center">
          {/* Use RainbowKit's built-in button for a complete flow */}
          <ConnectButton />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            The button above handles connect, disconnect, and network switching.
          </p>
        </div>

        {/* Optional: A button to trigger the modal programmatically */}
        <div className="mt-6 border-t pt-6">
           <p className="text-center text-sm text-muted-foreground mb-4">
            Or, trigger the modal with a custom button:
          </p>
          <Button 
            onClick={() => openConnectModal && openConnectModal()}
            disabled={isConnected}
            className="w-full"
          >
            Open Connect Modal
          </Button>
        </div>
      </div>
    </div>
  );
}
