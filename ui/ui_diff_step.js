/**
 * DiffStepUI Sınıfı (Karanlık Tema - Dark Mode Entegrasyonu)
 */
class DiffStepUI {
    constructor() {
        this.container = document.getElementById('stepsContainer');
        this.navControls = document.getElementById('navControls');
        this.stepInfo = document.getElementById('stepInfo');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentStep = 0;
        this.totalSteps = 7;
    }

    toBin(val, bits) {
        return val.toString(2).padStart(bits, '0');
    }

    renderStaticSBox(matrix, title) {
        let html = `<div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700 shadow-inner"><h4 class="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest mb-3">${title}</h4><table class="w-full text-center border-collapse text-xs font-mono"><thead><tr class="text-green-500 bg-green-900/10 border-b border-green-800/30"><th class="p-2 border-r border-green-800/30">R\\C</th><th class="p-2">00</th><th class="p-2">01</th><th class="p-2">10</th><th class="p-2">11</th></tr></thead><tbody>`;
        matrix.forEach((row, rowIndex) => {
            html += `<tr class="border-b border-slate-800/50 last:border-0"><td class="font-bold bg-slate-800/50 text-slate-400 border-r border-slate-700/50 p-2">${this.toBin(rowIndex, 2)}</td>`;
            row.forEach(val => { html += `<td class="p-2 text-slate-300">${val}</td>`; });
            html += `</tr>`;
        });
        return html + `</tbody></table></div>`;
    }

    renderDDT(ddt, title) {
        let maxVal = -1, maxR = -1, maxC = -1;
        // 0. satırı atlayıp en yüksek değeri bul
        for (let r = 1; r < 16; r++) {
            for (let c = 0; c < 4; c++) {
                if (ddt[r][c] > maxVal) { maxVal = ddt[r][c]; maxR = r; maxC = c; }
            }
        }
        let html = `<div class="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-sm overflow-x-auto"><h3 class="text-center font-bold text-[11px] text-slate-400 uppercase tracking-widest mb-4">${title}</h3><table class="w-full text-[10px] text-center border-collapse font-mono"><thead><tr class="border-b border-slate-700"><th class="border-r border-slate-700 p-2 text-slate-500 bg-slate-800/50">ΔX\\ΔY</th>`;

        for (let i = 0; i < 4; i++) {
            let isMaxC = (i === maxC);
            let thClass = isMaxC ? 'bg-indigo-900/40 text-indigo-300 font-bold' : 'text-slate-500 bg-slate-800/50';
            html += `<th class="p-2 ${thClass}">${this.toBin(i, 2)}</th>`;
        }
        html += `</tr></thead><tbody>`;

        for (let r = 0; r < 16; r++) {
            let isMaxR = (r === maxR);
            let rowClass = isMaxR ? 'bg-indigo-900/40 text-indigo-300 font-bold' : 'bg-slate-800/50 text-slate-500 font-medium';
            html += `<tr class="border-b border-slate-700/50 last:border-0"><td class="border-r border-slate-700 p-2 ${rowClass}">${this.toBin(r, 4)}</td>`;

            for (let c = 0; c < 4; c++) {
                let isMaxCell = (r === maxR && c === maxC);
                let val = ddt[r][c];

                let cellClass = '';
                if (isMaxCell) {
                    // En kritik hücreyi pırıl pırıl yapıyoruz
                    cellClass = 'bg-indigo-500 text-white font-black text-[12px] shadow-md relative z-10 border border-indigo-400 rounded-md';
                } else if (r === maxR || c === maxC) {
                    cellClass = 'bg-indigo-900/20 text-indigo-200 font-bold';
                } else {
                    // 0'ları soluk, değerleri biraz daha parlak yap (okunabilirliği artırır)
                    cellClass = val > 0 ? 'text-sky-300/80 font-medium' : 'text-slate-600/30';
                }
                html += `<td class="p-2 ${cellClass}">${val}</td>`;
            }
            html += `</tr>`;
        }
        return html + `</tbody></table></div>`;
    }
    addStep(id, title, desc, content) {
        const displayClass = id === 0 ? "block" : "hidden";
        const html = `
        <div id="step-${id}" class="step-card bg-slate-800/80 p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-700 border-l-8 border-l-purple-600 ${displayClass} transition-opacity duration-300">
            <h2 class="text-lg font-black text-slate-100 mb-2 tracking-tight">${title}</h2>
            <p class="text-slate-300 text-sm mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700 leading-relaxed font-medium shadow-sm">
                ${desc}
            </p>
            <div>${content}</div>
        </div>`;
        this.container.insertAdjacentHTML('beforeend', html);
    }

    showStep(n) {
        document.querySelectorAll('.step-card').forEach(c => {
            c.classList.add('hidden');
            c.classList.remove('block');
        });
        const target = document.getElementById(`step-${n}`);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('block');
        }
        this.stepInfo.innerText = `Adım ${n} / ${this.totalSteps}`;
        this.prevBtn.disabled = (n === 0);
        this.nextBtn.disabled = (n === this.totalSteps);
        this.currentStep = n;

        if (window.innerWidth < 1024) {
            window.scrollTo({ top: this.navControls.offsetTop - 20, behavior: 'smooth' });
        }
    }

    changeStep(dir) {
        let next = this.currentStep + dir;
        if (next >= 0 && next <= this.totalSteps) this.showStep(next);
    }

    renderAllSteps(data) {
        this.container.innerHTML = "";

        let v0_html = data.validS0.map(v => `<span class="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-widest shadow-sm">${v}</span>`).join('');
        let v1_html = data.validS1.map(v => `<span class="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded font-mono text-[11px] font-bold tracking-widest shadow-sm">${v}</span>`).join('');

        // ADIM 0
        this.addStep(0, "Adım 0: S-Kutusu (S-Box) Temelleri",
            "Analiz öncesi, algoritmanın kalbi olan S0 ve S1 kutularının matris yapılarını ve adresleme mantığını hatırlayalım.",
            `<div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${this.renderStaticSBox(data.s0, "Orijinal S0 Kutusu")}
                    ${this.renderStaticSBox(data.s1, "Orijinal S1 Kutusu")}
                </div>
                <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-700">
                    <div class="text-xs font-bold uppercase tracking-widest mb-4 text-indigo-400 text-center">S-Kutusu Adresleme: [b₁ b₂ b₃ b₄]</div>
                    <div class="grid grid-cols-4 gap-2 text-center font-mono mb-6 max-w-sm mx-auto">
                        <div class="p-2 rounded bg-red-900/30 text-red-400 border border-red-800/50 font-black">b₁</div>
                        <div class="p-2 rounded bg-indigo-900/30 text-indigo-400 border border-indigo-800/50 font-black">b₂</div>
                        <div class="p-2 rounded bg-indigo-900/30 text-indigo-400 border border-indigo-800/50 font-black">b₃</div>
                        <div class="p-2 rounded bg-red-900/30 text-red-400 border border-red-800/50 font-black">b₄</div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div class="p-3 bg-red-950/30 rounded-xl border border-red-900/50">
                            <div class="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Satır (Row)</div>
                            <div class="font-black text-red-400 text-lg font-mono tracking-widest">b₁b₄</div>
                        </div>
                        <div class="p-3 bg-indigo-950/30 rounded-xl border border-indigo-900/50">
                            <div class="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Sütun (Column)</div>
                            <div class="font-black text-indigo-400 text-lg font-mono tracking-widest">b₂b₃</div>
                        </div>
                    </div>
                </div>
            </div>`);

        // ADIM 1
        this.addStep(1, "Adım 1: Diferansiyel Dağılım Tabloları (DDT)",
            "S-Kutularındaki giriş farklarının (ΔX) hangi çıkış farklarına (ΔY) yol açma olasılıkları hesaplandı.",
            `<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                ${this.renderDDT(data.ddt_s0, "S0 DDT Matrisi")}
                ${this.renderDDT(data.ddt_s1, "S1 DDT Matrisi")}
             </div>
             <div class="bg-indigo-950/30 border border-indigo-800/30 p-4 rounded-xl text-center text-sm font-bold text-slate-300">
                S0 Tablosu İçin Belirlenen Kritik Giriş Farkı: <span class="text-indigo-400 font-black tracking-widest font-mono text-base ml-2">ΔX = ${data.dx}</span>
             </div>
             
             <div class="bg-slate-800 p-5 rounded-2xl border border-slate-700 mt-6 shadow-sm">
                 <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     Neden Bu Kritik Giriş Farkı (ΔX) Seçildi?
                 </h4>
                 <div class="bg-slate-700 p-4 rounded-xl border border-slate-600 shadow-sm flex flex-col">
                     <p class="text-[11px] text-slate-300/90 leading-relaxed font-medium">
                         Diferansiyel analizde temel amaç, girişlerdeki bir değişimin (ΔX) çıkışlara (ΔY) <b>en öngörülebilir</b> şekilde yansıdığı durumu bulmaktır. Tablolardaki (0000 ➔ 00 hariç) <b>en yüksek değer</b>, o giriş farkının belirli bir çıkış farkına dönüşme olasılığının en yüksek olduğunu gösterir. <br><br>
                         S0 tablosunda en büyük sayının (frekansın) bulunduğu satır, bize analizi üzerinden yürüteceğimiz en güçlü kırılma noktasını verir. Bu yüzden bu satırı <span class="text-indigo-300 font-bold">Kritik Giriş Farkı (ΔX)</span> olarak kabul edip sonraki tüm tersine işlemleri bunun üzerine kurarız.
                     </p>
                 </div>
             </div>`);

        // ADIM 2
        this.addStep(2, "Adım 2: Tersine İşlem ile P2 Üretimi",
            "EP⁻¹ ve IP⁻¹ permütasyonları kullanılarak S-Kutusu girişindeki fark, Açık Metin farkına (ΔP) dönüştürüldü.",
            `<div class="space-y-4">
                <div class="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-700 font-mono">
                    <div class="text-sm text-slate-300 p-2 border-b border-slate-700/50">1) ΔX = <span class="text-red-500 font-black tracking-widest">${data.dx}</span></div>
                    <div class="text-sm text-slate-300 p-2 border-b border-slate-700/50">2) ΔR₁ = EP⁻¹(ΔX) = <span class="text-indigo-400 font-black tracking-widest">${data.delta_r1}</span></div>
                    <div class="text-sm text-slate-300 p-2 border-b border-slate-700/50">3) ΔP = IP⁻¹(ΔR₁ + "0000") = <span class="text-indigo-400 font-black tracking-widest">${data.delta_p}</span></div>
                    <div class="text-center p-4 bg-indigo-900/40 border border-indigo-500/50 rounded-xl mt-4">
                        <span class="text-indigo-200 text-xs uppercase font-bold tracking-widest block mb-2">Üretilen Yeni Açık Metin</span>
                        <span class="text-xl">P₂ = P₁ ⊕ ΔP = <span class="text-yellow-400 font-black tracking-widest">${data.p2}</span></span>
                    </div>
                </div>
                
                <div class="bg-slate-900/40 p-5 rounded-2xl border border-slate-700 mt-4 shadow-sm">
                    <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">Terimler ve Permütasyonlar</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-[11px]">
                        <div class="flex items-center gap-3"><span class="font-mono font-bold text-red-400 bg-red-950/50 border border-red-900/50 px-2 py-1 rounded min-w-[36px] text-center">ΔX</span> <span class="text-slate-400 font-medium">S-Kutusu kritik giriş farkı (<span class="font-black text-slate-200">${data.dx}</span>)</span></div>
                        <div class="flex items-center gap-3"><span class="font-mono font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-1 rounded min-w-[36px] text-center">P₁</span> <span class="text-slate-400 font-medium">Bilinen 1. Açık Metin (<span class="font-black text-slate-200">${data.pt1}</span>)</span></div>
                        <div class="flex items-center gap-3"><span class="font-mono font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-1 rounded min-w-[36px] text-center">ΔR₁</span> <span class="text-slate-400 font-medium">ΔX'in ters EP işleminden geçmiş hali</span></div>
                        <div class="flex items-center gap-3"><span class="font-mono font-bold text-yellow-400 bg-yellow-950/50 border border-yellow-900/50 px-2 py-1 rounded min-w-[36px] text-center">P₂</span> <span class="text-slate-400 font-medium">Üretilen 2. Açık Metin (<span class="font-black text-slate-200">${data.p2}</span>)</span></div>
                        <div class="flex items-center gap-3"><span class="font-mono font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-1 rounded min-w-[36px] text-center">EP⁻¹</span> <span class="text-slate-400 font-medium">Ters Genişletme: <span class="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">[2, 3, 4, 1]</span></span></div>
                        <div class="flex items-center gap-3"><span class="font-mono font-bold text-indigo-400 bg-indigo-950/50 border border-indigo-900/50 px-2 py-1 rounded min-w-[36px] text-center">IP⁻¹</span> <span class="text-slate-400 font-medium">Ters Başlangıç: <span class="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">[4, 1, 3, 5, 7, 2, 8, 6]</span></span></div>
                    </div>
                </div>
            </div>`);

        // ADIM 3
        this.addStep(3, "Adım 3: Şifreli Metin Analizi ve IP Blok Farkları",
            "Şifreli metinler IP'den geçirildi ve 2. turun sol/sağ blokları arasındaki farklar hesaplandı.",
            `<div class="space-y-6">
                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-700 text-center space-y-4 shadow-lg">
                        <div class="bg-slate-800 p-3 rounded-xl border border-slate-600">
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">C1</div>
                            <div class="text-xl font-mono font-bold text-slate-200 tracking-widest">${data.c1}</div>
                        </div>
                        <div class="bg-indigo-900/20 p-3 rounded-xl border border-indigo-500/30">
                            <div class="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">IP(C1)</div>
                            <div class="text-base font-mono text-indigo-200 tracking-widest">${data.ip_c1}</div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-600">
                                <div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">L2₁</div>
                                <div class="text-sm font-mono text-sky-300 tracking-widest">${data.l2_1}</div>
                            </div>
                            <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-600">
                                <div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">R2₁</div>
                                <div class="text-sm font-mono text-sky-300 tracking-widest">${data.r2_1}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-slate-900/60 p-5 rounded-2xl border border-slate-700 text-center space-y-4 shadow-lg">
                        <div class="bg-slate-800 p-3 rounded-xl border border-slate-600">
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">C2</div>
                            <div class="text-xl font-mono font-bold text-slate-200 tracking-widest">${data.c2}</div>
                        </div>
                        <div class="bg-indigo-900/20 p-3 rounded-xl border border-indigo-500/30">
                            <div class="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">IP(C2)</div>
                            <div class="text-base font-mono text-indigo-200 tracking-widest">${data.ip_c2}</div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-600">
                                <div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">L2₂</div>
                                <div class="text-sm font-mono text-sky-300 tracking-widest">${data.l2_2}</div>
                            </div>
                            <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-600">
                                <div class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">R2₂</div>
                                <div class="text-sm font-mono text-sky-300 tracking-widest">${data.r2_2}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-purple-900/30 p-6 rounded-2xl border border-purple-500/50 flex justify-around text-center mt-2 shadow-inner">
                    <div>
                        <div class="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-2">ΔL2 (L2₁ ⊕ L2₂)</div>
                        <div class="text-3xl font-mono font-black text-yellow-400 tracking-widest drop-shadow-md">${data.dl2}</div>
                    </div>
                    <div class="border-l border-purple-500/30 h-12 self-center"></div>
                    <div>
                        <div class="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-2">ΔR2 (R2₁ ⊕ R2₂)</div>
                        <div class="text-3xl font-mono font-black text-slate-200 tracking-widest">${data.dr2}</div>
                    </div>
                </div>
                
                <div class="bg-slate-900/40 p-5 rounded-2xl border border-slate-700 mt-4 shadow-sm">
                    <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span class="text-lg">ℹ️</span> Neden Şifreli Metinlere IP Uyguluyoruz?
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-sm flex flex-col">
                            <div class="font-mono text-sm font-bold text-indigo-400 mb-2">IP (Başlangıç Permütasyonu)</div>
                            <div class="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center font-mono text-xs font-bold text-slate-300 tracking-widest mb-3">
                                [2, 6, 3, 1, 4, 8, 5, 7]
                            </div>
                            <p class="text-[11px] text-slate-400 leading-relaxed">
                                S-DES algoritmasında şifrelemenin en başında düz metni karıştırmak için kullanılır. Ancak analizde şifreli metinleri (C) bir kez daha <b>IP</b> işleminden geçiririz. Bunun amacı şifreleme yapmak değil, en sonda yapılan <b>IP⁻¹</b> işleminin etkisini birbirini nötrleyerek yok etmektir.
                            </p>
                        </div>
                        <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-sm flex flex-col">
                            <div class="font-mono text-sm font-bold text-red-400 mb-2">IP⁻¹ (Ters Başlangıç Permütasyonu)</div>
                            <div class="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center font-mono text-xs font-bold text-slate-300 tracking-widest mb-3">
                                [4, 1, 3, 5, 7, 2, 8, 6]
                            </div>
                            <p class="text-[11px] text-slate-400 leading-relaxed">
                                Şifrelemenin <b>en son adımıdır</b>. Diferansiyel analizde geriye doğru gittiğimiz için bu son adımı iptal etmeliyiz. Şifreli metinlere uyguladığımız IP, bu IP⁻¹ etkisini siler ve bizim doğrudan 2. turun saf çıkış bloklarına (L2 ve R2) ulaşmamızı sağlar.
                            </p>
                        </div>
                    </div>
                </div>
            </div>`);

        // ADIM 4
        this.addStep(4, "Adım 4: Permütasyon İzolasyonu (EP ve P4⁻¹)",
            "EP ve P4⁻¹ işlemleri geri alınarak S-Kutusu giriş/çıkış saf farkları netleştirildi.",
            `<div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-6 bg-slate-900/60 border border-slate-700 rounded-2xl text-center space-y-4 shadow-lg">
                        <div class="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-600">
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Bağıntı<br><span class="text-xs font-mono text-indigo-400">ΔS_IN = EP(ΔR2)</span></div>
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">İşlem<br><span class="text-xs font-mono text-slate-300">EP(${data.dr2})</span></div>
                        </div>
                        <div class="bg-indigo-900/30 p-6 rounded-2xl border border-indigo-500/30 shadow-inner">
                            <div class="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">İzole ΔS_IN</div>
                            <div class="text-4xl font-mono font-black text-indigo-200 tracking-[0.2em] drop-shadow-lg">${data.ds_in}</div>
                        </div>
                    </div>
                    
                    <div class="p-6 bg-slate-900/60 border border-slate-700 rounded-2xl text-center space-y-4 shadow-lg">
                        <div class="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-600">
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Bağıntı<br><span class="text-xs font-mono text-red-400">ΔS_OUT = P4⁻¹(ΔL2)</span></div>
                            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">İşlem<br><span class="text-xs font-mono text-slate-300">P4⁻¹(${data.dl2})</span></div>
                        </div>
                        <div class="bg-red-900/20 p-6 rounded-2xl border border-red-500/30 shadow-inner">
                            <div class="text-xs font-black text-red-400 uppercase tracking-widest mb-3">İzole ΔS_OUT</div>
                            <div class="text-4xl font-mono font-black text-red-200 tracking-[0.2em] drop-shadow-lg">${data.ds_out}</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-slate-900/40 p-5 rounded-2xl border border-slate-700 mt-4 shadow-sm">
                    <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span class="text-lg">ℹ️</span> Permütasyonların Rolü ve Kullanılan Diziler
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-sm flex flex-col">
                            <div class="font-mono text-sm font-bold text-indigo-400 mb-2">EP (Genişletme Permütasyonu)</div>
                            <div class="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center font-mono text-xs font-bold text-slate-300 tracking-widest mb-3">
                                [4, 1, 2, 3, 2, 3, 4, 1]
                            </div>
                            <p class="text-[11px] text-slate-400 leading-relaxed font-medium">
                                Feistel ağında 4 bitlik sağ bloğu bazı bitleri kopyalayarak 8 bite genişletir. Bu işlem, veriyi 8-bitlik alt anahtar (K) ile XOR işlemine sokabilmek ve ardından iki ayrı S-Kutusuna (S0 ve S1) 4'er bit olarak dağıtabilmek için zorunludur.
                            </p>
                        </div>
                        <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-600 shadow-sm flex flex-col">
                            <div class="font-mono text-sm font-bold text-red-400 mb-2">P4⁻¹ (Ters P4 Permütasyonu)</div>
                            <div class="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center font-mono text-xs font-bold text-slate-300 tracking-widest mb-3">
                                [4, 1, 3, 2]
                            </div>
                            <p class="text-[11px] text-slate-400 leading-relaxed font-medium">
                                S-Kutusundan çıkan veri normalde şifrelemeye devam etmek için P4 <b>[2, 4, 3, 1]</b> permütasyonu ile karıştırılır. Biz şifreli metinden geriye doğru diferansiyel analiz yaptığımız için, S-Kutusunun saf çıkış farkını (ΔS_OUT) bulmak amacıyla P4'ün etkisini geri alan <b>Ters P4</b> işlemini uygularız.
                            </p>
                        </div>
                    </div>
                </div>
            </div>`);

        // ADIM 5
        this.addStep(5, "Adım 5: S-Kutusundan Süzülen K2 Adayları (8-Bit)",
            "İzole edilen farklardan yola çıkarak olası alt anahtarlar hesaplanır ve Feistel doğrulama denkleminden geçirilerek filtrelenir.",
            `<div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-6 bg-slate-900/60 border border-slate-700 rounded-2xl shadow-lg flex flex-col">
                        <div class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4">1. Geçerli Girişlerin (v) Tespiti</div>
                        <p class="text-[11px] text-slate-300 leading-relaxed mb-6 flex-grow">
                            İzole edilen <span class="font-bold text-indigo-400">ΔS_IN</span> ve <span class="font-bold text-red-400">ΔS_OUT</span> farklarını S-Kutularında aynı anda sağlayabilen gerçek giriş değerleri bulunur.
                        </p>
                        <div class="bg-slate-800 p-4 rounded-xl border border-slate-600 space-y-4">
                            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-700 pb-3 gap-3">
                                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">S0 Olası Girişleri (v₀):</span>
                                <div class="flex flex-wrap gap-1.5 sm:justify-end">${v0_html || '<span class="text-red-400 font-bold text-xs">Bulunamadı</span>'}</div>
                            </div>
                            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-1 gap-3">
                                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">S1 Olası Girişleri (v₁):</span>
                                <div class="flex flex-wrap gap-1.5 sm:justify-end">${v1_html || '<span class="text-red-400 font-bold text-xs">Bulunamadı</span>'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6 bg-slate-900/60 border border-slate-700 rounded-2xl shadow-lg flex flex-col">
                        <div class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4">2. K2 Denklemi ve Hesaplanması</div>
                        <p class="text-[11px] text-slate-300 leading-relaxed mb-6 flex-grow">
                            Feistel ağında S-Kutusuna giren veri, sağ bloğun genişletilmiş hali ile alt anahtarın XOR'lanmasıdır. Bu denklem tersine çevrildiğinde olası K2'ler üretilir.
                        </p>
                        <div class="bg-indigo-900/30 p-6 rounded-xl border border-indigo-500/40 text-center shadow-inner">
                            <div class="font-mono text-xl font-black text-indigo-300 tracking-[0.1em] mb-2">K2 = v ⊕ EP(R2₁)</div>
                            <div class="font-mono text-[11px] text-indigo-400 font-bold uppercase">EP(${data.r2_1}) = <span class="text-indigo-200">${data.ep_r2_1}</span></div>
                        </div>
                    </div>
                </div>

                <div class="bg-slate-900/40 p-6 rounded-2xl border border-slate-700 shadow-sm mt-4">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">Üretilen Tüm K2 Adayları (Filtrelenmemiş)</div>
                    <p class="text-[10px] text-slate-500 text-center mb-5 italic">v₀ ve v₁'in tüm kombinasyonlarının EP(R2₁) ile XOR'lanması sonucu elde edilen ham 8-bit adaylar.</p>
                    <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 font-mono max-h-48 overflow-y-auto custom-scrollbar p-1">
                        ${data.possibleK2s && data.possibleK2s.length > 0
                ? data.possibleK2s.map(k => `<div class="p-2.5 bg-slate-800 rounded-xl text-center font-bold text-xs border border-slate-600 text-slate-300 shadow-sm">${k}</div>`).join('')
                : '<div class="col-span-full text-center text-red-400 font-bold text-sm">Aday bulunamadı</div>'
            }
                    </div>
                </div>

                <div class="p-6 bg-slate-900/60 border border-slate-700 rounded-2xl shadow-lg mt-4">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4 text-center">3. K2 Adaylarının Doğrulanması (Filtreleme)</div>
                    <p class="text-xs text-slate-300 leading-relaxed mb-6 text-center max-w-2xl mx-auto">
                        Bulunan olası K2 değerleri, Feistel ağındaki şifreleme/deşifreleme ilişkisini sağlamak zorundadır. Sadece aşağıdaki eşitliği sağlayanlar geçerli kabul edilir:
                    </p>
                    
                    <div class="bg-slate-800 p-6 rounded-2xl border border-slate-600 text-center flex flex-col md:flex-row justify-center items-center gap-6 shadow-inner mb-6">
                        <div class="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30 w-full md:w-auto min-w-[200px]">
                            <div class="font-mono text-[10px] font-black text-indigo-400 mb-2 tracking-widest">HESAPLANAN Fk ÇIKIŞI</div>
                            <div class="font-mono text-lg text-indigo-200 font-bold">Fk(R2₁, K2)</div>
                        </div>
                        <div class="text-3xl font-black text-slate-500 font-mono">==</div>
                        <div class="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30 w-full md:w-auto min-w-[200px]">
                            <div class="font-mono text-[10px] font-black text-indigo-400 mb-2 tracking-widest">BEKLENEN Fk ÇIKIŞI</div>
                            <div class="font-mono text-lg text-indigo-200 font-bold mb-1">L2₁ ⊕ R0₁</div>
                            <div class="font-mono text-[11px] text-indigo-300">${data.l2_1} ⊕ ${data.r0_1} = <span class="font-black text-yellow-400 text-sm ml-1">${data.expected_fk}</span></div>
                        </div>
                    </div>

                    <div class="bg-green-950/20 p-6 rounded-2xl border border-green-800/40 shadow-inner">
                        <div class="text-xs font-black text-green-400 uppercase tracking-widest text-center mb-5">Olası K2 Adayları (Doğrulanmış)</div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                            ${data.k2Candidates.map(k => `<div class="p-3.5 bg-green-900/40 rounded-xl text-center font-black text-sm border border-green-500/50 text-green-300 shadow-md">${k}</div>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="bg-amber-950/30 p-6 rounded-2xl border border-amber-800/50 flex gap-5 mt-6 items-start shadow-sm">
                    <div class="text-amber-500 text-3xl mt-1 drop-shadow-md">💡</div>
                    <div>
                        <h5 class="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">Neden Denklemde R₁ yerine R2₁ kullanıyoruz?</h5>
                        <p class="text-[11px] text-slate-300 leading-relaxed font-medium">
                            Feistel ağının yapısı gereği 1. turun çıktısı olan <span class="font-bold text-amber-200">R₁</span> bloğu, 2. turun girişindeki sağ bloğa eşittir. Algoritmanın en sonundaki "Swap" işleminden dolayı, şifreli metni (<span class="font-bold text-amber-200">C₁</span>) tersine çevirip IP işleminden geçirdiğimizde elde ettiğimiz sağ blok (<span class="font-bold text-amber-200">R2₁</span>), aslında doğrudan 1. turun çıktısı olan <span class="font-bold text-amber-200">R₁</span>'dir.
                        </p>
                    </div>
                </div>
            </div>`);

        // ADIM 6
        this.addStep(6, "Adım 6: 10-Bit Master Key'in Geri Çıkarsanması",
            "8-bitlik K2 adaylarından yola çıkılarak kayıp 2 bit tahmin edilir ve ters anahtar programlaması ile 10-bitlik ana anahtarlar üretilir.",
            `<div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-6 bg-slate-900/60 border border-slate-700 rounded-2xl shadow-lg flex flex-col">
                        <div class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4">1. Kayıp 2 Bitin Tahmini</div>
                        <p class="text-[11px] text-slate-300 leading-relaxed mb-6 flex-grow">
                            S-DES'te 10-bitlik anahtardan K2 üretilirken <b>P8 permütasyonu</b> nedeniyle 2 bit kaybolur. Doğrulanan her 8-bitlik K2 adayı için, kaybolan bu 2 bitin tüm olası kombinasyonları (<span class="font-bold text-purple-400 font-mono">00, 01, 10, 11</span>) test edilmek üzere K2'ye eklenir.
                        </p>
                        <div class="bg-slate-800 p-5 rounded-xl border border-slate-600 text-center shadow-inner">
                            <div class="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Geçici 10-Bit Veri Oluşumu</div>
                            <div class="font-mono text-base font-black text-purple-400 tracking-[0.1em]">K2 (8-bit) + XX (2-bit)</div>
                        </div>
                    </div>
                    
                    <div class="p-6 bg-slate-900/60 border border-slate-700 rounded-2xl shadow-lg flex flex-col">
                        <div class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-4">2. Ters Anahtar Programlaması</div>
                        <p class="text-[11px] text-slate-300 leading-relaxed mb-6 flex-grow">
                            Oluşturulan 10-bitlik geçici veriler, K2 üretim adımlarının <b>tam tersi</b> yönünde işlemden geçirilir. Bu işlem statik bir ters permütasyon tablosu ile tek adımda gerçekleştirilerek olası <span class="font-bold text-purple-400">Master Key</span> elde edilir.
                        </p>
                        <div class="bg-purple-900/20 p-5 rounded-xl border border-purple-500/30 text-center shadow-inner">
                            <div class="font-mono text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Birleşik Ters Permütasyon Tablosu</div>
                            <div class="font-mono text-sm font-black text-purple-200 tracking-widest">[8, 6, 2, 9, 4, 3, 10, 1, 7, 5]</div>
                        </div>
                    </div>
                </div>

                <div class="bg-slate-900/40 p-6 rounded-2xl border border-slate-700 shadow-sm mt-4">
                    <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mb-2">Üretilen Tüm Master Key Adayları (Filtrelenmemiş)</div>
                    <p class="text-[10px] text-slate-500 text-center mb-5 italic">K2'ye eklenen 2 bitin ters permütasyondan geçirilmesiyle elde edilen tüm 10-bitlik olasılıklar.</p>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono max-h-48 overflow-y-auto custom-scrollbar p-1">
                        ${data.candidateMasterKeys.map(k => `<div class="p-2.5 bg-slate-800 rounded-xl text-center font-bold text-xs border border-slate-600 text-slate-300 shadow-sm">${k}</div>`).join('')}
                    </div>
                </div>

                <div class="p-6 bg-slate-900/60 border border-slate-700 rounded-2xl shadow-lg mt-4">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-3 mb-5 text-center">3. Master Key Adaylarının Doğrulanması (Filtreleme)</div>
                    <p class="text-[11px] text-slate-300 leading-relaxed mb-6 text-center max-w-2xl mx-auto">
                        Üretilen 10-bitlik ham adayların gerçek anahtar olup olmadığını anlamak için, bilinen Açık Metin (P) ve Şifreli Metin (C) çiftleriyle şifreleme testi yapılır. Sadece aşağıdaki her iki testi de geçen adaylar kesinleşir.
                    </p>
                    
                    <div class="bg-slate-800 p-6 rounded-2xl border border-slate-600 text-center flex flex-col md:flex-row justify-center items-center gap-6 shadow-inner mb-8">
                        <div class="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30 w-full md:w-auto min-w-[220px]">
                            <div class="font-mono text-[10px] font-black text-indigo-400 mb-2 tracking-widest">TEST 1 (P₁ ve C₁)</div>
                            <div class="font-mono text-sm text-indigo-200 font-bold">Encrypt(P₁, Aday) == C₁</div>
                        </div>
                        <div class="text-2xl font-black text-slate-500 font-mono">&&</div>
                        <div class="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30 w-full md:w-auto min-w-[220px]">
                            <div class="font-mono text-[10px] font-black text-indigo-400 mb-2 tracking-widest">TEST 2 (P₂ ve C₂)</div>
                            <div class="font-mono text-sm text-indigo-200 font-bold">Encrypt(P₂, Aday) == C₂</div>
                        </div>
                    </div>

                    <div class="bg-green-950/20 p-6 rounded-2xl border border-green-800/40 shadow-inner">
                        <div class="text-[11px] font-black text-green-400 uppercase tracking-widest text-center mb-5">Olası Master Key Adayları (Filtrelenmiş)</div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                            ${data.masterCandidates.map(k => `<div class="p-4 rounded-xl text-center font-black text-sm border-2 transition-all ${k === data.tkey ? 'border-green-500 bg-green-900/40 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-105 z-10' : 'border-slate-600 bg-slate-800 text-slate-300 shadow-sm'}">${k}</div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>`);

        // ADIM 7
        this.addStep(7, "Adım 7: Kesin Master Key Doğrulaması 🏆",
            "Bilinen plaintext çiftini sağlayan tek gerçek anahtar izole edildi ve analiz başarıyla tamamlandı.",
            `<div class="bg-gradient-to-br from-green-600 to-green-800 p-10 md:p-14 rounded-[2.5rem] text-white text-center shadow-[0_0_30px_rgba(34,197,94,0.4)] relative overflow-hidden border border-green-400/50 mt-4">
                <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
                <div class="relative z-10">
                    <div class="text-6xl mb-4 drop-shadow-md">🎯</div>
                    <div class="text-[11px] font-bold text-green-200 mb-2 uppercase tracking-[0.3em]">Doğrulanmış Hedef Anahtar</div>
                    <div class="text-4xl md:text-6xl font-black tracking-widest font-mono drop-shadow-lg text-white">${data.tkey}</div>
                </div>
            </div>`);

        this.navControls.classList.remove('hidden');
        this.showStep(0);
    }
}