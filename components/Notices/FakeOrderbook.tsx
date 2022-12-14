import tw from 'twin.macro';
import { range } from '~/util';

const Side: React.FC<{ up?: boolean }> = ({ up, ...props }) => {
  return (
    <div tw="flex items-end" css={up && tw`flex-row-reverse`} {...props}>
      {/* these numbers were empirically chosen (ie I guessed and checked until
      it looked right) */}
      {range(Math.floor(Math.random() * 3) + 7).map((n) => {
        const delta = 0.15 * (Math.random() - 0.5);
        // max 100, min 8 (ensure middle is never empty)

        const size = Math.max(Math.min(100 * (n / 10 + delta), 100), 8);

        return (
          <span
            key={n}
            style={{ height: `${size}%` }}
            tw="flex-1"
            css={up ? tw`bg-up` : tw`bg-down`}
          ></span>
        );
      })}
    </div>
  );
};

const FakeOrderbook: React.FC = ({ ...props }) => {
  return (
    <div {...props} tw="relative flex items-stretch min-h-[200px]">
      <div tw="absolute text-center text-white left-0 top-10 right-0 leading-none" />
      <Side tw="flex-1" up />
      <Side tw="flex-1" />
    </div>
  );
};

export default FakeOrderbook;
