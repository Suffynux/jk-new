import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = global._mongoose ?? (global._mongoose = { conn: null, promise: null });

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add your MongoDB Atlas connection string to .env.local");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { dbName: "jk-news" });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // A failed connection must not stay cached, or every later
    // request keeps rethrowing the old error
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}
