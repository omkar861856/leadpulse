import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Strict Admin Check
    const userEmail = user.emailAddresses[0]?.emailAddress;
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    if (!adminEmails.includes(userEmail)) {
      console.warn(`Unauthorized DB Console access attempt by ${userEmail}`);
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { collection, method, filter = {}, update = {}, options = {} } = await req.json();

    if (!collection || !method) {
      return NextResponse.json({ error: 'Missing collection or method' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('leadpulse');
    const targetCollection = db.collection(collection);

    let result;
    switch (method) {
      case 'find':
        result = await targetCollection.find(filter, options).toArray();
        break;
      case 'findOne':
        result = await targetCollection.findOne(filter, options);
        break;
      case 'insertOne':
        result = await targetCollection.insertOne(filter); // filter is the doc here
        break;
      case 'insertMany':
        result = await targetCollection.insertMany(filter); // filter is the docs here
        break;
      case 'updateOne':
        result = await targetCollection.updateOne(filter, update, options);
        break;
      case 'updateMany':
        result = await targetCollection.updateMany(filter, update, options);
        break;
      case 'deleteOne':
        result = await targetCollection.deleteOne(filter);
        break;
      case 'deleteMany':
        result = await targetCollection.deleteMany(filter);
        break;
      case 'countDocuments':
        result = await targetCollection.countDocuments(filter);
        break;
      case 'distinct':
        result = await targetCollection.distinct(filter as string, update || {}); // filter is the field
        break;
      case 'aggregate':
        result = await targetCollection.aggregate(filter as any[]).toArray();
        break;
      case 'getIndexes':
        result = await targetCollection.indexes();
        break;
      case 'drop':
        result = await targetCollection.drop();
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Database Command Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to execute command' 
    }, { status: 500 });
  }
}
