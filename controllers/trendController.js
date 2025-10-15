const TrendModel = require("../models/trendModel");
const TrendScheduler = require("../scheduler");

class TrendController {
  constructor() {
    this.trendModel = new TrendModel();
    this.scheduler = new TrendScheduler();
  }

  /**
   * 최신 트렌드 데이터 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getLatestTrends(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;

      if (limit > 500) {
        return res.status(400).json({
          success: false,
          message: "조회 가능한 최대 개수는 500개입니다.",
        });
      }

      const result = await this.trendModel.getLatestTrends(limit);

      res.json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("최신 트렌드 조회 오류:", error.message);
      res.status(500).json({
        success: false,
        message: "트렌드 데이터 조회 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  }

  /**
   * 특정 날짜의 트렌드 데이터 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getTrendsByDate(req, res) {
    try {
      const { date } = req.params;
      const limit = parseInt(req.query.limit) || 100;

      if (!date || !this.isValidDate(date)) {
        return res.status(400).json({
          success: false,
          message: "유효하지 않은 날짜 형식입니다. (YYYY-MM-DD)",
        });
      }

      if (limit > 500) {
        return res.status(400).json({
          success: false,
          message: "조회 가능한 최대 개수는 500개입니다.",
        });
      }

      const result = await this.trendModel.getTrendsByDate(date, limit);

      res.json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("날짜별 트렌드 조회 오류:", error.message);
      res.status(500).json({
        success: false,
        message: "트렌드 데이터 조회 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  }

  /**
   * 특정 키워드의 히스토리 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getKeywordHistory(req, res) {
    try {
      const { keyword } = req.params;
      const days = parseInt(req.query.days) || 30;

      if (!keyword || keyword.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "키워드를 입력해주세요.",
        });
      }

      if (days > 365) {
        return res.status(400).json({
          success: false,
          message: "조회 가능한 최대 기간은 365일입니다.",
        });
      }

      const result = await this.trendModel.getKeywordHistory(
        keyword.trim(),
        days
      );

      res.json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("키워드 히스토리 조회 오류:", error.message);
      res.status(500).json({
        success: false,
        message: "키워드 히스토리 조회 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  }

  /**
   * 트렌드 통계 정보 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getTrendStats(req, res) {
    try {
      const result = await this.trendModel.getTrendStats();

      res.json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("트렌드 통계 조회 오류:", error.message);
      res.status(500).json({
        success: false,
        message: "트렌드 통계 조회 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  }

  /**
   * 수동 데이터 수집 실행
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async triggerCollection(req, res) {
    try {
      // 실제 운영 환경에서는 인증/권한 체크가 필요할 수 있습니다
      const result = await this.scheduler.runManualCollection();

      if (result.success) {
        res.json({
          success: true,
          message: "수동 데이터 수집이 성공적으로 실행되었습니다.",
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("수동 데이터 수집 오류:", error.message);
      res.status(500).json({
        success: false,
        message: "수동 데이터 수집 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  }

  /**
   * 스케줄러 상태 조회
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async getSchedulerStatus(req, res) {
    try {
      const status = this.scheduler.getStatus();

      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("스케줄러 상태 조회 오류:", error.message);
      res.status(500).json({
        success: false,
        message: "스케줄러 상태 조회 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  }

  /**
   * API 상태 확인 (헬스체크)
   * @param {Object} req - Express 요청 객체
   * @param {Object} res - Express 응답 객체
   */
  async healthCheck(req, res) {
    try {
      const dbConnected = await this.trendModel.db.isConnected();

      res.json({
        success: true,
        status: "healthy",
        database: dbConnected ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: "unhealthy",
        message: "서비스 상태 확인 중 오류가 발생했습니다.",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 날짜 형식 검증
   * @param {string} date - 검증할 날짜
   * @returns {boolean} 유효성 여부
   */
  isValidDate(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
  }

  /**
   * 컨트롤러 정리
   */
  cleanup() {
    this.trendModel.close();
  }
}

module.exports = TrendController;
