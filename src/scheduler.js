const cron = require("node-cron");
const NaverDatalabService = require("./services/naverDatalabService");
const TrendModel = require("./models/trendModel");
require("dotenv").config();

class TrendScheduler {
  constructor() {
    this.naverService = new NaverDatalabService();
    this.trendModel = new TrendModel();
    this.isRunning = false;
    this.lastRunTime = null;
  }

  /**
   * 스케줄러 시작
   */
  start() {
    console.log("트렌드 데이터 수집 스케줄러를 시작합니다...");

    // 환경변수에서 스케줄 설정, 기본값은 매일 오전 9시
    const cronSchedule = process.env.CRON_SCHEDULE || "0 9 * * *";

    console.log(`스케줄 설정: ${cronSchedule} (매일 오전 9시)`);

    // 크론 작업 등록
    cron.schedule(
      cronSchedule,
      async () => {
        await this.collectTrendData();
      },
      {
        scheduled: true,
        timezone: "Asia/Seoul",
      }
    );

    // 서버 시작 시 즉시 한번 실행 (선택사항)
    if (process.env.RUN_ON_START === "true") {
      console.log("서버 시작 시 트렌드 데이터 수집을 실행합니다...");
      setTimeout(() => {
        this.collectTrendData();
      }, 5000); // 5초 후 실행
    }

    this.isRunning = true;
    console.log("스케줄러가 성공적으로 시작되었습니다.");
  }

  /**
   * 트렌드 데이터 수집 및 저장
   */
  async collectTrendData() {
    if (this.isRunning) {
      console.log("이미 트렌드 데이터 수집이 진행 중입니다. 건너뜁니다.");
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      console.log(
        `[${startTime.toISOString()}] 트렌드 데이터 수집을 시작합니다...`
      );

      // 오늘 날짜 생성
      const today = new Date().toISOString().split("T")[0];

      // 네이버 데이터랩에서 트렌드 데이터 가져오기
      console.log("네이버 데이터랩에서 트렌드 데이터를 가져오는 중...");
      const trends = await this.naverService.getShoppingTrendKeywords(100);

      if (!trends || trends.length === 0) {
        throw new Error("트렌드 데이터를 가져올 수 없습니다.");
      }

      console.log(`${trends.length}개의 트렌드 키워드를 가져왔습니다.`);

      // 데이터베이스에 저장
      console.log("데이터베이스에 저장 중...");
      const saveResult = await this.trendModel.saveTrends(trends, today);

      const endTime = new Date();
      const duration = endTime - startTime;

      // 마지막 실행 시간 업데이트
      this.lastRunTime = endTime.toISOString();

      console.log(
        `[${endTime.toISOString()}] 트렌드 데이터 수집이 완료되었습니다.`
      );
      console.log(`수집된 키워드 수: ${saveResult.count}개`);
      console.log(`소요 시간: ${duration}ms`);

      // 성공 로그
      this.logCollectionResult("success", {
        count: saveResult.count,
        duration,
        date: today,
      });
    } catch (error) {
      const endTime = new Date();
      const duration = endTime - startTime;

      console.error(
        `[${endTime.toISOString()}] 트렌드 데이터 수집 중 오류가 발생했습니다:`,
        error.message
      );

      // 오류 로그
      this.logCollectionResult("error", {
        error: error.message,
        duration,
        date: new Date().toISOString().split("T")[0],
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 수집 결과 로그
   * @param {string} status - 상태 (success/error)
   * @param {Object} data - 로그 데이터
   */
  logCollectionResult(status, data) {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      status,
      ...data,
    };

    console.log("수집 로그:", JSON.stringify(logMessage, null, 2));

    // 실제 운영 환경에서는 파일이나 외부 로깅 서비스에 저장
    // fs.appendFileSync('./logs/scheduler.log', JSON.stringify(logMessage) + '\n');
  }

  /**
   * 수동으로 트렌드 데이터 수집 실행
   * @returns {Promise<Object>} 실행 결과
   */
  async runManualCollection() {
    console.log("수동 트렌드 데이터 수집을 실행합니다...");

    try {
      await this.collectTrendData();
      return {
        success: true,
        message: "수동 데이터 수집이 완료되었습니다.",
      };
    } catch (error) {
      return {
        success: false,
        message: `수동 데이터 수집 실패: ${error.message}`,
      };
    }
  }

  /**
   * 스케줄러 상태 확인
   * @returns {Object} 스케줄러 상태
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cronSchedule: process.env.CRON_SCHEDULE || "0 9 * * *",
      timezone: "Asia/Seoul",
      lastRun: this.lastRunTime || null,
    };
  }

  /**
   * 스케줄러 중지
   */
  stop() {
    // 모든 크론 작업 중지
    const tasks = cron.getTasks();
    tasks.forEach((task) => task.destroy());

    this.isRunning = false;
    this.trendModel.close();
    console.log("스케줄러가 중지되었습니다.");
  }
}

// 스케줄러가 직접 실행될 때
if (require.main === module) {
  const scheduler = new TrendScheduler();

  // 스케줄러 시작
  scheduler.start();

  // 종료 시그널 처리
  process.on("SIGINT", () => {
    console.log("\n스케줄러를 종료합니다...");
    scheduler.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n스케줄러를 종료합니다...");
    scheduler.stop();
    process.exit(0);
  });
}

module.exports = TrendScheduler;
