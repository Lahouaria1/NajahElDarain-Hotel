// backend/src/seeds/seed.js
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Room from '../models/Room.js';

// Optional: prevent accidental prod seeding
// if (process.env.NODE_ENV === 'production') { console.error('Refusing to run seeds in production'); process.exit(1); }

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

async function run() {
  await connectDB();

  // Ensure admin exists
  let admin = await User.findOne({ username: ADMIN_USERNAME });
  if (!admin) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin = await User.create({ username: ADMIN_USERNAME, password: hash, role: 'Admin' });
    console.log(`✅ Admin created: ${admin.username} (${ADMIN_USERNAME}/${ADMIN_PASSWORD})`);
  } else if (admin.role !== 'Admin') {
    admin.role = 'Admin';
    await admin.save();
    console.log(`🔁 Existing user "${admin.username}" upgraded to Admin`);
  } else {
    console.log('ℹ️ Admin already exists, skipping create');
  }

  // Seed rooms if empty
  const roomsCount = await Room.countDocuments();
  if (roomsCount === 0) {
    await Room.insertMany([
      {
        name: 'Konferensrum 1',
        capacity: 8,
        type: 'conference',
        imageUrl: 'https://images.unsplash.com/photo-1557800636-894a64c1696f',
        description: 'Ljust rum med TV och whiteboard',
      },
      {
        name: 'Arbetsplats A',
        capacity: 1,
        type: 'workspace',
        imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
        description: 'Tyst plats med ergonomisk stol',
      },
      {
        name: 'Konferensrum 2',
        capacity: 12,
        type: 'conference',
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
        description: 'Stort rum för workshops',
      },
    ]);
    console.log('✅ Sample rooms inserted (3)');
  } else {
    console.log(`ℹ️ Rooms already present (${roomsCount}), skipping insert`);
  }

  console.log(' Seeding completed.');
}

run()
  .then(async () => { await mongoose.disconnect(); process.exit(0); })
  .catch(async (e) => { console.error('❌ Seed failed:', e); try { await mongoose.disconnect(); } catch {} process.exit(1); });
