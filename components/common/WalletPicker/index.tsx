// import { ModalOptions } from '@near-wallet-selector/modal-ui';
// import React from 'react';
// // import { useRecoilState, useRecoilValue } from 'recoil';
// import tw from 'twin.macro';
// import { TONIC_CONTRACT_ID } from '~/config';
// // import { useWalletPickerModal } from '~/state/wallet-picker';
// import Modal from '../Modal';

// const Wrapper = tw.div`
//   p-6 overflow-hidden flex flex-col items-stretch
//   w-screen h-[60vh]
//   sm:max-w-sm
// `;

// const Content: React.FC = () => {
//   // switch (page.route) {
//   //   case 'home': {
//   return <p>home</p>;
//   //   }
//   //   case 'wallet-connect': {
//   //     const { walletId } = page;
//   //     return <p>connect wallet {walletId}</p>;
//   //   }
//   //   case 'wallet-install': {
//   //     const { walletId } = page;
//   //     return <p>install wallet {walletId}</p>;
//   //   }
//   // }
// };

// // the official one just doesn't look very good... lmao
// const WalletPicker: React.FC<{
//   options: ModalOptions;
//   onClose: () => unknown;
// }> = ({ options, ...props }) => {
//   return (
//     <Wrapper {...props}>
//       <Content />
//     </Wrapper>
//   );
// };

// export const WalletPickerModal: React.FC = () => {
//   // const [visible, setVisible] = useWalletPickerModal();

//   return (
//     <Modal
//       visible={false}
//       onClose={() => false}
//       render={({ closeModal }) => {
//         return (
//           <WalletPicker
//             options={{
//               contractId: TONIC_CONTRACT_ID,
//             }}
//             onClose={closeModal}
//           />
//         );
//       }}
//     />
//   );
// };
