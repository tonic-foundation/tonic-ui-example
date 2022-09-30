import tw from 'twin.macro';
import IconButton from './IconButton';

const CloseButton: React.FC<
  React.HTMLProps<HTMLButtonElement> & { hideOnMobile?: boolean }
> = ({ hideOnMobile = false, ...props }) => {
  return (
    <IconButton.Close {...props} css={hideOnMobile && tw`hidden md:flex`} />
  );
};

export default CloseButton;
