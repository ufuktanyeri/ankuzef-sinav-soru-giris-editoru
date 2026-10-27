# Algoritma — ANKUZEF Soru Aktarıcı (Chrome Eklentisi, MV3)

Durum: **Taslak — kullanıcı onayı bekleniyor.** Onay verilmeden kodlamaya geçilmez.

## 1. Amaç

`data/*.json` biçimindeki soruları, `ankuzefsinav.ankara.edu.tr` üzerindeki bir **soru yazma atamasına** (`authorQuestion`) toplu olarak aktarmak. Kullanıcı KDS ile kendisi giriş yapar; eklenti kimlik bilgisi işlemez.

## 2. Hedef sistemden doğrulanmış bilgiler (DevTools incelemesi, 2026-10-26)

| Konu | Bulgu |
|---|---|
| Ön yüz | Vue 3.5 SPA, Vite derlemesi; butonlarda `id`/`data-*` yok |
| API | `https://ankuzefsinavapi.ankara.edu.tr` |
| Oturum | `localStorage.auth_token`; bazı uç noktalar `Authorization: Bearer`, `Question/Insert` gövdede `Token` alanı |
| Atamalar | `POST AuthorQuestion/GetForAuthorByUserId` → `id, examId, fieldId, fieldCode, fieldName, examStage, questionCount, remainingQuestionCount…` |
| Konular | `POST QuestionTopic/list {fieldId, authorQuestionId}`; `POST QuestionTopic/add {Description, FieldId}` |
| Seçenek sayısı | `POST ExamField/GetByExamAndField/{examId}/{fieldId}` → `data.optionCount` (yoksa 5) |
| Soru kaydı | `POST Question/Insert` → `{Question, QuestionOptions[], QuestionStatus{StatusId}, QuestionGroup}` |
| Durum | `StatusId 1` = Taslak, `StatusId 2` = Onaya gönder (**geri alınamaz**) |
| Form bağlamı | "Soru Ekle" → `sessionStorage.aq_ctx = {authorQuestionId, examId, fieldId, fieldName, fieldCode}` → `/question/add` |

## 3. Alan eşlemesi (JSON → sistem)

| JSON | Sistem | Dönüşüm |
|---|---|---|
| `konu` | `Question.QuestionTopicId` | Ada göre mevcut konu aranır; yoksa (kullanıcı onayıyla) oluşturulur |
| `soru_koku` | `Question.Description` | Düz metin → HTML kaçışlı `<p>…</p>` |
| `secenekler.A…E` | `QuestionOptions[i].Description` | Aynı HTML dönüşümü; sıra korunur |
| `dogru_cevap` | `QuestionOptions[i].IsTrue` | Harf → indeks |
| `ek_ayarlar.zorluk_seviyesi` | `Question.ScoreId` | Ölçek eşlemesi **doğrulanacak** (varsayılan 3) |
| `ek_ayarlar.kaynak` | `Question.ExpDescription` | Doğrudan |
| `soru_grubu` | — | Yalnızca atamanın `examStage` değeriyle tutarlılık kontrolü |
| `ek_ayarlar.secenekler_karistirilmasin` | — | Sistemde karşılığı bulunamadı; yok sayılır, uyarı verilir |

## 4. Aktarım yöntemi — KARAR GEREKİYOR

**Seçenek A — API (önerilen):** İçerik betiği, sayfanın kendi oturumu ve uç noktalarıyla `Question/Insert` çağırır.
- Artı: DOM/CKEditor değişikliklerine dayanıklı, hızlı, test edilebilir.
- Eksi: Arayüz doğrulamaları atlanır → aynı doğrulamalar eklentide birebir uygulanır. Sistemin dahili API'sine bağımlıdır.

**Seçenek B — Form doldurma:** `/question/add` açılır; konu `select`'i seçilir, `window.CKEDITOR.instances[...]` ile metinler yazılır, "Taslak Olarak Kaydet" tıklanır.
- Artı: Kullanıcının elle yaptığı akışla birebir aynı.
- Eksi: Yavaş; MAIN world betik gerekir; SPA ve editör yüklenme zamanlamasına kırılgan.

Her iki seçenekte de **yalnızca Taslak (`StatusId 1`)** kaydedilir. Onaya gönderme kullanıcının sistemde elle yaptığı ayrı bir adımdır; eklenti bunu hiç yapmaz.

## 5. Akış

```text
[Popup] JSON dosyası seç
   │  1. Şema doğrulama (zod) — hatalı satırlar listelenir, aktarım başlamaz
   ▼
[Popup] Atama seç  ◄── content script: GetForAuthorByUserId
   │  2. Kontroller: soru_grubu ↔ examStage, soru sayısı ≤ remainingQuestionCount,
   │     seçenek sayısı = optionCount, tek doğru cevap
   ▼
[Popup] Ön izleme (kuru çalıştırma): eşleşen/oluşturulacak konular, soru listesi
   │  3. Kullanıcı "Taslak olarak aktar" onayı
   ▼
[Content script] Her soru için sırayla:
   │  a. Konu ID'sini çöz (önbellek → list → gerekirse add)
   │  b. Insert gövdesini kur, StatusId = 1
   │  c. POST; başarı/başarısızlık kaydı; istekler arası gecikme
   │  d. Hata → o soruyu atla, devam et (yeniden denenebilir liste)
   ▼
[Popup] Rapor: aktarılan / atlanan / hata nedeni; ilerleme chrome.storage.local'da
```

Mükerrer önleme: aktarım öncesi atamadaki mevcut sorular (`Question/GetForAuthorByAuthorQuestionId/{id}`) çekilir; soru kökü normalize edilerek eşleşenler atlanır.

## 6. Bileşenler

| Bileşen | Görev |
|---|---|
| `popup` | Dosya seçimi, atama seçimi, ön izleme, ilerleme/rapor |
| `content script` (`ankuzefsinav.ankara.edu.tr/*`) | Token okuma, API çağrıları (sayfa kökeniyle) |
| `background` (service worker) | Mesaj yönlendirme, durum kalıcılığı |
| `core/` (saf TS) | Şema, eşleme, HTML dönüşümü, doğrulama — birim testli |

İzinler: `storage`, `activeTab`; host: `https://ankuzefsinav.ankara.edu.tr/*`, `https://ankuzefsinavapi.ankara.edu.tr/*`.

## 7. Açık sorular

1. Aktarım yöntemi: A mı B mi?
2. `zorluk_seviyesi` (JSON'da 2–3) ile `ScoreId` ölçeği aynı mı? — kaydırıcı bileşeni incelenerek doğrulanacak.
3. Eksik konular eklenti tarafından otomatik mi oluşturulsun, yoksa ön izlemede tek tek onay mı istensin?
4. Excel girişi ilk sürümde gerekli mi, yoksa yalnızca JSON mı?
