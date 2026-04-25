/**
 * Test Paneli ve Saldırı Analizi Arayüz Yöneticisi (Controller)
 * Tüm DOM etkileşimlerini, Event Listener'ları ve test raporlamasını yönetir.
 */
class UITestController {
    constructor() {
        // Asıl test runner sınıfını başlat
        this.tr = new test_runner();

        // Panel ve Konteyner DOM Referansları
        this.simPanel = document.getElementById('sim-panel');
        this.testResultsPanel = document.getElementById('test-results-panel');
        this.resultsWrapper = document.getElementById('results-wrapper');
        this.resultsTitle = document.getElementById('results-title');
        this.resultsContainer = document.getElementById('results-container');

        // Buton DOM Referansları
        this.btnSimStart = document.getElementById('btn-sim-start');
        this.btnSystemTests = document.getElementById('btn-run-system-tests');
        this.btnRunAttack = document.getElementById('btn-run-attack');
        this.btnCloseResults = document.getElementById('btn-close-results');
        this.btnReset = document.getElementById('btn-reset-all');

        this.diffStepPanel = document.getElementById('diff-step-panel');

        // Olay Dinleyicileri Başlat
        this.initEventListeners();
    }

    initEventListeners() {
        if (this.btnSimStart) {
            this.btnSimStart.addEventListener('click', () => this.startSimulationWrapper());
        }


        if (this.btnSystemTests) {
            this.btnSystemTests.addEventListener('click', () => this.runOriginalTests());
        }

        if (this.btnRunAttack) {
            this.btnRunAttack.addEventListener('click', () => this.runAttackTest());
        }
        if (this.btnCloseResults) {
            this.btnCloseResults.addEventListener('click', () => {
                this.testResultsPanel.classList.add('hidden');
            });
        }
        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => this.resetAll());
        }
    }

    // Simülasyon başlatıldığında test sonuç panelini gizler, simülasyonu açar
    startSimulationWrapper() {
        this.diffStepPanel.classList.add('hidden');
        this.testResultsPanel.classList.add('hidden');
        this.diffStepPanel.classList.remove('flex');
        this.testResultsPanel.classList.remove('flex');
        if (typeof startSimulation === 'function') {
            startSimulation(); // UI_DOM.js içindeki fonksiyonu çağırır
        }
    }

    // Ekranı sıfırlarken hem inputları hem de test sonuçlarını temizler
    resetAll() {
        if (typeof resetApp === 'function') {
            resetApp(); // UI_DOM.js içindeki asıl sıfırlama
        }

        // Mevcut Standart Test ve Saldırı Panellerini gizle/temizle
        this.testResultsPanel.classList.add('hidden');
        this.testResultsPanel.classList.remove('flex');
        this.resultsContainer.innerHTML = '';

        // YENİ: Diferansiyel Analiz Eğitim Panelini gizle ve temizle
        const diffPanel = document.getElementById('diff-step-panel');
        if (diffPanel) {
            diffPanel.classList.add('hidden');
            diffPanel.classList.remove('flex');
        }
        const stepsContainer = document.getElementById('stepsContainer');
        if (stepsContainer) {
            stepsContainer.innerHTML = '';
        }
        const navControls = document.getElementById('navControls');
        if (navControls) {
            navControls.classList.add('hidden');
            navControls.style.display = ''; // Eğer inline style olarak flex kalmışsa temizler
        }
    }

    // Gelen sonuç objesini HTML kartı olarak DOM'a ekler (YENİ MODERN TASARIM)
    renderTestCard(res) {
        let isPass = false;
        if (res.TestResult !== undefined) {
            isPass = res.TestResult === "PASS";
        } else if (res.IsBruteSuccess !== undefined && res.IsDiffSuccess !== undefined) {
            isPass = (res.IsBruteSuccess === "PASS" && res.IsDiffSuccess === "PASS");
        }

        // Kart Renkleri
        const cardBg = isPass ? "bg-slate-800/80 border-t-4 border-t-emerald-500" : "bg-slate-800/80 border-t-4 border-t-red-500";
        const badgeClass = isPass ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" : "bg-red-500/20 text-red-400 border border-red-500/50";
        const statusText = isPass ? "✅ GEÇTİ" : "❌ KALDI";
        const titleColor = isPass ? "text-emerald-400" : "text-red-400";

        // JSON Key'lerini Okunabilir Türkçe Metinlere Çeviren Sözlük
        const keyMap = {
            "Key": "Master Anahtar",
            "Plaintext": "Açık Metin (Plaintext)",
            "ExpectedCiphertext": "Beklenen Şifreli Çıktı",
            "ActualCiphertext": "Hesaplanan Şifreli Çıktı",
            "Ciphertext": "Şifreli Metin (Ciphertext)",
            "ExpectedPlaintext": "Beklenen Çözülmüş Metin",
            "ActualPlaintext": "Hesaplanan Çözülmüş Metin",
            "IV": "Başlangıç Vektörü (IV)",
            "DecryptedText": "Deşifre Edilen Metin",
            "ECB_Ciphertext": "ECB Şifreli Çıktı",
            "ECB_DecryptedText": "ECB Deşifre Edilen",
            "ECB_TestResult": "ECB Doğrulama Durumu",
            "CBC_Ciphertext": "CBC Şifreli Çıktı",
            "CBC_DecryptedText": "CBC Deşifre Edilen",
            "CBC_TestResult": "CBC Doğrulama Durumu",
            "OFB_Encrypted": "OFB Şifreli Çıktı",
            "OFB_Decrypted": "OFB Deşifre Edilen",
            "OFB_TestResult": "OFB Doğrulama Durumu",
            "KnownPlaintext": "Bilinen Açık Metin",
            "KnownCiphertext": "Bilinen Şifreli Metin",
            "TargetKey": "Hedef Anahtar",
            "CandidateKeys": "Bulunan Aday Anahtarlar",
            "VerifiedKey": "Doğrulanan Anahtar"
        };

        const card = document.createElement('div');
        card.className = `p-6 rounded-2xl shadow-lg transition transform hover:-translate-y-1 mb-6 ${cardBg}`;

        let detailsHTML = Object.entries(res)
            .filter(([k, v]) => k !== "TestName" && k !== "TestResult")
            .map(([k, v]) => {
                let displayVal = v;
                // Array'leri düzelt
                if (Array.isArray(v)) {
                    displayVal = v.length > 0 ? v.join(', ') : 'Bulunamadı';
                } else if (typeof v === 'boolean') {
                    displayVal = v ? 'Evet' : 'Hayır';
                }

                // Sözlükten eşleştir, yoksa kelimeleri ayır
                let cleanKey = keyMap[k] || k.replace(/([A-Z])/g, ' $1').trim();

                // Sonuç barındıran değerleri farklı renk yap (Sky/Mavi), Girdileri standart bırak (Slate/Gri)
                let isResultKey = k.includes("Result") || k.includes("Actual") || k.includes("Verified") || k.includes("Decrypted") || k.includes("Ciphertext") || k.includes("Encrypted");
                let valColor = isResultKey ? "text-sky-300 bg-sky-950/30 border-sky-800/50" : "text-slate-300 bg-slate-900 border-slate-700/50";

                // PASS / FAIL yazılarını Türkçeleştir ve renklendir
                if (displayVal === "PASS") {
                    valColor = "text-emerald-400 bg-emerald-950/30 border-emerald-800/50 font-black";
                    displayVal = "BAŞARILI";
                } else if (displayVal === "FAIL") {
                    valColor = "text-red-400 bg-red-950/30 border-red-800/50 font-black";
                    displayVal = "BAŞARISIZ";
                }

                return `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0 gap-2">
                    <span class="font-bold text-slate-400 text-[10px] uppercase tracking-widest w-full sm:w-1/3">${cleanKey}</span>
                    <span class="font-mono ${valColor} px-3 py-1.5 rounded-lg border shadow-sm break-all text-sm w-full sm:w-2/3 text-right">${displayVal}</span>
                </div>
            `}).join('');

        // Testlere açıklayıcı alt başlıklar ekle
        const descMap = {
            "T_01": "S-DES Çekirdek Şifreleme Testi",
            "T_02": "S-DES Çekirdek Deşifreleme Testi",
            "T_03": "Stallings Referans Vektörü Doğrulaması",
            "T_04": "Kaba Kuvvet (Brute-Force) Doğrulaması",
            "T_05": "CBC Zincirleme Modu Testi",
            "Test_modes": "Çalışma Modlarının (ECB, CBC, OFB) Toplu Testi"
        };
        const desc = descMap[res.TestName.trim()] || "Sistem Doğrulama Testi";

        card.innerHTML = `
            <div class="flex justify-between items-start mb-5 border-b border-slate-700/50 pb-4">
                <div>
                    <h3 class="text-xl font-black tracking-widest uppercase ${titleColor}">${res.TestName}</h3>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">${desc}</p>
                </div>
                <span class="${badgeClass} px-4 py-1.5 rounded-lg text-[11px] font-black tracking-widest shadow-sm">${statusText}</span>
            </div>
            <div class="bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                ${detailsHTML}
            </div>
        `;
        this.resultsContainer.appendChild(card);
    }

    // 1. STANDART TESTLERİ ÇALIŞTIR (GÖMÜLÜ DEĞERLERLE VE İSTATİSTİK ÖZETİYLE)
    runOriginalTests() {
        // Diğer panelleri kapat ve sonuç panelini hazırla
        const diffPanel = document.getElementById('diff-step-panel');
        if (diffPanel) diffPanel.classList.add('hidden');
        this.simPanel.classList.add('hidden');
        this.simPanel.classList.remove('flex');

        this.testResultsPanel.classList.remove('hidden');
        this.testResultsPanel.classList.add('flex');

        this.resultsWrapper.className = "bg-emerald-950/10 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.05)] min-h-[400px]";
        this.resultsTitle.innerHTML = '<span class="text-emerald-500 text-2xl">✔</span> Standart Test Sonuçları';
        this.resultsTitle.className = "text-lg font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2";

        this.resultsContainer.innerHTML = '<div class="text-emerald-400 animate-pulse font-mono tracking-widest text-center mt-10">Testler çalıştırılıyor, lütfen bekleyin...</div>';

        setTimeout(() => {
            try {
                // Testler için sabit (hardcoded) veriler
                const corePt = "10101010";
                const coreKey = "0111111101";
                const sdes = new sdescore();
                const coreCt = sdes.Encrypt(corePt, coreKey);

                const modePt = "GIZLI";
                const modeKey = "0111111101";
                const modeIv = "10101010";

                // Test senaryolarını çalıştır
                let results = [
                    this.tr.T_01(),
                    this.tr.T_02(),
                    this.tr.T_03(),
                    this.tr.T_04(corePt, coreCt, coreKey),
                    this.tr.T_05(modePt, modeKey, modeIv),
                    this.tr.Test_modes(modePt, modeKey, modeIv,)
                ];

                this.resultsContainer.innerHTML = '';

                // --- İSTATİSTİK HESAPLAMA VE GÖRSELLEŞTİRME ---
                const total = results.length;
                const passed = results.filter(r => (r.TestResult === "PASS" || (r.IsBruteSuccess === "PASS" && r.IsDiffSuccess === "PASS"))).length;
                const failed = total - passed;

                const statsHTML = `
                <div class="flex gap-4 mb-8 bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-inner justify-around items-center backdrop-blur-sm">
                    <div class="flex flex-col items-center">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Toplam Senaryo</span>
                        <span class="text-3xl font-black text-white font-mono">${total}</span>
                    </div>
                    <div class="h-10 border-l border-slate-700"></div>
                    <div class="flex flex-col items-center">
                        <span class="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-1">Başarılı</span>
                        <span class="text-3xl font-black text-emerald-400 font-mono">${passed}</span>
                    </div>
                    <div class="h-10 border-l border-slate-700"></div>
                    <div class="flex flex-col items-center">
                        <span class="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mb-1">Başarısız</span>
                        <span class="text-3xl font-black text-red-400 font-mono">${failed}</span>
                    </div>
                </div>`;

                this.resultsContainer.insertAdjacentHTML('beforeend', statsHTML);
                // ----------------------------------------------

                // Kartları tek tek ekrana bas
                results.forEach(res => this.renderTestCard(res));

            } catch (error) {
                console.error("Test Hatası:", error);
                this.resultsContainer.innerHTML = `<div class="bg-red-900/50 border border-red-500 p-4 rounded text-red-200">Sistem Hatası: ${error.message}</div>`;
            }
        }, 150);
    }
    // 2. SALDIRI TESTİNİ ÇALIŞTIR
    runAttackTest() {
        this.simPanel.classList.add('hidden');
        this.simPanel.classList.remove('flex');
        this.diffStepPanel.classList.add('hidden');
        this.diffStepPanel.classList.remove('flex');
        this.testResultsPanel.classList.remove('hidden');
        this.testResultsPanel.classList.add('flex');

        this.resultsWrapper.className = "bg-indigo-950/10 border-2 border-indigo-500/50 rounded-2xl p-6 shadow-[0_0_20px_rgba(99,102,241,0.05)] min-h-[400px]";
        this.resultsTitle.innerHTML = '⚡ Saldırı Analizi (Diff vs Brute)';
        this.resultsTitle.className = "text-lg font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2";

        this.resultsContainer.innerHTML = '<div class="text-indigo-400 animate-pulse font-mono tracking-widest text-center mt-10">Saldırı simülasyonu çalıştırılıyor, lütfen bekleyin...</div>';

        setTimeout(() => {
            try {
                let pt = document.getElementById('attack-text').value.trim();
                if (!/^[01]+$/.test(pt)) pt = "10101010";
                pt = pt.padEnd(8, '0').substring(0, 8);

                let key = document.getElementById('attack-key').value.trim();
                if (!/^[01]+$/.test(key)) key = "0111111101";
                key = key.padEnd(10, '0').substring(0, 10);

                const sdes = new sdescore();
                const ct = sdes.Encrypt(pt, key);

                // Kaba Kuvvet (Brute Force) Saldırısı
                const bfStart = performance.now();
                const bfCandidates = SdesAtacker.bruteForceAttack(pt, ct);
                const bfVerifiedKey = SdesAtacker.VerifyKey(key, bfCandidates);
                const bfEnd = performance.now();
                const bfTime = bfEnd - bfStart;

                // Diferansiyel Analiz Saldırısı
                const diffStart = performance.now();
                const diffCandidates = SdesAtacker.differentialAttack(pt, key);
                const diffVerifiedKey = SdesAtacker.VerifyKey(key, diffCandidates);
                const diffEnd = performance.now();
                const diffTime = diffEnd - diffStart;

                this.resultsContainer.innerHTML = '';
                // Yeni hazırladığımız özel çizim metodunu çağırıyoruz
                this.renderAttackCard(pt, ct, key, bfCandidates, bfVerifiedKey, bfTime, diffCandidates, diffVerifiedKey, diffTime);

            } catch (error) {
                this.resultsContainer.innerHTML = `<div class="bg-red-900/50 border border-red-500 p-4 rounded text-red-200">Sistem Hatası: ${error.message}</div>`;
            }
        }, 150);
    }
    // --- YENİ: Saldırı Analizine Özel Görselleştirme ---
    renderAttackCard(pt, ct, targetKey, bfCandidates, bfVerifiedKey, bfTime, diffCandidates, diffVerifiedKey, diffTime) {
        // Alt kısımdaki Geçti/Kaldı kartlarını çizen yardımcı fonksiyon
        const renderFinalCard = (title, key, time) => {
            if (key) {
                return `
                <div class="bg-slate-800/80 p-5 rounded-xl shadow-lg border-l-4 border-green-500 flex flex-col justify-between h-28 relative overflow-hidden mt-4">
                    <div class="absolute right-[-10px] top-[-10px] text-6xl opacity-10">🎯</div>
                    <div>
                        <p class="text-[9px] font-bold text-green-500 uppercase tracking-widest mb-1">${title} Sonucu</p>
                        <h4 class="text-xl font-mono font-black text-slate-100 tracking-widest">${key}</h4>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-[9px] font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded">BULUNDU</span>
                        <span class="text-[10px] font-mono text-slate-400 italic">${time.toFixed(2)} ms</span>
                    </div>
                </div>`;
            } else {
                return `
                <div class="bg-slate-800/80 p-5 rounded-xl shadow-lg border-l-4 border-red-500 flex flex-col justify-center items-center h-28 mt-4">
                    <p class="text-red-500 font-bold uppercase text-[10px] tracking-widest">⚠️ Anahtar Bulunamadı</p>
                </div>`;
            }
        };

        // Hız Çarpanını ve Kazananı Dinamik Olarak Hesapla
        let ratioVal = bfTime / (diffTime || 0.001);
        let displayRatio = ratioVal >= 1 ? ratioVal.toFixed(1) : (1 / (ratioVal || 0.001)).toFixed(1);
        let winnerText = ratioVal >= 1 ? "DİFERANSİYEL DAHA HIZLI" : "KABA KUVVET DAHA HIZLI";

        // Ana Konteyner Kartı
        const card = document.createElement('div');
        card.className = "w-full space-y-6";

        card.innerHTML = `
        <div class="flex flex-wrap gap-4 justify-center md:justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center">
            <div class="flex flex-col items-center">
                <span class="text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-1">Açık Metin (P1)</span>
                <span class="font-mono text-slate-200 bg-slate-800 px-3 py-1 rounded shadow-sm text-sm">${pt}</span>
            </div>
            <div class="flex flex-col items-center">
                <span class="text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-1">Şifreli Metin (C1)</span>
                <span class="font-mono text-slate-200 bg-slate-800 px-3 py-1 rounded shadow-sm text-sm">${ct}</span>
            </div>
            <div class="flex flex-col items-center">
                <span class="text-[9px] text-indigo-400 font-bold tracking-widest uppercase mb-1">Hedef Anahtar</span>
                <span class="font-mono text-indigo-300 bg-indigo-900/30 px-3 py-1 border border-indigo-500/30 rounded shadow-sm text-sm">${targetKey}</span>
            </div>
        </div>

        <div class="relative w-full p-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <div class="bg-slate-900 p-6 rounded-xl w-full h-full relative overflow-hidden">
                <div class="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
                
                <h2 class="text-sm font-black uppercase tracking-widest text-indigo-300 mb-6 border-b border-indigo-500/30 pb-3 text-center relative z-10 flex items-center justify-center gap-2">
                    <span class="text-xl">⚡</span> Hız ve Verimlilik Kıyaslaması <span class="text-xl">⚡</span>
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center items-center relative z-10">
                    <div class="bg-slate-800/80 p-5 rounded-xl border border-slate-600 shadow-inner">
                        <p class="text-slate-400 text-[10px] uppercase font-bold mb-2 tracking-widest">Kaba Kuvvet (Brute-Force)</p>
                        <p class="text-2xl font-black text-slate-200 font-mono">${bfTime.toFixed(2)} <span class="text-sm text-slate-500">ms</span></p>
                    </div>
                    
                    <div class="bg-indigo-900/40 p-5 rounded-xl border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <p class="text-indigo-300 text-[10px] uppercase font-bold mb-2 tracking-widest">Diferansiyel Analiz</p>
                        <p class="text-2xl font-black text-green-400 font-mono">${diffTime.toFixed(2)} <span class="text-sm text-green-700/50">ms</span></p>
                    </div>
                    
                    <div class="bg-green-950/60 p-5 rounded-xl border-2 border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.4)] transform scale-105 z-10 relative">
                        <p class="text-green-400 text-[11px] uppercase font-black mb-2 tracking-widest">Hız Çarpanı</p>
                        <p class="text-3xl font-black text-green-400 font-mono drop-shadow-md">${displayRatio}x <br><span class="text-[10px] text-green-500 font-bold uppercase tracking-widest leading-none block mt-2">${winnerText}</span></p>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div class="flex flex-col h-full">
                <div class="bg-slate-800/80 p-5 rounded-2xl shadow-lg border-t-4 border-slate-500 flex-grow">
                    <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                        <h3 class="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Kaba Kuvvet Adayları</h3>
                        <span class="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[9px] font-mono font-bold">${bfCandidates.length} Aday</span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        ${bfCandidates.map(k => `<div class="p-2 rounded-md border border-slate-600 bg-slate-900 text-center font-mono text-[10px] tracking-widest ${k === bfVerifiedKey ? 'border-green-500 bg-green-900/30 text-green-400 font-bold shadow-[0_0_10px_rgba(34,197,94,0.2)] scale-105 transition-transform z-10 relative' : 'text-slate-400'}">${k}</div>`).join('')}
                    </div>
                </div>
                ${renderFinalCard("Kaba Kuvvet", bfVerifiedKey, bfTime)}
            </div>

            <div class="flex flex-col h-full">
                <div class="bg-slate-800/80 p-5 rounded-2xl shadow-lg border-t-4 border-indigo-500 flex-grow">
                    <div class="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                        <h3 class="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Diferansiyel Adaylar</h3>
                        <span class="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-2 py-1 rounded text-[9px] font-mono font-bold">${diffCandidates.length} Aday</span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        ${diffCandidates.map(k => `<div class="p-2 rounded-md border border-slate-600 bg-slate-900 text-center font-mono text-[10px] tracking-widest ${k === diffVerifiedKey ? 'border-green-500 bg-green-900/30 text-green-400 font-bold shadow-[0_0_10px_rgba(34,197,94,0.2)] scale-105 transition-transform z-10 relative' : 'text-slate-400'}">${k}</div>`).join('')}
                    </div>
                </div>
                ${renderFinalCard("Diferansiyel Analiz", diffVerifiedKey, diffTime)}
            </div>
        </div>
        `;

        this.resultsContainer.appendChild(card);
    }
}