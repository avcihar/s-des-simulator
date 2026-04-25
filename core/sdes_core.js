/**
 * sdescore sınıfı, S-DES algoritmasının temel çekirdek işlevselliğini sağlayan bir yapıdır.
 * Bu sınıf, S-DES algoritmasının anahtar üretimi, permütasyonlar, S-Kutusu dönüşümleri ve Feistel fonksiyonu gibi temel bileşenlerini içerir.
 * sdescore, SdesModes sınıfı tarafından farklı çalışma modlarında (ECB, CBC, OFB) kullanılmak üzere tasarlanmıştır.
 * Her işlev, algoritmanın doğru çalışması için gerekli olan belirli bir adımı temsil eder ve giriş doğrulaması yaparak hataları önler.
 */
class sdescore {
    constructor() {
        // Sabit Permütasyon Tabloları
        this.P10 = [3, 5, 2, 7, 4, 10, 1, 9, 8, 6]; // Anahtar üretimi için kullanılan 10 bitlik permütasyon tablosu
        this.P8 = [6, 3, 7, 4, 8, 5, 10, 9]; // Anahtar üretimi için kullanılan 8 bitlik permütasyon tablosu
        this.P4 = [2, 4, 3, 1]; // Feistel fonksiyonu için kullanılan 4 bitlik permütasyon tablosu
        this.IP = [2, 6, 3, 1, 4, 8, 5, 7]; // Giriş verisi için kullanılan 8 bitlik ilk permütasyon tablosu
        this.EP = [4, 1, 2, 3, 2, 3, 4, 1]; // Feistel fonksiyonunda sağ bloğu genişletmek için kullanılan 8 bitlik permütasyon tablosu
        this.IP_INV = [4, 1, 3, 5, 7, 2, 8, 6]; // Çıkış verisi için kullanılan 8 bitlik ters permütasyon tablosu

        // Sabit S-Kutusu (S-Box) Matrisleri
        this.S0 = [
            [1, 0, 3, 2],
            [3, 2, 1, 0],
            [0, 2, 1, 3],
            [3, 1, 3, 2]
        ]; 
        
        this.S1 = [
            [0, 1, 2, 3],
            [2, 0, 1, 3],
            [3, 0, 1, 0],
            [2, 1, 0, 3]
        ];

        // Alt Anahtarlar
        this.K1 = "";
        this.K2 = "";
    }


    /**
     * 10 bitlik ana anahtarı kullanarak, 8 bitlik K1 ve K2 alt anahtarlarını üretir.
     * @param {string} key10bit - Kullanıcıdan alınan 10 bitlik orijinal anahtar.
     * @throws {Error} Anahtar 10 bit uzunluğunda değilse veya 0-1 dışında karakter içeriyorsa hata fırlatır.
     */
    KeyGeneration(key10bit) {
        if (!key10bit || key10bit.length !== 10 || !/^[01]+$/.test(key10bit)) {
            throw new Error("HATA: Anahtar (Key) tam olarak 10 bit uzunluğunda ve sadece ikilik (0 ve 1) sistemde olmalıdır.");
        }

        let p10 = SdesUtils.Permutate(key10bit, this.P10);

        let L1 = p10.substring(0, 5);
        let R1 = p10.substring(5);
        L1 = SdesUtils.LeftShift(L1, 1);
        R1 = SdesUtils.LeftShift(R1, 1);
        p10 = L1 + R1;
        this.K1 = SdesUtils.Permutate(p10, this.P8);

        let L2 = p10.substring(0, 5);
        let R2 = p10.substring(5);
        L2 = SdesUtils.LeftShift(L2, 2);
        R2 = SdesUtils.LeftShift(R2, 2);
        p10 = L2 + R2;
        this.K2 = SdesUtils.Permutate(p10, this.P8);
    }

    /**
     * S-Kutusu (Substitution Box - S-Box) dönüşüm işlemini gerçekleştirir.
     * 8 bitlik veriyi S0 ve S1 matrislerinden geçirerek daha karmaşık 4 bitlik bir veriye dönüştürür.
     * @param {string} s0 - S0 matrisine girecek olan ilk 4 bitlik sol blok.
     * @param {string} s1 - S1 matrisine girecek olan ikinci 4 bitlik sağ blok.
     * @returns {string} S-Kutularından elde edilen 4 bitlik (2+2) yeni karmaşık veri bloğu.
     */
    SBoxLookUp(s0, s1) {
        let row0 = parseInt(`${s0[0]}${s0[3]}`, 2);
        let col0 = parseInt(`${s0[1]}${s0[2]}`, 2);
        let val0 = this.S0[row0][col0].toString(2).padStart(2, '0');

        let row1 = parseInt(`${s1[0]}${s1[3]}`, 2);
        let col1 = parseInt(`${s1[1]}${s1[2]}`, 2);
        let val1 = this.S1[row1][col1].toString(2).padStart(2, '0');

        return val0 + val1;
    }

    /**
     * S-DES algoritmasının çekirdek karmaşıklık (Feistel) fonksiyonudur.
     * @param {string} input - İşleme sokulacak 4 bitlik veri bloğu.
     * @param {string} subKey - Bu turda kullanılacak olan 8 bitlik alt anahtar (K1 veya K2).
     * @returns {string} Tüm çekirdek işlemlerden geçmiş 4 bitlik yeni veri bloğu.
     */
    Fk(input, subKey) {
        let result = SdesUtils.Permutate(input, this.EP);
        result = SdesUtils.XOR(result, subKey);
        
        let leftRes = result.substring(0, 4);
        let rightRes = result.substring(4);

        result = this.SBoxLookUp(leftRes, rightRes);
        result = SdesUtils.Permutate(result, this.P4);

        return result;
    }

    /**
     * 8 bitlik tek bir düz metin bloğunu, 10 bitlik anahtarı kullanarak şifreler.
     * @param {string} plainText - Şifrelenecek 8 bitlik düz metin bloğu.
     * @param {string} key10bit - Şifreleme için kullanılacak 10 bitlik anahtar.
     * @param {string} inputFormat - Girdi metninin formatı. "Binary", "ASCII", "Hex" veya "Octal" olabilir. Varsayılan olarak "Binary" döner.
     * @returns {string} 8 bitlik şifrelenmiş metin (Ciphertext) bloğu.
     * @throws {Error} Düz metin 8 bit değilse veya 0-1 dışında karakter içeriyorsa hata fırlatır.
     */
    Encrypt(plainText, key10bit, inputFormat = "Binary") {
        plainText = SdesUtils.ConvertToBinary(plainText, inputFormat);
        if (!plainText || plainText.length !== 8 || !/^[01]+$/.test(plainText)) {
            throw new Error("HATA: S-DES Çekirdek modunda düz metin (PlainText) tam olarak 8 bit olmalıdır.");
        }

        let cipherText = SdesUtils.Permutate(plainText, this.IP);
        let L = cipherText.substring(0, 4);
        let R = cipherText.substring(4);
        
        this.KeyGeneration(key10bit);
        
        let newL = SdesUtils.XOR(L, this.Fk(R, this.K1));
        
        L = R;
        R = newL;
        
        L = SdesUtils.XOR(L, this.Fk(R, this.K2));
        cipherText = SdesUtils.Permutate(L + R, this.IP_INV);
        
        return cipherText;
    }

    /**
     * 8 bitlik tek bir şifreli metin bloğunu, 10 bitlik anahtarı kullanarak deşifre eder.
     * @param {string} cipherText - Deşifre edilecek 8 bitlik şifreli metin bloğu.
     * @param {string} key10bit - Deşifreleme için kullanılacak 10 bitlik anahtar.
     * @param {string} inputFormat - Girdi formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns {string} 8 bitlik deşifre edilmiş orijinal düz metin (Plaintext) bloğu.
     * @throws {Error} Şifreli metin 8 bit değilse veya 0-1 dışında karakter içeriyorsa hata fırlatır.
     */
    Decrypt(cipherText, key10bit, inputFormat = "Binary") {
        cipherText = SdesUtils.ConvertToBinary(cipherText, inputFormat);
        if (!cipherText || cipherText.length !== 8 || !/^[01]+$/.test(cipherText)) {
            throw new Error("HATA: S-DES Çekirdek modunda şifreli metin (CipherText) tam olarak 8 bit olmalıdır.");
        }

        let plainText = SdesUtils.Permutate(cipherText, this.IP);
        let L = plainText.substring(0, 4);
        let R = plainText.substring(4);
        
        this.KeyGeneration(key10bit);
        
        let newL = SdesUtils.XOR(L, this.Fk(R, this.K2));
        
        L = R;
        R = newL;
        
        L = SdesUtils.XOR(L, this.Fk(R, this.K1));
        plainText = SdesUtils.Permutate(L + R, this.IP_INV);
        
        return plainText;
    }
}