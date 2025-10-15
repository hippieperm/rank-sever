const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const { createTrendRoutes } = require("./routes/trendRoutes");
const TrendScheduler = require("./scheduler");

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.scheduler = new TrendScheduler();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 미들웨어 설정
   */
  setupMiddleware() {
    // 보안 헤더 설정
    this.app.use(helmet());

    // CORS 설정
    this.app.use(
      cors({
        origin:
          process.env.NODE_ENV === "production"
            ? ["https://yourdomain.com"] // 실제 도메인으로 변경
            : true,
        credentials: true,
      })
    );

    // JSON 파싱
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // 요청 로깅
    this.app.use((req, res, next) => {
      const startTime = Date.now();

      res.on("finish", () => {
        const duration = Date.now() - startTime;
        console.log(
          `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
        );
      });

      next();
    });
  }

  /**
   * 라우트 설정
   */
  setupRoutes() {
    // API 라우트
    this.app.use("/api/trends", createTrendRoutes(this.scheduler));

    // 루트 경로
    this.app.get("/", (req, res) => {
      res.json({
        message: "네이버 데이터랩 쇼핑 트렌드 API 서버",
        version: "1.0.0",
        endpoints: {
          "GET /api/trends/latest": "최신 트렌드 데이터 조회",
          "GET /api/trends/date/:date": "특정 날짜의 트렌드 데이터 조회",
          "GET /api/trends/keyword/:keyword/history": "키워드 히스토리 조회",
          "GET /api/trends/stats": "트렌드 통계 정보 조회",
          "POST /api/trends/collect": "수동 데이터 수집 실행",
          "GET /api/trends/scheduler/status": "스케줄러 상태 조회",
          "GET /api/trends/health": "API 상태 확인",
        },
        timestamp: new Date().toISOString(),
      });
    });

    // API 문서 경로
    this.app.get("/api", (req, res) => {
      res.json({
        title: "네이버 데이터랩 쇼핑 트렌드 API",
        description:
          "네이버 데이터랩에서 수집한 쇼핑 트렌드 데이터를 제공하는 API",
        version: "1.0.0",
        baseURL: `${req.protocol}://${req.get("host")}/api/trends`,
        endpoints: [
          {
            method: "GET",
            path: "/latest",
            description: "최신 트렌드 데이터 조회",
            parameters: [
              {
                name: "limit",
                type: "query",
                required: false,
                description: "조회할 개수 (기본값: 100, 최대: 500)",
              },
            ],
          },
          {
            method: "GET",
            path: "/date/:date",
            description: "특정 날짜의 트렌드 데이터 조회",
            parameters: [
              {
                name: "date",
                type: "path",
                required: true,
                description: "날짜 (YYYY-MM-DD 형식)",
              },
              {
                name: "limit",
                type: "query",
                required: false,
                description: "조회할 개수 (기본값: 100, 최대: 500)",
              },
            ],
          },
          {
            method: "GET",
            path: "/keyword/:keyword/history",
            description: "특정 키워드의 히스토리 조회",
            parameters: [
              {
                name: "keyword",
                type: "path",
                required: true,
                description: "검색할 키워드",
              },
              {
                name: "days",
                type: "query",
                required: false,
                description: "조회할 일수 (기본값: 30, 최대: 365)",
              },
            ],
          },
          {
            method: "GET",
            path: "/stats",
            description: "트렌드 통계 정보 조회",
          },
          {
            method: "POST",
            path: "/collect",
            description: "수동 데이터 수집 실행",
          },
          {
            method: "GET",
            path: "/scheduler/status",
            description: "스케줄러 상태 조회",
          },
          {
            method: "GET",
            path: "/health",
            description: "API 상태 확인",
          },
        ],
      });
    });

    // 404 핸들러
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "요청한 엔드포인트를 찾을 수 없습니다.",
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * 에러 핸들링 설정
   */
  setupErrorHandling() {
    // 전역 에러 핸들러
    this.app.use((err, req, res, next) => {
      console.error("서버 오류:", err);

      res.status(err.status || 500).json({
        success: false,
        message: err.message || "서버 내부 오류가 발생했습니다.",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * 서버 시작
   */
  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🚀 서버가 포트 ${this.port}에서 실행 중입니다.`);
      console.log(`📊 API 문서: http://localhost:${this.port}/api`);
      console.log(
        `🏥 헬스체크: http://localhost:${this.port}/api/trends/health`
      );

      // 스케줄러 시작
      this.scheduler.start();
    });

    // 종료 시그널 처리
    process.on("SIGINT", () => this.shutdown());
    process.on("SIGTERM", () => this.shutdown());
  }

  /**
   * 서버 종료
   */
  shutdown() {
    console.log("\n서버를 종료합니다...");

    if (this.server) {
      this.server.close(() => {
        console.log("HTTP 서버가 종료되었습니다.");
        this.scheduler.stop();
        process.exit(0);
      });
    } else {
      this.scheduler.stop();
      process.exit(0);
    }
  }
}

// 서버가 직접 실행될 때
if (require.main === module) {
  const server = new Server();
  server.start();
}

module.exports = Server;
