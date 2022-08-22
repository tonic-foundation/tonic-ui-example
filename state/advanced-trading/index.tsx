// TODO: rename
import React from 'react';

import { OpenOrdersContainer } from './OpenOrdersContainer';
export { useOpenOrders } from './OpenOrdersContainer';

export const AdvancedTradingContainer: React.FC = ({ children }) => {
  return (
    <React.Fragment>
      <OpenOrdersContainer.Provider>{children}</OpenOrdersContainer.Provider>
    </React.Fragment>
  );
};
