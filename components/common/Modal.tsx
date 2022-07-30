import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useKey } from 'react-use';
import tw, { css, styled } from 'twin.macro';
import { ClickHandler } from '~/types/event-handlers';
import { sleep } from '~/util';
import Card from './Card';

export interface ModalProps {
  visible?: boolean;
  onClose?: () => unknown;
  /**
   * ID of DOM element to render inside of. Defaults to 'root'.
   */
  wrapperId?: string;
  /**
   * Render as a drawer on mobile. Defaults to `false`.
   */
  drawerOnMobile?: boolean;
  /**
   * Whether clicking the background/pressing ESC should close this modal.
   * Defaults to true.
   */
  shouldHandleClose?: boolean;
  render?: (props: { closeModal: () => unknown }) => React.ReactNode;
  disableTransitions?: boolean;
}

export type ModalComponent<T> = React.FC<ModalProps & T>;

export const ModalHeader = tw.header`text-lg px-6 pt-6 flex items-center justify-between`;
export const ModalBody = tw.div`p-6 flex flex-col overflow-auto`;
const Container = styled.div<{ visible: boolean }>(({ visible }) => [
  tw`
    fixed z-40 inset-0 overflow-hidden
    flex items-center justify-center
    transition-opacity duration-300
  `,
  visible ? tw`opacity-100` : tw`opacity-0`,
]);
const Background = tw.div`absolute inset-0 bg-neutral-400 bg-opacity-40 light:(bg-black bg-opacity-50)`;

/**
 * Style to use when content not visible, nameley
 *
 * - if normal modal, opacity -> 0 and scale down slightly
 * - if bottom drawer, opacity -> 0 and slide down
 */
const contentInvisibleStyles = (drawerOnMobile: boolean) => {
  if (!drawerOnMobile) {
    return css`
      transform: scale(99%);
    `;
  }
  return css`
    @media (max-width: 768px) {
      transform: translateY(50%);
    }
    @media (min-width: 769px) {
      transform: scale(99%);
    }
  `;
};

const ContentWrapper = styled(Card)<{
  visible: boolean;
  drawerOnMobile: boolean;
}>(({ visible, drawerOnMobile }) => [
  tw`
    relative mx-auto
    w-full md:w-auto
    transition-transform duration-300
  `,
  // mobile drawer needs big radius to look good.
  // modal can retain card's default radius.
  drawerOnMobile
    ? tw`rounded-2xl rounded-b-none md:rounded-md`
    : tw`mx-6 md:mx-auto`,
  drawerOnMobile &&
    css`
      @media (max-width: 768px) {
        position: fixed;
        bottom: 0;
        padding-bottom: env(safe-area-inset-bottom);
      }
    `,
  visible
    ? tw`md:shadow-2xl translate-y-0 scale-100`
    : contentInvisibleStyles(drawerOnMobile),
]);

const Modal: React.FC<ModalProps> = ({
  visible,
  children,
  render,
  onClose = () => null,
  shouldHandleClose = true,
  disableTransitions = false,
  drawerOnMobile = false,
  wrapperId = 'root',
  ...props
}) => {
  // The `visible` prop controls whether to render the modal.
  // These inner states control transitions and react to the visible prop.
  const [modalVisible, setModalVisible] = useState(visible);
  const [contentVisible, setContentVisible] = useState(visible);

  const handleClose = useCallback(async () => {
    setContentVisible(false);
    setModalVisible(false);
    // wait for transition
    sleep(300).then(onClose);
  }, [onClose]);

  useEffect(() => {
    if (disableTransitions) {
      setModalVisible(visible);
      setContentVisible(visible);
      return;
    }
    if (visible) {
      setModalVisible(true);
      // wait for a new "tick" (doesn't really matter how long this sleep is)
      sleep(25).then(() => setContentVisible(true));
    } else {
      handleClose();
    }
  }, [visible]);

  const handleClickBackground: ClickHandler = useCallback(
    (e) => {
      e.preventDefault();
      if (shouldHandleClose) {
        handleClose();
      }
    },
    [shouldHandleClose, handleClose]
  );

  useKey(
    'Escape',
    (e) => {
      if (shouldHandleClose) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          e.preventDefault();
          handleClose();
        }
      }
    },
    { event: 'keydown' },
    [handleClose, shouldHandleClose]
  );

  if (!visible) {
    return <React.Fragment />;
  }
  return createPortal(
    <Container
      role="dialog"
      aria-modal="true"
      visible={!!modalVisible}
      {...props}
    >
      <Background aria-hidden="true" onClick={handleClickBackground} />
      <ContentWrapper
        drawerOnMobile={drawerOnMobile}
        visible={!!contentVisible}
      >
        {render ? render({ closeModal: handleClose }) : children}
      </ContentWrapper>
    </Container>,
    document.getElementById(wrapperId)!
  );
};

export default Modal;
