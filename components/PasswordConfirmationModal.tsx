import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';

interface PasswordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const PasswordConfirmationModal: React.FC<PasswordConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm m-4">
        <h2 id="modal-title" className="text-lg font-bold text-primary mb-2">{title}</h2>
        <p className="text-sm text-neutral-dark mb-4">{message}</p>
        
        <div className="space-y-1.5 mb-6">
            <Label htmlFor="password-confirm">Sua Senha</Label>
            <Input 
                id="password-confirm" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                disabled={isLoading}
            />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button type="button" variant='destructive' onClick={handleConfirm} disabled={isLoading || !password}>
            {isLoading ? 'Confirmando...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PasswordConfirmationModal;