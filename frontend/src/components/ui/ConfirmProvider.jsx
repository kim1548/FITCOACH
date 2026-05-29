import React, { createContext, useCallback, useContext, useState } from 'react';
import Modal from './Modal';

/**
 * useConfirm — window.confirm 대체. Promise<boolean> 반환.
 *
 * 사용 예:
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: '이 글을 삭제할까요?',
 *     description: '삭제 후 되돌릴 수 없습니다.',
 *     confirmLabel: 'Delete',
 *     destructive: true,
 *   });
 *   if (!ok) return;
 *
 * App.jsx 에서 <ConfirmProvider> 로 트리를 감싸야 동작한다.
 */

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const close = (result) => {
    state?.resolve?.(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        title={state?.title || ''}
        description={state?.description}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        destructive={state?.destructive}
        tone={state?.tone}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>');
  }
  return ctx;
};
