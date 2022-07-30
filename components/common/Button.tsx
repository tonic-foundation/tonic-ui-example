import tw, { styled } from 'twin.macro';

const BaseButton = tw.button`
  text-base
  py-2 px-4 rounded-md outline-none
  dark:(text-white border border-transparent bg-neutral-900 hover:bg-neutral-800 disabled:(border-neutral-800 text-neutral-200 hover:bg-neutral-900))
  light:(text-black border border-neutral-900 hover:underline bg-white disabled:(text-neutral-500 border-neutral-300 hover:no-underline))
  disabled:(cursor-not-allowed)
`;

const variantStyles = {
  up: tw`
    dark:(text-white bg-emerald-500 hover:bg-emerald-400)
    light:bg-emerald-300
  `,
  down: tw`
    dark:(text-white bg-red-700 hover:bg-red-600)
    light:(bg-red-600 text-white)
  `,
};

const Button = styled(BaseButton)<{ variant?: 'up' | 'down' }>(
  ({ variant, disabled }) => [
    variant === 'up' && !disabled && variantStyles.up,
    variant === 'down' && !disabled && variantStyles.down,
  ]
);

export default Button;
