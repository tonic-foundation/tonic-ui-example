import tw, { styled, TwStyle } from 'twin.macro';

const Container = tw.div`
  flex items-stretch rounded-md
  dark:(bg-neutral-800)
  light:(bg-neutral-200)
`;

const Button = styled.button<{
  active: boolean;
  activeStyle?: TwStyle;
  baseStyle?: TwStyle;
}>(
  ({
    active,
    activeStyle = tw`bg-white dark:text-black`,
    baseStyle = tw`dark:(text-neutral-400 hover:text-neutral-200)`,
  }) => [
    tw`flex-1 rounded-md py-1 border`,
    active
      ? [tw`border-transparent light:(border-neutral-900)`, activeStyle]
      : [tw`border-transparent light:hover:underline`, baseStyle],
  ]
);

const Toggle = {
  Container,
  Button,
};

export default Toggle;
