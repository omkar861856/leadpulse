import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db('leadpulse');

    const totalLeads = await db.collection('leads').countDocuments({ userId });
    const totalScrapes = await db.collection('scrapes').countDocuments({ userId });
    
    // Get leads from the last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const newLeadsToday = await db.collection('leads').countDocuments({ 
      userId, 
      createdAt: { $gte: yesterday } 
    });

    // Get recent activities
    const recentActivities = await db.collection('activities')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      stats: {
        totalLeads,
        totalScrapes,
        newLeadsToday,
        activeCampaigns: 0 // Feature not fully implemented yet
      },
      recentActivities
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
