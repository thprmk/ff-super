// app/api/customer/[id]/toggle-membership/route.ts - UPDATED TO ACCEPT CUSTOM BARCODE
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Customer, { ICustomer } from '@/models/customermodel';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { isMembership, membershipBarcode } = await req.json();
    const customerId = params.id;
    
    // Validate barcode if provided
    if (isMembership && membershipBarcode) {
      const barcodeExists = await Customer.checkBarcodeExists(membershipBarcode);
      if (barcodeExists) {
        return NextResponse.json({
          success: false,
          message: 'This barcode is already in use'
        }, { status: 400 });
      }
    }
    
    const customer: ICustomer | null = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json({
        success: false,
        message: 'Customer not found'
      }, { status: 404 });
    }
    
    // Toggle membership with custom barcode
    const updatedCustomer = await customer.toggleMembership(isMembership, membershipBarcode);
    
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