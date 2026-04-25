/**
 * SdesAttacker sınıfı, S-DES algoritmasına yönelik saldırıları gerçekleştirmek için kullanılan statik yöntemler içeren bir sınıftır.
 * Bu sınıf, bilinen düz metin saldırısı (brute-force) ve diferansiyel analiz saldırısı gibi yöntemleri içerir.
 * Her yöntem, verilen girdilere dayanarak olası anahtarları bulur ve doğrulama işlemi yapar.
 */
class SdesAtacker {
    /**
     * Tüm olası 10 bitlik anahtarları deneyerek, bilinen düz metin ve şifreli metin çiftine uyan anahtarları bulur.
     * @param {string} knownPlaintext 8 bitlik bilinen düz metin (Plaintext) bloğu. 
     * @param {string} knownCiphertext 8 bitlik bilinen şifreli metin (Ciphertext) bloğu.
     * @returns bulunan anahtarları içeren bir dizi (ikilik formatında).
     */
    static bruteForceAttack(knownPlaintext, knownCiphertext) {
        let candidates = [];
        let sdes = new sdescore();
        for (let key = 0; key < 1024; key++) {
            let keyBinary = key.toString(2).padStart(10, '0');
            let decrypted = sdes.Decrypt(knownCiphertext, keyBinary);
            if (decrypted === knownPlaintext) {
                candidates.push(keyBinary);
            }
        }
        return candidates;
    }

    /**
     * diferansiyel analiz saldırısını başlatır. Verilen bilinen düz metin ve şifreli metin çiftine dayanarak, olası anahtarları bulur. 
     * @param {string} knownPlaintext 8 bitlik bilinen düz metin (Plaintext) bloğu.
     * @param {string} TargetKey 10 bitlik hedef anahtar ikilik (binary) formatında.
     * @returns Bulunan olası anahtarları içeren bir dizi (ikilik formatında).
     */
    static differentialAttack(knownPlaintext, TargetKey) {
        let diffAnalysis = new diff_analysis();
        let candidates = diffAnalysis.diff_analysis_start(knownPlaintext, TargetKey)["foundMasterKeys"];
        return candidates;
    }

    /**
     * Bulunan anahtarları doğrulamak için, her bir anahtar adayı ile belirli test düz metinlerini şifreler ve gerçek şifrelerle karşılaştırır.
     * Bu yöntem, diferansiyel analiz yoluyla bulunan anahtarların doğruluğunu test etmek için kullanılır.
     * @param {string} targetKey 10 bitlik hedef anahtar ikilik (binary) formatında.
     * @param {Array<string>} candidateKeys Diferansiyel analiz yoluyla bulunan anahtar adaylarını içeren bir dizi (ikilik formatında).
     * @returns {Array<string>} Doğrulanan anahtarları içeren bir dizi (ikilik formatında).
     */
    static VerifyKey(targetKey, candidateKeys) {
        let verifiedKey = ""; 
        let testCases = ["00000000", "11111111", "10101010", "01010101"]; 

        for (let candidateKey of candidateKeys) {
            let isVerified = true;
            let tempSdes = new sdescore();

            for (let tc of testCases) {
                let Cipher = tempSdes.Encrypt(tc, targetKey); 
                let candidateCipher = tempSdes.Encrypt(tc, candidateKey);

                if (Cipher !== candidateCipher) {
                    isVerified = false; 
                    break;
                }
            }

            if (isVerified) {
                verifiedKey = candidateKey;
            }
        }

        return verifiedKey; 
    }
}