// app/api/appointment/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Customer from '@/models/customermodel';
import Stylist from '@/models/Stylist';
import ServiceItem from '@/models/ServiceItem';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { createSearchHash } from '@/lib/crypto';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role.permissions, PERMISSIONS.APPOINTMENTS_READ)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search');
    const skip = (page - 1) * limit;

    const matchStage: any = {};
    if (statusFilter && statusFilter !== 'All') {
      matchStage.status = statusFilter;
    }

    // ** THE FIX: Corrected search logic for encrypted customer data and stylists **
    if (searchQuery) {
        const searchConditions = [];

        // Search by customer phone number (exact match on hash)
        const normalizedPhone = String(searchQuery).replace(/\D/g, '');
        if (normalizedPhone) {
            const phoneHash = createSearchHash(normalizedPhone);
            const matchingCustomers = await Customer.find({ phoneHash }).select('_id').lean();
            if (matchingCustomers.length > 0) {
                searchConditions.push({ customerId: { $in: matchingCustomers.map(c => c._id) } });
            }
        }

        // Search by stylist name (case-insensitive regex)
        const stylistQuery = { name: { $regex: searchQuery, $options: 'i' } };
        const matchingStylists = await Stylist.find(stylistQuery).select('_id').lean();
        if (matchingStylists.length > 0) {
            searchConditions.push({ stylistId: { $in: matchingStylists.map(s => s._id) } });
        }

        if (searchConditions.length > 0) {
            matchStage.$or = searchConditions;
        } else {
            // If search query doesn't match anything, ensure no results are returned.
            matchStage._id = new mongoose.Types.ObjectId();
        }
    }
    
    // ** THE FIX: Removed .lean() to allow decryption hooks to run on populated customer data **
    const [appointments, totalAppointmentsResult] = await Promise.all([
      Appointment.find(matchStage)
        .populate({ path: 'customerId' }) // post-find hook on Customer model will decrypt
        .populate({ path: 'stylistId', select: 'name' })
        .populate({ path: 'serviceIds', select: 'name price duration membershipRate' })
        .populate({ path: 'billingStaffId', select: 'name' })
        .sort({ date: -1, time: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(matchStage)
    ]);

    console.log("Total Appointments Count:", appointments);
    
    
    const totalPages = Math.ceil(totalAppointmentsResult / limit);

    const formattedAppointments = appointments.map(apt => ({
      ...apt.toObject(), // Use .toObject() for Mongoose documents
      id: apt._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      appointments: formattedAppointments,
      pagination: { totalAppointments: totalAppointmentsResult, totalPages, currentPage: page }
    });

  } catch (error: any) {
    console.error("API Error fetching appointments:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch appointments."
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { phoneNumber, customerName, email, gender, ...restOfBody } = body;

    if (!phoneNumber || !customerName) {
      return NextResponse.json({ success: false, message: "Customer name and phone are required." }, { status: 400 });
    }

    const normalizedPhone = String(phoneNumber).replace(/\D/g, '');
    const phoneHash = createSearchHash(normalizedPhone);

    let customerDoc = await Customer.findOne({ phoneHash });

    if (!customerDoc) {
      // pre-save hook on Customer model handles encryption and hashing
      customerDoc = await Customer.create({
        phoneHash:phoneHash,
        name: customerName,
        phoneNumber: phoneNumber,
        email,
        gender: gender || 'other'
      });
    }

    const { serviceIds, stylistId, date, time, notes, status, appointmentType = 'Online' } = restOfBody;
    
    const services = await ServiceItem.find({ _id: { $in: serviceIds } }).select('duration price membershipRate');
    const estimatedDuration = services.reduce((total, service) => total + service.duration, 0);

    const appointmentData: any = {
        customerId: customerDoc._id, stylistId, serviceIds,
        date: new Date(date), time, notes, status, appointmentType,
        appointmentTime: new Date(`${date}T${time}`),
        estimatedDuration
    };

    const newAppointment = new Appointment(appointmentData);
    const { grandTotal, membershipSavings } = await newAppointment.calculateTotal();
    appointmentData.finalAmount = grandTotal;
    appointmentData.membershipDiscount = membershipSavings;

    if (status === 'Checked-In') {
        appointmentData.checkInTime = new Date();
    }

    const createdAppointment = await Appointment.create(appointmentData);
    
    const populatedAppointment = await Appointment.findById(createdAppointment._id)
      .populate({ path: 'customerId' })
      .populate({ path: 'stylistId', select: 'name' })
      .populate({ path: 'serviceIds', select: 'name price duration membershipRate' });

    return NextResponse.json({ success: true, appointment: populatedAppointment }, { status: 201 });

  } catch (err: any) {
    console.error("API Error creating appointment:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to create appointment." }, { status: 500 });
  }
}