// scripts/migrate-enrollment-ids.ts
import mongoose from 'mongoose';
import connectDB from '../app/lib/dbConnect';
import Enrollment from '../app/models/Enrollment';
import User from '../app/models/User';
import Course from '../app/models/Course';

async function migrate() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected.');

    // Get all enrollments
    const enrollments = await Enrollment.find({}).lean();
    console.log(`📦 Found ${enrollments.length} enrollments.`);

    let updated = 0;
    let skipped = 0;

    for (const enrollment of enrollments) {
      let studentObjectId: mongoose.Types.ObjectId | null = null;
      let courseObjectId: mongoose.Types.ObjectId | null = null;

      // Convert studentId (if it's a string)
      if (enrollment.studentId && typeof enrollment.studentId === 'string') {
        // Try to find user by the string (could be email or name)
        // But we assume it's stored as the user's _id string
        const user = await User.findById(enrollment.studentId).lean();
        if (user) {
          studentObjectId = user._id;
        } else {
          // If not found, try to find by email (if the string looks like email)
          // but this is unlikely; we'll skip.
          console.warn(`⚠️  User not found for studentId: ${enrollment.studentId}`);
        }
      } else if (mongoose.Types.ObjectId.isValid(enrollment.studentId?.toString())) {
        // Already ObjectId, keep it
        studentObjectId = enrollment.studentId;
      }

      // Convert courseId
      if (enrollment.courseId && typeof enrollment.courseId === 'string') {
        // Try to find course by its title or id
        // First, check if it's a valid ObjectId string
        if (mongoose.Types.ObjectId.isValid(enrollment.courseId)) {
          const course = await Course.findById(enrollment.courseId).lean();
          if (course) {
            courseObjectId = course._id;
          } else {
            console.warn(`⚠️  Course not found for courseId: ${enrollment.courseId}`);
          }
        } else {
          // It's likely a course title (like "quran-hifz")
          // Try to find course by title
          const course = await Course.findOne({ title: enrollment.courseId }).lean();
          if (course) {
            courseObjectId = course._id;
          } else {
            console.warn(`⚠️  Course not found for title: ${enrollment.courseId}`);
          }
        }
      } else if (mongoose.Types.ObjectId.isValid(enrollment.courseId?.toString())) {
        courseObjectId = enrollment.courseId;
      }

      // If both IDs found, update the enrollment
      if (studentObjectId && courseObjectId) {
        await Enrollment.updateOne(
          { _id: enrollment._id },
          { $set: { studentId: studentObjectId, courseId: courseObjectId } }
        );
        updated++;
        console.log(`✅ Updated enrollment ${enrollment._id}`);
      } else {
        skipped++;
        console.log(`⏭️  Skipped enrollment ${enrollment._id} (missing references)`);
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();