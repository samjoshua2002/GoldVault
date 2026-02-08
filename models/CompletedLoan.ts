import mongoose, { Schema, Document } from 'mongoose';

export interface ICompletedLoan extends Document {
    loanId: string;
    userId: mongoose.Types.ObjectId;
    goldId: mongoose.Types.ObjectId;
    principalAmount: number;
    totalPaid: number;
    completedDate: Date;
    durationMonths: number;
}

const CompletedLoanSchema: Schema = new Schema({
    loanId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    goldId: { type: Schema.Types.ObjectId, ref: 'GoldDetail', required: true },
    principalAmount: { type: Number, required: true },
    totalPaid: { type: Number, required: true },
    completedDate: { type: Date, default: Date.now },
    durationMonths: { type: Number, required: true },
});

export default mongoose.models.CompletedLoan || mongoose.model<ICompletedLoan>('CompletedLoan', CompletedLoanSchema);
