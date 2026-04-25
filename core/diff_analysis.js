/**
 * Bu sınıf, S-DES şifrelemesinin diferansiyel analizini gerçekleştirmek için tasarlanmıştır.
 * Diferansiyel analiz, şifreleme algoritmalarının zayıf noktalarını bulmak için kullanılan bir kriptanaliz tekniğidir.
 * Bu sınıf, S-DES'in S-kutularının diferansiyel dağılım tablolarını (DDT) oluşturur ve bu tabloları kullanarak belirli bir düz metin ve anahtar kombinasyonu için olası anahtarları tahmin eder.
 * Analiz süreci, belirli giriş farkları (DeltaX) ve çıkış farkları (DeltaY) üzerinden çalışır ve bu farkların S-kutularında nasıl dağıldığını inceleyerek anahtar tahminleri yapar.
 * Sonuç olarak, diferansiyel analiz yoluyla bulunan olası anahtarlar, şifreleme algoritmasının güvenliğini değerlendirmek için kullanılabilir.
 */
class diff_analysis {
    constructor() {
        this.sdes = new sdescore();
        this.Ddt_S0 = [[]];
        this.Ddt_S1 = [[]];
        this.s0 = this.sdes.S0;
        this.s1 = this.sdes.S1;
    }

    /**
     * S-DES algoritmasının S-kutuları için diferansiyel dağılım tablolarını (DDT) oluşturur.
     * DDT, her olası giriş farkı (DeltaX) için, her olası çıkış farkının (DeltaY) kaç kez ortaya çıktığını gösteren bir tablodur.
     * Bu tablo, diferansiyel analiz sırasında hangi giriş farklarının hangi çıkış farklarına daha sık yol açtığını belirlemek için kullanılır.
     */
    generateDdt() {
        this.Ddt_S0 = Array.from({ length: 16 }, () => Array(4).fill(0));
        this.Ddt_S1 = Array.from({ length: 16 }, () => Array(4).fill(0));


        for (let i = 0; i < 16; i++) {
            for (let j = 0; j < 16; j++) {
                let input_0 = i.toString(2).padStart(4, '0');
                let input_1 = j.toString(2).padStart(4, '0');

                let deltaX = SdesUtils.XOR(input_0, input_1);
                let row = parseInt(deltaX, 2);

                let output_0_s0 = this.SboxLookUp(input_0, this.s0).toString(2).padStart(2, '0');
                let output_1_s0 = this.SboxLookUp(input_1, this.s0).toString(2).padStart(2, '0');
                let deltaY_s0 = SdesUtils.XOR(output_0_s0, output_1_s0);
                let col_s0 = parseInt(deltaY_s0, 2);

                let output_0_s1 = this.SboxLookUp(input_0, this.s1).toString(2).padStart(2, '0');
                let output_1_s1 = this.SboxLookUp(input_1, this.s1).toString(2).padStart(2, '0');
                let deltaY_s1 = SdesUtils.XOR(output_0_s1, output_1_s1);
                let col_s1 = parseInt(deltaY_s1, 2);

                this.Ddt_S0[row][col_s0] += 1;

                this.Ddt_S1[row][col_s1] += 1;
            }
        }
    }

    /**
     * S-kutusunda belirtilen giriş farkı için çıkış değerini döndürür.
     * @param {string} DeltaX 4 bitlik giriş farkı (DeltaX) ikilik (binary) formatında.
     * @param {Array<Array<number>>} sbox 4*4 boyutunda S-kutusu matrisi.
     * @returns {number} Çıkış değeri (DeltaY)
     */
    SboxLookUp(DeltaX, sbox) {
        let row = parseInt(`${DeltaX[0]}${DeltaX[3]}`, 2);
        let col = parseInt(`${DeltaX[1]}${DeltaX[2]}`, 2);
        return sbox[row][col];
    }

    /**
     * Diferansiyel dağılım tablosundan en yüksek değeri taşıyan giriş farkını bulur.
     * 0 giriş farkı, diferansiyel analiz için anlamlı olmadığı için göz ardı edilir ve 1'den başlayarak arama yapılır.
     * @param {Array<Array<number>>} Ddt 16*4 boyutunda diferansiyel dağılım tablosu.
     * @returns {string} En yüksek değere sahip giriş farkı (DeltaX) ikilik (binary) formatında.
     */
    Find_DeltaX(Ddt) {
        let maxValue = -Infinity;
        let maxRowIndex = -1;
        // i = 0 düzeltildi 
        for (let i = 1; i < 16; i++) {
            for (let j = 0; j < 4; j++) {
                if (Ddt[i][j] > maxValue) {
                    maxValue = Ddt[i][j];
                    maxRowIndex = i;
                }
            }
        }
        return maxRowIndex.toString(2).padStart(4, '0');
    }

    /**
     * Belirtilen giriş farkı ve düz metin ile yeni bir düz metin oluşturur.
     * @param {string} deltaX 4 bitlik giriş farkı (DeltaX) ikilik (binary) formatında.
     * @param {string} plainText1 8 bitlik düz metin ikilik (binary) formatında.
     * @returns {string} Oluşturulan yeni düz metin (ikilik format)
     */
    Generate_PlainText(deltaX, plainText1) {
        let EP_INV = [2, 3, 4, 1];
        let Delta_R1 = SdesUtils.Permutate(deltaX, EP_INV);
        let DeltaIP_P = Delta_R1 + "0000";
        let Delta_P = SdesUtils.Permutate(DeltaIP_P, this.sdes.IP_INV);
        return SdesUtils.XOR(plainText1, Delta_P);
    }
    /**
     * Belirtilen düz metinler ile S-Kutularına giriş farkını hesaplar.
     * @param {string} plainText1 8 bitlik düz metin ikilik (binary) formatında.
     * @param {string} plainText2 8 bitlik düz metin ikilik (binary) formatında.
     * @returns {string}  Giriş farkı (DeltaL0) ikilik (binary) formatında.  
     */
    Find_S_in(plainText1, plainText2) {
        let IP_P1 = SdesUtils.Permutate(plainText1, this.sdes.IP);
        let IP_P2 = SdesUtils.Permutate(plainText2, this.sdes.IP);
        let Delta_l0 = SdesUtils.XOR(IP_P1.substring(0, 4), IP_P2.substring(0, 4));
        return SdesUtils.Permutate(Delta_l0, this.sdes.EP);
    }

    /**
     * Belirtilen düz metinleri, hedef anahtar ile şifreleyerek S-kutularına çıkış farkını hesaplar. 
     * @param {string} plainText1 8 bitlik düz metin ikilik (binary) formatında.
     * @param {string} plainText2 8 bitlik düz metin ikilik (binary) formatında.
     * @param {string} targetKey 10 bitlik anahtar ikilik (binary) formatında.
     * @returns {string} S-kutusu çıkış farkı P4_INV(DeltaL2) ikilik (binary) formatında.
     */
    Find_S_out(plainText1, plainText2, targetKey) {
        let P4_INV = [4, 1, 3, 2]; // HATA DÜZELTİLDİ
        let cipherText1 = this.sdes.Encrypt(plainText1, targetKey);
        let cipherText2 = this.sdes.Encrypt(plainText2, targetKey);

        let cipherText1_IP = SdesUtils.Permutate(cipherText1, this.sdes.IP);
        let cipherText2_IP = SdesUtils.Permutate(cipherText2, this.sdes.IP);

        let Delta_l2 = SdesUtils.XOR(cipherText1_IP.substring(0, 4), cipherText2_IP.substring(0, 4));
        return SdesUtils.Permutate(Delta_l2, P4_INV);
    }

    /**
     * Belirtilen S-kutusu, giriş farkı ve çıkış farkı için geçerli girişleri döndürür.
     * Bu fonksiyon, S-kutusu için tüm olası girişleri kontrol eder ve belirtilen giriş farkı ve çıkış farkı ile uyumlu olanları toplar.
     * @param {Array<Array<number>>} sbox
     * @param {string} deltaIn 4 bitlik giriş farkı (DeltaS_In) ikilik (binary) formatında.
     * @param {string} deltaOut 2 bitlik çıkış farkı (DeltaS_Out) ikilik (binary) formatında.
     * @returns {Array<string>} Geçerli S-kutusu girişleri (ikilik formatında) içeren bir dizi.
     */
    ValidSBoxInputs(sbox, deltaIn, deltaOut) {
        let validInputs = [];
        for (let x = 0; x < 16; x++) {
            let x_bin = x.toString(2).padStart(4, '0');
            let x_star_bin = SdesUtils.XOR(x_bin, deltaIn);

            let y_bin = this.SboxLookUp(x_bin, sbox).toString(2).padStart(2, '0');
            let y_star_bin = this.SboxLookUp(x_star_bin, sbox).toString(2).padStart(2, '0');

            let outDiff = SdesUtils.XOR(y_bin, y_star_bin);
            if (outDiff === deltaOut) {
                validInputs.push(x_bin);
            }
        }
        return validInputs;
    }

    /**
     * Differansiyel analizini başlatır.
     * @param {string} plainText1 8 bitlik düz metin ikilik (binary) formatında.
     * @param {string} targetKey 10 bitlik hedef anahtar ikilik (binary) formatında.
     * @returns {Array<string>} Bulunan anahtarları içeren bir dizi (ikilik formatında).
     */
    diff_analysis_start(plainText1, targetKey) {
        this.generateDdt();

        let deltaL0 = this.Find_DeltaX(this.Ddt_S0);
        let deltaR0 = "0000";

        let IP_P1 = SdesUtils.Permutate(plainText1, this.sdes.IP);
        let L0_1 = IP_P1.substring(0, 4);
        let R0_1 = IP_P1.substring(4);

        let plainText2 = this.Generate_PlainText(deltaL0, plainText1);
        let IP_P2 = SdesUtils.Permutate(plainText2, this.sdes.IP);
        let L0_2 = IP_P2.substring(0, 4);
        let R0_2 = R0_1;


        let cipherText1 = this.sdes.Encrypt(plainText1, targetKey);
        let cipherText2 = this.sdes.Encrypt(plainText2, targetKey);

        let IP_C1 = SdesUtils.Permutate(cipherText1, this.sdes.IP);
        let IP_C2 = SdesUtils.Permutate(cipherText2, this.sdes.IP);

        let L2_1 = IP_C1.substring(0, 4);
        let R2_1 = IP_C1.substring(4);
        let L2_2 = IP_C2.substring(0, 4);
        let R2_2 = IP_C2.substring(4);

        let DeltaL2 = SdesUtils.XOR(L2_1, L2_2);
        let DeltaR2 = SdesUtils.XOR(R2_1, R2_2);

        let DeltaR1 = DeltaR2;
        let DeltaL1 = deltaR0;
        let DeltaP4_Out = SdesUtils.XOR(DeltaL2, DeltaL1);

        let P4_INV = [4, 1, 3, 2];
        let DeltaS_Out = SdesUtils.Permutate(DeltaP4_Out, P4_INV);
        let DeltaS_In = SdesUtils.Permutate(DeltaR1, this.sdes.EP);

        let DeltaS_In_S0 = DeltaS_In.substring(0, 4);
        let DeltaS_In_S1 = DeltaS_In.substring(4);
        let DeltaS_Out_S0 = DeltaS_Out.substring(0, 2);
        let DeltaS_Out_S1 = DeltaS_Out.substring(2);

        let validS0 = this.ValidSBoxInputs(this.s0, DeltaS_In_S0, DeltaS_Out_S0);
        let validS1 = this.ValidSBoxInputs(this.s1, DeltaS_In_S1, DeltaS_Out_S1);


        let epR1 = SdesUtils.Permutate(R2_1, this.sdes.EP);
        let epR1_S0 = epR1.substring(0, 4);
        let epR1_S1 = epR1.substring(4);

        let possibleK2s = [];
        for (let v0 of validS0) {
            for (let v1 of validS1) {
                let k2_left = SdesUtils.XOR(v0, epR1_S0);
                let k2_right = SdesUtils.XOR(v1, epR1_S1);
                possibleK2s.push(k2_left + k2_right);
            }
        }


        let expected_Fk_Out = SdesUtils.XOR(L2_1, R0_1);
        let verifiedK2 = [];

        for (let candidate of possibleK2s) {
            let actual_Fk_Out = this.sdes.Fk(R2_1, candidate);
            if (actual_Fk_Out === expected_Fk_Out) {
                verifiedK2.push(candidate);
            }
        }

        let foundMasterKeys = [];
        let rev_P8_after_ls3 = [8, 6, 2, 9, 4, 3, 10, 1, 7, 5];

        for (let k2 of verifiedK2) {
            for (let bit4 of ['0', '1']) {
                for (let bit7 of ['0', '1']) {

                    let temp10Bit = k2 + bit4 + bit7;
                    let testKey = SdesUtils.Permutate(temp10Bit, rev_P8_after_ls3);
                    let tempSdes = new sdescore();
                    if (tempSdes.Encrypt(plainText1, testKey) === cipherText1) {
                        if (tempSdes.Encrypt(plainText2, testKey) === cipherText2) {
                            if (!foundMasterKeys.includes(testKey)) {
                                foundMasterKeys.push(testKey);
                            }
                        }
                    }
                }
            }
        }
        return {
            verifiedK2: verifiedK2,        // 8-bitlik S-Kutusu adayları
            foundMasterKeys: foundMasterKeys // 10-bitlik Master anahtar adayları
        };

    }


}
