// 🔗 mysql2 লাইব্রেরির promise ভার্সন import করলাম
import mysql from 'mysql2/promise';
// 🔐 dotenv দিয়ে .env থেকে config load করলাম
import dotenv from 'dotenv';

dotenv.config();

// 📦 এখানে db নামে একটা Promise-based pool বানালাম
const db = mysql.createPool({
  host: process.env.DB_HOST,         // ✅ ডাটাবেজ হোস্ট (যেমন: localhost)
  user: process.env.DB_USER,         // ✅ ইউজার (যেমন: root)
  password: process.env.DB_PASS,     // ✅ পাসওয়ার্ড (যেমন: '')
  database: process.env.DB_NAME,     // ✅ ডাটাবেজ নাম (যেমন: abms)
  waitForConnections: true,          // ✅ connection queue handle করার জন্য
  connectionLimit: 10,               // ✅ একসাথে কত connection handle করবে
  queueLimit: 0                      // ✅ queue limit 0 মানে unlimited
});

// 🔌 ডাটাবেজ connect টেস্ট করার জন্য try-catch block
try {
  const connection = await db.getConnection();
  console.log('✅ Connected hoiche, good journey!');
  connection.release(); // ✅ connection release করলাম pool এ ফেরত দিতে
} catch (err) {
  console.error('❌ Database connect hoy nai:', err.message);
}

export default db;
