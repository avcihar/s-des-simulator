/**
 * SdesModes sınıfı, S-DES algoritmasının farklı çalışma modlarını (ECB, CBC, OFB) uygulamak ve yönetmekle sorumludur.
 * Bu sınıf, düz metni bloklara ayırmak, blokları şifrelemek veya deşifre etmek ve sonuçları tekrar okunabilir metne dönüştürmek gibi işlemleri içerir.
 * SdesModes, SdesTestRunner tarafından testlerde kullanılmak üzere çeşitli şifreleme ve deşifreleme yöntemleri sağlar.
 * Her mod için, uygun giriş doğrulaması yapılır ve hatalar kullanıcıya bildirilir.
 */
class SdesModes {
    constructor() {
        this.sdes = new sdescore();

        this.PlaninTextBlocks = [];
        this.CipherTextBlocks = [];
    }

    

    /**
     * Belirtilen düz metni, Electronic Codebook (ECB) çalışma modunu ve 10 bitlik anahtarı kullanarak şifreler.
     * @param {string} PlainText - Şifrelenecek olan standart düz metin.
     * @param {string} Key10Bit - Şifreleme işleminde kullanılacak 10 bitlik ikilik (binary) anahtar.
     * @param {string} inputFormat - Girdi formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns {string} ECB moduyla şifrelenmiş ikilik (binary) şifreli metin (Ciphertext).
     * @throws {Error} Girdi metni boşsa hata fırlatır.
     */
    EBCEncrypt(PlainText, Key10Bit, inputFormat = "ASCII") {
        PlainText = SdesUtils.ConvertToBinary(PlainText, inputFormat);
        if (!PlainText) throw new Error("HATA: Şifrelenecek metin (PlainText) boş olamaz.");

        this.PlaninTextBlocks = SdesUtils.SplitPlainTextBlocks(PlainText);
        let list = [];
        for (let s of this.PlaninTextBlocks) {
            list.push(this.sdes.Encrypt(s, Key10Bit) || "");
        }
        return list.join("");
    }
        
    /**
     * Belirtilen şifreli ikilik metni, Electronic Codebook (ECB) çalışma modunu kullanarak deşifre eder.
     * @param {string} CipherText - Deşifre edilecek olan ikilik (binary) formatındaki şifreli metin.
     * @param {string} Key10Bit - Deşifreleme işleminde kullanılacak 10 bitlik ikilik (binary) anahtar.
     * @param {string} inputFormat - Girdi formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @param {string} outputFormat - Çıktı formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns {string} Şifresi çözülmüş orijinal düz metin (Plaintext).
     * @throws {Error} Şifreli metin 8'in katları uzunluğunda değilse hata fırlatır.
     */
    EBCDecrypt(CipherText, Key10Bit, inputFormat = "Binary", outputFormat = "Binary") {
        CipherText = SdesUtils.ConvertToBinary(CipherText, inputFormat);
        if (!CipherText || CipherText.length % 8 !== 0) {
            throw new Error("HATA: Deşifre edilecek şifreli metin sadece 0 ve 1'lerden oluşmalı ve uzunluğu 8'in katı olmalıdır.");
        }

        this.CipherTextBlocks = SdesUtils.SplitCipherBlocks(CipherText);

        let list = [];
        for (let s of this.CipherTextBlocks) {
            list.push(this.sdes.Decrypt(s, Key10Bit) || "");
        }
        return SdesUtils.ConvertFromBinaryBlocks(list, outputFormat);
    }



    /**
     * Belirtilen düz metni, Cipher Block Chaining (CBC) çalışma modunu ve Başlatma Vektörünü (IV) kullanarak şifreler.
     * @param {string} PlainText - Şifrelenecek olan standart düz metin.
     * @param {string} Key10Bit - Şifreleme işleminde kullanılacak 10 bitlik ikilik anahtar.
     * @param {string} IV - Zincirlemeyi başlatmak için kullanılacak 8 bitlik Başlatma Vektörü.
     * @param {string} inputFormat - Girdi formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns {string} CBC moduyla zincirlenerek şifrelenmiş ikilik (binary) şifreli metin.
     * @throws {Error} Girdi metni boşsa veya IV 8 bit uzunluğunda değilse hata fırlatır.
     */
    CBCEncrypt(PlainText, Key10Bit, IV, inputFormat = "ASCII") {
        PlainText = SdesUtils.ConvertToBinary(PlainText, inputFormat);
        if (!PlainText) throw new Error("HATA: Şifrelenecek metin (PlainText) boş olamaz.");
        if (!IV || IV.length !== 8 || !/^[01]+$/.test(IV)) {
            throw new Error("HATA: CBC modunda Başlatma Vektörü (IV) tam olarak 8 bit uzunluğunda ve ikilik formatta olmalıdır.");
        }

        this.PlaninTextBlocks = SdesUtils.SplitPlainTextBlocks(PlainText);

        let list = [];
        let previousBlock = IV;
        
        for (let s of this.PlaninTextBlocks) {
            let blockToEncrypt = SdesUtils.XOR(s, previousBlock);
            let enc = this.sdes.Encrypt(blockToEncrypt, Key10Bit);
            list.push(enc || "");
            previousBlock = enc || "";
        }
        return list.join("");
    }

    /**
     * Belirtilen şifreli ikilik metni, Cipher Block Chaining (CBC) çalışma modunu kullanarak deşifre eder.
     * @param {string} CipherText - Deşifre edilecek olan ikilik formatındaki şifreli metin.
     * @param {string} Key10Bit - Deşifreleme işleminde kullanılacak 10 bitlik ikilik anahtar.
     * @param {string} IV - Şifreleme sırasında kullanılan 8 bitlik Başlatma Vektörü.
     * @param {string} inputFormat - Girdi formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @param {string} outputFormat - Çıktı formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns {string} Şifresi çözülmüş orijinal düz metin (Plaintext).
     * @throws {Error} Girdi formatları veya IV yanlışsa hata fırlatır.
     */
    CBCDecrypt(CipherText, Key10Bit, IV, inputFormat = "Binary", outputFormat = "Binary") {
        CipherText = SdesUtils.ConvertToBinary(CipherText, inputFormat);
        if (!CipherText || CipherText.length % 8 !== 0 ) {
            throw new Error("HATA: Deşifre edilecek şifreli metin sadece 0 ve 1'lerden oluşmalı ve uzunluğu 8'in katı olmalıdır.");
        }
        if (!IV || IV.length !== 8 || !/^[01]+$/.test(IV)) {
            throw new Error("HATA: CBC modunda Başlatma Vektörü (IV) tam olarak 8 bit uzunluğunda ve ikilik formatta olmalıdır.");
        }

        this.CipherTextBlocks = SdesUtils.SplitCipherBlocks(CipherText);
        let list = [];
        let previousBlock = IV;
        
        for (let s of this.CipherTextBlocks) {
            let decrypted = this.sdes.Decrypt(s, Key10Bit) || "";
            let originalBlock = SdesUtils.XOR(decrypted, previousBlock);
            list.push(originalBlock);
            previousBlock = s; 
        }
        return SdesUtils.ConvertFromBinaryBlocks(list, outputFormat);
    }

    

    /**
     * Belirtilen düz metni, Output Feedback (OFB) çalışma modunu kullanarak şifreler.
     * @param {string} PlainText - Şifrelenecek olan standart düz metin.
     * @param {string} Key10Bit - Anahtar akışını üretmek için kullanılacak 10 bitlik ikilik anahtar.
     * @param {string} IV - Şifreleme akışını başlatmak için kullanılacak 8 bitlik Başlatma Vektörü.
     * @param {string} inputFormat - Girdi formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns {string} OFB moduyla üretilmiş ikilik (binary) şifreli metin.
     * @throws {Error} Girdi metni boşsa veya IV 8 bit uzunluğunda değilse hata fırlatır.
     */
    OFBEncrypt(PlainText, Key10Bit, IV, inputFormat = "ASCII") {
        PlainText = SdesUtils.ConvertToBinary(PlainText, inputFormat);
        if (!PlainText) throw new Error("HATA: Şifrelenecek metin (PlainText) boş olamaz.");
        if (!IV || IV.length !== 8 || !/^[01]+$/.test(IV)) {
            throw new Error("HATA: OFB modunda Başlatma Vektörü (IV) tam olarak 8 bit uzunluğunda ve ikilik formatta olmalıdır.");
        }

        this.PlaninTextBlocks = SdesUtils.SplitPlainTextBlocks(PlainText);

        let list = [];
        let feedback = IV;
        
        for (let s of this.PlaninTextBlocks) {
            feedback = this.sdes.Encrypt(feedback, Key10Bit) || "";
            let encryptedBlock = SdesUtils.XOR(s, feedback);
            list.push(encryptedBlock || "");
        }
        return list.join("");
    }

    /**
     * Belirtilen şifreli ikilik metni, Output Feedback (OFB) çalışma modunu kullanarak deşifre eder.
     * @param {string} CipherText - Deşifre edilecek olan ikilik formatındaki şifreli metin.
     * @param {string} Key10Bit - Anahtar akışını yeniden üretmek için kullanılacak 10 bitlik ikilik anahtar.
     * @param {string} IV - Şifreleme sırasında kullanılan 8 bitlik Başlatma Vektörü.
     * @param {string} inputFormat - Girdi formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @param {string} outputFormat - Çıktı formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns {string} Şifresi çözülmüş orijinal düz metin (Plaintext).
     * @throws {Error} Girdi formatları veya IV yanlışsa hata fırlatır.
     */
    OFBDecrypt(CipherText, Key10Bit, IV, inputFormat = "Binary", outputFormat = "Binary") {
        CipherText = SdesUtils.ConvertToBinary(CipherText, inputFormat);
        if (!CipherText || CipherText.length % 8 !== 0) {
            throw new Error("HATA: Deşifre edilecek şifreli metin sadece 0 ve 1'lerden oluşmalı ve uzunluğu 8'in katı olmalıdır.");
        }
        if (!IV || IV.length !== 8 || !/^[01]+$/.test(IV)) {
            throw new Error("HATA: OFB modunda Başlatma Vektörü (IV) tam olarak 8 bit uzunluğunda ve ikilik formatta olmalıdır.");
        }

        this.CipherTextBlocks = SdesUtils.SplitCipherBlocks(CipherText);

        let list = [];
        let feedback = IV;
        
        for (let s of this.CipherTextBlocks) {
            feedback = this.sdes.Encrypt(feedback, Key10Bit) || "";
            let decryptedBlock = SdesUtils.XOR(s, feedback);
            list.push(decryptedBlock || "");
        }
        return SdesUtils.ConvertFromBinaryBlocks(list, outputFormat);
    }
}