// app/api/billing/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Invoice from '@/models/invoice'; // Fixed typo in import (invoice -> Invoice)
import Stylist from '@/models/Stylist';

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // Read request body once
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

    console.log('Received billing request:', body);

    console.log('Processing billing for appointment:', appointmentId);
    console.log('Grand total:', grandTotal);
    console.log('Payment details:', paymentDetails);

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