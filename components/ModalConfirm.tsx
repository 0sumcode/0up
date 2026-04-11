'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ModalConfirmProps {
  title?: string;
  cancelButton?: string;
  confirmButton?: string;
  danger?: boolean;
  allowEscape?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}

export function ModalConfirm({
  title = 'Confirm',
  cancelButton = 'Cancel',
  confirmButton = 'Confirm',
  danger = true,
  allowEscape = true,
  onClose,
  onConfirm,
  children,
}: ModalConfirmProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (allowEscape && e.key === 'Escape') {
        onClose();
      }
    }
    function onMouseDown(e: MouseEvent) {
      if (!allowEscape) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [allowEscape, onClose]);

  return (
    <div className="relative z-40" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-zinc-800 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            ref={panelRef}
            className="relative transform overflow-hidden rounded-lg bg-zinc-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              {allowEscape && (
                <button
                  onClick={onClose}
                  type="button"
                  className="rounded-md bg-zinc-900 text-zinc-400 hover:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="sm:flex sm:items-start">
              <div
                className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                  danger ? 'bg-red-500/20' : 'bg-blue-500/20'
                } sm:mx-0 sm:h-10 sm:w-10`}>
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-white">{title}</h3>
                <div className="mt-2">
                  <div className="text-sm text-zinc-500">{children}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                onClick={onConfirm}
                type="button"
                className={`inline-flex w-full justify-center rounded-md ${
                  danger ? 'bg-red-600/50 hover:bg-red-500/50' : 'bg-blue-600/50 hover:bg-blue-500/50'
                } px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto`}>
                {confirmButton}
              </button>
              <button
                onClick={onClose}
                type="button"
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-zinc-700 hover:bg-zinc-50/20 sm:mt-0 sm:w-auto">
                {cancelButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
