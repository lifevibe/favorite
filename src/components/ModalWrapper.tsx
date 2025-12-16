import React from 'react';

interface ModalWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  children,
  fallback = <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  </div>
}) => {
  return <>{children}</>;
};

export default ModalWrapper;