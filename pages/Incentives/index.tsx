import { Link } from 'react-router-dom';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import tw, { styled } from 'twin.macro';
import AuthButton from '~/components/common/AuthButton';
import Button from '~/components/common/Button';
import Card from '~/components/common/Card';
import Fallback from '~/components/common/Fallback';
import Modal, { ModalBody, ModalHeader } from '~/components/common/Modal';
import Shape from '~/components/common/Shape';
import ErrorBoundary from '~/components/ErrorBoundary';
import { NoticeContent } from '~/components/Notices';
import AppLayout from '~/layouts/AppLayout';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import Typography from './components/Typography';
import {
  useFeeRebateHistory,
  useFeeSummary,
} from '~/services/incentives/fee-rebates';
import { truncateToLocaleString } from '~/util';
import CloseButton from '~/components/common/CloseButton';
import LineItem from './components/LineItem';
import PayoutTxn from './components/PayoutTxn';
import { GOBLIN_HREF } from '~/config';

const feeModalVisibleState = atom({
  key: 'incentives-fee-modal-visible-state',
  default: false,
});

const Wrapper = tw.main`flex-grow w-full overflow-auto space-y-6 py-12`;
const Section = tw.section`max-w-screen-sm mx-auto px-3 md:px-0`;
const NoticeWrapper = tw.div`relative w-[300px] h-[200px] overflow-hidden`;
const IncentiveCard = styled(Card)(
  tw`border-none flex flex-col max-w-[300px] shadow-lg`
);

const FeeSummary: React.FC = (props) => {
  const { data, error } = useFeeSummary();

  if (error) {
    return <p {...props}>Error loading fee summary.</p>;
  }

  if (!data) {
    return (
      <div {...props}>
        <Fallback />
      </div>
    );
  }

  return (
    <div tw="space-y-1" {...props}>
      <LineItem.Container>
        <LineItem.Left>Fees accrued (October)</LineItem.Left>
        <LineItem.Right>
          ${truncateToLocaleString(data.total_eligible, 2)}
        </LineItem.Right>
      </LineItem.Container>
      <LineItem.Container>
        <LineItem.Left>Fees rebated</LineItem.Left>
        <LineItem.Right>
          ${truncateToLocaleString(data.total_paid, 2)}
        </LineItem.Right>
      </LineItem.Container>
      <LineItem.Container>
        <LineItem.Left>Rebates pending</LineItem.Left>
        <LineItem.Right>
          ${truncateToLocaleString(data.outstanding, 2)}
        </LineItem.Right>
      </LineItem.Container>
    </div>
  );
};

const FeeHistory: React.FC = (props) => {
  const { data, error } = useFeeRebateHistory();

  if (error) {
    return <p {...props}>Error loading fee summary.</p>;
  }

  if (!data) {
    return (
      <div {...props}>
        <Fallback />
      </div>
    );
  }

  return (
    <div tw="space-y-1" {...props}>
      {data.length ? (
        data.map((r) => {
          return (
            <div key={r.paid_at.toISOString()} tw="grid grid-cols-3">
              <span>{r.paid_at.toLocaleDateString()}</span>
              <span>${truncateToLocaleString(r.amount, 2)}</span>
              <div tw="items-end">
                <PayoutTxn txId={r.paid_in_tx_id} abbreviateTo={9} />
              </div>
            </div>
          );
        })
      ) : (
        <p>No rebates</p>
      )}
    </div>
  );
};

const FeeContent: React.FC<{ handleClose: () => unknown }> = ({
  handleClose,
}) => {
  return (
    <div tw="md:w-[380px] max-h-[420px] flex flex-col items-stretch justify-between">
      <ModalHeader tw="flex items-center justify-between">
        <h1>Fee Rebates</h1>
        <CloseButton onClick={handleClose} />
      </ModalHeader>
      <ModalBody>
        <FeeSummary />
        <p tw="text-lg mt-6">Payout history</p>
        <section tw="mt-6 max-h-[240px] overflow-y-auto overflow-x-hidden">
          <FeeHistory />
        </section>
      </ModalBody>
    </div>
  );
};
const FeeModal = () => {
  const [visible, setVisible] = useRecoilState(feeModalVisibleState);

  return (
    <Modal
      visible={visible}
      onClose={() => setVisible(false)}
      drawerOnMobile
      render={({ closeModal }) => <FeeContent handleClose={closeModal} />}
    />
  );
};

const UsnUsdcIncentive = () => {
  return (
    <IncentiveCard tw="md:flex-1">
      <div>
        <NoticeWrapper>
          <NoticeContent.UsnUsdcLp tw="cursor-default" />
        </NoticeWrapper>
      </div>
      <div tw="flex-grow flex flex-col items-stretch justify-between p-6">
        <div tw="flex items-center gap-3 mt-2">
          <div>
            <Shape.Cdot />
          </div>
          <Typography.Description>Daily USN rewards</Typography.Description>
        </div>

        <div tw="flex items-center gap-3 mt-2">
          <div>
            <Shape.Cdot />
          </div>
          <Typography.Description>
            Bot trading encouraged
          </Typography.Description>
        </div>

        <div tw="flex items-center gap-3 mt-2">
          <div>
            <Shape.Cdot />
          </div>
          <Typography.Description>
            Must hold a{' '}
            <Typography.Link url={GOBLIN_HREF}>
              Tonic Goblin NFT
            </Typography.Link>
          </Typography.Description>
        </div>

        <Link to="/incentives/past/usn-usdc" tw="mt-6 w-full">
          <Button tw="w-full" variant="up">
            View rewards
          </Button>
        </Link>
      </div>
    </IncentiveCard>
  );
};

const OctoberFeeIncentive = () => {
  const { isSignedIn } = useWalletSelector();
  const setFeeModalVisible = useSetRecoilState(feeModalVisibleState);

  return (
    <IncentiveCard tw="md:flex-1 relative">
      <div>
        <NoticeWrapper>
          <NoticeContent.ZeroFees tw="cursor-default" />
        </NoticeWrapper>
      </div>

      <div tw="flex-grow flex flex-col justify-between p-6">
        <div tw="flex items-center gap-3 mt-2">
          <div>
            <Shape.Cdot />
          </div>
          <Typography.Description>
            All stable fees rebated in USN
          </Typography.Description>
        </div>

        <div tw="flex items-center gap-3 mt-2">
          <div>
            <Shape.Cdot />
          </div>
          <Typography.Description>
            All trading modes supported
          </Typography.Description>
        </div>

        <div tw="flex items-center gap-3 mt-2">
          <div>
            <Shape.Cdot />
          </div>
          <Typography.Description>No signup required</Typography.Description>
        </div>

        {isSignedIn ? (
          <Button
            tw="mt-6"
            variant="up"
            onClick={() => setFeeModalVisible(true)}
          >
            View your rebates
          </Button>
        ) : (
          <AuthButton tw="mt-6" />
        )}
      </div>
    </IncentiveCard>
  );
};

const AuroraLpIncentive = () => {
  return (
    <IncentiveCard tw="md:flex-1">
      <div>
        <NoticeWrapper>
          <NoticeContent.AuroraLp tw="cursor-default" />
        </NoticeWrapper>
      </div>
      <div tw="flex-grow flex flex-col items-stretch justify-between p-6">
        <div tw="flex items-center gap-3 mt-2">
          <div>
            <Shape.Cdot />
          </div>
          <Typography.Description>500 AURORA paid daily</Typography.Description>
        </div>

        <div tw="flex items-center gap-3 mt-2">
          <div>
            <Shape.Cdot />
          </div>
          <Typography.Description>
            Bot trading encouraged
          </Typography.Description>
        </div>

        <div tw="flex items-center gap-3 mt-2">
          <div>
            <Shape.Cdot />
          </div>
          <Typography.Description>
            Must hold a{' '}
            <Typography.Link url={GOBLIN_HREF}>
              Tonic Goblin NFT
            </Typography.Link>
          </Typography.Description>
        </div>

        <Link
          to="/advanced/Fef7VNamGSiujh9AL88FyF9MgN1M7vJvX9CtEdSmYGoP"
          tw="mt-6 w-full"
        >
          <Button tw="w-full" variant="up">
            Get started
          </Button>
        </Link>
      </div>
    </IncentiveCard>
  );
};

const Content = () => {
  return (
    <Wrapper>
      <Section>
        <div tw="mx-auto max-w-[300px] md:(max-w-full) mb-6">
          <Typography.Heading>Current Incentives</Typography.Heading>
        </div>
        {/* <p>There are no current incentives.</p> */}
        <div tw="flex flex-col items-center md:(flex-row items-stretch justify-between) gap-6">
          <AuroraLpIncentive />
        </div>
      </Section>

      <Section>
        <div tw="mx-auto max-w-[300px] md:(max-w-full) mb-6">
          <Typography.Heading>Past Incentives</Typography.Heading>
        </div>
        {/* <div tw="flex flex-col items-center md:(flex-row items-stretch justify-between) gap-6">
        </div> */}
        <div tw="flex flex-col items-center md:(flex-row items-stretch justify-between) gap-6">
          <OctoberFeeIncentive />
          <UsnUsdcIncentive />
        </div>
      </Section>
    </Wrapper>
  );
};

const Page = () => {
  return (
    <ErrorBoundary fallbackLabel="There was an error loading incentives.">
      {/* Allow flowing off the screen on this page. Looks better this way.  */}
      <AppLayout
        hasFooter={false}
        tw="min-h-screen h-full md:(min-h-screen h-full)"
      >
        <Content />
        <FeeModal />
      </AppLayout>
    </ErrorBoundary>
  );
};

export default Page;
