import tw, { styled } from 'twin.macro';
import toast, {
  DefaultToastOptions,
  Renderable,
  resolveValue,
  Toast,
  ValueOrFunction,
} from 'react-hot-toast';
import CloseButton from '~/components/common/CloseButton';
import { ClickHandler } from '~/types/event-handlers';
import { useEntering } from '~/hooks/useEntering';
import Card from './Card';

type Variant = 'success' | 'error';

export const ToastWrapper = styled(Card)<{ variant?: Variant }>(
  ({ variant }) => [
    tw`
  relative p-6 rounded-sm min-w-[90vw] max-w-[90vw] text-center
  md:(min-w-[300px] max-w-[480px] text-left)
  transition duration-150
  shadow-md
  dark:(text-white)
  light:(text-black)
`,
    variant === 'success' && tw`light:bg-up dark:bg-up-dark`,
  ]
);

const ToastContainer: React.FC<{
  t: Toast;
  variant?: Variant;
  hideClose?: boolean;
}> = ({ t, variant, children, hideClose }) => {
  const handleClose: ClickHandler = (e) => {
    e.preventDefault();
    toast.dismiss(t.id);
  };

  const entering = useEntering();
  const enteringStyle =
    variant === 'error'
      ? tw`opacity-0 light:bg-down dark:bg-down-dark`
      : variant === 'success'
      ? tw`opacity-0`
      : tw`opacity-0 light:bg-up dark:bg-up-dark`;

  return (
    <ToastWrapper
      className="group"
      css={[
        t.visible
          ? tw`opacity-100 scale-100 translate-y-0`
          : tw`opacity-0 scale-[99%] -translate-y-6`,
        entering && enteringStyle,
      ]}
    >
      {!hideClose && (
        <CloseButton
          tw="invisible group-hover:(visible) absolute top-3 right-3"
          onClick={handleClose}
        />
      )}
      {children}
    </ToastWrapper>
  );
};

export function wrappedToast(
  children: React.ReactNode,
  opts: {
    variant?: Variant;
    hideClose?: boolean;
  } = {}
): (t: Toast) => React.ReactElement {
  return (t: Toast) => {
    return (
      <ToastContainer t={t} {...opts}>
        {children}
      </ToastContainer>
    );
  };
}

/**
 * Same as toast.promise but
 * 1. it uses the toast wrapper
 * 2. it ensures the loading toast doesn't close until the promise resolves/rejects
 */
export function withToastPromise<T>(
  promise: Promise<T>,
  msgs: {
    loading: Renderable;
    success: ValueOrFunction<Renderable, T>;
    error: ValueOrFunction<Renderable, any>;
  },
  opts?: DefaultToastOptions
) {
  const loadingId = toast.custom(
    wrappedToast(msgs.loading, { hideClose: true }),
    {
      ...opts,
      duration: Infinity,
    }
  );

  promise
    .then((p) => {
      toast.dismiss(loadingId);
      toast.custom(
        wrappedToast(resolveValue(msgs.success, p), { variant: 'success' }),
        {
          ...opts,
        }
      );
      return p;
    })
    .catch((e) => {
      toast.dismiss(loadingId);
      toast.custom(
        wrappedToast(resolveValue(msgs.error, e), { variant: 'error' }),
        {
          ...opts,
        }
      );
    });

  return promise;
}
