/**
 * SKORPRO - Statistical Functions
 * Perhitungan statistik untuk analisis butir soal
 */

const Statistics = {
    /**
     * Hitung Tingkat Kesukaran (p)
     * p = jumlah benar / total siswa
     */
    tingkatKesukaran(benar, total) {
        if (total === 0) return 0;
        return benar / total;
    },

    /**
     * Kategori Tingkat Kesukaran
     */
    kategoriKesukaran(p) {
        if (p >= 0.70) return 'Mudah';
        if (p >= 0.30) return 'Sedang';
        return 'Sukar';
    },

    /**
     * Hitung Daya Beda menggunakan Point Biserial Correlation
     */
    dayaBeda(itemScores, totalScores) {
        const n = itemScores.length;
        if (n === 0) return 0;

        // Pisahkan yang benar (1) dan salah (0)
        const correctIndices = [];
        const incorrectIndices = [];

        itemScores.forEach((score, index) => {
            if (score === 1) {
                correctIndices.push(index);
            } else {
                incorrectIndices.push(index);
            }
        });

        if (correctIndices.length === 0 || incorrectIndices.length === 0) {
            return 0;
        }

        // Mean total score untuk yang benar
        const meanCorrect = correctIndices.reduce((sum, i) => sum + totalScores[i], 0) / correctIndices.length;

        // Mean total score untuk yang salah
        const meanIncorrect = incorrectIndices.reduce((sum, i) => sum + totalScores[i], 0) / incorrectIndices.length;

        // Standar deviasi total scores
        const meanTotal = totalScores.reduce((a, b) => a + b, 0) / n;
        const variance = totalScores.reduce((sum, score) => sum + Math.pow(score - meanTotal, 2), 0) / n;
        const sd = Math.sqrt(variance);

        if (sd === 0) return 0;

        // Proporsi yang benar
        const p = correctIndices.length / n;
        const q = 1 - p;

        // Point Biserial Correlation
        const rpbi = ((meanCorrect - meanIncorrect) / sd) * Math.sqrt(p * q);

        return rpbi;
    },

    /**
     * Hitung Daya Beda Metode Kelompok Atas-Bawah (27%)
     */
    dayaBedaKelompok(itemScores, totalScores) {
        const n = itemScores.length;
        if (n < 10) return this.dayaBeda(itemScores, totalScores);

        // Gabungkan dan urutkan berdasarkan total score
        const combined = itemScores.map((item, index) => ({
            item: item,
            total: totalScores[index]
        }));

        combined.sort((a, b) => b.total - a.total);

        // Ambil 27% teratas dan 27% terbawah
        const groupSize = Math.floor(n * 0.27);
        const upperGroup = combined.slice(0, groupSize);
        const lowerGroup = combined.slice(-groupSize);

        // Hitung jumlah benar di kelompok atas
        const upperCorrect = upperGroup.filter(x => x.item === 1).length;

        // Hitung jumlah benar di kelompok bawah
        const lowerCorrect = lowerGroup.filter(x => x.item === 1).length;

        // Daya Beda = (BA - BB) / n_group
        const D = (upperCorrect - lowerCorrect) / groupSize;

        return D;
    },

    /**
     * Kategori Daya Beda
     */
    kategoriDayaBeda(D) {
        const absD = Math.abs(D);
        if (absD >= 0.70) return 'Sangat Baik';
        if (absD >= 0.40) return 'Baik';
        if (absD >= 0.20) return 'Cukup';
        return 'Buruk';
    },

    /**
     * Hitung Validitas (Korelasi item dengan total)
     * Menggunakan Pearson Correlation
     */
    validitas(itemScores, totalScores) {
        const n = itemScores.length;
        if (n === 0) return 0;

        // Mean
        const meanItem = itemScores.reduce((a, b) => a + b, 0) / n;
        const meanTotal = totalScores.reduce((a, b) => a + b, 0) / n;

        // Deviasi
        let numerator = 0;
        let sumSqItem = 0;
        let sumSqTotal = 0;

        for (let i = 0; i < n; i++) {
            const devItem = itemScores[i] - meanItem;
            const devTotal = totalScores[i] - meanTotal;

            numerator += devItem * devTotal;
            sumSqItem += devItem * devItem;
            sumSqTotal += devTotal * devTotal;
        }

        const denominator = Math.sqrt(sumSqItem * sumSqTotal);

        if (denominator === 0) return 0;

        return numerator / denominator;
    },

    /**
     * Kategori Validitas
     */
    kategoriValiditas(r) {
        if (r >= 0.30) return 'Valid';
        return 'Tidak Valid';
    },

    /**
     * Status Bank Soal
     */
    statusBankSoal(validitas, dayaBeda) {
        const isValid = validitas >= 0.30;
        
        if (isValid && dayaBeda >= 0.30) {
            return 'Diterima';
        } else if (isValid && dayaBeda >= 0.20) {
            return 'Dipertimbangkan';
        } else {
            return 'Ditolak';
        }
    },

    /**
     * Analisis lengkap untuk satu nomor soal
     */
    analisisNomor(nomorSoal, jawabanSiswa, kunciJawaban, nilaiTotal) {
        const n = jawabanSiswa.length;

        // Item scores (1 = benar, 0 = salah)
        const itemScores = jawabanSiswa.map(jawaban => {
            return jawaban === kunciJawaban ? 1 : 0;
        });

        // Jumlah yang benar
        const jumlahBenar = itemScores.reduce((a, b) => a + b, 0);

        // Tingkat Kesukaran
        const p = this.tingkatKesukaran(jumlahBenar, n);
        const ketP = this.kategoriKesukaran(p);

        // Daya Beda
        const D = this.dayaBedaKelompok(itemScores, nilaiTotal);
        const ketD = this.kategoriDayaBeda(D);

        // Validitas
        const r = this.validitas(itemScores, nilaiTotal);
        const ketV = this.kategoriValiditas(r);

        // Bank Soal
        const bankSoal = this.statusBankSoal(r, D);

        return {
            nomor: nomorSoal,
            p: p,
            ketP: ketP,
            D: D,
            ketD: ketD,
            validitas: r,
            ketV: ketV,
            bankSoal: bankSoal
        };
    },

    /**
     * Analisis semua soal
     */
    analisisSemuaSoal(dataJawaban, kunciJawaban) {
        // dataJawaban: array of { siswaId, jawaban: [], nilai }
        // kunciJawaban: array of correct answers
        
        const jumlahSoal = kunciJawaban.length;
        const hasil = [];

        // Hitung nilai total per siswa (tanpa item tertentu untuk validitas yang tepat)
        const nilaiTotal = dataJawaban.map(data => data.nilai || 0);

        for (let i = 0; i < jumlahSoal; i++) {
            const jawabanSiswa = dataJawaban.map(data => data.jawaban[i]);
            const analisis = this.analisisNomor(i + 1, jawabanSiswa, kunciJawaban[i], nilaiTotal);
            hasil.push(analisis);
        }

        return hasil;
    },

    /**
     * Hitung statistik deskriptif
     */
    deskriptif(data) {
        const n = data.length;
        if (n === 0) return null;

        // Sort data
        const sorted = [...data].sort((a, b) => a - b);

        // Mean
        const mean = data.reduce((a, b) => a + b, 0) / n;

        // Median
        const median = n % 2 === 0
            ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
            : sorted[Math.floor(n / 2)];

        // Mode
        const frequency = {};
        let maxFreq = 0;
        let mode = null;

        data.forEach(val => {
            frequency[val] = (frequency[val] || 0) + 1;
            if (frequency[val] > maxFreq) {
                maxFreq = frequency[val];
                mode = val;
            }
        });

        // Variance & Standard Deviation
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const sd = Math.sqrt(variance);

        // Min & Max
        const min = sorted[0];
        const max = sorted[n - 1];

        // Range
        const range = max - min;

        return {
            n: n,
            mean: mean,
            median: median,
            mode: mode,
            variance: variance,
            sd: sd,
            min: min,
            max: max,
            range: range
        };
    },

    /**
     * Distribusi frekuensi
     */
    distribusiFrekuensi(data, jumlahKelas = 5) {
        const stats = this.deskriptif(data);
        if (!stats) return [];

        const interval = Math.ceil(stats.range / jumlahKelas);
        const distribusi = [];

        for (let i = 0; i < jumlahKelas; i++) {
            const batasBawah = stats.min + (i * interval);
            const batasAtas = batasBawah + interval - 1;

            const frekuensi = data.filter(val => val >= batasBawah && val <= batasAtas).length;

            distribusi.push({
                kelas: `${batasBawah}-${batasAtas}`,
                batasBawah: batasBawah,
                batasAtas: batasAtas,
                frekuensi: frekuensi,
                persentase: (frekuensi / stats.n) * 100
            });
        }

        return distribusi;
    },

    /**
     * Kategorisasi prestasi belajar
     */
    kategoriBelajar(nilai, kktp) {
        if (nilai >= kktp) return 'Tuntas';
        return 'Tidak Tuntas';
    },

    /**
     * Analisis prestasi kelas
     */
    analisisPrestasi(nilaiSiswa, kktp) {
        const total = nilaiSiswa.length;
        if (total === 0) return null;

        const tuntas = nilaiSiswa.filter(n => n >= kktp).length;
        const tidakTuntas = total - tuntas;

        const persenTuntas = (tuntas / total) * 100;
        const persenTidakTuntas = (tidakTuntas / total) * 100;

        return {
            total: total,
            tuntas: tuntas,
            tidakTuntas: tidakTuntas,
            persenTuntas: persenTuntas,
            persenTidakTuntas: persenTidakTuntas
        };
    }
};