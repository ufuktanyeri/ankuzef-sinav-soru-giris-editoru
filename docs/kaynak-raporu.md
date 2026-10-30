# Kaynak Raporu — ANKUZEF Soru Aktarıcı

Durum: **Onaylandı (2026-10-27).** Aşağıdaki seçimler `implementation_plan.md` `[Dependencies]` bölümünde sabitlendi.
Sürüm/lisans bilgileri `npm view` ile 2026-10-26 tarihinde doğrulandı. Ortam: Node v24.22.1, npm 11.13.0.

## 1. Eklenti çatısı

| Araç | Sürüm | Lisans | Son güncelleme | Değerlendirme |
|---|---|---|---|---|
| **WXT** | 0.21.5 | MIT | 2026-10-26 | Vite tabanlı; manifest'i dosya yapısından üretir, MV3 + HMR, TS yerleşik. Aktif bakımda. **Önerilen.** |
| @crxjs/vite-plugin | 3.0.0 | MIT | 2026-09-24 | Saf Vite eklentisi; daha az soyutlama, manifest elle yazılır. İyi bir alternatif. |
| Plasmo | 0.90.5 | MIT | 2025-05-17 | ~1,5 yıldır güncellenmemiş. **Önerilmez.** |
| Sıfırdan (Vite + elle manifest) | — | — | — | Çoklu giriş noktası ve HMR elle kurulur; kazanç yok. |

Gerekçe: WXT, kullanıcının MV3 kılavuzundaki gereksinimleri (Vite, TS, `dist/` çıktı, asgari izin) hazır karşılıyor; `outDir` `dist/` olarak ayarlanabilir.

## 2. Çekirdek kütüphaneler

| Paket | Sürüm | Lisans | Kullanım | Karar |
|---|---|---|---|---|
| typescript | 7.0.2 | Apache-2.0 | Dil | Kullan |
| zod | 4.6.7 | MIT | JSON şema doğrulama (`data/*.json`) | Kullan |
| vitest | 5.0.5 | MIT | `core/` birim testleri | Kullan |
| @types/chrome | 0.3.6 | MIT | Tipler (WXT kendi tiplerini de sağlar) | Gerekirse |
| dompurify | 3.4.17 | MPL-2.0 / Apache-2.0 | HTML temizleme | **Gereksiz** — girdi düz metin; basit HTML kaçışı yeterli |

## 3. Excel girişi (ilk sürüm için isteğe bağlı)

| Paket | Sürüm | Lisans | Not |
|---|---|---|---|
| xlsx (npm) | 0.18.5 | Apache-2.0 | npm'deki sürüm eski; SheetJS yeni sürümleri kendi CDN'inden dağıtıyor. Prototype pollution açığı (CVE-2023-30533) 0.19.3'te kapatıldı; npm'deki 0.18.5 etkileniyor. **Önerilmez.** |
| exceljs | 4.4.0 | MIT | Son yayın 2024-12; büyük paket. Gerekirse bu. |
| papaparse | 5.7.0 | MIT | CSV için hafif ve güncel. |

Öneri: İlk sürüm yalnızca JSON; Excel ihtiyacı doğarsa "Excel'den CSV kaydet + papaparse" ya da exceljs.

## 4. Benzer açık kaynak projeler

Hedef sistem kuruma özel bir Vue SPA olduğundan hazır bir aktarıcı beklenmiyor; ayrıca kod deposu taraması yapılmadı. Yeniden kullanılabilir parça olarak yalnızca yukarıdaki genel kütüphaneler değerlendirildi.

## 5. Öneri

- **Temel al:** WXT (çatı) + TypeScript + zod + vitest.
- **Sıfırdan geliştir:** `core/` (eşleme, doğrulama, HTML kaçışı) ve `api/` (ANKUZEF istemcisi) — kuruma özgü.
- **Kullanma:** Plasmo, npm `xlsx`, dompurify.

## 6. Önerilen iskelet

```text
ankuzef-sinav-soru-aktarici/
├─ wxt.config.ts            # manifest: izinler, host_permissions, outDir: dist
├─ package.json / tsconfig.json
├─ entrypoints/
│  ├─ popup/                # index.html + main.ts (arayüz)
│  ├─ background.ts         # service worker, mesaj yönlendirme
│  └─ ankuzef.content.ts    # matches: ankuzefsinav.ankara.edu.tr/*
├─ src/
│  ├─ core/                 # schema.ts, mapping.ts, html.ts, validate.ts (saf, testli)
│  ├─ api/                  # ankuzef-client.ts (uç noktalar, token)
│  └─ messages.ts           # mesaj tipleri (popup ↔ bg ↔ content)
├─ tests/                   # vitest; data/*.json fixture olarak
└─ data/                    # mevcut örnek sorular
```
