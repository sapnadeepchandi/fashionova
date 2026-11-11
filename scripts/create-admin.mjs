// Usage: npm run admin:create -- email@example.com "Full Name" 'StrongPassword!' [owner|manager|staff]
import 'dotenv/config';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
const [email, name, password, role = 'owner'] = process.argv.slice(2);
if (!email || !name || !password) { console.error('Usage: npm run admin:create -- email "Name" password [role]'); process.exit(1); }
if (password.length < 10) { console.error('Password must be at least 10 characters.'); process.exit(1); }
const sql = postgres(process.env.DATABASE_URL, { prepare: false });
await sql`insert into admin_users (email, name, password_hash, role) values (${email.toLowerCase()}, ${name}, ${await bcrypt.hash(password, 12)}, ${role})
          on conflict (email) do update set password_hash = excluded.password_hash, role = excluded.role, active = true, session_version = admin_users.session_version + 1`;
console.log(`✓ Admin ${email} (${role}) is ready`);
await sql.end();
