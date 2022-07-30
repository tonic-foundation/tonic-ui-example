import tw from 'twin.macro';
import useTheme from '~/hooks/useTheme';
import { IoIosSunny, IoIosMoon } from 'react-icons/io';
import { useState } from 'react';
import { sleep } from '~/util';

const ThemeToggle: React.FC = (props) => {
  const { theme, setTheme } = useTheme();
  const [animating, setAnimating] = useState<'forward' | 'reverse'>();

  return (
    <button
      onClick={async () => {
        if (theme === 'light') {
          setAnimating('reverse');
          setTheme('dark');
        } else {
          setAnimating('forward');
          setTheme('light');
        }
        await sleep(500);
        setAnimating(undefined);
      }}
      {...props}
    >
      <span
        tw="block text-xl"
        css={
          animating === 'forward'
            ? tw`rotate-[360deg] ease-in-out transition-transform duration-500`
            : animating === 'reverse'
            ? tw`rotate-[-360deg] ease-linear transition-transform duration-500`
            : undefined
        }
      >
        {theme === 'light' ? <IoIosSunny /> : <IoIosMoon />}
      </span>
    </button>
  );
};

export default ThemeToggle;
