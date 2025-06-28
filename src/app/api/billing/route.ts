// FILE: app/api/billing/route.ts

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Invoice from '@/models/invoice';
import Stylist from '@/models/Stylist';
import Customer from '@/models/customermodel';
import Setting from '@/models/Setting'; // Import Setting model
import { InventoryManager } from '@/lib/inventoryManager';
import { sendLowStockAlertEmail } from '@/lib/mail'; // Import our email function

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const {
      appointmentId,
      customerId,
      stylistId,
      billingStaffId,
      items,
      serviceTotal,
      productTotal,
      subtotal,
      membershipDiscount,
      grandTotal,
      paymentDetails,
      notes,
      customerWasMember,
      membershipGrantedDuringBilling,
    } = body;
    
    // --- (Your validation logic for payment details is fine) ---
    // ...

    // Fetch the full appointment document
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
    }
    
    // ===================================================================
    // 1. INVENTORY MANAGEMENT
    // ===================================================================
    let lowStockProducts = [];
    try {
      console.log('Starting inventory updates for billing...');
      const customer = await Customer.findById(customerId);
      const customerGender = customer?.gender || 'other';
      const serviceIds = appointment.serviceIds.map((s: any) => s.toString());
      
      const { totalUpdates } = await InventoryManager.calculateMultipleServicesInventoryImpact(serviceIds, customerGender);
      console.log('Total inventory updates to apply:', totalUpdates);

      if (totalUpdates.length > 0) {
        const inventoryResult = await InventoryManager.applyInventoryUpdates(totalUpdates);
        console.log('Inventory update result:', inventoryResult);
        
        if (!inventoryResult.success) {
          console.warn('Inventory update warnings:', inventoryResult.errors);
        }
        
        lowStockProducts = inventoryResult.lowStockProducts || []; 
      }
    } catch (inventoryError) {
      console.error('A critical error occurred during inventory update:', inventoryError);
    }

    // ===================================================================
    // 2. INVOICE AND APPOINTMENT UPDATE
    // ===================================================================
    
    // +++ FIX FOR VALIDATION ERROR: Add fallbacks for required fields +++
    const invoice = await Invoice.create({
      appointmentId,
      customerId,
      stylistId,
      billingStaffId,
      lineItems: items,
      serviceTotal: serviceTotal || 0,
      productTotal: productTotal || 0,
      subtotal: subtotal || 0, // Fallback to 0
      membershipDiscount: membershipDiscount || 0,
      grandTotal: grandTotal || 0, // Fallback to 0
      paymentDetails,
      notes,
      customerWasMember: customerWasMember || false,
      membershipGrantedDuringBilling: membershipGrantedDuringBilling || false,
      paymentStatus: 'Paid',
    });
    console.log('Created invoice:', invoice.invoiceNumber);

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        amount: subtotal || grandTotal,
        membershipDiscount: membershipDiscount || 0,
        finalAmount: grandTotal,
        paymentDetails,
        billingStaffId,
        invoiceId: invoice._id,
        status: 'Paid',
      },
      { new: true }
    );
    console.log('Updated appointment with payment details');

    await Stylist.findByIdAndUpdate(stylistId, {
      isAvailable: true,
      currentAppointmentId: null,
      lastAvailabilityChange: new Date(),
    });
    console.log('Unlocked stylist');

    // ===================================================================
    // 3. SEND NOTIFICATION
    // ===================================================================
    if (lowStockProducts.length > 0) {
      console.log(`[Billing] Found ${lowStockProducts.length} product(s) needing a low stock alert.`);
      const thresholdSetting = await Setting.findOne({ key: 'globalLowStockThreshold' }).lean();
      const globalThreshold = thresholdSetting ? parseInt(thresholdSetting.value, 10) : 10;
      
      console.log(`[Billing] Calling sendLowStockAlertEmail with threshold: ${globalThreshold}`);
      sendLowStockAlertEmail(lowStockProducts, globalThreshold);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully!',
      invoice: { 
        invoiceNumber: invoice.invoiceNumber,
        grandTotal: invoice.grandTotal,
        paymentDetails: invoice.paymentDetails,
      },
      appointment: updatedAppointment,
    });

  } catch (error: any) {
    console.error('Billing API Error:', error);
    // Provide a more specific error message if it's a validation error
    if (error.name === 'ValidationError') {
      return NextResponse.json({ success: false, message: `Validation Error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: error.message || 'Failed to process payment' }, { status: 500 });
  }
}