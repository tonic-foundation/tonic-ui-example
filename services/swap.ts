import { OrderSide } from '@tonic-foundation/tonic';
import { HydratedMarketInfo } from '../hooks/useMarkets';

interface Graph {
  edges: Record<string, Edge[]>;
}

export interface Edge {
  direction: OrderSide;
  marketId: string;
  outputToken: string;
}

export const createGraph = (markets: HydratedMarketInfo[]): Graph => {
  const edges: Record<string, Edge[]> = {};
  for (const market of markets) {
    if (!edges[market.baseToken.id]) {
      edges[market.baseToken.id] = [];
    }
    if (!edges[market.quoteToken.id]) {
      edges[market.quoteToken.id] = [];
    }

    edges[market.baseToken.id].push({
      direction: 'Sell',
      marketId: market.id,
      outputToken: market.quoteToken.id,
    });

    edges[market.quoteToken.id].push({
      direction: 'Buy',
      marketId: market.id,
      outputToken: market.baseToken.id,
    });
  }
  return { edges };
};

export const findRoute = (
  graph: Graph,
  startToken: string,
  endToken: string
): Edge[] => {
  const visited: Record<string, boolean> = { startToken: true };
  const queue = [startToken];
  const parents: Record<string, { parentToken: string; edge: Edge }> = {};

  while (queue.length > 0) {
    const tokenId = queue.shift() as string;
    if (tokenId === endToken) {
      break;
    }
    const edges = graph.edges[tokenId] || [];
    for (const edge of edges) {
      if (!visited[edge.outputToken]) {
        queue.push(edge.outputToken);
        parents[edge.outputToken] = { parentToken: tokenId, edge };
        visited[tokenId] = true;
      }
    }
  }

  if (!parents[endToken]) {
    return [];
  }

  const path = [];
  let currentToken = endToken;
  while (currentToken !== startToken) {
    path.push(parents[currentToken].edge);
    currentToken = parents[currentToken]?.parentToken;
  }
  path.reverse();
  return path;
};
