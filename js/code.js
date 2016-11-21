var RSA = {
    /*
        Sample of a public/private key pair that can be used for RSA
    */
    sampleKey: "Public key: n = 3233, e = 17\nPrivate key: d = 2753, n = 3233",

    /*
        Converts an array of chars (Ahem, a string.) into an array of unicode numbers.
    */
    toUnicode: function (charArray) {
        return charArray.map(function(item){
            return item.charCodeAt(0);
        });
    },

    /*
        Converts an array of unicode numbers into an array of chars.
    */
    fromUnicode: function(numberArray) {
        return numberArray.map(function(item) {
            return String.fromCharCode(item);
        });
    },

    /*
        Decrypts an array of numbers from RSA code
    */
    decryptRSA: function(numberArray, d, n) {
        return numberArray.map(function(item) {
            return RSA.expModulo(item, d, n);
        });
    },
    
    /*
        Encrypts an array of numbers using RSA
    */
    encryptRSA: function(message, n, e) {
        return message.map(function(item) {
           return RSA.expModulo(item, e, n); 
        });     
    },
    
    /*
        Transforms a string into an array of unicode characters, then encrypts it.
    */
    encryptMessage: function(message, n, e) {
        var numberCodedMessage = RSA.toUnicode(message.split(""));
        return RSA.encryptRSA(numberCodedMessage, n, e);
    },
    
    /*
        Unencrypts an array of unicode characters, then returns a string.
    */
    decryptMessage: function(message, d, n) {
        var decryptedNumberCodes = RSA.decryptRSA(message, d, n),
            decryptedArray = RSA.fromUnicode(decryptedNumberCodes),
            finalMessage = "";
        for(var i = 0; i < decryptedArray.length; i++) finalMessage += decryptedArray[i];
        return finalMessage;
        
    },
    
    /*
        Generates a public and private key pairs given 2 prime numbers.
    */
    generateKeys: function(p, q) {
        if(!(RSA.isPrime(p) && RSA.isPrime(q))) throw "p and q must be prime!"
        var n = p * q,
            totient = (p - 1)*(q - 1),
            e = 0,
            d = 0,
            loopStart;
        for(var i = Math.floor(Math.sqrt(totient)); i < totient && e == 0; i++) {
            if(RSA.isPrime(i) && totient % i != 0) {
                e = i;
            }
        }
        // Brute force the modular multiplicative inverse of e (modulo totient)
        for(var i = 0; d == 0; i++) {
            var mod = (i * e) % totient;
            if(mod == 1) d = i;
        } 
        return [n, e, d, n];        
    },
    
    /*
        Returns true if the given number is prime, else false
    */
    isPrime: function(n) {
        if( n <= 0 || n % 2 == 0 || n % 1 != 0) return false;
        for(var i = 3, upperLimit = Math.ceil(Math.sqrt(n)); i < upperLimit; i+=2) {
            if(n % i == 0) return false;
        } 
        return true;            
    },
    
    

    /*
        Calculates the modulo of a number using right to left exponentation by squaring.
        Since the numbers in this project are small, this is not quite needed, but we learned about it a few days ago and wanted to use it.
    */
    expModulo: function(number, exponent, modulo) {
        var binExp = RSA.dec2bin(exponent),
            result = 1
        base = number % modulo;
        for (var i = binExp.length - 1; i >= 0; i--) {
            if (binExp[i] == "1") result = (result * base) % modulo;
            base = (base * base) % modulo;
        }
        return result;

    },

    /*
        Converts a decimal number into its binary representation
    */
    dec2bin: function(number) {
        var bin = "";
        while (number > 0) {
            bin = (number % 2) + bin;
            number = Math.floor(number / 2);
        }
        return bin;
    }
}

var Walsh = {
    naturalMatrix: [[1, 1],
                    [1, -1]],

    activeMatrix:  [[1, 1],
                    [1, -1]],

    generateMatrix: function(codes) {
        if(Math.log2(codes) % 1 != 0) throw "The amount of codes must be a power of 2";
        if(codes < 2) throw "Minimum 2 codes are needed for CDMA";
        var base = JSON.parse(JSON.stringify(this.naturalMatrix)),
            finalMatrix = JSON.parse(JSON.stringify(base));
        for(var i = 1, limit = Math.log2(codes); i < limit; i++) {
            for(var j = 0; j < base.length; j++) {
                finalMatrix.push(JSON.parse(JSON.stringify(base[j])));           
                for(var k = 0; k < base[0].length; k++) {
                    var negBit = (base[j][k] == 1)? -1:1;
                    finalMatrix[j].push(base[j][k]);
                    finalMatrix[j+base.length].push(negBit);              
                }
            }
            base = JSON.parse(JSON.stringify(finalMatrix));
        }
        this.activeMatrix = JSON.parse(JSON.stringify(finalMatrix));
        return finalMatrix;
    },

    encode: function(messageArray) {
        var count = messageArray.length,
            matrix = this.generateMatrix(count),
            compositeSignal = [],
            longestMessage = 0;
        // Find the length of the longest message
        for(var i = 0; i < count; i++) {
            if(messageArray[i].length > longestMessage) {
                longestMessage = messageArray[i].length;
            }
        }
        // Prepare a signal long enough for all messages
        for(var i = 0; i < longestMessage * count; i++) {
            compositeSignal.push(0);   
        }      
        for(var i = 0; i < count; i++) {
            // For every letter
            for(var j = 0; j < messageArray[i].length; j++) {
                var char;
                if(typeof(messageArray[i]) === "string") char = messageArray[i].charCodeAt(j);
                else char = messageArray[i][j];
                // Multiply by the code and add to the composite signal
                for(var k = 0; k < count; k++) {
                    compositeSignal[k + j*count] += char * matrix[i][k];
                }
            }
        }
        return compositeSignal;          
    },

    decode: function(compositeSignal, speakerNumber) {
        var count = compositeSignal.length,
        matrix = this.generateMatrix(speakerNumber),
        maxCharacters = count / speakerNumber,
        messages = [];
        
        // For every message
        for(var i = 0; i < speakerNumber; i++) {
            messages.push("");
            // For every character
            for(var j = 0; j < maxCharacters; j++) {
                var extractedSignal = [],
                    extractedChar;
                // For every code
                for(var k = 0; k < speakerNumber; k++) {
                    extractedSignal.push(0);
                    extractedSignal[k] = compositeSignal[k + speakerNumber*j] * matrix[i][k];
                }
                extractedChar = String.fromCharCode(this.arraySum(extractedSignal) / extractedSignal.length);
                messages[i] += extractedChar;
            }
        }
        return messages;
    },

    arraySum: function(array) {
        var sum = 0;
        for(var i = 0; i < array.length; i++) {
            sum+= array[i];
        }
        return sum;
    }
}