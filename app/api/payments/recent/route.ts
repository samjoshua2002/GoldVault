import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Loan from '@/models/Loan';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(Number(searchParams.get('limit')) || 10, 100);

        await dbConnect();

        // Fetch last payments and populate loan details
        const payments = await Payment.find()
            .sort({ paymentDate: -1 })
            .limit(limit)
            .populate({
                path: 'loanId',
                populate: { path: 'userId' }
            });

        return NextResponse.json(payments);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
