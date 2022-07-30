import 'twin.macro';
import { MdClose } from 'react-icons/md';
import IconButton from './IconButton';
import tw from 'twin.macro';

const CloseButton: React.FC<
  React.HTMLProps<HTMLButtonElement> & { hideOnMobile?: boolean }
> = ({ hideOnMobile = false, ...props }) => {
  return (
    <IconButton
      {...props}
      css={hideOnMobile && tw`hidden md:flex`}
      type="button"
    >
      <MdClose />
    </IconButton>
  );
};

export default CloseButton;
