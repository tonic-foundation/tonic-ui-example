import { css } from 'twin.macro';
import { range } from '~/util';
import UsnIcon from './UsnIcon';

const animateFall = css`
  animation: fall 3s linear infinite;

  @keyframes fall {
    0% {
      transform: translate(0%, 0%);
      opacity: 0.5;
    }
    100% {
      transform: translate(0%, 40vh);
      opacity: 0;
    }
  }
`;

const UsnShower: React.FC<{ count: number }> = ({ count, ...props }) => {
  return (
    <div {...props}>
      <div tw="absolute inset-0">
        {range(count).map((i) => {
          return (
            <div
              key={i}
              style={{ left: `${(i / 8) * 100}%` }}
              // negative top to hide while waiting for animation to start
              tw="absolute -top-20"
              css={[
                animateFall,
                css`
                  animation-delay: ${Math.random() * 6}s;
                `,
              ]}
            >
              <UsnIcon tw="animate-spin w-4 h-4" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UsnShower;
