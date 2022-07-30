import { useMemo, useState } from 'react';
import tw from 'twin.macro';
import Fuse from 'fuse.js';
import { TokenInfo } from '@tonic-foundation/token-list';

import { DEFAULT_TOKEN_ICON } from '~/config';
import { bnToApproximateDecimal } from '@tonic-foundation/utils';
import useWalletBalance from '~/hooks/useWalletBalance';
import { SearchHeader, searchStyles } from '~/components/common/search';

const TokenIcon = tw.img`h-8 w-8 rounded-full object-cover`;

export interface TokenSelectorProps {
  onClickClose: () => unknown;
  onSelectToken: (token: TokenInfo) => unknown;
  tokenList: TokenInfo[];
}

const Result: React.FC<{ token: TokenInfo; onSelect: () => unknown }> = ({
  token,
  onSelect,
  ...props
}) => {
  const [balance] = useWalletBalance(token.address);
  const balanceFormatted = balance
    ? bnToApproximateDecimal(balance, token.decimals, 2)
    : '0.00';

  return (
    <a
      css={searchStyles.result}
      tw="justify-between cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        onSelect();
      }}
      {...props}
    >
      <div tw="flex items-center gap-x-3 overflow-hidden">
        <TokenIcon src={token.icon || token.logoURI || DEFAULT_TOKEN_ICON} />
        <div tw="overflow-hidden">
          {/* <p tw="text-base font-medium uppercase">{token.symbol}</p> */}
          <p tw="text-base whitespace-nowrap overflow-hidden max-w-full overflow-ellipsis">
            {token.name}
          </p>
        </div>
      </div>
      <p tw="whitespace-nowrap">
        {balanceFormatted} {token.symbol}
      </p>
    </a>
  );
};

const Wrapper = tw.div`
  p-6 overflow-hidden flex flex-col items-stretch
  w-screen h-[60vh]
  sm:max-w-sm
`;

const TokenSelector: React.FC<TokenSelectorProps> = ({
  onClickClose,
  onSelectToken,
  tokenList,
  ...props
}) => {
  const [query, setQuery] = useState('');
  const fuse = useMemo<Fuse<TokenInfo>>(
    () =>
      new Fuse(tokenList, {
        keys: ['symbol', 'name'],
        threshold: 0.2,
      }),
    [tokenList]
  );
  const results = useMemo(
    () => (query ? fuse.search(query).map(({ item }) => item) : tokenList),
    [fuse, query, tokenList]
  );

  return (
    <Wrapper {...props}>
      <SearchHeader
        label="Select a token"
        onClose={onClickClose}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tokens"
      />
      <div tw="mt-3 overflow-auto">
        {results.length ? (
          results.map((t) => (
            <Result
              key={t.address}
              token={t}
              onSelect={() => {
                onSelectToken(t);
                onClickClose();
              }}
            />
          ))
        ) : (
          <p tw="p-2 opacity-90">No tokens found</p>
        )}
      </div>
    </Wrapper>
  );
};

export default TokenSelector;
