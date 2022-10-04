import tw from 'twin.macro';
import Icon from '~/components/common/Icon';
import IconButton from '~/components/common/IconButton';
import { useIsMobile } from '~/hooks/useIsMobile';
import usePersistentState from '~/hooks/usePersistentState';
import Card, { CardBody, CardHeader } from '../../common/Card';
import RequireAuth from '../../common/RequireAuth';
import TabButton from '../../common/TabButton';
import OpenOrdersTable from './OpenOrdersTable';
import TradeHistoryTable from './TradeHistoryTable';

type Tab = 'open' | 'history';

const UserOrdersTable: React.FC<{ collapsible?: boolean }> = ({
  collapsible,
  ...props
}) => {
  const isMobile = useIsMobile();
  const [tab, setTab] = usePersistentState<Tab>('open');
  const [collapsed, setCollapsed] = usePersistentState(
    'orders-table-collapsed',
    !isMobile // default close on desktop, open on mobile
  );

  return (
    <Card {...props}>
      <CardHeader tw="p-0">
        <div tw="flex items-center">
          <TabButton
            active={!collapsed && tab === 'open'}
            onClick={() => {
              setCollapsed(false);
              setTab('open');
            }}
          >
            Open orders
          </TabButton>
          <TabButton
            active={!collapsed && tab === 'history'}
            onClick={() => {
              setCollapsed(false);
              setTab('history');
            }}
          >
            Trade history
          </TabButton>
        </div>
        {collapsible && (
          <IconButton.Base
            icon={collapsed ? <Icon.ChevronUp /> : <Icon.ChevronDown />}
            tw="mr-2"
            onClick={() => setCollapsed(!collapsed)}
          />
        )}
      </CardHeader>
      <CardBody
        tw="relative p-3 flex flex-col overflow-hidden md:min-h-[30vh]"
        css={collapsed && tw`hidden`}
      >
        <RequireAuth>
          {tab === 'open' ? <OpenOrdersTable /> : <TradeHistoryTable />}
        </RequireAuth>
      </CardBody>
    </Card>
  );
};

export default UserOrdersTable;
