// FILE: /app/api/customer/[id]/route.ts - COMPLETE FINAL VERSION

import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Customer from '@/models/customermodel';
import Appointment from '@/models/Appointment';
import ServiceItem from '@/models/ServiceItem';
import Stylist from '@/models/Stylist';
import LoyaltyTransaction from '@/models/loyaltyTransaction';
import mongoose from 'mongoose';

// --- TYPE DEFINITIONS ---
// This interface defines the shape of the core customer data we fetch
interface LeanCustomer { 
  _id: mongoose.Types.ObjectId; 
  createdAt?: Date; 
  name: string; 
  email?: string; 
  phoneNumber: string;
  isMembership?: boolean; 
}

// ===================================================================================
//  GET: Handler for fetching full customer details for the side panel (FIXED)
// ===================================================================================
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const customerId = params.id;
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return NextResponse.json({ success: false, message: 'Invalid Customer ID.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    
    // --- STEP 1: Fetch the core customer data ---
    const customer = await Customer.findById(customerId).lean<LeanCustomer>();
    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found.' }, { status: 404 });
    }

    // --- STEP 2: Fetch related data in parallel for efficiency ---
    const [allRecentAppointments, loyaltyData] = await Promise.all([
      Appointment.find({ customerId: customer._id }).sort({ date: -1 }).limit(20).lean(),
      LoyaltyTransaction.aggregate([
        { $match: { customerId: customer._id } },
        {
          $group: {
            _id: null,
            totalPoints: {
              $sum: { $cond: [{ $eq: ['$type', 'Credit'] }, '$points', { $multiply: ['$points', -1] }] }
            }
          }
        }
      ])
    ]);

    // --- STEP 3: Calculate derived data (status, loyalty, etc.) ---
    let activityStatus: 'Active' | 'Inactive' | 'New' = 'New';
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    if (allRecentAppointments.length > 0) {
      const lastAppointmentDate = new Date(allRecentAppointments[0].date);
      activityStatus = lastAppointmentDate >= twoMonthsAgo ? 'Active' : 'Inactive';
    } else if (customer.createdAt) {
      const customerCreationDate = new Date(customer.createdAt);
      activityStatus = customerCreationDate < twoMonthsAgo ? 'Inactive' : 'New';
    }

    const calculatedLoyaltyPoints = loyaltyData.length > 0 ? loyaltyData[0].totalPoints : 0;

    // --- STEP 4: Populate paid appointment history ---
    const paidAppointmentIds = allRecentAppointments
      .filter(apt => apt.status === 'Paid')
      .slice(0, 10)
      .map(apt => apt._id);

    const populatedHistory = await Appointment.find({ _id: { $in: paidAppointmentIds } })
      .sort({ date: -1 })
      .populate({ path: 'stylistId', model: Stylist, select: 'name' })
      .populate({ path: 'serviceIds', model: ServiceItem, select: 'name price' })
      .lean();

    // --- STEP 5: Construct the final response object ---
    const customerDetails = {
      _id: customer._id.toString(),
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      status: activityStatus,
      loyaltyPoints: calculatedLoyaltyPoints,
      currentMembership: customer.isMembership, 
      
      // --- THE FIX FOR "JOINED" DATE ---
      // This ensures a 'createdAt' date always exists for the front-end table.
      // It uses the actual field if it exists, otherwise it extracts the
      // creation date from the MongoDB _id as a reliable fallback.
      createdAt: customer.createdAt || customer._id.getTimestamp(),
      
      membershipDetails: customer.isMembership ? {
        planName: 'Standard Membership',
        status: 'Active',
        endDate: null, 
        discountPercent: 0 
      } : null,

      lastVisit: allRecentAppointments.length > 0 ? (allRecentAppointments[0] as any).date.toISOString() : null,

      appointmentHistory: populatedHistory.map(apt => ({
        _id: (apt as any)._id.toString(),
        id: (apt as any)._id.toString(),
        date: (apt as any).date.toISOString(),
        totalAmount: (apt as any).amount || 0,
        stylistName: (apt as any).stylistId?.name || 'N/A',
        services: Array.isArray((apt as any).serviceIds) ? 
          (apt as any).serviceIds.map((s: any) => s.name) : [],
      }))
    };

    return NextResponse.json({ success: true, customer: customerDetails });

  } catch (error: any) {
    console.error(`API Error fetching details for customer ${params.id}:`, error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'An internal server error occurred.' 
    }, { status: 500 });
  }
}

// ===================================================================================
//  PUT: Handler for UPDATING a customer (No Changes)
// ===================================================================================
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const customerId = params.id;
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return NextResponse.json({ success: false, message: 'Invalid Customer ID.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.name || !body.phoneNumber) {
      return NextResponse.json({ success: false, message: 'Name and phone number are required.' }, { status: 400 });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        name: body.name.trim(),
        email: body.email?.trim(),
        phoneNumber: body.phoneNumber.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return NextResponse.json({ success: false, message: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer: updatedCustomer });

  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Another customer with this phone number or email already exists.' }, { status: 409 });
    }
    console.error(`API Error updating customer ${customerId}:`, error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update customer.' }, { status: 500 });
  }
}

// ===================================================================================
//  DELETE: Handler for "soft deleting" (deactivating) a customer (No Changes)
// ===================================================================================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const customerId = params.id;
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return NextResponse.json({ success: false, message: 'Invalid Customer ID.' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    
    const deactivatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { isActive: false },
      { new: true }
    );

    if (!deactivatedCustomer) {
      return NextResponse.json({ success: false, message: 'Customer not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Customer has been deactivated successfully.' });

  } catch (error: any) {
    console.error(`API Error deactivating customer ${customerId}:`, error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to deactivate customer.' }, { status: 500 });
  }
}