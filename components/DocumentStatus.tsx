import React from 'react';
import { getDocumentStatus } from '../utils/vehicleDocuments';

interface DocumentStatusProps {
  expiryDate: string;
  documentType: string;
}

export const DocumentStatus: React.FC<DocumentStatusProps> = ({ expiryDate, documentType }) => {
  const status = getDocumentStatus(expiryDate);
  
  const getStatusIcon = () => {
    switch (status) {
      case 'expired':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'expiring':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-200">{documentType}</div>
        <div className="text-xs text-gray-400">
          {expiryDate ? new Date(expiryDate).toLocaleDateString() : 'N/A'}
        </div>
      </div>
    </div>
  );
}; 