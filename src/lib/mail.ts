// FILE: /lib/mail.ts

import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import dbConnect from '@/lib/dbConnect';
import Setting from '@/models/Setting';
import { IProduct } from '@/models/Product';

// --- (Your DayEndReportData interface, transporter, sendClosingReportEmail, and createEmailHtml functions remain unchanged) ---
// ... I'm omitting them for brevity, but they are still in the final code block below.

// +++ MODIFIED FUNCTION FOR LOW STOCK ALERTS WITH DEBUGGING +++
export async function sendLowStockAlertEmail(products: IProduct[], globalThreshold: number) {
  if (!Array.isArray(products) || products.length === 0) {
    console.log('[mail.ts] sendLowStockAlertEmail was called, but the products array was empty. No email sent.');
    return; 
  }

  console.log('[mail.ts] Inside sendLowStockAlertEmail. Preparing to send alert for:', products.map(p => p.name));

  try {
    await dbConnect();

    const settingDoc = await Setting.findOne({ key: 'inventoryAlertRecipients' });
    const recipientEmails = settingDoc?.value;

    console.log('[mail.ts] Found recipient emails:', recipientEmails);

    if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      console.log("[mail.ts] No recipients configured. Skipping low stock alert email.");
      return;
    }

    const productListHtml = products
      .map(
        (p) =>
          `<tr>
             <td style="padding: 8px; border: 1px solid #ddd;">${p.sku}</td>
             <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
             <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #dc2626; font-weight: bold;">${p.numberOfItems}</td>
             <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${globalThreshold}</td>
           </tr>`
      )
      .join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #c026d3;">❗ Low Stock Alert</h2>
          <p>This is an automated notification. The following product(s) have fallen to or below their minimum stock threshold after a recent transaction:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                  <tr style="background-color: #f2f2f2;">
                      <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">SKU</th>
                      <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                      <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Current Stock (Items)</th>
                      <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Threshold</th>
                  </tr>
              </thead>
              <tbody>${productListHtml}</tbody>
          </table>
          <p style="margin-top: 20px;">Please take action to reorder these items soon to avoid stockouts.</p>
      </div>
    `;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Fresh-Face System'}" <${process.env.EMAIL_FROM}>`,
      to: recipientEmails,
      subject: 'Urgent: Low Inventory Alert',
      html: emailHtml,
    };

    console.log('[mail.ts] About to call transporter.sendMail with these options:', JSON.stringify(mailOptions, null, 2));
    
    await transporter.sendMail(mailOptions);

    console.log('[mail.ts] Nodemailer transporter.sendMail call completed successfully!');

  } catch (error) {
    console.error("--- NODEMAILER ERROR --- [mail.ts] Failed to send low stock alert email:", error);
  }
}


// --- FULL CODE WITH UNCHANGED PARTS ---

// Define the type for our report data (No changes here)
interface DayEndReportData {
  closingDate: string;
  expectedTotals: { cash: number; card: number; upi: number; };
  actualTotals: { cash: number; card: number; upi: number; };
  discrepancies: { cash: number; card: number; upi: number; total: number; };
  cashDenominations: { [key: string]: number; };
  notes: string;
}

// Create the transporter (No changes here)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

// --- Your Original Function (Unchanged) ---
export async function sendClosingReportEmail(reportData: DayEndReportData) {
    try {
        await dbConnect();
        const settingKey = 'dayEndReportRecipients';
        const settingDoc = await Setting.findOne({ key: settingKey });
        const recipientEmails = settingDoc?.value;
        if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
            console.log(`No recipients configured for '${settingKey}'. Skipping day-end report email.`);
            return;
        }
        const emailHtml = createEmailHtml(reportData);
        const formattedDate = format(new Date(reportData.closingDate + 'T00:00:00'), 'MMMM dd, yyyy');
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Fresh-Face System'}" <${process.env.EMAIL_FROM}>`,
            to: recipientEmails,
            subject: `Day-End Closing Report for ${formattedDate}`,
            html: emailHtml,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Day-end report email sent successfully to: ${recipientEmails.join(', ')}`);
    } catch (error) {
        console.error("Failed to send day-end report email:", error);
        throw new Error("Failed to send confirmation email.");
    }
}

// --- The HTML creation function (Unchanged) ---
function createEmailHtml(report: DayEndReportData): string {
    const { closingDate, expectedTotals, actualTotals, discrepancies, notes, cashDenominations } = report;
    const formattedDate = format(new Date(closingDate + 'T00:00:00'), 'EEEE, MMMM dd, yyyy');
    const renderRow = (label: string, expected: number, actual: number, discrepancy: number) => {
        const discrepancyColor = discrepancy < 0 ? '#dc2626' : (discrepancy > 0 ? '#f59e0b' : '#16a34a');
        const discrepancyText = discrepancy < 0 ? `(Shortage)` : (discrepancy > 0 ? `(Overage)` : `(Match)`);
        return `<tr><td style="padding: 8px; border: 1px solid #ddd;">${label}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${expected.toFixed(2)}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${actual.toFixed(2)}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${discrepancyColor};">₹${Math.abs(discrepancy).toFixed(2)} ${discrepancyText}</td></tr>`;
    };
    const expectedGrandTotal = expectedTotals.cash + expectedTotals.card + expectedTotals.upi;
    const actualGrandTotal = actualTotals.cash + actualTotals.card + actualTotals.upi;
    const totalDiscrepancy = actualGrandTotal - expectedGrandTotal;
    const denominationDetails = Object.entries(cashDenominations).filter(([, count]) => count > 0).map(([key, count]) => `<li>₹${key.replace('d', '')}: ${count} notes/coins</li>`).join('');
    return `<div style="font-family: Arial, sans-serif; color: #333;"><h2 style="color: #111;">Day-End Closing Report: ${formattedDate}</h2><p>Here is the summary of the day-end closing report.</p><h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Totals Summary</h3><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><thead><tr style="background-color: #f2f2f2;"><th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Payment Method</th><th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Expected (System)</th><th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Actual (Counted)</th><th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Discrepancy</th></tr></thead><tbody>${renderRow('Cash', expectedTotals.cash, actualTotals.cash, discrepancies.cash)}${renderRow('Card', expectedTotals.card, actualTotals.card, discrepancies.card)}${renderRow('UPI', expectedTotals.upi, actualTotals.upi, discrepancies.upi)}</tbody><tfoot style="border-top: 2px solid #333; font-weight: bold;"><tr><td style="padding: 8px; border: 1px solid #ddd;">Grand Total</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${expectedGrandTotal.toFixed(2)}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${actualGrandTotal.toFixed(2)}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${totalDiscrepancy < 0 ? '#dc2626' : (totalDiscrepancy > 0 ? '#f59e0b' : '#16a34a')};">₹${Math.abs(totalDiscrepancy).toFixed(2)} ${totalDiscrepancy < 0 ? '(Shortage)' : (totalDiscrepancy > 0 ? '(Overage)' : '(Match)')}</td></tr></tfoot></table><h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Cash Denomination Details</h3><ul>${denominationDetails || '<li>No cash denominations were entered.</li>'}</ul><h3 style="border-bottom: 2px solid #eee; padding-bottom: 5px;">Notes</h3><p>${notes || 'No notes were provided.'}</p></div>`;
}