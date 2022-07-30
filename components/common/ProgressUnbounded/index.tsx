import { useState } from 'react';
import tw, { styled } from 'twin.macro';

const Dot = styled.div<{ active: boolean }>(({ active }) => [
  tw`w-2 h-2 rounded-full`,
  active ? tw`bg-red-500` : tw`bg-neutral-300`,
]);

const DOT_LAYOUT = [6, 5]; // top and bottom rows
const ProgressUnbounded: React.FC = (props) => {
  const [top, bottom] = DOT_LAYOUT;
  const [index, setIndex] = useState(0);
  const row = index % 2 === 0; // even is top row, odd is bottom
  //   const litIndex=(index %
  return <div></div>;
};

export default ProgressUnbounded;
