import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Loan from '@/models/Loan';
import GoldDetail from '@/models/GoldDetail';
import CompletedLoan from '@/models/CompletedLoan';
import Payment from '@/models/Payment';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Only fetch loans with status: 'active'
        const activeLoans = await Loan.find({ userId: id, status: 'active' }).populate('goldId').sort({ startDate: -1 });
        const completedLoans = await CompletedLoan.find({ userId: id }).populate('goldId').sort({ completedDate: -1 });
        const goldItems = await GoldDetail.find({ userId: id }).sort({ date: -1 });

        // Get all loan IDs (active and completed) to fetch payments
        const loanIds = [
            ...activeLoans.map(l => l._id),
            ...completedLoans.map(cl => cl.loanId) // Mapping correctly if needed
        ];

        const payments = await Payment.find({ loanId: { $in: loanIds } })
            .sort({ paymentDate: -1 })
            .populate('loanId');

        return NextResponse.json({
            user,
            activeLoans,
            completedLoans,
            goldItems,
            payments
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();
        const data = await request.json();

        const user = await User.findByIdAndUpdate(id, data, { new: true });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();

        // 1. Find all loans to get their IDs
        const activeLoans = await Loan.find({ userId: id });
        const completedLoans = await CompletedLoan.find({ userId: id });

        const loanIds = [
            ...activeLoans.map(l => l._id),
            ...(completedLoans.map(cl => {
                try {
                    // Some historical records might have stored loanId as a string or ObjectId
                    return cl.loanId;
                } catch (e) {
                    return null;
                }
            }).filter(id => id !== null))
        ];

        // 2. Cascade Delete
        await Promise.all([
            Payment.deleteMany({ loanId: { $in: loanIds } }),
            Loan.deleteMany({ userId: id }),
            CompletedLoan.deleteMany({ userId: id }),
            GoldDetail.deleteMany({ userId: id }),
            User.findByIdAndDelete(id)
        ]);

        return NextResponse.json({ success: true, message: 'User and all associated data deleted successfully' });
    } catch (error: any) {
        console.error('Delete User Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
