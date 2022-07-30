import 'twin.macro';
import { DEFAULT_TOKEN_ICON } from '~/config';

const TokenIcon: React.FC<{ src?: string | null }> = ({ src, ...props }) => {
  return (
    <img
      alt=""
      tw="h-8 w-8 rounded-full object-cover"
      src={src || DEFAULT_TOKEN_ICON}
      {...props}
    />
  );
};

export default TokenIcon;
