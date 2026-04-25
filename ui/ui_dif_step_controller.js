/**
 * DiffStepController Sınıfı (Controller)
 * Orijinal src/diff_analysis.js sınıfını kullanarak DOM'u yönetir.
 */
class DiffStepController {
    constructor(uiManager) {
        this.ui = uiManager;

        // SENİN ORİJİNAL KAYNAK DOSYALARIN
        this.analyzer = new diff_analysis();
        this.sdes = new sdescore();

        // Element Bağlantıları
        this.calcBtn = document.getElementById('calcBtn');
        this.pt1Input = document.getElementById('pt1');
        this.tkeyInput = document.getElementById('tkey');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
    }

    init() {
        this.calcBtn.addEventListener('click', () => this.handleCalculate());
        this.prevBtn.addEventListener('click', () => this.ui.changeStep(-1));
        this.nextBtn.addEventListener('click', () => this.ui.changeStep(1));
    }

    handleCalculate() {
        const pt1 = this.pt1Input.value.trim();
        const tkey = this.tkeyInput.value.trim();

        if (!/^[01]{8}$/.test(pt1) || !/^[01]{10}$/.test(tkey)) {
            alert("Hata: Girdileri kontrol edin. P1 8-bit, Key 10-bit binary olmalıdır.");
            return;
        }

        // Diğer panelleri gizle, eğitim panelini aç
        document.getElementById('sim-panel')?.classList.add('hidden');
        document.getElementById('test-results-panel')?.classList.add('hidden');
        const dPanel = document.getElementById('diff-step-panel');
        if (dPanel) {
            dPanel.classList.remove('hidden');
            dPanel.classList.add('flex');
            if (window.innerWidth < 1024) dPanel.scrollIntoView({ behavior: 'smooth' });
        }

        // Orijinal sınıfı bozmadan ara değerleri bu metodun içinde topluyoruz
        const stepData = this.getDetailedStepData(pt1, tkey);
        this.ui.renderAllSteps(stepData);
    }

    /**
     * Orijinal diff_analysis.js dosyasına dokunmamak için, 
     * UI'ın ihtiyaç duyduğu ara hesaplama verilerini Controller içinde türetiyoruz.
     */
    getDetailedStepData(pt1, tkey) {

        this.analyzer.generateDdt();

        let dx = this.analyzer.Find_DeltaX(this.analyzer.Ddt_S0);
        let ep_inv = [2, 3, 4, 1];
        let delta_r1 = SdesUtils.Permutate(dx, ep_inv);
        let delta_p = SdesUtils.Permutate(delta_r1 + "0000", this.sdes.IP_INV);
        let p2 = SdesUtils.XOR(pt1, delta_p);

        let c1 = this.sdes.Encrypt(pt1, tkey);
        let c2 = this.sdes.Encrypt(p2, tkey);

        let ip_c1 = SdesUtils.Permutate(c1, this.sdes.IP);
        let ip_c2 = SdesUtils.Permutate(c2, this.sdes.IP);

        let l2_1 = ip_c1.substring(0, 4), r2_1 = ip_c1.substring(4);
        let l2_2 = ip_c2.substring(0, 4), r2_2 = ip_c2.substring(4);

        let dl2 = SdesUtils.XOR(l2_1, l2_2);
        let dr2 = SdesUtils.XOR(r2_1, r2_2);

        let ds_in = SdesUtils.Permutate(dr2, this.sdes.EP);
        let ds_out = SdesUtils.Permutate(dl2, [4, 1, 3, 2]);

        let ip_p1 = SdesUtils.Permutate(pt1, this.sdes.IP);
        let r0_1 = ip_p1.substring(4);
        let expected_fk = SdesUtils.XOR(l2_1, r0_1);

        let DeltaS_In_S0 = ds_in.substring(0, 4);
        let DeltaS_In_S1 = ds_in.substring(4);
        let DeltaS_Out_S0 = ds_out.substring(0, 2);
        let DeltaS_Out_S1 = ds_out.substring(2);

        let validS0 = this.analyzer.ValidSBoxInputs(this.analyzer.s0, DeltaS_In_S0, DeltaS_Out_S0);
        let validS1 = this.analyzer.ValidSBoxInputs(this.analyzer.s1, DeltaS_In_S1, DeltaS_Out_S1);
        let ep_r2_1 = SdesUtils.Permutate(r2_1, this.sdes.EP);

        // Arayüz için filtrelenmemiş ham K2 adaylarını türetiyoruz
        let possibleK2s = [];
        for (let v0 of validS0) {
            for (let v1 of validS1) {
                let k2_left = SdesUtils.XOR(v0, ep_r2_1.substring(0, 4));
                let k2_right = SdesUtils.XOR(v1, ep_r2_1.substring(4));
                possibleK2s.push(k2_left + k2_right);
            }
        }

        // Orijinal analizi çalıştırıp kesinleşen adayları al
        const result = this.analyzer.diff_analysis_start(pt1, tkey);

        // Arayüz için filtrelenmemiş ham 10-bit Master Key adaylarını türetiyoruz
        let candidateMasterKeys = [];
        let rev_P8_after_ls3 = [8, 6, 2, 9, 4, 3, 10, 1, 7, 5];
        for (let k2 of result.verifiedK2) {
            for (let bit4 of ['0', '1']) {
                for (let bit7 of ['0', '1']) {
                    let temp10Bit = k2 + bit4 + bit7;
                    let testKey = SdesUtils.Permutate(temp10Bit, rev_P8_after_ls3);
                    candidateMasterKeys.push(testKey);
                }
            }
        }

        return {
            pt1, tkey, dx,
            delta_r1, delta_p, p2,
            c1, c2, ip_c1, ip_c2,
            l2_1, r2_1, l2_2, r2_2,
            dl2, dr2, ds_in, ds_out,
            r0_1, expected_fk, ep_r2_1,
            validS0, validS1,
            possibleK2s: possibleK2s,
            k2Candidates: result.verifiedK2 || [],
            candidateMasterKeys: candidateMasterKeys,
            masterCandidates: result.foundMasterKeys || [],
            ddt_s0: this.analyzer.Ddt_S0,
            ddt_s1: this.analyzer.Ddt_S1,
            s0: this.analyzer.s0,
            s1: this.analyzer.s1
        };
    }
}