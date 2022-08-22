import { FungibleTokenMetadata } from '@tonic-foundation/token/lib/types';
import { ExchangeBalances } from '@tonic-foundation/tonic';
import { bnToFixed } from '@tonic-foundation/utils';
import BN from 'bn.js';
import React, { useEffect, useState } from 'react';
import tw, { styled } from 'twin.macro';
import AuthButton from '~/components/common/AuthButton';
import Fallback from '~/components/common/Fallback';
import { getExplorerUrl } from '~/config';
import useDepositWithdrawModal from '~/hooks/useDepositWithdrawModal';
import useSupportedTokens from '~/hooks/useSupportedTokens';
import { getTokenMetadata } from '~/services/token';
import CloseButton from '../CloseButton';
import TokenIcon from '../TokenIcon';
import Button from '../Button';
import { ModalBody, ModalHeader } from '../Modal';
import { useWalletSelector } from '~/state/WalletSelectorContainer';
import { useTonic } from '~/state/TonicClientContainer';

const Row = tw.div`flex items-start justify-between gap-x-3`;
const DepositWithdrawButton = styled(Button)(tw`p-1 px-2 text-sm`);

const Balance: React.FC<{ tokenId: string; amount: BN }> = ({
  tokenId,
  amount,
  ...props
}) => {
  const [ft, setFt] = useState<FungibleTokenMetadata>();
  const symbol = ft?.symbol || '---';
  const balance = ft
    ? bnToFixed(amount, ft.decimals, Math.min(ft.decimals, 5))
    : '---';

  useEffect(() => {
    getTokenMetadata(tokenId).then(setFt);
  }, [tokenId]);

  const setDepositWithdraw = useDepositWithdrawModal();

  if (!ft) {
    // NEAR indexer issue; ignore tokens with invalid/no metadata (contract was
    // deleted or something similar)
    return <React.Fragment />;
  }

  return (
    <Row {...props}>
      <a
        tw="flex items-center gap-x-3 hover:underline"
        href={getExplorerUrl('account', tokenId)}
        target="_blank"
        rel="noreferrer"
      >
        <TokenIcon src={ft?.icon} />
        <p tw="font-primary">{symbol}</p>
      </a>

      <div tw="flex items-center gap-x-3">
        <div tw="text-right">
          <p>{balance}</p>
        </div>
        <div tw="flex items-center justify-end gap-x-1.5">
          <DepositWithdrawButton
            variant="up"
            onClick={() =>
              setDepositWithdraw({ direction: 'deposit', tokenId })
            }
          >
            Manage
          </DepositWithdrawButton>
        </div>
      </div>
    </Row>
  );
};

const Balances: React.FC = (props) => {
  const { tonic } = useTonic();
  const [loading, setLoading] = useState(false);
  const [tokens] = useSupportedTokens();
  // TODO: atom for this?
  const [balances, setBalances] = useState<ExchangeBalances>();

  // Fetch exchange balances. Include all exchange balances, and display 0 for
  // anything whitelisted that doesn't have an exchange balance yet.

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const allBalances = await tonic.getBalances();
        if (tokens.length) {
          const filteredBalances: Record<string, BN> = allBalances;
          tokens.forEach((info) => {
            filteredBalances[info.address] =
              allBalances[info.address] || new BN(0);
          });
          setBalances(filteredBalances);
        } else {
          setBalances(allBalances);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tokens, tonic]);

  return (
    <div tw="font-primary text-sm space-y-3" {...props}>
      {loading && !balances ? (
        <Fallback tw="my-3" />
      ) : (
        balances &&
        Object.keys(balances)
          .sort((a, b) => {
            // NEAR first
            if (a === 'NEAR') {
              return -1;
            }
            if (balances[a].gt(balances[b])) {
              return -1;
            }
            return 1;
          })
          .map((t) => {
            return <Balance key={t} tokenId={t} amount={balances[t]} />;
          })
      )}
    </div>
  );
};

const Wrapper = tw.div`
  flex flex-col overflow-hidden
  h-[60vh] md:(w-screen max-w-sm)
`;

const ExchangeBalancesCard: React.FC<{ onClickClose: () => unknown }> = ({
  onClickClose,
  ...props
}) => {
  const { activeAccount } = useWalletSelector();

  return (
    <Wrapper {...props}>
      <ModalHeader>
        <h1 tw="text-base">Exchange balances</h1>
        <CloseButton hideOnMobile onClick={onClickClose} />
      </ModalHeader>
      <ModalBody>{!activeAccount ? <AuthButton /> : <Balances />}</ModalBody>
    </Wrapper>
  );
};

export default ExchangeBalancesCard;
