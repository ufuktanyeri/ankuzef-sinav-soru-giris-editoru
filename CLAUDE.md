# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Amaç

`data/*.json` soru havuzlarını Ankara Üniversitesi ANKUZEF soru bankasına (`https://ankuzefsinav.ankara.edu.tr`) **taslak (`StatusId 1`)** olarak aktaran bir Chrome MV3 eklentisi (WXT). Kullanıcı KDS ile kendisi giriş yapar; eklenti ve tarayıcı tabanlı her analiz önce aktif oturumu doğrular, yoksa kullanıcıdan giriş ister. **Kimlik bilgisi hiçbir koşulda işlenmez.**

## Mevcut durum (2026-10-30)

- **Henüz çalıştırılabilir kod yok.** Depo yalnızca dokümanlar, veri ve `implementation_plan.md` içerir. `package.json`, `tsconfig.json`, `wxt.config.ts`, `src/`, `tests/` henüz oluşturulmadı.
- Tek kaynak: **`implementation_plan.md`** (onaylı, 34 adımlı). Faz 0 (git init + ilk commit) tamamlandı; Faz 1 dosya taşımaları staged. Kod yazmadan önce ilgili fazı ve `[Types]`/`[Functions]` bölümlerini oku; oradaki tip ve fonksiyon imzalarından sapma.
- `ankuzef-sinav-soru-aktarici/` ve `sinav-soru-yukleme-araci/` eski proje taslaklarıdır (D10): **salt okunur arşiv**, kod buradan okunmaz, derlemeye ve test taramasına alınmaz. Faz 7'de `legacy/` altına taşınacak, silinmeyecek. `src/app.js` ve `src/rules-checker.js` 0 bayttır.
- `.antigravity/ankuzef.rules` şu an `ankuzef-sinav-soru-aktarici/.antigravity/` altındadır; köke taşınması planlanmıştır.

## Komutlar (plandaki `package.json`, Faz 2'de oluşturulacak)

```bash
npm install            # postinstall: wxt prepare → .wxt/ üretir
npm run dev            # wxt (geliştirme)
npm run build          # wxt build → dist/ (MV3 manifest, background, content, popup, preview)
npm run zip            # wxt zip
npm run compile        # tsc --noEmit (strict + noUncheckedIndexedAccess)
npm run test           # vitest run
npm run test:watch     # vitest
npm run check          # compile + test
npx vitest run tests/core/validate.test.ts   # tek test dosyası
```

Testler `WxtVitest()` ile çalışır; `browser.*` API'leri `@webext-core/fake-browser` ile taklit edilir, her testte `fakeBrowser.reset()` çağrılır. Testler **gerçek ANKUZEF API'sine istek atmaz**; ağ katmanı sahte `Transport` ile soyutlanır. Elle E2E yalnızca kullanıcıyla, KDS oturumu kullanıcıda.

## Hedef mimari

Katmanlar `src/` altında, bağımlılık yönü yukarıdan aşağıya tek yönlüdür:

| Katman | Sorumluluk |
|---|---|
| `core/` | Saf TypeScript, tarayıcı API'si yok. zod şema + normalizasyon (`schema.ts`), sınav türü eşlemesi (`exam-type.ts`), metin→HTML (`html.ts`), JSON→`Question/Insert` eşlemesi (`mapping.ts`), 27 kurallı doğrulama motoru (`validate.ts`), istatistik, mükerrer tespiti |
| `api/` | ANKUZEF sözleşmesi: `endpoints.ts`, `transport.ts`, `session.ts` (localStorage JWT okuma), `payload.ts` (site fabrika varsayılanları), `AnkuzefClient` |
| `transfer/` | `quota.ts`, `PlanBuilder` (dry-run, **hiç yazma çağrısı yapmaz**), `api-guard.ts`, `trial.ts`, `TransferRunner` |
| `preview/` | JSON'dan üretilen yazdırılabilir soru kartı sayfası + `rules-checker.ts` |
| `entrypoints/` | `background.ts` (MessageRouter), `ankuzef.content.ts` (`matches: https://ankuzefsinav.ankara.edu.tr/*`), `popup/`, `preview/` |

**Aktarım yöntemi (D1/C, hibrit):** content script sayfanın kendi oturumuyla API'yi (`https://ankuzefsinavapi.ankara.edu.tr`, path ön eki yok) `fetch` ile çağırır. DOM/CKEditor form otomasyonu **yazılmaz**. MAIN world betiği gerekmez.

## Değiştirilemez kurallar (plan kararları)

- **D5:** Yalnız `StatusId 1` gönderilir. `Question/SubmitForApproval` veya `StatusId 2` hiçbir kod yolunda yer almaz (geri alınamaz).
- **D1/C deneme kapısı:** İlk çalıştırmada zorunlu 1 soruluk deneme; sunucudan geri okunup doğrulanmadan tam aktarım düğmesi açılmaz. API beklenmedik şema dönerse (`process` alanı yok) aktarım durur, kullanıcı `docs/module-map.md`'deki elle akışa yönlendirilir.
- **D3:** Eksik `konu` kayıtları yalnızca ön izlemede kullanıcı onayıyla oluşturulur; varsayılan onay kutuları işaretsiz.
- **D2:** `ek_ayarlar.zorluk_seviyesi` (1–5) ≡ sistem `ScoreId`, birebir, varsayılan 3.
- **D6:** `examStage` birincil kaynağı çalışma zamanında `POST Term/GetExamStages`; statik eşleme yalnız çevrimdışı yedektir. **Tuzak:** `ExamType/List` = "Program Türü"dür, sınav türü değildir.
- **D7:** `secenekler_karistirilmasin` deprecated; okunur, aktarılmaz, `DEPRECATED_FIELD` info üretir. `Question.MixId` her zaman `0`.
- **D8:** `soru_gorseli` v1'de aktarılmaz; doluysa uyarı.
- **D4:** v1 girdi yalnız JSON; `xlsx` paketi CVE nedeniyle reddedildi.
- Sistemdeki `QuestionGroup` (ortak metinli grup) JSON'daki `soru_grubu` (sınav türü) ile **ilgisizdir**.
- Transport: her POST'ta `Authorization: Bearer <token>` **ve** gövde düz nesne ise gövdeye `Token` alanı; yanıt `{process, description?, message?, data?}`, `process === false` hata, HTTP 403 → "Yetkiniz bulunmamaktadır."
- Kota: `statusId ∈ {2..8}` ve `userId === benim` sorular sayılır; taslaklar kotayı tüketmez. Aktarım `[startDate, finishDate]` dışında reddedilir.

## Veri biçimi (`data/`)

Ayrıntı `data/README.md`. İki biçim desteklenir: **eski çıplak dizi** (mevcut `ZAUF1106_*.json`, 20'şer soru) ve **envelope** (`{surum, ders_kodu, exam_type, sorular}`, şablonu `_schema.json`). Eski biçimde `ders_kodu` dosya adından, `exam_type` dosya adı + `soru_grubu`'ndan türetilir. İç enum 6 değerlidir: `MIDTERM, MAKEUP, FINAL, RESIT, GRADUATION_DEFICIT, MAX_DURATION_EXT`.

- Dosya adı deseni `<DERS_KODU>_<SinavTuru>_Sinavi.json`; `soru_grubu` dosya içinde tutarlı ve dosya adıyla uyumlu olmalı (aksi `GROUP_MISMATCH`).
- UTF-8 (BOM'suz), LF. Türkçe karakterler ve matematik sembolleri (`→ − ∞ ≤ ≠ ² ³`) korunur; matematik düz metindir (`sqrt(2)`, `x^2`), LaTeX değil.
- `soru_koku` içindeki `<u>…</u>` (olumsuz soru kökü vurgusu) korunur; `toQuestionHtml` izinli satır içi etiketleri tutar, gerisini kaçırır.
- `ek_ayarlar.kaynak` deseni zorunlu: `Hafta N - <Konu> Ders Notu`.
- `tests/data/repository-data.test.ts` (planlı) tüm `data/*.json` dosyalarını doğrular; `ZAUF1106_Final` dosyası `MIN_GUIDE_DISTRIBUTION` **uyarısı** verir (dağılım 4/13/3), bu beklenen davranıştır, hata değil.

## Doğrulama kuralları

`src/core/validate.ts` tek doğrulama katmanıdır; hem eklentide hem ön izlemede kullanılır. Kaynak yönergeler:

- `docs/soru-yazim-yonergesi.md` (§5 zorluk/Bloom, §7 olumsuz kök, §9–§10 kurallar) → **hata** seviyesi.
- `docs/degerlendirme-olcutleri.md` (2 kolay / 16 orta / 2 zor dağılımı) → **uyarı** seviyesi (daha genel kurum yönergesi).
- `STRUCTURAL_RULES` başarısızsa `CONTENT_RULES` çalışmaz.

## Dokümanlar

- `implementation_plan.md` — mimari, tipler, fonksiyon imzaları, test kapsamı, 34 adımlık sıra, Bulgu 1–30 ve D1–D10 kararları.
- `docs/algoritma.md` — onaylı algoritma özeti ve bulgular.
- `docs/kaynak-raporu.md` — kütüphane seçimleri ve reddedilenler (WXT, zod, vitest).
- `docs/sinav-turu-eslemesi.md` — TR sınav türü ↔ `ExamType` enum tablosu.
- Planlı: `docs/api-sozlesmesi.md`, `docs/module-map.md`, `docs/extension-architecture-plan.md`, `docs/birlestirme-gunlugu.md`.

## Çalışma kuralları

- `.claude/rules/ecc/` altındaki ECC kuralları geçerlidir (immutability, <50 satır fonksiyon, conventional commits, %80 test kapsamı). Kod öncesi `docs/algoritma.md` ve `docs/kaynak-raporu.md` güncel olmalı (`proje-gelistirme-akisi` skill'i).
- Commit mesajları Türkçe, `<type>(<kapsam>): <açıklama>` biçiminde (ör. `chore(faz-0): ...`).
- Depodaki `.md` ve `.json` dosyaları Türkçe; kod tanımlayıcıları İngilizce (`ExamType`, `AnkuzefClient`), girdi alan adları Türkçe (`soru_koku`, `dogru_cevap`).
