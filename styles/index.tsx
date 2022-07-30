import tw from 'twin.macro';

const upText = tw`text-up light:text-up-dark`;
const downText = tw`text-down light:text-down-dark`;

export const colors = {
  upText,
  downText,
  /**
   * positive diff = up; negative diff = down; 0 = neutral
   */
  priceText: (diff: number) =>
    diff > 0 ? upText : diff < 0 ? downText : tw`text-white`,
};
