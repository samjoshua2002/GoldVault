import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Loan from '@/models/Loan';
import User from '@/models/User';
import GoldDetail from '@/models/GoldDetail';
import { updateAllActiveLoans } from '@/lib/interest';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        await dbConnect();

        // Proactively update interest for all active loans
        await updateAllActiveLoans();

        const loans = await Loan.find({ status: 'active' })
            .populate('userId')
            .populate('goldId')
            .sort({ startDate: -1 });

        return NextResponse.json(loans);
    } catch (error: any) {
        console.error('API Error /active:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
