import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@storefront-ops/db';
import { SESSION_COOKIE_NAME, encodeSessionToken, type UserSession } from '@/lib/auth/session';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  organizationName: z.string().min(2, 'Company or organization name is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.format())[1] as any;
      const errorMsg = firstError?._errors?.[0] || 'Please complete all required fields';
      return NextResponse.json({ error: errorMsg, details: parsed.error.format() }, { status: 400 });
    }

    const { fullName, email, password, organizationName } = parsed.data;

    // Check if user already exists
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // 1. Persist the Organization
    const organization = db.createOrganization({
      name: organizationName,
    });

    // 2. Persist the User with hashed password and Owner Admin role
    const newUser = db.createUser({
      email,
      fullName,
      password,
      role: 'owner_admin',
      organizationId: organization.id,
      organizationSlug: organization.slug,
      organizationName: organization.name,
    });

    // 3. Generate authenticated session
    const session: UserSession = {
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      role: newUser.role,
      organizationId: organization.id,
      organizationSlug: organization.slug,
      organizationName: organization.name,
    };

    const token = encodeSessionToken(session);

    const response = NextResponse.json({
      success: true,
      user: session,
      redirectUrl: `/${organization.slug}/today`,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create workspace. Please try again.' },
      { status: 500 }
    );
  }
}
