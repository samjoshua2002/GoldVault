import mongoose from 'mongoose';
import Admin from '../models/Admin';
import '../lib/mongodb'; // Trigger connection

async function seed() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error('MONGODB_URI not found');
        return;
    }

    try {
        await mongoose.connect(MONGODB_URI);

        const existing = await Admin.findOne({ username: 'Ravibankers' });
        if (!existing) {
            await Admin.create({
                username: 'Ravibankers',
                password: 'Aymponnu1973',
                name: 'Aathivarman',
                role: 'Store Manager'
            });
            console.log('Admin seeded successfully');
        } else {
            console.log('Admin already exists');
        }
    } catch (err) {
        console.error('Seed error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
