# Stellar/Soroban Bridge Implementation

This document describes the implementation of backend support for Stellar/Soroban bridge operations in BridgeWise.

## Overview

The Stellar/Soroban bridge adapter provides:

1. **Fee Estimation** - Accurate calculation of network fees, bridge protocol fees, and slippage
2. **Latency Estimation** - Predicted transaction completion times based on chain characteristics
3. **Error Mapping** - Standardized error codes mapped from Stellar RPC responses
4. **Integration Tests** - Comprehensive tests with mock RPC server

## Architecture

### Core Components

#### 1. Error Codes & Mapping (`error-codes.ts`)

Defines standard backend error codes for consistent error handling across all adapters:

```typescript
export enum BridgeErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_TIMEOUT = 'RPC_TIMEOUT',
  RPC_CONNECTION_FAILED = 'RPC_CONNECTION_FAILED',
  
  // Account/Validation errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  ACCOUNT_SEQUENCE_MISMATCH = 'ACCOUNT_SEQUENCE_MISMATCH',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  
  // Contract errors
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  CONTRACT_INVOCATION_FAILED = 'CONTRACT_INVOCATION_FAILED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

**Features:**
- `ErrorMapper` class converts provider-specific errors to standard codes
- Regex pattern matching for flexible error detection
- Preserves original error details for debugging

**Usage:**
```typescript
import { ErrorMapper, STELLAR_ERROR_MAPPING } from '@bridgewise/bridge-core';

const mapper = new ErrorMapper(STELLAR_ERROR_MAPPING);
const mappedError = mapper.mapError(rpcError);
// mappedError.code will be one of BridgeErrorCode values
```

#### 2. Fee Estimation (`fee-estimation.ts`)

Sophisticated fee calculation using Stellar's actual fee structure:

**Fee Components:**
- **Network Fee**: Based on operation count (Stellar charges per-operation)
  - Base: 100 stroops per operation
  - Typical bridge TX: 2 operations = 200 stroops

- **Bridge Protocol Fee**: Percentage-based
  - Stellar → EVM: 0.5% (50 basis points)
  - EVM → Stellar: 0.75% (75 basis points)

- **Slippage Fee**: User-configurable (default: 0.5%)
  - Calculated as percentage of output amount
  - Provides slippage protection

**Example:**
```typescript
import { StellarFees } from '@bridgewise/bridge-core';

const inputAmount = 1000000000n; // 100 XLM in stroops
const fees = StellarFees.estimateFees(
  inputAmount,
  true,        // isFromStellar
  0.5          // slippagePercentage
);

console.log('Network fee:', fees.networkFee.toString());
console.log('Bridge fee:', fees.bridgeFee.toString());
console.log('Slippage fee:', fees.slippageFee.toString());
console.log('Total fee:', fees.totalFee.toString());
console.log('Fee %:', fees.feePercentage);
```

**Dust Protection:**
- Stellar minimum: 1 XLM
- EVM minimum: 1 token unit
- Automatically rejects amounts below minimums

#### 3. Latency Estimation (`fee-estimation.ts`)

Dynamic latency prediction based on chain characteristics:

**Baseline Latencies:**
- Stellar: 2s (network close time)
- Ethereum: 12s (block time)
- L2 Chains: 2s (optimistic rollups)

**Components:**
- Network latency: Time for transactions to confirm
- Block time: Average block confirmation
- Bridge processing: Cross-chain bridge operations
- Confirmation time: Required finality confirmations

**Load Factor:**
- 0.1 = low network load (5% latency increase)
- 0.5 = normal load (25% increase)
- 0.9 = high load (45% increase)

**Example:**
```typescript
import { LatencyEstimation } from '@bridgewise/bridge-core';

const estimate = LatencyEstimation.estimateLatency(
  'stellar',
  'ethereum',
  0.5 // network load factor
);

console.log(`Estimated time: ${estimate.estimatedSeconds}s`);
console.log(`Confidence: ${estimate.confidence}%`);
console.log(estimate.breakdown);
// {
//   networkLatency: 14,
//   blockTime: 7,
//   bridgeProcessing: 8,
//   confirmationTime: 120
// }

const formatted = LatencyEstimation.formatEstimate(estimate);
// "~3 min (85% confidence)"
```

#### 4. StellarAdapter (`adapters/stellar.ts`)

Main adapter implementing the `BridgeAdapter` interface:

**Supported Chain Pairs:**
- Stellar ↔ Ethereum
- Stellar ↔ Polygon
- Stellar ↔ Arbitrum
- Stellar ↔ Optimism
- Stellar ↔ Base

**Route Response:**
```typescript
{
  id: string;                          // Unique route identifier
  provider: 'stellar';
  sourceChain: ChainId;
  targetChain: ChainId;
  inputAmount: string;                 // Amount to bridge
  outputAmount: string;                // Amount received (after fees)
  fee: string;                         // Total fee amount
  feePercentage: number;               // Fee as percentage
  estimatedTime: number;               // Seconds
  minAmountOut: string;                // After slippage
  maxAmountOut: string;
  deadline?: number;                   // Unix timestamp
  transactionData?: {
    contractAddress?: string;          // Bridge contract
    gasEstimate?: string;
  };
  metadata?: {
    description: string;
    riskLevel: number;                 // 1-5 scale
    network: 'mainnet' | 'testnet';
    feeBreakdown: {
      networkFee: string;
      bridgeFee: string;
      slippageFee: string;
    };
    latencyConfidence: number;         // 0-100%
    latencyBreakdown: {
      networkLatency: number;
      blockTime: number;
      bridgeProcessing: number;
      confirmationTime: number;
    };
  };
}
```

**Error Handling:**
```typescript
// Adapter includes error mapping
const mappedError = adapter.mapError(rpcError);
// Returns StandardBridgeError with BridgeErrorCode
```

#### 5. Mock RPC Server (`adapters/mock-rpc.ts`)

Comprehensive mock Stellar RPC for integration testing:

**Features:**
- Simulates network latency
- Supports failure injection
- Tracks request counts
- Implements Stellar and Horizon endpoints

**Endpoints:**
- `POST /` - Soroban RPC endpoint
- `GET /health` - Health check
- `GET /ledgers` - Horizon ledger endpoint
- `GET /accounts/:accountId` - Horizon account endpoint

**Usage:**
```typescript
import { MockStellarRpc } from '@bridgewise/bridge-core';

const mockRpc = new MockStellarRpc({
  port: 18545,
  networkLatency: 100,    // 100ms simulated delay
  failureRate: 0.1,       // 10% random failures
});

await mockRpc.start();

// Use with adapter
const adapter = new StellarAdapter('http://localhost:18545');

// Simulate failures
mockRpc.setFailureWindow(1000); // Fail for 1 second

// Get stats
const requestCount = mockRpc.getRequestCount();

await mockRpc.stop();
```

## Integration Tests

Comprehensive test suite (`stellar.integration.spec.ts`) covers:

### Fee Estimation Tests
- ✓ Accurate fee calculation for both directions
- ✓ Fee component breakdown (network, bridge, slippage)
- ✓ Slippage tolerance application
- ✓ Dust amount rejection
- ✓ Valid amount acceptance
- ✓ Minimum amount out calculation

### Latency Estimation Tests
- ✓ Route-specific latency estimates
- ✓ L1 vs L2 chain differentiation
- ✓ Network load impact
- ✓ Latency component breakdown
- ✓ Human-readable formatting

### Error Mapping Tests
- ✓ RPC timeout mapping
- ✓ Connection refused mapping
- ✓ Account not found mapping
- ✓ Insufficient balance mapping
- ✓ Sequence mismatch mapping
- ✓ Contract errors mapping
- ✓ Rate limit mapping
- ✓ Unknown error handling
- ✓ Non-Error object handling

### Route Fetching Tests
- ✓ Stellar → Ethereum routes
- ✓ Ethereum → Stellar routes
- ✓ Fee breakdown in metadata
- ✓ Latency info in metadata
- ✓ Dust amount handling
- ✓ Slippage application

### Mock RPC Tests
- ✓ Simulated network latency
- ✓ Failure injection
- ✓ Request tracking

## Usage Examples

### Get Bridge Routes with Full Details

```typescript
import { getBridgeRoutes, StellarFees, LatencyEstimation } from '@bridgewise/bridge-core';

const routes = await getBridgeRoutes({
  sourceChain: 'stellar',
  targetChain: 'ethereum',
  assetAmount: '1000000000', // 100 XLM
  slippageTolerance: 0.5,
  providers: {
    stellar: true,
    hop: false,
    layerzero: false,
  }
});

routes.routes.forEach(route => {
  console.log(`Provider: ${route.provider}`);
  console.log(`Output: ${route.outputAmount}`);
  console.log(`Total Fee: ${route.feePercentage}%`);
  console.log(`Estimated Time: ${route.estimatedTime}s`);
  
  const feeBreakdown = route.metadata?.feeBreakdown;
  if (feeBreakdown) {
    console.log(`  Network Fee: ${feeBreakdown.networkFee}`);
    console.log(`  Bridge Fee: ${feeBreakdown.bridgeFee}`);
    console.log(`  Slippage Fee: ${feeBreakdown.slippageFee}`);
  }
});
```

### Manual Fee Calculation

```typescript
import { StellarFees } from '@bridgewise/bridge-core';

const amount = 5000000000n; // 500 XLM

// Check if amount is valid
if (!StellarFees.isValidAmount(amount, true)) {
  console.error('Amount is below minimum');
  return;
}

// Estimate fees
const fees = StellarFees.estimateFees(amount, true, 0.5);

// Calculate minimum amount out
const minOut = StellarFees.calculateMinAmountOut(
  amount - fees.totalFee,
  0.5 // slippage tolerance
);

console.log(`Input: ${amount} stroops`);
console.log(`Fees: ${fees.totalFee} stroops (${fees.feePercentage.toFixed(2)}%)`);
console.log(`Min Output: ${minOut} stroops`);
```

### Error Handling

```typescript
import { StellarAdapter } from '@bridgewise/bridge-core';

const adapter = new StellarAdapter(
  'https://soroban-rpc.mainnet.stellar.org',
  'https://horizon.stellar.org',
  'mainnet'
);

try {
  const routes = await adapter.fetchRoutes({
    sourceChain: 'stellar',
    targetChain: 'ethereum',
    assetAmount: '1000000000',
  });
} catch (error) {
  const mapped = adapter.mapError(error);
  
  switch (mapped.code) {
    case 'RPC_TIMEOUT':
      console.error('RPC endpoint is slow');
      break;
    case 'ACCOUNT_NOT_FOUND':
      console.error('Account does not exist');
      break;
    default:
      console.error(`Unknown error: ${mapped.message}`);
  }
}
```

## Testing

Run the integration tests:

```bash
npm test -- stellar.integration.spec.ts
```

The mock RPC server is automatically started for testing and provides:
- Realistic network latency simulation
- Configurable failure scenarios
- Request tracking for verification
- Both Soroban RPC and Horizon endpoints

## Performance Considerations

1. **Fee Calculations**: O(1) - simple arithmetic operations
2. **Latency Estimation**: O(1) - lookup based on chain type
3. **Error Mapping**: O(n) where n is number of error patterns (~20)
4. **Route Fetching**: Network bound, typically 100-500ms

## Future Enhancements

1. **Dynamic Fee Adjustment**: Monitor actual network fees and adjust estimates
2. **ML-Based Latency**: Learn from historical execution times
3. **Slippage Analytics**: Track and optimize slippage calculations
4. **Contract Caching**: Cache contract addresses and ABIs
5. **Rate Limiting**: Implement backoff strategies for RPC limits

## References

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [Stellar RPC API](https://developers.stellar.org/docs/soroban/rpc)
- [Horizon API](https://developers.stellar.org/api/introduction/)
