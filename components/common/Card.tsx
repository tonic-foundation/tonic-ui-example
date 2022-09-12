import tw, { styled } from 'twin.macro';

const Card = styled.div<{ hasBorder?: boolean }>(({ hasBorder = true }) => [
  hasBorder && tw`border`,
  tw`
    rounded-md
    dark:(bg-neutral-900 border-neutral-800)
    light:(bg-white border-neutral-300)
    overflow-hidden
  `,
]);
export const CardHeader = tw.header`text-white text-base md:text-sm light:text-black px-3 py-2 flex items-center justify-between`;

export const CardBody = tw.div`p-3 border-t dark:border-neutral-800 light:border-neutral-300 flex flex-col overflow-hidden`;

export default Card;
