import React from 'react'; // required
import { css, Global } from '@emotion/react';
import tw, { GlobalStyles as BaseStyles, theme } from 'twin.macro';

const customStyles = {
  body: {
    ...tw`antialiased`,
  },
  ...css`
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type='number'] {
      -moz-appearance: textfield;
    }

    .dark {
      --color-scroll-thumb: ${theme`colors.neutral.700`};
    }

    .light {
      --color-scroll-thumb: ${theme`colors.neutral.400`};
    }

    scrollbar-color: var(--color-scroll-thumb);
    scrollbar-width: 6px;
    *::-webkit-scrollbar {
      width: 6px;
    }
    *::-webkit-scrollbar-thumb {
      background-color: var(--color-scroll-thumb);
    }

    html {
      width: 100vw;
      overflow-x: hidden;
    }

    body {
      ${tw`bg-neutral-50 font-primary text-black dark:(bg-black text-white) transition-colors duration-200`}
    }
  `,
};

const GlobalStyles = () => (
  <>
    <BaseStyles />
    <Global styles={customStyles} />
  </>
);

export default GlobalStyles;
