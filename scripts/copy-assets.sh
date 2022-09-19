#!/bin/bash

set -e

mkdir -p dist
test -d dist/charting_library || { echo 'copying charting library'; cp -R charting_library dist/charting_library; }
test -f dist/tradingview.css || { echo 'copying tradingview styles'; cp styles/tradingview.css dist; }
test -f dist/favicon.ico || { echo 'copying favicon'; cp assets/images/favicon.ico dist; }

# wallet icon path hardcoded in the library, we have no choice
# test -d dist/assets || { echo 'copying wallet icons'; cp -R assets/wallet-icons dist/assets; }
