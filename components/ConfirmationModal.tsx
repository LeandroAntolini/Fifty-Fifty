import React from 'react';
import { Button } from './ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
        <h2 id="modal-title" className="text-lg font-bold text-primary mb-2">{title}</h2>
        <p className="text-sm text-neutral-dark mb-6">{message}</p>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button type="button" variant={isDestructive ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;