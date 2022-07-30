import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const Spinner: React.FC = (props) => {
  return (
    <AiOutlineLoading3Quarters
      tw="dark:text-neutral-200 light:text-neutral-400 animate-spin"
      {...props}
    />
  );
};

export default Spinner;
