# 코트로그 · 염주테니스장

염주테니스장 1~4코트의 17시, 19시, 21시 예약을 하루 3회 수집하고 사용자별 이용금액을 계산하는 공개 대시보드입니다.

## 주요 기능

- 월간 예약 달력
- 기간별 사용자 예약 횟수 및 금액 합계
- 예약·취소 이력 누적
- Netlify Identity로 보호되는 사용자 관리
- 관리자 달력에서 예약을 선택해 집계 제외하거나 복구
- Netlify Scheduled Functions를 통한 8시간 간격 자동 수집
- Netlify Blobs 영구 저장

## 로컬 실행

```bash
npm install
npm run dev
```

Netlify Functions와 Blobs를 포함한 전체 기능은 `netlify dev`에서 실행됩니다.

초기 운영 데이터를 준비할 때는 `npm run seed:prepare -- /tmp/courtlog-seed`를 실행한 뒤 Netlify CLI의 `blobs:set`으로 세 JSON 파일을 업로드할 수 있습니다.

## 배포 후 필수 설정

1. Netlify에서 Identity를 활성화합니다.
2. Registration preferences를 `Invite only`로 설정합니다.
3. 관리자 이메일 한 명만 초대합니다.
4. 환경 변수 `ADMIN_EMAIL`에 같은 이메일을 등록합니다.
5. Functions 화면에서 `admin-collect`를 호출하거나 관리자 화면에서 `지금 수집`을 실행합니다.

## 요금 기준

- 평일 주간 10,000원 / 주말·공휴일 주간 15,000원
- 평일 야간 15,000원 / 주말·공휴일 야간 20,000원
- 동계 17~19시 주야간은 시간 비례 기준 12,500원 / 17,500원

요금 계산은 `netlify/lib/fees.ts`에서 관리합니다.
