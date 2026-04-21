import { MongoClient } from 'mongodb';

async function checkDb() {
  const uri = "mongodb+srv://scraper:tzXD54N5Dx6F-4F@cluster0.wttchje.mongodb.net/leadpulse?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('leadpulse');
    const leads = await db.collection('leads').countDocuments();
    const scrapes = await db.collection('scrapes').countDocuments();
    const activities = await db.collection('activities').countDocuments();
    console.log(`Leads: ${leads}`);
    console.log(`Scrapes: ${scrapes}`);
    console.log(`Activities: ${activities}`);
    
    if (scrapes > 0) {
        const lastScrape = await db.collection('scrapes').find().sort({date: -1}).limit(1).toArray();
        console.log('Last Scrape:', JSON.stringify(lastScrape[0], null, 2));
    }
  } finally {
    await client.close();
  }
}

checkDb();
