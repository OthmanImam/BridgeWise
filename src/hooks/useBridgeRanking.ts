import { useMemo } from "react";
import { rankBridges } from "@/lib/ranking";
import type { BridgeRouteInput, RankedBridgeRoute, RankingWeights } from "@/lib/ranking";

interface UseBridgeRankingResult {
  rankedRoutes: RankedBridgeRoute[];
  bestRoute: RankedBridgeRoute | null;
}

/**
 * Reactively ranks bridge routes whenever `routes` or `weights` change.
 * Replaces simple fee-based sorting in the aggregation engine UI layer.
 *
 * @param routes  - Normalized quotes from the aggregation engine
 * @param weights - Optional weight overrides
 */
export function useBridgeRanking(
  routes: BridgeRouteInput[] | null | undefined,
  weights?: RankingWeights
): UseBridgeRankingResult {
  return useMemo(() => {
    if (!routes || routes.length === 0) {
      return { rankedRoutes: [], bestRoute: null };
    }

    const rankedRoutes = rankBridges(routes, weights);

    return {
      rankedRoutes,
      bestRoute: rankedRoutes[0] ?? null,
    };
  }, [routes, weights]);
}
