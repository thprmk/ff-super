// FILE: src/app/(main)/alerts/page.tsx

'use client';

import { useState, useEffect, FormEvent } from 'react';

// A simple X icon for the remove button
const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Component for showing toast notifications
const Toast = ({ message, show, isError }: { message: string, show: boolean, isError: boolean }) => {
  if (!show) return null;
  const bgColor = isError ? 'bg-red-600' : 'bg-green-600';
  return (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-md text-white ${bgColor} transition-opacity duration-300`}>
      {message}
    </div>
  );
};

export default function AlertsPage() {
  // --- STATE FOR ALL SETTINGS ---
  // Global UI State
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', show: false, isError: false });

  // State for Day-End Report
  const [dayEndRecipients, setDayEndRecipients] = useState<string[]>([]);
  const [newDayEndRecipient, setNewDayEndRecipient] = useState('');
  const [isDayEndSaving, setIsDayEndSaving] = useState(false);

  // State for Low Stock Alerts
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [lowStockRecipients, setLowStockRecipients] = useState<string[]>([]);
  const [newLowStockRecipient, setNewLowStockRecipient] = useState('');
  const [isLowStockSaving, setIsLowStockSaving] = useState(false);


  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchAllSettings = async () => {
      setIsLoading(true);
      try {
        // Fetch all three settings at the same time
        const [dayEndRes, thresholdRes, lowStockRecipientsRes] = await Promise.all([
          fetch('/api/settings/dayEndReportRecipients'),
          fetch('/api/settings/globalLowStockThreshold'),
          fetch('/api/settings/inventoryAlertRecipients')
        ]);

        const dayEndData = await dayEndRes.json();
        const thresholdData = await thresholdRes.json();
        const lowStockRecipientsData = await lowStockRecipientsRes.json();
        
        if (dayEndData.success) setDayEndRecipients(dayEndData.setting.value || []);
        if (thresholdData.success) setLowStockThreshold(thresholdData.setting.value || '10'); // Default to 10
        if (lowStockRecipientsData.success) setLowStockRecipients(lowStockRecipientsData.setting.value || []);

      } catch (error) {
        console.error("Error fetching settings:", error);
        showToast("Failed to load settings from server.", true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllSettings();
  }, []); // Empty dependency array means this runs only once on page load

  const showToast = (message: string, isError = false) => {
    setToast({ message, show: true, isError });
    setTimeout(() => setToast({ message: '', show: false, isError: false }), 3000);
  };


  // --- HANDLERS FOR DAY-END REPORT ---
  const handleAddDayEndEmail = () => {
    if (!/^\S+@\S+\.\S+$/.test(newDayEndRecipient)) { showToast("Please enter a valid email.", true); return; }
    if (dayEndRecipients.includes(newDayEndRecipient)) { showToast("This email is already added.", true); return; }
    if (dayEndRecipients.length >= 5) { showToast("You can add a maximum of 5 emails.", true); return; }
    setDayEndRecipients([...dayEndRecipients, newDayEndRecipient]);
    setNewDayEndRecipient('');
  };

  const handleRemoveDayEndEmail = (email: string) => setDayEndRecipients(dayEndRecipients.filter(e => e !== email));

  const handleSaveDayEndSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsDayEndSaving(true);
    try {
      const res = await fetch('/api/settings/dayEndReportRecipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: dayEndRecipients }),
      });
      const data = await res.json();
      data.success ? showToast("Day-End settings saved!") : showToast(data.message, true);
    } catch (error) {
      showToast("An error occurred while saving.", true);
    } finally {
      setIsDayEndSaving(false);
    }
  };


  // --- HANDLERS FOR LOW STOCK ALERT ---
  const handleAddLowStockEmail = () => {
    if (!/^\S+@\S+\.\S+$/.test(newLowStockRecipient)) { showToast("Please enter a valid email.", true); return; }
    if (lowStockRecipients.includes(newLowStockRecipient)) { showToast("This email is already added.", true); return; }
    if (lowStockRecipients.length >= 5) { showToast("You can add a maximum of 5 emails.", true); return; }
    setLowStockRecipients([...lowStockRecipients, newLowStockRecipient]);
    setNewLowStockRecipient('');
  };

  const handleRemoveLowStockEmail = (email: string) => setLowStockRecipients(lowStockRecipients.filter(e => e !== email));

  const handleSaveLowStockSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsLowStockSaving(true);
    try {
      // Save both settings at the same time
      const [thresholdRes, recipientsRes] = await Promise.all([
        fetch('/api/settings/globalLowStockThreshold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: lowStockThreshold }),
        }),
        fetch('/api/settings/inventoryAlertRecipients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: lowStockRecipients }),
        })
      ]);

      (thresholdRes.ok && recipientsRes.ok)
        ? showToast("Low stock settings saved successfully!")
        : showToast("Failed to save one or more low stock settings.", true);
    } catch (error) {
      showToast("An error occurred while saving.", true);
    } finally {
      setIsLowStockSaving(false);
    }
  };


  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Loading Alert Settings...</div>;
  }
  
  return (
    <>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold text-gray-800">Alert Management</h1>

          {/* --- Card 1: Day-End Summary Section --- */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSaveDayEndSettings}>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Day-End Summary Report</h2>
              <p className="text-sm text-gray-500 mb-4">Add up to 5 email addresses to receive the daily closing report.</p>
              <div className="flex items-center gap-2 mb-4">
                <input type="email" value={newDayEndRecipient} onChange={(e) => setNewDayEndRecipient(e.target.value)} placeholder="e.g., manager@example.com" className="flex-grow rounded-md border-gray-300 shadow-sm" />
                <button type="button" onClick={handleAddDayEndEmail} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">Add</button>
              </div>
              <div className="space-y-2 mb-6 min-h-[40px]">
                {dayEndRecipients.map((email) => (
                  <div key={email} className="flex items-center justify-between bg-gray-100 p-2 rounded-md"><span className="text-sm text-gray-800">{email}</span><button type="button" onClick={() => handleRemoveDayEndEmail(email)} className="p-1 text-gray-500 hover:text-red-600"><XIcon /></button></div>
                ))}
              </div>
              <div className="flex justify-end"><button type="submit" disabled={isDayEndSaving} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm disabled:bg-gray-400">{isDayEndSaving ? 'Saving...' : 'Save Changes'}</button></div>
            </form>
          </div>

          {/* --- Card 2: Low Stock Alert Section --- */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSaveLowStockSettings}>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Low Stock Alerts</h2>
              <p className="text-sm text-gray-500 mb-6">Configure the global threshold and email recipients for low inventory notifications.</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-1">Global Low Stock Threshold</label>
                <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} placeholder="e.g., 10" className="flex-grow rounded-md border-gray-300 shadow-sm w-full" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Alert Recipients</label>
                <div className="flex items-center gap-2 mb-4">
                  <input type="email" value={newLowStockRecipient} onChange={(e) => setNewLowStockRecipient(e.target.value)} placeholder="e.g., manager@example.com" className="flex-grow rounded-md border-gray-300 shadow-sm" />
                  <button type="button" onClick={handleAddLowStockEmail} className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">Add</button>
                </div>
                <div className="space-y-2 mb-6 min-h-[40px]">
                  {lowStockRecipients.map((email) => (
                    <div key={email} className="flex items-center justify-between bg-gray-100 p-2 rounded-md"><span className="text-sm text-gray-800">{email}</span><button type="button" onClick={() => handleRemoveLowStockEmail(email)} className="p-1 text-gray-500 hover:text-red-600"><XIcon /></button></div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t pt-4"><button type="submit" disabled={isLowStockSaving} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm disabled:bg-gray-400">{isLowStockSaving ? 'Saving...' : 'Save Changes'}</button></div>
            </form>
          </div>
        </div>
      </div>
      <Toast message={toast.message} show={toast.show} isError={toast.isError} />
    </>
  );
}