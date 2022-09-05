import { Routes, Route } from 'react-router-dom';

import Leaderboard from '~/pages/Leaderboard';
import Swap from './pages/Swap';
import Trade from '~/pages/Trade';
import { TONIC_HAS_LEADERBOARD } from './config';

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
    </Routes>
  );
}

export default routes;
