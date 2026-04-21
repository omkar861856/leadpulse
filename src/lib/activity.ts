import clientPromise from './mongodb';

export type ActivityType = 
  | 'scrape_request' 
  | 'lead_saved' 
  | 'limit_check' 
  | 'campaign_view';

export async function logActivity(
  userId: string, 
  type: ActivityType, 
  description: string, 
  metadata: any = {}
) {
  try {
    const client = await clientPromise;
    const db = client.db('leadpulse');
    const activities = db.collection('activities');

    await activities.insertOne({
      userId,
      type,
      description,
      metadata,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
