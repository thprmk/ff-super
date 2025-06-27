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
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmailInput, setCurrentEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', show: false, isError: false });

  const settingKey = 'dayEndReportRecipients'; // Using a plural key now

  // --- 1. Fetch existing emails from the API ---
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/settings/${settingKey}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.setting.value)) {
          setEmails(data.setting.value);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [settingKey]);

  const showToast = (message: string, isError = false) => {
    setToast({ message, show: true, isError });
    setTimeout(() => setToast({ message: '', show: false, isError: false }), 3000);
  };

  // --- 2. Logic to add a new email to the list ---
  const handleAddEmail = () => {
    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(currentEmailInput)) {
      showToast("Please enter a valid email address.", true);
      return;
    }
    // Check for duplicates
    if (emails.includes(currentEmailInput)) {
      showToast("This email has already been added.", true);
      setCurrentEmailInput('');
      return;
    }
    // Check for limit
    if (emails.length >= 5) {
      showToast("You can add a maximum of 5 emails.", true);
      return;
    }
    setEmails([...emails, currentEmailInput]);
    setCurrentEmailInput(''); // Clear the input field
  };

  // --- 3. Logic to remove an email from the list ---
  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  // --- 4. Logic to save the list of emails to the database ---
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(`/api/settings/${settingKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: emails }),
      });
      const data = await response.json();
      if (data.success) {
        showToast("Settings saved successfully!");
      } else {
        showToast(data.message || "Failed to save settings.", true);
      }
    } catch (error) {
      showToast("An error occurred while saving.", true);
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-gray-500">Loading Alert Settings...</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Alert Management</h1>

          {/* --- Day-End Summary Section --- */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Day-End Summary Report</h2>
            <p className="text-sm text-gray-500 mb-4">
              Add up to 5 email addresses to receive the daily closing report.
            </p>

            <form onSubmit={handleSaveSettings}>
              {/* --- Email Input Group --- */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="email"
                  value={currentEmailInput}
                  onChange={(e) => setCurrentEmailInput(e.target.value)}
                  placeholder="e.g., manager@example.com"
                  className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={emails.length >= 5}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {/* --- List of Added Emails --- */}
              <div className="space-y-2 mb-6">
                {emails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                  >
                    <span className="text-sm text-gray-800">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-200"
                      aria-label={`Remove ${email}`}
                    >
                      <XIcon />
                    </button>
                  </div>
                ))}
                {emails.length === 0 && (
                   <p className="text-center text-sm text-gray-400 py-3">No recipient emails added yet.</p>
                )}
              </div>

              {/* --- Save Button --- */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* --- You can add the Low Stock Alert section here later --- */}
          {/* 
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Low Stock Alerts</h2>
            <p className="text-sm text-gray-500 mb-4">
              Configure low stock notification settings. (Coming soon)
            </p>
          </div>
          */}

        </div>
      </div>
      <Toast message={toast.message} show={toast.show} isError={toast.isError} />
    </>
  );
}