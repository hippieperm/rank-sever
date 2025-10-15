const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config();

class Database {
  constructor() {
    const dbPath = process.env.DB_PATH || "./data/trends.db";
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  /**
   * 데이터베이스 테이블 초기화
   */
  initializeTables() {
    const createTrendsTable = `
      CREATE TABLE IF NOT EXISTS shopping_trends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT NOT NULL,
        ratio REAL NOT NULL,
        rank INTEGER NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(keyword, date)
      )
    `;

    const createApiLogsTable = `
      CREATE TABLE IF NOT EXISTS api_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        response_time INTEGER,
        status_code INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.serialize(() => {
      this.db.run(createTrendsTable);
      this.db.run(createApiLogsTable);
      console.log("데이터베이스 테이블이 초기화되었습니다.");
    });
  }

  /**
   * 트렌드 데이터 저장
   * @param {Array} trends - 트렌드 데이터 배열
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @returns {Promise<boolean>} 저장 성공 여부
   */
  saveTrends(trends, date) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO shopping_trends (keyword, ratio, rank, date)
        VALUES (?, ?, ?, ?)
      `);

      let completed = 0;
      let hasError = false;

      trends.forEach((trend, index) => {
        stmt.run([trend.keyword, trend.ratio, index + 1, date], (err) => {
          if (err && !hasError) {
            hasError = true;
            reject(err);
            return;
          }

          completed++;
          if (completed === trends.length && !hasError) {
            stmt.finalize();
            resolve(true);
          }
        });
      });
    });
  }

  /**
   * 특정 날짜의 트렌드 데이터 조회
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @param {number} limit - 조회할 개수
   * @returns {Promise<Array>} 트렌드 데이터 배열
   */
  getTrendsByDate(date, limit = 100) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT keyword, ratio, rank, date, created_at
        FROM shopping_trends
        WHERE date = ?
        ORDER BY rank ASC
        LIMIT ?
      `;

      this.db.all(query, [date, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * 최신 트렌드 데이터 조회
   * @param {number} limit - 조회할 개수
   * @returns {Promise<Array>} 트렌드 데이터 배열
   */
  getLatestTrends(limit = 100) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT keyword, ratio, rank, date, created_at
        FROM shopping_trends
        WHERE date = (
          SELECT MAX(date) FROM shopping_trends
        )
        ORDER BY rank ASC
        LIMIT ?
      `;

      this.db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * 특정 키워드의 히스토리 조회
   * @param {string} keyword - 키워드
   * @param {number} days - 조회할 일수
   * @returns {Promise<Array>} 히스토리 데이터 배열
   */
  getKeywordHistory(keyword, days = 30) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT keyword, ratio, rank, date, created_at
        FROM shopping_trends
        WHERE keyword = ?
        AND date >= date('now', '-${days} days')
        ORDER BY date DESC, rank ASC
      `;

      this.db.all(query, [keyword], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * API 로그 저장
   * @param {Object} logData - 로그 데이터
   * @returns {Promise<boolean>} 저장 성공 여부
   */
  saveApiLog(logData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO api_logs (endpoint, method, ip_address, user_agent, response_time, status_code)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        [
          logData.endpoint,
          logData.method,
          logData.ipAddress,
          logData.userAgent,
          logData.responseTime,
          logData.statusCode,
        ],
        (err) => {
          if (err) {
            reject(err);
          } else {
            stmt.finalize();
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * 데이터베이스 연결 종료
   */
  close() {
    this.db.close((err) => {
      if (err) {
        console.error("데이터베이스 연결 종료 오류:", err.message);
      } else {
        console.log("데이터베이스 연결이 종료되었습니다.");
      }
    });
  }

  /**
   * 데이터베이스 상태 확인
   * @returns {Promise<boolean>} 연결 상태
   */
  isConnected() {
    return new Promise((resolve) => {
      this.db.get("SELECT 1", (err) => {
        resolve(!err);
      });
    });
  }
}

module.exports = Database;
