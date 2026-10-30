# Algoritma — ANKUZEF Soru Aktarıcı (Chrome Eklentisi, MV3)

Durum: **Onaylandı (2026-10-27).** Tüm açık sorular kapandı; uygulama `implementation_plan.md`'deki 34 adımlık sırayla yürür.

## 1. Amaç

`data/*.json` biçimindeki soruları, `ankuzefsinav.ankara.edu.tr` üzerindeki bir **soru yazma atamasına** (`authorQuestion`) toplu olarak aktarmak. Kullanıcı KDS ile kendisi giriş yapar; eklenti kimlik bilgisi işlemez.

## 2. Hedef sistemden doğrulanmış bilgiler

Kaynak: üretim bundle'ı statik analizi, **2026-10-27** (Bulgu 1–30).
Uç nokta/payload ayrıntısı ve geri alma prosedürü: **`docs/api-sozlesmesi.md`**.

| # | Bulgu |
|---|---|
| 1 | API tabanı `https://ankuzefsinavapi.ankara.edu.tr` (path ön eki **yok**) |
| 2 | Ön yüz: Vue 3 + Vite SPA, Metronic/Keen teması, jQuery + select2 + toastr + SweetAlert2 |
| 3 | Oturum: `localStorage.auth_token` (JWT), `localStorage.userId`, `localStorage.roles` |
| 4 | Her POST'ta `Authorization: Bearer <token>` **ve** gövde düz nesne ise gövdeye `Token` ekleniyor |
| 5 | Yanıt sözleşmesi `{ process, description?, message?, data? }`; `process === false` → hata |
| 6 | `POST AuthorQuestion/GetForAuthorByUserId` → atama listesi |
| 7 | `POST ExamField/GetByExamAndField/{examId}/{fieldId}` → `data.optionCount` (yoksa **5**) |
| 8 | `POST QuestionTopic/list` gövde `{fieldId, authorQuestionId}` |
| 9 | `POST QuestionTopic/add` gövde `{Description, FieldId}` → `data.Id ?? Id` |
| 10 | `POST QuestionGroup/by-author-question/{authorQuestionId}` → `{process, questionGroups[]}` |
| 11 | `POST Question/GetForAuthorByAuthorQuestionId/{id}` → `statusId, questionStatusId, description…` |
| 12 | **Kota:** `statusId ∈ {2..8}` **ve** `userId === benim` sorular sayılır. **Taslak (`1`) kota tüketmez** |
| 13 | **Tarih penceresi:** `now ∈ [startDate, finishDate]` değilse aktarım reddedilir |
| 14 | Kullanıcı çözümleme: `POST Account/GetAuthUser/{authorQuestionId}` → `{id\|Id}` |
| 15 | `Question/Insert` gövdesi `{Question, QuestionOptions[], QuestionStatus, QuestionGroup}` + otomatik `Token` |
| 16 | `StatusId 1` = "Taslak Olarak Kaydet"; `StatusId 2` = "Onaya Gönder" (**geri alınamaz**) |
| 17 | **Zorluk ölçeği birebir:** `{1:Çok Kolay … 5:Çok Zor}` ⇒ `zorluk_seviyesi ≡ ScoreId` |
| 18 | Sistem HTML izin listesi: `p, br, strong, b, em, i, u, s, strike, del, sub, sup, div, h1–h6, ul, ol, li, img, table…` |
| 19 | Normalleştirici `<strong> <em> <b> <i> <u>` ve underline span'lerini **korur**, boş `p`'leri düşürür |
| 20 | `/question/add` bağlamı `sessionStorage.aq_ctx = {authorQuestionId, examId, fieldId, fieldName, fieldCode}` |
| 21 | CKEditor örnekleri `option-{0..n-1}`; soru kökü `Description`; ortak metin `commonTextEditorEditable` |
| 22 | Soru görseli yükleme uç noktası **yok**; görsel ancak `<img src="data:…">` ile gömülebilir |
| 23 | `Question.MixId` 0/1 bayrak, varsayılan 0 → **Bulgu 28–29 ile kapandı: alan vestigial** |
| 24 | Sistemin `QuestionGroup` kavramı (ortak metinli grup) JSON'daki `soru_grubu` ile **ilgisizdir** |
| 25 | `examStage` atama nesnesinde **metin açıklama**; arayüz `Jt()` ile yalnız `ARA`/`FİNAL`/`BÜTÜNLEME` tanır |
| 26 | **`POST Term/GetExamStages`** → `{id, description}[]` kanonik sınav aşaması sözlüğü (çalışma zamanında çekilebilir) |
| 27 | **`POST ExamType/List` = "Program Türü"** — sınav türü **değil**. Adlandırma tuzağı |
| 28 | `"karıştır"` kelimesi incelenen 7 bundle'da **0 kez**; `Shuffle`/`Random` soru görünümlerinde **0** |
| 29 | `MixId` main bundle'da **hiç yok**; `UpdateView`'daki `computed` değişkene atanmamış (**ölü kod**) ⇒ sistemde karşılığı kesin olarak yok |
| 30 | `optionCount`, `BookletView`'da "Seçenek Sayısı" sütunu olarak **`ExamField` düzeyinde** ⇒ sınav/alan bazlı sabit ayar |

## 3. Alan eşlemesi (JSON → sistem)

| JSON | Sistem | Dönüşüm |
|---|---|---|
| `konu` | `Question.QuestionTopicId` | Ada göre mevcut konu aranır; yoksa (kullanıcı onayıyla) oluşturulur |
| `soru_koku` | `Question.Description` | Düz metin → HTML kaçışlı `<p>…</p>` |
| `secenekler.A…E` | `QuestionOptions[i].Description` | Aynı HTML dönüşümü; sıra korunur |
| `dogru_cevap` | `QuestionOptions[i].IsTrue` | Harf → indeks |
| `ek_ayarlar.zorluk_seviyesi` | `Question.ScoreId` | **Birebir** (Bulgu 17): `1`→Çok Kolay … `5`→Çok Zor. Dönüşüm yok |
| `ek_ayarlar.kaynak` | `Question.ExpDescription` | Doğrudan |
| `soru_grubu` | — | Yalnızca atamanın `examStage` değeriyle tutarlılık kontrolü |
| `ek_ayarlar.secenekler_karistirilmasin` | — | **`deprecated` (D7).** Bulgu 28–29: sistemde karşılığı kesin olarak yok. Aktarılmaz, `DEPRECATED_FIELD` bilgi mesajı üretilir; `Question.MixId` her zaman `0` |

## 4. Aktarım yöntemi — KARAR VERİLDİ: **Seçenek C (hibrit)**

Kullanıcı onayı: 2026-10-27 (`implementation_plan.md` D1).

Aktarım **API ile** yapılır; DOM/CKEditor otomasyonu **kullanılmaz**. Buna karşılık
doğrulama yalnızca eklentinin kendi kurallarıyla değil, **sistemin kendi uçlarıyla
çapraz** yapılır:

1. **Aktarım:** içerik betiği, sayfanın kendi oturumuyla `Question/Insert` çağırır
   (`StatusId` her zaman `1`).
2. **Çapraz doğrulama:** `AuthorQuestion/CanAddQuestion`,
   `AuthorQuestion/GetRemainingQuestionCount` ve
   `Question/GetForAuthorByAuthorQuestionId` ile kota, tarih penceresi ve mevcut
   sorular sistemden okunur.
3. **API bekçisi (`api-guard.ts`):** her yanıt şema bekçisinden geçer. Beklenmedik
   biçimde (`process` alanı yok, dizi yerine nesne vb.) aktarım **durur** ve
   kullanıcı `docs/module-map.md`'deki **elle akışa** yönlendirilir.
4. **Zorunlu deneme kapısı (`trial.ts`):** ilk çalıştırmada **1 soru** taslak olarak
   aktarılır ve sistemden geri okunarak doğrulanır (soru kökü eşleşmesi, seçenek
   sayısı, doğru cevap indeksi, `ScoreId`). Kapı geçilmeden tam aktarım düğmesi
   **açılmaz**.

**Neden Seçenek B (form doldurma) reddedildi:** butonlarda `id`/`data-*` yok (yalnız
`class="btn btn-submit"`/`btn-update`), chunk adları hash'li, CKEditor örnekleri
(`option-{n}`) async yükleniyor ve her soru için `/question/add` → doldur → kaydet →
2 sn redirect döngüsü gerekiyor. Kırılgan ve test edilemez. Elle akış
`docs/module-map.md`'de **belge** olarak tutulur, kodu yazılmaz.

Her durumda **yalnızca Taslak (`StatusId 1`)** kaydedilir. Onaya gönderme
(`StatusId 2`) kullanıcının sistemde elle yaptığı ayrı bir adımdır; eklenti bunu
**hiç yapmaz** (`submitForApproval` metodu hiç yazılmaz).

## 5. Akış

```text
[Popup] JSON dosyası seç
   │  1. Şema doğrulama (zod) — hatalı satırlar listelenir, aktarım başlamaz
   ▼
[Popup] Atama seç  ◄── content script: GetForAuthorByUserId + Term/GetExamStages
   │  2. Kontroller: examStage eşleşmesi (kanonik sözlükten, D6), soru_grubu ↔ examStage,
   │     soru sayısı ≤ remainingQuestionCount, seçenek sayısı = optionCount, tek doğru cevap
   ▼
[Popup] Ön izleme (kuru çalıştırma): eşleşen/oluşturulacak konular, soru listesi,
   │    examStage eşleşme rozeti (exact / normalized / none)
   │  3. Kullanıcı eksik konuları toplu onaylar (D3)
   ▼
[Popup] DENEME KAPISI (D1/C — zorunlu)
   │  4. Yalnızca 1 soru taslak aktarılır → sistemden geri okunur →
   │     soru kökü / seçenek sayısı / doğru cevap / ScoreId doğrulanır
   │     Başarısızsa tam aktarım düğmesi AÇILMAZ, elle akışa yönlendirilir
   ▼
[Content script] Her soru için sırayla:
   │  a. Konu ID'sini çöz (önbellek → list → gerekirse add)
   │  b. Insert gövdesini kur, StatusId = 1
   │  c. POST → api-guard şema bekçisi; beklenmedik biçimde DUR
   │  d. Başarı/başarısızlık kaydı; istekler arası gecikme
   │  e. Hata → o soruyu atla, devam et (yeniden denenebilir liste)
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

## 7. Açık sorular — **TÜMÜ KAPANDI** (2026-10-27)

| # | Soru | Sonuç |
|---|---|---|
| 1 | Aktarım yöntemi: A mı B mi? | **KAPANDI — Seçenek C (hibrit).** API ile aktarım + sistemin kendi uçlarıyla çapraz doğrulama + `api-guard` + zorunlu 1 soruluk deneme kapısı. B (form doldurma) reddedildi, elle akış yalnızca `docs/module-map.md`'de belgelendi. Bkz. §4 ve `implementation_plan.md` D1 |
| 2 | `zorluk_seviyesi` ile `ScoreId` ölçeği aynı mı? | **KAPANDI — birebir aynı** (Bulgu 17). `{1:Çok Kolay, 2:Kolay, 3:Orta, 4:Zor, 5:Çok Zor}` ⇒ `zorluk_seviyesi ≡ ScoreId`, dönüşüm yok |
| 3 | Eksik konular otomatik mi oluşturulsun, onay mı istensin? | **KAPANDI — toplu onay** (D3). Ön izleme ekranında eksik konular listelenir, kullanıcı onaylamadan hiçbir konu oluşturulmaz; sessiz oluşturma yok |
| 4 | Excel girişi ilk sürümde gerekli mi? | **KAPANDI — hayır** (D4). v1 yalnızca JSON. Excel/CSV v2'ye bırakıldı (`papaparse` veya `exceljs`) |
| 5 | `secenekler_karistirilmasin` / `MixId` karşılığı var mı? | **KAPANDI — yok** (D7, Bulgu 28–29). Alan `deprecated`, `_schema.json`'dan çıkarıldı; `MixId` payload'da sabit `0` |
| 6 | Sınav türü taksonomisi nasıl eşlenecek? | **KAPANDI — iki katman** (D6, Bulgu 26–27). İç şemada 6 değerli `ExamType` enum korunur; `examStage` eşlemesinde birincil kaynak çalışma zamanındaki `Term/GetExamStages` sözlüğü. `ExamType/List` = "Program Türü" tuzağı belgelendi |
