import Icon from './Icon';

const Spinner: React.FC = (props) => {
  return (
    <Icon.LoadingSpin
      tw="dark:text-neutral-200 light:text-neutral-400 animate-spin"
      {...props}
    />
  );
};

export default Spinner;
