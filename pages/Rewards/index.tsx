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
import AppLayout from '~/layouts/AppLayout';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { abbreviateAccountId } from '~/util';
import {
  useRewardsHistory,
  useRewardsProgramStats,
  useUnfinalizedRewards,
} from './helper';

const ANNOUNCEMENT_HREF =
  'https://tonicdex.medium.com/pembrock-and-tonic-launch-a-new-trading-competition-671d3d29f646';

const Wrapper = tw.main`
  flex-grow w-full overflow-auto
`;
const Section = tw.section`
  max-w-lg mx-auto 
`;

const Content = () => {
  const [tab, setTab] = useState<Race>('usdc');
  const [showRules, setShowRules] = useState(true);

  const { isSignedIn } = useWalletSelector();
  const [rewardsHistory, rewardsHistoryLoading] = useRewardsHistory();
  const [unfinalized, unfinalizedLoading] = useUnfinalizedRewards();
  const [stats, statsLoading] = useRewardsProgramStats();

  useEffect(() => {
    console.log({ rewardsHistory, unfinalized, stats });
  }, [rewardsHistory, unfinalized, stats]);

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
