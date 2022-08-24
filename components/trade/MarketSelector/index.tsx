import Fuse from 'fuse.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TokenIcon from '../../common/TokenIcon';

import { HydratedMarketInfo } from '~/hooks/useMarkets';
import { ResultLink, SearchHeader } from '~/components/search';
import tw from 'twin.macro';
import { toTradeLink } from '~/util/routes';

const Result: React.FC<{ market: HydratedMarketInfo }> = ({
  market,
  ...props
}) => {
  const description = `${market.baseToken.metadata.name}/${market.quoteToken.metadata.name}`;

  return (
    <ResultLink to={toTradeLink(market.id)} {...props}>
      <span tw="flex items-center gap-2 flex-shrink-0" {...props}>
        <TokenIcon src={market.baseToken.metadata.icon} />
        <TokenIcon src={market.quoteToken.metadata.icon} />
      </span>
      <div tw="self-stretch items-start overflow-hidden overflow-ellipsis">
        <p tw="md:text-base uppercase">{market.ticker}</p>
        <p tw="whitespace-nowrap overflow-hidden overflow-ellipsis opacity-60">
          {description}
        </p>
      </div>
    </ResultLink>
  );
};

const UnknownResult: React.FC<{ marketId: string }> = ({
  marketId,
  ...props
}) => {
  return (
    <ResultLink to={toTradeLink(marketId)} {...props}>
      <div tw="self-stretch flex flex-col items-start justify-center">
        <p tw="text-base">Custom market</p>
        <p tw="text-sm whitespace-nowrap overflow-hidden overflow-ellipsis opacity-60">
          {marketId}
        </p>
      </div>
    </ResultLink>
  );
};

const Wrapper = tw.div`
  p-6 overflow-hidden flex flex-col items-stretch
  w-screen h-[60vh]
  md:max-w-sm
`;

const MarketSelector: React.FC<{
  markets: HydratedMarketInfo[];
  onClickClose?: () => unknown;
}> = ({ onClickClose, markets, ...props }) => {
  // close the modal on navigate
  const shouldClose = useRef(false);
  const location = useLocation();
  useEffect(() => {
    if (shouldClose.current && onClickClose) {
      onClickClose();
    }
    shouldClose.current = true;
  }, [location, onClickClose]);

  const [query, setQuery] = useState('');
  const fuseRef = useMemo<Fuse<HydratedMarketInfo>>(
    () =>
      new Fuse(markets, {
        keys: [
          'baseToken.metadata.symbol',
          'quoteToken.metadata.symbol',
          'baseToken.metadata.name',
          'quoteToken.metadata.name',
        ],
        threshold: 0.2,
        shouldSort: false,
      }),
    [markets]
  );

  const results = query
    ? fuseRef.search(query).map(({ item }) => item)
    : markets;

  return (
    <Wrapper {...props}>
      <SearchHeader
        label="Select a market or enter market ID"
        onClose={onClickClose}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tokens"
      />
      <div tw="mt-3 overflow-auto">
        {results.length ? (
          results.map((m) => <Result key={m.id} market={m} />)
        ) : (
          <UnknownResult marketId={query} />
        )}
      </div>
    </Wrapper>
  );
};

export default MarketSelector;
