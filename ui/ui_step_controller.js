/**
 * S-DES Çalışma Modları Simülasyonu UI Yöneticisi
 * Nesne Yönelimli (OOP) Yapıya Geçirilmiş Hali - (TÜM GÖRSEL DETAYLAR RESTORE EDİLDİ)
 */
class UISimulator {
    constructor() {
        this.simSteps = [];
        this.currentStepIdx = 0;
        this.initListeners();
    }

    initListeners() {
        const inpAction = document.getElementById('inp-action');
        if (inpAction) {
            inpAction.addEventListener('change', (e) => {
                const label = document.getElementById('inp-text-label');
                if (e.target.value === 'ENC') {
                    label.innerText = 'Girdi Metni (Plain Text)';
                    document.getElementById('inp-text').placeholder = 'Örn: SDES';
                } else {
                    label.innerText = 'Girdi Metni (Cipher Text)';
                    document.getElementById('inp-text').placeholder = 'Örn: 00cb7a2';
                }
            });
        }

        document.addEventListener('keydown', e => {
            const simPanel = document.getElementById('sim-panel');
            if (simPanel && simPanel.classList.contains('hidden')) return;

            const modal = document.getElementById('core-modal');
            if (modal && !modal.classList.contains('hidden')) {
                if (e.key === 'Escape') modal.classList.add('hidden');
                return;
            }

            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('btn-next').click();
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                document.getElementById('btn-prev').click();
            }
        });
    }

    startSimulation() {
        const text = document.getElementById('inp-text').value.trim();
        const key = document.getElementById('inp-key').value.trim();
        const iv = document.getElementById('inp-iv').value.trim();
        const mode = document.getElementById('inp-mode').value;
        const action = document.getElementById('inp-action').value;
        // Yeni format seçicilerini okuyoruz:
        const format = document.getElementById('inp-format') ? document.getElementById('inp-format').value : 'ASCII';
        const outFormat = document.getElementById('inp-out-format') ? document.getElementById('inp-out-format').value : 'Binary';
        const expected = document.getElementById('inp-expected') ? document.getElementById('inp-expected').value.trim() : "";

        if (!text) return alert("Girdi metni boş olamaz!");
        if (!/^[01]{10}$/.test(key)) return alert("Anahtar tam olarak 10 bit Binary (0 ve 1) olmalıdır!");
        if (mode !== "ECB" && mode !== "CORE" && !/^[01]{8}$/.test(iv)) return alert("Başlangıç Vektörü (IV) 8 bit Binary olmalıdır!");

        // Parametreleri generateSteps'e gönderiyoruz:
        this.generateSteps(text, key, iv, mode, action, format, outFormat, expected);

        const simPanel = document.getElementById('sim-panel');
        simPanel.classList.remove('hidden');
        simPanel.classList.add('flex');

        if (window.innerWidth < 1024) {
            simPanel.scrollIntoView({ behavior: 'smooth' });
        }

        this.currentStepIdx = 0;
        this.renderStep();
    }

    getCoreData(input, key, action) {
        const sdes = new sdescore();

        let constants = {
            P10: sdes.P10, P8: sdes.P8, P4: sdes.P4,
            IP: sdes.IP, EP: sdes.EP, IP_INV: sdes.IP_INV,
            S0: sdes.S0, S1: sdes.S1
        };

        let p10 = SdesUtils.Permutate(key, sdes.P10);
        let p10_L = p10.substring(0, 5);
        let p10_R = p10.substring(5);

        let ls1_L = SdesUtils.LeftShift(p10_L, 1);
        let ls1_R = SdesUtils.LeftShift(p10_R, 1);
        let p10_ls1 = ls1_L + ls1_R;
        let k1_gen = SdesUtils.Permutate(p10_ls1, sdes.P8);

        let ls2_L = SdesUtils.LeftShift(ls1_L, 2);
        let ls2_R = SdesUtils.LeftShift(ls1_R, 2);
        let p10_ls2 = ls2_L + ls2_R;
        let k2_gen = SdesUtils.Permutate(p10_ls2, sdes.P8);

        let keygen = {
            key, p10, p10_L, p10_R,
            ls1_L, ls1_R, p10_ls1, K1: k1_gen,
            ls2_L, ls2_R, p10_ls2, K2: k2_gen
        };

        sdes.KeyGeneration(key);
        let k1 = action === 'ENC' ? sdes.K1 : sdes.K2;
        let k2 = action === 'ENC' ? sdes.K2 : sdes.K1;

        let ip = SdesUtils.Permutate(input, sdes.IP);
        let L0 = ip.substring(0, 4);
        let R0 = ip.substring(4);

        let ep1 = SdesUtils.Permutate(R0, sdes.EP);
        let xor1 = SdesUtils.XOR(ep1, k1);
        let sbox1 = sdes.SBoxLookUp(xor1.substring(0, 4), xor1.substring(4));
        let p4_1 = SdesUtils.Permutate(sbox1, sdes.P4);
        let fk1_out = SdesUtils.XOR(L0, p4_1);

        let L1 = R0;
        let R1 = fk1_out;

        let ep2 = SdesUtils.Permutate(R1, sdes.EP);
        let xor2 = SdesUtils.XOR(ep2, k2);
        let sbox2 = sdes.SBoxLookUp(xor2.substring(0, 4), xor2.substring(4));
        let p4_2 = SdesUtils.Permutate(sbox2, sdes.P4);
        let fk2_out = SdesUtils.XOR(L1, p4_2);

        let L2 = fk2_out;
        let R2 = R1;

        let out = SdesUtils.Permutate(L2 + R2, sdes.IP_INV);

        return {
            input, key, K1: sdes.K1, K2: sdes.K2, actK1: k1, actK2: k2, keygen, constants,
            ip, L0, R0, ep1, xor1, sbox1, p4_1, fk1_out,
            L1, R1, ep2, xor2, sbox2, p4_2, fk2_out,
            L2, R2, out, action
        };
    }

    generateSteps(text, key, iv, mode, action, format = 'ASCII', outFormat = 'Binary', expected = "") {
        this.simSteps = [];
        let blocks = [];

        try {
            // Girilen metni seçilen formata göre Binary'ye çeviriyoruz
            let binaryText = SdesUtils.ConvertToBinary(text, format);

            if (action === 'ENC') {
                if (mode === 'CORE') {
                    if (binaryText.length !== 8) return alert("Çekirdek modunda işlem için girdi tam 8 bit uzunluğunda bir binary değere dönüşebilmelidir.");
                    blocks = [binaryText];
                } else {
                    blocks = SdesUtils.SplitPlainTextBlocks(binaryText);
                }
            } else {
                if (mode === 'CORE') {
                    if (binaryText.length !== 8) return alert("Çekirdek modunda işlem için girdi tam 8 bit uzunluğunda bir binary değere dönüşebilmelidir.");
                    blocks = [binaryText];
                } else {
                    if (binaryText.length % 8 !== 0) return alert("İşlem için girdi 8'in katı uzunluğunda bir binary değere dönüşebilmelidir.");
                    blocks = SdesUtils.SplitCipherBlocks(binaryText);
                }
            }
        } catch (e) {
            return alert(e.message); // Dönüşümde hata varsa kullanıcıya göster
        }

        this.simSteps.push({
            type: 'INIT',
            title: "Başlangıç: Parametreler ve Bloklama",
            desc: "Girdi parametreleri alındı ve S-DES işlemine uygun şekilde bloklara ayrıldı.",
            data: { text, key, iv, mode, action, format, outFormat, blocks }
        });

        let prevBlock = iv;
        let outBlocks = [];

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i];
            let blockTitle = `Blok ${i + 1}/${blocks.length}`;

            if (mode !== 'CORE') {
                this.simSteps.push({
                    type: 'BLOCK_START', title: `${blockTitle} İşlemine Başlanıyor`,
                    desc: `${blockTitle} alındı: ${block}`, data: { block, index: i + 1 }
                });
            }

            if (mode === 'CORE') {
                let coreData = this.getCoreData(block, key, action);

                // Anahtar üretimini 3 alt adıma böldük
                this.simSteps.push({ type: 'CORE_KEYGEN_P10', title: `Anahtar Üretimi 1/3: P10 Permütasyonu (${blockTitle})`, desc: `10 bitlik anahtar P10 tablosuna göre karıştırılır ve 5'er bitlik sağ ve sol yarılara bölünür.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_KEYGEN_LS1', title: `Anahtar Üretimi 2/3: K1'in Elde Edilmesi (${blockTitle})`, desc: `Sağ ve sol yarılar 1'er bit sola kaydırılır (LS-1). Çıkan 10 bitlik sonuç P8 permütasyonundan geçirilerek 8 bitlik K1 alt anahtarı seçilir.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_KEYGEN_LS2', title: `Anahtar Üretimi 3/3: K2'nin Elde Edilmesi (${blockTitle})`, desc: `Bir önceki kaydırılmış yarılar bu kez 2'şer bit daha sola kaydırılır (LS-2). Sonuç tekrar P8'den geçirilerek 8 bitlik K2 alt anahtarı elde edilir.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_IP', title: `S-DES Çekirdek - Adım 2: IP (${blockTitle})`, desc: `Girdi bloğu Başlangıç Permütasyonu'ndan (IP) geçirilir ve Sol (L0) ile Sağ (R0) olarak ikiye bölünür.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_ROUND1_EP', title: `1. Tur (Fk) 1/4: Genişletme (EP)`, desc: `Sağ yarı (R0) 4 bitten 8 bite genişletilir (Expansion Permutation). Bu, anahtarla XOR işlemi yapabilmek için gereklidir.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_ROUND1_XOR', title: `1. Tur (Fk) 2/4: Anahtar XOR`, desc: `Genişletilmiş 8 bitlik sağ yarı, alt anahtar ile XOR (Özel VEYA) işlemine sokulur. Aynı bitler 0, farklı bitler 1 olur.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_ROUND1_SBOX', title: `1. Tur (Fk) 3/4: S-Kutuları (S-Box)`, desc: `XOR sonucu iki 4-bitlik parçaya ayrılır. Dış bitler satır, iç bitler sütun olacak şekilde S0 ve S1 tablolarından 2'şer bitlik çıktılar alınır.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_ROUND1_P4', title: `1. Tur (Fk) 4/4: P4 ve Sol Yarı XOR`, desc: `S-Kutusu çıktıları (4 bit) P4 permütasyonu ile karıştırılır ve baştaki Sol Yarı (L0) ile XOR'lanarak yeni Sağ Yarı (fk_out) elde edilir.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_SWAP', title: `S-DES Çekirdek - Adım 4: Swap (${blockTitle})`, desc: `İlk turun sol ve sağ yarı sonuçları, bir sonraki tur için yer değiştirir (Swap).`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_ROUND2_EP', title: `2. Tur (Fk) 1/4: Genişletme (EP)`, desc: `Yeni sağ yarı (R1) 4 bitten 8 bite genişletilir.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_ROUND2_XOR', title: `2. Tur (Fk) 2/4: Anahtar XOR`, desc: `Genişletilmiş sağ yarı, ikinci alt anahtar ile XOR işlemine sokulur.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_ROUND2_SBOX', title: `2. Tur (Fk) 3/4: S-Kutuları (S-Box)`, desc: `Kutulardan yeni 4 bitlik veri çekilir. S-Kutuları kriptografik karmaşıklığı sağlayan en önemli yapıdır.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_ROUND2_P4', title: `2. Tur (Fk) 4/4: P4 ve Birleştirme`, desc: `P4'ten geçtikten sonra L1 ile XOR'lanır ve 2. turun Feistel ağ (Fk) işlemi tamamlanır.`, data: { coreData } });
                this.simSteps.push({ type: 'CORE_OUT', title: `S-DES Çekirdek - Adım 6: IP⁻¹ (${blockTitle})`, desc: `Son turdan çıkan yarılar birleştirilir ve Ters Permütasyon'dan (IP⁻¹) geçirilerek nihai çıktı elde edilir.`, data: { coreData } });

                outBlocks.push(coreData.out);
            }
            else if (mode === 'ECB') {
                let coreData = this.getCoreData(block, key, action);
                let res = coreData.out;
                this.simSteps.push({
                    type: 'CIPHER', title: `${blockTitle} - ECB Modu`,
                    desc: "ECB modunda her blok bağımsız doğrudan şifrelenir.",
                    data: { in: block, key, out: res, action, labelIn: 'Girdi Bloğu', labelOut: 'Çıktı Bloğu', coreData }
                });
                outBlocks.push(res);
            }
            else if (mode === 'CBC') {
                if (action === 'ENC') {
                    let xorRes = SdesUtils.XOR(block, prevBlock);
                    this.simSteps.push({
                        type: 'XOR', title: `${blockTitle} - CBC Zincirleme (XOR)`,
                        desc: "Açık metin, önceki şifreli blokla (veya IV ile) XOR işlemine sokulur.",
                        data: { a: block, aLab: 'Açık Metin', b: prevBlock, bLab: i === 0 ? 'Başlangıç Vektörü (IV)' : 'Önceki Şifreli Blok', res: xorRes, color: 'blue' }
                    });

                    let coreData = this.getCoreData(xorRes, key, 'ENC');
                    let res = coreData.out;
                    this.simSteps.push({
                        type: 'CIPHER', title: `${blockTitle} - S-DES Şifreleme`,
                        desc: "XOR sonucu S-DES ile şifrelenir.",
                        data: { in: xorRes, key, out: res, action: 'ENC', labelIn: 'XOR Sonucu', labelOut: 'Şifreli Blok', coreData }
                    });
                    outBlocks.push(res);
                    prevBlock = res;
                } else {
                    let coreData = this.getCoreData(block, key, 'DEC');
                    let res = coreData.out;
                    this.simSteps.push({
                        type: 'CIPHER', title: `${blockTitle} - S-DES Deşifreleme`,
                        desc: "Şifreli blok S-DES ile çözülür.",
                        data: { in: block, key, out: res, action: 'DEC', labelIn: 'Şifreli Blok', labelOut: 'Deşifre Sonucu (Ham)', coreData }
                    });

                    let xorRes = SdesUtils.XOR(res, prevBlock);
                    this.simSteps.push({
                        type: 'XOR', title: `${blockTitle} - CBC Zincirleme (XOR)`,
                        desc: "Ham deşifre sonucu, önceki şifreli blokla (veya IV ile) XOR'lanarak orijinal açık metin elde edilir.",
                        data: { a: res, aLab: 'Ham Deşifre Sonucu', b: prevBlock, bLab: i === 0 ? 'Başlangıç Vektörü (IV)' : 'Önceki Şifreli Blok', res: xorRes, color: 'green' }
                    });
                    outBlocks.push(xorRes);
                    prevBlock = block;
                }
            }
            else if (mode === 'OFB') {
                let coreData = this.getCoreData(prevBlock, key, 'ENC');
                let newFeedback = coreData.out;
                this.simSteps.push({
                    type: 'CIPHER', title: `${blockTitle} - OFB Akış Üretimi`,
                    desc: "Önceki geri bildirim (veya IV) S-DES ile şifrelenerek yeni bir akış biti üretilir.",
                    data: { in: prevBlock, key, out: newFeedback, action: 'ENC', labelIn: i === 0 ? 'IV' : 'Önceki Geri Bildirim', labelOut: 'Yeni Anahtar Akışı (Feedback)', coreData }
                });

                let xorRes = SdesUtils.XOR(block, newFeedback);
                this.simSteps.push({
                    type: 'XOR', title: `${blockTitle} - OFB Akış XOR`,
                    desc: "Girdi bloğu, üretilen anahtar akışı ile XOR'lanarak çıktı elde edilir.",
                    data: { a: block, aLab: action === 'ENC' ? 'Açık Metin' : 'Şifreli Metin', b: newFeedback, bLab: 'Anahtar Akışı (Feedback)', res: xorRes, color: action === 'ENC' ? 'green' : 'blue' }
                });
                outBlocks.push(xorRes);
                prevBlock = newFeedback;
            }
        }

        let finalBinary = outBlocks.join('');
        // Seçilen Çıktı formatına göre sonucu dönüştür
        let finalResult = SdesUtils.ConvertFromBinaryBlocks(outBlocks, outFormat);

        this.simSteps.push({
            type: 'FINAL', title: "İşlem Tamamlandı", desc: "Tüm bloklar işlendi ve birleştirildi.",
            data: { outBlocks, finalBinary, finalResult, action, outFormat, expected }
        });
    }

    changeStep(dir) {
        let next = this.currentStepIdx + dir;
        if (next >= 0 && next < this.simSteps.length) {
            this.currentStepIdx = next;
            this.renderStep();
        }
    }

    // --- HTML ÇİZİM (RENDER) YARDIMCI FONKSİYONLARI ---
    renderBits(bitString, hlClass = "") {
        return bitString.split('').map(b => `<div class="bit-box bit-${b} ${hlClass} shadow-sm">${b}</div>`).join('');
    }

    renderMiniBits(bits, color, labels = null) {
        return `<div class="flex gap-1 justify-center">${bits.split('').map((b, i) =>
            `<div class="flex flex-col items-center gap-1">
                <div class="w-6 h-7 sm:w-7 sm:h-8 flex items-center justify-center rounded bg-slate-900 border border-${color}-500/50 text-${color}-400 font-bold text-xs sm:text-sm shadow-sm">${b}</div>
                ${labels && labels[i] !== undefined ? `<span class="text-[9px] text-slate-500 font-mono font-bold leading-none mt-0.5">${labels[i]}</span>` : ''}
            </div>`
        ).join('')}</div>`;
    }

    renderSBoxTable(matrix, title, inputBits) {
        let rowBin = inputBits[0] + inputBits[3];
        let colBin = inputBits[1] + inputBits[2];
        let targetRow = parseInt(rowBin, 2);
        let targetCol = parseInt(colBin, 2);

        let html = `
        <div class="w-full">
            <div class="font-bold text-green-500 text-xs mb-3 flex justify-between items-center px-1">
                <span class="border-b border-green-800/30 pb-1 uppercase tracking-widest">${title}</span>
                <span class="text-green-200 bg-green-900/50 px-3 py-1 rounded-md border border-green-700/50 flex gap-2 items-center shadow-inner">
                    <span class="text-green-500">Giriş:</span> <span class="font-mono tracking-widest text-white text-sm">${inputBits}</span>
                </span>
            </div>
            
            <div class="bg-slate-900/80 rounded-xl border border-slate-700 p-3 mb-4 flex justify-center gap-6 text-xs text-slate-300 font-mono text-center shadow-inner">
                <div class="flex flex-col items-center">
                    <div class="text-[10px] text-slate-400 mb-1 uppercase tracking-widest">Dış Bitler (1 ve 4)</div>
                    <div><span class="text-red-400 font-black text-sm">${inputBits[0]}</span><span class="text-slate-600">..</span><span class="text-red-400 font-black text-sm">${inputBits[3]}</span></div>
                    <div class="mt-1 text-red-300 bg-red-950/30 px-2 py-0.5 rounded">Satır: ${rowBin} (${targetRow})</div>
                </div>
                <div class="border-l border-slate-700"></div>
                <div class="flex flex-col items-center">
                    <div class="text-[10px] text-slate-400 mb-1 uppercase tracking-widest">İç Bitler (2 ve 3)</div>
                    <div><span class="text-slate-600">.</span><span class="text-sky-400 font-black text-sm">${inputBits[1]}${inputBits[2]}</span><span class="text-slate-600">.</span></div>
                    <div class="mt-1 text-sky-300 bg-sky-950/30 px-2 py-0.5 rounded">Sütun: ${colBin} (${targetCol})</div>
                </div>
            </div>

            <div class="bg-green-950/20 rounded-xl overflow-hidden border border-green-800/30 shadow-md">
                <table class="w-full text-center border-collapse text-xs font-mono">
                    <thead>
                        <tr class="text-green-600/80 bg-green-900/10 border-b border-green-800/30">
                            <th class="p-2 border-r border-green-800/30 text-[10px] font-bold">R\\C</th>
                            <th class="p-2 ${targetCol === 0 ? 'bg-green-800/50 text-green-300 font-black' : ''}">00</th>
                            <th class="p-2 ${targetCol === 1 ? 'bg-green-800/50 text-green-300 font-black' : ''}">01</th>
                            <th class="p-2 ${targetCol === 2 ? 'bg-green-800/50 text-green-300 font-black' : ''}">10</th>
                            <th class="p-2 ${targetCol === 3 ? 'bg-green-800/50 text-green-300 font-black' : ''}">11</th>
                        </tr>
                    </thead>
                    <tbody>`;

        matrix.forEach((row, rIdx) => {
            let isTargetRow = (rIdx === targetRow);
            let rowLabel = rIdx.toString(2).padStart(2, '0');
            html += `<tr class="${isTargetRow ? 'bg-green-900/40' : ''}">`;

            html += `<td class="p-2 font-bold border-r border-green-800/30 ${isTargetRow ? 'text-green-300 bg-green-800/50' : 'text-green-600/80'}">${rowLabel}</td>`;

            row.forEach((val, cIdx) => {
                let isTargetCol = (cIdx === targetCol);
                let isTargetCell = isTargetRow && isTargetCol;
                let cellClass = "p-2 ";

                if (isTargetCell) {
                    // Hedef Hücre İyice Belirginleştirildi
                    cellClass += "bg-green-500 text-white font-black rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.9)] border-2 border-green-300 relative z-10 scale-110 text-sm ";
                } else if (isTargetCol) {
                    cellClass += "bg-green-800/20 text-green-400 font-bold ";
                } else if (isTargetRow) {
                    cellClass += "text-green-400 font-bold ";
                } else {
                    cellClass += "text-green-600/60 ";
                }
                html += `<td><div class="${cellClass} transition-all">${val}</div></td>`;
            });
            html += `</tr>`;
        });
        return html + `</tbody></table></div></div>`;
    }

    keyGenHTML(kg, c) {
        return `
        <div class="w-full max-w-4xl bg-slate-900/80 p-6 md:p-10 rounded-2xl border border-slate-700 shadow-xl mb-8 relative flex flex-col items-center mx-auto mt-4">
            <div class="absolute -top-3 left-6 bg-amber-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-md tracking-wider z-10">Alt Anahtar Üretimi (KeyGen)</div>
            
            <div class="flex flex-col items-center gap-1 mb-6 mt-2">
                <span class="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">10-Bit Orijinal Anahtar</span> 
                ${this.renderMiniBits(kg.key, 'slate', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}
            </div>
            
            <div class="flex flex-col items-center text-slate-500 text-sm mb-6">
                <div>⬇ <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-600">P10 Permütasyonu ile karıştır [${c.P10.join(', ')}]</span> ⬇</div>
            </div>
            
            <div class="flex gap-8 w-full justify-center mb-8 border-b border-slate-700/50 pb-8">
                <div class="flex flex-col items-center"><span class="text-[9px] text-slate-500 mb-2 tracking-widest">Sol Yarı (5-bit)</span>${this.renderMiniBits(kg.p10_L, 'amber', c.P10.slice(0, 5))}</div>
                <div class="flex flex-col items-center"><span class="text-[9px] text-slate-500 mb-2 tracking-widest">Sağ Yarı (5-bit)</span>${this.renderMiniBits(kg.p10_R, 'amber', c.P10.slice(5, 10))}</div>
            </div>

            <div class="flex flex-col items-center text-slate-500 text-sm mb-6">
                <div>⬇ <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-600">LS-1 (Her iki yarıyı da 1 Bit Sola Kaydır)</span> ⬇</div>
            </div>
            
            <div class="flex gap-8 w-full justify-center mb-6">
                ${this.renderMiniBits(kg.ls1_L, 'amber')}
                ${this.renderMiniBits(kg.ls1_R, 'amber')}
            </div>
            
            <div class="flex flex-col items-center mb-8 border-b border-slate-700/50 pb-8 w-full">
                <div class="text-slate-500 text-sm mb-4">⬇ <span class="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">P8 Permütasyonu ile 8 biti seç [${c.P8.join(', ')}]</span> ⬇</div>
                <div class="flex flex-col items-center bg-amber-500/10 p-4 rounded-xl border border-amber-500/30">
                    <span class="text-[12px] font-black text-amber-500 mb-2 tracking-widest">ALT ANAHTAR K1</span>
                    <div class="scale-110">${this.renderMiniBits(kg.K1, 'amber', c.P8)}</div>
                </div>
            </div>

            <div class="flex flex-col items-center text-slate-500 text-sm mb-6">
                <div>⬇ <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-600">LS-2 (Bu kez 2'şer Bit Daha Sola Kaydır)</span> ⬇</div>
            </div>
            
            <div class="flex gap-8 w-full justify-center mb-6">
                ${this.renderMiniBits(kg.ls2_L, 'orange')}
                ${this.renderMiniBits(kg.ls2_R, 'orange')}
            </div>
            
            <div class="flex flex-col items-center w-full">
                <div class="text-slate-500 text-sm mb-4">⬇ <span class="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">P8 Permütasyonu ile 8 biti seç [${c.P8.join(', ')}]</span> ⬇</div>
                <div class="flex flex-col items-center bg-orange-500/10 p-4 rounded-xl border border-orange-500/30">
                    <span class="text-[12px] font-black text-orange-500 mb-2 tracking-widest">ALT ANAHTAR K2</span>
                    <div class="scale-110">${this.renderMiniBits(kg.K2, 'orange', c.P8)}</div>
                </div>
            </div>
        </div>`;
    }

    generateCoreFlowHTML(d) {
        let actName = d.action === 'ENC' ? 'ŞİFRELEME' : 'DEŞİFRELEME';
        let k1Name = d.action === 'ENC' ? 'K1' : 'K2';
        let k2Name = d.action === 'ENC' ? 'K2' : 'K1';
        let c = d.constants;

        const renderRound = (roundNum, kName, actK, targetR, targetL, epOut, xorOut, sboxOut, p4Out, L_in, finalOut, outName) => {
            let s0_in = xorOut.substring(0, 4);
            let s1_in = xorOut.substring(4);
            return `
            <div class="w-full max-w-4xl bg-slate-900/60 border border-slate-700 rounded-xl p-6 md:p-10 relative shadow-lg mt-8 mb-8 flex flex-col items-center">
                <div class="absolute -top-3 left-6 bg-sky-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-md tracking-wider">Round ${roundNum} - Feistel Fonksiyonu (Fk)</div>
                
                <div class="flex flex-col md:flex-row items-center justify-center gap-6 w-full max-w-2xl bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                    <div class="flex flex-col items-center">
                        <span class="text-[10px] text-slate-400 font-bold tracking-widest mb-2 uppercase">EP(${targetR}) Genişletmesi</span>
                        <span class="text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-blue-300 font-mono shadow-sm">[${c.EP.join(', ')}]</span>
                    </div>
                    <div class="hidden md:block text-slate-500 text-2xl">➡</div>
                    <div class="md:hidden text-slate-500 text-2xl">⬇</div>
                    <div class="scale-110">${this.renderMiniBits(epOut, 'blue', c.EP)}</div>
                </div>

                <div class="flex flex-col w-full max-w-2xl items-center mt-6">
                    <div class="text-amber-500 text-3xl leading-none mb-4 text-center w-full">⊕</div>
                    <div class="flex flex-col md:flex-row items-center justify-center gap-6 w-full bg-amber-900/10 p-5 rounded-xl border border-amber-700/30">
                        <span class="text-[11px] text-amber-500 font-bold tracking-widest bg-amber-900/30 px-4 py-1.5 rounded-lg uppercase">Alt Anahtar ${kName}</span> 
                        <div class="scale-110">${this.renderMiniBits(actK, 'amber')}</div>
                    </div>
                    <div class="w-full border-b-2 border-dashed border-slate-700 my-6"></div>
                    <div class="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
                        <span class="text-[11px] text-slate-400 font-bold tracking-widest uppercase bg-slate-800 px-4 py-1.5 rounded-lg">XOR Sonucu</span> 
                        <div class="scale-110">${this.renderMiniBits(xorOut, 'purple')}</div>
                    </div>
                </div>

                <div class="flex flex-col items-center gap-6 w-full border-t-2 border-slate-700/50 pt-8 mt-8">
                    <div class="w-full flex justify-center">
                        <div class="bg-slate-800/80 border border-slate-600 rounded-xl p-5 flex flex-col items-center shadow-sm w-full max-w-2xl">
                            <span class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-5 border-b border-slate-600 pb-2 w-full text-center">1. Adım: 8-Bit XOR Sonucunu İkiye Böl</span>
                            <div class="flex items-center gap-8 w-full justify-center">
                                <div class="flex flex-col items-center">
                                    <span class="text-[10px] text-green-400 font-black mb-3">S0 İÇİN SOL (4-BİT)</span>
                                    <div class="scale-110">${this.renderMiniBits(s0_in, 'green')}</div>
                                </div>
                                <span class="text-slate-400 font-bold text-3xl px-4">✂️</span>
                                <div class="flex flex-col items-center">
                                    <span class="text-[10px] text-green-400 font-black mb-3">S1 İÇİN SAĞ (4-BİT)</span>
                                    <div class="scale-110">${this.renderMiniBits(s1_in, 'green')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col items-center w-full gap-8 mt-4">
                        <span class="text-sm text-green-400 font-bold tracking-widest flex items-center gap-2">
                            <span class="bg-green-600 text-white px-2.5 py-0.5 rounded-full text-xs">?</span> S-BOX Lookup Tabloları
                        </span>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
                            <div class="bg-green-900/20 p-5 rounded-xl border border-green-800/30 shadow-md w-full">
                                ${this.renderSBoxTable(c.S0, "S0 Matrisi", s0_in)}
                            </div>
                            <div class="bg-green-900/20 p-5 rounded-xl border border-green-800/30 shadow-md w-full">
                                ${this.renderSBoxTable(c.S1, "S1 Matrisi", s1_in)}
                            </div>
                        </div>
                        
                        <div class="flex flex-col items-center justify-center gap-5 bg-green-900/10 p-6 md:p-8 rounded-2xl border border-green-800/30 shadow-inner w-full max-w-2xl mt-4">
                            <div class="text-xs text-green-400/80 uppercase tracking-widest font-bold text-center border-b border-green-800/30 pb-3 mb-2 w-full">
                                2. Adım: Ondalık Çıktıları 2-Bit İkilik (Binary) Yap
                            </div>
                            <div class="flex gap-8 items-center">
                                <div class="flex flex-col items-center gap-2 bg-green-950/40 p-4 rounded-xl border border-green-800/50 w-32">
                                    <span class="text-[10px] text-green-500 font-black tracking-widest">S0 ÇIKTISI</span>
                                    <span class="text-3xl font-black text-white">${parseInt(sboxOut.substring(0, 2), 2)}</span>
                                    <span class="text-[10px] text-slate-400 mb-1 font-bold">⬇ 2-Bit Binary</span>
                                    ${this.renderMiniBits(sboxOut.substring(0, 2), 'green')}
                                </div>
                                <span class="text-green-600 font-black text-4xl">+</span>
                                <div class="flex flex-col items-center gap-2 bg-green-950/40 p-4 rounded-xl border border-green-800/50 w-32">
                                    <span class="text-[10px] text-green-500 font-black tracking-widest">S1 ÇIKTISI</span>
                                    <span class="text-3xl font-black text-white">${parseInt(sboxOut.substring(2, 4), 2)}</span>
                                    <span class="text-[10px] text-slate-400 mb-1 font-bold">⬇ 2-Bit Binary</span>
                                    ${this.renderMiniBits(sboxOut.substring(2, 4), 'green')}
                                </div>
                            </div>
                            <div class="text-green-500 text-4xl leading-none my-2">⬇</div>
                            <div class="flex flex-col items-center w-full">
                                <span class="text-xs text-green-400 font-black mb-3 tracking-widest uppercase">3. Adım: Birleştir (4-Bit Yeni Blok)</span>
                                <div class="scale-125 origin-top mb-2">${this.renderMiniBits(sboxOut, 'green')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-center w-full border-t-2 border-slate-700/50 pt-8 mt-8">
                    <div class="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-2xl bg-indigo-900/10 p-6 md:p-8 rounded-2xl border border-indigo-700/30">
                        <div class="flex flex-col items-center">
                            <span class="text-[10px] text-indigo-400 font-bold tracking-widest mb-3 uppercase">P4 Permütasyonu</span>
                            <span class="text-[11px] bg-indigo-900/40 px-3 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-300 font-mono shadow-sm">[${c.P4.join(', ')}]</span>
                        </div>
                        <div class="hidden md:block text-indigo-500/50 text-3xl">➡</div>
                        <div class="md:hidden text-indigo-500/50 text-3xl">⬇</div>
                        <div class="flex flex-col items-center">
                            <span class="text-[10px] text-indigo-400 font-bold tracking-widest mb-3 uppercase">P4 Sonucu</span>
                            <div class="scale-110">${this.renderMiniBits(p4Out, 'indigo', c.P4)}</div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-5 border-t-2 border-slate-700/50 pt-8 mt-8 w-full">
                    <div class="flex flex-col items-center justify-end h-full">
                        <div class="text-[10px] text-slate-400 mb-3 font-bold tracking-widest uppercase bg-slate-800 px-3 py-1 rounded-md border border-slate-700 shadow-sm">${targetL}</div>
                        <div class="scale-110">${this.renderMiniBits(L_in, 'slate')}</div>
                    </div>
                    <div class="text-amber-500 text-3xl font-black mt-5 md:mt-7">⊕</div>
                    <div class="flex flex-col items-center justify-end h-full">
                        <div class="text-[10px] text-indigo-400 mb-3 font-bold tracking-widest uppercase bg-indigo-900/30 px-3 py-1 rounded-md border border-indigo-800/50 shadow-sm">Fk Çıktısı (P4)</div>
                        <div class="scale-110">${this.renderMiniBits(p4Out, 'indigo', c.P4)}</div>
                    </div>
                    <div class="text-slate-500 text-3xl font-bold mt-5 md:mt-7">=</div>
                    <div class="flex flex-col items-center justify-end h-full bg-sky-900/20 px-5 py-3 rounded-xl border border-sky-700/30 shadow-inner">
                        <div class="text-[11px] text-sky-400 mb-3 font-black tracking-widest uppercase">${outName}</div>
                        <div class="scale-110">${this.renderMiniBits(finalOut, 'sky')}</div>
                    </div>
                </div>
            </div>`;
        };

        const renderSwap = () => `
            <div class="w-full max-w-4xl bg-slate-900/60 border border-slate-700 rounded-xl p-8 md:p-12 relative shadow-lg mt-4 mb-4 flex flex-col items-center transition-all duration-300">
                <div class="absolute -top-3 left-6 bg-sky-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-md tracking-wider">SWAP (Yer Değiştirme)</div>
                
                <div class="w-full max-w-md flex flex-col relative mt-4">
                    <div class="flex justify-between items-center w-full mb-12">
                        <div class="flex flex-col items-center">
                            <div class="text-[10px] text-sky-400 mb-3 font-bold tracking-widest uppercase bg-sky-900/30 px-3 py-1 rounded-md border border-sky-800/50 shadow-sm">Fk Çıktısı (Geçici)</div>
                            <div class="scale-110">${this.renderMiniBits(d.fk1_out, 'sky')}</div>
                        </div>
                        <div class="flex flex-col items-center">
                            <div class="text-[10px] text-blue-400 mb-3 font-bold tracking-widest uppercase bg-blue-900/30 px-3 py-1 rounded-md border border-blue-800/50 shadow-sm">R0 (Eski Sağ)</div>
                            <div class="scale-110">${this.renderMiniBits(d.R0, 'blue')}</div>
                        </div>
                    </div>

                    <div class="flex justify-center items-center absolute inset-0 pointer-events-none z-10">
                        <div class="bg-amber-500/20 text-amber-500 border-2 border-amber-500/30 text-sm font-black px-6 py-2 rounded-full tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2 backdrop-blur-md">
                            <span>SWAP</span>
                            <span class="text-xl leading-none">🔀</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center w-full mt-12">
                        <div class="flex flex-col items-center">
                            <div class="text-[10px] text-blue-400 mb-3 font-bold tracking-widest uppercase bg-blue-900/30 px-3 py-1 rounded-md border border-blue-800/50 shadow-sm">L1 (Yeni Sol)</div>
                            <div class="scale-110">${this.renderMiniBits(d.L1, 'blue')}</div>
                        </div>
                        <div class="flex flex-col items-center">
                            <div class="text-[10px] text-sky-400 mb-3 font-bold tracking-widest uppercase bg-sky-900/30 px-3 py-1 rounded-md border border-sky-800/50 shadow-sm">R1 (Yeni Sağ)</div>
                            <div class="scale-110">${this.renderMiniBits(d.R1, 'sky')}</div>
                        </div>
                    </div>
                </div>
            </div>`;

        return `
        <div class="space-y-6 text-slate-200">
            ${this.coreHeader(d)}
            ${this.keyGenHTML(d.keygen, d.constants)}
            
            <div class="bg-slate-800/80 p-8 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center mt-4">
                <div class="mb-4 text-center">
                    <div class="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest">S-DES Girdi Bloğu</div>
                    ${this.renderMiniBits(d.input, 'sky', [1, 2, 3, 4, 5, 6, 7, 8])}
                </div>
                <div class="text-slate-500 text-xl mb-2">⬇</div>
                <div class="flex flex-col items-center bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 px-5 py-2 rounded-xl mb-4 shadow-md">
                    <span class="text-[11px] font-black tracking-widest uppercase mb-1">IP (Başlangıç Permütasyonu)</span>
                    <span class="text-xs bg-indigo-950/50 px-3 py-1 rounded-lg font-mono text-indigo-200 border border-indigo-500/20 shadow-sm">[${c.IP.join(', ')}]</span>
                </div>
                <div class="mb-8 text-center">
                    ${this.renderMiniBits(d.ip, 'indigo', c.IP)}
                </div>
                <div class="flex gap-16 w-full justify-center mb-8">
                    <div class="text-center">
                        <div class="text-[11px] text-slate-400 font-bold mb-2 tracking-widest">L0 = ${d.L0}</div>
                        ${this.renderMiniBits(d.L0, 'slate', c.IP.slice(0, 4))}
                    </div>
                    <div class="text-center">
                        <div class="text-[11px] text-blue-400 font-bold mb-2 tracking-widest">R0 = ${d.R0}</div>
                        ${this.renderMiniBits(d.R0, 'blue', c.IP.slice(4, 8))}
                    </div>
                </div>

                ${renderRound(1, k1Name, d.actK1, `R0 = ${d.R0}`, `L0 = ${d.L0}`, d.ep1, d.xor1, d.sbox1, d.p4_1, d.L0, d.fk1_out, 'Yeni R (fk_out)')}
                
                ${renderSwap()}

                ${renderRound(2, k2Name, d.actK2, `R1 = ${d.R1}`, `L1 = ${d.L1}`, d.ep2, d.xor2, d.sbox2, d.p4_2, d.L1, d.L2, 'Yeni L (L2)')}

                <div class="flex gap-4 mb-6 w-full justify-center items-end bg-slate-900/30 p-6 rounded-xl border border-slate-700/50 mt-8">
                    <div class="text-center">
                        <div class="text-[10px] text-slate-400 font-bold mb-2 tracking-widest">L2 = ${d.L2}</div>
                        ${this.renderMiniBits(d.L2, 'sky')}
                    </div>
                    <div class="text-slate-500 text-2xl font-bold pb-1">+</div>
                    <div class="text-center">
                        <div class="text-[10px] text-slate-400 font-bold mb-2 tracking-widest">R2 = ${d.R2}</div>
                        ${this.renderMiniBits(d.R2, 'sky')}
                    </div>
                </div>

                <div class="text-slate-500 text-xl mb-2">⬇</div>
                <div class="flex flex-col items-center bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 px-5 py-2 rounded-xl mb-4 shadow-md">
                    <span class="text-[11px] font-black tracking-widest uppercase mb-1">IP⁻¹ (Ters Permütasyon)</span>
                    <span class="text-xs bg-indigo-950/50 px-3 py-1 rounded-lg font-mono text-indigo-200 border border-indigo-500/20 shadow-sm">[${c.IP_INV.join(', ')}]</span>
                </div>
                <div class="mb-6 text-center">
                    ${this.renderMiniBits(d.out, 'indigo', c.IP_INV)}
                </div>

                <div class="mt-4 pt-6 border-t-2 border-slate-700 w-full text-center">
                    <div class="text-[13px] text-green-400 font-black uppercase mb-3 tracking-widest">S-DES Çıktı Bloğu</div>
                    ${this.renderMiniBits(d.out, 'green')}
                </div>

            </div>
        </div>`;
    }
    coreHeader(d) {
        return `
        <div class="flex flex-wrap justify-center gap-6 bg-slate-900 p-4 rounded-xl border border-slate-700/50 shadow-inner mb-6 w-full max-w-2xl mx-auto">
            <div class="text-center"><div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">İşlem</div><div class="font-black text-sky-400 text-sm tracking-wider">${d.action === 'ENC' ? 'ŞİFRELEME' : 'DEŞİFRELEME'}</div></div>
            <div class="text-center"><div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Master Key</div><div class="font-mono text-white text-sm tracking-widest">${d.key}</div></div>
            <div class="text-center"><div class="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">Alt Anahtar K1</div><div class="font-mono text-amber-400 font-bold text-sm tracking-widest">${d.K1}</div></div>
            <div class="text-center"><div class="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">Alt Anahtar K2</div><div class="font-mono text-amber-400 font-bold text-sm tracking-widest">${d.K2}</div></div>
        </div>`;
    }


    openCoreModal(idx) {
        let step = this.simSteps[idx];
        if (!step || !step.data || !step.data.coreData) return;

        let modal = document.getElementById('core-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'core-modal';
            modal.className = 'fixed inset-0 bg-slate-950/95 z-[100] flex justify-center items-start overflow-y-auto p-4 backdrop-blur-sm hidden';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-slate-800 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl relative my-8 overflow-hidden">
                <div class="sticky top-0 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 p-5 flex justify-between items-center z-50 shadow-md">
                    <div>
                        <h2 class="text-xl font-black text-sky-400 tracking-widest uppercase">S-DES Çekirdek Detayları</h2>
                        <p class="text-[10px] text-slate-400 font-bold tracking-widest mt-1">Blok içerisindeki Feistel Ağları ve Permütasyonlar</p>
                    </div>
                    <button onclick="window.closeCoreModal()" class="text-slate-400 hover:text-white border border-slate-600 hover:border-red-500 bg-slate-700/50 hover:bg-red-500 rounded-xl px-5 py-2.5 font-bold transition text-xs tracking-widest">KAPAT ✕</button>
                </div>
                <div class="p-8">
                    ${this.generateCoreFlowHTML(step.data.coreData)}
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
    }

    renderStep() {
        const step = this.simSteps[this.currentStepIdx];
        const contentDiv = document.getElementById('step-content');

        document.getElementById('step-label').innerText = `Adım ${this.currentStepIdx + 1} / ${this.simSteps.length}`;
        document.getElementById('step-desc').innerText = step.title;
        document.getElementById('progress-bar').style.width = ((this.currentStepIdx + 1) / this.simSteps.length * 100) + "%";
        document.getElementById('btn-prev').disabled = this.currentStepIdx === 0;
        document.getElementById('btn-next').disabled = this.currentStepIdx === this.simSteps.length - 1;

        let html = "";

        if (step.type === 'INIT') {
            const d = step.data;
            const blockSection = d.mode === 'CORE'
                ? `
                <div class="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 w-full text-center border-b border-slate-700/50 pb-2">2. S-DES Çekirdek Girdisi (8-Bit)</h3>
                    
                    <div class="mb-5 flex flex-col md:flex-row gap-4 items-center justify-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div class="text-center">
                            <div class="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-widest">Orijinal Metin (${d.format})</div>
                            <div class="font-mono text-lg text-slate-200 bg-slate-900 inline-block px-4 py-2 rounded-lg border border-slate-600 break-all shadow-sm">${d.text}</div>
                        </div>
                        <div class="text-slate-500 text-2xl hidden md:block">➡</div>
                        <div class="text-slate-500 text-2xl md:hidden leading-none mt-[-10px] mb-[-10px]">⬇</div>
                        <div class="text-center">
                            <div class="text-[10px] text-sky-400 mb-1 font-bold uppercase tracking-widest">Tam Binary Karşılığı</div>
                            <div class="font-mono text-sm text-sky-300 bg-sky-950/40 inline-block px-4 py-2.5 rounded-lg border border-sky-800/50 break-all shadow-inner tracking-widest">${d.blocks[0]}</div>
                        </div>
                    </div>

                    <div class="flex justify-center mt-6">
                        <div class="bg-slate-800 border border-slate-600 rounded-lg p-3 text-center shadow-sm">
                            <div class="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-bold">İşlenecek 8-Bit Blok</div>
                            <div class="flex">${this.renderBits(d.blocks[0], 'bit-hl-blue')}</div>
                        </div>
                    </div>
                </div>
                `
                : `
                <div class="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">2. 8 Bitlik Bloklara Ayırma</h3>
                    
                    <div class="mb-5 flex flex-col md:flex-row gap-4 items-start md:items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div>
                            <div class="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-widest">Orijinal Metin (${d.format})</div>
                            <div class="font-mono text-lg text-slate-200 bg-slate-900 inline-block px-4 py-2 rounded-lg border border-slate-600 break-all shadow-sm">${d.text}</div>
                        </div>
                        <div class="text-slate-500 text-2xl hidden md:block">➡</div>
                        <div class="text-slate-500 text-2xl md:hidden text-center w-full leading-none mt-[-10px] mb-[-10px]">⬇</div>
                        <div class="flex-grow">
                            <div class="text-[10px] text-sky-400 mb-1 font-bold uppercase tracking-widest">Tam Binary Karşılığı</div>
                            <div class="font-mono text-sm text-sky-300 bg-sky-950/40 inline-block px-4 py-2.5 rounded-lg border border-sky-800/50 break-all shadow-inner tracking-widest">${d.blocks.join('')}</div>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-4 mt-4">
                        ${d.blocks.map((b, i) => {
                    let labelChar = '';
                    try {
                        if (d.format === 'ASCII' || d.format === 'Hex') {
                            labelChar = SdesUtils.ConvertFromBinary(b, d.format);
                        }
                    } catch (e) { }

                    let labelExtra = (d.action === 'ENC' && labelChar) ? ` ('${labelChar}')` : '';

                    return `
                            <div class="bg-slate-800 border border-slate-600 rounded-lg p-3 text-center shadow-sm">
                                <div class="text-[10px] text-slate-400 mb-2 uppercase tracking-widest font-bold">Blok ${i + 1}${labelExtra}</div>
                                <div class="flex">${this.renderBits(b, 'bit-hl-blue')}</div>
                            </div>
                            `;
                }).join('')}
                    </div>`;

            html = `
            <div class="step-card space-y-6">
                <div class="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">1. Girdi Özeti</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div class="bg-slate-800 p-3 rounded-lg"><div class="text-[10px] text-slate-400">Girdi Fmt.</div><div class="font-bold text-pink-400 text-xs">${d.format}</div></div>
                        <div class="bg-slate-800 p-3 rounded-lg"><div class="text-[10px] text-slate-400">Çıktı Fmt.</div><div class="font-bold text-teal-400 text-xs">${d.outFormat}</div></div>
                        <div class="bg-slate-800 p-3 rounded-lg"><div class="text-[10px] text-slate-400">Mod</div><div class="font-bold text-sky-400 text-xs">${d.mode}</div></div>
                        <div class="bg-slate-800 p-3 rounded-lg"><div class="text-[10px] text-slate-400">İşlem</div><div class="font-bold text-green-400 text-xs">${d.action === 'ENC' ? 'ŞİFRELE' : 'DEŞİFRELE'}</div></div>
                        <div class="bg-slate-800 p-3 rounded-lg"><div class="text-[10px] text-slate-400">Anahtar</div><div class="font-bold text-amber-400 mono tracking-widest text-[10px]">${d.key}</div></div>
                        <div class="bg-slate-800 p-3 rounded-lg"><div class="text-[10px] text-slate-400">IV</div><div class="font-bold text-purple-400 mono tracking-widest text-[10px]">${d.mode === 'ECB' || d.mode === 'CORE' ? '-' : d.iv}</div></div>
                    </div>
                </div>
                ${blockSection}
            </div>`;
        }
        else if (step.type === 'BLOCK_START') {
            html = `
            <div class="step-card flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <div class="text-5xl mb-4">📦</div>
                <h2 class="text-2xl font-bold text-white mb-2">${step.title}</h2>
                <p class="text-slate-400 mb-6">${step.desc}</p>
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 inline-block shadow-lg">
                    <div class="flex">${this.renderBits(step.data.block, 'bit-hl-blue')}</div>
                </div>
            </div>`;
        }
        else if (step.type === 'CORE_KEYGEN_P10') {
            const d = step.data;
            const kg = d.coreData.keygen;
            const c = d.coreData.constants;
            html = `
            <div class="step-card flex flex-col items-center w-full">
                <p class="text-slate-400 text-sm mb-6 text-center max-w-lg">${step.desc}</p>
                ${this.coreHeader(d.coreData)}
                <div class="w-full max-w-2xl bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-xl mt-4">
                    <div class="flex flex-col items-center gap-1 mb-6">
                        <span class="text-[10px] text-slate-400 font-bold tracking-widest uppercase">10-Bit Orijinal Anahtar</span> 
                        ${this.renderMiniBits(kg.key, 'slate', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])}
                    </div>
                    <div class="flex flex-col items-center text-slate-500 text-sm mb-6">
                        <div>⬇ <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-600">P10 Permütasyonu ile karıştır [${c.P10.join(', ')}]</span> ⬇</div>
                    </div>
                    <div class="flex gap-6 w-full justify-center">
                        <div class="flex flex-col items-center"><span class="text-[9px] text-slate-500 mb-1 tracking-widest">Sol Yarı (5-bit)</span>${this.renderMiniBits(kg.p10_L, 'amber', c.P10.slice(0, 5))}</div>
                        <div class="flex flex-col items-center"><span class="text-[9px] text-slate-500 mb-1 tracking-widest">Sağ Yarı (5-bit)</span>${this.renderMiniBits(kg.p10_R, 'amber', c.P10.slice(5, 10))}</div>
                    </div>
                </div>
            </div>`;
        }
        else if (step.type === 'CORE_KEYGEN_LS1') {
            const d = step.data;
            const kg = d.coreData.keygen;
            const c = d.coreData.constants;
            html = `
            <div class="step-card flex flex-col items-center w-full">
                <p class="text-slate-400 text-sm mb-6 text-center max-w-lg">${step.desc}</p>
                ${this.coreHeader(d.coreData)}
                <div class="w-full max-w-2xl bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-xl mt-4">
                    <div class="flex gap-6 w-full justify-center mb-6 opacity-50">
                        <div class="flex flex-col items-center"><span class="text-[9px] text-slate-500 mb-1 tracking-widest">P10 Sol</span>${this.renderMiniBits(kg.p10_L, 'amber', c.P10.slice(0, 5))}</div>
                        <div class="flex flex-col items-center"><span class="text-[9px] text-slate-500 mb-1 tracking-widest">P10 Sağ</span>${this.renderMiniBits(kg.p10_R, 'amber', c.P10.slice(5, 10))}</div>
                    </div>
                    <div class="flex flex-col items-center text-slate-500 text-sm mb-6">
                        <div>⬇ <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-600">LS-1 (Her iki yarıyı da 1 Bit Sola Kaydır)</span> ⬇</div>
                    </div>
                    <div class="flex gap-6 w-full justify-center mb-6">
                        ${this.renderMiniBits(kg.ls1_L, 'amber')}
                        ${this.renderMiniBits(kg.ls1_R, 'amber')}
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="text-slate-500 text-sm mb-3">⬇ <span class="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">P8 Permütasyonu ile 8 biti seç [${c.P8.join(', ')}]</span> ⬇</div>
                        <div class="flex flex-col items-center bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
                            <span class="text-[12px] font-black text-amber-500 mb-1 tracking-widest">ALT ANAHTAR K1</span>
                            ${this.renderMiniBits(kg.K1, 'amber', c.P8)}
                        </div>
                    </div>
                </div>
            </div>`;
        }
        else if (step.type === 'CORE_KEYGEN_LS2') {
            const d = step.data;
            const kg = d.coreData.keygen;
            const c = d.coreData.constants;
            html = `
            <div class="step-card flex flex-col items-center w-full">
                <p class="text-slate-400 text-sm mb-6 text-center max-w-lg">${step.desc}</p>
                ${this.coreHeader(d.coreData)}
                <div class="w-full max-w-2xl bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-xl mt-4">
                    <div class="flex gap-6 w-full justify-center mb-6 opacity-50">
                        <div class="flex flex-col items-center"><span class="text-[9px] text-slate-500 mb-1 tracking-widest">Önceki Sol</span>${this.renderMiniBits(kg.ls1_L, 'amber')}</div>
                        <div class="flex flex-col items-center"><span class="text-[9px] text-slate-500 mb-1 tracking-widest">Önceki Sağ</span>${this.renderMiniBits(kg.ls1_R, 'amber')}</div>
                    </div>
                    <div class="flex flex-col items-center text-slate-500 text-sm mb-6">
                        <div>⬇ <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-600">LS-2 (Bu kez 2'şer Bit Daha Sola Kaydır)</span> ⬇</div>
                    </div>
                    <div class="flex gap-6 w-full justify-center mb-6">
                        ${this.renderMiniBits(kg.ls2_L, 'orange')}
                        ${this.renderMiniBits(kg.ls2_R, 'orange')}
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="text-slate-500 text-sm mb-3">⬇ <span class="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">P8 Permütasyonu ile 8 biti seç [${c.P8.join(', ')}]</span> ⬇</div>
                        <div class="flex flex-col items-center bg-orange-500/10 p-3 rounded-xl border border-orange-500/30">
                            <span class="text-[12px] font-black text-orange-500 mb-1 tracking-widest">ALT ANAHTAR K2</span>
                            ${this.renderMiniBits(kg.K2, 'orange', c.P8)}
                        </div>
                    </div>
                </div>
            </div>`;
        }
        else if (step.type === 'CORE_IP') {
            const d = step.data;
            let c = d.coreData.constants;
            html = `
            <div class="step-card flex flex-col items-center w-full">
                <p class="text-slate-400 text-sm mb-6 text-center max-w-lg">${step.desc}</p>
                ${this.coreHeader(d.coreData)}
                <div class="w-full max-w-2xl bg-slate-800/80 p-8 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center mt-4">
                    <div class="mb-4 text-center">
                        <div class="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest">S-DES Girdi Bloğu</div>
                        ${this.renderMiniBits(d.coreData.input, 'sky', [1, 2, 3, 4, 5, 6, 7, 8])}
                    </div>
                    <div class="text-slate-500 text-xl mb-2">⬇</div>
                    <div class="flex flex-col items-center bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 px-5 py-2 rounded-xl mb-4 shadow-md">
                        <span class="text-[11px] font-black tracking-widest uppercase mb-1">IP (Başlangıç Permütasyonu)</span>
                        <span class="text-xs bg-indigo-950/50 px-3 py-1 rounded-lg font-mono text-indigo-200 border border-indigo-500/20 shadow-sm">[${c.IP.join(', ')}]</span>
                    </div>
                    <div class="mb-8 text-center">
                        ${this.renderMiniBits(d.coreData.ip, 'indigo', c.IP)}
                    </div>
                    <div class="flex gap-16 w-full justify-center">
                        <div class="text-center">
                            <div class="text-[11px] text-slate-400 font-bold mb-2 tracking-widest">L0 = ${d.coreData.L0}</div>
                            ${this.renderMiniBits(d.coreData.L0, 'slate', c.IP.slice(0, 4))}
                        </div>
                        <div class="text-center">
                            <div class="text-[11px] text-blue-400 font-bold mb-2 tracking-widest">R0 = ${d.coreData.R0}</div>
                            ${this.renderMiniBits(d.coreData.R0, 'blue', c.IP.slice(4, 8))}
                        </div>
                    </div>
                </div>
            </div>`;
        }
        else if (step.type.startsWith('CORE_ROUND1_') || step.type.startsWith('CORE_ROUND2_')) {
            const d = step.data;
            let c = d.coreData.constants;
            let isRound1 = step.type.includes('ROUND1');

            let kName = isRound1 ? (d.coreData.action === 'ENC' ? 'K1' : 'K2') : (d.coreData.action === 'ENC' ? 'K2' : 'K1');
            let actK = isRound1 ? d.coreData.actK1 : d.coreData.actK2;
            let epIn = isRound1 ? d.coreData.R0 : d.coreData.R1;
            let epOut = isRound1 ? d.coreData.ep1 : d.coreData.ep2;
            let xorOut = isRound1 ? d.coreData.xor1 : d.coreData.xor2;
            let sboxOut = isRound1 ? d.coreData.sbox1 : d.coreData.sbox2;
            let p4Out = isRound1 ? d.coreData.p4_1 : d.coreData.p4_2;
            let L_in = isRound1 ? d.coreData.L0 : d.coreData.L1;
            let finalOut = isRound1 ? d.coreData.fk1_out : d.coreData.L2;

            let s0_in = xorOut.substring(0, 4);
            let s1_in = xorOut.substring(4);

            let subStep = step.type.split('_').pop();
            let roundName = isRound1 ? "Round 1" : "Round 2";

            let targetL = isRound1 ? `L0 = ${L_in}` : `L1 = ${L_in}`;
            let targetR = isRound1 ? `R0 = ${epIn}` : `R1 = ${epIn}`;
            let outName = isRound1 ? "Round 1 Sonu L" : "Yeni L (L2)";

            html = `
            <div class="step-card flex flex-col items-center w-full">
                <p class="text-slate-400 text-sm mb-6 text-center max-w-lg">${step.desc}</p>
                ${this.coreHeader(d.coreData)}
                
                <div class="w-full max-w-4xl bg-slate-900/60 border border-slate-700 rounded-xl p-6 md:p-10 relative shadow-lg mt-4 transition-all duration-300 flex flex-col items-center">
                    <div class="absolute -top-3 left-6 bg-sky-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-md tracking-wider">${roundName} - Feistel Fonksiyonu (Fk)</div>
                    
                    <div class="flex flex-col md:flex-row items-center justify-center gap-6 w-full max-w-2xl bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                        <div class="flex flex-col items-center">
                            <span class="text-[10px] text-slate-400 font-bold tracking-widest mb-2 uppercase">EP(${targetR}) Genişletmesi</span>
                            <span class="text-xs bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-blue-300 font-mono shadow-sm">[${c.EP.join(', ')}]</span>
                        </div>
                        <div class="hidden md:block text-slate-500 text-2xl">➡</div>
                        <div class="md:hidden text-slate-500 text-2xl">⬇</div>
                        <div class="scale-110">${this.renderMiniBits(epOut, 'blue', c.EP)}</div>
                    </div>

                    <div class="${(subStep === 'XOR' || subStep === 'SBOX' || subStep === 'P4') ? 'flex' : 'hidden'} flex-col w-full max-w-2xl transition-all duration-500 items-center mt-6">
                        <div class="text-amber-500 text-3xl leading-none mb-4 text-center w-full">⊕</div>
                        <div class="flex flex-col md:flex-row items-center justify-center gap-6 w-full bg-amber-900/10 p-5 rounded-xl border border-amber-700/30">
                            <span class="text-[11px] text-amber-500 font-bold tracking-widest bg-amber-900/30 px-4 py-1.5 rounded-lg uppercase">Alt Anahtar ${kName}</span> 
                            <div class="scale-110">${this.renderMiniBits(actK, 'amber')}</div>
                        </div>
                        <div class="w-full border-b-2 border-dashed border-slate-700 my-6"></div>
                        <div class="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
                            <span class="text-[11px] text-slate-400 font-bold tracking-widest uppercase bg-slate-800 px-4 py-1.5 rounded-lg">XOR Sonucu</span> 
                            <div class="scale-110">${this.renderMiniBits(xorOut, 'purple')}</div>
                        </div>
                    </div>

                    <div class="${(subStep === 'SBOX' || subStep === 'P4') ? 'flex' : 'hidden'} flex-col items-center gap-6 w-full transition-all duration-500 border-t-2 border-slate-700/50 pt-8 mt-8">
                        
                        <div class="w-full flex justify-center">
                            <div class="bg-slate-800/80 border border-slate-600 rounded-xl p-5 flex flex-col items-center shadow-sm w-full max-w-2xl">
                                <span class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-5 border-b border-slate-600 pb-2 w-full text-center">1. Adım: 8-Bit XOR Sonucunu İkiye Böl</span>
                                <div class="flex items-center gap-8 w-full justify-center">
                                    <div class="flex flex-col items-center">
                                        <span class="text-[10px] text-green-400 font-black mb-3">S0 İÇİN SOL (4-BİT)</span>
                                        <div class="scale-110">${this.renderMiniBits(s0_in, 'green')}</div>
                                    </div>
                                    <span class="text-slate-400 font-bold text-3xl px-4">✂️</span>
                                    <div class="flex flex-col items-center">
                                        <span class="text-[10px] text-green-400 font-black mb-3">S1 İÇİN SAĞ (4-BİT)</span>
                                        <div class="scale-110">${this.renderMiniBits(s1_in, 'green')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col items-center w-full gap-8 mt-4">
                            <span class="text-sm text-green-400 font-bold tracking-widest flex items-center gap-2">
                                <span class="bg-green-600 text-white px-2.5 py-0.5 rounded-full text-xs">?</span> S-BOX Lookup Tabloları
                            </span>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                <div class="bg-green-900/20 p-5 rounded-xl border border-green-800/30 shadow-md w-full">
                                    ${this.renderSBoxTable(c.S0, "S0 Matrisi", s0_in)}
                                </div>
                                <div class="bg-green-900/20 p-5 rounded-xl border border-green-800/30 shadow-md w-full">
                                    ${this.renderSBoxTable(c.S1, "S1 Matrisi", s1_in)}
                                </div>
                            </div>
                            
                            <div class="flex flex-col items-center justify-center gap-5 bg-green-900/10 p-6 md:p-8 rounded-2xl border border-green-800/30 shadow-inner w-full max-w-2xl mt-4">
                                <div class="text-xs text-green-400/80 uppercase tracking-widest font-bold text-center border-b border-green-800/30 pb-3 mb-2 w-full">
                                    2. Adım: Ondalık Çıktıları 2-Bit İkilik (Binary) Yap
                                </div>
                                <div class="flex gap-8 items-center">
                                    <div class="flex flex-col items-center gap-2 bg-green-950/40 p-4 rounded-xl border border-green-800/50 w-32">
                                        <span class="text-[10px] text-green-500 font-black tracking-widest">S0 ÇIKTISI</span>
                                        <span class="text-3xl font-black text-white">${parseInt(sboxOut.substring(0, 2), 2)}</span>
                                        <span class="text-[10px] text-slate-400 mb-1 font-bold">⬇ 2-Bit Binary</span>
                                        ${this.renderMiniBits(sboxOut.substring(0, 2), 'green')}
                                    </div>
                                    <span class="text-green-600 font-black text-4xl">+</span>
                                    <div class="flex flex-col items-center gap-2 bg-green-950/40 p-4 rounded-xl border border-green-800/50 w-32">
                                        <span class="text-[10px] text-green-500 font-black tracking-widest">S1 ÇIKTISI</span>
                                        <span class="text-3xl font-black text-white">${parseInt(sboxOut.substring(2, 4), 2)}</span>
                                        <span class="text-[10px] text-slate-400 mb-1 font-bold">⬇ 2-Bit Binary</span>
                                        ${this.renderMiniBits(sboxOut.substring(2, 4), 'green')}
                                    </div>
                                </div>
                                <div class="text-green-500 text-4xl leading-none my-2">⬇</div>
                                <div class="flex flex-col items-center w-full">
                                    <span class="text-xs text-green-400 font-black mb-3 tracking-widest uppercase">3. Adım: Birleştir (4-Bit Yeni Blok)</span>
                                    <div class="scale-125 origin-top mb-2">${this.renderMiniBits(sboxOut, 'green')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="${(subStep === 'P4') ? 'flex' : 'hidden'} flex-col items-center w-full transition-all duration-500 border-t-2 border-slate-700/50 pt-8 mt-8">
                        <div class="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-2xl bg-indigo-900/10 p-6 md:p-8 rounded-2xl border border-indigo-700/30">
                            <div class="flex flex-col items-center">
                                <span class="text-[10px] text-indigo-400 font-bold tracking-widest mb-3 uppercase">P4 Permütasyonu</span>
                                <span class="text-[11px] bg-indigo-900/40 px-3 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-300 font-mono shadow-sm">[${c.P4.join(', ')}]</span>
                            </div>
                            <div class="hidden md:block text-indigo-500/50 text-3xl">➡</div>
                            <div class="md:hidden text-indigo-500/50 text-3xl">⬇</div>
                            <div class="flex flex-col items-center">
                                <span class="text-[10px] text-indigo-400 font-bold tracking-widest mb-3 uppercase">P4 Sonucu</span>
                                <div class="scale-110">${this.renderMiniBits(p4Out, 'indigo', c.P4)}</div>
                            </div>
                        </div>
                    </div>

                    <div class="${(subStep === 'P4') ? 'flex' : 'hidden'} flex-col md:flex-row items-center justify-center gap-4 md:gap-5 border-t-2 border-slate-700/50 pt-8 mt-8 w-full transition-all duration-500">
                        
                        <div class="flex flex-col items-center justify-end h-full">
                            <div class="text-[10px] text-slate-400 mb-3 font-bold tracking-widest uppercase bg-slate-800 px-3 py-1 rounded-md border border-slate-700 shadow-sm">${targetL}</div>
                            <div class="scale-110">${this.renderMiniBits(L_in, 'slate')}</div>
                        </div>
                        
                        <div class="text-amber-500 text-3xl font-black mt-5 md:mt-7">⊕</div>
                        
                        <div class="flex flex-col items-center justify-end h-full">
                            <div class="text-[10px] text-indigo-400 mb-3 font-bold tracking-widest uppercase bg-indigo-900/30 px-3 py-1 rounded-md border border-indigo-800/50 shadow-sm">Fk Çıktısı (P4)</div>
                            <div class="scale-110">${this.renderMiniBits(p4Out, 'indigo', c.P4)}</div>
                        </div>
                        
                        <div class="text-slate-500 text-3xl font-bold mt-5 md:mt-7">=</div>
                        
                        <div class="flex flex-col items-center justify-end h-full bg-sky-900/20 px-5 py-3 rounded-xl border border-sky-700/30 shadow-inner">
                            <div class="text-[11px] text-sky-400 mb-3 font-black tracking-widest uppercase">${outName}</div>
                            <div class="scale-110">${this.renderMiniBits(finalOut, 'sky')}</div>
                        </div>
                        
                    </div>

                </div>
            </div>`;
        }
        else if (step.type === 'CORE_SWAP') {
            const d = step.data;
            html = `
            <div class="step-card flex flex-col items-center w-full">
                <p class="text-slate-400 text-sm mb-6 text-center max-w-lg">${step.desc}</p>
                ${this.coreHeader(d.coreData)}
                <div class="w-full max-w-2xl bg-slate-900/60 border border-slate-700 rounded-xl p-8 md:p-12 relative shadow-lg mt-4 flex flex-col items-center transition-all duration-300">
                    <div class="absolute -top-3 left-6 bg-sky-600 text-white text-[10px] font-bold px-3 py-1 rounded shadow-md tracking-wider">Adım 4: SWAP (Yer Değiştirme)</div>
                    
                    <div class="w-full max-w-md flex flex-col relative mt-4">
                        <div class="flex justify-between items-center w-full mb-12">
                            <div class="flex flex-col items-center">
                                <div class="text-[10px] text-sky-400 mb-3 font-bold tracking-widest uppercase bg-sky-900/30 px-3 py-1 rounded-md border border-sky-800/50 shadow-sm">Fk Çıktısı (Round 1 Sonu L)</div>
                                <div class="scale-110">${this.renderMiniBits(d.coreData.fk1_out, 'sky')}</div>
                            </div>
                            <div class="flex flex-col items-center">
                                <div class="text-[10px] text-blue-400 mb-3 font-bold tracking-widest uppercase bg-blue-900/30 px-3 py-1 rounded-md border border-blue-800/50 shadow-sm">R0 (Eski Sağ)</div>
                                <div class="scale-110">${this.renderMiniBits(d.coreData.R0, 'blue')}</div>
                            </div>
                        </div>

                        <div class="flex justify-center items-center absolute inset-0 pointer-events-none z-10">
                            <div class="bg-amber-500/20 text-amber-500 border-2 border-amber-500/30 text-sm font-black px-6 py-2 rounded-full tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2 backdrop-blur-md">
                                <span>SWAP</span>
                                <span class="text-xl leading-none">🔀</span>
                            </div>
                        </div>

                        <div class="flex justify-between items-center w-full mt-12">
                            <div class="flex flex-col items-center">
                                <div class="text-[10px] text-blue-400 mb-3 font-bold tracking-widest uppercase bg-blue-900/30 px-3 py-1 rounded-md border border-blue-800/50 shadow-sm">L1 (Yeni Sol)</div>
                                <div class="scale-110">${this.renderMiniBits(d.coreData.L1, 'blue')}</div>
                            </div>
                            <div class="flex flex-col items-center">
                                <div class="text-[10px] text-sky-400 mb-3 font-bold tracking-widest uppercase bg-sky-900/30 px-3 py-1 rounded-md border border-sky-800/50 shadow-sm">R1 (Yeni Sağ)</div>
                                <div class="scale-110">${this.renderMiniBits(d.coreData.R1, 'sky')}</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>`;
        }
        else if (step.type === 'CORE_OUT') {
            const d = step.data;
            let c = d.coreData.constants;
            html = `
            <div class="step-card flex flex-col items-center w-full">
                <p class="text-slate-400 text-sm mb-6 text-center max-w-lg">${step.desc}</p>
                ${this.coreHeader(d.coreData)}
                <div class="w-full max-w-2xl bg-slate-800/80 p-8 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center mt-4">
                    
                    <div class="flex gap-4 mb-6 w-full justify-center items-end bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                        <div class="text-center">
                            <div class="text-[10px] text-slate-400 font-bold mb-2 tracking-widest">L2 = ${d.coreData.L2}</div>
                            ${this.renderMiniBits(d.coreData.L2, 'sky')}
                        </div>
                        <div class="text-slate-500 text-2xl font-bold pb-1">+</div>
                        <div class="text-center">
                            <div class="text-[10px] text-slate-400 font-bold mb-2 tracking-widest">R2 = ${d.coreData.R2}</div>
                            ${this.renderMiniBits(d.coreData.R2, 'sky')}
                        </div>
                    </div>

                    <div class="text-slate-500 text-xl mb-2">⬇</div>
                    <div class="flex flex-col items-center bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 px-5 py-2 rounded-xl mb-4 shadow-md">
                        <span class="text-[11px] font-black tracking-widest uppercase mb-1">IP⁻¹ (Ters Permütasyon)</span>
                        <span class="text-xs bg-indigo-950/50 px-3 py-1 rounded-lg font-mono text-indigo-200 border border-indigo-500/20 shadow-sm">[${c.IP_INV.join(', ')}]</span>
                    </div>
                    <div class="mb-6 text-center">
                        ${this.renderMiniBits(d.coreData.out, 'indigo', c.IP_INV)}
                    </div>

                    <div class="mt-4 pt-6 border-t-2 border-slate-700 w-full text-center">
                        <div class="text-[13px] text-green-400 font-black uppercase mb-3 tracking-widest">S-DES Çıktı Bloğu</div>
                        ${this.renderMiniBits(d.coreData.out, 'green')}
                    </div>

                </div>
            </div>`;
        }
        else if (step.type === 'XOR') {
            const d = step.data;
            html = `
            <div class="step-card flex flex-col items-center justify-center">
                <p class="text-slate-400 text-sm mb-6 text-center max-w-lg">${step.desc}</p>
                <div class="bg-slate-900/80 p-6 rounded-2xl border border-slate-700 shadow-xl inline-block">
                    
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">${d.aLab}</span>
                    </div>
                    <div class="flex mb-2">${this.renderBits(d.a, 'bit-hl-blue')}</div>
                    
                    <div class="flex items-center justify-center h-6 text-amber-500 text-xl font-bold my-1">⊕</div>
                    
                    <div class="flex items-center justify-between mb-2 mt-1">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">${d.bLab}</span>
                    </div>
                    <div class="flex">${this.renderBits(d.b, 'bit-hl-purple')}</div>
                    
                    <div class="xor-line"></div>
                    
                    <div class="flex items-center justify-between mt-2 mb-2">
                        <span class="text-[10px] font-bold text-${d.color}-400 uppercase tracking-widest">XOR Sonucu</span>
                    </div>
                    <div class="flex">${this.renderBits(d.res, `bit-hl-${d.color}`)}</div>
                </div>
            </div>`;
        }
        else if (step.type === 'CIPHER') {
            const d = step.data;
            const actColor = d.action === 'ENC' ? 'green' : 'blue';

            html = `
            <div class="step-card flex flex-col items-center">
                <p class="text-slate-400 text-sm mb-8 text-center max-w-lg">${step.desc}</p>
                
                <div class="flex flex-col items-center">
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">${d.labelIn}</div>
                    <div class="flex">${this.renderBits(d.in, 'bit-hl-blue')}</div>
                    
                    <div class="h-8 border-l-2 border-dashed border-slate-600 my-2 relative">
                        <div class="absolute top-1/2 -translate-y-1/2 left-4 text-[10px] font-bold text-amber-500 whitespace-nowrap bg-slate-900 px-2 py-1 border border-amber-900 rounded-md">KEY: ${d.key}</div>
                    </div>
                    
                    <div onclick="window.openCoreModal(${this.currentStepIdx})" class="cursor-pointer hover:scale-105 transition transform bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-${actColor}-500/50 rounded-xl p-5 shadow-[0_0_20px_rgba(34,197,94,0.15)] w-72 text-center z-10 relative overflow-hidden group">
                        <div class="absolute inset-0 bg-${actColor}-500/10 opacity-0 group-hover:opacity-100 transition duration-300"></div>
                        <span class="relative z-10 font-black text-xl tracking-widest text-${actColor}-400 group-hover:text-white transition duration-300">S-DES CORE</span>
                        <div class="relative z-10 text-[10px] text-slate-400 mt-2 uppercase font-bold flex items-center justify-center gap-1 group-hover:text-sky-300 transition duration-300">
                            <span>Detayları Görmek İçin Tıkla</span> <span class="text-lg leading-none">🔍</span>
                        </div>
                    </div>
                    
                    <div class="h-8 border-l-2 border-dashed border-slate-600 my-2"></div>
                    
                    <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">${d.labelOut}</div>
                    <div class="flex">${this.renderBits(d.out, `bit-hl-${actColor}`)}</div>
                </div>
            </div>`;
        }
        else if (step.type === 'FINAL') {
            const d = step.data;
            const currentMode = this.simSteps[0].data.mode;
            let outFmt = d.action === 'ENC' ? 'Binary' : (currentMode === 'CORE' ? 'Binary' : 'ASCII (Metin)');

            let expectedHTML = '';
            if (d.expected) {
                let isMatch = false;
                if (d.outFormat !== 'ASCII') {
                    let cleanExp = d.expected.replace(/^0+/, '').toLowerCase() || '0';
                    let cleanRes = d.finalResult.replace(/^0+/, '').toLowerCase() || '0';
                    isMatch = (cleanExp === cleanRes);
                } else {
                    isMatch = (d.expected === d.finalResult);
                }

                let bgClass = isMatch ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-red-900/30 border-red-500 text-red-400';
                let icon = isMatch ? '✅' : '❌';
                let title = isMatch ? 'EŞLEŞME BAŞARILI' : 'EŞLEŞME BAŞARISIZ';

                expectedHTML = `
                <div class="${bgClass} border-2 p-6 rounded-xl mt-6 text-center shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-500">
                    <h3 class="text-xl font-black tracking-widest mb-4">${icon} ${title}</h3>
                    <div class="flex justify-around items-center bg-slate-900/60 p-4 rounded-lg border border-slate-700/50">
                        <div class="flex flex-col w-1/2">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Beklenen Değer</span>
                            <span class="font-mono text-lg break-all">${d.expected}</span>
                        </div>
                        <div class="text-2xl font-black px-4 ${isMatch ? 'text-emerald-500' : 'text-red-500'}">${isMatch ? '==' : '!='}</div>
                        <div class="flex flex-col w-1/2">
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Simülasyon Sonucu</span>
                            <span class="font-mono text-lg break-all ${isMatch ? 'text-emerald-300' : 'text-red-300'}">${d.finalResult}</span>
                        </div>
                    </div>
                </div>`;
            }

            html = `
            <div class="step-card space-y-6">
                <div class="bg-green-900/20 p-6 rounded-2xl border border-green-500/30 text-center shadow-lg">
                    <div class="text-4xl mb-3">✅</div>
                    <h2 class="text-xl font-bold text-green-400 uppercase tracking-widest mb-2">Simülasyon Tamamlandı</h2>
                    <p class="text-slate-400 text-sm">Tüm bloklar ${d.action === 'ENC' ? 'şifrelendi' : 'çözüldü'} ve birleştirildi.</p>
                </div>

                <div class="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                    <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Birleştirilmiş Binary Çıktı</h3>
                    <div class="flex flex-wrap gap-3 justify-center items-center">
                        ${d.outBlocks.map((b, i) => {
                let charLabel = '';
                if (d.action === 'DEC' && currentMode !== 'CORE' && (d.outFormat === 'ASCII' || d.outFormat === 'Hex')) {
                    try {
                        let outChar = SdesUtils.ConvertFromBinary(b, d.outFormat);
                        if (outChar) {
                            charLabel = `<div class="text-[10px] text-green-400 mt-1 font-bold uppercase tracking-widest border-t border-slate-600/50 pt-1 w-full text-center">Blok Değeri: '${outChar}'</div>`;
                        }
                    } catch (e) { }
                }

                return `
                            <div class="bg-slate-800 px-3 py-2 rounded-lg font-mono text-sm tracking-widest text-sky-300 border border-slate-600 shadow-sm flex flex-col items-center">
                                <div>${b}</div>
                                ${charLabel}
                            </div>`;
            }).join('<span class="text-slate-500 font-black text-2xl self-center">+</span>')}
                    </div>
                </div>

                <div class="bg-slate-900/80 p-6 rounded-xl border border-sky-500/30 text-center shadow-[0_0_20px_rgba(56,189,248,0.1)]">
                    <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Sonuç (Çıktı Formatı: ${d.outFormat})</h3>
                    <div class="font-mono text-xl md:text-3xl font-black text-white bg-slate-800 inline-block px-6 py-3 rounded-lg border border-slate-600 break-all w-full max-w-full">
                        ${d.finalResult}
                    </div>
                </div>
                
                ${expectedHTML}

                <div class="flex justify-center mt-8 pt-4 border-t border-slate-700/50">
                    <button onclick="window.reverseTest()" class="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-black py-3 px-8 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.3)] transition transform hover:scale-105 active:scale-95 uppercase tracking-widest text-xs flex items-center gap-3 border border-amber-400/50">
                        <span class="text-xl">🔄</span> Tersini Test Et
                    </button>
                </div>
            </div>`;
        }

        contentDiv.innerHTML = html;
    }

    loadExample(num) {
        let expEl = document.getElementById('inp-expected');
        if (expEl) expEl.value = "";
        document.getElementById('inp-action').dispatchEvent(new Event('change'));

        let formatEl = document.getElementById('inp-format');
        let outFormatEl = document.getElementById('inp-out-format');

        if (num == 0) {
            document.getElementById('inp-text').value = "10101010";
            document.getElementById('inp-key').value = "0111111101";
            document.getElementById('inp-iv').value = "";
            document.getElementById('inp-mode').value = "CORE";
            document.getElementById('inp-action').value = "ENC";
            if (formatEl) formatEl.value = "Binary";
            if (outFormatEl) outFormatEl.value = "Binary";
        } else if (num == 1) {
            document.getElementById('inp-text').value = "SDES";
            document.getElementById('inp-key').value = "1110001110";
            document.getElementById('inp-iv').value = "10101010";
            document.getElementById('inp-mode').value = "CBC";
            document.getElementById('inp-action').value = "ENC";
            if (formatEl) formatEl.value = "ASCII";
            if (outFormatEl) outFormatEl.value = "Hex"; // Örnek olarak çıktıyı Hex görelim
        } else if (num == 2) {
            // HEX örneği yapalım (Eski uzun binary yerine Hex girdi veriyoruz)
            document.getElementById('inp-text').value = "0A6E484D";
            document.getElementById('inp-key').value = "1010101010";
            document.getElementById('inp-iv').value = "11110000";
            document.getElementById('inp-mode').value = "OFB";
            document.getElementById('inp-action').value = "DEC";
            if (formatEl) formatEl.value = "Hex";
            if (outFormatEl) outFormatEl.value = "ASCII"; // Deşifreleyince anlamlı metin çıksın
        }
    }


    resetApp() {
        const simPanel = document.getElementById('sim-panel');
        let expEl = document.getElementById('inp-expected');
        if (expEl) expEl.value = "";
        if (simPanel) {
            simPanel.classList.add('hidden');
            simPanel.classList.remove('flex');
        }
        document.getElementById('inp-text').value = "";
    }
    reverseTest() {
        // En son ve en ilk adımlardaki verilere ulaşıyoruz
        const finalStep = this.simSteps[this.simSteps.length - 1];
        const initStep = this.simSteps[0];

        if (!finalStep || finalStep.type !== 'FINAL') return;

        // Mevcut ayarları alıyoruz
        const currentAction = initStep.data.action;
        const currentInpFmt = initStep.data.format;
        const currentOutFmt = initStep.data.outFormat;
        const originalText = initStep.data.text;
        const finalResult = finalStep.data.finalResult;

        // Form alanlarını tersine çeviriyoruz
        document.getElementById('inp-text').value = finalResult;
        document.getElementById('inp-expected').value = originalText;
        document.getElementById('inp-action').value = currentAction === 'ENC' ? 'DEC' : 'ENC';

        const inpFormatEl = document.getElementById('inp-format');
        const outFormatEl = document.getElementById('inp-out-format');

        if (inpFormatEl) inpFormatEl.value = currentOutFmt;
        if (outFormatEl) outFormatEl.value = currentInpFmt;

        document.getElementById('inp-action').dispatchEvent(new Event('change'));

        const configPanel = document.getElementById('config-panel');
        if (configPanel) {
            configPanel.scrollIntoView({ behavior: 'smooth' });


            // setTimeout(() => this.startSimulation(), 500); 
        }
    }
}