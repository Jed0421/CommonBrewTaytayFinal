import React from 'react';
import { User, Customer } from '../types';
import { AccessPortalModal } from './AccessPortalModal';

interface Props {
  onLoginSuccess: (user: User, token?: string) => void;
  onCustomerLoginSuccess?: (customer: Customer, token?: string) => void;
  onBackToStorefront?: () => void;
}

export const LoginView: React.FC<Props> = ({
  onLoginSuccess,
  onCustomerLoginSuccess,
  onBackToStorefront,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f6f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <AccessPortalModal
        isOpen={true}
        onClose={() => {
          if (onBackToStorefront) onBackToStorefront();
        }}
        onCustomerLoginSuccess={(c, token) => {
          if (onCustomerLoginSuccess) {
            onCustomerLoginSuccess(c, token);
          }
        }}
        onStaffLoginSuccess={(u, token) => onLoginSuccess(u, token)}
        initialView="login"
      />
    </div>
  );
};
