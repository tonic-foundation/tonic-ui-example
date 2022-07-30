import tw, { styled } from 'twin.macro';

const TabButton = styled.button<{ active: boolean }>(({ active }) => [
  tw`py-2 px-3 border-r dark:border-neutral-800 light:border-neutral-300`,
  active
    ? tw`dark:bg-neutral-700 light:bg-up`
    : tw`dark:(text-neutral-200 hover:bg-neutral-800) light:(text-black hover:underline)`,
]);

export default TabButton;
