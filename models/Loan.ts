import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
    loanId: string;
    userId: mongoose.Types.ObjectId;
    goldId: mongoose.Types.ObjectId;
    principalAmount: number;
    interestRate: number;
    startDate: Date;
    currentInterest: number;
    totalAmount: number;
    amountPaid: number;
    status: 'active' | 'completed';
    lastInterestUpdated: Date;
}

const LoanSchema: Schema = new Schema({
    loanId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    goldId: { type: Schema.Types.ObjectId, ref: 'GoldDetail', required: true },
    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, default: 2 },
    startDate: { type: Date, default: Date.now },
    currentInterest: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    lastInterestUpdated: { type: Date, default: Date.now },
});

export default mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);
