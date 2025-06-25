// FILE: /app/crm/components/CustomerTable.tsx

import React from 'react';
import { CrmCustomer, PaginationInfo } from '../types';
import { PencilSquareIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, GiftIcon } from '@heroicons/react/24/outline';

interface CustomerTableProps {
  customers: CrmCustomer[];
  pagination: PaginationInfo;
  onViewDetails: (customer: CrmCustomer) => void;
  onEdit?: (customer: CrmCustomer) => void;
  onDelete?: (customerId: string, customerName: string) => void;
  onGoToPage: (page: number) => void;
}

const getStatusClasses = (status?: string) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800';
    case 'Inactive': return 'bg-red-100 text-red-800';
    case 'New': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  pagination,
  onViewDetails,
  onEdit,
  onDelete,
  onGoToPage,
}) => {
  const { currentPage, totalPages, totalCustomers } = pagination;
  const itemsPerPage = 10; // Assuming fixed size from hook

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left table-auto">
          {/* Table Head */}
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th scope='col' className="px-6 py-3 w-[30%]">Customer</th>
              <th scope="col" className="px-6 py-3 w-[15%]">Status</th>
              <th scope="col" className="px-6 py-3 w-[15%]">Loyalty Points</th>
              <th scope="col" className="px-6 py-3 w-[15%]">Membership</th>
              <th scope="col" className="px-6 py-3 w-[25%] text-right">Actions</th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => onViewDetails(customer)}>
                <td className="px-6 py-4 font-medium">
                  <div>{customer.name}</div>
                  <div className="text-xs font-normal text-gray-500">{customer.phoneNumber}</div>
                </td>
                <td className="px-6 py-4">
                {customer.isActive?"Active":"Inactive"}
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                        <GiftIcon className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">{customer.loyaltyPoints ?? 0}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    {customer.isMember ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                           <SparklesIcon className="w-3 h-3"/> Yes
                        </span>
                    ) : (
                        <span className="text-gray-500 text-xs">No</span>
                    )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                    {onEdit && (
                      <button onClick={() => onEdit(customer)} className="font-medium text-indigo-600 hover:text-indigo-900 flex items-center gap-1">
                        <PencilSquareIcon className="w-4 h-4" />Edit
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(customer.id, customer.name)} className="font-medium text-red-600 hover:text-red-900 flex items-center gap-1">
                        <TrashIcon className="w-4 h-4" />Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing{' '}
            <b>{(currentPage - 1) * itemsPerPage + 1}</b>-<b>{Math.min(currentPage * itemsPerPage, totalCustomers)}</b> of <b>{totalCustomers}</b>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => onGoToPage(currentPage - 1)} disabled={currentPage <= 1} className="p-2 disabled:opacity-50">
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => onGoToPage(currentPage + 1)} disabled={currentPage >= totalPages} className="p-2 disabled:opacity-50">
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};