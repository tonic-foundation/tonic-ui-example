import { useEffect, useState } from 'react';

const LoadingEllipsis = () => {
  const [text, setText] = useState('...');

  useEffect(() => {
    let count = 3;
    function next() {
      count = (count + 1) % 4;
      setText('.'.repeat(count));
    }
    const id = setInterval(next, 500);

    return () => clearInterval(id);
  }, []);

  return <span>{text}</span>;
};

const OrderConfirming = () => {
  return (
    <p>
      Order confirming
      <LoadingEllipsis />
    </p>
  );
};

export default OrderConfirming;
