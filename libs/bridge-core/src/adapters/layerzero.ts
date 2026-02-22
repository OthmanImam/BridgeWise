import axios, { AxiosInstance } from 'axios';
import { BaseBridgeAdapter } from './base';
import { BridgeRoute, RouteRequest, BridgeProvider, ChainId } from '../types';

/**
 * LayerZero bridge adapter
 * Documentation: https://docs.layerzero.network/v2/tools/api/oft
 */
export class LayerZeroAdapter extends BaseBridgeAdapter {
  readonly provider: BridgeProvider = 'layerzero';
  private readonly apiClient: AxiosInstance;
  private readonly scanApiClient: AxiosInstance;
  private apiKey?: string;

  // LayerZero endpoint IDs for different chains
  private readonly endpointIds: Record<ChainId, number | null> = {
    ethereum: 30101,
    polygon: 30109,
    arbitrum: 30110,
    optimism: 30111,
    base: 30184,
    bsc: 30102,
    avalanche: 30106,
    gnosis: null,
    nova: null,
    stellar: null,
  };

  constructor(
    apiBaseUrl: string = 'https://metadata.layerzero-api.com/v1/metadata/experiment/ofts',
    scanApiBaseUrl: string = 'https://scan.layerzero-api.com/v1',
    apiKey?: string,
  ) {
    super();
    this.apiKey = apiKey;
    this.apiClient = axios.create({
      baseURL: apiBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    });
    this.scanApiClient = axios.create({
      baseURL: scanApiBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  getName(): string {
    return 'LayerZero';
  }

  supportsChainPair(sourceChain: string, targetChain: string): boolean {
    const sourceEid = this.endpointIds[sourceChain as ChainId];
    const targetEid = this.endpointIds[targetChain as ChainId];
    return sourceEid !== null && targetEid !== null && sourceEid !== targetEid;
  }

  async fetchRoutes(request: RouteRequest): Promise<BridgeRoute[]> {
    if (!this.supportsChainPair(request.sourceChain, request.targetChain)) {
      return [];
    }

    if (!request.tokenAddress) {
      // LayerZero requires a token address for OFT transfers
      return [];
    }

    const sourceEid = this.endpointIds[request.sourceChain]!;
    const targetEid = this.endpointIds[request.targetChain]!;

    try {
      // First, try to get transfer quote using the OFT API
      // Note: This requires an API key for the /transfer endpoint
      if (this.apiKey) {
        interface TransferData {
          contractAddress: string;
          calldata: string;
          value?: string;
          gasEstimate?: string;
        }
        const transferResponse = await this.apiClient.post<TransferData>(
          '/transfer',
          {
            srcChainId: sourceEid,
            dstChainId: targetEid,
            amount: request.assetAmount,
            tokenAddress: request.tokenAddress,
            recipient: request.recipientAddress,
          },
        );

        const transferData: TransferData = transferResponse.data;

        if (transferData && typeof transferData.calldata === 'string') {
          // Estimate fees from historical data or use defaults
          const estimatedFee = await this.estimateFee(
            sourceEid,
            targetEid,
            request.assetAmount,
          );

          const inputAmount = BigInt(request.assetAmount);
          const fee = BigInt(estimatedFee);
          const outputAmount = inputAmount - fee;

          const route: BridgeRoute = {
            id: this.generateRouteId(
              this.provider,
              request.sourceChain,
              request.targetChain,
              0,
            ),
            provider: this.provider,
            sourceChain: request.sourceChain,
            targetChain: request.targetChain,
            inputAmount: inputAmount.toString(),
            outputAmount: outputAmount.toString(),
            fee: fee.toString(),
            feePercentage: this.calculateFeePercentage(
              inputAmount.toString(),
              outputAmount.toString(),
            ),
            reliability: 0.92,
            estimatedTime: this.estimateBridgeTime(sourceEid, targetEid),
            minAmountOut: this.calculateMinAmountOut(
              outputAmount.toString(),
              request.slippageTolerance,
            ),
            maxAmountOut: outputAmount.toString(),
            transactionData: {
              contractAddress: transferData.contractAddress,
              calldata: transferData.calldata,
              value: transferData.value || '0',
              gasEstimate: transferData.gasEstimate,
            },
            metadata: {
              description: `Bridge via LayerZero OFT from ${request.sourceChain} to ${request.targetChain}`,
              riskLevel: 2,
              srcChainId: sourceEid,
              dstChainId: targetEid,
            },
          };

          return [route];
        }
      }

      // Fallback: Use scan API to get historical fee data
      return await this.fetchRoutesFromScan(request, sourceEid, targetEid);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          `[LayerZeroAdapter] Error fetching routes:`,
          error.message,
        );
      }
      return [];
    }
  }

  /**
   * Fetch routes using LayerZero Scan API (fallback method)
   */
  private async fetchRoutesFromScan(
    request: RouteRequest,
    _sourceEid: number,
    _targetEid: number,
  ): Promise<BridgeRoute[]> {
    try {
      // Get recent messages to estimate fees
      interface ScanApiResponse {
        messages: unknown[];
      }
      const response = await this.scanApiClient.get<ScanApiResponse>(
        '/messages/latest',
        {
          params: {
            limit: 10,
            srcEid: sourceEid,
            dstEid: targetEid,
          },
        },
      );

      const messages: unknown[] = response.data?.messages || [];

      if (!Array.isArray(messages) || messages.length === 0) {
        return [];
      }

      // Estimate fee based on historical data
      const estimatedFee = await this.estimateFee(
        sourceEid,
        targetEid,
        request.assetAmount,
      );

      const inputAmount = BigInt(request.assetAmount);
      const fee = BigInt(estimatedFee);
      const outputAmount = inputAmount - fee;

      const route: BridgeRoute = {
        id: this.generateRouteId(
          this.provider,
          request.sourceChain,
          request.targetChain,
          0,
        ),
        provider: this.provider,
        sourceChain: request.sourceChain,
        targetChain: request.targetChain,
        inputAmount: inputAmount.toString(),
        outputAmount: outputAmount.toString(),
        fee: fee.toString(),
        feePercentage: this.calculateFeePercentage(
          inputAmount.toString(),
          outputAmount.toString(),
        ),
        reliability: 0.92,
        estimatedTime: this.estimateBridgeTime(sourceEid, targetEid),
        minAmountOut: this.calculateMinAmountOut(
          outputAmount.toString(),
          request.slippageTolerance,
        ),
        maxAmountOut: outputAmount.toString(),
        metadata: {
          description: `Bridge via LayerZero from ${request.sourceChain} to ${request.targetChain}`,
          riskLevel: 2,
          srcChainId: sourceEid,
          dstChainId: targetEid,
          estimated: true, // Mark as estimated since we don't have exact quote
        },
      };

      return [route];
    } catch (error: unknown) {
      try {
        // Get recent messages to estimate fees
        interface ScanApiResponse {
          messages: unknown[];
        }
        const response = await this.scanApiClient.get<ScanApiResponse>(
          '/messages/latest',
          {
            params: {
              limit: 10,
            },
          },
        );

        const messages: unknown[] = response.data?.messages || [];

        if (!Array.isArray(messages) || messages.length === 0) {
          return [];
        }

        // Estimate fee based on historical data
        const estimatedFee = await this.estimateFee(
          0, // sourceEid placeholder
          0, // targetEid placeholder
          request.assetAmount,
        );

        const inputAmount = BigInt(request.assetAmount);
        const fee = BigInt(estimatedFee);
        const outputAmount = inputAmount - fee;

        const route: BridgeRoute = {
          id: this.generateRouteId(
            this.provider,
            request.sourceChain,
            request.targetChain,
            0,
          ),
          provider: this.provider,
          sourceChain: request.sourceChain,
          targetChain: request.targetChain,
          inputAmount: inputAmount.toString(),
          outputAmount: outputAmount.toString(),
          fee: fee.toString(),
          feePercentage: this.calculateFeePercentage(
            inputAmount.toString(),
            outputAmount.toString(),
          ),
          reliability: 0.92,
          estimatedTime: this.estimateBridgeTime(0, 0),
          minAmountOut: this.calculateMinAmountOut(
            outputAmount.toString(),
            request.slippageTolerance,
          ),
          maxAmountOut: outputAmount.toString(),
          metadata: {
            description: `Bridge via LayerZero from ${request.sourceChain} to ${request.targetChain}`,
            riskLevel: 2,
            srcChainId: 0,
            dstChainId: 0,
            estimated: true, // Mark as estimated since we don't have exact quote
          },
        };

        return [route];
      } catch (error: unknown) {
        if (error instanceof Error) {
          // eslint-disable-next-line no-console
          console.error(`[LayerZeroAdapter] Error fetching from scan API:`, error.message);
        }
        return [];
      }
