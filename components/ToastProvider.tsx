import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        success: {
          style: {
            background: '#10B981', // accent
            color: 'white',
          },
        },
        error: {
          style: {
            background: '#EF4444', // destructive
            color: 'white',
          },
        },
      }}
    />
  );
};

export default ToastProvider;