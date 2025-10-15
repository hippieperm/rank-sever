const Database = require("./database");

class TrendModel {
  constructor() {
    this.db = new Database();
  }

  /**
   * 새로운 트렌드 데이터 저장
   * @param {Array} trends - 트렌드 데이터 배열
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @returns {Promise<Object>} 저장 결과
   */
  async saveTrends(trends, date) {
    try {
      if (!Array.isArray(trends) || trends.length === 0) {
        throw new Error("유효하지 않은 트렌드 데이터입니다.");
      }

      if (!date || !this.isValidDate(date)) {
        throw new Error("유효하지 않은 날짜 형식입니다.");
      }

      const validatedTrends = this.validateTrendData(trends);
      await this.db.saveTrends(validatedTrends, date);

      return {
        success: true,
        message: `${date}일 트렌드 데이터 ${validatedTrends.length}개가 저장되었습니다.`,
        count: validatedTrends.length,
      };
    } catch (error) {
      console.error("트렌드 데이터 저장 오류:", error.message);
      throw error;
    }
  }

  /**
   * 특정 날짜의 트렌드 데이터 조회
   * @param {string} date - 날짜 (YYYY-MM-DD)
   * @param {number} limit - 조회할 개수
   * @returns {Promise<Object>} 조회 결과
   */
  async getTrendsByDate(date, limit = 100) {
    try {
      if (!this.isValidDate(date)) {
        throw new Error("유효하지 않은 날짜 형식입니다.");
      }

      const trends = await this.db.getTrendsByDate(date, limit);

      return {
        success: true,
        data: trends,
        count: trends.length,
        date: date,
      };
    } catch (error) {
      console.error("트렌드 데이터 조회 오류:", error.message);
      throw error;
    }
  }

  /**
   * 최신 트렌드 데이터 조회
   * @param {number} limit - 조회할 개수
   * @returns {Promise<Object>} 조회 결과
   */
  async getLatestTrends(limit = 100) {
    try {
      const trends = await this.db.getLatestTrends(limit);

      return {
        success: true,
        data: trends,
        count: trends.length,
        lastUpdated: trends.length > 0 ? trends[0].date : null,
      };
    } catch (error) {
      console.error("최신 트렌드 데이터 조회 오류:", error.message);
      throw error;
    }
  }

  /**
   * 특정 키워드의 히스토리 조회
   * @param {string} keyword - 키워드
   * @param {number} days - 조회할 일수
   * @returns {Promise<Object>} 조회 결과
   */
  async getKeywordHistory(keyword, days = 30) {
    try {
      if (!keyword || typeof keyword !== "string") {
        throw new Error("유효하지 않은 키워드입니다.");
      }

      const history = await this.db.getKeywordHistory(keyword, days);

      return {
        success: true,
        data: history,
        count: history.length,
        keyword: keyword,
        period: `${days}일`,
      };
    } catch (error) {
      console.error("키워드 히스토리 조회 오류:", error.message);
      throw error;
    }
  }

  /**
   * 트렌드 데이터 검증
   * @param {Array} trends - 검증할 트렌드 데이터
   * @returns {Array} 검증된 트렌드 데이터
   */
  validateTrendData(trends) {
    return trends
      .filter(
        (trend) =>
          trend &&
          typeof trend.keyword === "string" &&
          trend.keyword.trim().length > 0 &&
          typeof trend.ratio === "number" &&
          trend.ratio >= 0
      )
      .map((trend) => ({
        keyword: trend.keyword.trim(),
        ratio: Math.max(0, trend.ratio),
      }));
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
   * 트렌드 통계 정보 조회
   * @returns {Promise<Object>} 통계 정보
   */
  async getTrendStats() {
    try {
      const latestTrends = await this.db.getLatestTrends();
      const totalKeywords = latestTrends.length;

      const topKeywords = latestTrends.slice(0, 10);
      const avgRatio =
        latestTrends.reduce((sum, trend) => sum + trend.ratio, 0) /
        totalKeywords;

      return {
        success: true,
        stats: {
          totalKeywords,
          averageRatio: Math.round(avgRatio * 100) / 100,
          topKeywords: topKeywords.map((trend) => ({
            keyword: trend.keyword,
            ratio: trend.ratio,
            rank: trend.rank,
          })),
          lastUpdated: latestTrends.length > 0 ? latestTrends[0].date : null,
        },
      };
    } catch (error) {
      console.error("트렌드 통계 조회 오류:", error.message);
      throw error;
    }
  }

  /**
   * 데이터베이스 연결 종료
   */
  close() {
    this.db.close();
  }
}

module.exports = TrendModel;
