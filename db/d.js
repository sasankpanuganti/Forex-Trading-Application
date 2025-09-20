import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'pavani',
  database: 'hack2',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // connectTimeout can be used for connection timeout in ms if needed
  // connectTimeout: 60000,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables if they don't exist
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();

    // Create database if it doesn't exist and use it
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`hack2\``);
    await connection.query(`USE \`hack2\``);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        user_type ENUM('individual', 'organization') NOT NULL,
        organization_name VARCHAR(255) NULL,
        base_currency VARCHAR(10) NOT NULL,
        initial_amount DECIMAL(15,2) NOT NULL,
        bank_account_type VARCHAR(50) NOT NULL,
        account_number VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create trading_accounts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trading_accounts (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        balance DECIMAL(15,2) NOT NULL DEFAULT 0,
        base_currency VARCHAR(10) NOT NULL,
        total_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
        today_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
        open_positions INT NOT NULL DEFAULT 0,
        total_trades INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_account (user_id)
      )
    `);

    // Create trades table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        currency_pair VARCHAR(20) NOT NULL,
        trade_type ENUM('buy', 'sell') NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        price DECIMAL(15,5) NOT NULL,
        profit_loss DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create trade_history table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trade_history (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        currency_pair VARCHAR(20) NOT NULL,
        trade_type ENUM('buy', 'sell') NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        price DECIMAL(15,5) NOT NULL,
        profit_loss DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id)`);
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id)`);
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at)`);
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_trade_history_user_id ON trade_history(user_id)`);
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_trade_history_created_at ON trade_history(created_at)`);
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    connection.release();
    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
};

export { pool, testConnection, initializeDatabase };

// If invoked directly, run the checks
if (process.argv[1] && process.argv[1].endsWith('db/d.js')) {
  (async () => {
    const ok = await testConnection();
    if (ok) {
      await initializeDatabase();
    }
    // exit explicitly
    process.exit(ok ? 0 : 1);
  })();
}
