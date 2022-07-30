import React from 'react';
import tw, { TwStyle } from 'twin.macro';
import CloseButton from '../CloseButton';

export type Variant = 'info' | 'warning' | 'error';

const containerStyles: Record<Variant, TwStyle> = {
  info: tw`bg-up-dark`,
  error: tw`bg-down-dark`,
  warning: tw`bg-amber-300`,
};

const Banner: React.FC<{
  variant?: Variant;
  visible: boolean;
  onClickClose: () => unknown;
}> = ({ variant = 'info', visible, onClickClose, children, ...props }) => {
  return (
    <React.Fragment>
      {visible && (
        <div
          css={containerStyles[variant]}
          tw="bg-opacity-80 p-2 px-4 flex items-center justify-between"
          {...props}
        >
          {children}
          <CloseButton tw="light:hover:bg-white" onClick={onClickClose} />
        </div>
      )}
    </React.Fragment>
  );
};

export default Banner;
