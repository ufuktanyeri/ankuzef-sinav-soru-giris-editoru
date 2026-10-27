# Implementation Plan

## [Overview]

**Amaç:** `ankuzef-sinav-soru-gir/` altındaki, aynı hedefe hizmet eden iki ayrı proje taslağını (`ankuzef-sinav-soru-aktarici/` ve `sinav-soru-yukleme-araci/`) tek bir kök dizin proje yapısında birleştirmek ve bu yapıyı `https://ankuzefsinav.ankara.edu.tr` soru bankasına JSON soru havuzlarını **taslak (StatusId 1)** olarak aktaran, test edilebilir bir Chrome MV3 eklentisine dönüştürmek.

### Kapsam

Birleştirme **kök dizinde** yapılır (kullanıcı kararı, 2026-10-27). Kökte halihazırda duran `AGENTS.md` ve `CLAUDE.md` korunur ve yeni yapıya göre güncellenir; iki alt dizin içerikleri köke taşındıktan sonra **silinmez**, `legacy/` altına **salt okunur arşiv** olarak taşınır (D10 revizyonu). Tek `src/`, `docs/`, `data/` kök seviyesinde yaşar; `legacy/` derlemeye ve test taramasına girmez.

Bugünkü durum: **hiç çalıştırılabilir kod yok.** `ankuzef-sinav-soru-aktarici/` yalnızca taslak doküman + 2 dolu veri dosyası içeriyor; `sinav-soru-yukleme-araci/` ise statik bir `index.html`, bir CSS dosyası, üç doküman ve **tamamı 0 bayt** olan `src/app.js`, `src/rules-checker.js` ile 7 boş `data/*.json` dosyası içeriyor. Yani bu bir "kod birleştirme" değil, **iki dokümantasyon/veri kümesini tek bir mimariye indirgeyip sıfırdan kod yazma** işidir.

### Yüksek seviye yaklaşım

1. **Tek şema (Universal_Template_Schema):** İki projenin çelişen soru şemaları (`_schema.json` ↔ `guidelines-prep-questions.md` §10.2 ↔ mevcut `data/*.json`) tek bir zod şemasında birleştirilir; eski "çıplak dizi" biçimi geriye dönük uyumlu olarak korunur.
2. **Tek doğrulama katmanı:** `guidelines-prep-questions.md` §9/§10.6 ve `min.prep-guide.md` içindeki tüm kurallar saf TypeScript fonksiyonlarına (`src/core/validate.ts`) dönüştürülür. Bu katman hem eklentide hem ön izleme sayfasında ("rules-checker") kullanılır — böylece B projesinin boş `rules-checker.js` niyeti gerçek kodla karşılanır.
3. **Hibrit aktarım (D1/C):** Hedef sistemin üretim bundle'ı statik olarak çözümlendi ve `Question/Insert` sözleşmesi birebir çıkarıldı (bkz. "Doğrulanmış Bulgular"). Aktarım, sayfanın kendi oturumuyla bu uç noktaları çağıran bir content script üzerinden yapılır; DOM/CKEditor otomasyonu **kullanılmaz**. Buna karşılık **doğrulama sistemin kendi uçlarıyla çapraz yapılır** (`CanAddQuestion`, `GetRemainingQuestionCount`, `GetForAuthorByAuthorQuestionId`), her yanıt `api-guard.ts` şema bekçisinden geçer ve **ilk çalıştırmada zorunlu 1 soruluk deneme kapısı** (`trial.ts`) tam aktarımı kilitler. Beklenmedik yanıt biçiminde aktarım durur ve kullanıcı `docs/module-map.md`'deki elle akışa yönlendirilir.
4. **Tek ön izleme yüzeyi:** B projesinin elle yazılmış statik soru kartı sayfası, JSON'dan üretilen veri güdümlü bir `preview.html` giriş noktasına dönüştürülür (yazdırılabilir "soru giriş kaynağı" belgesi).
5. **Güvenlik ilkesi:** Eklenti hiçbir koşulda `StatusId 2` (Onaya Gönder) kullanmaz; kimlik bilgisi işlemez (KDS girişini kullanıcı yapar); aktarım öncesi kuru çalıştırma (dry-run), **zorunlu 1 soruluk deneme kapısı (D1/C)** ve açık kullanıcı onayı zorunludur. `examStage` eşlemesi statik tahminle değil, sistemin kendi `Term/GetExamStages` sözlüğüyle yapılır (D6).

### Doğrulanmış bulgular (2026-10-27, üretim bundle'ı statik analizi)

`algoritma.md`'deki 2026-10-26 DevTools bulguları bağımsız olarak doğrulandı ve genişletildi. İncelenen dosyalar: `/assets/index-C9-Rb77G.js` (150.769 bayt), `AssignmentsView-N_3E_Ism.js` (43.952), `AddView-BjDvdd4G.js` (43.695), `UpdateView-BZskPM1M.js`, `ListViewAuthor-AH2UbwsF.js` (25.856), `QuestionStatus-CbRmUgBY.js` (452), `QuestionGroup-CzKeCDwz.js` (177), `Scores-BLJxWG3P.js` (244), `htmlSanitizer-CZf3BYm1.js` (4.494).

| # | Bulgu | Kaynak |
|---|---|---|
| 1 | API tabanı `https://ankuzefsinavapi.ankara.edu.tr` (path ön eki **yok**) | `index-C9-Rb77G.js` @117760 (`const d=...`) |
| 2 | Ön yüz: Vue 3 + Vite SPA, Metronic/Keen teması (`KTAppSettings`), jQuery + select2 + toastr + SweetAlert + CKEditor 4 (`window.CKEDITOR`) | `/authorquestion/assignments` ham HTML |
| 3 | Oturum: `localStorage.auth_token` (JWT), `localStorage.userId`, `localStorage.roles` (JSON dizi) | `index-C9-Rb77G.js` @115719 |
| 4 | Her POST'ta `Authorization: Bearer <token>` **ve** gövde düz nesne ise gövdeye `Token: <token>` ekleniyor (FormData ise eklenmiyor) | `submitForm` composable @115940 |
| 5 | Yanıt sözleşmesi `{ process, description?, message?, data? }`; `process === false` → hata; HTTP 403 → `"Yetkiniz bulunmamaktadır."` | aynı composable |
| 6 | `POST AuthorQuestion/GetForAuthorByUserId` → `id, examId, examFieldId, fieldId, userId, questionCount, startDate, finishDate, examStartDate, examFinishDate, addDate, examName, fieldCode, fieldName, termYear, term, examStage, status, writtenQuestionCount, remainingQuestionCount, pendingQuestionCount, sessionId` | `AssignmentsView` @7176 |
| 7 | `POST ExamField/GetByExamAndField/{examId}/{fieldId}` → `data.optionCount`; yoksa **5** | `AddView` @25069 |
| 8 | `POST QuestionTopic/list` gövde `{fieldId, authorQuestionId}` → `data ?? questionTopics ?? list ?? dizi` | `AddView` @8257 |
| 9 | `POST QuestionTopic/add` gövde `{Description, FieldId}` → `data.Id ?? Id` | `AddView` @9477 |
| 10 | `POST QuestionGroup/by-author-question/{authorQuestionId}` → `{process, questionGroups[]}` | `AddView` @8113 |
| 11 | `POST Question/GetForAuthorByAuthorQuestionId/{authorQuestionId}` → `statusId, questionStatusId, description, questionTopicId, questionTopic, statusDescription, userId, scoreId, groupName` | `ListViewAuthor` @7553 |
| 12 | **Kota:** `statusId ∈ {2..8}` **ve** `userId === benim` sorular `questionCount`'a karşı sayılır. **Taslaklar (1) kotayı tüketmez.** | `AddView` @27963 |
| 13 | **Tarih penceresi:** `now ∈ [startDate, finishDate]` değilse `"Tarih aralığı dışında..."` + `/authorquestion/assignments`'a yönlendirme | `AddView` @26100 |
| 14 | Kullanıcı çözümleme: `POST Account/GetAuthUser/{authorQuestionId}` → `{id\|Id}`; yoksa `localStorage.userId`; yoksa JWT claim `nameid, sub, userId, UserId, uid` | `AddView` `st()` @32360 |
| 15 | `Question/Insert` gövdesi `{Question, QuestionOptions[], QuestionStatus, QuestionGroup}` (+ otomatik `Token`) — tam alan listesi `[Types]`'ta | `AddView` @30602–31446 |
| 16 | `StatusId 1` = "Taslak Olarak Kaydet"; `StatusId 2` = "Onaya Gönder" (*"Gönderim sonrasında değişiklik yapılamaz"* → **geri alınamaz**) | `AddView` `at()`/`ot()` @32334 |
| 17 | **Zorluk ölçeği birebir:** `{1:Çok Kolay, 2:Kolay, 3:Orta, 4:Zor, 5:Çok Zor}` ⇒ `zorluk_seviyesi ≡ ScoreId` (varsayılan 3). **`algoritma.md` açık soru #2 kapandı.** | `Scores-BLJxWG3P.js` |
| 18 | Sistem HTML izin listesi: `p, br, strong, b, em, i, u, s, strike, del, sub, sup, div, h1–h6, ul, ol, li, table, thead, tbody, tfoot, tr, th, td, caption, a[href,title,target,rel], img[src,alt,title,width,height], blockquote, pre, code, hr` | `htmlSanitizer-CZf3BYm1.js` (`V`) |
| 19 | `Ce()`/`we()` normalleştiricisi `<strong> <em> <b> <i> <u>` ve underline span'lerini **korur**, boş `p/div/br` siler, `margin-left` temizler | `AddView` @28404 |
| 20 | `/question/add` bağlamı `sessionStorage.aq_ctx = {authorQuestionId, examId, fieldId, fieldName, fieldCode}` | `AssignmentsView` @20063, `AddView` @7311 |
| 21 | CKEditor örnekleri `option-{0..n-1}`; soru kökü `Description`; ortak metin `commonTextEditorEditable`; zorluk `slider-id="questionDifficultySlider"` | `AddView` @30602, @42744 |
| 22 | Soru görseli yükleme uç noktası **yok** (yalnız `DocApproval/UploadFile(s)`); görsel ancak `<img src="data:...">` (base64) ile gömülebilir | endpoint taraması |
| 23 | `Question.MixId` 0/1 bayrak (`mixId: Number(MixId||0) ? 1 : 0`), varsayılan 0; arayüz etiketi çözülemedi → **Bulgu 28–29 ile kapandı: etiket yok, alan vestigial** | `UpdateView-BZskPM1M.js` @14626, @31065 |
| 24 | Sistemin `QuestionGroup` kavramı (ortak metinli grup) JSON'daki `soru_grubu` ile **ilgisizdir** | `QuestionGroup-CzKeCDwz.js` |
| 25 | `examStage` atama nesnesinde **metin açıklama**; arayüz `Jt()` ile yalnız `ARA` / `FİNAL\|FINAL` / `BÜTÜNLEME\|BUTUNLEME` tanır, gerisi `DİĞER`. (Bkz. Bulgu 26: kanonik sözlük ayrı uçtan gelir) | `AssignmentsView` @6507 (`Jt()`) |
| 26 | **`POST {base}/Term/GetExamStages`** → `{id, description}[]` kanonik sınav aşaması sözlüğü. `ExamStageSelect` bileşeni bu uçtan beslenir (`emptyText: "SINAV AŞAMASI SEÇİNİZ..."`, `selectId: "examStageSelect"`). ⇒ Sistemin kendi aşama listesi **çalışma zamanında çekilebilir**; statik eşleme zorunlu değil. | `ExamStageSelect-D3tH6vmi.js` (tam içerik), `index-C9-Rb77G.js` @119387 |
| 27 | **`POST {base}/ExamType/List` = "Program Türü"** (`emptyText: "Program Türü Seçiniz..."`) — sınav türü **değil**. JSON'daki "sınav türü" kavramı sistemin `ExamStage`'ine karşılık gelir, `ExamType`'ına değil. **Adlandırma tuzağı.** | `ExamTypeSelect-BWuFbY35.js`, `index-C9-Rb77G.js` @121147 |
| 28 | `"karıştır"` kelimesi `index`, `AddView`, `UpdateView`, `SettingsView`, `BookletView`, `ExamStageSelect`, `ExamTypeSelect` bundle'larında **0 kez**; `Shuffle`/`shuffle`/`Random`/`random` soru görünümlerinde **0**. | 7 bundle üzerinde regex taraması |
| 29 | `MixId` main bundle'da **hiç yok**. Yalnızca `UpdateView`'da 2 veri eşlemesi + **değişkene atanmamış (ölü) bir `computed`** ve `ListViewAuthor` varsayılan nesnesinde. Uygulamadaki tek "Mix" = `BookletTypeManagement/Mixer` (admin, kitapçık türü karıştırma) — soru düzeyiyle ilgisiz. ⇒ **`MixId` vestigial; "seçenekler karıştırılmasın" karşılığı kesin olarak yok.** | `UpdateView-BZskPM1M.js` @14626, `index-C9-Rb77G.js` @121147 |
| 30 | `optionCount`, `BookletView`'da "Seçenek Sayısı" sütunu olarak **`ExamField` düzeyinde** listeleniyor ⇒ sınav/alan bazlı sabit ayar, soru bazlı değil. | `BookletView-C7e1WI6I.js` @17525 |


### Kararlar (`algoritma.md` açık sorularının kapatılması)

| # | Karar | Gerekçe |
|---|---|---|
| **D1** | Aktarım yöntemi = **Seçenek C (hibrit)**. Aktarım API ile (`Question/Insert`); doğrulama sistemin kendi uçlarıyla çapraz (`AuthorQuestion/CanAddQuestion`, `AuthorQuestion/GetRemainingQuestionCount`, `Question/GetForAuthorByAuthorQuestionId`). **İlk çalıştırmada zorunlu "1 soruluk deneme modu":** tam aktarım düğmesi ancak deneme sorusu sistemde taslak olarak doğrulandıktan sonra açılır. API beklenmedik yanıt şeması dönerse (`process` alanı yok / bilinmeyen biçim) aktarım **durur** ve kullanıcı `docs/module-map.md`'deki elle akışa yönlendirilir. Form doldurma (DOM/CKEditor) kodu **yazılmaz**. | Bulgu 15–21 (sözleşme birebir) + Bulgu 30 (`optionCount` alan düzeyinde) + Bulgu 28–29 (istemci tarafında karıştırma/varyasyon mantığı yok ⇒ atlanan istemci doğrulaması az). DOM otomasyonu sürdürülemez: butonlarda `id`/`data-*` yok, chunk adları hash'li. |
| **D2** | `ScoreId = ek_ayarlar.zorluk_seviyesi` (1–1 eşleme, varsayılan 3). | Bulgu 17. |
| **D3** | Eksik konular **ön izleme ekranında toplu onay** ile oluşturulur; hiçbir koşulda sessiz oluşturulmaz. Varsayılan: onay kutuları işaretsiz. | Kullanıcı denetimi; sistemde konu silme geri alınamaz. |
| **D4** | v1 giriş biçimi **yalnız JSON**. Excel/CSV v2'ye ertelenir (gerekirse `papaparse`, `exceljs`). | `kaynak-raporu.md` §3; npm `xlsx@0.18.5` CVE-2023-30533 nedeniyle reddedildi. |
| **D5** | Eklenti **yalnız `StatusId 1`** gönderir. `Question/SubmitForApproval` hiçbir kod yolunda çağrılmaz. | Bulgu 16: geri alınamaz. |
| **D6** | Sınav türü taksonomisi = **iki katman**. İç şemada 6 değerli uluslararası `ExamType` enum (`MIDTERM, MAKEUP, FINAL, RESIT, GRADUATION_DEFICIT, MAX_DURATION_EXT`) **korunur**; `examStage` eşlemesinde **birincil kaynak çalışma zamanında çekilen `POST Term/GetExamStages` sözlüğüdür**, statik `normalizeExamStage` yalnızca çevrimdışı yedektir. Eşleşmeyen türler (`MAKEUP`, `GRADUATION_DEFICIT`, `MAX_DURATION_EXT`) için otomatik öneri **yoktur**; kullanıcı listeden elle seçer ve "sistemde bu tür için ayrı aşama yok" uyarısını görür. Son seçim her zaman kullanıcıdadır. | Bulgu 26 (kanonik aşama sözlüğü uç noktadan gelir) + Bulgu 27 (`ExamType/List` = **Program Türü**, sınav türü değil — adlandırma tuzağı) + Bulgu 25 (`Jt()` yalnız 3 grubu tanır). |
| **D7** | `ek_ayarlar.secenekler_karistirilmasin` **`deprecated`** olarak işaretlenir: okunur, aktarılmaz, `data/_schema.json`'dan **kaldırılır** ve `DEPRECATED_FIELD` kodlu `info` mesajı üretilir. `Question.MixId` payload'da **`0` olarak kalır** (site sözleşmesi birebir korunsun diye). Mevcut 40 soruda değer `false` olduğu için davranış farkı yoktur. `MixId: 1` **hiçbir koşulda gönderilmez**. | Bulgu 28–29: `"karıştır"` tüm incelenen bundle'larda 0; `MixId` main bundle'da yok, `UpdateView`'daki `computed` değişkene atanmamış (ölü kod); uygulamadaki tek "Mix" = `BookletTypeManagement/Mixer` (admin, kitapçık). ⇒ Sistemde soru düzeyinde karşılığı **kesin olarak yok**; belirsizlik kalmadı. |
| **D8** | Şemaya opsiyonel `soru_gorseli` alanı eklenir ama v1 aktarımı bu alan doluysa **uyarır ve aktarmaz**. Base64 gömme v2. | Bulgu 22. |
| **D9** | WXT yapılandırması: `srcDir: 'src'`, `outDir: 'dist'`, `publicDir: 'public'`, `entrypointsDir: 'entrypoints'` (varsayılan). | WXT 0.21.5 dokümanı; kullanıcının "tek `src/`" kararı. |
| **D10** | Eski dizinler **silinmez**; `legacy/` altına taşınır → `legacy/ankuzef-sinav-soru-aktarici/`, `legacy/sinav-soru-yukleme-araci/`. `AGENTS.md` ve `README.md`'de **"salt okunur arşiv — buradan kod okunmaz, yalnızca bulgu kaynağı"** olarak işaretlenir; `tsconfig.json` `include` listesine ve test taramasına alınmaz. Taşıma öncesi `git init` + ilk commit. `ankuzef-sinav-soru-aktarici/` üzerindeki `ReadOnly` özniteliği önce `attrib -r` ile temizlenir. | Depoda git yok (AGENTS.md); arşiv yerinde kalırsa `algoritma.md`/`kaynak-raporu.md` ve B'nin yönergeleri bulgu kaynağı olarak kaybolmaz. Kullanıcının "tek yapı" talebi kök dizindeki tek `src/`+`docs/`+`data/` ile zaten karşılanır. |

### Çakışma çözüm tablosu (iki proje arasındaki uyumsuzluklar)

| Konu | A projesi | B projesi | Birleşik çözüm |
|---|---|---|---|
| Sınav türü kümesi | `final`, `butunleme` (2) | `ara_sinav`, `final`, `butunleme` (3) + 7 İngilizce dosya adı | 6 değerli `ExamType` enum + `LegacySoruGrubu` eşlemesi; dosya adı ve `soru_grubu`'ndan türetme. **D6 revizyonu:** `examStage` eşlemesinde birincil kaynak çalışma zamanındaki `Term/GetExamStages` sözlüğü (Bulgu 26); statik eşleme yalnız çevrimdışı yedek |
| Dosya adı deseni | `{KOD}_Final_Sinavi.json`, `{KOD}_Butunleme_Sinavi.json` | `{KOD}_Ara_Sinav.json` + `{KOD}_Final_Sinavi.json` + `{KOD}_Butunleme_Sinavi.json` | B'nin deseni esas; ek olarak `Mazeret/Uc_Ders/Azami_Sure` varyantları tanınır |
| Zorluk ölçeği | JSON'da 2–4 kullanılmış, sistem eşlemesi "doğrulanacak" | 1–5 skala + Bloom eşlemesi (§5.1) | Bulgu 17 ile birebir; `guidelines` §5.1 tek kaynak |
| Zorluk dağılımı | Tanımsız | §5.2: 1–2 %20–40, 3 %40–60, 4–5 %10–20 (≤%20) **ve** `min.prep-guide.md`: 2 kolay / 16 orta / 2 zor | İki kural da uygulanır: `guidelines` **hata**, `min.prep-guide` **uyarı** (kurum yönergesi daha genel) |
| Olumsuz soru kökü | "Düz metin → HTML kaçışlı `<p>`" (etiketler kaçar!) | `<u>...</u>` **zorunlu** (§7.2) | `toQuestionHtml()` izinli satır içi etiketleri korur, gerisini kaçırır |
| Soru görseli | Yok | `index.html`'de `soru-gorsel` alanı var, JSON şemasında yok | Şemaya opsiyonel `soru_gorseli` eklenir; v1 aktarımı desteklemez (Bulgu 22) |
| Opsiyonel alanlar | Yok | `bloom_basamagi`, `soru_turu`, `tahmini_sure_sn` | Üçü de opsiyonel olarak şemaya alınır; sisteme aktarılmaz, yalnızca rapor/ön izlemede kullanılır |
| `data/` içeriği | 2 dolu dosya (20'şer soru) | 7 boş (0 bayt) dosya + `_schema.json` | Dolu dosyalar kök `data/`'ya taşınır; 0 bayt dosyalar silinir (JSON.parse bozulmasın), `_schema.json` genişletilir |
| `soru_grubu` anlamı | Sınav türü | Sınav türü | Aynı; sistemdeki `QuestionGroup` ile **karıştırılmayacak** (Bulgu 24) |

## [Types]

Tüm tipler TypeScript `strict: true` altında tanımlanır. Üç katman vardır: **(1) girdi şeması** (kullanıcının JSON'u), **(2) ANKUZEF API sözleşmesi** (bundle'dan birebir doğrulanmış), **(3) çalışma zamanı/rapor** tipleri.

### 1. Girdi şeması — `src/core/types.ts`

```ts
export const EXAM_TYPES = [
  'MIDTERM', 'MAKEUP', 'FINAL', 'RESIT', 'GRADUATION_DEFICIT', 'MAX_DURATION_EXT',
] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

/** Eski (TR) `soru_grubu` değerleri — geriye dönük uyumluluk. */
export const LEGACY_SORU_GRUPLARI = [
  'ara_sinav', 'mazeret', 'final', 'butunleme', 'uc_ders', 'azami_sure',
] as const;
export type LegacySoruGrubu = (typeof LEGACY_SORU_GRUPLARI)[number];

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
export type OptionLetter = (typeof OPTION_LETTERS)[number];

export const BLOOM_BASAMAKLARI = [
  'Bilgi', 'Kavrama', 'Uygulama', 'Analiz', 'Sentez', 'Değerlendirme',
] as const;
export type BloomBasamagi = (typeof BLOOM_BASAMAKLARI)[number];

export const SORU_TURLERI = [
  'tanim', 'hesaplama', 'madde_imli', 'grafik_yorumlama', 'kod', 'diger',
] as const;
export type SoruTuru = (typeof SORU_TURLERI)[number];

export interface EkAyarlar {
  zorluk_seviyesi: DifficultyLevel;      // ≡ ScoreId (Bulgu 17)
  /**
   * @deprecated D7 — sistemde karşılığı yok (Bulgu 28–29). Okunur ama aktarılmaz;
   * `data/_schema.json`'dan kaldırıldı. Mevcut dosyalarda `false` olarak kalabilir
   * (şema opsiyonel kabul eder), yeni dosyalarda yazılmamalıdır.
   */
  secenekler_karistirilmasin?: boolean;
  kaynak: string;                        // "Hafta X - <Konu> Ders Notu"
  bloom_basamagi?: BloomBasamagi;        // opsiyonel (B §10.2)
  soru_turu?: SoruTuru;                  // opsiyonel
  tahmini_sure_sn?: number;              // opsiyonel, pozitif tam sayı
}

export interface QuestionInput {
  konu: string;
  soru_grubu: LegacySoruGrubu;
  soru_koku: string;                     // <u>…</u> içerebilir (§7.2)
  soru_gorseli?: string | null;          // YENİ: base64 data URI veya dosya adı (v1: aktarılmaz)
  secenekler: Record<OptionLetter, string>;
  dogru_cevap: OptionLetter;
  ek_ayarlar: EkAyarlar;
}

/** Yeni, üst bilgili biçim. */
export interface ExamFileEnvelope {
  surum: 1;
  ders_kodu: string;                     // ör. "ZAUF1106"
  ders_adi?: string;
  exam_type: ExamType;
  donem?: string;                        // ör. "2025-2026 Güz"
  sorular: QuestionInput[];
}

/** Eski biçim (çıplak dizi) + yeni biçim birleşimi. */
export type ExamFileInput = QuestionInput[] | ExamFileEnvelope;

export type ExamFileFormat = 'legacy-array' | 'envelope';
```

### 2. Doğrulama / istatistik tipleri — `src/core/types.ts`

```ts
export type ValidationSeverity = 'error' | 'warning' | 'info';

export const VALIDATION_CODES = [
  'NOT_ARRAY', 'EMPTY_FILE', 'SCHEMA_INVALID', 'COUNT_NOT_20',
  'OPTION_KEYS_INVALID', 'OPTION_EMPTY', 'ANSWER_OUT_OF_RANGE',
  'DIFFICULTY_OUT_OF_RANGE', 'DIFFICULTY_DISTRIBUTION', 'MIN_GUIDE_DISTRIBUTION',
  'KAYNAK_PATTERN', 'DUPLICATE_STEM', 'BANNED_OPTION',
  'NEGATIVE_STEM_UNMARKED', 'DISALLOWED_MARKUP', 'GROUP_MISMATCH',
  'TOPIC_COVERAGE', 'WEEK_DISTRIBUTION', 'DURATION_OVER_BUDGET',
  'CROSS_ITEM_CLUE', 'IMAGE_UNSUPPORTED', 'DEPRECATED_FIELD',
  'OPTION_COUNT_MISMATCH', 'ASSIGNMENT_WINDOW', 'QUOTA_EXCEEDED',
  'NOT_ASSIGNMENT_OWNER', 'EXAM_STAGE_MISMATCH', 'EXAM_STAGE_UNKNOWN',
  'SESSION_MISSING', 'API_CONTRACT_MISMATCH', 'TRIAL_REQUIRED', 'TRIAL_FAILED',
] as const;
export type ValidationCode = (typeof VALIDATION_CODES)[number];

export interface ValidationIssue {
  index: number;              // soru indeksi; dosya geneli için -1
  field: string;              // ör. "ek_ayarlar.kaynak"
  code: ValidationCode;
  severity: ValidationSeverity;
  message: string;            // Türkçe, kullanıcıya gösterilir
}

export interface ExamStats {
  total: number;
  byDifficulty: Record<DifficultyLevel, number>;
  byTopic: Record<string, number>;
  byWeek: Record<number, number>;
  uniqueStems: number;
  bannedOptionHits: number;
  negativeStemCount: number;
  negativeStemUnmarked: number;
  estimatedTotalSeconds: number;
  distinctQuestionTypes: number;
}

export interface ValidationResult {
  ok: boolean;                // severity === 'error' olan issue yoksa true
  issues: ValidationIssue[];
  stats: ExamStats;
}
```


### 3. ANKUZEF API sözleşmesi — `src/api/types.ts`

Alan adları **bundle'dan birebir** alınmıştır (Bulgu 6, 7, 11, 15). Sistem hem PascalCase hem camelCase dönebildiği için okuma tipleri ikisini de opsiyonel taşır; normalize fonksiyonları tek biçime indirger.

```ts
export interface ApiEnvelope<T = unknown> {
  process: boolean;
  description?: string;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

/** Bulgu 6 — AuthorQuestion/GetForAuthorByUserId satırı. */
export interface AuthorQuestionAssignment {
  id: number;
  examId: number;
  examFieldId: number;
  fieldId: number;
  userId: number;
  questionCount: number;
  startDate: string;
  finishDate: string;
  examStartDate?: string;
  examFinishDate?: string;
  addDate?: string;
  examName: string;
  fieldCode?: string;
  fieldName: string;
  termYear?: string;
  term?: string;
  examStage?: string;
  status?: number;
  writtenQuestionCount: number;
  remainingQuestionCount: number;
  pendingQuestionCount: number;
  sessionId?: number;
}

export interface ExamFieldInfo { optionCount: number; raw: Record<string, unknown> }

/** Bulgu 8 — QuestionTopic/list satırı (PascalCase/camelCase ikili). */
export interface QuestionTopicRow {
  Id?: number;  id?: number;
  Description?: string;  description?: string;
  FieldId?: number;  fieldId?: number;
}
export interface QuestionTopic { id: number; description: string; fieldId: number }

/** Bulgu 10 — QuestionGroup/by-author-question satırı. */
export interface QuestionGroupRow {
  Id?: number;  GroupName?: string;  CommonText?: string;  QuestionCount?: number;
  id?: number;  groupName?: string;  commonText?: string;  questionCount?: number;
}

/** Bulgu 26 — Term/GetExamStages satırı (sistemin kanonik sınav aşaması sözlüğü). */
export interface ExamStageRow { id: number | string; description: string }

/** D6: çalışma zamanı sözlüğü birincil, statik eşleme çevrimdışı yedek. */
export interface ExamStageDictionary {
  source: 'remote' | 'static-fallback';
  fetchedAt?: string;
  rows: ExamStageRow[];
}

export interface ExamStageMatch {
  examType: ExamType;
  stage: ExamStageRow | null;          // null → sistemde karşılığı yok (DİĞER'e düşer)
  confidence: 'exact' | 'normalized' | 'none';
  reason: string;
}

/** Faz 3'ün saf kalması için yapısal arayüz; gerçek `AnkuzefClient` bu sözleşmeyi sağlar. */
export interface ExamStageSource { getExamStages(): Promise<ExamStageRow[]> }

/** Bulgu 27 — ExamType/List satırı. DİKKAT: bu "Program Türü"dür, sınav türü DEĞİL. */
export interface ProgramTypeRow { id: number | string; description: string }

/** Bulgu 11 — Question/GetForAuthorByAuthorQuestionId satırı. */
export interface ExistingQuestionRow {
  id?: number; Id?: number;
  description?: string; Description?: string;
  statusId?: number; StatusId?: number;
  questionStatusId?: number; QuestionStatusId?: number;
  statusDescription?: string;
  questionTopicId?: number; QuestionTopicId?: number;
  questionTopic?: string; QuestionTopic?: string;
  userId?: number; UserId?: number;
  scoreId?: number; ScoreId?: number;
  groupName?: string; GroupName?: string;
}
```

### 4. `Question/Insert` gövdesi — `src/api/types.ts`

Bulgu 15'in birebir karşılığı. Varsayılanlar `QuestionStatus-CbRmUgBY.js` (`g()`, `a()`) ve `QuestionGroup-CzKeCDwz.js` (`g()`) fabrika fonksiyonlarından alınmıştır.

```ts
export type InsertStatusId = 1 | 2;   // 1 = Taslak, 2 = Onaya Gönder. Eklenti YALNIZ 1 kullanır (D5).

export interface QuestionOptionPayload {
  Id: number;          // 1 tabanlı sıra (site: {Id: y+1})
  QuestionId: 0;       // insert sırasında her zaman 0
  Description: string; // HTML
  IsTrue: boolean;     // yalnızca bir tanesi true
}

export interface QuestionPayload {
  Id: 0;
  Description: string;            // HTML (soru kökü)
  QuestionTopicId: number | null;
  ExamId: number;
  FieldId: number;
  ExpDescription: string;         // ← ek_ayarlar.kaynak
  CopyQuestionId: 0;
  AddDate: string;                // ISO 8601
  AuthorQuestionId: number;
  UserId: number;
  GroupId: number | null;         // v1: null (QuestionGroup kullanılmıyor)
  OrderNo: number;                // v1: 0
  ScoreId: number;                // ← ek_ayarlar.zorluk_seviyesi (1..5)
  MixId: 0;                       // D7: her zaman 0
  QuestionGroupCount: 0;
}

export interface QuestionStatusPayload {
  Id: 0;
  AuthorQuestionId: number;
  StatusId: InsertStatusId;
  QuestionId: 0;
  Description: '';
  UserId: number;
  VersionId: 1;
  AddDate: string;
  UpdateDate: string;
  CopyQuestionId: 0;
  QuestionOrderNumber: 0;
}

export interface QuestionGroupPayload {
  Id: number;              // v1: 0
  GroupName: '';
  CommonText: '';
  ExamId: number;
  FieldId: number;
  AuthorQuestionId: number;
  UserId: number;
  AddDate: string;
  UpdateDate: null;
  IsActive: true;
  QuestionCount: 0;
}

export interface QuestionInsertRequest {
  Question: QuestionPayload;
  QuestionOptions: QuestionOptionPayload[];
  QuestionStatus: QuestionStatusPayload;
  QuestionGroup: QuestionGroupPayload;
  Token: string;           // transport tarafından otomatik eklenir (Bulgu 4)
}
```


### 5. Aktarım bağlamı, plan ve rapor — `src/transfer/types.ts`

```ts
export interface TransferContext {
  authorQuestionId: number;
  examId: number;
  fieldId: number;
  fieldName: string;
  fieldCode: string;
  userId: number;
  optionCount: number;        // Bulgu 7; varsayılan 5
  statusId: 1;                // sabit (D5)
  now: () => string;          // test edilebilirlik için enjekte edilir
}

export interface TopicPlanItem {
  konu: string;
  normalizedKey: string;      // trim + küçük harf + boşluk normalizasyonu
  existingId: number | null;
  willCreate: boolean;        // kullanıcı onayına bağlı (D3)
  approved: boolean;          // ön izlemede kullanıcı işaretledi
  questionIndexes: number[];
}

export interface PlannedQuestion {
  index: number;              // dosyadaki 0 tabanlı sıra
  question: QuestionInput;
  stemPreview: string;        // düz metin, ilk 120 karakter
  topic: string;
  scoreId: number;
  correctLetter: OptionLetter;
  payload: QuestionInsertRequest;
  decision: 'transfer' | 'skip-duplicate' | 'skip-blocked' | 'skip-unapproved-topic';
  duplicateOf?: number;       // ExistingQuestionRow id'si
  issues: ValidationIssue[];
}

export interface DryRunPlan {
  createdAt: string;
  courseCode: string;
  examType: ExamType;
  assignment: AuthorQuestionAssignment;
  context: TransferContext;
  topics: TopicPlanItem[];
  questions: PlannedQuestion[];
  validation: ValidationResult;
  quota: QuotaEvaluation;
  totals: { transfer: number; skipDuplicate: number; skipBlocked: number; skipUnapprovedTopic: number };
}

export interface QuotaEvaluation {
  ok: boolean;
  limit: number;              // assignment.questionCount
  consumed: number;           // statusId ∈ {2..8} && userId === me  (Bulgu 12)
  incoming: number;
  remainingAfter: number;
  message?: string;
}

export interface DateWindowEvaluation { ok: boolean; start: string; finish: string; message?: string }

export type TransferItemStatus =
  | 'pending' | 'success' | 'skipped-duplicate'
  | 'skipped-blocked' | 'skipped-unapproved-topic' | 'failed';

export interface TransferItemResult {
  index: number;
  status: TransferItemStatus;
  questionId?: number;        // Insert yanıtından doğrudan gelmez; doğrulama turunda eşlenir
  message?: string;
  attempts: number;
  at?: string;
}

export type TransferState = 'idle' | 'running' | 'paused' | 'done' | 'cancelled' | 'error';

export interface TransferProgress {
  authorQuestionId: number;
  courseCode: string;
  examType: ExamType;
  state: TransferState;
  total: number;
  done: number;
  currentIndex: number;
  startedAt: string;
  finishedAt?: string;
  items: TransferItemResult[];
  totals: { success: number; skipped: number; failed: number };
}

export interface TransferOptions {
  delayMs: number;            // varsayılan 700
  jitterMs: number;           // varsayılan 300 (0..jitter arası rastgele ek)
  maxAttempts: number;        // varsayılan 2
  stopOnConsecutiveFailures: number; // varsayılan 3
  verifyAfterRun: boolean;    // varsayılan true → listeyi yeniden çekip sayar
  requireTrialGate: boolean;  // varsayılan true (D1/C): ilk çalıştırmada 1 soruluk deneme zorunlu
  trialQuestionIndex: number; // varsayılan 0 — denemede aktarılacak soru
}

/** D1/C — hibrit doğrulama kapısı. */
export interface TrialResult {
  ok: boolean;
  questionIndex: number;
  inserted: boolean;                 // Question/Insert process === true
  verifiedOnServer: boolean;         // listAuthor'da taslak olarak göründü
  matchedByStemKey: boolean;         // normalizeStemKey eşleşmesi
  optionCountMatched: boolean;       // sistemdeki seçenek sayısı === plan
  correctAnswerPreserved: boolean;   // IsTrue indeksi korundu
  scoreIdMatched: boolean;           // ScoreId === zorluk_seviyesi
  issues: ValidationIssue[];
  at: string;
}

/** D1/C — API yanıt şeması bekçisi. Beklenmedik biçimde aktarımı durdurur. */
export interface ApiGuardResult {
  ok: boolean;
  endpoint: string;
  expected: string;                  // ör. "object with boolean 'process'"
  actual: string;
  action: 'continue' | 'halt-and-guide-to-manual-flow';
}

/** chrome.storage.local'a yazılabilir hâl (payload'lar küçültülür). */
export interface SerializedPlan {
  createdAt: string;
  courseCode: string;
  examType: ExamType;
  authorQuestionId: number;
  examId: number;
  fieldId: number;
  userId: number;
  optionCount: number;
  items: Array<{ index: number; topic: string; topicId: number | null; willCreateTopic: boolean; payload: QuestionInsertRequest }>;
}
```

### 6. Mesajlaşma — `src/messages.ts`

```ts
export type PopupToBackgroundMessage =
  | { type: 'SESSION_CHECK' }
  | { type: 'LIST_ASSIGNMENTS' }
  | { type: 'FETCH_EXAM_STAGES' }
  | { type: 'BUILD_PLAN'; authorQuestionId: number; file: ExamFileInput; fileName: string }
  | { type: 'APPROVE_TOPICS'; topicKeys: string[] }
  | { type: 'RUN_TRIAL'; plan: SerializedPlan }
  | { type: 'START_TRANSFER'; plan: SerializedPlan; options: Partial<TransferOptions> }
  | { type: 'PAUSE_TRANSFER' }
  | { type: 'RESUME_TRANSFER' }
  | { type: 'CANCEL_TRANSFER' }
  | { type: 'RETRY_FAILED' }
  | { type: 'GET_PROGRESS' }
  | { type: 'OPEN_PREVIEW'; file: ExamFileInput; fileName: string };

export type BackgroundToContentMessage =
  | { type: 'ANKUZEF_POST'; url: string; body?: unknown }
  | { type: 'ANKUZEF_SESSION' };

export type Message = PopupToBackgroundMessage | BackgroundToContentMessage;

export type MessageResult<T> = { ok: true; value: T } | { ok: false; error: string; code?: ValidationCode };
```

### 7. Oturum — `src/api/session.ts`

```ts
export interface SessionInfo {
  token: string;
  userId: number | null;
  roles: string[];
  isAuthenticated: boolean;
}
```


## [Files]

### Hedef dizin ağacı (kök: `d:\dev-projects\ankuzef-sinav-soru-gir\`)

```text
ankuzef-sinav-soru-gir/
├─ AGENTS.md                        # DEĞİŞTİRİLİR (yeni yapı + komutlar)
├─ CLAUDE.md                        # DEĞİŞTİRİLİR (AGENTS.md ile hizalı, kısa)
├─ README.md                        # YENİ — kurulum, kullanım, güvenlik notları
├─ implementation_plan.md           # YENİ — bu belge
├─ package.json                     # YENİ
├─ tsconfig.json                    # YENİ — extends ./.wxt/tsconfig.json
├─ wxt.config.ts                    # YENİ — srcDir/outDir + manifest
├─ vitest.config.ts                 # YENİ — WxtVitest()
├─ .gitignore                       # YENİ
├─ .editorconfig                    # YENİ — UTF-8, LF, 2 boşluk
├─ .antigravity/
│  └─ ankuzef.rules                 # A'dan TAŞINIR + çıktı yolları güncellenir
├─ public/
│  └─ img/.gitkeep                  # B'nin boş assets/img → buraya
├─ data/
│  ├─ README.md                     # YENİ — dosya adı deseni + exam_type tablosu
│  ├─ _schema.json                  # B'den TAŞINIR + GENİŞLETİLİR
│  ├─ ZAUF1106_Final_Sinavi.json    # A'dan TAŞINIR (değişmez, 20 soru)
│  ├─ ZAUF1106_Butunleme_Sinavi.json# A'dan TAŞINIR (değişmez, 20 soru)
│  └─ img/.gitkeep                  # YENİ — soru görselleri (v2)
├─ docs/
│  ├─ algoritma.md                  # A'dan TAŞINIR + GÜNCELLENİR (açık sorular kapatıldı)
│  ├─ kaynak-raporu.md              # A'dan TAŞINIR (sürümler 2026-10-27 yeniden doğrulandı)
│  ├─ api-sozlesmesi.md             # YENİ — Bulgu 1–30'un referans dökümü
│  ├─ module-map.md                 # YENİ — Module_Map çıktısı (rotalar, CKEditor, select2, elle akış)
│  ├─ extension-architecture-plan.md# YENİ — Extension_Architecture_Plan çıktısı
│  ├─ soru-yazim-yonergesi.md       # B guidelines-prep-questions.md → YENİDEN AD
│  ├─ sinav-turu-eslemesi.md        # B int-exam-standart.md → YENİDEN AD
│  ├─ degerlendirme-olcutleri.md    # B min.prep-guide.md → YENİDEN AD
│  └─ birlestirme-gunlugu.md        # YENİ — ne nereye taşındı, hangi çakışma nasıl çözüldü
├─ legacy/                          # D10 — SALT OKUNUR ARŞİV (kod buradan okunmaz, derlemeye girmez)
│  ├─ ankuzef-sinav-soru-aktarici/  # A projesinin özgün hâli (.antigravity, data, docs)
│  └─ sinav-soru-yukleme-araci/     # B projesinin özgün hâli (index.html, assets, docs)
├─ src/
│  ├─ entrypoints/
│  │  ├─ background.ts              # service worker — MessageRouter
│  │  ├─ ankuzef.content.ts         # matches: https://ankuzefsinav.ankara.edu.tr/*
│  │  ├─ popup/
│  │  │  ├─ index.html
│  │  │  ├─ main.ts
│  │  │  ├─ wizard.ts               # PopupWizard
│  │  │  └─ style.css
│  │  └─ preview/
│  │     ├─ index.html              # B'nin index.html'in veri güdümlü karşılığı
│  │     ├─ main.ts
│  │     └─ style.css               # B assets/css/exam.css → buraya (sınıf adları düzeltilir)
│  ├─ core/
│  │  ├─ types.ts                   # girdi şeması + doğrulama tipleri
│  │  ├─ schema.ts                  # zod şemaları + normalize
│  │  ├─ exam-type.ts               # ExamType türetme + examStage normalizasyonu
│  │  ├─ html.ts                    # escape / toQuestionHtml / normalizeStemKey
│  │  ├─ mapping.ts                 # JSON → Question/Insert eşlemesi
│  │  ├─ validate.ts                # tüm kurallar (guidelines §9/§10.6 + min.prep-guide)
│  │  ├─ stats.ts                   # ExamStats + dağılım kontrolleri
│  │  └─ dedupe.ts                  # mükerrer soru tespiti
│  ├─ api/
│  │  ├─ types.ts                   # ANKUZEF sözleşme tipleri
│  │  ├─ endpoints.ts               # API_BASE + EP sabitleri
│  │  ├─ errors.ts                  # AnkuzefClientError
│  │  ├─ transport.ts               # Transport arayüzü + content-script gerçeklemesi
│  │  ├─ session.ts                 # token/userId/roles okuma, JWT çözümü
│  │  ├─ payload.ts                 # site fabrika varsayılanları
│  │  └─ ankuzef-client.ts          # AnkuzefClient
│  ├─ transfer/
│  │  ├─ types.ts                   # plan/ilerleme/rapor tipleri
│  │  ├─ quota.ts                   # kota + tarih penceresi
│  │  ├─ plan-builder.ts            # PlanBuilder (dry-run)
│  │  ├─ api-guard.ts               # D1/C — API yanıt şeması bekçisi
│  │  ├─ trial.ts                   # D1/C — zorunlu 1 soruluk deneme kapısı
│  │  └─ transfer-runner.ts         # TransferRunner
│  ├─ preview/
│  │  ├─ renderer.ts                # PreviewRenderer
│  │  └─ rules-checker.ts           # B'nin rules-checker.js niyetinin gerçek kodu
│  ├─ messages.ts                   # Message tipleri + MessageRouter
│  ├─ storage.ts                    # chrome.storage.local öğeleri
│  └─ utils/
│     ├─ logger.ts                  # seviyeli, kapatılabilir log
│     ├─ dom.ts                     # createElement yardımcısı (bağımlılıksız)
│     ├─ timing.ts                  # sleep / jitter
│     └─ file.ts                    # File → text (BOM temizleme, UTF-8)
└─ tests/
   ├─ fixtures/
   │  ├─ legacy-array.json          # data/ZAUF1106_Final_Sinavi.json kopyası
   │  ├─ envelope.json              # yeni biçim
   │  ├─ invalid-missing-fields.json
   │  ├─ invalid-duplicate-stems.json
   │  ├─ invalid-banned-options.json
   │  ├─ invalid-kaynak.json
   │  ├─ invalid-difficulty.json
   │  ├─ underline-negative.json    # <u>değildir</u> içeren
   │  ├─ assignments.json           # Bulgu 6 biçiminde örnek atamalar
   │  └─ existing-questions.json    # Bulgu 11 biçiminde örnek mevcut sorular
   ├─ core/  (schema, exam-type, html, mapping, validate, stats, dedupe)
   ├─ api/   (transport, session, payload, ankuzef-client)
   ├─ transfer/ (quota, plan-builder, transfer-runner)
   └─ data/repository-data.test.ts  # depodaki tüm data/*.json dosyalarını doğrular
```

**Taşınan yollar (D10 — silme yok):** `ankuzef-sinav-soru-aktarici/` → `legacy/ankuzef-sinav-soru-aktarici/`, `sinav-soru-yukleme-araci/` → `legacy/sinav-soru-yukleme-araci/`. İçerikleri köke kopyalandıktan sonra özgün hâlleri arşiv olarak korunur. Taşıma öncesi `git init` + commit; `ReadOnly` özniteliği `attrib -r` ile temizlenir. `legacy/` derlemeye, `tsconfig.json` `include`'una ve test taramasına **alınmaz**.


### Dosya bazında taşıma / değişiklik / silme tablosu

| Eski yol | Yeni yol | İşlem |
|---|---|---|
| `ankuzef-sinav-soru-aktarici/.antigravity/ankuzef.rules` | `.antigravity/ankuzef.rules` | **TAŞI + GÜNCELLE**: `output_requirements` altına gerçek dosya yolları eklenir (`docs/module-map.md`, `data/_schema.json`, `docs/extension-architecture-plan.md`) |
| `ankuzef-sinav-soru-aktarici/data/ZAUF1106_Final_Sinavi.json` | `data/ZAUF1106_Final_Sinavi.json` | **TAŞI** (içerik değişmez; UTF-8 korunur) |
| `ankuzef-sinav-soru-aktarici/data/ZAUF1106_Butunleme_Sinavi.json` | `data/ZAUF1106_Butunleme_Sinavi.json` | **TAŞI** (içerik değişmez) |
| `ankuzef-sinav-soru-aktarici/docs/algoritma.md` | `docs/algoritma.md` | **TAŞI + GÜNCELLE**: §2 tablosu Bulgu 1–30 ile değiştirilir; §4'te karar D1 sabitlenir; §7 açık sorular "kapandı" olarak işaretlenir (D7 dâhil) |
| `ankuzef-sinav-soru-aktarici/docs/kaynak-raporu.md` | `docs/kaynak-raporu.md` | **TAŞI + GÜNCELLE**: sürümler 2026-10-27 yeniden doğrulandı notu; §6 iskelet yeni ağaçla değiştirilir |
| `sinav-soru-yukleme-araci/docs/guidelines-prep-questions.md` | `docs/soru-yazim-yonergesi.md` | **TAŞI + YENİDEN ADLA** (içerik değişmez; tek kaynak olarak `validate.ts`'e referans verilir) |
| `sinav-soru-yukleme-araci/docs/int-exam-standart.md` | `docs/sinav-turu-eslemesi.md` | **TAŞI + YENİDEN ADLA**; sonuna `exam-type.ts` eşleme tablosu eklenir |
| `sinav-soru-yukleme-araci/docs/min.prep-guide.md` | `docs/degerlendirme-olcutleri.md` | **TAŞI + YENİDEN ADLA**; `guidelines` ile çelişen maddeler "uyarı" seviyesine indirildiği notu eklenir |
| `sinav-soru-yukleme-araci/data/_schema.json` | `data/_schema.json` | **TAŞI + GENİŞLET**: `surum`, `ders_kodu`, `exam_type`, `soru_gorseli`, `bloom_basamagi`, `soru_turu`, `tahmini_sure_sn` |
| `sinav-soru-yukleme-araci/index.html` | `src/entrypoints/preview/index.html` + `src/preview/renderer.ts` | **YENİDEN YAZ**: statik tek kart → JSON'dan üretilen 20 kart; `sinav.css` kırık linki ve `matris_det_sorusu.png` hayalet referansı kaldırılır |
| `sinav-soru-yukleme-araci/assets/css/exam.css` | `src/entrypoints/preview/style.css` | **TAŞI + DÜZELT**: `.alan-etiket` ↔ markup'taki `.alan-label` uyumsuzluğu giderilir; `.sinav-turu` ve yazdırma (`@media print`) kuralları eklenir |
| `sinav-soru-yukleme-araci/assets/img/` (boş) | `public/img/.gitkeep` | **TAŞI** (placeholder) |
| `sinav-soru-yukleme-araci/assets/js/` (boş) | — | **SİL** |
| `sinav-soru-yukleme-araci/src/app.js` (0 bayt) | `src/entrypoints/preview/main.ts` + `src/preview/renderer.ts` | **SİL → YENİDEN YAZ** (taşınacak kod yok; niyet korunur) |
| `sinav-soru-yukleme-araci/src/rules-checker.js` (0 bayt) | `src/preview/rules-checker.ts` + `src/core/validate.ts` | **SİL → YENİDEN YAZ** |
| `sinav-soru-yukleme-araci/data/{mid-term,make-up,final,re-exam,three-course,max-duration,deficit}.json` (7 × 0 bayt) | — | **SİL**; adlandırma deseni `data/README.md` + `docs/sinav-turu-eslemesi.md`'ye yazılır (0 bayt dosyalar `JSON.parse`'ı bozar) |
| `AGENTS.md` (kök) | `AGENTS.md` | **GÜNCELLE**: "Project status" (artık kod var), komutlar (`npm run dev/build/test/compile`), yeni ağaç, veri biçimi (envelope + legacy) |
| `CLAUDE.md` (kök) | `CLAUDE.md` | **GÜNCELLE**: AGENTS.md ile hizalı kısa sürüm |

### Yeni yapılandırma dosyalarının içeriği

**`wxt.config.ts`**
```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',
  publicDir: 'public',
  manifest: {
    name: 'ANKUZEF Soru Aktarıcı',
    short_name: 'ANKUZEF Aktarıcı',
    description:
      'JSON soru havuzlarını ankuzefsinav.ankara.edu.tr soru bankasına taslak olarak aktarır.',
    permissions: ['storage', 'activeTab'],
    host_permissions: [
      'https://ankuzefsinav.ankara.edu.tr/*',
      'https://ankuzefsinavapi.ankara.edu.tr/*',
    ],
    action: { default_title: 'ANKUZEF Soru Aktarıcı' },
  },
  runner: {
    startUrls: ['https://ankuzefsinav.ankara.edu.tr/authorquestion/assignments'],
  },
});
```
> İzin gerekçesi: `storage` → ilerleme/rapor kalıcılığı; `activeTab` + iki host → content script'in sayfa kökeninden API çağrısı yapabilmesi. Ek izin **yok** (asgari izin ilkesi, `.antigravity/ankuzef.rules`).

**`tsconfig.json`**
```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "tests", "wxt.config.ts", "vitest.config.ts"],
  "exclude": ["legacy", "dist", ".output", ".wxt", "node_modules"]
}
```
> `exclude` içindeki `"legacy"` **D10'un garantisidir:** `include` zaten bir beyaz liste olduğu için arşiv derlemeye girmez, ama `.wxt/tsconfig.json`'dan miras alınan geniş bir `include`'u da bloklamak için açıkça dışlanır. `vitest.config.ts`'deki `include: ['tests/**/*.test.ts']` de arşivi taramaz.

**`vitest.config.ts`**
```ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
```
> `WxtVitest()` extension API'sini `@webext-core/fake-browser` ile bellek içi taklit eder; `browser.storage` testlerde gerçekten çalışır. Her testte `fakeBrowser.reset()` çağrılır.

**`.gitignore`**
```text
node_modules/
dist/
.output/
.wxt/
*.zip
.env
.env.*
stats.html
stats-*.json
```

**`.editorconfig`**
```ini
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
[*.md]
trim_trailing_whitespace = false
```


## [Functions]

### Mevcut fonksiyonlar

Depoda **hiçbir çalıştırılabilir fonksiyon yok** (`src/app.js` ve `src/rules-checker.js` 0 bayt). Dolayısıyla "değiştirilen" veya "kaldırılan" fonksiyon yoktur; aşağıdakilerin tamamı yenidir. Boş dosyaların niyeti şu şekilde karşılanır:

| Eski (boş) dosya | Karşılayan yeni fonksiyonlar |
|---|---|
| `sinav-soru-yukleme-araci/src/app.js` | `PreviewRenderer.render()`, `renderHeader()`, `renderQuestionCard()`, `renderOptionList()`, `bootstrapPreview()` |
| `sinav-soru-yukleme-araci/src/rules-checker.js` | `validateExamFile()`, `runRulesCheck()`, `renderValidationReport()`, `exportReportMarkdown()` + `validate.ts` içindeki kural fonksiyonları |

### `src/core/schema.ts` — şema ve normalizasyon

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `readJsonText` | `(text: string) => unknown` | BOM'u temizler, `JSON.parse` hatalarını `ValidationIssue`'ye çevirir |
| `detectFileFormat` | `(input: ExamFileInput) => ExamFileFormat` | Çıplak dizi mi envelope mı |
| `deriveCourseCode` | `(fileName: string) => string \| null` | `ZAUF1106_Final_Sinavi.json` → `ZAUF1106` |
| `deriveExamTypeFromFileName` | `(fileName: string) => ExamType \| null` | `_Ara_Sinav` → `MIDTERM`, `_Butunleme_Sinavi` → `RESIT` … |
| `deriveExamTypeFromGroup` | `(grubu: string) => ExamType \| null` | `final` → `FINAL`, `butunleme` → `RESIT` … |
| `normalizeExamFile` | `(input: ExamFileInput, fileName: string) => ExamFileEnvelope` | Eski biçimi envelope'a yükseltir; `ders_kodu`/`exam_type` türetir; `soru_grubu` tutarlılığını denetler |
| `parseExamFile` | `(raw: unknown, fileName: string) => ParseOutcome` | zod doğrulaması; `type ParseOutcome = { ok: true; envelope: ExamFileEnvelope } \| { ok: false; issues: ValidationIssue[] }` |
| `questionInputSchema` | `z.ZodType<QuestionInput>` | Tek soru zod şeması (B §10.2 + D8 opsiyonel alanlar) |
| `examEnvelopeSchema` | `z.ZodType<ExamFileEnvelope>` | Envelope zod şeması |
| `examFileInputSchema` | `z.ZodType<ExamFileInput>` | `z.union([z.array(questionInputSchema), examEnvelopeSchema])` |
| `zodIssuesToValidationIssues` | `(err: z.ZodError, baseIndex: number) => ValidationIssue[]` | zod yolu → `field` + Türkçe mesaj |

### `src/core/exam-type.ts` — sınav türü eşlemesi

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `examTypeLabel` | `(t: ExamType, lang?: 'tr' \| 'en') => string` | `docs/sinav-turu-eslemesi.md` tablosu |
| `examTypeFromFileName` | `(fileName: string) => ExamType \| null` | `FILE_NAME_TOKENS` regex listesine göre |
| `examTypeFromSoruGrubu` | `(grubu: string) => ExamType \| null` | `LEGACY_TO_EXAM_TYPE` |
| `normalizeExamStage` | `(examStage?: string) => ExamStageGroup` | Bulgu 25'teki `Jt()` davranışını birebir taklit: `ARA` / `FINAL` / `BUTUNLEME` / `DIGER` (Türkçe `İ/i` duyarsız) |
| `examTypeToStageGroup` | `(t: ExamType) => ExamStageGroup \| null` | `MIDTERM→ARA`, `FINAL→FINAL`, `RESIT→BUTUNLEME`, diğerleri `null` |
| `buildStaticStageFallback` | `() => ExamStageDictionary` | **D6 çevrimdışı yedeği:** `source: 'static-fallback'`, `rows` = `Jt()`'nin tanıdığı 3 grup + `DİĞER` |
| `fetchExamStageDictionary` | `(client: AnkuzefClient) => Promise<ExamStageDictionary>` | **D6 birincil kaynak:** `POST Term/GetExamStages` (Bulgu 26). Uç hata verirse `buildStaticStageFallback()`'e düşer ve `source: 'static-fallback'` işaretlenir |
| `matchExamStage` | `(t: ExamType, dict: ExamStageDictionary) => ExamStageMatch` | `confidence: 'exact'` (açıklama birebir) → `'normalized'` (`normalizeExamStage` grubu eşleşir) → `'none'` (sistemde karşılığı yok, `DİĞER`'e düşer) |
| `warnUnmatchedExamType` | `(m: ExamStageMatch) => ValidationIssue \| null` | `confidence === 'none'` ise `EXAM_STAGE_UNKNOWN` uyarısı: "sistemde bu tür için ayrı aşama yok" |
| `rankAssignmentCandidates` | `(t: ExamType, list: AuthorQuestionAssignment[], dict: ExamStageDictionary) => AssignmentCandidate[]` | Puanlama: `matchExamStage` + atamanın `examStage` açıklaması eşleşmesi (+3), `fieldCode` ders kodu eşleşmesi (+2), tarih penceresi açık (+1), `remainingQuestionCount > 0` (+1) |
| `isAssignmentWindowOpen` | `(a: AuthorQuestionAssignment, now?: Date) => boolean` | `startDate ≤ now ≤ finishDate` |

```ts
export type ExamStageGroup = 'ARA' | 'FINAL' | 'BUTUNLEME' | 'DIGER';
export interface AssignmentCandidate {
  assignment: AuthorQuestionAssignment;
  score: number;
  reasons: string[];
  stageMatch: boolean;
  windowOpen: boolean;
}
```


### `src/core/html.ts` — metin → HTML dönüşümü

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `escapeHtml` | `(text: string) => string` | `& < > " '` kaçışı |
| `toQuestionHtml` | `(input: string) => string` | **Kritik.** İzinli satır içi etiketleri (`u,b,i,strong,em,sub,sup,s,strike,del`) yer tutucuyla korur → kalan her şeyi kaçırır → satır ayrımına göre `<p>…</p>` üretir → yer tutucuları geri koyar. `algoritma.md`'deki "düz metin → tamamen kaçır" yaklaşımını düzeltir (§7.2 `<u>` gereksinimi) |
| `htmlToPlainText` | `(html: string) => string` | Etiketleri sıyırır, entity'leri çözer (ön izleme + mükerrer tespiti) |
| `normalizeStemKey` | `(text: string) => string` | Türkçe karakterleri ASCII'ye indirger (`ı→i`, `İ→i`, `ş→s`, `ğ→g`, `ü→u`, `ö→o`, `ç→c`), küçük harf, noktalama ve ardışık boşluk temizliği → mükerrer anahtarı |
| `findDisallowedMarkup` | `(text: string) => DisallowedTag[]` | Bulgu 18 izin listesi dışındaki etiketleri raporlar |
| `hasNegativeStem` | `(text: string) => boolean` | `NEGATIVE_STEM_WORDS` taraması |
| `isNegativeMarked` | `(text: string) => boolean` | Olumsuz kelime `<u>…</u>` içinde mi (§7.2) |
| `splitParagraphs` | `(text: string) => string[]` | Boş satır / tek satır ayrımı |
| `matchBannedOption` | `(option: string) => RegExp \| null` | "Hepsi", "Yukarıdakilerin hepsi", "Hiçbiri", "Yukarıdakilerin hiçbiri" (§7.3) |

```ts
export interface DisallowedTag { tag: string; index: number }
export const SITE_ALLOWED_TAGS: readonly string[];   // Bulgu 18
export const PRESERVED_INLINE_TAGS: readonly string[];
export const NEGATIVE_STEM_WORDS: readonly string[]; // 'değildir','yanlıştır','olmayan','hariç','değildir'…
export const BANNED_OPTION_PATTERNS: readonly RegExp[];
```

### `src/core/mapping.ts` — JSON → sistem eşlemesi

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `difficultyToScoreId` | `(level: DifficultyLevel) => number` | Kimlik eşlemesi (D2 / Bulgu 17); 1–5 dışına çıkarsa `3` |
| `letterToIndex` | `(letter: OptionLetter) => number` | `A→0 … E→4` |
| `indexToLetter` | `(index: number) => OptionLetter` | Ters eşleme (ön izleme/rapor) |
| `buildQuestionOptions` | `(secenekler: Record<OptionLetter,string>, dogru: OptionLetter, optionCount: number) => QuestionOptionPayload[]` | Site davranışı: `Id = i+1`, `IsTrue = (i === letterToIndex(dogru))`. `optionCount < 5` ise fazla seçenekler **hata** üretir (sessiz kırpma yok) |
| `buildQuestionPayload` | `(q: QuestionInput, ctx: TransferContext, topicId: number \| null) => QuestionPayload` | Bulgu 15 alanları; `ExpDescription = ek_ayarlar.kaynak`; `ScoreId = difficultyToScoreId(...)`; `MixId: 0` (D7) |
| `buildQuestionStatusPayload` | `(ctx: TransferContext) => QuestionStatusPayload` | `StatusId: 1` sabit (D5), `VersionId: 1` |
| `buildQuestionGroupPayload` | `(ctx: TransferContext) => QuestionGroupPayload` | `Id: 0`, boş `GroupName`/`CommonText` (Bulgu 24) |
| `buildInsertRequest` | `(q: QuestionInput, ctx: TransferContext, topicId: number \| null) => QuestionInsertRequest` | Dört alt nesneyi birleştirir; `Token` alanı transport'a bırakılır |
| `buildTopicListBody` | `(ctx: TransferContext) => { fieldId: number; authorQuestionId: number }` | Bulgu 8 |
| `buildTopicAddBody` | `(konu: string, fieldId: number) => { Description: string; FieldId: number }` | Bulgu 9 |
| `checkExamStageConsistency` | `(q: QuestionInput, a: AuthorQuestionAssignment) => ValidationIssue \| null` | `soru_grubu` ↔ `examStage` (uyarı seviyesi; Bulgu 25 nedeniyle hata değil) |

### `src/core/stats.ts` — istatistik ve dağılım

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `computeStats` | `(questions: QuestionInput[]) => ExamStats` | Zorluk/konu/hafta dağılımları, benzersiz kök sayısı, yasaklı seçenek isabeti, olumsuz kök sayımı, tahmini süre |
| `parseHafta` | `(kaynak: string) => number \| null` | `"Hafta 12 - … Ders Notu"` → `12` |
| `weekDistribution` | `(questions: QuestionInput[]) => Record<number, number>` | §3.2/§3.3 hafta dağılımı denetimi için |
| `checkGuidelineDistribution` | `(stats: ExamStats) => ValidationIssue \| null` | §5.2: 1–2 %20–40, 3 %40–60, 4–5 %10–20 ve 4–5 toplamı ≤ %20 (**hata**) |
| `checkMinGuideDistribution` | `(stats: ExamStats) => ValidationIssue \| null` | `min.prep-guide.md`: 2 kolay / 16 orta / 2 zor (**uyarı** — çakışma çözüm tablosu) |
| `checkWeekDistribution` | `(stats: ExamStats, examType: ExamType) => ValidationIssue[]` | Ara sınav: Hafta 1–6; Final/Bütünleme: 1–6 → 1'er, 7–13 → 2'şer |
| `checkDurationBudget` | `(stats: ExamStats) => ValidationIssue \| null` | Toplam `tahmini_sure_sn` ≤ 1800 sn (30 dk) |

### `src/core/dedupe.ts` — mükerrer önleme

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `buildDedupeIndex` | `(rows: ExistingQuestionRow[]) => Map<string, number>` | `normalizeStemKey(htmlToPlainText(description))` → soru `id` |
| `findDuplicate` | `(stem: string, index: Map<string, number>) => number \| undefined` | Dosya içi + sistemdeki mevcut sorulara karşı |
| `buildInternalDedupeIndex` | `(questions: QuestionInput[]) => Map<string, number[]>` | Dosya içi tekrarlar (§10.6 son madde) |
| `summarizeExisting` | `(rows: ExistingQuestionRow[], userId: number) => ExistingSummary` | `{ total, drafts, quotaConsuming, mine }` |

```ts
export interface ExistingSummary { total: number; drafts: number; quotaConsuming: number; mine: number }
```


### `src/core/validate.ts` — kural motoru

Kaynak: `docs/soru-yazim-yonergesi.md` §9 kontrol listesi + §10.6 validasyon kuralları + `docs/degerlendirme-olcutleri.md`.

```ts
export interface RuleContext {
  envelope: ExamFileEnvelope;
  optionCount?: number;                 // Bulgu 7 (aktarım öncesi bilinir)
  assignment?: AuthorQuestionAssignment;
  existing?: ExistingQuestionRow[];
  userId?: number;
  now?: Date;
}
export type Rule = (ctx: RuleContext) => ValidationIssue[];
export const STRUCTURAL_RULES: readonly Rule[];   // dosya/şema düzeyi
export const CONTENT_RULES: readonly Rule[];      // yönerge kuralları
export const TRANSFER_RULES: readonly Rule[];     // sisteme özgü ön koşullar
export const KAYNAK_PATTERN: RegExp;              // /^Hafta\s+(?:1[0-3]|[1-9])\s+-\s+\S.*\s+Ders\s+Notu$/
```

| Kural fonksiyonu | Kod | Seviye | Kaynak |
|---|---|---|---|
| `ruleCountIs20` | `COUNT_NOT_20` | error | §1, §10.6 |
| `ruleOptionKeys` | `OPTION_KEYS_INVALID` | error | §7.4, §10.6 (tam olarak A–E) |
| `ruleOptionsNonEmpty` | `OPTION_EMPTY` | error | §10.6 |
| `ruleAnswerInRange` | `ANSWER_OUT_OF_RANGE` | error | §10.6 |
| `ruleSingleCorrectAnswer` | `ANSWER_OUT_OF_RANGE` | error | `min.prep-guide` §3 (tek doğru) |
| `ruleDifficultyRange` | `DIFFICULTY_OUT_OF_RANGE` | error | §5.1, §10.6 (1–5 tam sayı) |
| `ruleDifficultyDistribution` | `DIFFICULTY_DISTRIBUTION` | error | §5.2/§5.3 |
| `ruleMinGuideDistribution` | `MIN_GUIDE_DISTRIBUTION` | warning | `min.prep-guide` §2 |
| `ruleKaynakPattern` | `KAYNAK_PATTERN` | error | §10.3, §10.6 |
| `ruleUniqueStems` | `DUPLICATE_STEM` | error | §4.1, §10.6 |
| `ruleBannedOptions` | `BANNED_OPTION` | error | §7.3, `min.prep-guide` §3 |
| `ruleNegativeUnderline` | `NEGATIVE_STEM_UNMARKED` | error | §7.2, `min.prep-guide` §4 |
| `ruleDisallowedMarkup` | `DISALLOWED_MARKUP` | warning | Bulgu 18 |
| `ruleGroupConsistency` | `GROUP_MISMATCH` | error | §10.6 (dosya adı ↔ `soru_grubu`) |
| `ruleTopicCoverage` | `TOPIC_COVERAGE` | warning | §2 (orantılı konu dağılımı) |
| `ruleWeekDistribution` | `WEEK_DISTRIBUTION` | warning | §3.1–§3.3 |
| `ruleDurationBudget` | `DURATION_OVER_BUDGET` | warning | §9, `min.prep-guide` §1 |
| `ruleCrossItemClue` | `CROSS_ITEM_CLUE` | warning | §4.3 (sezgisel: bir sorunun seçeneği başka sorunun doğru cevabıyla birebir aynıysa) |
| `ruleImageUnsupported` | `IMAGE_UNSUPPORTED` | warning | D8 / Bulgu 22 |
| `ruleDeprecatedFields` | `DEPRECATED_FIELD` | info | D7 / Bulgu 28–29 — `secenekler_karistirilmasin` varsa "sistemde karşılığı yok, aktarılmayacak" bilgisi |
| `ruleOptionCountMatch` | `OPTION_COUNT_MISMATCH` | error | Bulgu 7 (`optionCount ≠ 5`) |
| `ruleAssignmentWindow` | `ASSIGNMENT_WINDOW` | error | Bulgu 13 |
| `ruleQuota` | `QUOTA_EXCEEDED` | error | Bulgu 12 |
| `ruleOwnership` | `NOT_ASSIGNMENT_OWNER` | error | Bulgu 6/14 (`assignment.userId ≠ ctx.userId`) |
| `ruleExamStage` | `EXAM_STAGE_MISMATCH` | warning | Bulgu 25–26 / D6 — `soru_grubu` ↔ seçilen atamanın `examStage` açıklaması |
| `ruleExamStageUnknown` | `EXAM_STAGE_UNKNOWN` | warning | D6 — `matchExamStage().confidence === 'none'` ise "sistemde bu sınav türü için ayrı aşama yok, `DİĞER` grubuna düşebilir" |
| `ruleTrialGate` | `TRIAL_REQUIRED` | error | D1/C — `requireTrialGate` açıkken deneme kapısı geçilmeden tam aktarım engellenir |

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `validateExamFile` | `(ctx: RuleContext) => ValidationResult` | Üç kural kümesini sırayla çalıştırır; `STRUCTURAL_RULES` hata verirse diğerleri atlanır |
| `mergeIssues` | `(...lists: ValidationIssue[][]) => ValidationIssue[]` | Birleştirir, index→severity→code sıralar |
| `sortIssues` | `(issues: ValidationIssue[]) => ValidationIssue[]` | Sunum sırası |
| `issueCountBySeverity` | `(issues: ValidationIssue[]) => Record<ValidationSeverity, number>` | Özet sayaçları |


### `src/api/endpoints.ts`

| Sabit / Fonksiyon | İmza | Amaç |
|---|---|---|
| `API_BASE` | `string` | `'https://ankuzefsinavapi.ankara.edu.tr'` (Bulgu 1) |
| `EP` | `as const` nesne | Doğrulanmış uç noktalar: `LOGIN_CHECK_IS_LOGIN`, `AUTHOR_QUESTION_GET_FOR_AUTHOR_BY_USER_ID`, `AUTHOR_QUESTION_CAN_ADD_QUESTION`, `AUTHOR_QUESTION_GET_REMAINING_QUESTION_COUNT`, `EXAM_FIELD_GET_BY_EXAM_AND_FIELD`, `QUESTION_TOPIC_LIST`, `QUESTION_TOPIC_ADD`, `QUESTION_GROUP_BY_AUTHOR_QUESTION`, `QUESTION_INSERT`, `QUESTION_GET_FOR_AUTHOR_BY_AUTHOR_QUESTION_ID`, `QUESTION_SUBMIT_FOR_APPROVAL` (**tanımlı ama hiçbir kod yolunda çağrılmaz — D5**), `ACCOUNT_GET_AUTH_USER`, `SCORES_GET_ALL`, `TERM_GET_EXAM_STAGES` = `Term/GetExamStages` (**D6 birincil aşama sözlüğü — Bulgu 26**), `EXAM_TYPE_LIST` = `ExamType/List` (**"Program Türü", sınav türü DEĞİL — Bulgu 27; v1'de çağrılmaz, yalnız adlandırma tuzağı referansı olarak tanımlı**) |
| `withParam` | `(template: string, params: Record<string, string \| number>) => string` | `{authorQuestionId}` yer tutucularını doldurur |
| `absoluteUrl` | `(path: string) => string` | `API_BASE + '/' + path` |

### `src/api/errors.ts`

| Fonksiyon / Sınıf | İmza | Amaç |
|---|---|---|
| `AnkuzefClientError` | `class extends Error` | `{ status?: number; endpoint: string; body?: unknown }` |
| `isSessionExpired` | `(err: unknown) => boolean` | 401 / `CheckIsLogin` false |
| `isForbidden` | `(err: unknown) => boolean` | 403 → `"Yetkiniz bulunmamaktadır."` (Bulgu 5) |
| `isTransient` | `(err: unknown) => boolean` | Ağ hatası / 429 / 5xx → yeniden denenebilir |

### `src/api/transport.ts`

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `Transport` | `interface { post<T>(url: string, body?: unknown): Promise<T> }` | İçerik betiği ile soyutlama; testlerde sahte gerçekleme |
| `createContentScriptTransport` | `(opts: { getToken(): string \| null; timeoutMs?: number }) => Transport` | Bulgu 4'ü birebir uygular: `Authorization: Bearer`, düz nesne gövdeye `Token` enjeksiyonu, `Content-Type: application/json` |
| `unwrapEnvelope` | `<T>(json: unknown, endpoint: string) => T` | `process === false` → `AnkuzefClientError`; `data ?? questionTopics ?? list ?? dizi` öncelik sırası (Bulgu 8) |
| `shouldMergeToken` | `(body: unknown) => boolean` | `typeof body === 'object' && body !== null && !Array.isArray(body) && !(body instanceof FormData)` |

### `src/api/session.ts`

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `readSession` | `() => SessionInfo \| null` | `localStorage.auth_token` / `userId` / `roles` (Bulgu 3) |
| `decodeJwtPayload` | `(token: string) => Record<string, unknown> \| null` | base64url + `decodeURIComponent` (site `st()` ile aynı) |
| `userIdFromToken` | `(token: string) => number \| null` | claim sırası `nameid, sub, userId, UserId, uid` (Bulgu 14) |
| `resolveUserId` | `(client: AnkuzefClient, authorQuestionId: number) => Promise<number>` | `Account/GetAuthUser` → `localStorage.userId` → JWT (Bulgu 14) |
| `isSessionActive` | `(client: AnkuzefClient) => Promise<boolean>` | `Login/CheckIsLogin`; false ise popup kullanıcıyı KDS girişine yönlendirir (kimlik bilgisi **işlenmez**) |
| `requireSession` | `() => SessionInfo` | Yoksa `SESSION_MISSING` koduyla fırlatır |


### `src/api/payload.ts` — site fabrika varsayılanları

| Fonksiyon | İmza | Kaynak |
|---|---|---|
| `defaultQuestionOption` | `(id: number) => QuestionOptionPayload` | `AddView.se()` → `{Id, QuestionId:0, Description:'', IsTrue:false}` |
| `defaultQuestionDraft` | `() => QuestionPayload` | `QuestionStatus-CbRmUgBY.g()` → `MixId:0`, `QuestionGroupCount:0`, `ScoreId:3` |
| `defaultQuestionStatus` | `() => QuestionStatusPayload` | `QuestionStatus-CbRmUgBY.a()` |
| `defaultQuestionGroup` | `() => QuestionGroupPayload` | `QuestionGroup-CzKeCDwz.g()` → `IsActive:true`, `UpdateDate:null` |
| `QUOTA_CONSUMING_STATUS_IDS` | `ReadonlySet<number>` | `new Set([2,3,4,5,6,7,8])` (Bulgu 12) |
| `isoNow` | `() => string` | `new Date().toISOString()` |

### `src/transfer/quota.ts`

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `countQuotaConsuming` | `(rows: ExistingQuestionRow[], userId: number) => number` | `statusId ∈ {2..8} && userId === me` (Bulgu 12) |
| `evaluateQuota` | `(a: AuthorQuestionAssignment, rows: ExistingQuestionRow[], userId: number, incoming: number) => QuotaEvaluation` | `limit = a.questionCount`; site davranışı `if (Q > 0 && ye >= Q)` olduğu için `limit === 0` "limitsiz" sayılır |
| `evaluateDateWindow` | `(a: AuthorQuestionAssignment, now?: Date) => DateWindowEvaluation` | Bulgu 13 |
| `evaluateOwnership` | `(a: AuthorQuestionAssignment, userId: number) => ValidationIssue \| null` | Bulgu 6 |

### `src/transfer/plan-builder.ts`

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `buildTopicPlan` | `(questions: QuestionInput[], topics: QuestionTopic[]) => TopicPlanItem[]` | Konu adlarını normalize edip mevcutlarla eşler; eksikleri `willCreate: true` işaretler (D3) |
| `matchTopicByName` | `(konu: string, topics: QuestionTopic[]) => QuestionTopic \| null` | Tam eşleşme → normalize eşleşme → `null` |
| `resolveTopicIds` | `(plan: TopicPlanItem[], client: AnkuzefClient, fieldId: number) => Promise<TopicPlanItem[]>` | Yalnızca `approved === true` olanlar için `QuestionTopic/add` çağırır |
| `serializePlan` | `(plan: DryRunPlan) => SerializedPlan` | `chrome.storage.local`'a yazılabilir küçültülmüş biçim |
| `deserializePlan` | `(s: SerializedPlan) => SerializedPlan` | Şema denetimli geri okuma |

### `src/transfer/api-guard.ts` — D1/C yanıt şeması bekçisi

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `guardEnvelope` | `(json: unknown, endpoint: string) => ApiGuardResult` | `{process: boolean}` bekler; yoksa `action: 'halt-and-guide-to-manual-flow'` (Bulgu 5) |
| `guardAssignmentList` | `(json: unknown) => ApiGuardResult` | Dizi + `id`/`examId`/`fieldId` alanları (Bulgu 6) |
| `guardInsertResult` | `(json: unknown) => ApiGuardResult` | `process === true` + `description`/`message` metni (Bulgu 15) |
| `guardExistingList` | `(json: unknown) => ApiGuardResult` | Dizi + `statusId`/`description` alanları (Bulgu 11) |
| `guardExamStages` | `(json: unknown) => ApiGuardResult` | Dizi + `{id, description}` (Bulgu 26); başarısızsa `fetchExamStageDictionary` yedeğe düşer |
| `describeActual` | `(json: unknown) => string` | Hata mesajı için insan okunur özet (tür + ilk 5 anahtar) |
| `manualFlowGuidance` | `(endpoint: string) => string` | `docs/module-map.md`'deki elle akışa yönlendiren Türkçe metin |

### `src/transfer/trial.ts` — D1/C zorunlu deneme kapısı

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `selectTrialQuestion` | `(plan: SerializedPlan, index?: number) => SerializedPlan['items'][number] \| null` | `trialQuestionIndex` (varsayılan 0); `decision === 'transfer'` olan ilk soru |
| `runTrial` | `(client: AnkuzefClient, plan: SerializedPlan, opts: TransferOptions) => Promise<TrialResult>` | Tek soruyu `StatusId 1` ile ekler → `listExistingQuestions` ile geri okur → `normalizeStemKey` eşleşmesi, seçenek sayısı, `IsTrue` indeksi, `ScoreId` karşılaştırır |
| `verifyTrialOnServer` | `(client: AnkuzefClient, plan: SerializedPlan, stemKey: string) => Promise<TrialResult>` | Yalnız doğrulama turu (deneme tekrarında kullanılır) |
| `trialGateOpen` | `(result: TrialResult \| null, opts: TransferOptions) => boolean` | `!opts.requireTrialGate \|\| result?.ok === true` |
| `trialIssues` | `(result: TrialResult) => ValidationIssue[]` | `TRIAL_FAILED` + hangi alanın uyuşmadığı (seçenek sayısı / doğru cevap / zorluk) |

### `src/storage.ts`

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `progressStorage` | `storage.defineItem<TransferProgress>('local:transfer-progress')` | WXT yerleşik `wxt/utils/storage`; testlerde `fakeBrowser` ile gerçek davranır |
| `lastPlanStorage` | `storage.defineItem<SerializedPlan>('local:last-plan')` | Yeniden başlatmada devam |
| `settingsStorage` | `storage.defineItem<TransferOptions>('local:transfer-options')` | Gecikme/yeniden deneme ayarları |
| `trialStorage` | `storage.defineItem<TrialResult \| null>('local:trial-result')` | **D1/C** — deneme kapısı sonucu; `authorQuestionId` bazında saklanır, aynı atama için tekrar deneme istenmez |
| `saveReport` | `(p: TransferProgress) => Promise<void>` | İlerlemeyi kalıcılaştırır |
| `clearTransferState` | `() => Promise<void>` | İptal/bitiş sonrası temizlik |
| `reportToMarkdown` | `(p: TransferProgress) => string` | Kullanıcının saklayabileceği rapor metni |
| `downloadReport` | `(p: TransferProgress) => void` | `Blob` + `URL.createObjectURL` ile `.md` indirme |

### `src/messages.ts`

| Fonksiyon | İmza | Amaç |
|---|---|---|
| `sendMessage` | `<T>(msg: PopupToBackgroundMessage) => Promise<MessageResult<T>>` | `browser.runtime.sendMessage` sarmalayıcısı; hataları `MessageResult`'a indirger |
| `sendToContentScript` | `<T>(tabId: number, msg: BackgroundToContentMessage) => Promise<MessageResult<T>>` | `browser.tabs.sendMessage`; aktif sekme `ankuzefsinav.ankara.edu.tr` değilse `SESSION_MISSING` |
| `findAnkuzefTab` | `() => Promise<chrome.tabs.Tab \| null>` | `browser.tabs.query({ url: 'https://ankuzefsinav.ankara.edu.tr/*' })` |

### `src/utils/*`

| Fonksiyon | Dosya | İmza | Amaç |
|---|---|---|---|
| `createLogger` | `utils/logger.ts` | `(scope: string) => Logger` | `debug/info/warn/error`; `import.meta.env.DEV` dışında sessiz |
| `el` | `utils/dom.ts` | `<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Record<string,string>, children?: (Node\|string)[]) => HTMLElementTagNameMap[K]` | Bağımlılıksız DOM üretimi (ön izleme + popup) |
| `readFileAsText` | `utils/file.ts` | `(file: File) => Promise<string>` | UTF-8 + BOM temizliği (AGENTS.md: kodlamayı koru) |
| `sleep` | `utils/timing.ts` | `(ms: number) => Promise<void>` | İstekler arası gecikme |
| `jitter` | `utils/timing.ts` | `(base: number, spread: number) => number` | `base + random(0..spread)` |

### `src/entrypoints/*` — giriş noktaları

| Fonksiyon | Dosya | İmza | Amaç |
|---|---|---|---|
| `default` (background) | `entrypoints/background.ts` | `defineBackground(() => void)` | `MessageRouter`'ı kurar; `RUN_TRIAL`'da `TransferRunner.runTrial()`, `START_TRANSFER`'da `run()` çağrılır (kapı kapalıysa reddeder); `browser.runtime.onInstalled`'da eski ilerlemeyi temizler |
| `default` (content) | `entrypoints/ankuzef.content.ts` | `defineContentScript({ matches, main })` | `matches: ['https://ankuzefsinav.ankara.edu.tr/*']`; `ANKUZEF_POST` mesajlarını sayfa kökeninden `fetch` ile yürütür; `ANKUZEF_SESSION`'da `readSession()` döner. **MAIN world betiği gerekmez** (yalnız `localStorage` okunur, CKEditor'a dokunulmaz) |
| `bootstrapPopup` | `entrypoints/popup/main.ts` | `() => Promise<void>` | `PopupWizard`'ı `#app`'e bağlar; depodaki ilerlemeyi okuyup kaldığı yerden devam önerir |
| `bootstrapPreview` | `entrypoints/preview/main.ts` | `() => Promise<void>` | `chrome.storage.local`'daki son dosyayı okur, `PreviewRenderer` + `runRulesCheck` çalıştırır |
| `renderFileStep` | `entrypoints/popup/wizard.ts` | `() => HTMLElement` | `<input type="file" accept=".json,application/json">`; `readFileAsText` → `parseExamFile`; hata listesi |
| `renderAssignmentStep` | `entrypoints/popup/wizard.ts` | `() => HTMLElement` | `LIST_ASSIGNMENTS` → `rankAssignmentCandidates`; `examStage` grup başlıkları (site `Jt()` ile aynı etiketler); seçim zorunlu |
| `renderPreviewStep` | `entrypoints/popup/wizard.ts` | `() => HTMLElement` | Kuru çalıştırma özeti: eşleşen/oluşturulacak konular (onay kutuları, D3), atlanacak mükerrerler, kota/tarih uyarıları, `examStage` eşleşme rozeti (D6), "1 soruluk denemeye geç" düğmesi |
| `renderTrialStep` | `entrypoints/popup/wizard.ts` | `() => HTMLElement` | **D1/C** — tek soruluk deneme; `TrialResult` alan alan gösterilir; `ok` ise "Tam aktarımı başlat" açılır, değilse `TRIAL_FAILED` nedenleri + elle akış bağlantısı |
| `renderProgressStep` | `entrypoints/popup/wizard.ts` | `() => HTMLElement` | `GET_PROGRESS` ile 500 ms'de bir yenilenen ilerleme çubuğu; Duraklat / Devam / İptal |
| `renderReportStep` | `entrypoints/popup/wizard.ts` | `() => HTMLElement` | Aktarılan / atlanan / başarısız listesi; "Raporu indir"; "Başarısızları yeniden dene" |

### `src/preview/*` — B projesinin ön izleme + rules-checker niyeti

| Fonksiyon | Dosya | İmza | Amaç |
|---|---|---|---|
| `runRulesCheck` | `preview/rules-checker.ts` | `(envelope: ExamFileEnvelope, ctx?: Partial<RuleContext>) => ValidationResult` | `validateExamFile` sarmalayıcısı; ön izleme sayfasında anında çalışır |
| `renderValidationReport` | `preview/rules-checker.ts` | `(result: ValidationResult, root: HTMLElement) => void` | Severity'ye göre renkli liste + istatistik tablosu |
| `exportReportMarkdown` | `preview/rules-checker.ts` | `(result: ValidationResult, envelope: ExamFileEnvelope) => string` | §9 kontrol listesinin işaretli hâli |
| `formatDifficultyLabel` | `preview/renderer.ts` | `(level: DifficultyLevel) => string` | `1→Çok Kolay … 5→Çok Zor` (Bulgu 17) |
| `sanitizeForPreview` | `preview/renderer.ts` | `(html: string) => string` | Yalnız `<u>,<b>,<i>,<strong>,<em>,<sub>,<sup>` bırakılır; `innerHTML` yerine güvenli düğüm üretimi tercih edilir |



## [Classes]

Depoda mevcut sınıf yok; aşağıdakilerin tamamı yenidir. Framework bağımlılığı **yok** (Vue/React kullanılmaz) — popup ve ön izleme, `src/utils/dom.ts` ile üretilen saf DOM'dur. Gerekçe: `kaynak-raporu.md` asgari bağımlılık ilkesi ve MV3 service worker boyutu.

### `AnkuzefClientError` — `src/api/errors.ts`

```ts
export class AnkuzefClientError extends Error {
  readonly detail: { status?: number; endpoint: string; body?: unknown };
  constructor(message: string, detail: { status?: number; endpoint: string; body?: unknown }) {
    super(message);
    this.name = 'AnkuzefClientError';
    this.detail = detail;
  }
}
```
Kalıtım: `Error`. Kullanım: `unwrapEnvelope` ve `createContentScriptTransport`.

### `AnkuzefClient` — `src/api/ankuzef-client.ts`

Kalıtım yok; `Transport` arayüzüne bağımlı (test edilebilirlik).

| Metot | İmza | Uç nokta |
|---|---|---|
| `constructor` | `(transport: Transport, opts?: { logger?: Logger })` | — |
| `checkIsLogin` | `() => Promise<boolean>` | `Login/CheckIsLogin` |
| `listAssignments` | `() => Promise<AuthorQuestionAssignment[]>` | `AuthorQuestion/GetForAuthorByUserId` (Bulgu 6) |
| `getExamField` | `(examId: number, fieldId: number) => Promise<ExamFieldInfo>` | `ExamField/GetByExamAndField/{examId}/{fieldId}` → `optionCount ?? 5` (Bulgu 7) |
| `listTopics` | `(fieldId: number, authorQuestionId: number) => Promise<QuestionTopic[]>` | `QuestionTopic/list` (Bulgu 8) |
| `addTopic` | `(description: string, fieldId: number) => Promise<number>` | `QuestionTopic/add` → yeni `Id` (Bulgu 9) |
| `listQuestionGroups` | `(authorQuestionId: number) => Promise<QuestionGroupRow[]>` | `QuestionGroup/by-author-question/{id}` (Bulgu 10; v1'de bilgi amaçlı) |
| `listExistingQuestions` | `(authorQuestionId: number) => Promise<ExistingQuestionRow[]>` | `Question/GetForAuthorByAuthorQuestionId/{id}` (Bulgu 11) |
| `insertQuestion` | `(req: QuestionInsertRequest) => Promise<ApiEnvelope>` | `Question/Insert` (Bulgu 15) |
| `getAuthUser` | `(authorQuestionId: number) => Promise<number \| null>` | `Account/GetAuthUser/{id}` (Bulgu 14) |
| `canAddQuestion` | `(authorQuestionId: number) => Promise<boolean>` | `AuthorQuestion/CanAddQuestion/{id}` |
| `getRemainingQuestionCount` | `(authorQuestionId: number) => Promise<number>` | `AuthorQuestion/GetRemainingQuestionCount/{id}` |
| `getExamStages` | `() => Promise<ExamStageRow[]>` | `Term/GetExamStages` (Bulgu 26 — **D6 birincil kaynak**) |

> `submitForApproval` metodu **bilerek yazılmaz** (D5).
> `listProgramTypes` (`ExamType/List`) metodu da **bilerek yazılmaz** — Bulgu 27: bu uç "Program Türü"dür, sınav türüyle karıştırılma riski taşır.

### `MessageRouter` — `src/messages.ts`

| Metot | İmza | Amaç |
|---|---|---|
| `constructor` | `(logger?: Logger)` | — |
| `register` | `(type: Message['type'], handler: (msg: never, sender: chrome.runtime.MessageSender) => Promise<unknown>) => this` | Tip anahtarlı kayıt |
| `handle` | `(msg: unknown, sender: chrome.runtime.MessageSender) => Promise<MessageResult<unknown>>` | Bilinmeyen tip → `{ok:false}`; handler hatası yakalanır ve `MessageResult`'a çevrilir (service worker'ı çökertmez) |
| `attach` | `() => void` | `browser.runtime.onMessage.addListener` |


### `PlanBuilder` — `src/transfer/plan-builder.ts`

| Metot | İmza | Amaç |
|---|---|---|
| `constructor` | `(client: AnkuzefClient, opts?: { logger?: Logger })` | — |
| `loadContext` | `(a: AuthorQuestionAssignment) => Promise<TransferContext>` | `getExamField` + `resolveUserId` → `TransferContext` |
| `loadTopics` | `(ctx: TransferContext) => Promise<QuestionTopic[]>` | `listTopics` + önbellek |
| `loadExisting` | `(ctx: TransferContext) => Promise<ExistingQuestionRow[]>` | `listExistingQuestions` |
| `build` | `(envelope: ExamFileEnvelope, a: AuthorQuestionAssignment) => Promise<DryRunPlan>` | Tam kuru çalıştırma: bağlam + konular + mükerrer + doğrulama + kota; **hiçbir yazma işlemi yapmaz** |
| `applyTopicApprovals` | `(plan: DryRunPlan, approvedKeys: string[]) => DryRunPlan` | D3: yalnızca işaretlenen konular `approved: true` |
| `materializeTopics` | `(plan: DryRunPlan) => Promise<DryRunPlan>` | Onaylı eksik konular için `addTopic`; başarısız olanların soruları `skip-unapproved-topic` |
| `toSerialized` | `(plan: DryRunPlan) => SerializedPlan` | Depolama biçimi |

### `TransferRunner` — `src/transfer/transfer-runner.ts`

| Metot | İmza | Amaç |
|---|---|---|
| `constructor` | `(client: AnkuzefClient, opts: TransferOptions, logger?: Logger)` | — |
| `runTrial` | `(plan: SerializedPlan) => Promise<TrialResult>` | **D1/C** — `trial.ts`'i çağırır; sonuç `trialStorage`'a yazılır. Kapı açılmazsa `run()` `TRIAL_REQUIRED` ile reddeder |
| `run` | `(plan: SerializedPlan) => Promise<TransferProgress>` | Sıralı aktarım; her soru arasında `delayMs + jitter`; `saveReport` ile kalıcılaştırma |
| `pause` | `() => void` | Sonraki yinelemede durur; `state: 'paused'` |
| `resume` | `() => Promise<TransferProgress>` | Kaldığı indeksten devam |
| `cancel` | `() => void` | `state: 'cancelled'`; aktarılanlar geri alınmaz (raporda listelenir) |
| `retryFailed` | `() => Promise<TransferProgress>` | Yalnızca `status === 'failed'` olanları yeniden dener |
| `verify` | `(plan: SerializedPlan) => Promise<ExistingSummary>` | `verifyAfterRun` → listeyi yeniden çekip taslak sayısını karşılaştırır |
| `onProgress` | `(cb: (p: TransferProgress) => void) => () => void` | Abonelik; dönüş değeri aboneliği iptal eder |
| `getProgress` | `() => TransferProgress` | Anlık durum |

Davranış kuralları:
- **Deneme kapısı (D1/C):** `requireTrialGate` açıkken `trialGateOpen()` false ise `run()` hiç istek atmadan `TRIAL_REQUIRED` hatasıyla döner. Deneme sorusu sistemde taslak olarak doğrulanmadan tam aktarım başlamaz.
- **API bekçisi (D1/C):** her yanıttan sonra ilgili `guard*` fonksiyonu çalışır; `action === 'halt-and-guide-to-manual-flow'` ise aktarım `state: 'error'` ile durur ve kullanıcıya `manualFlowGuidance()` metni gösterilir. Kısmi aktarım raporda listelenir.
- `StatusId` her zaman `1` (D5).
- `decision !== 'transfer'` olan sorular istek atılmadan atlanır.
- Ardışık `stopOnConsecutiveFailures` hata → otomatik duraklatma + kullanıcıya bildirim.
- `isTransient(err)` ise `maxAttempts` kadar yeniden deneme; kalıcı hatalarda soru atlanır, aktarım devam eder (`algoritma.md` §5-d).
- Başarılı insert sonrası `questionId` doğrudan dönmeyebilir; `verify()` turunda `normalizeStemKey` eşleşmesiyle geri doldurulur.

### `PopupWizard` — `src/entrypoints/popup/wizard.ts`

| Metot | İmza | Amaç |
|---|---|---|
| `constructor` | `(root: HTMLElement)` | — |
| `mount` | `() => Promise<void>` | İlk adım; depoda yarım ilerleme varsa "Devam et?" önerir |
| `goTo` | `(step: WizardStep) => void` | `type WizardStep = 'file' \| 'assignment' \| 'preview' \| 'trial' \| 'progress' \| 'report'` |
| `renderFileStep` … `renderReportStep` | `() => HTMLElement` | `[Functions]` bölümünde tanımlı |
| `renderTrialStep` | `() => HTMLElement` | **D1/C** — "Önce 1 soruyu deneme olarak aktar" düğmesi; `TrialResult` alan alan gösterilir (insert / sunucuda görüldü / seçenek sayısı / doğru cevap / zorluk); `ok === true` ise "Tam aktarımı başlat" düğmesi açılır |
| `renderIssues` | `(issues: ValidationIssue[]) => HTMLElement` | Ortak hata/uyarı listesi bileşeni |
| `setBusy` | `(busy: boolean, label?: string) => void` | Düğmeleri kilitler |

### `PreviewRenderer` — `src/preview/renderer.ts`

B projesinin `index.html` + `exam.css` yapısının veri güdümlü karşılığı. Üretilen markup `src/entrypoints/preview/style.css` sınıf adlarıyla birebir uyumlu olmalıdır: `soru-kart`, `alan`, `alan-etiket`, `alan-deger`, `soru-koku`, `soru-gorsel`, `secenekler`, `dogru`, `sinav-turu`, `sinav-turu-etiket`.

| Metot | İmza | Amaç |
|---|---|---|
| `constructor` | `(root: HTMLElement)` | — |
| `render` | `(envelope: ExamFileEnvelope) => void` | Başlık + sınav türü bloğu + 20 soru kartı |
| `renderHeader` | `(envelope: ExamFileEnvelope) => HTMLElement` | "Dersin Kodu ve Adı" + `exam_type` etiketi |
| `renderQuestionCard` | `(q: QuestionInput, index: number, total: number) => HTMLElement` | `Soru {index+1} / {total}` kartı |
| `renderField` | `(label: string, value: string) => HTMLElement` | `alan` / `alan-etiket` / `alan-deger` üçlüsü |
| `renderOptionList` | `(secenekler: Record<OptionLetter,string>, dogru: OptionLetter) => HTMLElement` | `<ul class="secenekler">`; doğru seçenek `class="dogru"` |
| `renderStem` | `(soruKoku: string) => HTMLElement` | `<u>` korunarak güvenli düğüm üretimi |
| `renderImage` | `(soruGorseli?: string \| null) => HTMLElement \| null` | v1: yalnızca `data:` URI ise gösterir, aksi hâlde uyarı rozeti (D8) |

### Kaldırılan sınıflar

Yok — iki eski projede de sınıf tanımı bulunmuyor (`src/app.js` ve `src/rules-checker.js` 0 bayt, `index.html` içinde betik yok).


## [Dependencies]

Sürümler **2026-10-27** tarihinde `npm view` ile yeniden doğrulandı (Node v24.22.1, npm 11.13.0, git 2.56.0.windows.3). `kaynak-raporu.md`'deki 2026-10-26 tespitleri birebir geçerli.

### Yeni paketler

| Paket | Sürüm | Lisans | Tür | Kullanım |
|---|---|---|---|---|
| `wxt` | `0.21.5` | MIT | devDependency | MV3 çatı: manifest üretimi, `srcDir/outDir`, HMR, TS, `wxt/testing/*` |
| `typescript` | `7.0.2` | Apache-2.0 | devDependency | Dil; `npm run compile` |
| `zod` | `4.6.7` | MIT | dependency | `src/core/schema.ts` — JSON şema doğrulama |
| `vitest` | `5.0.5` | MIT | devDependency | Birim testleri |
| `@types/chrome` | `0.3.6` | MIT | devDependency | `chrome.*` tipleri (WXT kendi tiplerini de sağlar; çakışırsa kaldırılır) |

Toplam: **1 çalışma zamanı bağımlılığı (`zod`)**, 4 geliştirme bağımlılığı. UI framework'ü, CSS çatısı, DOMPurify, Excel kütüphanesi **yok**.

### `package.json`

```json
{
  "name": "ankuzef-sinav-soru-gir",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "ANKUZEF soru bankasına JSON soru havuzu aktarımı (Chrome MV3) + soru yazım yönergesi doğrulayıcı",
  "scripts": {
    "postinstall": "wxt prepare",
    "dev": "wxt",
    "build": "wxt build",
    "zip": "wxt zip",
    "compile": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "npm run compile && npm run test"
  },
  "dependencies": { "zod": "4.6.7" },
  "devDependencies": {
    "@types/chrome": "0.3.6",
    "typescript": "7.0.2",
    "vitest": "5.0.5",
    "wxt": "0.21.5"
  }
}
```

### Reddedilenler (gerekçeli)

| Paket | Sürüm | Reddedilme gerekçesi |
|---|---|---|
| `plasmo` | 0.90.5 | Son yayın 2025-05-17; ~1,5 yıldır bakımsız |
| `@crxjs/vite-plugin` | 3.0.0 | Çalışır alternatif ama manifest elle yazılır; WXT daha az sürtünme |
| `xlsx` (npm) | 0.18.5 | CVE-2023-30533 (prototype pollution) 0.19.3'te kapatıldı, npm'deki sürüm etkileniyor; SheetJS yeni sürümleri kendi CDN'inden dağıtıyor |
| `dompurify` | 3.4.17 | Gereksiz: girdi düz metin + sınırlı satır içi etiket; Bulgu 18 izin listesiyle kendi kaçışımız yeterli |
| `tsx` | — | Veri doğrulama CLI'sı yerine `tests/data/repository-data.test.ts` kullanılır (ek bağımlılık yok) |
| `exceljs` / `papaparse` | 4.4.0 / 5.7.0 | D4: v1 yalnızca JSON. Excel/CSV ihtiyacı doğarsa v2'de `papaparse` (hafif) tercih edilir |
| `@wxt-dev/storage` | 1.3.0 | Gereksiz: `wxt/utils/storage` WXT ile yerleşik geliyor |
| `@wxt-dev/auto-icons` | 1.1.2 | İsteğe bağlı; v1'de manifest'e simge konmaz (Chrome varsayılanı kullanır) |

### Entegrasyon gereksinimleri

1. `npm install` sonrası `wxt prepare` (postinstall) `.wxt/tsconfig.json` ve `.wxt/types/paths.d.ts` üretir; `tsconfig.json` buna `extends` ile bağlıdır. **`wxt prepare` çalışmadan `npm run compile` başarısız olur.**
2. `dist/` çıktısı Chrome'da `chrome://extensions` → "Paketlenmemiş öğe yükle" ile yüklenir.
3. Eklentinin çalışması için kullanıcının `https://ankuzefsinav.ankara.edu.tr` sekmesinde **KDS ile giriş yapmış** olması gerekir (`localStorage.auth_token`). Eklenti kimlik bilgisi istemez/saklamaz.
4. `wxt.config.ts` içindeki `host_permissions` iki kökle sınırlıdır; başka hiçbir köke istek atılmaz (`api.ipify.org` gibi sitenin kendi IP servisleri **taklit edilmez**).
5. UTF-8: tüm JSON okuma/yazma işlemleri UTF-8; BOM temizlenir (AGENTS.md gereği).


## [Testing]

Depoda mevcut test yok; tüm test altyapısı yenidir. Çatı: **Vitest 5.0.5 + `WxtVitest()`**; `browser.*` API'leri `@webext-core/fake-browser` ile bellek içi taklit edilir, her testte `fakeBrowser.reset()` çağrılır.

### Test dosyaları ve kapsamları

| Dosya | Kapsam |
|---|---|
| `tests/core/schema.test.ts` | Çıplak dizi (legacy) ve envelope biçimi; `deriveCourseCode('ZAUF1106_Final_Sinavi.json') === 'ZAUF1106'`; dosya adı ↔ `soru_grubu` çelişkisinde `GROUP_MISMATCH`; eksik alan → `SCHEMA_INVALID` + doğru `field` yolu; BOM'lu girdi; bozuk JSON |
| `tests/core/exam-type.test.ts` | 6 `ExamType` için dosya adı türetme; `normalizeExamStage` — `'Ara Sınav'→ARA`, `'FİNAL'→FINAL`, `'final'→FINAL`, `'BÜTÜNLEME'→BUTUNLEME`, `'Butunleme'→BUTUNLEME`, `'Mazeret'→DIGER`, `undefined→DIGER` (Bulgu 25 birebir); **D6:** `fetchExamStageDictionary` — sahte `{id, description}[]` ile `source: 'remote'`, uç hata verirse `source: 'static-fallback'`; `matchExamStage` — `exact` / `normalized` / `none` üç durumu; `MAKEUP` için `none` + `EXAM_STAGE_UNKNOWN` uyarısı; `rankAssignmentCandidates` puanlama sırası |
| `tests/core/html.test.ts` | `toQuestionHtml('… <u>değildir</u>?')` → `<p>… <u>değildir</u>?</p>` (**`<u>` korunur**); `toQuestionHtml('a < b & c')` → kaçış; çok satırlı metin → çoklu `<p>`; `<script>` → kaçırılır; `normalizeStemKey` Türkçe indirgeme; `htmlToPlainText`; `matchBannedOption` dört yasaklı kalıp |
| `tests/core/mapping.test.ts` | `difficultyToScoreId(1..5)` kimlik; `buildQuestionOptions` — `Id` 1 tabanlı, yalnızca doğru indekste `IsTrue: true`; `optionCount === 4` iken 5 seçenek → hata; **payload anlık görüntüsü (snapshot)** Bulgu 15 alan adlarıyla birebir (`Question.ExpDescription`, `QuestionStatus.VersionId === 1`, `QuestionGroup.IsActive === true`, `Question.MixId === 0`, `QuestionStatus.StatusId === 1`) |
| `tests/core/validate.test.ts` | Her kural için bir pozitif + bir negatif vaka (27 kural × 2); `KAYNAK_PATTERN` — `Hafta 6 - … Ders Notu` geçerli, `Hafta 14 - …`, `Hafta 06 - …`, `Ders Notu` eksik → geçersiz; zorluk dağılımı (§5.2) ve `min.prep-guide` dağılımı (uyarı); **D7:** `secenekler_karistirilmasin: true` → `DEPRECATED_FIELD` info (hata değil); **D6:** `matchExamStage` `none` → `EXAM_STAGE_UNKNOWN` warning; **D1/C:** `ruleTrialGate` kapı kapalıyken error; `STRUCTURAL_RULES` başarısızken `CONTENT_RULES` çalışmaz |
| `tests/core/stats.test.ts` | `computeStats` sayımları; `parseHafta`; hafta dağılımı (Ara: 1–6, Final/Bütünleme: 1–6→1, 7–13→2); süre bütçesi 1800 sn |
| `tests/core/dedupe.test.ts` | Aynı kökün noktalama/boşluk/büyük-küçük harf varyantları aynı anahtara düşer; `summarizeExisting` — `statusId 1` taslak, `statusId 2..8` kota tüketen |
| `tests/api/transport.test.ts` | Düz nesne gövdeye `Token` eklenir; dizi gövdeye eklenmez (Bulgu 4); `Authorization: Bearer` başlığı; `process:false` → `AnkuzefClientError`; HTTP 403 → `"Yetkiniz bulunmamaktadır."`; `unwrapEnvelope` öncelik sırası `data → questionTopics → list → dizi` |
| `tests/api/session.test.ts` | `decodeJwtPayload` base64url + Türkçe karakterler; `userIdFromToken` claim önceliği `nameid → sub → userId → UserId → uid`; token yoksa `null` |
| `tests/api/payload.test.ts` | Fabrika varsayılanları site fabrikalarıyla birebir (`ScoreId: 3`, `MixId: 0`, `QuestionGroupCount: 0`, `IsActive: true`, `UpdateDate: null`); `QUOTA_CONSUMING_STATUS_IDS` = `{2,3,4,5,6,7,8}` |
| `tests/api/ankuzef-client.test.ts` | Sahte `Transport` ile her metot için URL + gövde doğrulama; `getExamField` → `optionCount` yoksa 5; `addTopic` → `data.Id ?? Id`; `listExistingQuestions` dizi döner |

| `tests/transfer/quota.test.ts` | Bulgu 12 senaryoları: 20 kota / 19 onaylı + 5 taslak → uygun; 20 onaylı → `QUOTA_EXCEEDED`; `questionCount === 0` → limitsiz; tarih penceresi açık/kapalı; sahip olmayan kullanıcı → `NOT_ASSIGNMENT_OWNER` |
| `tests/transfer/plan-builder.test.ts` | Konu eşleşme (tam / normalize / eksik); D3 — onaysız konu `skip-unapproved-topic`; mükerrer soru `skip-duplicate`; `build()` **hiçbir yazma çağrısı yapmaz** (sahte client'ta `addTopic`/`insertQuestion` çağrı sayısı 0 assert edilir) |
| `tests/transfer/transfer-runner.test.ts` | Sahte client ile: 20 soru → 20 insert, hepsi `StatusId === 1`; gecikme (`vi.useFakeTimers`); geçici hata → `maxAttempts` kadar yeniden deneme; kalıcı hata → soru atlanır, aktarım devam eder; ardışık 3 hata → otomatik `paused`; `pause/resume/cancel`; `retryFailed` yalnızca başarısızları; ilerleme `progressStorage`'a yazılır |
| `tests/data/repository-data.test.ts` | `data/*.json` (`_schema.json` hariç) dosyalarının tümü `parseExamFile` + `validateExamFile`'dan **hatasız** geçmeli — depo verisi bozulursa test kırılır |
| `tests/messages.test.ts` | `MessageRouter` — kayıtlı tip yönlendirilir, bilinmeyen tip `{ok:false}`, handler hatası yakalanır |
| `tests/storage.test.ts` | `fakeBrowser` ile `progressStorage` yaz/oku/sil; `reportToMarkdown` biçimi; `trialStorage` `authorQuestionId` bazında saklanır |
| `tests/transfer/api-guard.test.ts` | **D1/C** — `{process:true}` → `continue`; `{}` / `{success:true}` / dizi / `null` → `halt-and-guide-to-manual-flow`; `guardAssignmentList` eksik `fieldId` → halt; `guardExamStages` bozuk biçim → yedeğe düş (halt değil); `describeActual` ilk 5 anahtarı verir; `manualFlowGuidance` `docs/module-map.md`'ye referans verir |
| `tests/transfer/trial.test.ts` | **D1/C** — `runTrial` tek soru ekler (`insertQuestion` çağrı sayısı **1**); sunucudan geri okuma `normalizeStemKey` ile eşleşir → `ok: true`; seçenek sayısı uyuşmazsa `optionCountMatched: false` + `TRIAL_FAILED`; `trialGateOpen(null, {requireTrialGate:true}) === false`; `TransferRunner.run()` kapı kapalıyken **hiç istek atmaz** (`insertQuestion` çağrı sayısı 0) ve `TRIAL_REQUIRED` döner; `requireTrialGate: false` iken kapı atlanır |

### Mevcut test değişiklikleri

Yok — depoda test altyapısı bulunmuyor.

### Doğrulama stratejisi (katmanlı)

1. **Statik:** `npm run compile` (`tsc --noEmit`, `strict + noUncheckedIndexedAccess`).
2. **Birim:** `npm run test` — yukarıdaki 19 dosya. Hedef: `core/` ve `api/` dallarında %90+ kapsam; `entrypoints/` ve `preview/` kapsam dışında tutulabilir (DOM ağırlıklı).
3. **Depo verisi:** `tests/data/repository-data.test.ts` — gerçek `ZAUF1106` dosyaları regresyon kapısı.
4. **Sözleşme kilidi:** `tests/core/mapping.test.ts` içindeki payload anlık görüntüsü. Sistem API'si değişirse snapshot kırılır ve değişiklik bilinçli olarak gözden geçirilir.
5. **Derleme:** `npm run build` → `dist/` içinde `manifest.json` (MV3), `background.js`, `ankuzef.content.js`, `popup.html`, `preview.html` üretildiği doğrulanır; `manifest.json`'da izinlerin yalnızca `storage`, `activeTab` + iki host olduğu kontrol edilir.
6. **Elle E2E (kullanıcı ile; KDS girişi kullanıcıda):**
   - `dist/` paketlenmemiş öğe olarak yüklenir.
   - `https://ankuzefsinav.ankara.edu.tr/authorquestion/assignments` açılır; oturum yoksa popup "KDS ile giriş yapın" uyarısı verir (kimlik bilgisi istenmez).
   - `ZAUF1106_Final_Sinavi.json` seçilir → doğrulama raporu, `min.prep-guide` dağılım uyarısı dışında hatasız olmalı (mevcut dağılım: 2×4, 3×13, 4×3).
   - Atama listesi gelir; `examStage` grupları site arayüzüyle aynı etiketleri gösterir.
   - Kuru çalıştırma: 13 konu, eşleşen/oluşturulacak ayrımı, mükerrer 0.
   - **Zorunlu deneme kapısı (D1/C):** "1 soruluk denemeye geç" düğmesiyle ilk soru taslak aktarılır → `TrialResult` panelinde `inserted`, `verifiedOnServer`, `matchedByStemKey`, `optionCountMatched`, `correctAnswerPreserved`, `scoreIdMatched` alanlarının **hepsi yeşil** olmalı. Deneme başarısızsa "Tam aktarımı başlat" düğmesi **açılmamalı** ve `manualFlowGuidance` metni görünmeli.
   - Deneme sorusu `/question/listAuthor` sayfasında "Taslak" olarak göründüğü; seçenek sırası ve doğru cevabın korunduğu; `Kaynak`'ın `ExpDescription`'a yazıldığı; zorluğun `ScoreId` ile eşleştiği **gözle de** doğrulanır.
   - Kapı açıldıktan sonra tam aktarım (kalan 19 soru) → taslak sayısı 20; kota değişmedi (Bulgu 12).
   - Sistemde **hiçbir sorunun "Onaya Gönder" durumuna geçmediği** doğrulanır (D5).
7. **Geri alma:** Aktarılan taslaklar sistem arayüzünden elle silinebilir (`Question/Delete/{id}`); prosedür `docs/api-sozlesmesi.md`'ye yazılır.

### Bilinen kısıtlar

- Testler gerçek ANKUZEF API'sine **istek atmaz**; tüm ağ katmanı sahte `Transport` ile soyutlanır. Gerçek uç nokta davranışı yalnızca adım 6'daki elle E2E ile doğrulanır.
- `preview/` ve `popup/` DOM çıktıları birim testlerinde `jsdom` olmadan doğrulanmaz (WXT `WxtVitest` varsayılan ortamı `node`); gerekirse bu iki dosya için `// @vitest-environment jsdom` eklenir ve `jsdom` devDependency olarak alınır.
- `secenekler_karistirilmasin` artık **`deprecated`** (D7 — Bulgu 28–29 ile kesinleşti, belirsizlik kalmadı): yalnızca `DEPRECATED_FIELD` info mesajı üretildiği test edilir; `Question.MixId` her zaman `0` gönderilir.
- `Term/GetExamStages` oturum gerektirir; oturum yokken `fetchExamStageDictionary` çevrimdışı yedeğe düşer ve UI'da `source: 'static-fallback'` rozeti gösterilir (D6).
- Deneme kapısı (D1/C) sistemde **gerçek bir taslak soru oluşturur**; geri alma kullanıcı tarafından sistem arayüzünden yapılır (`Question/Delete/{id}`). Bu, `docs/api-sozlesmesi.md`'deki geri alma prosedüründe belirtilir.


## [Implementation Order]

Adımlar, çakışmayı en aza indirecek sırada numaralandırılmıştır. Her adım sonunda `npm run compile` (7. adımdan itibaren) ve ilgili testler çalıştırılır.

### Faz 0 — Güvenlik ve hazırlık

1. **Yedek/versiyon kontrolü:** `git init` → `.gitignore` → mevcut durumu (iki alt dizin + `AGENTS.md` + `CLAUDE.md` + `implementation_plan.md`) ilk commit olarak kaydet. Bu, eski dizinler `legacy/` altına taşındıktan sonra geri dönüş yoludur (D10).
2. **ReadOnly özniteliğini temizle:** `ankuzef-sinav-soru-aktarici/` dizini `ReadOnly, Directory` özniteliğine sahip; taşıma/silme öncesi `attrib -r` ile temizlenir.

### Faz 1 — Dosya birleştirme (kod yazmadan önce)

3. **`data/` birleştirme:** A'nın iki dolu JSON dosyası kök `data/`'ya taşınır; B'nin `_schema.json`'u taşınıp genişletilir (`surum`, `ders_kodu`, `exam_type`, `soru_gorseli`, `bloom_basamagi`, `soru_turu`, `tahmini_sure_sn`) ve **`ek_ayarlar.secenekler_karistirilmasin` şemadan çıkarılır** (D7 — mevcut dosyalardaki `false` değerleri korunur, şema artık opsiyonel/`deprecated` kabul eder); B'nin 7 boş (0 bayt) dosyası silinir; `data/README.md` yazılır.
4. **`docs/` birleştirme:** B'nin üç dokümanı yeniden adlandırılarak (`soru-yazim-yonergesi.md`, `sinav-turu-eslemesi.md`, `degerlendirme-olcutleri.md`) kök `docs/`'a taşınır; A'nın `algoritma.md` ve `kaynak-raporu.md` dosyaları taşınıp güncellenir (Bulgu 1–30 + kapatılan açık sorular; **D6 için `Term/GetExamStages` birincil kaynak notu ve `ExamType/List`=Program Türü tuzağı eklenir**).
5. **Yeni referans dokümanlar:** `docs/api-sozlesmesi.md` (Bulgu 1–30'un tam dökümü + payload örneği + geri alma prosedürü + **`ExamType/List` = Program Türü adlandırma tuzağı**), `docs/module-map.md` (**Module_Map** çıktısı: rotalar, `sessionStorage.aq_ctx`, CKEditor örnek adları, select2/toastr/Swal, **elle form akışı — D1/C'nin yedek yolu**), `docs/extension-architecture-plan.md` (**Extension_Architecture_Plan** çıktısı), `docs/birlestirme-gunlugu.md` (çakışma çözüm tablosu).
6. **`.antigravity/ankuzef.rules` taşıma + güncelleme:** `output_requirements` altına gerçek dosya yolları yazılır.

### Faz 2 — Proje iskeleti

7. **Kök yapılandırma:** `package.json`, `tsconfig.json`, `wxt.config.ts`, `vitest.config.ts`, `.editorconfig` oluşturulur; `.gitignore` güncellenir; `npm install` → `wxt prepare` ile `.wxt/` üretilir.
8. **Boş giriş noktaları:** `src/entrypoints/background.ts`, `src/entrypoints/ankuzef.content.ts`, `src/entrypoints/popup/{index.html,main.ts,style.css}`, `src/entrypoints/preview/{index.html,main.ts,style.css}` (B'nin `exam.css`'i düzeltilerek) oluşturulur. `npm run build` ile `dist/manifest.json` üretilir ve izinler doğrulanır.

### Faz 3 — Saf çekirdek (testleriyle birlikte, en yüksek değer)

9. **`src/core/types.ts` + `src/api/types.ts` + `src/transfer/types.ts`:** `[Types]` bölümündeki tüm tipler. `npm run compile` temiz geçmeli.
10. **`src/core/html.ts` + testleri:** `escapeHtml`, `toQuestionHtml` (`<u>` koruma), `htmlToPlainText`, `normalizeStemKey`, `matchBannedOption`, `hasNegativeStem`/`isNegativeMarked`, `findDisallowedMarkup`. → `tests/core/html.test.ts`
11. **`src/core/exam-type.ts` + testleri:** enum + eşlemeler + `normalizeExamStage` + `buildStaticStageFallback` + `matchExamStage` + `warnUnmatchedExamType` + `rankAssignmentCandidates`. **D6:** `fetchExamStageDictionary` bu fazda **yapısal `ExamStageSource` arayüzüne** karşı yazılır (gerçek `AnkuzefClient` adım 18'de bağlanır) — böylece Faz 3 saf/test edilebilir kalır. → `tests/core/exam-type.test.ts`
12. **`src/core/schema.ts` + testleri:** zod şemaları, `normalizeExamFile`, `parseExamFile`, türetme fonksiyonları. → `tests/core/schema.test.ts`
13. **`src/core/stats.ts` + `src/core/validate.ts` + testleri:** 27 kural (`ruleDeprecatedFields`, `ruleExamStageUnknown`, `ruleTrialGate` dâhil), `validateExamFile`, `mergeIssues`. → `tests/core/stats.test.ts`, `tests/core/validate.test.ts`
14. **`tests/data/repository-data.test.ts`:** Gerçek `ZAUF1106` dosyaları doğrulanır. **Beklenen bulgu:** Final dosyası `MIN_GUIDE_DISTRIBUTION` uyarısı verir (2 kolay/16 orta/2 zor kuralına uymuyor; gerçek dağılım 4/13/3) — bu bir hata değil, iki yönerge arasındaki çakışmanın kanıtıdır ve uyarı seviyesinde kalmalıdır.
15. **`src/core/dedupe.ts` + `src/core/mapping.ts` + testleri:** mükerrer indeksi ve JSON → `QuestionInsertRequest` eşlemesi; payload snapshot testi. → `tests/core/dedupe.test.ts`, `tests/core/mapping.test.ts`


### Faz 4 — API katmanı

16. **`src/api/errors.ts`, `src/api/endpoints.ts`, `src/api/payload.ts` + testleri.** → `tests/api/payload.test.ts`
17. **`src/api/transport.ts` + `src/api/session.ts` + testleri:** `Transport`, `createContentScriptTransport` (Bulgu 4), `unwrapEnvelope`, JWT çözümü. → `tests/api/transport.test.ts`, `tests/api/session.test.ts`
18. **`src/api/ankuzef-client.ts` + testleri:** 13 metot (`getExamStages` dâhil — D6), sahte `Transport`. → `tests/api/ankuzef-client.test.ts`
19. **`src/messages.ts` (`MessageRouter`) + `src/storage.ts` + testleri.** → `tests/messages.test.ts`, `tests/storage.test.ts`

### Faz 5 — Aktarım mantığı

20. **`src/transfer/quota.ts` + testleri:** Bulgu 12/13 birebir. → `tests/transfer/quota.test.ts`
21. **`src/transfer/api-guard.ts` + testleri (D1/C):** `guardEnvelope`, `guardAssignmentList`, `guardInsertResult`, `guardExistingList`, `guardExamStages`, `describeActual`, `manualFlowGuidance` — hepsi saf fonksiyon; adım 17'deki `Transport`'a bağlanır. → `tests/transfer/api-guard.test.ts`
22. **`src/transfer/plan-builder.ts` (`PlanBuilder`) + testleri:** kuru çalıştırma; "hiçbir yazma çağrısı yapmaz" asserti; **D6:** `fetchExamStageDictionary` + `matchExamStage` ile `examStage` eşleşme rozeti. → `tests/transfer/plan-builder.test.ts`
23. **`src/transfer/trial.ts` + testleri (D1/C):** `selectTrialQuestion`, `runTrial`, `verifyTrialOnServer`, `trialGateOpen`, `trialIssues`. → `tests/transfer/trial.test.ts`
24. **`src/transfer/transfer-runner.ts` (`TransferRunner`) + testleri:** `runTrial` + sıralı aktarım, gecikme, yeniden deneme, duraklat/devam/iptal, `verify`; **deneme kapısı ve API bekçisi davranış kuralları** (kapı kapalıyken `insertQuestion` çağrı sayısı 0). → `tests/transfer/transfer-runner.test.ts`

### Faz 6 — Arayüz

25. **`src/utils/{logger,dom,timing,file}.ts`:** ortak yardımcılar.
26. **`src/entrypoints/ankuzef.content.ts` doldurma:** `ANKUZEF_POST` / `ANKUZEF_SESSION` mesaj yürütme; `createContentScriptTransport` bağlama.
27. **`src/entrypoints/background.ts` doldurma:** `MessageRouter` kayıtları (`SESSION_CHECK`, `LIST_ASSIGNMENTS`, `FETCH_EXAM_STAGES`, `BUILD_PLAN`, `APPROVE_TOPICS`, `RUN_TRIAL`, `START_TRANSFER`, `PAUSE/RESUME/CANCEL`, `RETRY_FAILED`, `GET_PROGRESS`, `OPEN_PREVIEW`).
28. **`src/preview/renderer.ts` + `src/preview/rules-checker.ts`:** B projesinin `index.html` + `rules-checker.js` niyetinin gerçek kodu; `preview.html` çalışır hâle gelir.
29. **`src/entrypoints/popup/{main.ts,wizard.ts}`:** **6 adımlı** sihirbaz (dosya → atama → ön izleme/onay → **deneme (D1/C)** → ilerleme → rapor).

### Faz 7 — Kapanış

30. **`AGENTS.md` + `CLAUDE.md` güncelleme:** yeni yapı, komutlar (`npm run dev/build/test/compile/check`), veri biçimi (envelope + legacy), güvenlik kuralları (D5, KDS), **`legacy/` = salt okunur arşiv notu (D10)**.
31. **`README.md`:** kurulum, kullanım akışı (**deneme kapısı dâhil**), güvenlik uyarıları, bilinen kısıtlar, v2 yol haritası (Excel/CSV, base64 görsel, `QuestionGroup`, güncelleme/silme akışları).
32. **Eski dizinleri `legacy/` altına taşı (D10 — silme yok):** `Move-Item ankuzef-sinav-soru-aktarici legacy\ankuzef-sinav-soru-aktarici` ve `Move-Item sinav-soru-yukleme-araci legacy\sinav-soru-yukleme-araci` — **yalnızca** tüm içerik taşındıktan ve Faz 1–6 tamamlandıktan sonra. Taşıma öncesi `git status` ile izlenmemiş dosya kalmadığı doğrulanır; `legacy/` `tsconfig.json` `include`'una ve test taramasına alınmaz; ayrı commit.
33. **Tam doğrulama:** `npm run check` (compile + test) → `npm run build` → `dist/` içeriği ve `manifest.json` izinleri kontrol → `[Testing]` adım 6'daki elle E2E listesi (kullanıcı KDS girişi ile, **zorunlu deneme kapısı dâhil**).
34. **Son commit:** birleştirme tamamlandı olarak işaretlenir.


### Riskler ve önlemler

| Risk | Etki | Önlem |
|---|---|---|
| Sistem dahili API'si değişir (hash'li chunk'lar yeniden derlenir) | Aktarım kırılır | **D1/C `api-guard.ts`:** her yanıttan sonra `guard*` şema bekçisi; beklenmedik biçimde `action: 'halt-and-guide-to-manual-flow'` → aktarım durur, kullanıcı `docs/module-map.md`'deki elle akışa yönlendirilir. **Zorunlu deneme kapısı** kırılmayı ilk soruda yakalar. Payload snapshot testi (adım 15) kırılmayı erken yakalar; `docs/api-sozlesmesi.md`'de "yeniden doğrulama" prosedürü; tüm uç noktalar tek dosyada (`endpoints.ts`) |
| `Question/Insert` sunucu tarafı doğrulama ekler | Sessiz veri kaybı | `process === false` her zaman hata sayılır; `verify()` sonrası taslak sayısı karşılaştırılır |
| Rate limiting / WAF | 429/403 | `delayMs + jitter`; `isTransient` → sınırlı yeniden deneme; ardışık hatada otomatik duraklatma |
| Kullanıcı yanlış atamayı seçer | Yanlış sınava soru yazılması | Atama seçimi her zaman elle; **D6:** `examStage` sözlüğü `Term/GetExamStages`'tan çalışma zamanında çekilir ve `matchExamStage().confidence` rozeti (`exact`/`normalized`/`none`) gösterilir; `none` ise `EXAM_STAGE_UNKNOWN` uyarısı + otomatik öneri yok; ön izlemede atama özeti (sınav adı, alan kodu, dönem, tarih aralığı) gösterilir |
| Konu adı çakışması | Mükerrer konu kaydı | Normalizasyonla eşleme; yeni konu oluşturma yalnızca açık onayla (D3) |
| `StatusId 2` yanlışlıkla tetiklenir | **Geri alınamaz** | `submitForApproval` metodu hiç yazılmaz; `buildQuestionStatusPayload` sabit `1` döner; `InsertStatusId` tip düzeyinde kilit |
| UTF-8/BOM bozulması | Türkçe karakterler ve `→ ∞ ≤ ≠ ² ³ ∫ °` sembolleri bozulur | `readFileAsText` BOM temizliği; `tests/data/repository-data.test.ts` gerçek dosyalarla çalışır; `.editorconfig` `charset = utf-8` |
| Eski dizinlerin taşınması/silinmesi veri kaybı yaratır | Geri dönüş zorlaşır | **D10 revizyonu:** silme **yok**; iki dizin `legacy/` altına taşınır ve `AGENTS.md`'de "salt okunur arşiv" olarak işaretlenir. Faz 0'da git commit; `ReadOnly` özniteliği `attrib -r` ile temizlenir; taşıma ayrı bir commit olur; `legacy/` derlemeye ve `tsconfig.json` `include`'una alınmaz |
| `optionCount ≠ 5` olan bir atama seçilir | Seçenekler sessizce kırpılır | `ruleOptionCountMatch` **hata** üretir; sessiz kırpma yoktur |
| Popup kapandığında aktarım yarıda kalır | Kısmi aktarım | Aktarım service worker'da yürür (popup'ta değil); ilerleme `chrome.storage.local`'da; yeniden açılışta "Devam et" |

### Kapsam dışı (v2'ye bırakılanlar)

- Excel/CSV girişi (D4) — `papaparse` veya `exceljs`.
- Soru görseli aktarımı (D8) — base64 `<img src="data:...">` gömme.
- ~~`MixId` / `secenekler_karistirilmasin` gerçek eşlemesi~~ — **D7 kapandı** (Bulgu 28–29: sistemde karşılığı kesin olarak yok; alan `deprecated`, `MixId` sabit `0`).
- DOM/CKEditor form otomasyonu (D1 Seçenek B ve D) — `docs/module-map.md`'de **elle akış** olarak belgelenir, kodu yazılmaz.
- `QuestionGroup` (ortak metinli soru grubu) desteği — JSON şemasında karşılığı yok.
- Güncelleme/silme akışları (`Question/Update`, `Question/Delete`) — v1 yalnızca ekleme.
- Çoklu ders / toplu dosya aktarımı — v1 tek dosya + tek atama.
- Firefox/Edge hedefi — v1 yalnızca Chrome MV3.
- Uzantı simgeleri — v1'de Chrome varsayılanı; gerekirse `@wxt-dev/auto-icons`.

---

## [Revision Log]

| Sürüm | Tarih | Değişiklik |
|---|---|---|
| v1 | 2026-10-27 | İlk taslak: Bulgu 1–25, D1–D10 (D1=A, D6=statik eşleme, D7=uyarı, D10=silme), 32 adım. |
| **v2** | 2026-10-27 | **Kullanıcı onaylı revizyon paketi.** Bulgu **26–30** eklendi (`Term/GetExamStages`, `ExamType/List`=Program Türü tuzağı, `"karıştır"`=0, `MixId` vestigial/ölü kod, `optionCount` alan düzeyinde). **D1 → C (hibrit):** `src/transfer/api-guard.ts` + `src/transfer/trial.ts` + zorunlu 1 soruluk deneme kapısı + elle akışa yönlendirme; sihirbaz 5 → **6 adım**. **D6 → C (iki katman):** `ExamStageRow`/`ExamStageDictionary`/`ExamStageMatch`/`ExamStageSource` tipleri, `fetchExamStageDictionary`/`matchExamStage`/`buildStaticStageFallback`/`warnUnmatchedExamType` fonksiyonları, `AnkuzefClient.getExamStages()`, `EXAM_STAGE_UNKNOWN` kodu. **D7 → B:** alan `deprecated`, `_schema.json`'dan çıkarıldı, `DEPRECATED_FIELD` info kodu, `MixId: 0` payload'da korundu — D7 **kapandı**. **D10 → B:** silme yok, `legacy/` altına taşıma. Adım sayısı 32 → **34**; doğrulama kodları 28 → **32**; kurallar 25 → **27**; test dosyaları 17 → **19**. |

---

**Belge durumu:** v2 taslak — uygulama onayı bekleniyor. Onay verilmeden Faz 0 dışındaki adımlara başlanmaz.

