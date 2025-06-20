// app/api/billing/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Invoice from '@/models/invoice'; // Fixed typo in import (invoice -> Invoice)
import Stylist from '@/models/Stylist';

// FIX: Define an interface for the request body for type safety.
interface BillingRequestBody {
  appointmentId: string;
  customerId: string;
  stylistId: string;
  billingStaffId: string;
  items: any[]; // Ideally, specify a more concrete type for items
  serviceTotal?: number;
  productTotal?: number;
  subtotal: number;
  membershipDiscount?: number;
  grandTotal: number;
  paymentDetails: Record<string, number>; // This correctly types the payment object
  notes?: string;
  customerWasMember?: boolean;
  membershipGrantedDuringBilling?: boolean;
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // Read request body once and apply the defined type
    const body: BillingRequestBody = await req.json();
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

    // FIX: With `paymentDetails` now correctly typed, the `reduce` call is type-safe
    // and `totalPaid` is correctly inferred as a `number`.
    const totalPaid = Object.values(paymentDetails).reduce((sum, amount) => sum + (amount || 0), 0);
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