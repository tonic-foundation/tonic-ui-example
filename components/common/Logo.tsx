import 'twin.macro';

export const LogoIcon: React.FC = (props) => {
  return (
    <img alt="" tw="h-6" src={require('~/assets/images/logo.svg')} {...props} />
  );
};

const Logo: React.FC<{ text?: string }> = ({ text = 'Tonic', ...props }) => {
  return (
    <div tw="font-bold flex items-center gap-x-2 select-none" {...props}>
      <LogoIcon />
      <span tw="cursor-default font-logo font-bold whitespace-nowrap">
        {text}
      </span>
    </div>
  );
};

export default Logo;
