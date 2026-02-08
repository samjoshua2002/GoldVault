import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Loan from '@/models/Loan';

export async function GET() {
    try {
        await dbConnect();
        const users = await User.find().sort({ createdAt: -1 });

        // Aggregation to get stats per user (active loans, total gold)
        // This could be optimized with MongoDB aggregation pipeline
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const activeLoans = await Loan.countDocuments({ userId: user._id, status: 'active' });
            // const goldCount = await GoldDetail.countDocuments({ userId: user._id }); // Add this model import
            return {
                ...user.toObject(),
                activeLoans,
                // goldCount
            };
        }));

        return NextResponse.json(usersWithStats);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
