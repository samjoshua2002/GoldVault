import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CompletedLoan from '@/models/CompletedLoan';
import User from '@/models/User';
import GoldDetail from '@/models/GoldDetail';

export async function GET() {
    try {
        await dbConnect();
        const completed = await CompletedLoan.find()
            .populate('userId')
            .populate('goldId')
            .sort({ completedDate: -1 });

        return NextResponse.json(completed);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
