import React from 'react';
import { Button } from './ui/Button';
import { X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm m-4 relative">
        <h2 id="modal-title" className="text-lg font-bold text-primary mb-4">{title}</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
            <X size={24} />
        </button>
        <div className="text-sm text-neutral-dark mb-6 whitespace-pre-wrap">
            {children}
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;