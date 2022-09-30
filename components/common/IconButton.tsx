import { ClickHandler } from '~/types/event-handlers';
import React from 'react';
import tw from 'twin.macro';
import Icon from './Icon';

interface BaseProps {
  hideOnMobile?: boolean;
  onClick?: ClickHandler;
}

function curried<T = unknown>(icon: React.ReactNode): React.FC<BaseProps & T> {
  return (props) => <BaseIconButton icon={icon} {...props}></BaseIconButton>;
}

const BaseButton = tw.button`
  w-6 h-6 rounded-full
  flex items-center justify-center text-base
  dark:hover:bg-neutral-700
  light:hover:bg-neutral-200
`;

const BaseIconButton: React.FC<
  React.HTMLProps<HTMLButtonElement> &
    BaseProps & {
      icon?: React.ReactNode;
    }
> = ({ icon, hideOnMobile, ...props }) => {
  return (
    <BaseButton
      {...props}
      css={hideOnMobile && tw`hidden md:flex`}
      type="button"
    >
      {icon}
    </BaseButton>
  );
};

const IconButton = {
  Base: BaseIconButton,
  Close: curried(<Icon.Close />),
  Back: curried(<Icon.Back />),
};

export default IconButton;
