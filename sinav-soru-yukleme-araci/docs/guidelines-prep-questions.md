# Sınav Soruları Hazırlama Yönergesi

## 1. Amaç ve Kapsam

Bu yönerge, 14 haftalık bir lisans dersi için üç sınavın (ara sınav, final, bütünleme) soru havuzlarının hazırlanmasında uyulması gereken kuralları tanımlar.

Her sınav **20 çoktan seçmeli soru** içerir ve her soru **beş seçeneklidir (A–E)**. Üç sınav toplamında **60 soru** üretilir.

Üretilen sorular, Bölüm 10'da tanımlanan **JSON şablonuna** uygun biçimde kaydedilir.

## 2. Kaynak İçerik Kısıtı

- Sorular, yalnızca ilgili haftaya ait ders notu dosyasındaki içerikten üretilir.
- Ders notunda geçmeyen kavram, formül veya örnek soruya dâhil edilmez.
- Çıkarım gerektiren sorularda çıkarımın tüm adımları ders notundaki bilgilerle yapılabilmelidir.
- Her soru, üretildiği ders notuna JSON şablonundaki `ek_ayarlar.kaynak` alanı üzerinden açıkça bağlanır (bkz. Bölüm 10).

## 3. Sınav Türlerine Göre Hafta Dağılımı

### 3.1. Ara Sınav (20 soru)

Ara sınav yalnızca **1–6. haftalar** arasındaki konuları kapsar.

| Hafta             | Soru Sayısı |
| ----------------- | ----------- |
| Hafta 1           | 3           |
| Hafta 2           | 3           |
| Hafta 3           | 3           |
| Hafta 4           | 3           |
| Hafta 5           | 3           |
| Hafta 6           | 3           |
| **Temel dağılım** | **18**      |
| **Ek sorular**    | **2**       |
| **Toplam**        | **20**      |

Kalan 2 soru, 1–6. hafta aralığı içinde soru yazmaya en elverişli konudan seçilir. Bu 2 ek soru, 1–6 hafta aralığındaki istenen haftaya dağıtılabilir.

### 3.2. Final Sınavı (20 soru)

Final sınavı tüm dönemi (**1–13. haftalar**) kapsar.

| Hafta Aralığı | Her Haftadan | Toplam |
| ------------- | ------------ | ------ |
| Hafta 1–6     | 1 soru       | 6      |
| Hafta 7–13    | 2 soru       | 14     |
| **Toplam**    |              | **20** |

### 3.3. Bütünleme Sınavı (20 soru)

Bütünleme sınavı, final sınavıyla **aynı hafta dağılımını** kullanır (Hafta 1–6: 1'er soru, Hafta 7–13: 2'şer soru). Sorular final sorularından **farklı** olmalıdır (bkz. Bölüm 4).

## 4. Soruların Özgünlüğü ve Varyasyon Stratejileri

### 4.1. Temel Kural

60 sorunun her biri birbirinden farklı olmalıdır. Bir soru; soru kökü, çözüm yolu ve işaretli cevabıyla birlikte bir bütün olarak değerlendirilir.

### 4.2. Varyasyon İzni

Bir haftanın ders notu içeriği sınırlıysa ve aynı konudan birden fazla soru üretilmesi gerekiyorsa, daha önce yazılmış bir soru aşağıdaki yöntemlerle **varyasyonlanarak** yeniden kullanılabilir. Varyasyon, özgünlük kuralını ihlal etmez.

**4.2.1. Olumsuz → olumlu dönüşümü**
Bir soruda "hangisi yanlıştır?" yerine "hangisi doğrudur?" sorulması, ya da tersine çevrilmesi.

**4.2.2. Nicel değer değişimi**
Sayısal parametreleri değiştirme (örneğin `|5+12i|` yerine `|6+8i|`; `f(x)=2x+3, f(4)=?` yerine `f(x)=3x−7, f(5)=?`).

**4.2.3. Operatör değişimi**
İşlemin matematiksel/mantıksal operatörünü değiştirme; konu kapsamı bozulmayacak biçimde:

- Toplama ↔ çıkarma ↔ çarpma
- Küçüktür ↔ büyüktür
- Maksimum ↔ minimum
- VE ↔ VEYA

**4.2.4. Madde imli dönüşüm (bilgi düzeyi soruları için)**
Temel kavram ve tanım sorularında soru kökü Roma rakamlı (I, II, III) maddelere dönüştürülerek "aşağıdaki ifadelerden hangisi/hangileri doğrudur?" formatına çevrilebilir.

**4.2.5. Kod sorularında varyasyon**
Kodlama sorularında şu değişiklikler yapılabilir:

- Boş bırakılan satırın yerini değiştirme
- Kod çıktısını etkileyecek düzenlemeler
- Değişken adlarını değiştirme (anlam kaybettirmeden)

### 4.3. İpucu Yasağı

Hiçbir sorunun metni veya seçenekleri, başka bir sorunun cevabını doğrudan veya dolaylı olarak imlemez.

## 5. Zorluk Seviyesi

### 5.1. Skala

Her soru, aşağıdaki beş seviyeli ölçekte değerlendirilir. JSON şablonundaki `ek_ayarlar.zorluk_seviyesi` alanına bu tablodaki **sayısal değer** yazılır (bkz. Bölüm 10).

| Değer | Etiket    | Bloom Basamağı (Tipik) |
| ----- | --------- | ---------------------- |
| 1     | Çok Kolay | Bilgi                  |
| 2     | Kolay     | Kavrama                |
| 3     | Orta      | Uygulama               |
| 4     | Zor       | Analiz                 |
| 5     | Çok Zor   | Sentez / Değerlendirme |

Zorluk seviyesinin belirlenmesinde **Bloom taksonomisi** esas alınır: bir sorunun zorluğu, öğrenciden istenen bilişsel sürecin basamağı ile ilişkilendirilir.

### 5.2. Varsayılan Dağılım

Kullanıcı (soru hazırlatan öğretim elemanı) özel bir dağılım belirtmediği sürece, her sınavdaki 20 sorunun zorluk dağılımında **kolay (1–2) ve orta (3) seviyeli sorular tercih edilir**. Varsayılan dağılım aşağıdaki gibidir:

| Seviye Grubu            | Önerilen Oran |
| ----------------------- | ------------- |
| Çok Kolay + Kolay (1–2) | %20 – %40     |
| Orta (3)                | %40 – %60     |
| Zor + Çok Zor (4–5)     | %10 – %20     |

Zor + Çok Zor grubunun toplam oranı sınav başına **%20'yi aşmamalıdır**.

### 5.3. Kullanıcı Girdisine Göre Özelleştirme

Kullanıcı, sınav türü bazında farklı bir zorluk dağılımı talep edebilir. Bu durumda:

- Kullanıcının verdiği dağılım, Bölüm 5.2'deki varsayılan dağılımın **yerine geçer**.
- Kullanıcı girdisi, kesin sayılarla (ör. "ara sınav için 4 kolay, 12 orta, 4 zor") veya oranlarla (ör. "final için %30 kolay, %50 orta, %20 zor") verilebilir.
- Kullanıcı yalnızca bazı seviyeler için değer verdiyse, geri kalan seviyeler için varsayılan aralıklar korunur.
- Kullanıcı girdisi, Bölüm 5.1'deki beş seviyeli skalanın dışına çıkamaz; toplamı 20 soruyu aşamaz veya eksik bırakamaz.
- Kullanıcı tarafından belirtilen dağılım, soru havuzu üretildikten sonra doğrulama raporunda (Bölüm 9) referans alınır.

Kullanıcı girdisi yoksa Bölüm 5.2'deki varsayılan dağılım uygulanır.

## 6. Soru Türleri ve Çeşitlilik

20 soruluk bir sınavda aşağıdaki soru türlerinden **mümkün olduğunca farklı kapsamlar** kullanılır:

- Temel kavramlar ve tanımlar (bilgi düzeyi)
- Formül/kural uygulama (uygulama düzeyi)
- Grafik veya tablo yorumlama
- Hesaplama gerektiren sayısal sorular
- Madde imli (I, II, III) çoklu ifade değerlendirme soruları
- (Kodlama içeren derslerde:) kod sözdizimi, kod çıktısı, kod hatası, eksik kod tamamlama

Aynı türden sorular bir sınav içinde kümelenmemelidir.

## 7. Soru Kökü ve Seçenek Biçimi

### 7.1. Olumlu Soru Tercihi

Soru kökleri öncelikle olumlu kurulur ("aşağıdakilerden hangisi doğrudur?", "hangi ifade geçerlidir?" gibi).

### 7.2. Olumsuz Soru Kökü

Olumsuz soru kökleri ("değildir", "yanlıştır", "olmayan") zorunlu olmadıkça kullanılmaz. Kullanıldığında:

- Soru kökündeki olumsuz kelime **altı çizili** olarak yazılır.
- JSON şablonunda altı çizgi, HTML `<u>...</u>` etiketi ile işaretlenir (bkz. Bölüm 10.3).
- Örnek: `Aşağıdakilerden hangisi sürekli fonksiyonun koşulu <u>değildir</u>?`

### 7.3. Yasaklı Seçenekler

Aşağıdaki ifadeler hiçbir seçenekte kullanılmaz:

- "Hepsi"
- "Yukarıdakilerin hepsi"
- "Hiçbiri"
- "Yukarıdakilerin hiçbiri"

### 7.4. Seçenek Sayısı

Her sorunun **tam olarak 5 seçeneği (A, B, C, D, E)** bulunur ve yalnızca **bir** doğru cevap işaretlenir.

## 8. Süre Kısıtı

Her sınavda yer alan 20 soru, ortalama bir öğrenci tarafından **30 dakika içinde** yanıtlanabilir olmalıdır. Bu, soru başına yaklaşık **1,5 dakika** demektir. Süre kısıtını aştıracak uzunlukta okuma veya hesap gerektiren sorular kullanılmaz.

## 9. Doğrulama Kontrol Listesi

Bir soru havuzu tamamlandığında, havuzu sürüme almadan önce aşağıdaki kontrol listesi uygulanır:

- [ ] Her sınavda tam 20 soru var mı?
- [ ] Her soru 5 seçenekli mi, tek doğru cevap belirli mi?
- [ ] Ara sınavda Hafta 1–6 dağılımı (her biri en az 3 soru) sağlanmış mı?
- [ ] Final/Bütünleme'de Hafta 1–6 için 1'er, Hafta 7–13 için 2'şer soru mevcut mu?
- [ ] 60 sorunun hepsi birbirinden farklı mı?
- [ ] Zorluk dağılımı; kullanıcı girdisi varsa ona, yoksa Bölüm 5.2'deki varsayılana uygun mu?
- [ ] Hiçbir soruda "Hepsi" veya "Hiçbiri" seçeneği yok mu?
- [ ] Olumsuz soru köklerindeki olumsuz kelimenin altı `<u>...</u>` ile çizili mi?
- [ ] Tüm sorular yalnızca ders notu içeriğinden üretildi mi?
- [ ] Soru türü çeşitliliği her sınavda en az 3 farklı tür içeriyor mu?
- [ ] Her sorunun matematiksel/mantıksal doğruluğu bağımsız olarak doğrulandı mı?
- [ ] 20 sorunun toplam çözüm süresi tahmini 30 dakikayı aşmıyor mu?
- [ ] Soru metinleri veya seçenekleri başka bir sorunun cevabını ele vermiyor mu?
- [ ] `ek_ayarlar.kaynak` alanı `"Hafta X - <Konu Başlığı> Ders Notu"` desenine uyuyor mu?
- [ ] Tüm sorular JSON şablonuna (Bölüm 10) tam uygun mu?

## 10. JSON Şablonu

### 10.1. Dosya Yapısı

Her sınav türü için ayrı bir JSON dosyası oluşturulur. Dosya, köklü bir JSON dizisi (array) içerir ve her eleman bir soruyu temsil eder.

Önerilen dosya adlandırma deseni:
{DERS_KODU}_Ara_Sinav.json
{DERS_KODU}_Final_Sinavi.json
{DERS_KODU}_Butunleme_Sinavi.json

### 10.2. Soru Nesnesi Şeması

Her soru nesnesi aşağıdaki alanları içerir.

| Alan                                    | Tür           | Zorunlu      | Açıklama                                                                                         |
| --------------------------------------- | ------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `konu`                                  | string        | Evet         | Sorunun bağlı olduğu konu başlığı (hafta başlığıyla uyumlu)                                      |
| `soru_grubu`                            | string        | Evet         | Sınav türü: `ara_sinav`, `final` veya `butunleme`                                                |
| `soru_koku`                             | string        | Evet         | Soru metni. Olumsuz kelime varsa `<u>...</u>` ile sarılır                                        |
| `secenekler`                            | object        | Evet         | `A`–`E` anahtarlı beş seçenek                                                                    |
| `dogru_cevap`                           | string        | Evet         | Doğru seçeneğin harfi (`A`–`E`)                                                                  |
| `ek_ayarlar`                            | object        | Evet         | Alt alanlar aşağıda                                                                              |
| `ek_ayarlar.zorluk_seviyesi`            | integer (1–5) | Evet         | Bölüm 5.1'deki skala                                                                             |
| `ek_ayarlar.secenekler_karistirilmasin` | boolean       | Evet         | `true` ise seçenek sırası korunur (ör. sıralı sayısal seçenekler için)                           |
| `ek_ayarlar.kaynak`                     | string        | Evet         | Kaynak ders notu başlığı. Desen: `"Hafta X - <Konu Başlığı> Ders Notu"` (bkz. Bölüm 10.3)        |
| `ek_ayarlar.bloom_basamagi`             | string        | İsteğe bağlı | `Bilgi`, `Kavrama`, `Uygulama`, `Analiz`, `Sentez`, `Değerlendirme`                              |
| `ek_ayarlar.soru_turu`                  | string        | İsteğe bağlı | Bölüm 6'daki türlerden biri (ör. `"tanım"`, `"hesaplama"`, `"madde_imli"`, `"grafik_yorumlama"`) |
| `ek_ayarlar.tahmini_sure_sn`            | integer       | İsteğe bağlı | Sorunun tahmini çözüm süresi (saniye)                                                            |

### 10.3. `kaynak` Alanı Deseni

`ek_ayarlar.kaynak` alanı, sorunun üretildiği ders notunun başlığını birebir taşır. Desen:

Hafta X - <Konu Başlığı> Ders Notu

- `X`: Hafta numarası (1–13 arası, baştaki sıfır olmadan: `Hafta 6`, `Hafta 12`).
- `<Konu Başlığı>`: Ders notu dosyasının başlık satırında geçen konu adı, birebir ve kısaltmasız.
- Ayraç olarak kısa tire (`-`) kullanılır; öncesinde ve sonrasında tek boşluk bırakılır.
- Tırnak veya ek noktalama kullanılmaz.

**Örnekler:**

Hafta 1 - Önerme Mantığı ve Doğruluk Tabloları Ders Notu
Hafta 6 - Logaritma Fonksiyonu ve Özellikleri Ders Notu
Hafta 7 - Türev Kavramı ve Temel Türev Kuralları Ders Notu
Hafta 10 - Belirsiz İntegral Ders Notu

### 10.4. Tek Soru Örneği

```json
{
  "konu": "Logaritma Fonksiyonu ve Özellikleri",
  "soru_grubu": "ara_sinav",
  "soru_koku": "log₂(32) ifadesinin değeri kaçtır?",
  "secenekler": {
    "A": "5",
    "B": "3",
    "C": "4",
    "D": "6",
    "E": "8"
  },
  "dogru_cevap": "A",
  "ek_ayarlar": {
    "zorluk_seviyesi": 2,
    "secenekler_karistirilmasin": false,
    "kaynak": "Hafta 6 - Logaritma Fonksiyonu ve Özellikleri Ders Notu",
    "bloom_basamagi": "Uygulama",
    "soru_turu": "hesaplama",
    "tahmini_sure_sn": 60
  }
}
```

Olumsuz soru kökü içeren bir örnek:

```json
{
  "konu": "Fonksiyon Kavramı, Limit ve Süreklilik",
  "soru_grubu": "final",
  "soru_koku": "Aşağıdakilerden hangisi sürekli fonksiyonun koşulu <u>değildir</u>?",
  "secenekler": {
    "A": "f(a) tanımlı olmalıdır",
    "B": "lim (x→a) f(x) mevcut olmalıdır",
    "C": "lim (x→a) f(x) = f(a) olmalıdır",
    "D": "Fonksiyon her noktada türevlenebilir olmalıdır",
    "E": "a noktası f'nin tanım kümesinde olmalıdır"
  },
  "dogru_cevap": "D",
  "ek_ayarlar": {
    "zorluk_seviyesi": 3,
    "secenekler_karistirilmasin": false,
    "kaynak": "Hafta 4 - Fonksiyon Kavramı, Limit ve Süreklilik, Grafik Yorumlama Ders Notu",
    "bloom_basamagi": "Analiz",
    "soru_turu": "tanım",
    "tahmini_sure_sn": 90
  }
}
```

### 10.5. Tam Sınav Dosyası İskeleti

Bir sınav dosyası aşağıdaki genel yapıya sahiptir:

```json
[
  { /* Soru 1: Bölüm 10.2'deki şemaya göre */ },
  { /* Soru 2 */ },
  { /* ... */ },
  { /* Soru 20 */ }
]
```

Dosya; 20 soru içerir, UTF-8 kodlamasıyla kaydedilir ve JSON standardına (`JSON.parse` ile ayrıştırılabilir) uygundur.

### 10.6. Validasyon Kuralları

Bir JSON dosyası aşağıdaki koşulları sağlamalıdır:

- Dosya bir JSON dizisidir ve tam olarak 20 eleman içerir.
- Her eleman Bölüm 10.2'deki **zorunlu** alanların tümünü içerir.
- `secenekler` nesnesi tam olarak `A`, `B`, `C`, `D`, `E` anahtarlarını içerir.
- `dogru_cevap` değeri `["A","B","C","D","E"]` kümesindedir.
- `ek_ayarlar.zorluk_seviyesi` 1 ile 5 (dâhil) arasında bir tam sayıdır.
- `ek_ayarlar.kaynak` `"Hafta X - <Konu Başlığı> Ders Notu"` desenine tam uyar (Bölüm 10.3).
- `soru_grubu` değeri, dosya adındaki sınav türüyle tutarlıdır (ör. `*_Ara_Sinav.json` için `ara_sinav`).
- Bir dosya içindeki 20 `soru_koku` değeri birbirinden farklıdır.
