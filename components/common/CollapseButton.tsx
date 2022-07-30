import 'twin.macro';
import IconButton from './IconButton';
import { HiChevronDown } from 'react-icons/hi';

const CollapseButton: React.FC<React.HTMLProps<HTMLButtonElement>> = (
  props
) => {
  return (
    <IconButton {...props} type="button">
      <HiChevronDown tw="text-sm" />
    </IconButton>
  );
};

export default CollapseButton;
