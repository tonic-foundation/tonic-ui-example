/**
 * Check if the wallet is the official NEAR web wallet.
 *
 * Used to display the NEAR SVG icon instead of the default NEAR PNG icon (which
 * doesn't show up well in dark mode)
 */
export function isOfficialNearWallet(id: string) {
  return ['near-wallet', 'my-near-wallet'].includes(id);
}
