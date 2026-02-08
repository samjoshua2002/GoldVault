import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
    username: string;
    password: string;
    name: string;
    role: string;
    comparePassword: (password: string) => Promise<boolean>;
}

const AdminSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: 'Aathivarman' },
    role: { type: String, default: 'Admin' },
});

// Hash password before saving
AdminSchema.pre<IAdmin>('save', async function () {
    if (!this.isModified('password')) return;

    console.log('Hashing password for user:', this.username);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
AdminSchema.methods.comparePassword = async function (password: string) {
    return bcrypt.compare(password, this.password);
};

// Use a stable model name and handle hot-reloading
if (process.env.NODE_ENV === 'development' && mongoose.models.Admin) {
    delete (mongoose.models as any).Admin;
}

const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;
