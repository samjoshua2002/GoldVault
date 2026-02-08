import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import GoldDetail from '@/models/GoldDetail';
import Loan from '@/models/Loan';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const data = await request.json();

        const {
            userName, phone, address,
            goldId, category, goldType, weight,
            principalAmount,
            // Optional: startDate override for testing
            mockStartDate
        } = data;

        // Auto-generate Loan ID
        const loanId = `LN-${Math.floor(100000 + Math.random() * 900000)}`;

        // 1. Create or Find User
        let user = await User.findOne({ phone });
        if (!user) {
            // If user doesn't exist, create new one
            user = await User.create({ name: userName, phone, address });
        } else {
            // If user exists, we can optionally update their address if provided and different
            if (address && user.address !== address) {
                user.address = address;
                await user.save();
            }
        }

        // 2. Create Gold Detail
        const goldDetail = await GoldDetail.create({
            goldId,
            userId: user._id,
            category,
            goldType,
            weight,
        });

        // Determine Start Date (Allow mock for testing)
        let startDate = new Date();
        let lastInterestUpdated = new Date();

        if (mockStartDate) {
            startDate = new Date(mockStartDate);
            // If mocking backdate, we set lastInterestUpdated to startDate
            // so the interest calculation logic will see the gap
            lastInterestUpdated = new Date(mockStartDate);
        }

        // 3. Create Loan
        const loan = await Loan.create({
            loanId,
            userId: user._id,
            goldId: goldDetail._id,
            principalAmount,
            totalAmount: principalAmount,
            startDate,
            lastInterestUpdated,
            currentInterest: 0,
            amountPaid: 0
        });

        return NextResponse.json({ success: true, loan });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
