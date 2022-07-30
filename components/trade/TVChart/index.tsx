import {
  ChartingLibraryWidgetOptions,
  LanguageCode,
  ResolutionString,
  widget,
} from '~/charting_library/charting_library';
import React, { useEffect, useMemo } from 'react';
import { theme } from 'twin.macro';
import { TONIC_TV_URL } from '~/config';
import useTheme, { ThemeName } from '~/hooks/useTheme';
import { useIsMobile } from '~/hooks/useIsMobile';

export interface ChartContainerProps {
  symbol: ChartingLibraryWidgetOptions['symbol'];
  interval: ChartingLibraryWidgetOptions['interval'];

  // BEWARE: no trailing slash is expected in feed URL
  datafeedUrl: string;
  libraryPath: ChartingLibraryWidgetOptions['library_path'];
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'];
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'];
  clientId: ChartingLibraryWidgetOptions['client_id'];
  userId: ChartingLibraryWidgetOptions['user_id'];
  fullscreen: ChartingLibraryWidgetOptions['fullscreen'];
  height: ChartingLibraryWidgetOptions['height'] | string; // this library is terrible
  autosize: ChartingLibraryWidgetOptions['autosize'];
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides'];
  container: string; // ChartingLibraryWidgetOptions['container'];
  theme: string;
}

export interface ChartContainerState {
  foo: boolean;
}

function getLanguageFromURL(): LanguageCode | null {
  const regex = new RegExp('[\\?&]lang=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null
    ? null
    : (decodeURIComponent(results[1].replace(/\+/g, ' ')) as LanguageCode);
}

const defaultProps = (): ChartContainerProps => {
  return {
    symbol: 'TONIC',
    interval: '15' as ResolutionString,
    container: 'tv-chart-container',
    datafeedUrl: TONIC_TV_URL,
    libraryPath: '/charting_library/charting_library/',
    chartsStorageUrl: 'https://saveload.tradingview.com',
    chartsStorageApiVersion: '1.1',
    clientId: 'tradingview.com',
    userId: 'public_user_id',
    fullscreen: false,
    autosize: true,
    height: '100',
    studiesOverrides: {},
    theme: 'Dark',
  };
};

interface ColorOverrides {
  background: string;
  up: string;
  down: string;
  grid: string;
  text: string;
  line: string;
  border: string;
  scaleBackground: string;
  scaleLine: string;
}

function getColorOverrides(themeName: ThemeName): ColorOverrides {
  if (themeName === 'dark') {
    return {
      background: theme`colors.neutral.900`,
      down: theme`colors.down`,
      up: theme`colors.up`,
      border: theme`colors.neutral.300`,
      grid: theme`colors.neutral.800`,
      line: theme`colors.neutral.800`,
      scaleBackground: theme`colors.neutral.700`,
      scaleLine: theme`colors.neutral.700`,
      text: theme`colors.neutral.100`,
    };
  }
  return {
    background: 'white',
    down: theme`colors.down.dark`,
    up: theme`colors.up.dark`,
    border: theme`colors.neutral.200`,
    grid: theme`colors.neutral.200`,
    line: theme`colors.neutral.200`,
    scaleBackground: 'white',
    scaleLine: theme`colors.neutral.200`,
    text: 'black',
  };
}

const TVChart: React.FC<Partial<ChartContainerProps>> = (props) => {
  const fullProps = useMemo(() => {
    return { ...defaultProps(), ...props };
  }, [props]);

  const { theme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    const colors = getColorOverrides(theme);

    const widgetOptions: ChartingLibraryWidgetOptions = {
      debug: false,
      // interval: props.interval as ChartingLibraryWidgetOptions['interval'],
      interval: '60' as ChartingLibraryWidgetOptions['interval'],
      timeframe: '1D',
      library_path: fullProps.libraryPath as string,
      container: fullProps.container,
      client_id: fullProps.clientId,
      user_id: fullProps.userId,
      fullscreen: fullProps.fullscreen,
      studies_overrides: fullProps.studiesOverrides,
      symbol: fullProps.symbol as string,
      custom_css_url: '/tradingview.css',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone as any,

      // BEWARE: no trailing slash is expected in feed URL
      datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(
        fullProps.datafeedUrl
      ),

      locale: getLanguageFromURL() || 'en',
      disabled_features: [
        isMobile ? 'left_toolbar' : '',
        isMobile ? 'header_fullscreen_button' : '',
        'use_localstorage_for_settings', // this breaks styles
        'timeframes_toolbar',
        'show_logo_on_all_charts',
        'caption_buttons_text_if_possible',
        'header_settings',
        'header_chart_type',
        'header_compare',
        'compare_symbol',
        'header_screenshot',
        'header_widget_dom_node',
        'header_undo_redo',
        'header_interval_dialog_button',
        'show_interval_dialog_on_key_press',
        'header_symbol_search',
        'volume_force_overlay',
      ],
      auto_save_delay: 3,
      load_last_chart: true,
      autosize: true,
      loading_screen: {
        backgroundColor: colors.background,
      },
      theme: theme === 'dark' ? 'Dark' : 'Light',
      overrides: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        'paneProperties.backgroundType': 'solid', // required to use background override; default is gradient, which ignores it
        'paneProperties.vertGridProperties.color': colors.grid,
        'paneProperties.horzGridProperties.color': colors.grid,
        'paneProperties.background': colors.background,
        'mainSeriesProperties.priceLineColor': colors.line,
        'mainSeriesProperties.baseLineColor': colors.line,
        'mainSeriesProperties.candleStyle.upColor': colors.up,
        'mainSeriesProperties.candleStyle.wickUpColor': colors.up,
        'mainSeriesProperties.candleStyle.downColor': colors.down,
        'mainSeriesProperties.candleStyle.wickDownColor': colors.down,
        'mainSeriesProperties.candleStyle.borderColor': colors.border,
        'mainSeriesProperties.candleStyle.borderUpColor': colors.up,
        'mainSeriesProperties.candleStyle.borderDownColor': colors.down,
        'scalesProperties.textColor': colors.text,
        'scalesProperties.lineColor': colors.scaleLine,
        'scalesProperties.backgroundColor': colors.scaleBackground,
        'mainSeriesProperties.candleStyle.drawWick': true,
        'mainSeriesProperties.candleStyle.drawBorder': true,
      },
    };

    const w = new widget(widgetOptions);

    w.onChartReady(() => {
      w.subscribe('onAutoSaveNeeded', function () {
        w.saveChartToServer();
      });

      if (!isMobile) {
        w.activeChart().createStudy('Moving Average', false, false, [5]);
        w.activeChart().createStudy('Moving Average', false, false, [10]);
        w.activeChart().createStudy('Moving Average', false, false, [30]);
      }
    });

    return () => {
      w.remove();
    };
  }, [props.symbol, theme, isMobile]);

  return <div {...props} id={fullProps.container}></div>;
};

export default TVChart;
