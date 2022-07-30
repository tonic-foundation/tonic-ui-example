import Spinner from './Spinner';

const Fallback: React.FC = (props) => {
  return (
    <div tw="flex items-center justify-center text-3xl" {...props}>
      <Spinner />
    </div>
  );
};

export default Fallback;
