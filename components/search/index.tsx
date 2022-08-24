// miscellaneous search-related components
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import tw, { styled } from 'twin.macro';
import { InputChangeHandler } from '~/types/event-handlers';
import CloseButton from '../common/CloseButton';
import Input from '../common/Input';

export const searchStyles = {
  result: tw`
    flex items-center gap-x-3 p-2
    dark:hover:text-up-dark
    light:hover:underline transition
  `,
};

export const ResultLink = styled(Link)(searchStyles.result);

export const SearchHeader: React.FC<{
  onChange: InputChangeHandler;
  onClose?: () => unknown;
  label: string;
  placeholder: string;
}> = (props) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  return (
    <header tw="sticky top-0">
      <section tw="flex items-center justify-between">
        <h1>{props.label}</h1>
        {!!props.onClose && <CloseButton onClick={props.onClose} />}
      </section>
      <Input
        ref={searchInputRef}
        tw="text-base mt-6"
        placeholder={props.placeholder}
        onChange={props.onChange}
      />
    </header>
  );
};
