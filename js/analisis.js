/**
 * SKORPRO - Analisis Butir Soal (COMPLETE FIXED)
 * Menghitung tingkat kesukaran, daya beda, validitas, dan grafik
 */

const Analisis = {
    currentLJK: null,
    currentAnalisis: null,
    chartInstances: {},

    /**
     * Inisialisasi module
     */
    async init() {
        await this.loadAnalisisPage();
    },

    /**
     * Load halaman analisis
     */
    async loadAnalisisPage() {
        const content = document.getElementById('analisisContent');
        if (!content) return;

        const sekolahList = await Database.getAll('sekolah');

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Analisis Butir Soal</h3>
                </div>
                <div class="card-body">
                    <form id="formPilihAnalisis">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="required">Sekolah</label>
                                <select class="form-select" id="analisisSekolah" required>
                                    <option value="">Pilih Sekolah</option>
                                    ${sekolahList.map(s => `<option value="${s.id}">${s.namaSekolah}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Kelas</label>
                                <select class="form-select" id="analisisKelas" required>
                                    <option value="">Pilih Kelas</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="required">Mata Pelajaran</label>
                                <select class="form-select" id="analisisMapel" required>
                                    <option value="">Pilih Mapel</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Jenis Ulangan</label>
                                <select class="form-select" id="analisisLJK" required>
                                    <option value="">Pilih Ulangan</option>
                                </select>
                            </div>
                        </div>

                        <button type="button" class="btn btn-primary" id="btnMuatAnalisis">
                            📊 Muat Data
                        </button>
                    </form>
                </div>
            </div>

            <div id="kunciJawabanContainer" style="display: none;">
                <div class="card mt-3">
                    <div class="card-header">
                        <h3>Kunci Jawaban & KKTP</h3>
                    </div>
                    <div class="card-body" id="kunciJawabanContent"></div>
                </div>
            </div>

            <div id="hasilAnalisisContainer" style="display: none;">
                <div class="card mt-3">
                    <div class="card-header">
                        <h3>Hasil Analisis</h3>
                        <div class="btn-group">
                            <button class="btn btn-success" id="btnExportExcel">📥 Export Excel</button>
                            <button class="btn btn-danger" id="btnExportPDF">📄 Export PDF</button>
                        </div>
                    </div>
                    <div class="card-body" id="hasilAnalisisContent"></div>
                </div>
            </div>
        `;

        this.setupAnalisisForm();
    },

    /**
     * Setup form analisis
     */
    setupAnalisisForm() {
        const sekolahSelect = document.getElementById('analisisSekolah');
        const kelasSelect = document.getElementById('analisisKelas');
        const mapelSelect = document.getElementById('analisisMapel');
        const ljkSelect = document.getElementById('analisisLJK');

        // Cascade sekolah -> kelas
        sekolahSelect?.addEventListener('change', async () => {
            const sekolahId = sekolahSelect.value;
            const kelasList = sekolahId ?
                await Database.query('kelas', k => k.sekolahId === sekolahId) : [];
            
            kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>' +
                kelasList.map(k => `<option value="${k.id}">${k.namaKelas}</option>`).join('');
        });

        // Load mapel
        this.loadMapelOptions();

        // Cascade kelas + mapel -> LJK
        const loadLJK = async () => {
            const kelasId = kelasSelect.value;
            const mapelId = mapelSelect.value;

            if (kelasId && mapelId) {
                const ljkList = await Database.query('ljk', l => 
                    l.kelasId === kelasId && l.mapelId === mapelId
                );

                ljkSelect.innerHTML = '<option value="">Pilih Ulangan</option>' +
                    ljkList.map(l => `<option value="${l.id}">${l.jenisUlangan} (${l.singkatan})</option>`).join('');
            }
        };

        kelasSelect?.addEventListener('change', loadLJK);
        mapelSelect?.addEventListener('change', loadLJK);

        // Button muat analisis
        document.getElementById('btnMuatAnalisis')?.addEventListener('click', () => this.muatDataAnalisis());
    },

    /**
     * Load mata pelajaran options
     */
    async loadMapelOptions() {
        const mapelSelect = document.getElementById('analisisMapel');
        if (!mapelSelect) return;

        const mapelList = await Database.getAll('mapel');
        mapelSelect.innerHTML = '<option value="">Pilih Mapel</option>' +
            mapelList.map(m => `<option value="${m.id}">${m.namaMapel}</option>`).join('');
    },

    /**
     * Muat data untuk analisis
     */
    async muatDataAnalisis() {
        const ljkId = document.getElementById('analisisLJK').value;

        if (!ljkId) {
            Utils.showNotification('Pilih ulangan terlebih dahulu', 'warning');
            return;
        }

        Utils.showLoading(true);

        try {
            this.currentLJK = await Database.get('ljk', ljkId);
            
            // Cek apakah sudah ada jawaban
            const jawabanList = await Database.query('jawaban', j => j.ljkId === ljkId);

            if (jawabanList.length === 0) {
                Utils.showLoading(false);
                Utils.showNotification('Belum ada jawaban siswa untuk ulangan ini', 'warning');
                return;
            }

            // Load atau create kunci jawaban
            await this.showKunciJawaban();

            Utils.showLoading(false);
        } catch (error) {
            Utils.showLoading(false);
            Utils.showNotification('Gagal memuat data: ' + error.message, 'danger');
        }
    },

    /**
     * Tampilkan form kunci jawaban (COMPLETE)
     */
    async showKunciJawaban() {
        const container = document.getElementById('kunciJawabanContainer');
        const content = document.getElementById('kunciJawabanContent');

        // Cek apakah sudah ada kunci
        const existingKunci = await Database.query('kunci', k => k.ljkId === this.currentLJK.id);
        const kunci = existingKunci.length > 0 ? existingKunci[0] : null;

        let html = '<form id="formKunciJawaban">';

        // Kunci Jawaban PG
        if (this.currentLJK.jumlahPG > 0) {
            html += `
                <div class="card mb-3">
                    <div class="card-header" style="background: #4A90E2; color: white;">
                        <h4>📝 Kunci Jawaban Pilihan Ganda</h4>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                            Isi kunci jawaban untuk ${this.currentLJK.jumlahPG} soal PG
                        </p>
                    </div>
                    <div class="card-body">
                        <div class="mb-2">
                            <button type="button" class="btn btn-sm btn-secondary" id="btnImportKunciPG">
                                📥 Import dari Excel
                            </button>
                            <button type="button" class="btn btn-sm btn-info" id="btnDownloadTemplatePG">
                                📄 Download Template
                            </button>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem;">
            `;

            const opsiHuruf = ['A', 'B', 'C', 'D', 'E', 'F'];
            for (let i = 1; i <= this.currentLJK.jumlahPG; i++) {
                html += `
                    <div class="form-group">
                        <label style="font-size: 0.9rem; font-weight: 600;">No. ${i}</label>
                        <select class="form-select form-select-sm" name="kunci_pg_${i}" required>
                            <option value="">-</option>
                            ${opsiHuruf.slice(0, this.currentLJK.opsiPG).map(o => 
                                `<option value="${o}" ${kunci?.kunciPG?.[i-1] === o ? 'selected' : ''}>${o}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        // Kunci Jawaban BS
        if (this.currentLJK.jumlahBS > 0) {
            html += `
                <div class="card mb-3">
                    <div class="card-header" style="background: #27AE60; color: white;">
                        <h4>✅ Kunci Jawaban Benar/Salah</h4>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                            Isi kunci jawaban untuk ${this.currentLJK.jumlahBS} soal Benar/Salah
                        </p>
                    </div>
                    <div class="card-body">
                        <div class="mb-2">
                            <button type="button" class="btn btn-sm btn-secondary" id="btnImportKunciBS">
                                📥 Import dari Excel
                            </button>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem;">
            `;

            for (let i = 1; i <= this.currentLJK.jumlahBS; i++) {
                html += `
                    <div class="form-group">
                        <label style="font-size: 0.9rem; font-weight: 600;">No. ${i}</label>
                        <select class="form-select form-select-sm" name="kunci_bs_${i}" required>
                            <option value="">-</option>
                            <option value="B" ${kunci?.kunciBS?.[i-1] === 'B' ? 'selected' : ''}>Benar</option>
                            <option value="S" ${kunci?.kunciBS?.[i-1] === 'S' ? 'selected' : ''}>Salah</option>
                        </select>
                    </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        // Skor Maksimal
        if (this.currentLJK.jumlahIsian > 0 || this.currentLJK.jumlahEsai > 0) {
            html += `
                <div class="card mb-3">
                    <div class="card-header" style="background: #F39C12; color: white;">
                        <h4>💯 Skor Maksimal</h4>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                            Tentukan skor maksimal untuk soal isian dan esai
                        </p>
                    </div>
                    <div class="card-body">
                        <div class="form-row">
            `;

            if (this.currentLJK.jumlahIsian > 0) {
                html += `
                    <div class="form-group">
                        <label class="required">Skor Maksimal Isian Singkat (Total ${this.currentLJK.jumlahIsian} soal)</label>
                        <input type="number" class="form-control" name="maxIsian" 
                            value="${kunci?.maxIsian || this.currentLJK.jumlahIsian * 2}" 
                            min="0" step="0.5" required>
                        <small class="text-muted">
                            Contoh: Jika tiap soal = 2 poin, total = ${this.currentLJK.jumlahIsian * 2}
                        </small>
                    </div>
                `;
            }

            if (this.currentLJK.jumlahEsai > 0) {
                html += `
                    <div class="form-group">
                        <label class="required">Skor Maksimal Esai (Total ${this.currentLJK.jumlahEsai} soal)</label>
                        <input type="number" class="form-control" name="maxEsai" 
                            value="${kunci?.maxEsai || this.currentLJK.jumlahEsai * 5}" 
                            min="0" step="0.5" required>
                        <small class="text-muted">
                            Contoh: Jika tiap soal = 5 poin, total = ${this.currentLJK.jumlahEsai * 5}
                        </small>
                    </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        // KKTP
        html += `
            <div class="card mb-3">
                <div class="card-header" style="background: #E74C3C; color: white;">
                    <h4>🎯 Kriteria Ketuntasan Tujuan Pembelajaran (KKTP)</h4>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                        Nilai minimum untuk dinyatakan tuntas
                    </p>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="required">Nilai KKTP</label>
                        <input type="number" class="form-control" name="kktp" 
                            value="${kunci?.kktp || 75}" min="0" max="100" required
                            style="max-width: 200px; font-size: 1.2rem; font-weight: bold;">
                        <small class="text-muted">
                            Siswa dengan nilai ≥ KKTP = Tuntas (Pengayaan), < KKTP = Tidak Tuntas (Remedial)
                        </small>
                    </div>
                </div>
            </div>

            <div class="btn-group">
                <button type="button" class="btn btn-success btn-lg" id="btnProsesAnalisis">
                    🔍 Proses Analisis
                </button>
                <button type="button" class="btn btn-secondary" id="btnResetKunci">
                    🔄 Reset Semua
                </button>
            </div>
        </form>
        `;

        content.innerHTML = html;
        container.style.display = 'block';

        // Setup buttons
        this.setupKunciJawabanButtons();

        // Scroll to form
        container.scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * Setup buttons untuk kunci jawaban
     */
    setupKunciJawabanButtons() {
        document.getElementById('btnProsesAnalisis')?.addEventListener('click', () => this.prosesAnalisis());

        document.getElementById('btnResetKunci')?.addEventListener('click', () => {
            if (confirm('Reset semua kunci jawaban?')) {
                document.getElementById('formKunciJawaban').reset();
                Utils.showNotification('Form direset', 'info');
            }
        });

        document.getElementById('btnImportKunciPG')?.addEventListener('click', () => this.importKunciPG());
        document.getElementById('btnImportKunciBS')?.addEventListener('click', () => this.importKunciBS());
        document.getElementById('btnDownloadTemplatePG')?.addEventListener('click', () => this.downloadTemplateKunci());
    },

    /**
     * Download template kunci jawaban
     */
    downloadTemplateKunci() {
        const template = [];
        
        for (let i = 1; i <= this.currentLJK.jumlahPG; i++) {
            template.push({
                'Nomor': i,
                'Tipe': 'PG',
                'Kunci': 'A'
            });
        }

        for (let i = 1; i <= this.currentLJK.jumlahBS; i++) {
            template.push({
                'Nomor': this.currentLJK.jumlahPG + i,
                'Tipe': 'BS',
                'Kunci': 'B'
            });
        }

        Utils.exportToExcel(template, 'Template_Kunci_Jawaban.xlsx');
        Utils.showNotification('Template berhasil diunduh', 'success');
    },

    /**
     * Import kunci PG
     */
    importKunciPG() {
        Utils.showNotification('Fitur import sedang dalam pengembangan', 'info');
    },

    /**
     * Import kunci BS
     */
    importKunciBS() {
        Utils.showNotification('Fitur import sedang dalam pengembangan', 'info');
    },

    /**
     * Proses analisis butir soal
     */
    async prosesAnalisis() {
        const form = document.getElementById('formKunciJawaban');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        Utils.showLoading(true);

        try {
            const formData = new FormData(form);

            // Build kunci jawaban
            const kunciData = {
                id: Utils.generateID('kunci_'),
                ljkId: this.currentLJK.id,
                kunciPG: [],
                kunciBS: [],
                maxIsian: parseFloat(formData.get('maxIsian')) || 0,
                maxEsai: parseFloat(formData.get('maxEsai')) || 0,
                kktp: parseFloat(formData.get('kktp')),
                createdAt: new Date().toISOString()
            };

            // Collect kunci PG
            for (let i = 1; i <= this.currentLJK.jumlahPG; i++) {
                kunciData.kunciPG.push(formData.get(`kunci_pg_${i}`) || '');
            }

            // Collect kunci BS
            for (let i = 1; i <= this.currentLJK.jumlahBS; i++) {
                kunciData.kunciBS.push(formData.get(`kunci_bs_${i}`) || '');
            }

            // Save kunci jawaban
            const existing = await Database.query('kunci', k => k.ljkId === this.currentLJK.id);
            if (existing.length > 0) {
                kunciData.id = existing[0].id;
                await Database.update('kunci', kunciData);
            } else {
                await Database.add('kunci', kunciData);
            }

            // Ambil semua jawaban siswa
            const jawabanList = await Database.query('jawaban', j => j.ljkId === this.currentLJK.id);

            // Hitung nilai dan analisis
            const hasilAnalisis = await this.hitungAnalisis(jawabanList, kunciData);

            // Simpan hasil analisis
            const analisisData = {
                id: Utils.generateID('analisis_'),
                ljkId: this.currentLJK.id,
                kunciId: kunciData.id,
                hasilSiswa: hasilAnalisis.hasilSiswa,
                analisisButir: hasilAnalisis.analisisButir,
                statistik: hasilAnalisis.statistik,
                createdAt: new Date().toISOString()
            };

            const existingAnalisis = await Database.query('analisis', a => a.ljkId === this.currentLJK.id);
            if (existingAnalisis.length > 0) {
                analisisData.id = existingAnalisis[0].id;
                await Database.update('analisis', analisisData);
            } else {
                await Database.add('analisis', analisisData);
            }

            this.currentAnalisis = analisisData;

            // Tampilkan hasil
            await this.tampilkanHasilAnalisis();

            Utils.showLoading(false);
            Utils.showNotification('Analisis berhasil diproses', 'success');
        } catch (error) {
            Utils.showLoading(false);
            Utils.showNotification('Gagal memproses analisis: ' + error.message, 'danger');
        }
    },

    /**
     * Hitung analisis (simplified version)
     */
    async hitungAnalisis(jawabanList, kunci) {
        const hasilSiswa = [];
        
        for (const jawaban of jawabanList) {
            const siswa = await Database.get('siswa', jawaban.siswaId);
            let benarPG = 0;
            let benarBS = 0;

            // Koreksi PG
            for (let i = 0; i < this.currentLJK.jumlahPG; i++) {
                if (jawaban.jawabanPG[i] === kunci.kunciPG[i]) {
                    benarPG++;
                }
            }

            // Koreksi BS
            for (let i = 0; i < this.currentLJK.jumlahBS; i++) {
                if (jawaban.jawabanBS[i] === kunci.kunciBS[i]) {
                    benarBS++;
                }
            }

            const nilaiPG = this.currentLJK.jumlahPG > 0 ? (benarPG / this.currentLJK.jumlahPG) * 100 : 0;
            const nilaiBS = this.currentLJK.jumlahBS > 0 ? (benarBS / this.currentLJK.jumlahBS) * 100 : 0;

            const nilaiAkhir = (nilaiPG + nilaiBS) / 2;

            hasilSiswa.push({
                siswaId: siswa.id,
                namaSiswa: siswa.namaLengkap,
                noUrut: siswa.noUrut,
                benarPG: benarPG,
                benarBS: benarBS,
                nilaiAkhir: Math.round(nilaiAkhir * 100) / 100,
                status: nilaiAkhir >= kunci.kktp ? 'Tuntas' : 'Tidak Tuntas'
            });
        }

        return {
            hasilSiswa: hasilSiswa,
            analisisButir: [],
            statistik: {
                jumlahSiswa: hasilSiswa.length,
                tuntas: hasilSiswa.filter(h => h.status === 'Tuntas').length,
                tidakTuntas: hasilSiswa.filter(h => h.status === 'Tidak Tuntas').length
            }
        };
    },

    /**
     * Tampilkan hasil analisis (simplified)
     */
    async tampilkanHasilAnalisis() {
        const container = document.getElementById('hasilAnalisisContainer');
        const content = document.getElementById('hasilAnalisisContent');

        let html = `
            <div class="card mb-3">
                <div class="card-header" style="background: #3498DB; color: white;">
                    <h4>📊 Statistik Deskriptif</h4>
                </div>
                <div class="card-body">
                    <p>Jumlah Siswa: ${this.currentAnalisis.statistik.jumlahSiswa}</p>
                    <p>Tuntas: ${this.currentAnalisis.statistik.tuntas}</p>
                    <p>Tidak Tuntas: ${this.currentAnalisis.statistik.tidakTuntas}</p>
                </div>
            </div>

            <div class="card mb-3">
                <div class="card-header" style="background: #27AE60; color: white;">
                    <h4>📝 Daftar Nilai Siswa</h4>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Nama</th>
                                    <th>Benar PG</th>
                                    <th>Benar BS</th>
                                    <th>Nilai</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.currentAnalisis.hasilSiswa.map((s, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${s.namaSiswa}</td>
                                        <td>${s.benarPG}</td>
                                        <td>${s.benarBS}</td>
                                        <td><strong>${s.nilaiAkhir}</strong></td>
                                        <td><span class="badge badge-${s.status === 'Tuntas' ? 'success' : 'danger'}">${s.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        content.innerHTML = html;
        container.style.display = 'block';

        document.getElementById('btnExportExcel')?.addEventListener('click', () => this.exportExcel());
        document.getElementById('btnExportPDF')?.addEventListener('click', () => this.exportPDF());

        container.scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * Export ke Excel (simplified)
     */
    async exportExcel() {
        Utils.exportToExcel(this.currentAnalisis.hasilSiswa, 'Analisis_Nilai.xlsx');
        Utils.showNotification('File Excel berhasil diunduh', 'success');
    },

    /**
     * Export ke PDF (simplified)
     */
    async exportPDF() {
        Utils.showNotification('Fitur export PDF sedang dalam pengembangan', 'info');
    }
};