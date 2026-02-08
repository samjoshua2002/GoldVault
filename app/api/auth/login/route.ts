import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, password } = await request.json();
        console.log(`Login attempt for username: "${username}"`);

        // Seed admin if it doesn't exist
        const seedUsername = 'Ravibankers';
        let admin = await Admin.findOne({ username: seedUsername });

        if (!admin) {
            console.log('Admin not found in DB. Seeding default...');
            await Admin.create({
                username: seedUsername,
                password: 'Aymponnu1973',
                name: 'Aathivarman',
                role: 'Store Manager'
            });
            console.log('Seed created.');
        }

        // Check credentials from DB
        // Using a case-insensitive regex for finding the user to be more helpful
        const user = await Admin.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

        if (user) {
            console.log('User found:', user.username);

            let isMatch = false;
            try {
                isMatch = await bcrypt.compare(password, user.password);
            } catch (e) {
                console.log('Bcrypt comparison failed (likely plain text password)');
            }

            // Fallback for plain text password (can happen if seeding failed to hash)
            if (!isMatch && password === user.password) {
                console.log('Plain text password match detected. Repairing hash...');
                isMatch = true;
                // Update to hash for next time
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
                await Admin.updateOne({ _id: user._id }, { password: user.password });
            }

            console.log('Final match result:', isMatch);

            if (isMatch) {
                const cookieStore = await cookies();
                cookieStore.set('auth_token', 'logged_in_valid_token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 24, // 1 Day
                    path: '/',
                });

                return NextResponse.json({ success: true, message: 'Logged in successfully' });
            } else {
                return NextResponse.json({ error: 'Password does not match our records' }, { status: 401 });
            }
        }
        else {
            console.log('User not found:', username);
            return NextResponse.json({ error: `User "${username}" not found` }, { status: 401 });
        }

        return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
