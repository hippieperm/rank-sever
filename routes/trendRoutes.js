const express = require("express");
const TrendController = require("../controllers/trendController");

const router = express.Router();
const trendController = new TrendController();

/**
 * @route GET /api/trends/latest
 * @desc 최신 트렌드 데이터 조회
 * @query limit - 조회할 개수 (기본값: 100, 최대: 500)
 */
router.get("/latest", async (req, res) => {
  await trendController.getLatestTrends(req, res);
});

/**
 * @route GET /api/trends/date/:date
 * @desc 특정 날짜의 트렌드 데이터 조회
 * @param date - 날짜 (YYYY-MM-DD 형식)
 * @query limit - 조회할 개수 (기본값: 100, 최대: 500)
 */
router.get("/date/:date", async (req, res) => {
  await trendController.getTrendsByDate(req, res);
});

/**
 * @route GET /api/trends/keyword/:keyword/history
 * @desc 특정 키워드의 히스토리 조회
 * @param keyword - 검색할 키워드
 * @query days - 조회할 일수 (기본값: 30, 최대: 365)
 */
router.get("/keyword/:keyword/history", async (req, res) => {
  await trendController.getKeywordHistory(req, res);
});

/**
 * @route GET /api/trends/stats
 * @desc 트렌드 통계 정보 조회
 */
router.get("/stats", async (req, res) => {
  await trendController.getTrendStats(req, res);
});

/**
 * @route POST /api/trends/collect
 * @desc 수동 데이터 수집 실행
 * @access Admin (실제 운영에서는 인증 필요)
 */
router.post("/collect", async (req, res) => {
  await trendController.triggerCollection(req, res);
});

/**
 * @route GET /api/trends/scheduler/status
 * @desc 스케줄러 상태 조회
 */
router.get("/scheduler/status", async (req, res) => {
  await trendController.getSchedulerStatus(req, res);
});

/**
 * @route GET /api/health
 * @desc API 상태 확인 (헬스체크)
 */
router.get("/health", async (req, res) => {
  await trendController.healthCheck(req, res);
});

// 에러 핸들링 미들웨어
router.use((err, req, res, next) => {
  console.error("라우터 오류:", err);
  res.status(500).json({
    success: false,
    message: "서버 내부 오류가 발생했습니다.",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = router;
