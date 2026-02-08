import mongoose, { Schema, Document } from 'mongoose';

export interface IGoldDetail extends Document {
    goldId: string;
    userId: mongoose.Types.ObjectId;
    category: string;
    goldType: string;
    weight: number;
    date: Date;
    createdAt: Date;
}

const GoldDetailSchema: Schema = new Schema({
    goldId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    goldType: { type: String, required: true },
    weight: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.GoldDetail || mongoose.model<IGoldDetail>('GoldDetail', GoldDetailSchema);
