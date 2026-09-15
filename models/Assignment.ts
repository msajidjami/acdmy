import mongoose, { Schema, models, model } from 'mongoose';

const AssignmentSchema = new Schema(
  {
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'Academy',
      required: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    daysOfWeek: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one day is required.',
      },
    },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    timezone: { type: String, default: 'Asia/Karachi', trim: true },

    scheduleKey: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },

    /* ✅ ٹیچر کو دی جانے والی فیس */
    teacherFeeAmount: { type: Number, default: 0, min: 0 },
    teacherCurrency: { type: String, enum: ['PKR', 'USD'], default: 'PKR' },

    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },

    /* ✅ Student Fee fields */
    feeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['PKR', 'USD'],
      default: 'PKR',
    },

    /* LiveKit */
    livekitRoomName: { type: String, default: '', trim: true },
    livekitHostIdentity: { type: String, default: '', trim: true },
    livekitProvider: { type: String, default: 'livekit', trim: true },
    livekitHostToken: { type: String, default: '', select: false },
    livekitStudentToken: { type: String, default: '', select: false },
  },
  { timestamps: true }
);

/* Indexes */
AssignmentSchema.index(
  {
    academyId: 1,
    teacherId: 1,
    studentId: 1,
    courseId: 1,
    startTime: 1,
    endTime: 1,
  },
  { unique: true, name: 'unique_assignment_v3' }
);

AssignmentSchema.index({ scheduleKey: 1 }, { name: 'scheduleKey_idx_v3' });
AssignmentSchema.index({ daysOfWeek: 1, startTime: 1, status: 1 });
AssignmentSchema.index({ academyId: 1, studentId: 1, status: 1 });
AssignmentSchema.index({ academyId: 1, teacherId: 1, status: 1 });

/* ============================================================
   ✅ Model Cache Clear — schema change hone par purana model hatao
   Warna Mongoose strict mode nayi fields ko silently strip kar deta hai
   ============================================================ */
if (mongoose.models.Assignment) {
  delete mongoose.models.Assignment;
}

const Assignment = model('Assignment', AssignmentSchema);

/* ============================================================
   Auto cleanup پرانے indexes
   ============================================================ */
declare global {
  // eslint-disable-next-line no-var
  var __assignmentCleanupV3: boolean | undefined;
}

async function cleanup() {
  if (global.__assignmentCleanupV3) return;
  global.__assignmentCleanupV3 = true;

  try {
    if (mongoose.connection.readyState !== 1) {
      setTimeout(() => {
        global.__assignmentCleanupV3 = false;
        cleanup();
      }, 2000);
      return;
    }

    const db = mongoose.connection.db;
    if (!db) return;

    const col = db.collection('assignments');
    const idxs = await col.indexes();

    const dropNames = [
      'unique_active_assignment_schedule',
      'unique_schedule',
      'active_schedule',
      'unique_assignment_v2',
    ];

    for (const idx of idxs) {
      const n = idx.name || '';
      if (n === '_id_') continue;
      if (dropNames.some((d) => n.toLowerCase().includes(d.toLowerCase()))) {
        try {
          await col.dropIndex(n);
          console.log(`✅ Dropped old assignment index: ${n}`);
        } catch {}
      }
    }

    /* Fix null scheduleKeys */
    const brokenDocs = await col
      .find({
        $or: [
          { scheduleKey: null },
          { scheduleKey: { $exists: false } },
          { scheduleKey: '' },
        ],
      })
      .toArray();

    for (const doc of brokenDocs) {
      try {
        const days = Array.isArray(doc.daysOfWeek)
          ? [...doc.daysOfWeek].sort()
          : [];
        const key = [
          String(doc.academyId || ''),
          String(doc.studentId || ''),
          String(doc.teacherId || ''),
          String(doc.courseId || ''),
          days.join('-'),
          String(doc.startTime || '').trim(),
          String(doc.endTime || '').trim(),
        ].join('_');

        await col.updateOne(
          { _id: doc._id },
          {
            $set: {
              scheduleKey: key.replace(/_/g, '').length > 0
                ? key
                : `orphan_${String(doc._id)}`,
            },
          }
        );
      } catch {}
    }

    /* ✅ نیا: teacherFeeAmount field missing wale documents fix karo */
    const feeMissing = await col
      .find({
        $or: [
          { teacherFeeAmount: null },
          { teacherFeeAmount: { $exists: false } },
        ],
      })
      .toArray();

    if (feeMissing.length > 0) {
      await col.updateMany(
        {
          $or: [
            { teacherFeeAmount: null },
            { teacherFeeAmount: { $exists: false } },
          ],
        },
        {
          $set: { teacherFeeAmount: 0, teacherCurrency: 'PKR' },
        }
      );
      console.log(
        `✅ Initialized teacherFeeAmount on ${feeMissing.length} assignment(s)`
      );
    }
  } catch (err) {
    console.warn('Assignment cleanup skipped:', (err as Error)?.message);
  }
}

if (mongoose.connection.readyState === 1) cleanup();
else mongoose.connection.once('connected', cleanup);

export default Assignment;