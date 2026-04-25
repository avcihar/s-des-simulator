/**
 * SdesUtils sınıfı, S-DES algoritmasıyla ilgili çeşitli yardımcı işlevleri içeren statik bir sınıftır.
 * Bu sınıf, metin bloklarını bölme, ikilik (binary) ve ASCII dönüşümleri, XOR işlemi ve permütasyon gibi temel işlemleri sağlar.
 * SdesUtils, SdesModes ve SdesTestRunner tarafından şifreleme ve deşifreleme süreçlerinde kullanılan ortak işlevleri içerir.
 * Her yöntem, girdi doğrulaması yapar ve hataları uygun şekilde yönetir.
 */
class SdesUtils{

    /**
     * 8 bitlik ikilik (binary) veri bloklarını, belirtilen formatda okunabilir metne dönüştürür.
     * @param {string[]} DecryptList - Orijinal metne dönüştürülecek olan 8 bitlik ikilik (binary) dizilerin listesi (Array).
     * @param {string} outputFormat - Çıktı formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns {string} Dönüştürülmüş metin.
     * @throws {Error} Geçersiz output formatı durumunda hata fırlatır.
     */
    static ConvertFromBinaryBlocks(input, outputFormat = "ASCII") {
        let result = "";
        for (let block of input) {
            result += block;
        }
        return SdesUtils.ConvertFromBinary(result, outputFormat);
    }    

    /**
     * Verilen veriyi binary formatına dönüştürür. Girdi formatına göre uygun dönüşümü yapar.
     * @param {string} input - Dönüştürülecek olan veri.
     * @param {string} inputFormat - Verinin mevcut formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns {string} Dönüştürülmüş ikilik (binary) veri.
     */
    static ConvertToBinary(input, inputFormat) {
        if (input === null || input === undefined) return "";
        input = String(input);
        let binaryStr = "";
        let baseBits = 0; 
        
        switch (inputFormat) {
            case "ASCII":                
                for (let char of input) {
                    binaryStr += char.charCodeAt(0).toString(2).padStart(8, '0');
                }
                return binaryStr; 
                
            case "Binary":
                if (!/^[01]+$/.test(input)) {
                    throw new Error("HATA: Binary formatında girdi, sadece 0 ve 1'lerden oluşmalıdır.");
                }
                binaryStr = input;
                baseBits = input.length; 
                break;
                
            case "Hex":
                if (!/^[0-9a-fA-F]+$/.test(input)) {
                    throw new Error("HATA: Hex formatında girdi, sadece 0-9 ve A-F karakterlerinden oluşmalıdır.");
                }
                binaryStr = BigInt("0x" + input).toString(2);
                baseBits = Math.floor((input.length * 4) / 8) * 8; 
                break;
                
            case "Octal":
                if (!/^[0-7]+$/.test(input)) {
                    throw new Error("HATA: Octal formatında girdi, sadece 0-7 karakterlerinden oluşmalıdır.");
                }
                binaryStr = BigInt("0o" + input).toString(2);
                baseBits = Math.floor((input.length * 3) / 8) * 8; 
                break;
                
            case "Decimal":
                if (!/^\d+$/.test(input)) {
                    throw new Error("HATA: Decimal formatında girdi, sadece 0-9 karakterlerinden oluşmalıdır.");
                }
                binaryStr = BigInt(input).toString(2);
                baseBits = 8; 
                break;

            default:
                throw new Error("HATA: Geçersiz input formatı. 'ASCII', 'Binary', 'Hex', 'Octal' veya 'Decimal' olmalıdır.");
        }
        
        let minBits = binaryStr.length; 
        
        let targetBits = Math.max(minBits, baseBits);
        
        let finalLength = Math.ceil(targetBits / 8) * 8;
        
        return binaryStr.padStart(finalLength, '0');
    }

    /**
     * binary formatındaki veriyi, belirtilen output formatına dönüştürür. Girdi binary formatında olmalıdır.
     * @param {string} input - Dönüştürülecek olan ikilik (binary) veri.
     * @param {string} outputFormat - Dönüştürülecek olan output formatı ("ASCII", "Binary", "Hex", "Octal", "Decimal").
     * @returns Dönüştürülmüş veri.
     */
    static ConvertFromBinary(input, outputFormat) {
        if (!input || input.trim() === "") return "";
        if(!/^[01]+$/.test(input)) {
            throw new Error("HATA: Binary formatında girdi, sadece 0 ve 1'lerden oluşmalıdır.");
        }
        let result = "";
        switch (outputFormat) {
            case "ASCII":
                if (input.length % 8 !== 0) {
                    throw new Error("HATA: ASCII formatına dönüştürülecek binary verinin uzunluğu 8'in katı olmalıdır.");
                }
                for (let i = 0; i < input.length; i += 8) {
                    let block = input.substring(i, i + 8);
                    result += String.fromCharCode(parseInt(block, 2));
                }
                return result;
            case "Binary":
                return input;
            case "Hex":
                result = BigInt("0b" + input).toString(16).padStart(input.length / 4, '0');
                return result;
            case "Octal":
                result = BigInt("0b" + input).toString(8).padStart(Math.ceil(input.length / 3), '0');
                return result;
            case "Decimal":            
                let decVal = BigInt("0b" + input);
                return decVal.toString(10);
            default:
                throw new Error("HATA: Geçersiz output formatı. 'ASCII', 'Binary', 'Hex', 'Octal' veya 'Decimal' olmalıdır.");
        }

    }
 
    /**
     * Uzun ve bitişik haldeki ikilik (binary) şifreli metni, S-DES algoritmasının işleyebileceği 8'er bitlik parçalara (bloklara) böler.
     * @param {string} CipherText - Bloklara ayrılacak olan ikilik (binary) şifreli veri akışı.
     */
    static SplitCipherBlocks(CipherText) {
        let CipherTextBlocks = [];
        for (let i = 0; i < CipherText.length; i += 8) {
            let block = CipherText.substring(i, i + 8);
            CipherTextBlocks.push(block);
        }
        return CipherTextBlocks;
    }

    /**
     * PlainText'i 8 bitlik bloklara böler. Her blok, S-DES algoritmasının işleyebileceği şekilde ikilik (binary) formata dönüştürülür.
     * @param {string} PlainText - Bloklara ayrılacak olan düz metin. Her blok, S-DES algoritmasının işleyebileceği şekilde ikilik (binary) formata dönüştürülür.
     * @returns blokların listesi (Array) olarak döner.
     */
    static SplitPlainTextBlocks(PlainText) {
        let PlainTextBlocks = [];
        for (let i = 0; i < PlainText.length; i += 8) {
            let block = PlainText.substring(i, i + 8);
            PlainTextBlocks.push(block);
        }
        return PlainTextBlocks;
    }
    






    /**
     * İki ikilik (binary) metin dizisi üzerinde bit düzeyinde Özel Veya (Exclusive OR - XOR) işlemi uygular.
     * @param {string} input1 - XOR işlemine girecek birinci ikilik dizi.
     * @param {string} input2 - XOR işlemine girecek ikinci ikilik dizi.
     * @returns {string} XOR işlemi sonucunda oluşan yeni ikilik (binary) dizi.
     * @throws {Error} Girdi uzunlukları eşit değilse hata fırlatır.
     */
    static XOR(input1, input2) {
        if (input1.length !== input2.length) {
            throw new Error("HATA: XOR işlemi için girdi uzunlukları eşit olmalıdır.");
        }

        let result = "";
        for (let i = 0; i < input1.length; i++) {
            result += (input1[i] === input2[i]) ? '0' : '1';
        }
        return result;
    }

    /**
     * Verilen veri bloğunun bitlerini, belirtilen permütasyon tablosuna göre yeniden sıralar.
     * @param {string} inputData - Permütasyon uygulanacak ikilik (binary) veri bloğu.
     * @param {number[]} table - Bitlerin yeni konumlarını belirten referans şablonu (Dizi).
     * @returns {string} Şablona göre bitleri yeniden dizilmiş yeni ikilik (binary) veri bloğu.
     * @throws {Error} Girdi verisi boşsa veya uzunluğu şablonla eşleşmiyorsa hata fırlatır.
     */
    static Permutate(inputData, table) {
        if (!inputData || inputData.length < Math.max(...table)) {
            throw new Error("HATA: Permütasyon girdisi, şablon uzunluğu ile eşleşmiyor.");
        }
        
        let result = "";
        for (let i = 0; i < table.length; i++) {
            result += inputData[table[i] - 1]; 
        }
        return result;
    }

    /**
     * Verilen ikilik (binary) diziyi belirtilen miktar kadar dairesel olarak sola kaydırır (Circular Left Shift).
     * @param {string} input - Kaydırılacak olan ikilik (binary) dizi.
     * @param {number} count - Sola kaydırma işleminin kaç adım yapılacağı.
     * @returns {string} Dairesel sola kaydırılmış yeni ikilik (binary) dizi.
     */
    static LeftShift(input, count) {
        return input.substring(count) + input.substring(0, count);
    }
}