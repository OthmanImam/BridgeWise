# Stellar Bridge Implementation - Quick Reference

## 📚 API Quick Reference

### Get Bridge Routes

```typescript
import { getBridgeRoutes } from '@bridgewise/bridge-core';

const routes = await getBridgeRoutes({
  sourceChain: 'stellar',
  targetChain: 'ethereum',
  assetAmount: '1000000000', // 100 XLM in stroops
  slippageTolerance: 0.5,     // optional, default 0.5%
  recipientAddress: '0x...',  // optional
}, {
  providers: { stellar: true, hop: false, layerzero: false }
});
```

### Fee Estimation

```typescript
import { StellarFees } from '@bridgewise/bridge-core';

// Validate amount
const isValid = StellarFees.isValidAmount(1000000000n, true); // isStellar=true

// Estimate fees
const fees = StellarFees.estimateFees(
  1000000000n,     // inputAmount
  true,            // isFromStellar
  0.5              // slippagePercentage
);

console.log(fees.feePercentage); // e.g., 0.75%
console.log(fees.networkFee);    // Network fee component
console.log(fees.bridgeFee);     // Bridge protocol fee
console.log(fees.slippageFee);   // Slippage protection fee

// Calculate min output with slippage
const minOut = StellarFees.calculateMinAmountOut(
  outputAmount,
  0.5 // slippage %
);
```

### Latency Estimation

```typescript
import { LatencyEstimation } from '@bridgewise/bridge-core';

const estimate = LatencyEstimation.estimateLatency(
  'stellar',
  'ethereum',
  0.5 // networkLoad (0.0-1.0)
);

console.log(estimate.estimatedSeconds); // e.g., 299
console.log(estimate.confidence);       // e.g., 85 (percent)
console.log(estimate.breakdown);        // Detailed breakdown

// Human-readable format
const formatted = LatencyEstimation.formatEstimate(estimate);
// "~5 min (85% confidence)"
```

### Error Handling

```typescript
import { 
  StellarAdapter,
  ErrorMapper,
  STELLAR_ERROR_MAPPING,
  BridgeErrorCode
} from '@bridgewise/bridge-core';

const adapter = new StellarAdapter();

try {
  const routes = await adapter.fetchRoutes({...});
} catch (error) {
  const mapped = adapter.mapError(error);
  
  if (mapped.code === BridgeErrorCode.RPC_TIMEOUT) {
    // Handle timeout
  } else if (mapped.code === BridgeErrorCode.INSUFFICIENT_BALANCE) {
    // Handle insufficient balance
  }
  
  console.error(`${mapped.code}: ${mapped.message}`);
  console.error('Original error:', mapped.originalError);
}
```

## 📊 Fee Structure

| Component | Stellar → EVM | EVM → Stellar |
|-----------|---------------|---------------|
| Network Fee | 200 stroops (2 ops) | Depends on source chain |
| Bridge Fee | 0.5% | 0.75% |
| Slippage Fee | 0.5% (default) | 0.5% (default) |

## ⏱️ Latency Baselines

| Chain | Network Latency | Block Time |
|-------|-----------------|-----------|
| Stellar | 2s | 2-5s |
| Ethereum | 12s | 12-15s |
| Polygon | 2s | 2s |
| Arbitrum | 2s | 0.25s |
| Optimism | 2s | 2s |
| Base | 2s | 2s |

## 🛡️ Error Codes

```typescript
BridgeErrorCode {
  // Network
  NETWORK_ERROR, RPC_TIMEOUT, RPC_CONNECTION_FAILED,
  
  // Validation
  INVALID_CHAIN_PAIR, INVALID_AMOUNT, INVALID_ADDRESS,
  INVALID_TOKEN, DUST_AMOUNT,
  
  // Account
  INSUFFICIENT_BALANCE, ACCOUNT_NOT_FOUND,
  ACCOUNT_SEQUENCE_MISMATCH,
  
  // Transaction
  TRANSACTION_FAILED, TRANSACTION_REJECTED,
  INSUFFICIENT_GAS,
  
  // Contract
  CONTRACT_ERROR, CONTRACT_NOT_FOUND,
  CONTRACT_INVOCATION_FAILED,
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED, QUOTA_EXCEEDED,
  
  // Unknown
  UNKNOWN_ERROR
}
```

## 🔗 Supported Pairs

**Stellar ↔ Ethereum** ✅
**Stellar ↔ Polygon** ✅
**Stellar ↔ Arbitrum** ✅
**Stellar ↔ Optimism** ✅
**Stellar ↔ Base** ✅

## 🧪 Testing

```typescript
import { MockStellarRpc } from '@bridgewise/bridge-core';

// Create mock RPC
const mockRpc = new MockStellarRpc({
  port: 18545,
  networkLatency: 100,  // 100ms
  failureRate: 0.1      // 10% failure rate
});

await mockRpc.start();

// Test with adapter
const adapter = new StellarAdapter('http://localhost:18545');
const routes = await adapter.fetchRoutes({...});

// Simulate failures
mockRpc.setFailureWindow(1000); // Fail for 1s

// Get stats
console.log(mockRpc.getRequestCount());

await mockRpc.stop();
```

## 📦 Install & Import

```bash
npm install @bridgewise/bridge-core
```

```typescript
// Import everything
import * as BridgeWise from '@bridgewise/bridge-core';

// Or specific imports
import {
  StellarAdapter,
  StellarFees,
  LatencyEstimation,
  ErrorMapper,
  BridgeErrorCode,
  getBridgeRoutes
} from '@bridgewise/bridge-core';
```

## 🎯 Common Use Cases

### Get Best Route

```typescript
const routes = await getBridgeRoutes({
  sourceChain: 'stellar',
  targetChain: 'ethereum',
  assetAmount: '1000000000',
});

// Routes are sorted by quality (best first)
const bestRoute = routes.routes[0];
console.log(`Best option: ${bestRoute.feePercentage}% fee`);
```

### Validate Before Bridge

```typescript
const route = routes.routes[0];

// Check minimum output
if (BigInt(route.outputAmount) < minimumRequired) {
  console.log('Output too low, try different route');
  return;
}

// Check estimated time
if (route.estimatedTime > maxWait) {
  console.log('Takes too long, find faster route');
  return;
}
```

### Handle Network Failures

```typescript
try {
  const routes = await adapter.fetchRoutes({...});
} catch (error) {
  const mapped = adapter.mapError(error);
  
  if ([
    BridgeErrorCode.RPC_TIMEOUT,
    BridgeErrorCode.RPC_CONNECTION_FAILED,
    BridgeErrorCode.NETWORK_ERROR
  ].includes(mapped.code)) {
    console.log('Network issue, retry with exponential backoff');
  }
}
```

## 📖 Full Documentation

See `STELLAR_IMPLEMENTATION.md` for:
- Architecture overview
- Detailed API documentation
- Implementation examples
- Performance considerations
- Future enhancements

## 🐛 Debugging

Enable detailed logging:

```typescript
const adapter = new StellarAdapter(
  'https://soroban-rpc.testnet.stellar.org',
  'https://horizon-testnet.stellar.org',
  'testnet'
);

try {
  await adapter.fetchRoutes({...});
} catch (error) {
  const mapped = adapter.mapError(error);
  console.log('Error Code:', mapped.code);
  console.log('Message:', mapped.message);
  console.log('Details:', mapped.details);
  console.log('Original:', mapped.originalError);
}
```

## 🔄 Network Selection

```typescript
// Mainnet (default)
const mainnetAdapter = new StellarAdapter();

// Testnet
const testnetAdapter = new StellarAdapter(
  'https://soroban-rpc.testnet.stellar.org',
  'https://horizon-testnet.stellar.org',
  'testnet'
);
```
