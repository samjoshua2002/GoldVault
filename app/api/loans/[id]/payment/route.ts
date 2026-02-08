import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Loan from '@/models/Loan';
import Payment from '@/models/Payment';
import { completeLoan } from '@/lib/interest';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await dbConnect();
        const { amount } = await request.json();

        const loan = await Loan.findById(id);
        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        if (amount <= 0) {
            return NextResponse.json({ error: 'Payment amount must be positive' }, { status: 400 });
        }

        if (amount > loan.totalAmount) {
            return NextResponse.json({
                error: `Payment exceeds due amount of ₹${loan.totalAmount}`
            }, { status: 400 });
        }

        loan.amountPaid += amount;
        loan.totalAmount -= amount;

        // Create payment history record
        await Payment.create({
            loanId: loan._id,
            amount: amount,
            remainingAmount: loan.totalAmount,
            paymentDate: new Date(),
        });

        if (loan.totalAmount <= 0) {
            loan.totalAmount = 0; // Ensure it doesn't go below zero
            await completeLoan(loan, 'repaid');
        } else {
            // Only save if not completed, because completeLoan also updates and saves loan status
            await loan.save();
        }

        return NextResponse.json({ success: true, loan });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
