# Volume Booster Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/)

> **Language / Dil:** [English](#english) | [Türkçe](#türkçe)

---

<a name="english"></a>
## English

A Manifest V3 Chrome extension that boosts active tab volume up to **600%** with an intelligent DSP audio engine that eliminates speaker crackling, chassis rattle, and harsh digital clipping distortion.

### Key Features

- **Smart Anti-Crackling & Peak Limiter:**
  - **Sub-Bass Rattle Filter:** High-pass Butterworth filter cuts sub-75 Hz rumble that pushes small laptop speaker diaphragms beyond physical limits, eliminating physical buzzing and rattle.
  - **Dynamics Compressor & Multi-Stage Limiter:** Automatically adapts threshold (-4 dB to -15 dB) and compression ratio (3:1 to 18:1) as gain increases, keeping dialogue clear while preventing loud transients from distorting.
  - **4x Oversampled Tanh Soft-Clipper:** Hyperbolic tangent saturation curve with 4x oversampling mathematically prevents square-wave digital clipping.
  - **Output Ceiling Protection:** Master gain clamped to safe ceiling (0.96 / -0.4 dB) to prevent DAC inter-sample distortion.
- **Dedicated Sound Profiles:**
  - 🔊 **Speaker (Anti-Crackling & Clear):** Optimized for laptop & external desktop speakers with vocal presence boost (+2.5 dB at 2.8 kHz) and high-frequency sizzle tamer.
  - 🎧 **Headphones (Rich & Deep Bass):** Full audiophile frequency response down to 20 Hz with punchy, uncompressed low-end.
  - 🗣️ **Vocal & Dialogue:** Speech clarity peaking filter (+4 dB at 2.6 kHz) for movies, podcasts, and video meetings.
  - ⚡ **Bass & Punch:** Full low-end boost with limiter protection.
- **Bilingual Interface (English & Turkish):**
  - Instant one-click language toggle (`EN` / `TR`) in the header.
  - Persistent preference automatically saved in extension storage.
- **Pro Audio Studio UI:**
  - Live dynamic decibel readout ($20 \log_{10}(\text{gain})$).
  - 20-band responsive spectrum visualizer (VU meters).
  - Multi-stop color gradient slider (cyan $\rightarrow$ amber $\rightarrow$ hot coral).
  - Quick-preset buttons (`100%`, `150%`, `200%`, `300%`, `600% MAX`).
  - Dark glassmorphism studio design with pulsing live status indicators.

### Installation

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the upper-right corner.
4. Click **Load unpacked**.
5. Select this project directory.

### Usage

1. Open any tab playing audio or video (e.g. YouTube, Netflix, Spotify).
2. Click the **Volume Booster Pro** extension icon.
3. Turn on the power switch in the upper-right corner.
4. Adjust volume using the slider or quick presets (`100%` to `600%`).
5. Choose your sound profile (use **Speaker** mode and keep **Smart Anti-Crackling** enabled for laptop speakers).
6. Toggle between **EN** and **TR** in the top bar to change languages at any time.

### Audio Pipeline Architecture

```
[Tab MediaStream]
       │
       ▼
[High-Pass Filter (Sub-rumble cut at 75 Hz / 20 Hz)]
       │
       ▼
[Parametric Peaking EQ (Speech clarity / presence)]
       │
       ▼
[High-Shelf Filter (Sizzle tamer at 11 kHz)]
       │
       ▼
[Pre-Gain Stage (100% - 600%)]
       │
       ▼
[Dynamics Compressor (Adaptive threshold & fast 3ms limiter)]
       │
       ▼
[WaveShaper Soft-Clipper (4x oversampled tanh curve)]
       │
       ▼
[Master Ceiling Gain (0.96 safe margin)]
       │
       ▼
[AudioContext Destination (Speakers / Headphones)]
```

---

<a name="türkçe"></a>
## Türkçe

Chrome sekmelerinin ses seviyesini **%100'den %600'e** kadar artıran, dahili hoparlör cızırtılarını ve ses patlamalarını önleyen akıllı ses motoruna sahip Manifest V3 Chrome uzantısı.

### Temel Özellikler

- **Akıllı Cızırtı Önleyici & Tepe Sınırlayıcı:**
  - **Kasa Rezonans Filtresi:** Hoparlörlerin fiziksel sınırlarını aşan 75 Hz altı mekanik titreşimleri süzerek laptop kasasındaki zangırdamayı ve boğuk cızırtıyı engeller.
  - **Dinamik Kompresör & Tepe Sınırlayıcı:** Ses kazancı arttıkça eşik değerini (-4 dB ile -15 dB) ve sıkıştırma oranını (3:1 ile 18:1) otomatik adapte eder; kısık konuşmaları netleştirirken yüksek seslerin patlamasını önler.
  - **4x Aşırı Örneklemeli Tanh Yumuşak Doygunluk:** 4x oversampling destekli analog tüp tipi eğri (`Math.tanh`) ile dijital kare dalga kırpılmasını ve cızırtıları yok eder.
  - **Çıkış Tavan Koruması:** DAC dönüştürücüsünde taşmaları önlemek için çıkış tavanı güvenli seviyede tutulur.
- **Özel Ses Profilleri:**
  - 🔊 **Hoparlör (Anti-Cızırtı & Net):** Dahili laptop hoparlörleri için rezonans ve cızırtı engellemeli, 2.8 kHz konuşma netliği sağlayan mod.
  - 🎧 **Kulaklık (Zengin Bas):** Kulaklıklar için tam frekans aralığı ve derin bas modu.
  - 🗣️ **Dizi & Vokal:** Dizi, film ve podcast'lerde diyalogları öne çıkaran netlik filtresi.
  - ⚡ **Bas & Güç:** Dinamik kontrollü güçlü bas modu.
- **İki Dilli Arayüz (İngilizce & Türkçe):**
  - Üst paneldeki tek tıkla çalışan `EN` / `TR` butonu ile anında dil değişimi.
  - Seçilen dil eklenti hafızasında otomatik saklanır.
- **Modern Stüdyo Arayüzü:**
  - Canlı desibel ($20 \log_{10}(\text{kazanç})$) göstergesi.
  - Ses seviyesine göre hareket eden 20 bantlı dinamik spektrum görselleştiricisi (VU meter).
  - Renk geçişli kaydırıcı ve tek tıkla `%100`, `%150`, `%200`, `%300`, `%600` önayarları.
  - Koyu cam efektli (glassmorphism) stüdyo tasarımı.

### Kurulum

1. Bu depoyu klonlayın veya indirin.
2. Google Chrome'da `chrome://extensions` adresine gidin.
3. Sağ üst köşedeki **Geliştirici modu** (Developer mode) seçeneğini aktif edin.
4. **Paketlenmemiş öğe yükle** (Load unpacked) butonuna tıklayın.
5. Bu proje klasörünü seçin.

### Kullanım

1. Herhangi bir sekmede video veya müzik açın (örneğin YouTube, Netflix, Spotify).
2. **Volume Booster Pro** eklenti simgesine tıklayın.
3. Sağ üstteki güç anahtarını açın.
4. Kaydırıcı veya hızlı butonlar ile ses seviyesini (%100 - %600) ayarlayın.
5. Dahili hoparlör kullanıyorsanız **Hoparlör** profilini ve **Akıllı Cızırtı Önleyici**'yi açık tutun.
6. Dilediğiniz an üst paneldeki **EN** ve **TR** butonlarına basarak dili değiştirebilirsiniz.
