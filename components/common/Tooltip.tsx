import React from 'react';
import { FaRegQuestionCircle } from 'react-icons/fa';
import tw, { styled } from 'twin.macro';
import BaseCard from './Card';

const Card = styled(BaseCard)(
  tw`
    dark:(bg-white text-black)
    hidden text-xs border border-neutral-600 p-3 py-2
    group-hover:(top-0 min-w-[180px] absolute z-10 block shadow-lg)
  `
);

const Tooltip: React.FC<{ trigger?: React.ReactChild }> = ({
  children,
  trigger,
  ...props
}) => {
  return (
    <div
      className="group"
      tw="relative inline-block"
      // dont screw mobile users
      onClick={(e) => e.stopPropagation()}
    >
      {trigger ? trigger : <FaRegQuestionCircle tw="group-hover:opacity-20" />}
      <Card {...props}>{children}</Card>
    </div>
  );
};

export default Tooltip;
