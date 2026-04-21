import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('leadpulse');
    const searchLimitCollection = db.collection('usage_limits');
    
    const today = new Date().toISOString().split('T')[0];
    const userLimit = await searchLimitCollection.findOne({ userId, date: today });
    
    return NextResponse.json({ 
      remaining: 5 - (userLimit?.count || 0) 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
