[tonic-main-site]: https://tonic.foundation
[app-demo]: https://app.tonic.foundation
[data-api-repo]: https://github.com/tonic-foundation/data-api
[indexer-repo]: https://github.com/tonic-foundation/tonic-indexer
[tonic-docs]: https://docs.tonic.foundation
[tailwind]: https://tailwindcss.com/
[twin.macro]: https://github.com/ben-rogerson/twin.macro
[react]: https://reactjs.org
[recoil]: https://recoiljs.org/docs/introduction/motivation
[tv-chart]: https://www.tradingview.com/HTML5-stock-forex-bitcoin-charting-library/?feature=technical-analysis-charts

# Tonic trading UI example

This is an example React app for trading on the [Tonic
orderbook][tonic-main-site]. For detailed information about Tonic and the Tonic
SDK, please refer to the [documentation][tonic-docs].

A sample deployment is available [here][app-demo].

# Stack

- [React][react]
- [TailwindCSS][tailwind] (with [twin.macro][twin.macro])
- [Recoil][recoil]

# Directories

| Directory          | Description                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `state`            | Shared state. This example uses [Recoil][recoil] for state management.                           |
| `services`         | Shim code for accessing APIs and making calls to the NEAR chain.                                 |
| `charting_library` | [TradingView charting library][tv-chart]                                                         |
| `config`           | Configuration, including the contract ID, API URLs, etc. This example includes testnet defaults. |

# Getting started

Set required configuration in your environment. You can use these values to get
started.

```
export NEAR_ENV=mainnet
export TONIC_CONTRACT_ID=v1.orderbook.near
export TONIC_DEFAULT_MARKET_ID=2UmzUXYpaZg4vXfFVmD7r8mYUYkKEF19xpjLw7ygDUwp # near/usdc
export TONIC_DATA_API_URL=https://data-api.tonic.foundation
```

> Note that the Tonic example API is provided with no guarantees and may change or
> become unavailable without notice. Please refer to the [data api][data-api-repo]
> for information on running your own charting service.

For a full list of configuration options, see [`config/index.ts`](./config/index.ts).

Start the dev server

```
yarn dev
```

The development site is now available at https://localhost:3000.

# Building for production

```
yarn build
```

The production bundle will be emitted to `dist`.

# Configuration

See [`config/index.ts`](./config/index.ts) for available options and documentation.

# Charting data

This UI depends on the Tonic data API to display listings and charting
information. Check out the [Github repo][data-api-repo] for information on
running your own instance of the data API.

# Dev notes

- The `pre:all` npm script copies static assets into `dist`. Notably, wallet
  icon URLs are harcoded by `@near-wallet-selector` to use
  `/assets/wallet-name.png`, so we're forced to use that scheme in the build.
