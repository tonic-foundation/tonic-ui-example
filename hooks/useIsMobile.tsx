import { useEffect, useState } from 'react';

export function useIsMobile({ width = 768 } = {}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= width);

  useEffect(() => {
    function handleResize() {
      if (global.window.innerWidth <= width) {
        if (!isMobile) {
          setIsMobile(true);
        }
      } else if (isMobile) {
        setIsMobile(false);
      }
    }

    global.window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      global.window.removeEventListener('resize', handleResize);
    };
  });

  return isMobile;
}
