/* 리니 녹화 → 구글 드라이브 올리기 (Google Apps Script 웹 앱)
   녹화 사이트가 보낸 CSV를 아래 폴더에 저장한다. 드라이브 폴더에 쓸 수 있는 사람이 배포한다.
   배포: 배포 → 새 배포 → 유형 "웹 앱" → 실행 계정 "나" → 액세스 "모든 사용자" → 나온 /exec 주소를 녹화 사이트에 넣는다. */
const FOLDER_ID = '1G85rimn-jTdGmdgLAFTuba79XPjqtwJ_';   // linny/data
const MAX_BYTES = 2 * 1024 * 1024;
// 녹화 파일(학습 노트북의 이름 규칙)과 기록표만 받는다. SIM_(가짜 센서) 파일은 받지 않는다.
// rec-v2.3부터: 날짜_이름_동작_번호.csv (예: 1121_준우_앞뒤로밀기_01.csv). 예전 이름(…_P1_spin_solo_01.csv)도 받는다.
const REC_RE = /^\d{4}_((준우|상현|예림|지우|창수|준호)_(앞뒤로밀기|빙글돌기|좌우로돌기|그냥이동|가만히)|(class|hall|check)_P[1-6]_(spin|pump|dance|move|still|still10|turn1|push3)_solo)_\d{2}\.csv$/;
const LOG_RE = /^log_\d{4}_[a-z0-9]{4}\.csv$/;

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const name = String(d.name || ''), csv = String(d.csv || '');
    const isLog = LOG_RE.test(name);
    if (!isLog && !REC_RE.test(name)) return out({ ok: false, error: 'bad_name' });
    if (csv.length === 0 || csv.length > MAX_BYTES) return out({ ok: false, error: 'bad_size' });
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const same = folder.getFilesByName(name);
    if (same.hasNext()) {
      if (!isLog) return out({ ok: false, error: 'exists' });   // 녹화 파일은 덮어쓰지 않는다
      same.next().setContent(csv);                               // 기록표는 같은 폰의 것으로 갈아 끼운다
      return out({ ok: true, name: name, replaced: true });
    }
    folder.createFile(name, csv, 'text/csv');
    return out({ ok: true, name: name });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}
function doGet() { return out({ ok: true, app: 'linny-upload' }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
