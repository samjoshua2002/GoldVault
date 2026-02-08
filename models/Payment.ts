import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
    loanId: mongoose.Types.ObjectId;
    amount: number;
    paymentDate: Date;
    remainingAmount: number;
    paidBy?: string;
    notes?: string;
}

const PaymentSchema: Schema = new Schema({
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    remainingAmount: { type: Number, required: true },
    paidBy: { type: String },
    notes: { type: String },
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
