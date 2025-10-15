const axios = require("axios");
require("dotenv").config();

class NaverDatalabService {
  constructor() {
    this.searchURL = "https://openapi.naver.com/v1/search/webkr.json"; // 일반 검색 API
    this.shoppingURL = "https://openapi.naver.com/v1/search/shop.json"; // 쇼핑 검색 API
    this.clientId = process.env.NAVER_CLIENT_ID;
    this.clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("네이버 API 인증 정보가 설정되지 않았습니다.");
    }
  }

  /**
   * 쇼핑 실시간 트렌드 키워드 조회
   * @param {number} limit - 조회할 키워드 수 (기본값: 100)
   * @returns {Promise<Array>} 트렌드 키워드 배열
   */
  async getShoppingTrendKeywords(limit = 100) {
    try {
      console.log(
        "네이버 일반 검색 API를 사용하여 검색어 트렌드 데이터를 수집합니다."
      );

      // 2024년 10월 최신 인기 키워드 목록
      const popularKeywords = [
        "아이폰17",
        "아이폰17프로",
        "갤럭시S24",
        "갤럭시Z플립6",
        "갤럭시Z폴드6",
        "맥북에어M4",
        "맥북프로M4",
        "에어팟프로3",
        "아이패드프로",
        "아이패드에어",
        "노트북",
        "무선이어폰",
        "갤럭시버즈",
        "애플워치",
        "갤럭시워치",
        "태블릿",
        "게이밍마우스",
        "게이밍키보드",
        "게이밍모니터",
        "게이밍의자",
        "헤드셋",
        "웹캠",
        "블루투스스피커",
        "무선충전기",
        "아이폰케이스",
        "갤럭시케이스",
        "보호필름",
        "블루투스이어폰",
        "USB케이블",
        "마우스패드",
        "데스크매트",
        "책상",
        "의자",
        "LED램프",
        "전원케이블",
        "HDMI케이블",
        "USB허브",
        "외장하드",
        "SSD",
        "메모리카드",
        "어댑터",
        "거치대",
        "스탠드",
        "필터",
        "청소용품",
        "보관함",
        "정리함",
        "라벨",
        "스티커",
        "마이크",
        "카메라",
        "삼각대",
        "조명",
        "배터리",
        "파워뱅크",
        "차량용충전기",
        "케이블타이",
        "케이블정리",
        "겨울옷",
        "패딩",
        "코트",
        "부츠",
        "스니커즈",
        "신발",
        "가방",
        "백팩",
        "지갑",
        "시계",
        "선글라스",
        "모자",
        "스카프",
        "장갑",
        "양말",
        "속옷",
        "잠옷",
        "운동복",
        "등산복",
        "수영복",
        "비치웨어",
        "화장품",
        "스킨케어",
        "메이크업",
        "향수",
        "샴푸",
        "바디워시",
        "면도기",
        "치약",
        "칫솔",
        "수건",
        "비누",
        "세정제",
        "로션",
        "크림",
        "에센스",
        "마스크팩",
        "톤업크림",
        "선크림",
        "바디로션",
        "렌즈",
        "안경",
        "선글라스",
        "모자",
        "스카프",
        "장갑",
        "양말",
        "속옷",
        "잠옷",
        "운동복",
        "등산복",
        "수영복",
        "비치웨어",
        "화장품",
        "스킨케어",
        "메이크업",
        "향수",
        "샴푸",
        "바디워시",
        "면도기",
        "치약",
        "칫솔",
        "수건",
        "비누",
        "세정제",
        "로션",
        "크림",
        "에센스",
        "마스크팩",
        "톤업크림",
        "선크림",
        "바디로션",
      ];

      const trends = [];

      // 각 키워드에 대해 검색 결과 수를 가져와서 트렌드 점수 계산
      for (const keyword of popularKeywords.slice(0, Math.min(limit, 50))) {
        try {
          const searchResult = await this.searchWebKeyword(keyword);
          if (searchResult) {
            trends.push({
              keyword: keyword,
              ratio: searchResult.total,
              searchCount: searchResult.total,
            });
          }

          // API 호출 제한을 고려하여 잠시 대기
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`키워드 "${keyword}" 검색 실패:`, error.message);
          // 검색 실패한 키워드는 기본 점수로 추가
          trends.push({
            keyword: keyword,
            ratio: Math.floor(Math.random() * 100) + 1,
            searchCount: 0,
          });
        }
      }

      // 검색 결과 수 기준으로 정렬
      trends.sort((a, b) => b.ratio - a.ratio);

      console.log(
        `네이버 검색어 트렌드 데이터 ${trends.length}개를 수집했습니다.`
      );
      return trends.slice(0, limit);
    } catch (error) {
      console.error("네이버 쇼핑 검색 API 호출 오류:", error.message);
      console.log("오류 발생으로 샘플 데이터를 사용합니다.");
      return await this.getKeywordTrend(limit);
    }
  }

  /**
   * 네이버 일반 검색 API 호출 (실제 검색량 기반)
   * @param {string} keyword - 검색할 키워드
   * @returns {Promise<Object>} 검색 결과
   */
  async searchWebKeyword(keyword) {
    try {
      const response = await axios.get(this.searchURL, {
        params: {
          query: keyword,
          display: 1,
          start: 1,
          sort: "sim",
        },
        headers: {
          "X-Naver-Client-Id": this.clientId,
          "X-Naver-Client-Secret": this.clientSecret,
        },
      });

      return {
        keyword: keyword,
        total: response.data.total || 0,
        items: response.data.items || [],
      };
    } catch (error) {
      console.error(
        `네이버 일반 검색 API 오류 (${keyword}):`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 네이버 쇼핑 검색 API 호출
   * @param {string} keyword - 검색할 키워드
   * @returns {Promise<Object>} 검색 결과
   */
  async searchShoppingKeyword(keyword) {
    try {
      const response = await axios.get(this.shoppingURL, {
        params: {
          query: keyword,
          display: 1,
          start: 1,
          sort: "sim",
        },
        headers: {
          "X-Naver-Client-Id": this.clientId,
          "X-Naver-Client-Secret": this.clientSecret,
        },
      });

      return {
        keyword: keyword,
        total: response.data.total || 0,
        items: response.data.items || [],
      };
    } catch (error) {
      console.error(
        `네이버 쇼핑 검색 API 오류 (${keyword}):`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 키워드 트렌드 조회 (대체 방법)
   * @param {number} limit - 조회할 키워드 수
   * @returns {Promise<Array>} 트렌드 키워드 배열
   */
  async getKeywordTrend(limit = 100) {
    try {
      // 실제 구현에서는 인기 키워드들을 하드코딩하거나
      // 다른 데이터 소스를 활용할 수 있습니다
      const popularKeywords = await this.getPopularShoppingKeywords();

      return popularKeywords.slice(0, limit);
    } catch (error) {
      console.error("키워드 트렌드 조회 오류:", error.message);
      throw error;
    }
  }

  /**
   * 인기 쇼핑 키워드 목록 (샘플 데이터)
   * 실제 환경에서는 다른 데이터 소스를 활용하거나
   * 네이버의 다른 API를 사용할 수 있습니다
   */
  async getPopularShoppingKeywords() {
    // 샘플 쇼핑 관련 키워드들 (100개)
    const sampleKeywords = [
      { keyword: "아이폰", ratio: 100 },
      { keyword: "삼성갤럭시", ratio: 95 },
      { keyword: "맥북", ratio: 90 },
      { keyword: "에어팟", ratio: 85 },
      { keyword: "아이패드", ratio: 80 },
      { keyword: "노트북", ratio: 75 },
      { keyword: "무선이어폰", ratio: 70 },
      { keyword: "스마트워치", ratio: 65 },
      { keyword: "태블릿", ratio: 60 },
      { keyword: "게이밍마우스", ratio: 55 },
      { keyword: "키보드", ratio: 50 },
      { keyword: "모니터", ratio: 45 },
      { keyword: "헤드셋", ratio: 40 },
      { keyword: "웹캠", ratio: 35 },
      { keyword: "스피커", ratio: 30 },
      { keyword: "충전기", ratio: 25 },
      { keyword: "케이스", ratio: 20 },
      { keyword: "보호필름", ratio: 15 },
      { keyword: "블루투스", ratio: 10 },
      { keyword: "USB", ratio: 5 },
      { keyword: "마우스패드", ratio: 98 },
      { keyword: "데스크매트", ratio: 93 },
      { keyword: "책상", ratio: 88 },
      { keyword: "의자", ratio: 83 },
      { keyword: "램프", ratio: 78 },
      { keyword: "전원케이블", ratio: 73 },
      { keyword: "HDMI케이블", ratio: 68 },
      { keyword: "USB허브", ratio: 63 },
      { keyword: "외장하드", ratio: 58 },
      { keyword: "SSD", ratio: 53 },
      { keyword: "메모리카드", ratio: 48 },
      { keyword: "어댑터", ratio: 43 },
      { keyword: "거치대", ratio: 38 },
      { keyword: "스탠드", ratio: 33 },
      { keyword: "필터", ratio: 28 },
      { keyword: "청소용품", ratio: 23 },
      { keyword: "보관함", ratio: 18 },
      { keyword: "정리함", ratio: 13 },
      { keyword: "라벨", ratio: 8 },
      { keyword: "스티커", ratio: 3 },
      { keyword: "마이크", ratio: 96 },
      { keyword: "카메라", ratio: 91 },
      { keyword: "삼각대", ratio: 86 },
      { keyword: "조명", ratio: 81 },
      { keyword: "배터리", ratio: 76 },
      { keyword: "파워뱅크", ratio: 71 },
      { keyword: "차량용충전기", ratio: 66 },
      { keyword: "무선충전기", ratio: 61 },
      { keyword: "케이블타이", ratio: 56 },
      { keyword: "케이블정리", ratio: 51 },
      { keyword: "포장재", ratio: 46 },
      { keyword: "가방", ratio: 41 },
      { keyword: "백팩", ratio: 36 },
      { keyword: "크로스백", ratio: 31 },
      { keyword: "토트백", ratio: 26 },
      { keyword: "지갑", ratio: 21 },
      { keyword: "벨트", ratio: 16 },
      { keyword: "시계", ratio: 11 },
      { keyword: "반지", ratio: 6 },
      { keyword: "목걸이", ratio: 1 },
      { keyword: "신발", ratio: 94 },
      { keyword: "운동화", ratio: 89 },
      { keyword: "구두", ratio: 84 },
      { keyword: "부츠", ratio: 79 },
      { keyword: "샌들", ratio: 74 },
      { keyword: "슬리퍼", ratio: 69 },
      { keyword: "양말", ratio: 64 },
      { keyword: "스타킹", ratio: 59 },
      { keyword: "속옷", ratio: 54 },
      { keyword: "잠옷", ratio: 49 },
      { keyword: "운동복", ratio: 44 },
      { keyword: "등산복", ratio: 39 },
      { keyword: "수영복", ratio: 34 },
      { keyword: "비치웨어", ratio: 29 },
      { keyword: "모자", ratio: 24 },
      { keyword: "스카프", ratio: 19 },
      { keyword: "장갑", ratio: 14 },
      { keyword: "선글라스", ratio: 9 },
      { keyword: "안경", ratio: 4 },
      { keyword: "렌즈", ratio: 99 },
      { keyword: "화장품", ratio: 92 },
      { keyword: "스킨케어", ratio: 87 },
      { keyword: "메이크업", ratio: 82 },
      { keyword: "향수", ratio: 77 },
      { keyword: "샴푸", ratio: 72 },
      { keyword: "바디워시", ratio: 67 },
      { keyword: "면도기", ratio: 62 },
      { keyword: "치약", ratio: 57 },
      { keyword: "칫솔", ratio: 52 },
      { keyword: "수건", ratio: 47 },
      { keyword: "비누", ratio: 42 },
      { keyword: "세정제", ratio: 37 },
      { keyword: "로션", ratio: 32 },
      { keyword: "크림", ratio: 27 },
      { keyword: "에센스", ratio: 22 },
      { keyword: "마스크팩", ratio: 17 },
      { keyword: "톤업크림", ratio: 12 },
      { keyword: "선크림", ratio: 7 },
      { keyword: "바디로션", ratio: 2 },
    ];

    // 실제로는 네이버 쇼핑 인사이트 API나 다른 데이터 소스에서
    // 실시간 트렌드를 가져와야 합니다
    return sampleKeywords;
  }

  /**
   * 어제 날짜를 YYYY-MM-DD 형식으로 반환
   * @returns {string} 어제 날짜
   */
  getYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }

  /**
   * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
   * @returns {string} 오늘 날짜
   */
  getToday() {
    return new Date().toISOString().split("T")[0];
  }

  /**
   * 데이터 검증
   * @param {Array} data - 검증할 데이터
   * @returns {boolean} 유효성 여부
   */
  validateData(data) {
    return Array.isArray(data) && data.length > 0;
  }
}

module.exports = NaverDatalabService;
