import { css, TwStyle } from 'twin.macro';
import { range } from '~/util';
import Icon from '../common/Icon';

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

const UsnShower: React.FC<{ count: number; iconStyle?: TwStyle }> = ({
  count,
  iconStyle,
  ...props
}) => {
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
              <Icon.Usn tw="animate-spin w-4 h-4" css={iconStyle} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UsnShower;
