import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Loan from '@/models/Loan';
import Payment from '@/models/Payment';
import CompletedLoan from '@/models/CompletedLoan';
import GoldDetail from '@/models/GoldDetail';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        await dbConnect();
        const [users, activeLoans, completedLoans, goldItems, payments] = await Promise.all([
            User.find().sort({ name: 1 }),
            Loan.find().populate('goldId'),
            CompletedLoan.find().populate('goldId'),
            GoldDetail.find(),
            Payment.find().populate({
                path: 'loanId',
                populate: [
                    { path: 'userId' },
                    { path: 'goldId' }
                ]
            })
        ]);

        const allData = users.map(user => {
            const userIdStr = user._id.toString();

            // Map payments to this user
            // Since Payment refs Loan, and Loan has userId
            const userPayments = payments.filter(p => {
                const loan = p.loanId as any;
                return loan && loan.userId?._id?.toString() === userIdStr;
            });

            return {
                user: user.toObject(),
                activeLoans: activeLoans.filter(l => l.userId.toString() === userIdStr),
                completedLoans: completedLoans.filter(l => l.userId.toString() === userIdStr),
                goldItems: goldItems.filter(g => g.userId.toString() === userIdStr),
                payments: userPayments
            };
        });

        return NextResponse.json(allData);
    } catch (error: any) {
        console.error('Report generation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
