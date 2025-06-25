// FILE: /app/crm/components/CrmCustomerDetailPanel.tsx
'use client';

import React from 'react';
import { CrmCustomer } from '../types';
import { XMarkIcon, SparklesIcon, TagIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface CrmCustomerDetailPanelProps {
  customer: CrmCustomer | null;
  isOpen: boolean;
  isUpdating: boolean; 
  onClose: () => void;
  onGrantMembership: (customerId: string) => void;
}

const CrmCustomerDetailPanel: React.FC<CrmCustomerDetailPanelProps> = ({
  customer,
  isOpen,
  isUpdating,
  onClose,
  onGrantMembership,
}) => {

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const panelClasses = `fixed top-0 right-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out z-40 w-full md:w-[400px] lg:w-[450px] ${
    isOpen ? 'translate-x-0' : 'translate-x-full'
  }`;

  const renderLoadingState = () => (
    <div className="p-6 h-full flex flex-col items-center justify-center text-center text-gray-500">
      <div className="animate-spin h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full mb-4"></div>
      <p>Loading customer details...</p>
    </div>
  );

  const renderCustomerDetails = () => (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="p-6 pb-4 border-b flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">{customer!.name}</h3>
            <div className="mt-2 flex items-center gap-2">
                {customer!.currentMembership ? (
                    <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 items-center gap-1">
                        <SparklesIcon className="w-3.5 h-3.5" /> Member
                    </span>
                ) : (
                    <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-gray-200 text-gray-700">Not a Member</span>
                )}
                {customer!.status && (
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${customer!.status === 'Active' ? 'bg-green-100 text-green-800' : customer!.status === 'Inactive' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {customer!.status}
                    </span>
                )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full ml-4 flex-shrink-0"><XMarkIcon className="w-6 h-6" /></button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {/* Contact Info and Details */}
        <div className="space-y-3 text-sm">
            <p className="text-gray-800"><strong>Phone:</strong> <a href={`tel:${customer!.phoneNumber}`} className="text-indigo-600 hover:text-indigo-800">{customer!.phoneNumber}</a></p>
            <p className="text-gray-800"><strong>Email:</strong> <a href={`mailto:${customer!.email}`} className="text-indigo-600 hover:text-indigo-800 break-all">{customer!.email}</a></p>
            <p className="text-gray-800 capitalize"><strong>Gender:</strong> <span className="text-gray-600">{customer!.gender}</span></p>
            <p className="text-gray-800"><strong>Joined:</strong> <span className="text-gray-600">{formatDate(customer!.createdAt)}</span></p>
            <div className="flex items-center gap-2 text-gray-800"><strong>Loyalty Points:</strong> <span className="font-bold text-lg text-indigo-600">{customer!.loyaltyPoints ?? 0}</span></div>
        </div>

        {/* Membership Section */}
        <div className="pt-4 border-t">
            {customer!.currentMembership ? (
                <div>
                    <h4 className="text-base font-semibold text-gray-800 mb-2">Membership Details</h4>
                    {customer!.membershipBarcode && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                           <QrCodeIcon className="w-5 h-5 text-blue-600"/>
                           <span className="font-mono text-blue-700">{customer!.membershipBarcode}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <button
                    onClick={() => onGrantMembership(customer!.id)}
                    disabled={isUpdating || !customer}
                    className="w-full text-center py-2.5 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                    {isUpdating ? 'Adding...' : '+ Grant Membership'}
                    </button>
                </div>
            )}
        </div>

        {/* Appointment History */}
        <div>
          <h4 className="text-base font-semibold text-gray-800 mb-3 border-t pt-4">Appointment History</h4>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {(!customer!.appointmentHistory || customer!.appointmentHistory.length === 0) ? (
              <p className="text-gray-500 text-sm py-4 text-center italic">No paid appointments found.</p>
            ) : (
              customer!.appointmentHistory.map(apt => (
                <div key={apt._id} className="p-3 bg-gray-100/70 rounded-lg text-sm">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold">{formatDate(apt.date)}</p>
                    <p className="font-bold text-gray-800">₹{(apt.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-gray-600">with {apt.stylistName}</p>
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t text-xs text-gray-500">
                    <TagIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{Array.isArray(apt.services) ? apt.services.join(', ') : 'Details unavailable'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <aside className={panelClasses} aria-hidden={!isOpen}>
      <button onClick={onClose} className="absolute top-6 right-6 p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
        <XMarkIcon className="w-6 h-6" />
      </button>
      {customer ? renderCustomerDetails() : renderLoadingState()}
    </aside>
  );
};

export default CrmCustomerDetailPanel;