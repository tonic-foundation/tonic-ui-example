import { Routes, Route } from 'react-router-dom';

import Leaderboard from '~/pages/Leaderboard';
import Swap from './pages/Swap';
import Incentives from '~/pages/Incentives';
import Trade from '~/pages/Trade';
import LpRewards from './pages/Incentives/past/LpRewards';
import React from 'react';
import { TONIC_HAS_LEADERBOARD, TONIC_HAS_REWARDS } from './config';

function routes() {
  return (
    <Routes>
      <Route index element={<Swap />} />
      <Route path="/simple" element={<Swap />} />
      <Route path="/simple/:base/:quote" element={<Swap />} />

      <Route path="/advanced" element={<Trade />} />
      <Route path="/advanced/:market" element={<Trade />} />

      {TONIC_HAS_LEADERBOARD && (
        <Route path="/leaderboard" element={<Leaderboard />} />
      )}
      {TONIC_HAS_REWARDS && (
        <React.Fragment>
          <Route path="/incentives" element={<Incentives />} />
          <Route path="/incentives/past/usn-usdc" element={<LpRewards />} />
          <Route path="/rewards" element={<LpRewards />} />
        </React.Fragment>
      )}
    </Routes>
  );
}

export default routes;
