// app/api/customer/[id]/toggle-membership/route.ts - UPDATED WITH PROPER TYPING
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Customer, { ICustomer } from '@/models/customermodel';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { isMembership } = await req.json();
    const customerId = params.id;


    console.log('Toggling membership for customer:', customerId,isMembership);
    
    
    const customer: ICustomer | null = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json({
        success: false,
        message: 'Customer not found'
      }, { status: 404 });
    }
    
    // Toggle membership and generate barcode if granting membership
    const updatedCustomer = await customer.toggleMembership(isMembership);
    
    return NextResponse.json({
      success: true,
      message: `Membership ${isMembership ? 'granted' : 'removed'} successfully`,
      customer: {
        _id: updatedCustomer._id,
        name: updatedCustomer.name,
        isMembership: updatedCustomer.isMembership,
        membershipBarcode: updatedCustomer.membershipBarcode
      }
    });
    
  } catch (error) {
    console.error('Error toggling membership:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update membership status'
    }, { status: 500 });
  }
}