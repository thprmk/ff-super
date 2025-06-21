// app/api/billing/route.ts (Updated to include inventory management)
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Invoice from '@/models/invoice';
import Stylist from '@/models/Stylist';
import Customer from '@/models/customermodel';
import { InventoryManager } from '@/lib/inventoryManager';

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

    console.log('Processing billing for appointment:', appointmentId);

    // Validate paymentDetails
    if (!paymentDetails || typeof paymentDetails !== 'object' || Object.keys(paymentDetails).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing payment details' },
        { status: 400 }
      );
    }

    // Validate payment amounts
    const totalPaid = Object.values(paymentDetails).reduce((sum: number, amount: number) => sum + (amount || 0), 0);
    if (Math.abs(totalPaid - grandTotal) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          message: `Payment amount mismatch. Total: ₹${grandTotal}, Paid: ₹${totalPaid}`,
        },
        { status: 400 }
      );
    }

    // Get appointment and customer details for inventory calculation
    const appointment = await Appointment.findById(appointmentId).populate('serviceIds customerId');
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    

    const customer = await Customer.findById(customerId);
    const customerGender = customer?.gender || 'other';

    // app/api/billing/route.ts - Update the inventory section
try {
  console.log('Starting inventory updates for billing...');
  
  const serviceIds = appointment.serviceIds.map((s: any) => s._id.toString());
  console.log('Service IDs for inventory:', serviceIds);
  console.log('Customer gender:', customerGender);

  // Calculate inventory updates for ALL services
  const allInventoryUpdates: any[] = [];
  for (const serviceId of serviceIds) {
    const serviceUpdates = await InventoryManager.calculateServiceInventoryUsage(
      serviceId,
      customerGender
    );
    console.log(`Service ${serviceId} inventory updates:`, serviceUpdates);
    allInventoryUpdates.push(...serviceUpdates);
  }

  console.log('Total inventory updates to apply:', allInventoryUpdates);

  if (allInventoryUpdates.length > 0) {
    // Apply inventory updates
    const inventoryResult = await InventoryManager.applyInventoryUpdates(allInventoryUpdates);
    
    console.log('Inventory update result:', inventoryResult);
    
    if (!inventoryResult.success) {
      console.warn('Inventory update warnings:', inventoryResult.errors);
      // You might want to decide whether to proceed or halt billing here
    }

    if (inventoryResult.restockAlerts.length > 0) {
      console.log('Products needing restock:', inventoryResult.restockAlerts);
    }
  } else {
    console.log('No inventory updates needed - no consumables found');
  }

} catch (inventoryError) {
  console.error('Inventory update failed:', inventoryError);
  // Continue with billing but log the error
}

    // Create invoice
    const invoice = await Invoice.create({
      appointmentId,
      customerId,
      stylistId,
      billingStaffId,
      lineItems: items,
      serviceTotal: serviceTotal || 0,
      productTotal: productTotal || 0,
      subtotal: subtotal || grandTotal,
      membershipDiscount: membershipDiscount || 0,
      grandTotal,
      paymentDetails,
      notes,
      customerWasMember: customerWasMember || false,
      membershipGrantedDuringBilling: membershipGrantedDuringBilling || false,
      paymentStatus: 'Paid',
    });

    console.log('Created invoice:', invoice.invoiceNumber);

    // Update appointment with amount and payment details
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

    // Unlock stylist
    await Stylist.findByIdAndUpdate(stylistId, {
      isAvailable: true,
      currentAppointmentId: null,
      lastAvailabilityChange: new Date(),
    });

    console.log('Unlocked stylist');

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
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process payment' },
      { status: 500 }
    );
  }
}