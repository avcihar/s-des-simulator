# 🔐 S-DES (Simplified DES) Kriptografi Simülatörü ve Analiz Laboratuvarı

S-DES (Simplified Data Encryption Standard) algoritmasının iç işleyişini, çalışma modlarını ve kriptanaliz yöntemlerini adım adım görselleştiren, interaktif ve web tabanlı bir eğitim/simülasyon aracıdır.

Bilgisayar mühendisliği ve kriptografi öğrencileri için algoritmanın karmaşık matematiksel temellerini (Permütasyonlar, Feistel ağları, S-Kutuları ve Diferansiyel Analiz) anlaşılır bir arayüzle sunmayı hedefler.

🚀 **[Canlı Demoyu Hemen İnceleyin](https://avcihar.github.io/s-des-simulator/)**

![S-DES Simulator](https://img.shields.io/badge/Status-Active-success)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

---

## ✨ Temel Özellikler

- **Adım Adım Algoritma Görselleştirmesi:** Anahtar üretimi (P10, P8, Left Shifts), Başlangıç Permütasyonu (IP), Feistel Ağları (Fk), S-Box tabloları ve SWAP adımlarını detaylı animasyonlar ve şemalarla inceleme imkanı.
- **Çalışma Modları Desteği:**
  - `CORE` (Tekil 8-bit blok işleme)
  - `ECB` (Electronic Codebook)
  - `CBC` (Cipher Block Chaining)
  - `OFB` (Output Feedback)
- **Çoklu Veri Formatları:** ASCII (Metin), Binary (İkilik), Hex (Onaltılık), Octal (Sekizlik) ve Decimal (Onluk) giriş/çıkış desteği.
- **Diferansiyel Analiz (Differential Cryptanalysis):** - S0 ve S1 kutuları için Diferansiyel Dağılım Tablolarının (DDT) otomatik çıkarılması.
  - Hedef anahtarı bulmak için IP, EP ve P4 ters permütasyonlarının adım adım simüle edilmesi.
  - Olası K2 ve Master Key (10-bit) adaylarının daraltılarak kesin anahtarın izole edilmesi.
- **Brute-Force vs Diferansiyel Analiz Kıyaslaması:** İki farklı saldırı yönteminin hedef anahtarı bulma sürelerinin (ms cinsinden) canlı olarak test edilip kıyaslanması.
- **Otomatik Sistem Testleri:** Stallings referans değerleri ve kaba kuvvet doğrulamalarını içeren gömülü (T_01 - T_05) test senaryoları.

---

## 🛠️ Kurulum ve Kullanım

Bu proje tamamen **istemci tarafında (client-side)** çalışır. Herhangi bir sunucu kurulumuna, veritabanına veya bağımlılığa (NPM vb.) ihtiyacı yoktur.

### Seçenek 1: Canlı Demo (Önerilen)
Hiçbir şey indirmeden projeyi doğrudan tarayıcınız üzerinden kullanabilirsiniz:
👉 **[https://avcihar.github.io/s-des-simulator/](https://avcihar.github.io/s-des-simulator/)**

### Seçenek 2: Yerel Olarak Çalıştırma (Local)
1. Projeyi bilgisayarınıza klonlayın veya `.zip` olarak indirin:
   ```bash
   git clone [https://github.com/avcihar/s-des-simulator.git](https://github.com/avcihar/s-des-simulator.git)
   ```
2. İndirdiğiniz klasörün içindeki `index.html` dosyasını herhangi bir modern web tarayıcısında (Chrome, Firefox, Edge vb.) açın.

---

## 📁 Dosya ve Mimari Yapısı

Proje, Modüler Yapı (Separation of Concerns) prensibine uygun olarak Çekirdek (Core) ve Arayüz (UI) sınıflarına ayrılmıştır.

```text
📂 s-des-simulator
├── 📄 index.html             # Ana kullanıcı arayüzü ve DOM iskeleti
├── 📄 app.js                 # Uygulama başlatıcı ve global Controller bağlantıları
├── 📂 assets
│   └── 📄 style.css          # Özel kaydırma çubukları, bit-box stilleri ve yazı tipleri
├── 📂 core                   # Kriptografi Algoritmaları (İş Mantığı)
│   ├── 📄 SdesUtils.js       # Format dönüşümleri, Binary bloklama, Permütasyon ve XOR işlemleri
│   ├── 📄 sdes_core.js       # Temel S-DES çekirdeği (KeyGen, Fk, SBox Lookup, IP/EP işlemleri)
│   ├── 📄 sdes_modes.js      # ECB, CBC ve OFB modlarının orkestrasyonu
│   ├── 📄 diff_analysis.js   # Diferansiyel analiz, DDT matrisi ve anahtar kırılma denklemleri
│   └── 📄 sdes_attacker.js   # Brute-Force ve Diferansiyel saldırı tetikleyicisi
├── 📂 tests                  # Otomatik Testler
│   └── 📄 test_runner.js     # Şifreleme doğrulama testleri (T_01 - T_05)
└── 📂 ui                     # Arayüz Yöneticileri (View Controllers)
    ├── 📄 ui_step_controller.js  # Şifreleme simülasyonu adım yöneticisi
    ├── 📄 ui_diff_step.js        # Diferansiyel analiz UI çizimleri (Dark Mode & Tablolar)
    ├── 📄 ui_dif_step_controller.js # Diferansiyel analiz DOM kontrolcüsü
    └── 📄 ui_test_controller.js  # Kıyaslama (Benchmark) ve test paneli yöneticisi
```

---

## 💡 Nasıl Kullanılır?

1. **Simülasyon Paneli:** * "Girdi Metni", "10-Bit Anahtar" ve mod parametrelerini belirleyin.
   * `▶ Simülasyonu Başlat` butonuna basarak verinin şifrelenme/deşifrelenme sürecini adım adım izleyin.
   * Feistel ağının iç detaylarını görmek için adımlar içindeki "Detayları Görmek İçin Tıkla (S-DES CORE)" butonunu kullanın.
2. **Diferansiyel Analiz:** * Sol menüdeki `Diferansiyel Analiz Başlat` paneline bir açık metin ve kırılmasını istediğiniz hedef anahtarı girin.
   * S-Kutularının zayıflıklarının nasıl kullanıldığını 7 adımda interaktif olarak görüntüleyin.
3. **Saldırı Analizi:** * Brute-Force (Tüm ihtimalleri deneme) ve Diferansiyel Analizin hızlarını (milisaniye bazında) kapıştırmak için "Kıyaslama Testini Başlat" butonuna tıklayın.

---

## 👨‍💻 Geliştirici

**Harun Avcı** Bandırma Onyedi Eylül Üniversitesi - Bilgisayar Mühendisliği

Projeyi faydalı bulduysanız Github üzerinden ⭐️ vermeyi unutmayın!
