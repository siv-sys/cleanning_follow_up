import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';
import { Modal } from './Modal';
import styles from './Modal.module.scss';

interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Extract<ButtonVariant, 'primary' | 'danger'>;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = undefined;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        title={options?.title ?? ''}
        onClose={() => settle(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              {options?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button variant={options?.tone ?? 'primary'} onClick={() => settle(true)} autoFocus>
              {options?.confirmLabel ?? 'Confirm'}
            </Button>
          </>
        }
      >
        <div className={styles.confirmText}>{options?.message}</div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** `if (await confirm({ title, message })) { ... }` */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
