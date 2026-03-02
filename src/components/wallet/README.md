# Wallet Components

React components for wallet management and display in the BuidingTok application.

## Components

### TokenBalance

Displays a single token balance with its symbol and optional icon.

**Props:**
- `symbol` (string, required): Token symbol (e.g., "MATIC", "USDT")
- `balance` (string, required): Token balance as a string
- `icon` (ReactNode, optional): Custom icon component

**Usage:**
```tsx
import { TokenBalance } from "@/components/wallet";

function MyComponent() {
  return (
    <TokenBalance
      symbol="MATIC"
      balance="10.5432"
      icon={<img src="/matic-icon.svg" alt="MATIC" />}
    />
  );
}
```

### ConnectButton

Button component for connecting/disconnecting wallet using Web3Auth.

**Features:**
- Automatic state management (connected/disconnected/loading)
- Displays formatted wallet address when connected
- Handles login/logout errors gracefully
- Responsive design with TailwindCSS

**Usage:**
```tsx
import { ConnectButton } from "@/components/wallet";

function Header() {
  return (
    <header>
      <ConnectButton />
    </header>
  );
}
```

**States:**
- **Disconnected**: Shows "Conectar Wallet" button
- **Connected**: Shows address (e.g., "0x1234...7890") and "Desconectar" button
- **Loading**: Shows disabled "Cargando..." button

### WalletWidget

Complete wallet widget showing address, token balances, and dropdown menu.

**Features:**
- Displays wallet address
- Shows MATIC, USDT, and USDC balances
- Dropdown menu with:
  - Copy address to clipboard
  - Disconnect option
- Click outside to close menu
- Auto-fetches balance on mount
- Only renders when wallet is connected

**Usage:**
```tsx
import { WalletWidget } from "@/components/wallet";

function Dashboard() {
  return (
    <div>
      <WalletWidget />
    </div>
  );
}
```

## Context Requirements

All components require the `Web3AuthProvider` to be wrapped around your app:

```tsx
// app/layout.tsx or similar
import { Web3AuthProvider } from "@/lib/web3auth";

export default function RootLayout({ children }) {
  return (
    <Web3AuthProvider>
      {children}
    </Web3AuthProvider>
  );
}
```

## Styling

All components use TailwindCSS classes and follow the project's design system:

- **Colors**: Gray-800/900 backgrounds, Purple-500/Blue-500 accents
- **Spacing**: Consistent padding and margins
- **Typography**: Clear hierarchy with font weights
- **Interactions**: Smooth transitions and hover states

## Accessibility

All components follow accessibility best practices:

- Semantic HTML elements
- Proper button roles and labels
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Testing

All components have comprehensive test coverage:

- **TokenBalance**: 100% coverage
- **ConnectButton**: 93.33% coverage
- **WalletWidget**: 100% statements, 93.33% branches

Run tests:
```bash
npm test src/components/wallet
```

## Performance Considerations

- **TokenBalance**: Pure component, no side effects
- **ConnectButton**: Memoized callbacks for connect/disconnect
- **WalletWidget**:
  - Balance fetched only once on mount
  - Event listeners cleaned up properly
  - Menu state managed efficiently

## Race Condition Prevention

The components use proper state management to prevent race conditions:

- Functional state updates in React
- Proper cleanup of event listeners
- No concurrent async operations on shared state

## Error Handling

All components handle errors gracefully:

- Login failures don't crash the app
- Logout errors are logged but don't block UI
- Network errors during balance fetch are caught
- Clipboard API failures are handled silently
