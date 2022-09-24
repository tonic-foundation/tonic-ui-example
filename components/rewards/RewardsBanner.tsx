import { atom, useRecoilState } from 'recoil';
import usePathMatches from '~/hooks/usePathMatches';
import Banner from '../common/Banner';

const bannerVisibilityState = atom({
  key: 'rewards-banner-visibility-state',
  default: true,
});

const RewardsBanner = () => {
  const [bannerVisible, setBannerVisible] = useRecoilState(
    bannerVisibilityState
  );
  const onRewardsPage = usePathMatches('/rewards');

  return (
    <Banner
      variant="info"
      onClickClose={() => setBannerVisible(false)}
      visible={bannerVisible && !onRewardsPage}
    >
      <div tw="flex-grow flex items-center justify-center">
        <p>
          💸💸💸 The{' '}
          <a
            tw="inline underline cursor-pointer"
            href="/#/rewards"
            onClick={() => {
              setBannerVisible(false);
              window.location.href = '/#/rewards';
            }}
          >
            September USN Liquidity Program
          </a>{' '}
          is live!
        </p>
      </div>
    </Banner>
  );
};

export default RewardsBanner;
