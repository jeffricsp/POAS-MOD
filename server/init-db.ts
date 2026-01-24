import mysql from "mysql2/promise";

export async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOSTNAME,
    database: process.env.MYSQL_DBNAME,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true,
  });

  // Drop old sessions table if it exists (we let express-mysql-session manage this)
  try {
    await connection.query('DROP TABLE IF EXISTS sessions');
  } catch (e) {
    // Ignore
  }

  const createTablesSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      google_id VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      profile_image_url VARCHAR(255),
      username TEXT,
      role ENUM('student', 'graduate', 'program_head', 'admin', 'employer') NOT NULL DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email TEXT NOT NULL,
      role ENUM('employer', 'program_head') NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      is_used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS program_outcomes (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      program_id INT NOT NULL,
      code VARCHAR(50) NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name TEXT NOT NULL,
      credits INT NOT NULL DEFAULT 3,
      program_id INT
    );

    CREATE TABLE IF NOT EXISTS course_po_mappings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      course_id INT NOT NULL,
      po_id INT NOT NULL,
      weight INT DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      course_id INT NOT NULL,
      grade INT NOT NULL,
      academic_year VARCHAR(20) NOT NULL,
      term TEXT NOT NULL,
      program_id INT
    );

    CREATE TABLE IF NOT EXISTS surveys (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title TEXT NOT NULL,
      target_role ENUM('student', 'graduate', 'employer') NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      program_id INT
    );

    CREATE TABLE IF NOT EXISTS survey_questions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      survey_id INT NOT NULL,
      text TEXT NOT NULL,
      type ENUM('scale', 'text') DEFAULT 'scale',
      linked_po_id INT
    );

    CREATE TABLE IF NOT EXISTS survey_responses (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      survey_id INT NOT NULL,
      user_id VARCHAR(255),
      respondent_name TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS survey_answers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      response_id INT NOT NULL,
      question_id INT NOT NULL,
      answer_value INT,
      answer_text TEXT
    );

    CREATE TABLE IF NOT EXISTS survey_course_links (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      survey_id INT NOT NULL,
      course_id INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255),
      type ENUM('survey_reminder', 'announcement', 'grade_posted') NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employer_feedback (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      employer_id VARCHAR(255),
      employer_name TEXT,
      graduate_id VARCHAR(255),
      graduate_name TEXT,
      po_id INT NOT NULL,
      rating INT NOT NULL,
      comment TEXT,
      cohort VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await connection.query(createTablesSQL);
  
  // Add google_id column if it doesn't exist (migration for existing users table)
  try {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'google_id'
    `, [process.env.MYSQL_DBNAME]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      await connection.query(`
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE
      `);
    }
  } catch (e: any) {
    // Ignore errors - column might already exist or other issues
  }
  
  // Add password column if it doesn't exist (migration for email/password auth)
  try {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
    `, [process.env.MYSQL_DBNAME]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      await connection.query(`
        ALTER TABLE users ADD COLUMN password VARCHAR(255)
      `);
    }
  } catch (e: any) {
    // Ignore errors - column might already exist or other issues
  }
  
  // Add program_id column if it doesn't exist (migration for student program assignment)
  try {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'program_id'
    `, [process.env.MYSQL_DBNAME]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      await connection.query(`
        ALTER TABLE users ADD COLUMN program_id INT NULL
      `);
    }
  } catch (e: any) {
    // Ignore errors - column might already exist or other issues
  }
  
  // Add program_id column to program_outcomes if it doesn't exist
  try {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'program_outcomes' AND COLUMN_NAME = 'program_id'
    `, [process.env.MYSQL_DBNAME]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      await connection.query(`
        ALTER TABLE program_outcomes ADD COLUMN program_id INT NOT NULL DEFAULT 1
      `);
      // Remove the UNIQUE constraint on code if it exists
      await connection.query(`
        ALTER TABLE program_outcomes DROP INDEX code
      `).catch(() => {});
    }
  } catch (e: any) {
    // Ignore errors - column might already exist or other issues
  }
  
  // Add program_id column to courses if it doesn't exist
  try {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'program_id'
    `, [process.env.MYSQL_DBNAME]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      await connection.query(`
        ALTER TABLE courses ADD COLUMN program_id INT NULL
      `);
    }
  } catch (e: any) {
    // Ignore errors - column might already exist or other issues
  }
  
  // Add academic_year and program_id columns to enrollments if they don't exist
  try {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'academic_year'
    `, [process.env.MYSQL_DBNAME]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      await connection.query(`
        ALTER TABLE enrollments ADD COLUMN academic_year VARCHAR(20) NOT NULL DEFAULT '2024-2025'
      `);
    }
  } catch (e: any) {
    // Ignore errors - column might already exist or other issues
  }
  
  try {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'enrollments' AND COLUMN_NAME = 'program_id'
    `, [process.env.MYSQL_DBNAME]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      await connection.query(`
        ALTER TABLE enrollments ADD COLUMN program_id INT NULL
      `);
    }
  } catch (e: any) {
    // Ignore errors - column might already exist or other issues
  }
  
  // Add program_id column to surveys if it doesn't exist
  try {
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'surveys' AND COLUMN_NAME = 'program_id'
    `, [process.env.MYSQL_DBNAME]);
    
    if (Array.isArray(rows) && rows.length === 0) {
      await connection.query(`
        ALTER TABLE surveys ADD COLUMN program_id INT NULL
      `);
    }
  } catch (e: any) {
    // Ignore errors - column might already exist or other issues
  }
  
  await connection.end();
  console.log("Database tables initialized successfully");
}
