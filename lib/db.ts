import { MongoClient } from 'mongodb';

let mongoClient: MongoClient | null = null;

export async function getMongoClient() {
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGODB_URI as string);
    await mongoClient.connect();
  }
  return mongoClient;
}

export async function getVehicleCollection() {
  const client = await getMongoClient();
  return client.db().collection('vehicle');
} 