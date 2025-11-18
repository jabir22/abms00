import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('Starting role_permissions table migration...');
  
  try {
    // Helper to execute SQL from a file (multiple statements separated by ';')
    const execSqlFile = async (filePath) => {
      if (!fs.existsSync(filePath)) {
        console.warn(`SQL file not found: ${filePath}`);
        return;
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      const statements = sql.split(';').map(s => s.trim()).filter(Boolean);

      const connection = await db.getConnection();
      await connection.beginTransaction();
      try {
        for (const stmt of statements) {
          await connection.query(stmt);
        }
        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    };

    // 1) Seed permissions_catalog
    const permSeed = path.join(__dirname, '../seed/insert_permissions_catalog.sql');
    console.log('Seeding permissions catalog from', permSeed);
    await execSqlFile(permSeed);

    // 2) Seed default role permissions (will insert into role_permissions based on existing roles)
    const defaultRolePerms = path.join(__dirname, '../seed/insert_default_role_permissions.sql');
    console.log('Seeding default role permissions from', defaultRolePerms);
    await execSqlFile(defaultRolePerms);

    // 3) Find the role_permissions core SQL file (may be numbered like '5 role_permissions.sql')
    const coreDir = path.join(__dirname, '../sql/core');
    const files = fs.readdirSync(coreDir);
    const rpFile = files.find(f => f.toLowerCase().includes('role_permissions'));
    if (!rpFile) throw new Error('role_permissions SQL file not found in sql/core');

    const rpPath = path.join(coreDir, rpFile);
    console.log('Running role_permissions core SQL from', rpPath);
    await execSqlFile(rpPath);

    console.log('Migration and seeds completed successfully!');

    // Get count of migrated permissions (if table exists)
    try {
      const connection = await db.getConnection();
      const [rows] = await connection.query('SELECT COUNT(*) as count FROM role_permissions');
      console.log(`role_permissions rows: ${rows[0].count}`);
      connection.release();
    } catch (e) {
      console.warn('Could not query role_permissions count:', e.message);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Run the migration
runMigration();