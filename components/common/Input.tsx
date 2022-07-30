import tw, { styled } from 'twin.macro';

const BaseInput = tw.input`
  w-full p-3 py-2 md:py-1.5 border
  rounded-md outline-none appearance-none
  placeholder:font-primary
  dark:(bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-200)
  light:(border-neutral-900 text-black placeholder:text-neutral-500)
  disabled:(cursor-not-allowed placeholder:text-neutral-300 text-neutral-300 light:placeholder:text-neutral-500)
`;

const Input = styled(BaseInput)<{ hasInnerLabel?: boolean }>(
  ({ hasInnerLabel = false }) => [hasInnerLabel && tw`pr-12`]
);

export default Input;
