import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Loan from '@/models/Loan';
import CompletedLoan from '@/models/CompletedLoan';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        await dbConnect();

        const activeLoans = await Loan.find({ status: 'active' });
        const completedLoansCount = await CompletedLoan.countDocuments();

        const totalPrincipal = activeLoans.reduce((sum, loan) => sum + loan.principalAmount, 0);
        const totalInterest = activeLoans.reduce((sum, loan) => sum + loan.currentInterest, 0);
        const totalAmount = totalPrincipal + totalInterest;

        return NextResponse.json({
            activeLoansCount: activeLoans.length,
            completedLoansCount,
            totalPrincipal,
            totalInterest,
            totalAmount,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
