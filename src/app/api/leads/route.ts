import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db('leadpulse');
    const leads = await db.collection('leads').find({ userId }).toArray();

    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const email = user.emailAddresses[0]?.emailAddress;

    const lead = await req.json();
    const client = await clientPromise;
    const db = client.db('leadpulse');

    const result = await db.collection('leads').updateOne(
      { userId, id: lead.id },
      { $set: { ...lead, userId, updatedAt: new Date() } },
      { upsert: true }
    );
    
    await logActivity(userId, 'lead_saved', `Lead saved: ${lead.name}`, { 
      leadId: lead.id,
      industry: lead.industry,
      email 
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
