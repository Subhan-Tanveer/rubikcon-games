import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, avalanche } from 'wagmi/chains';

// 1. Get project ID from environment variables
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set. Please ensure you have a .env file with VITE_WALLETCONNECT_PROJECT_ID defined.');
}

// 2. Create wagmiConfig
export const wagmiConfig = getDefaultConfig({
  appName: 'Rubikcon GameSite',
  projectId,
  chains: [mainnet, sepolia, avalanche],
  ssr: false, // Set to true if using server-side rendering
}); 