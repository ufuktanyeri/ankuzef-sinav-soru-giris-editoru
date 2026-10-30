# AGENTS.md

Bu dosya, Codex ve diğer ajan araçlarına bu depoda çalışırken rehberlik eder. Ayrıntılı ve güncel tek kaynak **`CLAUDE.md`**'dir; bu dosya onun kısa özetidir. İkisi çeliştiğinde `CLAUDE.md` geçerlidir.

## Amaç

`data/*.json` soru havuzlarını ANKUZEF soru bankasına (`https://ankuzefsinav.ankara.edu.tr`) **taslak (`StatusId 1`)** olarak aktaran Chrome MV3 eklentisi (WXT + TypeScript + zod + Vitest). Kullanıcı KDS ile kendisi giriş yapar; kimlik bilgisi hiçbir koşulda işlenmez.

## Mevcut durum (2026-10-30)

- **Çalıştırılabilir kod yok.** `package.json`, `src/`, `tests/` henüz oluşturulmadı. Build/lint/test komutları bu nedenle henüz çalışmaz.
- Git deposu var (`main`); Faz 0 ilk commit yapıldı, Faz 1 dosya taşımaları staged.
- Uygulama sırası ve tüm tip/fonksiyon imzaları **`implementation_plan.md`**'de (onaylı, 34 adım). Kod yazmadan önce ilgili fazı oku, imzalardan sapma.
- `arsiv/` altındaki `ankuzef-sinav-soru-aktarici/` ve `sinav-soru-yukleme-araci/` salt okunur arşivdir (D10): kod buradan okunmaz, derlemeye alınmaz.

## Planlı komutlar (Faz 2'de `package.json` ile gelecek)

```bash
npm install          # postinstall: wxt prepare
npm run build        # wxt build → dist/
npm run compile      # tsc --noEmit
npm run test         # vitest run
npm run check        # compile + test
npx vitest run tests/core/validate.test.ts   # tek test
```

## Değiştirilemez kurallar

- Yalnız `StatusId 1` gönderilir; `SubmitForApproval` / `StatusId 2` hiçbir kod yolunda yer almaz (D5).
- İlk çalıştırmada zorunlu 1 soruluk deneme kapısı; doğrulanmadan tam aktarım açılmaz (D1/C).
- Eksik konular yalnız kullanıcı onayıyla oluşturulur (D3). `zorluk_seviyesi` ≡ `ScoreId` (D2).
- `examStage` çalışma zamanında `Term/GetExamStages`'ten alınır; `ExamType/List` = Program Türü, sınav türü **değil** (D6).
- `secenekler_karistirilmasin` deprecated, `MixId` her zaman `0` (D7). `soru_gorseli` v1'de aktarılmaz (D8). Girdi yalnız JSON (D4).
- DOM/CKEditor form otomasyonu yazılmaz; aktarım content script üzerinden API ile yapılır.
- Testler gerçek API'ye istek atmaz; ağ katmanı sahte `Transport` ile soyutlanır.

## Veri biçimi

`data/README.md`'ye bak. Eski çıplak dizi ve yeni envelope (`{surum, ders_kodu, exam_type, sorular}`) biçimleri desteklenir. Dosyalar UTF-8 (BOM'suz), LF; Türkçe karakterler ve matematik sembolleri korunur, matematik düz metindir. `ek_ayarlar.kaynak` deseni `Hafta N - <Konu> Ders Notu`.

## Çalışma kuralları

- `.claude/rules/ecc/` kuralları geçerlidir. Commit mesajları Türkçe, `<type>(<kapsam>): <açıklama>`.
- Dokümanlar ve veri Türkçe; kod tanımlayıcıları İngilizce, girdi alan adları Türkçe.
