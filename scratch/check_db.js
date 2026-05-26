import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/skillsphere";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  const users = await db.collection("users").find({}).toArray();
  console.log("\n--- USERS ---");
  users.forEach(u => console.log(`ID: ${u._id}, Name: ${u.name}, Role: ${u.role}, Email: ${u.email}`));

  const gigs = await db.collection("gigs").find({}).toArray();
  console.log("\n--- GIGS ---");
  gigs.forEach(g => console.log(`ID: ${g._id}, Title: ${g.title}, Client: ${g.client}, Status: ${g.status}`));

  const proposals = await db.collection("proposals").find({}).toArray();
  console.log("\n--- PROPOSALS ---");
  proposals.forEach(p => console.log(`ID: ${p._id}, Gig: ${p.gig}, Freelancer: ${p.freelancer}, Status: ${p.status}`));

  const messages = await db.collection("messages").find({}).toArray();
  console.log("\n--- MESSAGES ---");
  messages.forEach(m => console.log(`ID: ${m._id}, Sender: ${m.sender}, Receiver: ${m.receiver}, Text: ${m.text}`));

  await mongoose.disconnect();
}

main().catch(console.error);
