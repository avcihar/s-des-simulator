/**
 * Ödev dokümanında belirtilen test senaryolarını uygulayan sınıf. Her test senaryosu için ayrı bir metot içerir ve sonuçları raporlar.
 * Test senaryoları, S-DES algoritmasının temel işlevlerini ve farklı çalışma modlarını kapsamaktadır.
 * test_runner sınıfı, SdesUtils, SdesModes ve SdesAtacker sınıflarını kullanarak şifreleme, deşifreleme ve anahtar saldırısı işlemlerini gerçekleştirir.
 * Her test metodu, girdileri, beklenen sonuçları, elde edilen sonuçları ve test sonucunu (PASS/FAIL) içeren bir rapor döndürür.
 * Test senaryoları, algoritmanın doğruluğunu ve güvenliğini değerlendirmek için tasarlanmıştır.
 */
class test_runner {
    constructor() {
        this.sdes = new sdescore();
        this.sdes_modes = new SdesModes();
    }
    /**
     * T_01 test senaryosu, S-DES algoritmasının şifreleme işlevini test eder.
     * @returns {object} Test sonuçlarını içeren bir rapor nesnesi.
     */
    T_01() {
        let key = "0111111101";
        let plaintext = "10101010";
        let expectedC = "00010110";
        let actualC = this.sdes.Encrypt(plaintext, key);
        let TestResult = (actualC === expectedC) ? "PASS" : "FAIL";
        return{
            TestName: "T_01 ",
            Key: key,
            Plaintext: plaintext,
            ExpectedCiphertext: expectedC,
            ActualCiphertext: actualC,
            TestResult: TestResult
        }
    }
    
    /**
     * T_02 test senaryosu, S-DES algoritmasının deşifreleme işlevini test eder.
     * @returns {object} Test sonuçlarını içeren bir rapor nesnesi.
     */
    T_02() {
        let key = "0111111101";
        let ciphertext = "00010110"; // Elle hesapladığım sonuç "00010110".
        let expectedP = "10101010";
        let actualP = this.sdes.Decrypt(ciphertext, key);
        let TestResult = (actualP === expectedP) ? "PASS" : "FAIL";
        return{
            TestName: "T_02",
            Key: key,
            Ciphertext: ciphertext,
            ExpectedPlaintext: expectedP,
            ActualPlaintext: actualP,
            TestResult: TestResult
        }
    }
    /**
     * T_03 test senaryosu, S-DES algoritmasının şifreleme işlevini test eder.
     * @returns {object} Test sonuçlarını içeren bir rapor nesnesi.
     */
    T_03() {
        let key = "1010000010"; 
        let plaintext = "01110010";
        let expectedC = "01110111"; // Elle hesapladığım sonuç, referans olarak kullandığım çevrimiçi S-DES şifreleyici tarafından üretilen sonuçla aynı.
        let actualC = this.sdes.Encrypt(plaintext, key);
        let TestResult = (actualC === expectedC) ? "PASS" : "FAIL";
        return{
            TestName: "T_03",
            Key: key,
            Plaintext: plaintext,
            ExpectedCiphertext: expectedC,
            ActualCiphertext: actualC,
            TestResult: TestResult
        }
    }
    /**
     * brute force ve bilinen plaintext çifti saldırısını test eder.
     * @param {string} knownPlaintext - Bilinen düz metin.
     * @param {string} knownCiphertext - Bilinen şifreli metin.
     * @param {string} TargetKey - Test edilecek hedef anahtar.
     * @returns {object} Saldırı sonuçlarını içeren bir rapor nesnesi.
     */
    T_04(knownPlaintext, knownCiphertext, TargetKey) {
        let candidateKeys = SdesAtacker.bruteForceAttack(knownPlaintext, knownCiphertext);
        let verifiedKey = SdesAtacker.VerifyKey(TargetKey, candidateKeys);
        let TestResult = (verifiedKey === TargetKey) ? "PASS" : "FAIL";
        return{
            TestName: "T_04",
            KnownPlaintext: knownPlaintext,
            KnownCiphertext: knownCiphertext,
            TargetKey: TargetKey,
            CandidateKeys: candidateKeys,
            VerifiedKey: verifiedKey,
            TestResult: TestResult
        }
    }
    /**
     * CBC modunda şifreleme ve deşifreleme işlemlerini test eder.
     * @param {string} plaintext - Şifreleme ve deşifreleme işlemlerinde kullanılacak olan düz metin (plaintext).
     * @param {string} key - Şifreleme ve deşifreleme işlemlerinde kullanılacak olan anahtar (key).
     * @param {string} IV - Şifreleme modlarında (CBC, OFB) kullanılacak olan başlangıç vektörü (Initialization Vector). ECB modunda IV kullanılmaz.
     * @param {string} inputFormat - Girdi metninin formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal"). Varsayılan olarak "ASCII" kabul edilir.
     * @returns {object} Şifreleme ve deşifreleme sonuçlarını içeren bir rapor nesnesi.
     */
    T_05(plaintext, key, IV, inputFormat = "ASCII") {
        let ciphertext = this.sdes_modes.CBCEncrypt(plaintext, key, IV, inputFormat);
        let decryptedText = this.sdes_modes.CBCDecrypt(ciphertext, key, IV, "Binary", inputFormat);
        let TestResult = (decryptedText === plaintext) ? "PASS" : "FAIL";
        return{
            TestName: "T_05",
            Plaintext: plaintext,
            Key: key,
            IV: IV,
            Ciphertext: ciphertext,
            DecryptedText: decryptedText,
            TestResult: TestResult
        }
    }
    /**
     * çalışma modlarını test eder. Verilen düz metin (plaintext), anahtar (key) ve başlangıç vektörü (IV) kullanarak ECB, CBC ve OFB modlarında şifreleme ve deşifreleme işlemlerini gerçekleştirir. 
     * Her mod için elde edilen şifreli metin (ciphertext) ve deşifrelenmiş metin (decrypted text) ile orijinal düz metni karşılaştırarak test sonuçlarını raporlar. Test sonuçları, her modun doğruluğunu "PASS" veya "FAIL" olarak gösterir. Rapor, her modun şifreli ve deşifrelenmiş sonuçlarını içerir.
     * @param {string} plaintext - Şifreleme ve deşifreleme işlemlerinde kullanılacak olan düz metin (plaintext).
     * @param {string} key - Şifreleme ve deşifreleme işlemlerinde kullanılacak olan anahtar (key).
     * @param {string} IV - Şifreleme modlarında (CBC, OFB) kullanılacak olan başlangıç vektörü (Initialization Vector). ECB modunda IV kullanılmaz.
     * @param {string} inputFormat - Girdi metninin formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal"). Varsayılan olarak "ASCII" kabul edilir.
     * @param {string} outputFormat - Çıktı metninin formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal"). Varsayılan olarak "ASCII" kabul edilir.
     * @returns {object} Çalışma modları testi sonuçlarını içeren bir rapor nesnesi.
     */
    Test_modes(plaintext, key, IV, inputFormat = "ASCII", outputFormat = "ASCII") {
        let ecbCiphertext = this.sdes_modes.EBCEncrypt(plaintext, key, inputFormat);
        let ecbDecryptedText = this.sdes_modes.EBCDecrypt(ecbCiphertext, key, "Binary", outputFormat);
        let cbcCiphertext = this.sdes_modes.CBCEncrypt(plaintext, key, IV, inputFormat);
        let cbcDecryptedText = this.sdes_modes.CBCDecrypt(cbcCiphertext, key, IV, "Binary", outputFormat);
        let ofbEncrypted = this.sdes_modes.OFBEncrypt(plaintext, key, IV, inputFormat);
        let ofbDecrypted = this.sdes_modes.OFBDecrypt(ofbEncrypted, key, IV, "Binary", outputFormat);
        let ofbTestResult = (ofbDecrypted === plaintext) ? "PASS" : "FAIL";
        let ecbTestResult = (ecbDecryptedText === plaintext) ? "PASS" : "FAIL";
        let cbcTestResult = (cbcDecryptedText === plaintext) ? "PASS" : "FAIL";
        let testResult = (ecbTestResult === "PASS" && cbcTestResult === "PASS" && ofbTestResult ==="PASS") ? "PASS" : "FAIL";
        return{
            TestName: "Test_modes",
            Plaintext: plaintext,
            Key: key,
            IV: IV,
            ECB_Ciphertext: ecbCiphertext,
            ECB_DecryptedText: ecbDecryptedText,
            ECB_TestResult: ecbTestResult,
            CBC_Ciphertext: cbcCiphertext,
            CBC_DecryptedText: cbcDecryptedText,
            CBC_TestResult: cbcTestResult,
            OFB_Encrypted: ofbEncrypted,
            OFB_Decrypted: ofbDecrypted,
            OFB_TestResult: ofbTestResult,
            TestResult: testResult
        }
    }

    /**
     * differential attack ve brute-force attack yöntemlerini, bilinen bir düz metin (plaintext) 
     * ve onun şifreli hali (ciphertext) üzerinden karşılaştırarak test eder. 
     * Her iki saldırı yönteminin hedef anahtarı bulma başarısını ve çalışma sürelerini ölçer.
     * @param {string} knownPlaintext - Bilinen düz metin (plaintext) örneği, saldırıların giriş verisi olarak kullanılır.
     * @param {string} knownCiphertext - Bilinen şifreli metin (ciphertext) örneği, saldırıların doğrulama sürecinde kullanılır.
     * @param {string} TargetKey - Saldırıların hedeflediği anahtar, her iki yöntemin doğruluğunu değerlendirmek için kullanılır.
     * @returns {object} Her iki saldırı yönteminin sonuçlarını içeren bir rapor nesnesi, başarı durumları ve çalışma süreleri dahil. ratio: DifferentialTime / BruteForceTime, IsBruteSuccess: "PASS" veya "FAIL", IsDiffSuccess: "PASS" veya "FAIL"
     */
    DiffvsBruteForce(knownPlaintext, knownCiphertext, TargetKey) {
        let StartTimeBrute = performance.now();
        let bruteCandidates = SdesAtacker.bruteForceAttack(knownPlaintext, knownCiphertext);
        let bruteVerifiedKey = SdesAtacker.VerifyKey(TargetKey, bruteCandidates);
        let isBruteSuccess = (bruteVerifiedKey === TargetKey) ? "PASS" : "FAIL";
        let EndTimeBrute = performance.now();
        let BruteForceTime = EndTimeBrute - StartTimeBrute;
        let StartTimeDiff = performance.now();
        let diffCandidates = SdesAtacker.differentialAttack(knownPlaintext, TargetKey);
        let diffVerifiedKey = SdesAtacker.VerifyKey(TargetKey, diffCandidates);
        let isDiffSuccess = (diffVerifiedKey === TargetKey) ? "PASS" : "FAIL";
        let EndTimeDiff = performance.now();
        let DifferentialTime = EndTimeDiff - StartTimeDiff;

        return {
            TestName: "DiffvsBruteForce",
            KnownPlaintext: knownPlaintext,
            KnownCiphertext: knownCiphertext,
            TargetKey: TargetKey,
            BruteForceTime: BruteForceTime,
            DifferentialTime: DifferentialTime,
            ratio: DifferentialTime / BruteForceTime,
            IsBruteSuccess: isBruteSuccess,
            IsDiffSuccess: isDiffSuccess
        };
    }

}
