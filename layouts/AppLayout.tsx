import React, { useState } from 'react';
import tw, { styled } from 'twin.macro';
import RpcStatus from '~/components/common/RpcStatus';
import Button from '~/components/common/Button';
import AuthButton from '~/components/common/AuthButton';
import {
  DISCORD_GENERAL_HREF,
  DOCS_GENERAL_HREF,
  FEEDBACK_HREF,
  GITHUB_HREF,
  TONIC_HAS_LEADERBOARD,
  TELEGRAM_HREF,
  TWITTER_HREF,
  TONIC_HAS_REWARDS,
} from '~/config';
import Logo from '~/components/common/Logo';
import { useIsMobile } from '~/hooks/useIsMobile';
import { Link } from 'react-router-dom';
import ThemeToggle from '~/components/common/ThemeToggle';
import NearLogo from '~/components/common/NearLogo';
import Modal, { ModalBody } from '~/components/common/Modal';
import Toggle from '~/components/common/Toggle';
import useHasTonicAccount from '~/hooks/useHasTonicAccount';
import useExchangeBalancesModal from '~/components/common/ExchangeBalances/useExchangeBalancesModal';
import usePathMatches from '~/hooks/usePathMatches';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import Icon from '~/components/common/Icon';

const styles = {
  link: ({ active }: { active?: boolean }) => [
    tw`
      flex items-center
      dark:(text-white opacity-80 hover:opacity-100)
      light:(text-black hover:underline)
    `,
    active && tw`dark:opacity-100 light:underline`,
  ],
};

/**
 * Toggle-like links for switching between the swap and exchange views
 */
const SimpleAdvancedToggle = () => {
  const isAdvanced = usePathMatches('/advanced/*');

  return (
    // HACK: h-12 makes height match other menu items in the mobile drawer
    <Toggle.Container tw="h-12 md:h-auto grid grid-cols-2">
      <Toggle.Button tw="px-3" active={!isAdvanced}>
        <Link to="/simple">Simple</Link>
      </Toggle.Button>
      <Toggle.Button tw="px-3" active={isAdvanced}>
        <Link to="/advanced">Advanced</Link>
      </Toggle.Button>
    </Toggle.Container>
  );
};

/**
 * Main menu. Control which layout to render using the mobile flag.
 */
const NavLinks: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const setBalancesVisible = useExchangeBalancesModal();
  const [hasTonicAccount, loading] = useHasTonicAccount();
  const { isSignedIn } = useWalletSelector();
  // we display the deposit/withdraw if loading just to prevent a flash

  if (mobile) {
    return (
      <React.Fragment>
        <SimpleAdvancedToggle />
        {(loading || (isSignedIn && hasTonicAccount)) && (
          <MobileMenuButton onClick={() => setBalancesVisible(true)}>
            Deposit/Withdraw
          </MobileMenuButton>
        )}
        {TONIC_HAS_LEADERBOARD && (
          <MobileMenuButton>
            <Link to="/leaderboard">Leaderboard</Link>
          </MobileMenuButton>
        )}
        {TONIC_HAS_REWARDS && (
          <MobileMenuButton>
            <Link to="/incentives">Incentives</Link>
          </MobileMenuButton>
        )}
        <AuthButton tw="py-4" />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {TONIC_HAS_LEADERBOARD && (
        <Link css={styles.link} to="/leaderboard">
          Leaderboard
        </Link>
      )}
      {TONIC_HAS_REWARDS && (
        <Link css={styles.link} to="/incentives">
          Incentives
        </Link>
      )}
      {/* putting the theme toggle here is a hack */}
      <ThemeToggle />
      <SimpleAdvancedToggle />
      {(loading || (isSignedIn && hasTonicAccount)) && (
        <Button
          tw="text-sm"
          variant="up"
          onClick={() => setBalancesVisible(true)}
        >
          Deposit/Withdraw
        </Button>
      )}
      <AuthButton tw="text-sm" />
    </React.Fragment>
  );
};

const MobileMenuButton = styled(Button)(tw`py-3 dark:border-neutral-800`);
const MobileMenu: React.FC = () => {
  const [visible, setVisible] = useState(false);

  return (
    <React.Fragment>
      <div tw="flex items-center gap-4">
        {/* putting the theme toggle here is a hack */}
        <ThemeToggle />
        <button tw="transition duration-200" onClick={() => setVisible(true)}>
          <Icon.Menu tw="text-3xl" />
        </button>
      </div>
      <Modal drawerOnMobile visible={visible} onClose={() => setVisible(false)}>
        <ModalBody tw="flex flex-col items-stretch gap-3">
          <NavLinks mobile />
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

const Header: React.FC<{ leftContent?: React.ReactNode }> = ({
  leftContent,
}) => {
  const isMobile = useIsMobile();

  return (
    // crazy padding here is for logo positioning. If you use a uniform p-3, it
    // will feel a little too close to the left edge of the screen. You need
    // slightly more than what's truly "correct" to make it feel like it's in
    // the right place.
    <header tw="pl-4 pr-3 pt-3 md:(pl-5 py-0 h-16) flex-shrink-0 flex items-center justify-between">
      <div tw="flex items-center gap-2">
        <a href="/">
          <Logo tw="text-xl" />
        </a>
        {leftContent}
      </div>

      {isMobile ? (
        <MobileMenu />
      ) : (
        <nav tw="flex items-stretch gap-x-3">
          <NavLinks />
        </nav>
      )}
    </header>
  );
};

const SocialLink = styled.a(styles.link);
const Footer: React.FC = (props) => {
  return (
    <footer
      tw="p-2 px-3 hidden md:flex items-center justify-between text-sm"
      {...props}
    >
      {/* left */}
      <RpcStatus />

      {/* right */}
      <div tw="flex items-center justify-between gap-x-3">
        <a
          target="_blank"
          rel="noreferrer"
          href="https://near.org"
          tw="flex items-center text-white light:text-black opacity-50 hover:opacity-100 transition"
        >
          <span tw="mr-1">Built on</span>
          <NearLogo />
        </a>
        <div tw="flex items-center gap-x-2">
          {FEEDBACK_HREF && (
            <SocialLink href={FEEDBACK_HREF} target="_blank">
              Feedback
            </SocialLink>
          )}
          <SocialLink href={DOCS_GENERAL_HREF} target="_blank">
            Docs
          </SocialLink>
          <SocialLink href={GITHUB_HREF} target="_blank">
            <Icon.Github />
          </SocialLink>
          <SocialLink href={TWITTER_HREF} target="_blank">
            <Icon.Twitter />
          </SocialLink>
          <SocialLink href={DISCORD_GENERAL_HREF} target="_blank">
            <Icon.Discord />
          </SocialLink>
          <SocialLink href={TELEGRAM_HREF} target="_blank">
            <Icon.Telegram />
          </SocialLink>
        </div>
      </div>
    </footer>
  );
};

const Wrapper = tw.div`
  md:(h-screen min-w-max overflow-auto)
  flex flex-col
  font-primary
`;

const AppLayout: React.FC<{
  headerLeftContent?: React.ReactNode;
  hasFooter?: boolean;
}> = ({ headerLeftContent, children, hasFooter = true, ...props }) => {
  return (
    <div tw="w-screen min-h-screen overflow-auto">
      <Wrapper {...props}>
        <Header leftContent={headerLeftContent} />
        {children}
        {hasFooter && <Footer />}
      </Wrapper>
    </div>
  );
};

export default AppLayout;
