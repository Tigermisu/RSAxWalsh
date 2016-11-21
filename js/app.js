$('.modal').modal();

$('#generateKeyButton').click(function () {
    var p = $('#prime-p').val(),
        q = $('#prime-q').val(),
        keys;
    if (p >= 5000 || q >= 5000) {
        return showError("Please chose values under 5,000");
    }
    if (!RSA.isPrime(p)) {
        return showError("p must be a prime number!");
    }
    if (!RSA.isPrime(q)) {
        return showError("q must be a prime number!");
    }
    keys = RSA.generateKeys(p, q);
    $('#rsa-n').val(keys[0]);
    $('#rsa-e').val(keys[1]);
    $('#rsa-d').val(keys[2]);
    $('#rsa-n-private').val(keys[3]);
    Materialize.updateTextFields();
});

$('#encryptButton').click(function () {
    var message = $("#encryptRsa").val(),
        n = parseInt($('#rsa-n').val()),
        e = parseInt($('#rsa-e').val()),
        encrypted = RSA.encryptMessage(message, n, e),
        str = "";
    if (message != "") {
        for (var i = 0; i < encrypted.length; i++) {
            str += encrypted[i];
            if (i < encrypted.length - 1) str += ", ";
        }
        $("#decryptRsa").val(str).trigger('autoresize');
        $("#encryptRsa").val("").trigger('autoresize');
    }

    Materialize.updateTextFields();
});

$('#decryptButton').click(function () {
    var values = $("#decryptRsa").val(),
        d = parseInt($('#rsa-d').val()),
        n = parseInt($('#rsa-n-private').val());

    if (values != "") {
        values = values.split(",").map(function (item) {
            return parseInt(item);
        })
        values = RSA.decryptMessage(values, d, n);
        $("#encryptRsa").val(values).trigger('autoresize');
        $("#decryptRsa").val("").trigger('autoresize');
    }

    Materialize.updateTextFields();
});

$("#generateWalshButton").click(function () {
    var size = parseInt($("#walshNumber").val()),
        matrix;
    if (size > 16) return showError("Please use at most 16 codes");
    if (size != $('.walsh-input').length) {
        try {
            matrix = Walsh.generateMatrix(size);
            $('#walshMatrix').html('');
            $('#walshInputs').html('');
            for (var i = 0; i < matrix.length; i++) {
                var p = "<p>",
                    input = "<div class='input-field col s12 m6'><input id='walsh" + i + "' type='text' class='walsh-input'>";
                input += "<label for='walsh" + i + "'>Message " + (i + 1) + "</label></div>";
                for (var j = 0; j < matrix.length; j++) {
                    if (matrix[i][j] == 1) p += "&nbsp;";
                    p += matrix[i][j];
                    if (j < matrix.length - 1) p += " ";
                }
                $('#walshMatrix').append(p + "</p>");
                $('#walshInputs').append(input);
            }
            $('#walshMeta').html("W(" + size + ") = ");
            $('#compositeSignal').val("").trigger('autoresize');

        } catch (e) {
            showError(e);
        }
    }
});

$('#encodeButton').click(function () {
    var messages = [],
        compositeSignal = [],
        str = "";
    $('.walsh-input').each(function (index, item) {
        messages.push($(item).val());
    });
    compositeSignal = Walsh.encode(messages);
    for (var i = 0; i < compositeSignal.length; i++) {
        str += compositeSignal[i];
        if (i < compositeSignal.length - 1) str += ", ";
    }

    $("#compositeSignal").val(str).trigger('autoresize');
    $(".walsh-input").val("");

    Materialize.updateTextFields();
});

$("#decodeButton").click(function () {
    var compositeSignal = $("#compositeSignal").val(),
        messages = [],
        speakers = $(".walsh-input").length;

    if (compositeSignal != "") {
        compositeSignal = compositeSignal.split(",").map(function (item) {
            return parseInt(item);
        });
        messages = Walsh.decode(compositeSignal, speakers);
        $("#compositeSignal").val("").trigger('autoresize');
        for (var i = 0; i < messages.length; i++) {
            $('.walsh-input').eq(i).val(messages[i]);
        }
    }

    Materialize.updateTextFields();
});

var RxW = {
    encryptedMessages: [],
    encodedSignal: [],

    bindEvents: function () {
        $('#beginRxw').click(function () {
            $('#rxw input').val("");
            $('#rxw textarea').val("").trigger('autoresize');
            RxW.encryptedMessages = [];
            RxW.encodedSignal = [];
            Materialize.updateTextFields();
            RxW.swap(0, 1);
        });

        $('#transmitRxw').click(function () {
            $('.rxw-state.1 input').each(function (index, item) {
                var encryptedMsg = RSA.encryptMessage($(item).val(), 3233, 17),
                    cleanMsg = RxW.arrayToString(encryptedMsg);
                RxW.encryptedMessages.push(encryptedMsg);
                $('.rxw-encrypted').eq(index).text(cleanMsg);
                if (index == 0) {
                    $('.rxw-alice-encrypted').text(cleanMsg);
                    $('.rxw-alice-bad').text(RSA.decryptMessage(encryptedMsg, 17, 3233));
                }
            });

            RxW.swap(1, 2);
        });

        $('#walshRxw').click(function () {
            var cdma = Walsh.encode(RxW.encryptedMessages);
            $('.rxw-cdma').text(RxW.arrayToString(cdma));
            RxW.swap(2, 3);
        });

        $('#receiveRxw').click(function () {
            $('#rxwOutput span').eq(1).text(RSA.decryptMessage(RxW.encryptedMessages[0], 2753, 3233));
            $('#rxwOutput span').eq(3).text(RSA.decryptMessage(RxW.encryptedMessages[1], 2753, 3233));
            $('#rxwOutput span').eq(0).text(RSA.decryptMessage(RxW.encryptedMessages[2], 2753, 3233));
            $('#rxwOutput span').eq(2).text(RSA.decryptMessage(RxW.encryptedMessages[3], 2753, 3233));
            RxW.swap(3, 4);
        });

        $('#finishRxw').click(function () {
            $('.rxw-state.4').addClass('fade-out');
            setTimeout(function () {
                RxW.swap(4, 0);
            }, 1000);
            setTimeout(function () {
                $('.rxw-state.4').removeClass('fade-out');
            }, 1700);
        });
    },

    arrayToString: function (array) {
        var str = "";
        for (var i = 0; i < array.length; i++) {
            str += array[i];
            if (i < array.length - 1) str += ", ";
        }
        return str;
    },

    swap: function (exits, arrives) {
        $('.rxw-state.' + exits).addClass("exit");
        $(".rxw-state." + arrives).addClass("entry");
        setTimeout(function () {
            $(".rxw-state." + arrives).removeClass("inactive");
            setTimeout(function () {
                $(".rxw-state." + arrives).removeClass("entry");
            }, 35);
        }, 10);
        setTimeout(function () {
            $(".rxw-state." + exits).addClass("inactive").removeClass('exit');
        }, 510);
    }
}

function showError(errorMessage) {
    $('#errorMessage').text(errorMessage);
    $('#errorModal').modal('open');
}

RxW.bindEvents();