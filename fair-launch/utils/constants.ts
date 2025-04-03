import { base, baseSepolia } from "viem/chains";

type Environment = 'development' | 'preview' | 'production';

export const IS_PRODUCTION =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

export const IS_LOCAL_DEVELOPMENT =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV == undefined;

const IS_PREVIEW = !IS_PRODUCTION && !IS_LOCAL_DEVELOPMENT;

export const ENVIRONMENT: Environment = IS_PRODUCTION
  ? 'production'
  : IS_PREVIEW
    ? 'preview'
    : IS_LOCAL_DEVELOPMENT
      ? 'development'
      : 'preview';

const CONFIG = {
  production: {
    chain: base.id,
    subgraphUrl: 'https://api.studio.thegraph.com/query/28985/fair-launch-base/version/latest',
    klimaTokenAddress: '0xDCEFd8C8fCc492630B943ABcaB3429F12Ea9Fea2',
    fairLaunchContractAddress: '0xea8a59D0bf9C05B437c6a5396cfB429F1A57B682',
  },
  preview: {
    chain: baseSepolia.id,
    subgraphUrl: 'https://api.studio.thegraph.com/query/28985/fair-launch-sepolia/version/latest',
    klimaTokenAddress: '0x50Fbf1a671D6E3d4D68E19C646f1F6Bae138E5Ce',
    fairLaunchContractAddress: '0x0CfF418D7028D32C2C5Ea6af2dA934E9F86eFa18',
  },
  development: {
    chain: baseSepolia.id,
    subgraphUrl: 'https://api.studio.thegraph.com/query/28985/fair-launch-sepolia/version/latest',
    klimaTokenAddress: '0x50Fbf1a671D6E3d4D68E19C646f1F6Bae138E5Ce',
    fairLaunchContractAddress: '0x0CfF418D7028D32C2C5Ea6af2dA934E9F86eFa18',
  },
} as const;

export const getConfig = () => {
  switch (ENVIRONMENT) {
    case 'production':
      return CONFIG.production;
    case 'preview':
      return CONFIG.preview;
    case 'development':
      return CONFIG.development;
    default:
      return CONFIG.preview;
  }
};

export const URLS = {
  faq: "https://www.klimaprotocol.com/faq",
  protocol: "https://www.klimaprotocol.com",
  resources: "https://www.klimadao.finance/resource-hub",
  disclaimer: "https://www.klimadao.finance/disclaimer",
  contact: "https://discord.com/channels/841390338324824096/938056860651647056",
  fairLaunchFaq: "https://github.com/KlimaDAO/klimadao-docs/blob/main/klima%202.0/KlimaDAO%20-%20Klima%202.0%20-%20Fair%20Launch%20FAQ%20-%20April%201%2C%202025.md#burn-calculation",
  klima2Whitepaper: "https://github.com/KlimaDAO/klimadao-docs/blob/main/klima%202.0/Klima%202.0%20-%20Whitepaper%20-%20March%2025%2C%202025.pdf",
  twitter: "https://twitter.com/KlimaDAO",
  discord: "https://discord.com/invite/klimadao",
  telegram: "https://t.me/KlimaDAO_Official",
}
