import { NextResponse } from 'next/server';

export async function GET() {
  // This route will read the environment variables directly on the server
  // and return them. This is a powerful diagnostic tool.

  const mongoURI = process.env.MONGODB_URI;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  return NextResponse.json({
    message: "Environment Variable Test",
    MONGODB_URI_IS_SET: !!mongoURI,
    MONGODB_URI_LENGTH: mongoURI?.length || 0,
    NEXTAUTH_SECRET_IS_SET: !!nextAuthSecret,
    JWT_SECRET_IS_SET: !!jwtSecret,
    NEXTAUTH_URL: nextAuthUrl,
  });
}