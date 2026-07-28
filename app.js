// ================= KONFIGURASI =================
var GOOGLE_APPS_SCRIPT_WEBHOOK = "https://script.google.com/macros/s/AKfycbz3sB1d0PRRzlvAJwdr8nl5dQa6qpyfHQCJbYxBMz0Jpj2o-i1_WnwMzJEy3Z4GA9uh/exec";
var TARGET_LAPORAN = 9;

// ================= VARIABEL GLOBAL =================
var img = new Image();
var selectedDesa = "";
var kordinatList = [];
var currentKoordinat = "";
var tanggalWaktu = "";
var submissionCount = 0;
var submittedDates = [];
var desaCounter = {};
var attendanceData = [];
var deferredPrompt = null;

var currentApp = null;
var isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ================= SPLASH SCREEN =================
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM Content Loaded");
    var splashScreen = document.getElementById('splashScreen');
    var appContainer = document.getElementById('appContainer');
    var progressBar = document.getElementById('splashProgressBar');
    var progressText = document.getElementById('progressPercentage');

    if (!splashScreen) return;

    var progress = 0;
    var isAppOpened = false;

    function updateProgress(value, message) {
        progress = Math.min(value, 100);
        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = Math.round(progress) + '%';
        console.log("Progress: " + progress + "% - " + message);

        if (progress >= 75 && progress < 98) {
            var tp = (progress - 75) / (98 - 75);
            splashScreen.style.opacity = 1 - tp;
            appContainer.style.opacity = tp;
            appContainer.style.display = 'block';
        }
        if (progress >= 98) {
            splashScreen.style.opacity = 0;
            splashScreen.style.pointerEvents = 'none';
            appContainer.style.opacity = 1;
            appContainer.style.display = 'block';
        }
        if (progress >= 100 && !isAppOpened) {
            isAppOpened = true;
            setTimeout(function() {
                splashScreen.style.display = 'none';
                loadDukopsApp();
            }, 200);
        }
    }

    var stages = [
        { percent: 33, message: "Memuat sistem..." },
        { percent: 66, message: "Menyiapkan aplikasi..." },
        { percent: 100, message: "Aplikasi Siap digunakan" }
    ];
    var idx = 0;
    var delay = isMobileDevice ? 400 : 800;

    function nextStage() {
        if (idx >= stages.length) return;
        var s = stages[idx];
        updateProgress(s.percent, s.message);
        idx++;
        setTimeout(nextStage, delay);
    }
    nextStage();
});

// ================= XHR HELPERS (ES5) =================
function xhrGet(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    callback(null, data);
                } catch (e) {
                    callback(e, null);
                }
            } else {
                callback(new Error('HTTP ' + xhr.status), null);
            }
        }
    };
    xhr.onerror = function() {
        callback(new Error('Network error'), null);
    };
    xhr.send();
}

function xhrPost(url, formData, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    callback(null, data);
                } catch (e) {
                    callback(e, null);
                }
            } else {
                callback(new Error('HTTP ' + xhr.status), null);
            }
        }
    };
    xhr.onerror = function() {
        callback(new Error('Network error'), null);
    };
    xhr.send(formData);
}

// ================= LOAD APP =================
function loadDukopsApp() {
    currentApp = 'dukops';
    showApp();
    initializeApp();
}

function showApp() {
    var splash = document.getElementById('splashScreen');
    var app = document.getElementById('appContainer');
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.8s ease';
    setTimeout(function() {
        splash.style.display = 'none';
        app.style.display = 'block';
        setTimeout(function() {
            app.style.opacity = '1';
            if (currentApp === 'dukops') {
                document.getElementById('btnDukops').className += ' active';
                document.getElementById('dukopsContent').style.display = 'block';
                document.getElementById('absenContent').style.display = 'none';
                document.getElementById('hanpanganContent').style.display = 'none';
                document.getElementById('hanpanganContent').className = '';
            } else {
                document.getElementById('btnDukops').className = document.getElementById('btnDukops').className.replace(' active', '');
                document.getElementById('dukopsContent').style.display = 'none';
                document.getElementById('absenContent').style.display = 'block';
                document.getElementById('hanpanganContent').style.display = 'none';
                document.getElementById('hanpanganContent').className = '';
            }
        }, 100);
    }, 800);
}

// ================= NAVIGASI TAB =================
window.showDukops = function() {
    document.getElementById('dukopsContent').style.display = 'block';
    document.getElementById('absenContent').style.display = 'none';
    document.getElementById('hanpanganContent').style.display = 'none';
    document.getElementById('hanpanganContent').className = '';
    document.getElementById('btnDukops').className += ' active';
    document.getElementById('btnAbsen').className = document.getElementById('btnAbsen').className.replace(' active', '');
    document.getElementById('btnHanpangan').className = document.getElementById('btnHanpangan').className.replace(' active', '');
    currentApp = 'dukops';
};

window.showAbsenTab = function() {
    document.getElementById('dukopsContent').style.display = 'none';
    document.getElementById('absenContent').style.display = 'block';
    document.getElementById('hanpanganContent').style.display = 'none';
    document.getElementById('hanpanganContent').className = '';
    document.getElementById('btnDukops').className = document.getElementById('btnDukops').className.replace(' active', '');
    document.getElementById('btnAbsen').className += ' active';
    document.getElementById('btnHanpangan').className = document.getElementById('btnHanpangan').className.replace(' active', '');
    if (typeof loadAbsenTahun === 'function') loadAbsenTahun();
};

window.showHanpangan = function() {
    document.getElementById('dukopsContent').style.display = 'none';
    document.getElementById('absenContent').style.display = 'none';
    document.getElementById('hanpanganContent').style.display = 'block';
    document.getElementById('hanpanganContent').className = 'active';
    document.getElementById('btnDukops').className = document.getElementById('btnDukops').className.replace(' active', '');
    document.getElementById('btnAbsen').className = document.getElementById('btnAbsen').className.replace(' active', '');
    document.getElementById('btnHanpangan').className += ' active';
};

// ================= BACKEND =================
function sendToBackend(action, data, callback) {
    if (!callback) callback = function() {};

    if (action === 'listFiles' || action === 'getConfig' || action === 'test' || action === 'telegramTest') {
        var url = GOOGLE_APPS_SCRIPT_WEBHOOK + '?action=' + action;
        if (data && data.desaFilter) url += '&desaFilter=' + encodeURIComponent(data.desaFilter);
        if (data && data.monthFilter) url += '&monthFilter=' + encodeURIComponent(data.monthFilter);
        if (data && data.readZips) url += '&readZips=true';

        xhrGet(url, function(err, result) {
            if (err) {
                callback({ success: false, error: err.message });
            } else {
                callback(result);
            }
        });
        return;
    }

    // POST actions
    var formData = new FormData();
    formData.append('action', action);
    if (data) {
        for (var key in data) {
            if (data.hasOwnProperty(key) && data[key] !== undefined && data[key] !== null) {
                if (key === 'fileData' && typeof data[key] === 'string') {
                    formData.append(key, data[key]);
                } else {
                    formData.append(key, String(data[key]));
                }
            }
        }
    }

    xhrPost(GOOGLE_APPS_SCRIPT_WEBHOOK, formData, function(err, result) {
        if (err) {
            callback({ success: false, error: err.message });
        } else {
            callback(result);
        }
    });
}

function uploadToGoogleDrive(zipBlob, zipFileName, desaName, date, callback) {
    if (!callback) callback = function() {};
    blobToBase64(zipBlob, function(base64Data) {
        var desaInfo = normalizeDesaName(desaName);
        sendToBackend('uploadDrive', {
            fileName: zipFileName,
            desaName: desaInfo.cleanName,
            fileData: base64Data,
            year: date.getFullYear().toString(),
            month: date.toLocaleDateString('id-ID', { month: 'long' }),
            desa: desaInfo.cleanName,
            mimeType: 'application/zip'
        }, function(result) {
            callback(result && result.success === true);
        });
    });
}

function sendZipToTelegram(zipBlob, filename, desaName, callback) {
    if (!callback) callback = function() {};
    blobToBase64(zipBlob, function(base64Data) {
        var desaInfo = normalizeDesaName(desaName);
        sendToBackend('sendTelegram', {
            fileName: filename,
            desaName: desaInfo.cleanName,
            fileData: base64Data,
            mimeType: 'application/zip'
        }, function(result) {
            callback(result && result.success === true);
        });
    });
}

function blobToBase64(blob, callback) {
    var reader = new FileReader();
    reader.onloadend = function() {
        callback(reader.result.split(',')[1]);
    };
    reader.readAsDataURL(blob);
}

// ================= PWA INSTALL =================
function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(function() {
            var btn = document.getElementById('installButton');
            if (btn) {
                btn.style.display = 'flex';
                btn.addEventListener('click', function() {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then(function(choiceResult) {
                            if (choiceResult.outcome === 'accepted') {
                                btn.style.display = 'none';
                                showNotification('✅ Aplikasi berhasil diinstall!', 'success');
                            }
                            deferredPrompt = null;
                        });
                    }
                });
            }
        }, 3000);
    });
    window.addEventListener('appinstalled', function() {
        var btn = document.getElementById('installButton');
        if (btn) btn.style.display = 'none';
        deferredPrompt = null;
    });
}

// ================= FUNGSI DUKOPS =================
function initializeApp() {
    console.log("🔄 Initializing DUKOPS app...");
    try {
        var savedCount = localStorage.getItem('dukopsSubmissionCount');
        submissionCount = savedCount ? parseInt(savedCount, 10) : 0;
        document.getElementById('submissionCounter').textContent = submissionCount;
        if (submissionCount > 0) {
            document.getElementById('submissionCounter').style.display = 'inline-block';
        }

        loadDesaList();
        loadLastSubmittedDates();
        loadDesaCounter();

        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1);
        if (month.length === 1) month = '0' + month;
        var day = String(now.getDate());
        if (day.length === 1) day = '0' + day;
        var hours = String(now.getHours());
        if (hours.length === 1) hours = '0' + hours;
        var minutes = String(now.getMinutes());
        if (minutes.length === 1) minutes = '0' + minutes;
        document.getElementById('tanggalWaktu').value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
        updateDatePreview();

        setupInstallPrompt();
        resetCanvas();

        setTimeout(function() {
            showNotification('✅ Sistem DUKOPS BABINSA siap digunakan!', 'success');
        }, 500);

        console.log("✅ DUKOPS App initialized successfully");
    } catch (error) {
        console.error("❌ Error initializing DUKOPS app:", error);
        showNotification('❌ Gagal memuat aplikasi DUKOPS', 'error');
    }
}

function loadDesaList() {
    var select = document.getElementById('selectDesa');
    var loading = document.getElementById('loadingDesa');
    if (!select) return;
    loading.style.display = 'block';

    xhrGet('data/desa-list.json?t=' + Date.now(), function(err, data) {
        loading.style.display = 'none';
        if (err) {
            console.error("❌ Error loading desa list:", err);
            select.innerHTML = '<option value="">-- Gagal memuat desa --</option>';
            select.disabled = true;
            showNotification('❌ Gagal memuat daftar desa. Periksa koneksi.', 'error');
            return;
        }

        var desaList = data.desaList || [];
        select.innerHTML = '<option value="">-- Pilih Desa --</option>';
        for (var i = 0; i < desaList.length; i++) {
            var option = document.createElement('option');
            var jsonPath = 'data/coordinates/' + desaList[i] + '.json';
            option.value = jsonPath;
            option.textContent = normalizeDesaName(desaList[i]).cleanName;
            option.setAttribute('data-raw-name', desaList[i]);
            select.appendChild(option);
        }
        console.log("✅ Loaded " + desaList.length + " desas from server");
        showNotification('✅ Daftar desa berhasil dimuat', 'success');
    });
}

function normalizeDesaName(desaName) {
    if (!desaName) return { original: "", normalized: "", forTelegram: "", cleanName: "" };
    var normalized = desaName.replace(/^Desa\s+/i, '').replace(/^Kelurahan\s+/i, '').replace(/Kel\.\s*/gi, '').replace(/Kel\s/gi, '').trim();
    var forTelegram = normalized.replace(/_/g, ' ');
    return {
        original: desaName,
        normalized: normalized,
        forTelegram: forTelegram,
        cleanName: forTelegram.trim()
    };
}

function loadSelectedDesa() {
    var select = document.getElementById('selectDesa');
    var jsonPath = select.value;
    var loading = document.getElementById('loadingKoordinat');

    if (!jsonPath) {
        resetForm();
        return;
    }

    var selectedOption = select.options[select.selectedIndex];
    selectedDesa = selectedOption.getAttribute('data-raw-name') || selectedOption.text;

    updateDesaHeaderImage(selectedDesa);
    updateAttendanceButtonState();
    updateAttendanceSelectedDesaLabel();

    if (document.getElementById('attendancePanel') && document.getElementById('attendancePanel').style.display === 'block') {
        loadAttendanceData();
    }

    var desaInfo = normalizeDesaName(selectedDesa);
    document.getElementById('previewDesa').textContent = desaInfo.cleanName;
    document.getElementById('previewDesa').style.display = 'block';

    var fotoLabel = document.getElementById('labelFotoKegiatan');
    if (fotoLabel) fotoLabel.innerHTML = '<i class="fas fa-camera"></i> Foto Kegiatan: ' + desaInfo.cleanName;

    loading.style.display = 'block';
    document.getElementById('previewKordinat').textContent = "Memuat koordinat...";

    xhrGet(jsonPath + '?t=' + Date.now(), function(err, jsonData) {
        loading.style.display = 'none';
        if (err) {
            console.error("❌ Error loading coordinates:", err);
            document.getElementById('previewKordinat').textContent = "Gagal memuat koordinat";
            showNotification("Gagal memuat koordinat: " + err.message, "error");
            return;
        }

        if (!jsonData.coordinates || !Array.isArray(jsonData.coordinates)) {
            document.getElementById('previewKordinat').textContent = "Format JSON koordinat tidak valid";
            showNotification("Format JSON koordinat tidak valid", "error");
            return;
        }

        kordinatList = [];
        for (var i = 0; i < jsonData.coordinates.length; i++) {
            var coord = jsonData.coordinates[i];
            kordinatList.push(coord.lat + ',' + coord.lon + ',' + coord.elevation);
        }

        console.log("📌 Loaded " + kordinatList.length + " coordinates");
        if (kordinatList.length === 0) {
            document.getElementById('previewKordinat').textContent = "File koordinat kosong";
            showNotification("File koordinat kosong", "warning");
            return;
        }
        pickRandomKoordinat();
        showNotification("Koordinat " + desaInfo.cleanName + " dimuat (" + kordinatList.length + " titik)", "success");
        updatePreview();
        checkInputCompletion();
    });
}

function pickRandomKoordinat() {
    if (kordinatList.length === 0) {
        showNotification("Tidak ada data koordinat tersedia", "warning");
        return;
    }
    if (!selectedDesa) {
        showNotification("Pilih desa terlebih dahulu", "warning");
        return;
    }
    var coordElement = document.getElementById('previewKordinat');
    coordElement.style.transition = "opacity 0.3s";
    coordElement.style.opacity = "0";
    setTimeout(function() {
        var randomIndex = Math.floor(Math.random() * kordinatList.length);
        currentKoordinat = kordinatList[randomIndex];
        coordElement.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + currentKoordinat;
        setTimeout(function() { coordElement.style.opacity = "1"; }, 50);
        updatePreview();
        checkInputCompletion();
    }, 300);
}

function previewImage() {
    var fileInput = document.getElementById("gambar");
    var preview = document.getElementById("previewGambar");
    var file = fileInput.files[0];

    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                try {
                    if (img.height > img.width) {
                        fileInput.value = "";
                        if (preview) preview.textContent = "";
                        img = new Image();
                        showNotification("Foto portrait tidak diperbolehkan. Gunakan foto landscape.", "warning");
                        checkInputCompletion();
                        return;
                    }
                } catch (e) {}
                if (kordinatList.length > 0) pickRandomKoordinat();
                preview.textContent = file.name;
                updatePreview();
            };
            img.onerror = function() {
                showNotification("Gagal memuat gambar", "error");
                fileInput.value = "";
                preview.textContent = "";
            };
        };
        reader.onerror = function() { showNotification("Gagal membaca file", "error"); };
        reader.readAsDataURL(file);
    } else {
        img = new Image();
        updatePreview();
    }
    checkInputCompletion();
}

function updateDatePreview() {
    var tglInput = document.getElementById("tanggalWaktu").value;
    var label = document.getElementById('tanggalWaktuLabelText');

    if (tglInput) {
        var date = new Date(tglInput);
        date.setSeconds(Math.floor(Math.random() * 60));
        tanggalWaktu = date.toISOString();
        var options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        var displayText = date.toLocaleString('id-ID', options).replace(/:/g, '.');
        if (label) label.textContent = displayText;
    } else {
        tanggalWaktu = "";
        if (label) label.textContent = 'Pilih tanggal & waktu';
    }
    updatePreview();
    checkInputCompletion();
}

function updatePreview() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    if (img.src && img.complete) {
        canvas.width = 800;
        canvas.height = Math.round(canvas.width * (img.height / img.width));
    } else {
        canvas.width = 800;
        canvas.height = Math.round(canvas.width * (9 / 16));
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (img.src && img.complete) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (selectedDesa || currentKoordinat || tanggalWaktu) {
        ctx.textAlign = "right";
        ctx.font = "36px Arial";
        var bottomMargin = 20;
        var lineHeight = 40;
        var rightMargin = 10;

        if (selectedDesa) {
            var desaInfo = normalizeDesaName(selectedDesa);
            var displayDesaName = desaInfo.cleanName;
            var watermarkText = (displayDesaName === "Sukasada" || displayDesaName === "SUKASADA")
                ? "Babinsa Kelurahan Sukasada"
                : "Babinsa " + displayDesaName;
            ctx.fillStyle = "white";
            ctx.fillText(watermarkText, canvas.width - rightMargin, canvas.height - bottomMargin - (lineHeight * 2));
        }

        if (currentKoordinat) {
            ctx.fillStyle = "white";
            ctx.fillText(currentKoordinat, canvas.width - rightMargin, canvas.height - bottomMargin - lineHeight);
        }

        if (tanggalWaktu) {
            var date = new Date(tanggalWaktu);
            var dateText = date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) +
                ", " + date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            ctx.fillStyle = "white";
            ctx.fillText(dateText, canvas.width - rightMargin, canvas.height - bottomMargin);
        }
    }
}

function processSubmission() {
    if (!validateSubmission()) return;
    if (isSameDateMonthSubmission()) {
        showNotification("⚠ Sudah ada laporan di tanggal dan bulan yang sama!", "warning");
        return;
    }

    var button = document.getElementById("submitBtn");
    var originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

    try {
        var canvas = document.getElementById("canvas");
        var imgData = canvas.toDataURL("image/png");
        var narasi = document.getElementById("narasi").value;
        var date = new Date(tanggalWaktu);

        var day = String(date.getDate());
        if (day.length === 1) day = '0' + day;
        var monthNum = String(date.getMonth() + 1);
        var monthName = date.toLocaleDateString('id-ID', { month: 'long' });
        var year = date.getFullYear();

        var desaInfo = normalizeDesaName(selectedDesa);

        var fileNameInsideZipImage = desaInfo.cleanName + ' ' + day + ' ' + monthName + ' ' + year + ' Dukops.png';
        var fileNameInsideZipNarasi = desaInfo.cleanName + ' ' + day + ' ' + monthName + ' ' + year + ' Narasi.txt';
        var zipFileNameForDownload = desaInfo.cleanName + ' ' + day + ' ' + monthNum + ' ' + year + '.zip';
        var zipFileNameForBackend = desaInfo.cleanName + ' ' + day + ' ' + monthNum + ' ' + year + '.zip';

        var formattedDate = date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        var narasiContent = formattedDate + '\tBabinsa ' + desaInfo.cleanName + ' ' + narasi;

        var zip = new JSZip();
        zip.file(fileNameInsideZipNarasi, narasiContent);
        zip.file(fileNameInsideZipImage, imgData.split("base64,")[1], { base64: true });

        zip.generateAsync({ type: "blob" }).then(function(content) {
            // Download
            var a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = zipFileNameForDownload;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Kirim Telegram
            sendZipToTelegram(content, zipFileNameForBackend, selectedDesa, function(success) {
                // Upload Drive
                uploadToGoogleDrive(content, zipFileNameForBackend, selectedDesa, date, function(driveUploaded) {
                    var desaData = updateDesaCounter(selectedDesa, zipFileNameForBackend);

                    if (document.getElementById('attendancePanel').style.display === 'block') {
                        setTimeout(function() { loadAttendanceData(); }, 2000);
                    }

                    if (driveUploaded) {
                        showNotification('✔ Laporan berhasil disimpan (' + desaData.count + '/' + TARGET_LAPORAN + ' laporan)', "success");
                    } else {
                        showNotification('⚠ Laporan hanya didownload, gagal simpan ke Drive', "warning");
                    }

                    if (desaData.count >= 9) {
                        showThankYouPopup(desaInfo.cleanName, desaData.count);
                        sendThankYouTelegram(desaInfo.cleanName, desaData.count);
                    }

                    updateCounter();
                    saveSubmittedDate(tanggalWaktu);

                    button.disabled = false;
                    button.innerHTML = originalText;
                });
            });
        }).catch(function(error) {
            console.error("Error:", error);
            showNotification("❌ Gagal mengirim laporan", "error");
            button.disabled = false;
            button.innerHTML = originalText;
        });

    } catch (error) {
        console.error("Error:", error);
        showNotification("❌ Gagal mengirim laporan", "error");
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

function validateSubmission() {
    if (!selectedDesa) { showNotification("Masukkan nama desa terlebih dahulu", "warning"); return false; }
    if (!currentKoordinat) { showNotification("Koordinat tidak valid", "warning"); return false; }
    if (!tanggalWaktu) { showNotification("Isi tanggal dan waktu", "warning"); return false; }
    if (!img.src || !img.complete) { showNotification("Upload foto kegiatan", "warning"); return false; }
    var narasi = document.getElementById("narasi").value.trim();
    if (!narasi) { showNotification("Isi narasi kegiatan", "warning"); return false; }

    var desaInfo = normalizeDesaName(selectedDesa);
    var date = new Date(tanggalWaktu);
    var day = String(date.getDate());
    if (day.length === 1) day = '0' + day;
    var monthName = date.toLocaleDateString('id-ID', { month: 'long' });
    var monthNum = String(date.getMonth() + 1);
    var year = date.getFullYear();

    var confirmMsg = "Anda yakin ingin mengirim laporan untuk " + desaInfo.cleanName + "?\n\n";
    confirmMsg += "File ZIP akan:\n";
    confirmMsg += "1. Didownload: " + desaInfo.cleanName + " " + day + " " + monthNum + " " + year + ".zip\n";
    confirmMsg += "2. Berisi file:\n   - " + desaInfo.cleanName + " " + day + " " + monthName + " " + year + " Dukops.png\n";
    confirmMsg += "   - " + desaInfo.cleanName + " " + day + " " + monthName + " " + year + " Narasi.txt\n";
    confirmMsg += "3. Dikirim ke Telegram & Drive: " + desaInfo.cleanName + " " + day + " " + monthNum + " " + year + ".zip";

    return confirm(confirmMsg);
}

function isSameDateMonthSubmission() {
    if (!tanggalWaktu) return false;
    var currentDate = new Date(tanggalWaktu);
    var currentDay = currentDate.getDate();
    var currentMonth = currentDate.getMonth();
    for (var i = 0; i < submittedDates.length; i++) {
        var date = new Date(submittedDates[i]);
        if (date.getDate() === currentDay && date.getMonth() === currentMonth) {
            return true;
        }
    }
    return false;
}

function resetCanvas() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = Math.round(canvas.width / (16 / 9));
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function resetAll() {
    if (confirm("Apakah Anda yakin ingin mereset SEMUA data?\n\n• Counter laporan terkirim\n• Log pengiriman\n• Tanggal terakhir\n• Counter per desa\n• Form input\n\nAksi ini tidak dapat dibatalkan!")) {
        submissionCount = 0;
        document.getElementById('submissionCounter').textContent = '0';
        localStorage.setItem('dukopsSubmissionCount', '0');
        submittedDates = [];
        localStorage.removeItem('dukopsSubmittedDates');
        desaCounter = {};
        localStorage.removeItem('dukopsDesaCounter');
        resetForm();
        showNotification("Semua data telah direset", "success");
    }
}

function resetForm() {
    selectedDesa = "";
    kordinatList = [];
    currentKoordinat = "";
    document.getElementById('selectDesa').value = "";
    document.getElementById('previewDesa').textContent = "";
    document.getElementById('previewKordinat').textContent = "";
    document.getElementById('narasi').value = "";
    document.getElementById('gambar').value = "";
    document.getElementById('tanggalWaktu').value = "";
    var label = document.getElementById('tanggalWaktuLabelText');
    if (label) label.textContent = 'Pilih tanggal & waktu';
    document.getElementById('previewGambar').textContent = "";
    updateDesaHeaderImage("");
    checkInputCompletion();
    updatePreview();
    resetCanvas();
}

function loadDesaCounter() {
    var saved = localStorage.getItem('dukopsDesaCounter');
    desaCounter = saved ? JSON.parse(saved) : {};
}

function updateCounter() {
    submissionCount++;
    document.getElementById('submissionCounter').textContent = submissionCount;
    document.getElementById('submissionCounter').style.display = 'inline-block';
    localStorage.setItem('dukopsSubmissionCount', submissionCount.toString());
}

function updateDesaCounter(desaName, fileName) {
    var date = new Date(tanggalWaktu);
    var monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    if (!desaCounter[desaName]) {
        desaCounter[desaName] = { count: 0, files: [], month: monthYear };
    }

    if (desaCounter[desaName].month !== monthYear) {
        desaCounter[desaName] = { count: 1, files: [fileName], month: monthYear };
    } else {
        desaCounter[desaName].count++;
        desaCounter[desaName].files.push(fileName);
        if (desaCounter[desaName].files.length > TARGET_LAPORAN) {
            desaCounter[desaName].files.shift();
        }
    }

    localStorage.setItem('dukopsDesaCounter', JSON.stringify(desaCounter));
    return desaCounter[desaName];
}

function saveSubmittedDate(dateStr) {
    submittedDates.push(dateStr);
    localStorage.setItem('dukopsSubmittedDates', JSON.stringify(submittedDates));
}

function loadLastSubmittedDates() {
    var saved = localStorage.getItem('dukopsSubmittedDates');
    submittedDates = saved ? JSON.parse(saved) : [];
}

function checkInputCompletion() {
    var isComplete = selectedDesa &&
        currentKoordinat &&
        tanggalWaktu &&
        img.src &&
        img.complete &&
        document.getElementById("narasi").value.trim();

    var submitBtn = document.getElementById("submitBtn");
    if (submitBtn) submitBtn.disabled = !isComplete;
    updateAttendanceButtonState();
}

function updateAttendanceButtonState() {
    var btn = document.getElementById('showAttendanceBtn');
    if (btn) btn.disabled = !selectedDesa;
}

function updateAttendanceSelectedDesaLabel() {
    var label = document.getElementById('attendanceSelectedDesaName');
    if (label) label.textContent = selectedDesa ? normalizeDesaName(selectedDesa).cleanName : 'Silahkan Pilih Desa';
}

function autoResizeNarasi(target) {
    var textarea = target instanceof HTMLTextAreaElement ? target : document.getElementById('narasi');
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.overflowY = 'hidden';
    var desiredHeight = Math.max(textarea.scrollHeight, textarea.offsetHeight);
    textarea.style.height = desiredHeight + 'px';
    textarea.style.minHeight = '150px';
}

function updateDesaHeaderImage(desaName) {
    var headerImage = document.getElementById('desaProfileImgHeader');
    if (!headerImage) return;
    var defaultUrl = 'icons/favicon-96x96.png';
    if (!desaName) {
        headerImage.src = defaultUrl;
        return;
    }
    var desaInfo = normalizeDesaName(desaName);
    var imageName = desaInfo.normalized;
    var localUrl = 'profile/' + imageName + '.png';
    headerImage.src = localUrl;
}

// ================= FUNGSI ABSENSI =================
function showAttendance() {
    var panel = document.getElementById('attendancePanel');
    var button = document.getElementById('showAttendanceBtn');
    if (panel && button) {
        panel.style.display = 'block';
        button.style.display = 'none';
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1);
        if (month.length === 1) month = '0' + month;
        document.getElementById('attendanceMonthFilter').value = year + '-' + month;
        updateAttendanceSelectedDesaLabel();
        loadAttendanceData();
    }
}

function hideAttendance() {
    var panel = document.getElementById('attendancePanel');
    var button = document.getElementById('showAttendanceBtn');
    if (panel && button) {
        panel.style.display = 'none';
        button.style.display = 'block';
    }
}

function loadAttendanceData() {
    var loading = document.getElementById('attendanceLoading');
    var list = document.getElementById('attendanceList');
    var summary = document.getElementById('attendanceSummary');
    if (!loading || !list) return;

    loading.style.display = 'block';
    list.innerHTML = '';
    if (summary) summary.style.display = 'none';

    var desaFilter = selectedDesa ? normalizeDesaName(selectedDesa).cleanName : '';
    var monthFilter = document.getElementById('attendanceMonthFilter').value;

    sendToBackend('listFiles', {
        desaFilter: desaFilter,
        monthFilter: monthFilter,
        readZips: 'true'
    }, function(result) {
        loading.style.display = 'none';
        if (result && result.success) {
            attendanceData = result.files || [];
            var selectedMonth = document.getElementById('attendanceMonthFilter').value;
            if (selectedMonth) {
                var filtered = [];
                for (var i = 0; i < attendanceData.length; i++) {
                    var file = attendanceData[i];
                    var fileMonth = file.month || extractMonthYearFromFileName(file.name);
                    if (fileMonth === selectedMonth) {
                        filtered.push(file);
                    }
                }
                attendanceData = filtered;
            }
            displayAttendanceList(attendanceData);
            displayAttendanceSummary(attendanceData);
            showNotification('✅ Data absensi dimuat (' + attendanceData.length + ' file)', "success");
        } else {
            showNotification('❌ Gagal memuat data absensi', "error");
            list.innerHTML = '<div style="text-align: center; color: #f44336; padding: 20px;">' +
                '<i class="fas fa-exclamation-circle"></i><br>' +
                'Gagal memuat data absensi.<br>' +
                '<small>Pastikan koneksi internet aktif.</small>' +
                '</div>';
        }
    });
}

function extractMonthYearFromFileName(filename) {
    var match = filename.match(/(\d{1,2})\s+(\d{4})\.zip$/);
    if (match) {
        var month = match[1];
        if (month.length === 1) month = '0' + month;
        var year = match[2];
        return year + '-' + month;
    }
    return '';
}

function displayAttendanceList(files) {
    var list = document.getElementById('attendanceList');
    if (!list) return;

    if (!files || files.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #a5a5a5; padding: 20px;">' +
            '<i class="fas fa-folder-open"></i><br>' +
            'Tidak ada data laporan' +
            '</div>';
        return;
    }

    var grouped = {};
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var monthYear = file.month || extractMonthYearFromFileName(file.name);
        if (!grouped[monthYear]) {
            grouped[monthYear] = { month: monthYear, files: [], desas: {} };
        }
        grouped[monthYear].files.push(file);
        var desaName = file.desa || extractDesaFromFileName(file.name);
        grouped[monthYear].desas[desaName] = true;
    }

    var sorted = Object.keys(grouped).sort(function(a, b) {
        return new Date(b) - new Date(a);
    });

    var html = '';
    for (var s = 0; s < sorted.length; s++) {
        var monthYear = sorted[s];
        var g = grouped[monthYear];
        var parts = monthYear.split('-');
        var year = parts[0];
        var month = parts[1];
        var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        var monthName = monthNames[parseInt(month, 10) - 1];

        var desaKeys = Object.keys(g.desas);
        html += '<div class="desa-card" style="margin-bottom: 20px;">' +
            '<div class="desa-header" style="background: #cc5500; padding: 8px 12px; border-radius: 8px 8px 0 0; display:block; overflow:hidden; color:white;">' +
            '<div class="desa-name" style="float:left;"><i class="fas fa-folder"></i> ' + monthName + ' ' + year + '</div>' +
            '<div class="desa-count" style="float:right;">' + g.files.length + ' laporan | ' + desaKeys.length + ' desa</div>' +
            '</div>' +
            '<div class="desa-files" style="padding: 0 4px;">';

        var byDesa = {};
        for (var f = 0; f < g.files.length; f++) {
            var fileItem = g.files[f];
            var d = fileItem.desa || extractDesaFromFileName(fileItem.name);
            if (!byDesa[d]) byDesa[d] = [];
            byDesa[d].push(fileItem);
        }

        var desaNames = Object.keys(byDesa);
        for (var dIdx = 0; dIdx < desaNames.length; dIdx++) {
            var desaName = desaNames[dIdx];
            var desaFiles = byDesa[desaName];
            var count = desaFiles.length;
            var complete = count >= TARGET_LAPORAN;
            var borderColor = complete ? '#4CAF50' : '#FF9800';
            var countColor = complete ? '#4CAF50' : '#FF9800';

            html += '<div class="desa-card" style="margin: 10px 0; border-left: 4px solid ' + borderColor + '; background: rgba(255,255,255,0.02); border-radius:4px;">' +
                '<div class="desa-header" style="padding: 6px 10px; display:block; overflow:hidden; font-size:14px;">' +
                '<div class="desa-name" style="float:left;"><strong>' + desaName + '</strong></div>' +
                '<div class="desa-count" style="float:right; color:' + countColor + ';">' + count + '/' + TARGET_LAPORAN + '</div>' +
                '</div>' +
                '<div class="desa-files" style="padding: 2px 10px 6px;">';

            desaFiles.sort(function(a, b) {
                return new Date(b.createdTime) - new Date(a.createdTime);
            });

            for (var df = 0; df < desaFiles.length; df++) {
                var fileItem2 = desaFiles[df];
                var date2 = new Date(fileItem2.createdTime);
                var dateStr2 = date2.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                var size2 = fileItem2.size ? formatFileSize(fileItem2.size) : '?';
                var zipContents = fileItem2.zipContents ? '** Isi ZIP: ' + fileItem2.zipContents : '';
                var displayIdx = desaFiles.length - df;

                html += '<div style="padding: 4px 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:13px;">' +
                    '<div>' + displayIdx + '. ' + fileItem2.name + '</div>' +
                    '<div style="font-size:11px; color:#8899aa;">' + dateStr2 + ' • ' + size2 + (zipContents ? ' • ' + zipContents : '') + '</div>' +
                    '</div>';
            }

            html += '</div></div>';
        }

        html += '</div></div>';
    }

    list.innerHTML = html;
}

function displayAttendanceSummary(files) {
    var summary = document.getElementById('attendanceSummary');
    var totalReports = document.getElementById('totalReports');
    var totalDesa = document.getElementById('totalDesa');
    var targetStatus = document.getElementById('targetStatus');

    if (!summary || !files || files.length === 0) {
        if (summary) summary.style.display = 'none';
        return;
    }

    summary.style.display = 'block';
    if (totalReports) totalReports.textContent = files.length;

    var uniqueDesas = {};
    for (var i = 0; i < files.length; i++) {
        var d = files[i].desa || extractDesaFromFileName(files[i].name);
        uniqueDesas[d] = true;
    }
    var desaCount = Object.keys(uniqueDesas).length;
    if (totalDesa) totalDesa.textContent = desaCount;

    var counts = {};
    for (var j = 0; j < files.length; j++) {
        var d2 = files[j].desa || extractDesaFromFileName(files[j].name);
        counts[d2] = (counts[d2] || 0) + 1;
    }

    var achieved = 0;
    var possible = desaCount * TARGET_LAPORAN;
    for (var key in counts) {
        if (counts.hasOwnProperty(key)) {
            achieved += Math.min(counts[key], TARGET_LAPORAN);
        }
    }
    var percent = possible > 0 ? (achieved / possible * 100) : 0;

    if (targetStatus) {
        targetStatus.textContent = percent.toFixed(1) + '%';
        targetStatus.style.color = percent >= 100 ? '#4CAF50' : percent >= 70 ? '#FF9800' : '#f44336';
    }
}

function extractDesaFromFileName(filename) {
    var clean = filename.replace(/_/g, ' ').replace(/\.zip$/, '').replace(/\s+\d{1,2}\s+\d{4}$/, '').trim();
    var select = document.getElementById('selectDesa');
    if (!select) return clean;
    for (var i = 1; i < select.options.length; i++) {
        var opt = select.options[i];
        var info = normalizeDesaName(opt.getAttribute('data-raw-name') || opt.text);
        if (clean.toLowerCase().indexOf(info.cleanName.toLowerCase()) !== -1 ||
            info.cleanName.toLowerCase().indexOf(clean.toLowerCase()) !== -1) {
            return info.cleanName;
        }
    }
    return clean;
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function refreshAttendanceData() {
    loadAttendanceData();
}

// ================= POPUP UCAPAN TERIMA KASIH =================
function showThankYouPopup(desaName, count) {
    var existing = document.querySelector('.thankyou-popup');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.className = 'thankyou-popup';
    modal.style.cssText = 'position: fixed; top:0; left:0; right:0; bottom:0; ' +
        'background: rgba(0,0,0,0.85); z-index:999999; ' +
        'display: table; width:100%; height:100%; ' +
        'animation: fadeIn 0.3s;';

    var inner = document.createElement('div');
    inner.style.cssText = 'display: table-cell; vertical-align: middle; text-align: center;';
    inner.innerHTML = '<div style="background: linear-gradient(145deg, #1a3a1a, #0a1a0a); ' +
        'border: 2px solid #4CAF50; border-radius: 20px; padding: 40px; ' +
        'max-width: 450px; width: 90%; margin: 0 auto; text-align: center; ' +
        'box-shadow: 0 20px 60px rgba(0,0,0,0.8);">' +
        '<div style="font-size: 80px; color: #4CAF50; margin-bottom: 20px;">' +
        '<i class="fas fa-trophy"></i>' +
        '</div>' +
        '<h2 style="color: #9fd49f; margin-bottom: 15px; font-size: 28px;">🎉 SELAMAT! 🎉</h2>' +
        '<p style="color: #f5f5f5; font-size: 18px; line-height: 1.5; margin-bottom: 20px;">' +
        '<strong>Babinsa ' + desaName + '</strong><br>' +
        'Telah menyelesaikan <strong>' + count + ' laporan</strong> untuk bulan ini!' +
        '</p>' +
        '<div style="background: rgba(76, 175, 80, 0.2); border: 2px solid #4CAF50; ' +
        'border-radius: 10px; padding: 15px; margin: 20px 0; font-size: 16px; color: #b2d8b2;">' +
        '<i class="fas fa-check-circle"></i> Target ' + TARGET_LAPORAN + ' laporan per bulan TERCAPAI!' +
        '</div>' +
        '<button onclick="this.closest(\'.thankyou-popup\').remove()" ' +
        'style="background: linear-gradient(135deg, #4CAF50, #2b4d2b); color: white; ' +
        'border: none; padding: 12px 25px; border-radius: 8px; font-size: 16px; ' +
        'font-weight: bold; cursor: pointer; width: 100%;">' +
        '<i class="fas fa-thumbs-up"></i> TERIMA KASIH' +
        '</button>' +
        '</div>';

    modal.appendChild(inner);
    document.body.appendChild(modal);
    setTimeout(function() { if (modal.parentNode) modal.remove(); }, 10000);
}

function sendThankYouTelegram(desaName, count) {
    var message = '🎉 *SELAMAT!* 🎉\n\n' +
        '*Babinsa ' + desaName + '* telah menyelesaikan *' + count + ' laporan DUKOPS* untuk bulan ini!\n\n' +
        '✅ *Target ' + TARGET_LAPORAN + ' laporan per bulan TERCAPAI!*\n\n' +
        'Terima kasih atas dedikasi dan kerja keras dalam melaksanakan tugas DUKOPS.\n\n' +
        '*KORAMIL 1609-05/SUKASADA*\n' +
        '*Kodim 1609/Buleleng*';

    sendToBackend('sendTelegramText', {
        message: message,
        chatId: '-1003020813628'
    }, function(result) {
        if (result && result.success) {
            console.log('✅ Thank you message sent to Telegram');
        } else {
            console.error('❌ Failed to send thank you to Telegram');
        }
    });
}

function showNotification(message, type) {
    var toast = document.getElementById('win98Toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'win98Toast';
        toast.className = 'win98-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'win98-toast show';
    if (type === 'success') toast.className += ' success';
    else if (type === 'error') toast.className += ' error';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

// ================= TAB ABSEN (Google Apps Script) =================
(function() {
    var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxcKBFM8Mm0A8e_hWfl48uEUuDhlmxK8okgXF4M-102HLEuROZPN9YZlpmKnkRo8b_SKA/exec';
    var CACHE_KEY_ABSEN = 'absensi_dukops_data';
    var CACHE_EXPIRY = 30 * 60 * 1000;
    var isOnlineAbsen = navigator.onLine;
    var currentDataAbsen = null;
    var tahunSelect = document.getElementById('absenTahunSelect');
    var bulanSelect = document.getElementById('absenBulanSelect');
    var resultContainer = document.getElementById('absenResultContainer');
    var screenshotArea = document.getElementById('absenScreenshotArea');

    if (tahunSelect) tahunSelect.onchange = onTahunChange;

    window.addEventListener('online', function() { isOnlineAbsen = true; loadAbsenTahun(); });
    window.addEventListener('offline', function() { isOnlineAbsen = false; });

    function loadAbsenTahun() {
        if (!tahunSelect) return;
        tahunSelect.disabled = true;
        tahunSelect.innerHTML = '<option>⏳ Mohon tunggu....</option>';
        var cached = getCacheAbsen();
        if (cached && cached.years && cached.years.length > 0) {
            populateTahunSelect(cached.years);
            tahunSelect.disabled = false;
        }
        if (!isOnlineAbsen) {
            if (!cached || !cached.years) tahunSelect.innerHTML = '<option>❌ Offline - no data</option>';
            return;
        }
        var url = SCRIPT_URL + '?action=getYears';
        xhrGet(url, function(err, y) {
            if (err || !y || y.length === 0) {
                if (!cached || !cached.years) tahunSelect.innerHTML = '<option>❌ Gagal memuat</option>';
            } else {
                populateTahunSelect(y);
                saveToCacheAbsen({ years: y, months: null, data: null });
            }
            if (tahunSelect) tahunSelect.disabled = false;
        });
    }

    function populateTahunSelect(y) {
        if (!tahunSelect) return;
        tahunSelect.innerHTML = '<option value="">-- Pilih Tahun --</option>';
        for (var i = 0; i < y.length; i++) {
            var o = document.createElement('option');
            o.value = y[i];
            o.textContent = y[i];
            tahunSelect.appendChild(o);
        }
        if (y.length > 0) { tahunSelect.value = y[0]; onTahunChange(); }
    }

    function onTahunChange() {
        if (!tahunSelect || !bulanSelect) return;
        var t = tahunSelect.value;
        if (!t) { bulanSelect.innerHTML = '<option>Pilih tahun dulu</option>'; bulanSelect.disabled = true; return; }
        bulanSelect.disabled = true;
        bulanSelect.innerHTML = '<option>⏳ Memuat...</option>';
        var c = getCacheAbsen();
        if (c && c.months && c.months[t]) {
            populateBulanSelect(c.months[t]);
            bulanSelect.disabled = false;
            return;
        }
        if (!isOnlineAbsen) {
            bulanSelect.innerHTML = '<option>❌ Offline</option>';
            bulanSelect.disabled = false;
            return;
        }
        var url = SCRIPT_URL + '?action=getMonths&tahun=' + encodeURIComponent(t);
        xhrGet(url, function(err, m) {
            if (err || !m || m.length === 0) {
                bulanSelect.innerHTML = '<option>❌ Gagal memuat</option>';
            } else {
                populateBulanSelect(m);
                var uc = getCacheAbsen() || {};
                uc.months = uc.months || {};
                uc.months[t] = m;
                saveToCacheAbsen(uc);
            }
            bulanSelect.disabled = false;
        });
    }

    function populateBulanSelect(m) {
        if (!bulanSelect) return;
        bulanSelect.innerHTML = '<option value="">-- Pilih Bulan --</option>';
        for (var i = 0; i < m.length; i++) {
            var o = document.createElement('option');
            o.value = m[i].num || m[i];
            o.textContent = m[i].name || m[i];
            bulanSelect.appendChild(o);
        }
        bulanSelect.onchange = function() {
            if (this.value) { loadDataAbsen(); } else { if (resultContainer) resultContainer.innerHTML = ''; }
        };
        if (bulanSelect.value) { loadDataAbsen(); }
    }

    function loadDataAbsen() {
        if (!tahunSelect || !bulanSelect) return;
        var t = tahunSelect.value,
            b = bulanSelect.value;
        if (!t || !b) { if (resultContainer) resultContainer.innerHTML = '<div class="absen-card">Pilih tahun dan bulan</div>'; return; }
        showLoadingAbsen();
        var c = getCacheAbsen(),
            ck = t + '_' + b;
        if (c && c.data && c.data[ck]) {
            var cd = c.data[ck];
            if (Date.now() - cd.timestamp < CACHE_EXPIRY) {
                displayDataAbsen(cd.data);
                currentDataAbsen = cd.data;
                return;
            }
        }
        if (!isOnlineAbsen) { showErrorAbsen('Tidak ada koneksi'); return; }
        var url = SCRIPT_URL + '?action=getData&tahun=' + encodeURIComponent(t) + '&bulan=' + encodeURIComponent(b);
        xhrGet(url, function(err, d) {
            if (err) {
                showErrorAbsen('Gagal: ' + err.message);
                return;
            }
            currentDataAbsen = d;
            displayDataAbsen(d);
            var uc = getCacheAbsen() || {};
            uc.data = uc.data || {};
            uc.data[ck] = { data: d, timestamp: Date.now() };
            saveToCacheAbsen(uc);
        });
    }

    function displayDataAbsen(d) {
        if (!resultContainer) return;
        if (d.error) { showErrorAbsen(d.error); return; }
        var td = d.total_desa || 0;
        var p = td > 0 ? Math.round((d.desa_lengkap / td) * 100) : 0;
        var dh = '';
        for (var i = 0; i < d.details.length; i++) {
            var de = d.details[i];
            var cls = '',
                txt = '',
                icon = '';
            if (de.status === 'LENGKAP') { cls = 'absen-status-lengkap';
                icon = '✅';
                txt = 'LENGKAP'; } else if (de.status === 'BELUM_LENGKAP') { cls = 'absen-status-belum-lengkap';
                icon = '⚠️';
                txt = 'BL'; } else { cls = 'absen-status-belum';
                icon = '❌';
                txt = 'BELUM'; }
            var w = (de.status === 'LENGKAP') ? '#4caf50' : ((de.status === 'BELUM_LENGKAP') ? '#ff9800' : '#f44336');
            dh += '<div class="absen-desa-item" onclick="window.showDetailAbsen(\'' + escapeHtml(de.nama) +
                '\',' + de.jumlah_file + ',' + de.persentase + ',\'' + de.status +
                '\')"><div class="absen-desa-name">' + icon + ' ' + escapeHtml(de.nama) +
                '</div><div class="absen-desa-stats">' + de.jumlah_file +
                '/9</div><div class="absen-desa-progress"><div class="absen-desa-progress-bar"><div class="absen-desa-progress-fill" style="width:' +
                de.persentase + '%;background:' + w +
                '"></div></div></div><div class="absen-status-badge ' + cls + '">' + txt + '</div></div>';
        }
        resultContainer.innerHTML =
            '<div class="absen-card"><div class="absen-stats-grid"><div class="absen-stat-card"><div class="absen-stat-value" style="color:#1a73e8;">' +
            d.total_desa +
            '</div><div class="absen-stat-label">DESA</div></div><div class="absen-stat-card"><div class="absen-stat-value" style="color:#4caf50;">' +
            d.desa_lengkap +
            '</div><div class="absen-stat-label">LENGKAP</div></div><div class="absen-stat-card"><div class="absen-stat-value" style="color:#ff9800;">' +
            d.desa_belum_lengkap +
            '</div><div class="absen-stat-label">BL</div></div><div class="absen-stat-card"><div class="absen-stat-value" style="color:#f44336;">' +
            d.desa_belum +
            '</div><div class="absen-stat-label">BELUM</div></div></div><div class="absen-progress-container"><div style="display:block;overflow:hidden;margin-bottom:5px;font-size:12px;"><span style="float:left;">📈 PROGRESS</span><span style="float:right;"><b>' +
            p +
            '%</b></span></div><div class="absen-progress-bar"><div class="absen-progress-fill" style="width:' +
            p +
            '%"></div></div></div><div style="font-size:0.7rem;font-weight:600;margin:10px 0 5px;">📋 DAFTAR DESA (' +
            d.total_desa +
            ')</div><div class="absen-desa-list">' + dh +
            '</div></div>';
    }

    function getCacheAbsen() {
        try { var c = localStorage.getItem(CACHE_KEY_ABSEN); if (c) return JSON.parse(c); } catch (e) {}
        return null;
    }

    function saveToCacheAbsen(d) {
        try { localStorage.setItem(CACHE_KEY_ABSEN, JSON.stringify(d)); } catch (e) {}
    }

    function showLoadingAbsen() {
        if (resultContainer) resultContainer.innerHTML =
            '<div class="absen-loading"><div class="absen-spinner"></div><p>Mohon Tunggu ...</p></div>';
    }

    function showErrorAbsen(m) {
        if (resultContainer) resultContainer.innerHTML =
            '<div class="absen-card" style="color:#f44336;">⚠️ ' + escapeHtml(m) + '</div>';
    }

    function escapeHtml(t) {
        if (!t) return '';
        return t.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    window.showDetailAbsen = function(n, j, p, s) {
        alert((s === 'LENGKAP' ? '✅ ' : (s === 'BELUM_LENGKAP' ? '⚠️ ' : '❌ ')) + n + '\n' + j + '/9 (' + p + '%)');
    };

    window.shareAsPNGAbsen = function() {
        var btn = document.getElementById('downloadAbsenBtn');
        if (btn) { btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMBUAT PNG...'; }

        if (!currentDataAbsen) {
            alert('⚠️ Belum ada data absensi. Silakan pilih Tahun dan Bulan terlebih dahulu.');
            if (btn) { btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-download"></i> DOWNLOAD ABSEN PNG'; }
            return;
        }

        if (typeof html2canvas === 'undefined') {
            alert('❌ Library html2canvas tidak ditemukan. Silakan refresh halaman.');
            if (btn) { btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-download"></i> DOWNLOAD ABSEN PNG'; }
            return;
        }

        var screenshotArea = document.getElementById('absenScreenshotArea');
        if (!screenshotArea) {
            alert('❌ Elemen screenshot tidak ditemukan.');
            if (btn) { btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-download"></i> DOWNLOAD ABSEN PNG'; }
            return;
        }

        try {
            var d = currentDataAbsen;
            var totalDesa = d.total_desa || 0;
            var desaLengkap = d.desa_lengkap || 0;
            var persentase = totalDesa > 0 ? Math.round((desaLengkap / totalDesa) * 100) : 0;
            var tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            var bulanTahun = d.nama_bulan || '';
            var tahun = d.tahun || '';
            if (!bulanTahun) {
                var bulanSelect2 = document.getElementById('absenBulanSelect');
                if (bulanSelect2 && bulanSelect2.value) {
                    var bulanText = bulanSelect2.options[bulanSelect2.selectedIndex] ? bulanSelect2.options[bulanSelect2.selectedIndex].text : '';
                    var tahunSelect2 = document.getElementById('absenTahunSelect');
                    var tahunText = tahunSelect2 ? tahunSelect2.value : '';
                    bulanTahun = bulanText + ' ' + tahunText;
                }
            }

            var lh = '';
            if (d.details && d.details.length > 0) {
                for (var i = 0; i < d.details.length; i++) {
                    var de = d.details[i];
                    var w = (de.status === 'LENGKAP') ? '#4caf50' : ((de.status === 'BELUM_LENGKAP') ? '#ff9800' : '#f44336');
                    var em = (de.status === 'LENGKAP') ? '✅' : ((de.status === 'BELUM_LENGKAP') ? '⚠️' : '❌');
                    var st = (de.status === 'LENGKAP') ? 'LENGKAP' : ((de.status === 'BELUM_LENGKAP') ? 'BL' : 'BELUM');
                    var sb = (de.status === 'LENGKAP') ? '#e8f5e9' : ((de.status === 'BELUM_LENGKAP') ? '#fff3e0' : '#ffebee');
                    lh += '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:12px;">' +
                        '<div style="width:24px;font-size:14px;text-align:center;">' + em + '</div>' +
                        '<div style="flex:2;font-size:12px;font-weight:500;color:#000;">' + escapeHtml(de.nama || '') + '</div>' +
                        '<div style="width:40px;font-size:11px;text-align:center;color:#000;">' + (de.jumlah_file || 0) + '/9</div>' +
                        '<div style="width:60px;"><div style="background:#e0e0e0;border-radius:6px;height:6px;overflow:hidden;">' +
                        '<div style="background:' + w + ';width:' + (de.persentase || 0) + '%;height:6px;border-radius:6px;"></div>' +
                        '</div></div>' +
                        '<div style="width:50px;font-size:9px;text-align:center;padding:2px 6px;border-radius:8px;background:' + sb + ';color:' + w + ';font-weight:600;">' + st + '</div>' +
                        '</div>';
                }
            } else {
                lh = '<div style="text-align:center;padding:20px;color:#999;">Tidak ada data desa</div>';
            }

            screenshotArea.innerHTML = '<div style="max-width:600px;margin:0 auto;padding:20px;background:#ffffff;border-radius:12px;font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, \'Noto Sans\', \'Liberation Sans\', sans-serif;box-shadow:0 2px 16px rgba(0,0,0,0.08);">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#1a2332;border-radius:10px 10px 0 0;color:white;">' +
                '<div style="font-size:16px;font-weight:700;">📊 ABSENSI DUKOPS</div>' +
                '<div style="font-size:8px;opacity:0.7;">Koramil Monitoring</div>' +
                '</div>' +
                '<div style="padding:16px;">' +
                '<div style="text-align:center;margin-bottom:12px;">' +
                '<div style="font-size:16px;font-weight:700;color:#000;">' + (bulanTahun || 'Data Absensi') + '</div>' +
                '<div style="font-size:10px;color:#666;">' + tanggal + '</div>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0;">' +
                '<div style="background:#f8f9fa;border-radius:8px;padding:10px 4px;text-align:center;border:1px solid #e9ecef;">' +
                '<div style="font-size:14px;font-weight:700;color:#1a73e8;">' + totalDesa + '</div>' +
                '<div style="font-size:8px;color:#6b7a8f;text-transform:uppercase;">DESA</div>' +
                '</div>' +
                '<div style="background:#f8f9fa;border-radius:8px;padding:10px 4px;text-align:center;border:1px solid #e9ecef;">' +
                '<div style="font-size:14px;font-weight:700;color:#4caf50;">' + desaLengkap + '</div>' +
                '<div style="font-size:8px;color:#6b7a8f;text-transform:uppercase;">LENGKAP</div>' +
                '</div>' +
                '<div style="background:#f8f9fa;border-radius:8px;padding:10px 4px;text-align:center;border:1px solid #e9ecef;">' +
                '<div style="font-size:14px;font-weight:700;color:#ff9800;">' + (d.desa_belum_lengkap || 0) + '</div>' +
                '<div style="font-size:8px;color:#6b7a8f;text-transform:uppercase;">BL</div>' +
                '</div>' +
                '<div style="background:#f8f9fa;border-radius:8px;padding:10px 4px;text-align:center;border:1px solid #e9ecef;">' +
                '<div style="font-size:14px;font-weight:700;color:#f44336;">' + (d.desa_belum || 0) + '</div>' +
                '<div style="font-size:8px;color:#6b7a8f;text-transform:uppercase;">BELUM</div>' +
                '</div>' +
                '</div>' +
                '<div style="margin:12px 0;">' +
                '<div style="display:flex;justify-content:space-between;font-size:10px;color:#000;">' +
                '<span>📈 PROGRESS</span>' +
                '<span><b>' + persentase + '%</b></span>' +
                '</div>' +
                '<div style="background:#e9ecef;border-radius:6px;height:8px;overflow:hidden;">' +
                '<div style="background:linear-gradient(90deg,#4CAF50,#66BB6A);width:' + persentase + '%;height:8px;border-radius:6px;"></div>' +
                '</div>' +
                '</div>' +
                '<div style="font-size:11px;font-weight:600;margin:12px 0 6px 0;color:#000;">📋 DAFTAR DESA (' + totalDesa + ')</div>' +
                '<div style="max-height:400px;overflow:hidden;">' + lh + '</div>' +
                '</div>' +
                '<div style="text-align:center;padding:8px 0 4px 0;font-size:8px;color:#999;border-top:1px solid #f0f2f5;margin-top:8px;">' +
                'DUKOPS • Koramil Monitoring' +
                '</div>' +
                '</div>';

            setTimeout(function() {
                var el = screenshotArea.firstChild;
                if (!el) throw new Error('Konten screenshot tidak ditemukan');

                html2canvas(el, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    width: 600
                }).then(function(canvas) {
                    var link = document.createElement('a');
                    var fileName = 'Absensi_' + (bulanTahun || 'data') + '_' + new Date().toISOString().slice(0, 10) + '.png';
                    link.download = fileName;
                    link.href = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log('✅ Download PNG berhasil:', fileName);
                }).catch(function(e) {
                    console.error('❌ Gagal screenshot:', e);
                    alert('❌ Gagal membuat gambar: ' + e.message);
                }).finally(function() {
                    setTimeout(function() {
                        var sa = document.getElementById('absenScreenshotArea');
                        if (sa) sa.innerHTML = '';
                    }, 500);
                    if (btn) { btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-download"></i> DOWNLOAD ABSEN PNG'; }
                });
            }, 300);

        } catch (e) {
            console.error('❌ Gagal screenshot:', e);
            alert('❌ Gagal membuat gambar: ' + e.message);
            if (btn) { btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-download"></i> DOWNLOAD ABSEN PNG'; }
        }
    };

    window.loadAbsenTahun = loadAbsenTahun;
})();

// ================= SERVICE WORKER =================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        console.log('🔧 Registering Service Worker...');
        navigator.serviceWorker.register('/dukops4/sw.js')
            .then(function(registration) {
                console.log('✅ Service Worker registered successfully!');
                console.log('📦 Scope:', registration.scope);
                if (registration.active) console.log('✅ Service Worker is active!');
            })
            .catch(function(error) {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
} else {
    console.log('⚠️ Service Worker not supported in this browser.');
}