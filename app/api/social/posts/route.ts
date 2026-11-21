import dbConnect from "@/app/lib/dbConnect";
import SocialPost from "@/models/SocialPost";
import SocialActivity from "@/models/SocialActivity";
import SocialConnection from "@/models/SocialConnection";
import { isSocialAuthenticated } from "@/app/lib/social-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isSocialAuthenticated(request)) {
    return Response.json({ error: "Owner login درکار ہے۔" }, { status: 401 });
  }

  try {
    await dbConnect();

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

    const [rawPosts, activities, groupedCounts, weekCount, connectionCount] = await Promise.all([
      SocialPost.find().sort({ createdAt: -1 }).limit(100).lean(),
      SocialActivity.find().sort({ createdAt: -1 }).limit(8).lean(),
      SocialPost.aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }]),
      SocialPost.countDocuments({ createdAt: { $gte: weekStart } }),
      SocialConnection.countDocuments({ status: "connected" }),
    ]);

    // Mongoose کے _id کو id میں تبدیل کریں تاکہ فرنٹ اینڈ ٹھیک چلے
    const posts = rawPosts.map((p) => ({ ...p, id: p._id.toString() }));
    const formattedActivities = activities.map((a) => ({ ...a, id: a._id.toString(), postId: a.postId?.toString() || null }));

    const statusCounts: Record<string, number> = {};
    groupedCounts.forEach((g) => { statusCounts[g._id] = g.total; });

    return Response.json(
      {
        posts,
        activities: formattedActivities,
        stats: {
          total: Object.values(statusCounts).reduce((sum, val) => sum + val, 0),
          drafts: statusCounts.draft ?? 0,
          approved: statusCounts.approved ?? 0,
          scheduled: statusCounts.scheduled ?? 0,
          published: statusCounts.published ?? 0,
          thisWeek: weekCount,
          connectedChannels: connectionCount,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("social/posts GET error:", error);
    return Response.json({ error: "پوسٹس لوڈ نہیں ہو سکیں؛ ڈیٹابیس کی ترتیب چیک کریں۔" }, { status: 503 });
  }
}