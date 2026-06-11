/**
 * Creates the first super admin account.
 * Run: npm run seed
 * Uses SUPER_ADMIN_EMAIL / SUPER_ADMIN_NAME / SUPER_ADMIN_PASSWORD from .env.local
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not set. Paste your Atlas connection string into .env.local first.");
    process.exit(1);
  }

  const email = (process.env.SUPER_ADMIN_EMAIL ?? "usamakhizer786@gmail.com").toLowerCase();
  const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "ChangeMe@123";

  await mongoose.connect(uri, { dbName: "jk-news" });

  const UserSchema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true },
      passwordHash: String,
      role: String,
    },
    { timestamps: true }
  );
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "superadmin";
    existing.passwordHash = await bcrypt.hash(password, 10);
    await existing.save();
    console.log(`✅ Super admin already existed — password reset and role ensured for ${email}`);
  } else {
    await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10), role: "superadmin" });
    console.log(`✅ Super admin created: ${email}`);
  }
  console.log(`   Password: ${password}`);
  console.log("   ⚠️  Change SUPER_ADMIN_PASSWORD in .env.local and re-run seed if you want a different one.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
