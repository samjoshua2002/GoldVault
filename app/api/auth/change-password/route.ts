import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { currentPassword, newPassword } = await request.json();

        // Normally we'd check session, but for now we'll find Ravibankers
        // In a real app, this should be based on the authenticated user's ID
        const admin = await Admin.findOne({ username: 'Ravibankers' });

        if (!admin || !(await bcrypt.compare(currentPassword, admin.password))) {
            return NextResponse.json(
                { error: 'Invalid current password' },
                { status: 401 }
            );
        }

        admin.password = newPassword;
        await admin.save();

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
