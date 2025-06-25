// src/app/api/customer/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Customer from '@/models/customermodel';
import { createSearchHash } from '@/lib/crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

// GET handler for listing customers
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user.role.permissions, PERMISSIONS.CUSTOMERS_READ)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const searchQuery = searchParams.get('search');
    const skip = (page - 1) * limit;

    let query: any = { isActive: true };

    // IMPORTANT: Searching is now only possible via the phone number hash.
    // Name and email are encrypted and cannot be searched directly.
    if (searchQuery) {
      const normalizedPhone = String(searchQuery).replace(/\D/g, '');
      if (normalizedPhone) {
        query.phoneHash = createSearchHash(normalizedPhone);
      } else {
        // If search is not a number, it can't match a phone hash. Return empty.
        return NextResponse.json({ success: true, customers: [], pagination: { totalCustomers: 0, totalPages: 0, currentPage: 1, limit } });
      }
    }

    const [customersFromDb, totalCustomers] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalCustomers / limit);

    return NextResponse.json({
      success: true,
      customers: customersFromDb, // Data is already decrypted by the post-find hook
      pagination: { totalCustomers, totalPages, currentPage: page, limit }
    });

  } catch (error: any) {
    console.error("API Error fetching customers:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST handler for creating a customer
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user.role.permissions, PERMISSIONS.CUSTOMERS_CREATE)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (!body.name || !body.phoneNumber) {
        return NextResponse.json({ success: false, message: 'Name and Phone Number are required.' }, { status: 400 });
    }

    const normalizedPhoneNumber = String(body.phoneNumber).replace(/\D/g, '');
    const phoneHash = createSearchHash(normalizedPhoneNumber);

    const existingCustomer = await Customer.findOne({ phoneHash });
    
    if (existingCustomer) {
        return NextResponse.json({ 
            success: false, 
            message: 'A customer with this phone number already exists.', 
            exists: true, 
            customer: existingCustomer // Already decrypted by post-findOne hook
        }, { status: 409 });
    }

    // The 'pre-save' hook will handle encrypting fields automatically
    const newCustomer = await Customer.create({...body,phoneHash});

    return NextResponse.json({ success: true, customer: newCustomer }, { status: 201 });
  } catch (error: any) {
    console.error("API Error creating customer:", error);
    return NextResponse.json({ success: false, message: "Failed to create customer" }, { status: 500 });
  }
}