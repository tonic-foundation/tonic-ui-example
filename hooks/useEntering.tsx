import { useEffect, useState } from 'react';

export function useEntering() {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    new Promise((resolve) => setTimeout(resolve, 50)).then(() =>
      setEntering(false)
    );
  }, []);

  return entering;
}
