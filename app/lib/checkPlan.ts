import { Types } from 'mongoose';
import Academy, { IAcademy } from '@/models/Academy';
import Subscription, { ISubscription } from '@/models/Subscription';
import Student from '@/models/Student';

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
  code?:
    | 'ACADEMY_NOT_FOUND'
    | 'UPGRADE_REQUIRED'
    | 'SUBSCRIPTION_EXPIRED'
    | 'LIMIT_REACHED'
    | 'NO_SUBSCRIPTION';
  limit?: number;
  current?: number;
}

/* ============================================================
   ✅ ACTUAL STUDENT COUNT (from database, not cached field)
   ============================================================ */

export async function getActualStudentCount(
  academyId: Types.ObjectId | string
): Promise<number> {
  try {
    const count = await Student.countDocuments({
      academyId,
      // ❌ Reject شدہ یا deleted کو چھوڑیں (اگر کوئی flag ہو تو)
      // ابھی کے لیے تمام students گنتے ہیں
    });
    return count;
  } catch (error) {
    console.error('getActualStudentCount error:', error);
    return 0;
  }
}

/* ============================================================
   ✅ SYNC — academy کی cached count کو actual سے match کریں
   ============================================================ */

export async function syncAcademyStudentCount(
  academyId: Types.ObjectId | string
): Promise<number> {
  const actualCount = await getActualStudentCount(academyId);

  await Academy.findByIdAndUpdate(academyId, {
    $set: { currentStudentCount: actualCount },
  });

  return actualCount;
}

/* ============================================================
   PLAN CHECK
   ============================================================ */

export async function checkAcademyCanAddStudent(
  academyId: Types.ObjectId | string
): Promise<PlanCheckResult> {
  const academy = (await Academy.findById(academyId).lean()) as IAcademy | null;

  if (!academy) {
    return {
      allowed: false,
      reason: 'Academy not found',
      code: 'ACADEMY_NOT_FOUND',
    };
  }

  /* ------------------------------------------------------------
     ✅ Actual count from Student collection (not cached field)
     ------------------------------------------------------------ */
  const actualStudentCount = await getActualStudentCount(academy._id);

  /* ------------------------------------------------------------
     ✅ Auto-sync academy cache
     ------------------------------------------------------------ */
  if (academy.currentStudentCount !== actualStudentCount) {
    await Academy.findByIdAndUpdate(academy._id, {
      $set: { currentStudentCount: actualStudentCount },
    });
  }

  /* ------------------------------------------------------------
     FREE PLAN CHECK
     ------------------------------------------------------------ */
  if (!academy.isPublic || academy.studentLimit === 0) {
    return {
      allowed: false,
      reason:
        'Please upgrade to a paid plan to add students. The free plan does not allow adding students.',
      code: 'UPGRADE_REQUIRED',
      current: actualStudentCount,
      limit: 0,
    };
  }

  /* ------------------------------------------------------------
     ACTIVE SUBSCRIPTION CHECK
     ------------------------------------------------------------ */
  const sub = (await Subscription.findOne({
    academyId: academy._id,
    status: 'active',
    endDate: { $gt: new Date() },
  }).lean()) as ISubscription | null;

  if (!sub) {
    return {
      allowed: false,
      reason:
        'Your subscription has expired. Please renew to continue adding students.',
      code: 'SUBSCRIPTION_EXPIRED',
      current: actualStudentCount,
    };
  }

  /* ------------------------------------------------------------
     UNLIMITED PLAN
     ------------------------------------------------------------ */
  if (sub.studentLimit === -1) {
    return {
      allowed: true,
      limit: -1,
      current: actualStudentCount,
    };
  }

  /* ------------------------------------------------------------
     ✅ LIMIT CHECK — actual count کے ساتھ
     ------------------------------------------------------------ */
  if (actualStudentCount >= sub.studentLimit) {
    return {
      allowed: false,
      reason: `You have reached your limit of ${sub.studentLimit} students. Please upgrade your plan.`,
      code: 'LIMIT_REACHED',
      limit: sub.studentLimit,
      current: actualStudentCount,
    };
  }

  return {
    allowed: true,
    limit: sub.studentLimit,
    current: actualStudentCount,
  };
}

/* ============================================================
   GET ACTIVE SUBSCRIPTION
   ============================================================ */

export async function getActiveSubscription(
  academyId: Types.ObjectId | string
): Promise<ISubscription | null> {
  const sub = await Subscription.findOne({
    academyId,
    status: { $in: ['active', 'trial'] },
    endDate: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();
  return sub as ISubscription | null;
}