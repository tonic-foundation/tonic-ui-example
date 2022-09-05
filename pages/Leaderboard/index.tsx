// This page is an example only
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import tw, { styled } from 'twin.macro';
import Card from '~/components/common/Card';
import CloseButton from '~/components/common/CloseButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import Fallback from '~/components/common/Fallback';
import Icon from '~/components/common/Icons';
import { wrappedToast } from '~/components/common/ToastWrapper';
import Tooltip from '~/components/common/Tooltip';
import { getExplorerUrl, GOBLIN_HREF, TONIC_DATA_API_URL } from '~/config';
import useMarkets from '~/hooks/useMarkets';
import AppLayout from '~/layouts/AppLayout';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { abbreviateAccountId } from '~/util';
import { Race, TraderStats, useLeaderboard } from './helper';

const ANNOUNCEMENT_HREF =
  'https://tonicdex.medium.com/pembrock-and-tonic-launch-a-new-trading-competition-671d3d29f646';

/**
 * override bg styles if displaying current user's ranking
 */
const meStyle = tw`dark:(bg-up-dark bg-opacity-80 hover:(bg-up-dark bg-opacity-80)) light:(bg-up-dark hover:bg-up-dark)`;
const RankingWrapper = styled.div<{
  open: boolean;
  /**
   * Is this the current user's ranking?
   */
  me?: boolean;
}>(({ open, me }) => [
  tw`py-2 px-3 hover:cursor-pointer`,
  me && tw`sticky top-0`,
  open
    ? me
      ? meStyle
      : tw`dark:bg-neutral-800 light:bg-neutral-200 transition`
    : tw`dark:hover:bg-neutral-800 light:hover:bg-neutral-200`,
  // hack: override the dark/light mode hover styles if this is the current
  // user's ranking by copying this style at the end
  me && meStyle,
]);
const Ranking: React.FC<{
  trader: TraderStats;
  me?: boolean;
}> = ({ trader, me, ...props }) => {
  const [markets] = useMarkets(false); // oh boy!
  const isHolder = trader.n_held > 0;

  const [open, setOpen] = useState(false);

  return (
    <RankingWrapper
      onClick={() => setOpen(!open)}
      open={open}
      me={me}
      {...props}
    >
      <div tw="flex items-center justify-between gap-x-3">
        <div tw="flex items-center gap-x-3">
          <span tw="text-center w-12">{trader.overall_rank}</span>
          <span tw="text-right">
            <a
              href={getExplorerUrl('account', trader.account_id)}
              target="_blank"
              rel="noreferrer"
              tw="inline hover:underline"
            >
              {abbreviateAccountId(trader.account_id, 20)}
            </a>
          </span>
          {isHolder && (
            // hack: tooltip doesn't quite alight center in flex
            <div tw="mt-[-2px]">
              <Tooltip
                trigger={
                  <span tw="text-xs px-2 rounded-full text-black bg-neutral-50 border dark:border-white light:border-black">
                    {trader.multiplier}x
                  </span>
                }
              >
                <div tw="cursor-default">
                  This user receives a {trader.multiplier}x point boost for
                  holding {trader.n_held}{' '}
                  <a
                    tw="underline"
                    href={GOBLIN_HREF}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {trader.n_held > 1
                      ? 'Tonic Greedy Goblins'
                      : 'Tonic Greedy Goblin'}
                  </a>
                  .
                </div>
              </Tooltip>
            </div>
          )}
        </div>
        <span tw="text-right">
          {Math.round(trader.after_multiplier).toLocaleString()}
        </span>
      </div>
      {open && (
        <div tw="mt-3 text-sm flex items-start justify-between gap-x-3">
          <span tw="w-12">{/* padding */}</span>
          <div tw="flex-grow flex flex-col gap-y-2">
            {Object.entries(trader.stats).map(([, stats]) => {
              const market = markets.find((m) => m.id === stats.market_id);
              if (market) {
                return (
                  <div
                    key={`${trader.account_id}-${stats.market_id}`}
                    tw="flex items-center justify-between"
                  >
                    {market.ticker.toUpperCase()}
                    <span>{Math.round(stats.volume).toLocaleString()}</span>
                  </div>
                );
              }
            })}
            <hr tw="dark:(border-white opacity-60) light:border-black" />
            <div tw="flex items-center justify-between">
              Subtotal
              <span tw="text-right">
                {Math.round(trader.total_volume).toLocaleString()}
              </span>
            </div>
            <div tw="flex items-center justify-between">
              <div tw="flex items-center gap-1.5">
                <span>Goblin multiplier</span>
                <Tooltip>
                  <div tw="cursor-default">
                    Holders of the{' '}
                    <a
                      tw="underline"
                      href={GOBLIN_HREF}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tonic Greedy Goblins NFT
                    </a>{' '}
                    receive a point boost during the competition.
                  </div>
                </Tooltip>
              </div>
              <span tw="text-right">x{trader.multiplier}</span>
            </div>
            <div tw="flex items-center justify-between">
              Total
              <span tw="text-right">
                {Math.round(trader.after_multiplier).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </RankingWrapper>
  );
};

const Wrapper = tw.main`
  flex-grow w-full overflow-auto
`;
const Section = tw.section`
  max-w-lg mx-auto 
`;

const Content = () => {
  const { accountId } = useWalletSelector();
  const [tab, setTab] = useState<Race>('usdc');
  const [showRules, setShowRules] = useState(true);

  const [traders, loading] = useLeaderboard(tab);
  const [ownStats, setOwnStats] = useState<TraderStats>();

  useEffect(() => {
    if (accountId) {
      (async () => {
        try {
          const res = await fetch(
            `${TONIC_DATA_API_URL}/leaderboard/search?account=${accountId}&race=${tab}`
          );
          const me = (await res.json()) as TraderStats;
          setOwnStats(me);
        } catch {
          toast.custom(wrappedToast(<p>Error getting your ranking</p>));
        } finally {
        }
      })();
    }
  }, [tab]);

  return (
    <Wrapper>
      {showRules && (
        <Section tw="px-3 sm:px-0 my-12">
          <Card tw="p-6 space-y-3 flex-shrink-0 dark:(bg-gradient-to-tr from-fuchsia-400 to-teal-400)">
            <header tw="flex items-center justify-between">
              <h1 tw="text-lg">PEM/USDC Trading Competition</h1>
              <CloseButton onClick={() => setShowRules(false)} />
            </header>
            <div tw="text-sm space-y-3">
              <p>
                Demonstrate your mastery of the market to earn daily cash prizes
                and NFTs!
              </p>
              <p>
                All maker and taker volume in the PEM/USDC market is eligible.{' '}
                <a
                  href={ANNOUNCEMENT_HREF}
                  target="_blank"
                  tw="underline inline-flex items-center gap-1"
                  rel="noreferrer"
                >
                  <span>View the rules</span>
                  <Icon.Link tw="text-base" />
                </a>
              </p>
            </div>
          </Card>
        </Section>
      )}

      {loading && (
        <div tw="absolute inset-0">
          <div tw="absolute inset-0 top-16 flex flex-col items-center justify-center gap-6">
            <Fallback tw="text-7xl" />
            <p tw="text-neutral-400 light:text-black">
              Fetching leaderboard...
            </p>
          </div>
        </div>
      )}
      {!loading && (
        <React.Fragment>
          {/* <Section tw="mb-3 px-3 sm:px-0">
            <Toggle.Container tw="grid-cols-2 sm:w-1/2">
              <Toggle.Button
                active={tab === 'usdc'}
                onClick={() => setTab('usdc')}
              >
                USDC
              </Toggle.Button>
              <Toggle.Button
                active={tab === 'stable'}
                onClick={() => setTab('stable')}
              >
                Stables
              </Toggle.Button>
            </Toggle.Container>
          </Section> */}
          <Section tw="h-full overflow-hidden">
            <header tw="py-2 px-3 flex items-center justify-between gap-x-3 text-sm dark:text-up uppercase border-b border-neutral-700 sticky top-0">
              <p tw="flex items-center gap-x-3">
                <span tw="w-12 text-center">Rank</span>
                <span tw="">Account</span>
              </p>
              <span tw="">Total Volume ({tab.toUpperCase()})</span>
            </header>
            {ownStats && <Ranking trader={ownStats} me />}
            <div tw="h-full overflow-auto">
              {traders.length ? (
                traders.map((trader) => {
                  return <Ranking key={trader.account_id} trader={trader} />;
                })
              ) : (
                <p tw="text-center my-6">No rankings found</p>
              )}
            </div>
          </Section>
        </React.Fragment>
      )}
    </Wrapper>
  );
};

const Page = () => {
  return (
    <ErrorBoundary fallbackLabel="There was an error loading the leaderboard.">
      <AppLayout tw="h-screen overflow-hidden">
        <Content />
      </AppLayout>
    </ErrorBoundary>
  );
};

export default Page;
