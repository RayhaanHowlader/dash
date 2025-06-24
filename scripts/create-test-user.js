const { MongoClient } = require('mongodb');

async function createTestUser() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('user');

    // Check if test user already exists
    const existingUser = await usersCollection.findOne({ phone: 8850164414 });
    
    if (existingUser) {
      console.log('Test user already exists:', existingUser.name);
      return;
    }

    // Create test user
    const testUser = {
      name: "Shilpa",
      phone: 8850164414,
      role: "fleet_manager",
      assignedVehicles: [
        "67c43a8a693e9a431ae9a8d9",
        "67c43a8a693e9a431ae9a8db",
        "67c43a8a693e9a431ae9a8dd",
        "67c43a8a693e9a431ae9a8df",
        "67c43a8a693e9a431ae9a8e1",
        "67c43a8a693e9a431ae9a8e3",
        "67c43a8a693e9a431ae9a8e5",
        "67c43a8a693e9a431ae9a8e7",
        "67c43a8a693e9a431ae9a8e9",
        "67c43a8a693e9a431ae9a8eb",
        "67c43a8a693e9a431ae9a8ed",
        "67c43a8a693e9a431ae9a8ef",
        "67c43a8a693e9a431ae9a8f1",
        "67c43a8a693e9a431ae9a8f3",
        "67c43a8a693e9a431ae9a8f5",
        "67c43a8a693e9a431ae9a8f7",
        "67c43a8a693e9a431ae9a8f9",
        "67c43a8a693e9a431ae9a8fb",
        "67c43a8a693e9a431ae9a8fd",
        "67c43a8a693e9a431ae9a8ff",
        "67c43a8a693e9a431ae9a901",
        "67c43a8a693e9a431ae9a903",
        "67c43a8a693e9a431ae9a905",
        "67c43a8a693e9a431ae9a907",
        "67c43a8a693e9a431ae9a909",
        "67c43a8a693e9a431ae9a90b",
        "67c43a8a693e9a431ae9a90d",
        "67c43a8a693e9a431ae9a90f",
        "67c43a8a693e9a431ae9a911",
        "67c43a8a693e9a431ae9a913",
        "67c43a8a693e9a431ae9a915"
      ],
      status: "active",
      loginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      vehicleGroup: "LINE_TRAILER"
    };

    const result = await usersCollection.insertOne(testUser);
    console.log('Test user created successfully:', result.insertedId);
    console.log('Phone number: 8850164414');
    console.log('Name: Shilpa');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await client.close();
  }
}

createTestUser(); 