// FILE: src/app/api/settings/[key]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions'; // Assuming you'll add settings permissions
import dbConnect from '@/lib/dbConnect';
import Setting from '@/models/Setting';

const MAX_RECIPIENTS = 5;

/**
 * GET handler: Retrieves a specific setting by its key.
 * Used by the Alerts page to load the current list of emails.
 */
export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  const session = await getServerSession(authOptions);
  // NOTE: Add PERMISSIONS.SETTINGS_VIEW to your permissions file
  if (!session || !hasPermission(session.user.role.permissions, PERMISSIONS.SETTINGS_VIEW)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const setting = await Setting.findOne({ key: params.key }).lean();

    // If the setting doesn't exist, return a default structure with an empty array
    if (!setting) {
      return NextResponse.json({ success: true, setting: { key: params.key, value: [] } });
    }

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error(`API Error GET /api/settings/${params.key}:`, error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}

/**
 * POST handler: Updates or creates a setting.
 * Used by the Alerts page to save the list of emails.
 */
export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const session = await getServerSession(authOptions);
  // NOTE: Add PERMISSIONS.SETTINGS_EDIT to your permissions file
  if (!session || !hasPermission(session.user.role.permissions, PERMISSIONS.SETTINGS_EDIT)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { value } = await request.json();

    // --- Server-side Validation ---
    if (!Array.isArray(value)) {
      return NextResponse.json({ success: false, message: 'Invalid data format. Expected an array.' }, { status: 400 });
    }

    if (value.length > MAX_RECIPIENTS) {
      return NextResponse.json({ success: false, message: `You can add a maximum of ${MAX_RECIPIENTS} emails.` }, { status: 400 });
    }

    // Validate each email in the array
    for (const email of value) {
      if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ success: false, message: `Invalid email address found: ${email}` }, { status: 400 });
      }
    }
    // --- End Validation ---

    await dbConnect();
    
    // findOneAndUpdate with 'upsert: true' is perfect for this.
    // It will update the setting if found, or create it if it's new.
    const updatedSetting = await Setting.findOneAndUpdate(
      { key: params.key },
      { 
        $set: { 
          value: value, // The array of emails
          key: params.key,
          category: 'Alerts', // Good practice to categorize settings
          description: 'List of email recipients for a specific alert.'
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