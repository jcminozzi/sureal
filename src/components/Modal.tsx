import { useEffect, useRef, type ReactNode } from 'react';

/** Native modality provides focus containment, Escape, and focus restoration. */
export function Modal({ children, onClose, labelledBy, className = '' }: {
  children: ReactNode; onClose: () => void; labelledBy: string; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.querySelector<HTMLElement>('dialog[open] [data-autofocus]')?.focus();
    };
  }, []);
  return (
    <dialog ref={ref} className={`modal native-modal ${className}`} aria-labelledby={labelledBy}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      {children}
    </dialog>
  );
}
