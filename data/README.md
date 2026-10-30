# `data/` — Soru havuzu dosyaları

Bu dizin, ANKUZEF soru bankasına aktarılacak JSON soru havuzlarını içerir.
Her dosya **bir sınav** demektir (ör. `ZAUF1106_Final_Sinavi.json`).

## Dosya adlandırma deseni

`<DERS_KODU>_<SinavTuru>_Sinavi.json` — ör. `ZAUF1106_Final_Sinavi.json`.

Eski B projesindeki 7 dosya adı (`mid-term`, `make-up`, `final`, `re-exam`,
`three-course`, `max-duration`, `deficit`) **0 bayt** olduğu için silindi;
adlandırma niyeti aşağıdaki `exam_type` tablosunda korunmuştur:

| `exam_type` (iç enum) | Eski B dosya adı | Eski TR `soru_grubu` |
|---|---|---|
| `MIDTERM` | `mid-term.json` | `ara_sinav` |
| `MAKEUP` | `make-up.json` | `mazeret` |
| `FINAL` | `final.json` | `final` |
| `RESIT` | `re-exam.json` | `butunleme` |
| `GRADUATION_DEFICIT` | `three-course.json` / `deficit.json` | `uc_ders` |
| `MAX_DURATION_EXT` | `max-duration.json` | `azami_sure` |

> **D6 notu:** bu tablo yalnızca **iç taksonomidir**. Hedef sisteme yazılacak
> `examStage` değeri statik bu tablodan değil, çalışma zamanında
> `POST Term/GetExamStages` ucundan çekilen kanonik sözlükten belirlenir.
> Ayrıntı: `docs/sinav-turu-eslemesi.md`.

## İki desteklenen biçim

**1. Eski biçim (çıplak dizi)** — mevcut depo dosyaları bu biçimdedir:

```json
[ { "konu": "...", "soru_grubu": "final", "...": "..." } ]
```

**2. Yeni biçim (envelope)** — `_schema.json` bu biçimin şablonudur:

```json
{ "surum": 1, "ders_kodu": "ZAUF1106", "exam_type": "FINAL", "sorular": [ ... ] }
```

Eski biçimde `ders_kodu` dosya adından, `exam_type` ise dosya adı + `soru_grubu`
alanından türetilir.

## Alanlar

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `konu` | ✔ | Hedef sistemdeki "Konu" kaydıyla eşleşir |
| `soru_grubu` | ✔ | Eski TR taksonomi; `exam_type` ile tutarlı olmalıdır |
| `soru_koku` | ✔ | Soru kökü. `<u>…</u>` altı çizili metin korunur |
| `soru_gorseli` | — | base64 data URI veya dosya adı. **v1'de aktarılmaz** (D8) |
| `secenekler` | ✔ | Tam olarak `A`–`E` beş anahtar; hiçbiri boş olamaz |
| `dogru_cevap` | ✔ | `A`–`E` aralığında tek harf |
| `ek_ayarlar.zorluk_seviyesi` | ✔ | `1`–`5`. Sistemdeki `ScoreId` ile **birebir** eşleşir |
| `ek_ayarlar.kaynak` | ✔ | `Hafta N - <Konu> Ders Notu` biçiminde olmalıdır |
| `ek_ayarlar.bloom_basamagi` | — | `Bilgi`/`Kavrama`/`Uygulama`/`Analiz`/`Sentez`/`Değerlendirme` |
| `ek_ayarlar.soru_turu` | — | `tanim`/`hesaplama`/`madde_imli`/`grafik_yorumlama`/`kod`/`diger` |
| `ek_ayarlar.tahmini_sure_sn` | — | Pozitif tam sayı; sınav süre bütçesi denetiminde kullanılır |

### Kullanımdan kaldırılan alan (D7)

`ek_ayarlar.secenekler_karistirilmasin` **`deprecated`**'tır ve `_schema.json`'dan
çıkarılmıştır. Hedef sistemde bu ayarın **karşılığı yoktur** — uygulama
bundle'larında "karıştır" ifadesi hiç geçmemekte, `Question.MixId` alanı ise
arayüzde hiçbir kontrole bağlı bulunmamaktadır. Alan mevcut dosyalarda `false`
olarak kalabilir (şema opsiyonel kabul eder) ancak **aktarılmaz**; eklenti
`DEPRECATED_FIELD` kodlu bir bilgi mesajı üretir. `Question.MixId` payload'da
her zaman `0` gönderilir.

## Kodlama

Tüm dosyalar **UTF-8 (BOM'suz)** ve **LF** satır sonludur. Türkçe karakterler ve
matematik sembolleri (`→ − ∞ ≤ ≠ ² ³ ∫ °`) korunmalıdır. Matematik düz metindir
(`sqrt(2)`, `x^2`), LaTeX değildir.

## Doğrulama

`_schema.json` dışındaki tüm `data/*.json` dosyaları `tests/data/repository-data.test.ts`
tarafından `parseExamFile` + `validateExamFile`'dan geçirilir; depo verisi
bozulursa test kırılır.
