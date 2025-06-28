// FILE: src/app/api/settings/[key]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import dbConnect from '@/lib/dbConnect';
import Setting from '@/models/Setting';

const MAX_RECIPIENTS = 5;

/**
 * GET handler: Retrieves a specific setting by its key.
 * This is updated to return smart defaults.
 */
export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user.role.permissions, PERMISSIONS.SETTINGS_VIEW)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const setting = await Setting.findOne({ key: params.key }).lean();

    if (!setting) {
      // +++ CHANGE 1: Return a smart default based on the key +++
      let defaultValue: string | string[] = [];
      if (params.key === 'globalLowStockThreshold') {
        defaultValue = '10'; // Default for the threshold is a string number
      }
      return NextResponse.json({ success: true, setting: { key: params.key, value: defaultValue } });
    }

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error(`API Error GET /api/settings/${params.key}:`, error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

/**
 * POST handler: Updates or creates a setting.
 * This is updated to handle BOTH string/number values and array values.
 */
export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !hasPermission(session.user.role.permissions, PERMISSIONS.SETTINGS_EDIT)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { key } = params;
    const { value } = await request.json();

    // +++ CHANGE 2: New validation logic that handles different types of settings +++
    if (key === 'globalLowStockThreshold') {
      // Validation for the threshold (it should be a number-like string)
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) {
        return NextResponse.json({ success: false, message: 'Threshold must be a valid non-negative number.' }, { status: 400 });
      }
    } else if (key.includes('Recipients')) {
      // Validation for any recipient list (it must be an array of emails)
      if (!Array.isArray(value)) {
        return NextResponse.json({ success: false, message: 'Invalid data format. Expected an array for recipients.' }, { status: 400 });
      }
      if (value.length > MAX_RECIPIENTS) {
        return NextResponse.json({ success: false, message: `You can add a maximum of ${MAX_RECIPIENTS} emails.` }, { status: 400 });
      }
      for (const email of value) {
        if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
          return NextResponse.json({ success: false, message: `Invalid email address found: ${email}` }, { status: 400 });
        }
      }
    } else {
        // Optional: handle unknown setting keys
        return NextResponse.json({ success: false, message: `Unknown setting key: ${key}`}, { status: 400 });
    }
    // +++ END OF NEW VALIDATION +++

    await dbConnect();
    
    // This database logic works for both value types (string or array)
    const updatedSetting = await Setting.findOneAndUpdate(
      { key: key },
      { 
        $set: { 
          value: value, 
          key: key,
        } 
      },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, setting: updatedSetting });
  } catch (error) {
    console.error(`API Error POST /api/settings/${params.key}:`, error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}