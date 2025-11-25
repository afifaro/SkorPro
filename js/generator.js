/**
 * SKORPRO - Generator LJK (COMPLETE FIXED)
 * Membuat lembar jawaban komputer dengan QR Code
 */

const Generator = {
    currentConfig: null,
    logoKiri: null,
    logoKanan: null,

    /**
     * Inisialisasi module
     */
    async init() {
        await this.loadGeneratorForm();
    },

    /**
     * Load form generator
     */
    async loadGeneratorForm() {
        const content = document.getElementById('generatorContent');
        if (!content) return;

        const sekolahList = await Database.getAll('sekolah');
        const mapelList = await Database.getAll('mapel');

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Konfigurasi LJK</h3>
                </div>
                <div class="card-body">
                    ${sekolahList.length === 0 ? `
                        <div class="alert alert-warning">
                            ⚠️ Belum ada data sekolah. Silakan isi <a href="#data-siswa" onclick="App.loadPage('data-siswa')">Data Siswa</a> terlebih dahulu.
                        </div>
                    ` : ''}
                    
                    <form id="formGeneratorLJK">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="required">Sekolah</label>
                                <select class="form-select" name="sekolahId" id="genSekolah" required>
                                    <option value="">Pilih Sekolah</option>
                                    ${sekolahList.map(s => `<option value="${s.id}">${s.namaSekolah}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Kelas</label>
                                <select class="form-select" name="kelasId" id="genKelas" required>
                                    <option value="">Pilih Kelas</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="required">Mata Pelajaran</label>
                                <select class="form-select" name="mapelId" id="genMapel" required>
                                    <option value="">Pilih Mata Pelajaran</option>
                                    ${mapelList.map(m => `<option value="${m.id}">${m.namaMapel}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Jenis Ulangan</label>
                                <select class="form-select" name="rencanaId" id="genRencana" required>
                                    <option value="">Pilih Jenis Ulangan</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Logo Kiri</label>
                                <input type="file" class="form-control" id="logoKiri" accept="image/*">
                            </div>
                            <div class="form-group">
                                <label>Logo Kanan</label>
                                <input type="file" class="form-control" id="logoKanan" accept="image/*">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Tanggal Ujian</label>
                                <input type="date" class="form-control" name="tanggalUjian" 
                                    value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label class="required">Waktu (Menit)</label>
                                <input type="number" class="form-control" name="waktu" 
                                    value="90" min="1" required>
                            </div>
                        </div>

                        <hr>
                        <h4>Konfigurasi Soal</h4>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Jumlah Soal PG</label>
                                <input type="number" class="form-control" name="jumlahPG" 
                                    value="40" min="0" max="100" id="jumlahPG">
                            </div>
                            <div class="form-group">
                                <label>Jumlah Opsi PG</label>
                                <select class="form-select" name="opsiPG" id="opsiPG">
                                    <option value="3">3 (A-C)</option>
                                    <option value="4" selected>4 (A-D)</option>
                                    <option value="5">5 (A-E)</option>
                                    <option value="6">6 (A-F)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Kolom PG</label>
                                <input type="number" class="form-control" name="kolomPG" 
                                    value="5" min="1" max="20">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Jumlah Soal Benar/Salah</label>
                                <input type="number" class="form-control" name="jumlahBS" 
                                    value="0" min="0" max="100" id="jumlahBS">
                            </div>
                            <div class="form-group">
                                <label>Kolom BS</label>
                                <input type="number" class="form-control" name="kolomBS" 
                                    value="5" min="1" max="20">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Jumlah Soal Isian Singkat</label>
                                <input type="number" class="form-control" name="jumlahIsian" 
                                    value="0" min="0" max="50" id="jumlahIsian">
                            </div>
                            <div class="form-group">
                                <label>Kolom Isian</label>
                                <input type="number" class="form-control" name="kolomIsian" 
                                    value="2" min="1" max="5">
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Jumlah Soal Esai</label>
                                <input type="number" class="form-control" name="jumlahEsai" 
                                    value="0" min="0" max="50" id="jumlahEsai">
                            </div>
                            <div class="form-group">
                                <label>Baris per Esai</label>
                                <input type="number" class="form-control" name="barisEsai" 
                                    value="5" min="1" max="10">
                            </div>
                        </div>

                        <hr>
                        <h4>Format Bubble</h4>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Ukuran Bubble (pt)</label>
                                <input type="number" class="form-control" name="ukuranBubble" 
                                    value="6" min="4.5" max="8" step="0.5">
                            </div>
                            <div class="form-group">
                                <label>Font Opsi (pt)</label>
                                <input type="number" class="form-control" name="fontOpsi" 
                                    value="8" min="6.5" max="10" step="0.5">
                            </div>
                            <div class="form-group">
                                <label>Ukuran Kertas</label>
                                <select class="form-select" name="ukuranKertas">
                                    <option value="A4" selected>A4</option>
                                    <option value="F4">F4</option>
                                    <option value="Letter">Letter</option>
                                </select>
                            </div>
                        </div>

                        <div class="btn-group mt-3">
                            <button type="button" class="btn btn-primary" id="btnPreviewLJK">
                                👁️ Preview LJK
                            </button>
                            <button type="button" class="btn btn-success" id="btnSimpanLJK" disabled>
                                💾 Simpan Konfigurasi
                            </button>
                            <button type="button" class="btn btn-warning" id="btnDownloadPDF" disabled>
                                📄 Download PDF
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="previewContainer" class="mt-4" style="display:none;">
                <div class="card">
                    <div class="card-header">
                        <h3>Preview LJK</h3>
                    </div>
                    <div class="card-body" id="ljkPreview"></div>
                </div>
            </div>
        `;

        this.setupGeneratorForm();
    },

    /**
     * Setup form interactions
     */
    setupGeneratorForm() {
        // Cascade dropdown sekolah -> kelas
        const sekolahSelect = document.getElementById('genSekolah');
        const kelasSelect = document.getElementById('genKelas');

        if (sekolahSelect) {
            sekolahSelect.addEventListener('change', async () => {
                const sekolahId = sekolahSelect.value;
                const kelasList = sekolahId ? 
                    await Database.query('kelas', k => k.sekolahId === sekolahId) :
                    [];
                
                kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>' +
                    kelasList.map(k => `<option value="${k.id}">${k.namaKelas}</option>`).join('');
            });
        }

        // Cascade mapel -> rencana
        const mapelSelect = document.getElementById('genMapel');
        const rencanaSelect = document.getElementById('genRencana');

        if (mapelSelect) {
            mapelSelect.addEventListener('change', async () => {
                const mapelId = mapelSelect.value;
                const rencanaList = mapelId ?
                    await Database.query('rencana', r => r.mapelId === mapelId) :
                    [];
                
                rencanaSelect.innerHTML = '<option value="">Pilih Jenis Ulangan</option>' +
                    rencanaList.map(r => `<option value="${r.id}">${r.jenisUlangan} (${r.singkatan})</option>`).join('');
            });
        }

        // Upload logo
        document.getElementById('logoKiri')?.addEventListener('change', (e) => {
            this.handleLogoUpload(e.target.files[0], 'kiri');
        });

        document.getElementById('logoKanan')?.addEventListener('change', (e) => {
            this.handleLogoUpload(e.target.files[0], 'kanan');
        });

        // Buttons
        document.getElementById('btnPreviewLJK')?.addEventListener('click', () => this.previewLJK());
        document.getElementById('btnSimpanLJK')?.addEventListener('click', () => this.simpanKonfigurasi());
        document.getElementById('btnDownloadPDF')?.addEventListener('click', () => this.downloadPDF());
    },

    /**
     * Handle logo upload
     */
    handleLogoUpload(file, posisi) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (posisi === 'kiri') {
                this.logoKiri = e.target.result;
            } else {
                this.logoKanan = e.target.result;
            }
            Utils.showNotification(`Logo ${posisi} berhasil diupload`, 'success');
        };
        reader.readAsDataURL(file);
    },

    /**
     * Preview LJK
     */
    async previewLJK() {
        const form = document.getElementById('formGeneratorLJK');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Validasi minimal 1 jenis soal
        const jumlahPG = parseInt(document.getElementById('jumlahPG').value) || 0;
        const jumlahBS = parseInt(document.getElementById('jumlahBS').value) || 0;
        const jumlahIsian = parseInt(document.getElementById('jumlahIsian').value) || 0;
        const jumlahEsai = parseInt(document.getElementById('jumlahEsai').value) || 0;

        if (jumlahPG + jumlahBS + jumlahIsian + jumlahEsai === 0) {
            Utils.showNotification('Minimal harus ada 1 jenis soal', 'warning');
            return;
        }

        Utils.showLoading(true);

        try {
            const formData = new FormData(form);
            this.currentConfig = await this.buildConfig(formData);

            const previewContainer = document.getElementById('previewContainer');
            const ljkPreview = document.getElementById('ljkPreview');

            // Generate preview untuk 1 siswa pertama (atau kosong)
            const siswaList = await Database.query('siswa', s => s.kelasId === this.currentConfig.kelasId);
            const siswa = siswaList.length > 0 ? siswaList[0] : null;

            const ljkHtml = await this.generateLJKHTML(this.currentConfig, siswa);
            ljkPreview.innerHTML = ljkHtml;

            previewContainer.style.display = 'block';
            
            // Enable buttons
            document.getElementById('btnSimpanLJK').disabled = false;
            document.getElementById('btnDownloadPDF').disabled = false;

            Utils.showLoading(false);
            Utils.showNotification('Preview LJK berhasil dibuat', 'success');

            // Scroll to preview
            previewContainer.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            Utils.showLoading(false);
            console.error('Error preview LJK:', error);
            Utils.showNotification('Gagal membuat preview: ' + error.message, 'danger');
        }
    },

    /**
     * Build configuration object
     */
    async buildConfig(formData) {
        const sekolah = await Database.get('sekolah', formData.get('sekolahId'));
        const kelas = await Database.get('kelas', formData.get('kelasId'));
        const mapel = await Database.get('mapel', formData.get('mapelId'));
        const rencana = await Database.get('rencana', formData.get('rencanaId'));
        const semester = await Database.query('semester', s => s.active);

        if (!sekolah || !kelas || !mapel || !rencana) {
            throw new Error('Data tidak lengkap. Pastikan semua dropdown terisi.');
        }

        const tanggalUjian = formData.get('tanggalUjian') ? new Date(formData.get('tanggalUjian')) : new Date();

        return {
            id: Utils.generateID('ljk_'),
            sekolahId: sekolah.id,
            namaSekolah: sekolah.namaSekolah,
            kelasId: kelas.id,
            namaKelas: kelas.namaKelas,
            mapelId: mapel.id,
            namaMapel: mapel.namaMapel,
            rencanaId: rencana.id,
            jenisUlangan: rencana.jenisUlangan,
            singkatan: rencana.singkatan,
            tahunAjar: semester.length > 0 ? semester[0].tahunAjar : '',
            tanggalUjian: Utils.formatDateID(tanggalUjian),
            waktu: parseInt(formData.get('waktu')),
            jumlahPG: parseInt(formData.get('jumlahPG')),
            opsiPG: parseInt(formData.get('opsiPG')),
            kolomPG: parseInt(formData.get('kolomPG')),
            jumlahBS: parseInt(formData.get('jumlahBS')),
            kolomBS: parseInt(formData.get('kolomBS')),
            jumlahIsian: parseInt(formData.get('jumlahIsian')),
            kolomIsian: parseInt(formData.get('kolomIsian')),
            jumlahEsai: parseInt(formData.get('jumlahEsai')),
            barisEsai: parseInt(formData.get('barisEsai')),
            ukuranBubble: parseFloat(formData.get('ukuranBubble')),
            fontOpsi: parseFloat(formData.get('fontOpsi')),
            ukuranKertas: formData.get('ukuranKertas'),
            logoKiri: this.logoKiri,
            logoKanan: this.logoKanan,
            createdAt: new Date().toISOString()
        };
    },

        /**
     * Generate LJK HTML (FIXED - Kelas/Semester)
     */
    async generateLJKHTML(config, siswa = null) {
        const opsiHuruf = ['A', 'B', 'C', 'D', 'E', 'F'];
        let qrCodeData = '';

        // Generate QR Code jika ada siswa
        if (siswa) {
            try {
                const qrData = JSON.stringify({
                    siswaId: siswa.id,
                    nama: siswa.namaLengkap,
                    nisn: siswa.nisn,
                    noUrut: siswa.noUrut,
                    sekolah: config.namaSekolah,
                    kelas: config.namaKelas,
                    ljkId: config.id
                });
                qrCodeData = await Utils.generateQRCode(qrData, 150);
            } catch (error) {
                console.warn('QR Code generation failed:', error);
            }
        }

        // ✅ GET SEMESTER INFO
        const semesterData = await Database.query('semester', s => s.active);
        const semester = semesterData.length > 0 ? semesterData[0] : null;
        const semesterText = semester ? semester.jenisSemester : '';

        let html = `
            <div class="ljk-container" style="position: relative; background: white; padding: 15mm; font-family: Arial, sans-serif; color: black;">
                ${qrCodeData ? `<img src="${qrCodeData}" style="position: absolute; top: 10mm; right: 10mm; width: 20mm; height: 20mm;">` : ''}
                
                <!-- Header -->
                <div style="text-align: center; border-bottom: 1.75pt solid black; padding-bottom: 8mm; margin-bottom: 8mm;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5mm;">
                        ${config.logoKiri ? `<img src="${config.logoKiri}" style="height: 25mm;">` : '<div style="width: 25mm;"></div>'}
                        <div style="flex: 1;">
                            <h2 style="font-size: 18pt; margin: 2mm 0; font-weight: bold;">LEMBAR JAWABAN KOMPUTER</h2>
                            <h1 style="font-size: 22pt; margin: 2mm 0; font-weight: bold;">${config.namaSekolah}</h1>
                            <h3 style="font-size: 14pt; margin: 2mm 0;">${config.jenisUlangan} - ${config.tahunAjar}</h3>
                        </div>
                        ${config.logoKanan ? `<img src="${config.logoKanan}" style="height: 25mm;">` : '<div style="width: 25mm;"></div>'}
                    </div>
                </div>

                <!-- ✅ Info Ujian (UPDATED) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 5mm; font-size: 10pt;">
                    <div style="display: flex;">
                        <span style="min-width: 120px;">Mata Pelajaran</span>
                        <span>: ${config.namaMapel}</span>
                    </div>
                    <div style="display: flex;">
                        <span style="min-width: 100px;">Kelas/Semester</span>
                        <span>: ${config.namaKelas} / ${semesterText}</span>
                    </div>
                    <div style="display: flex;">
                        <span style="min-width: 120px;">Hari/Tanggal</span>
                        <span>: ${config.tanggalUjian}</span>
                    </div>
                    <div style="display: flex;">
                        <span style="min-width: 100px;">Waktu</span>
                        <span>: ${config.waktu} Menit</span>
                    </div>
                    ${siswa ? `
                    <div style="display: flex;">
                        <span style="min-width: 120px;">Nama</span>
                        <span>: <strong>${siswa.namaLengkap}</strong></span>
                    </div>
                    <div style="display: flex;">
                        <span style="min-width: 100px;">No. Urut</span>
                        <span>: <strong>${siswa.noUrut}</strong></span>
                    </div>
                    ` : `
                    <div style="display: flex;">
                        <span style="min-width: 120px;">Nama</span>
                        <span>: ________________________________</span>
                    </div>
                    <div style="display: flex;">
                        <span style="min-width: 100px;">No. Urut</span>
                        <span>: ________________________________</span>
                    </div>
                    `}
                </div>

                <!-- Petunjuk -->
                <div style="background: #e3f2fd; padding: 3mm; margin-bottom: 5mm; font-size: 9pt; border-left: 3pt solid #2196F3;">
                    <strong>PETUNJUK:</strong> Hitamkan/Silang (X) bulatan jawaban dengan pensil 2B. Jangan coret-coret lembar ini!
                </div>
        `;

        // ... (sisanya tetap sama - PG, BS, Isian, Esai)

        // Soal Pilihan Ganda (HURUF DI DALAM KOTAK)
        if (config.jumlahPG > 0) {
            html += `
                <div style="border: 1pt solid #ccc; padding: 3mm; margin-bottom: 4mm; page-break-inside: avoid;">
                    <div style="background: linear-gradient(135deg, #4A90E2, #5AB9EA); color: white; padding: 2mm; margin: -3mm -3mm 3mm -3mm; font-weight: bold; font-size: 11pt;">
                        PILIHAN GANDA (${config.jumlahPG} soal)
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(${config.kolomPG}, 1fr); gap: 2mm;">
            `;

            for (let i = 1; i <= config.jumlahPG; i++) {
                html += `<div style="display: flex; align-items: center; gap: 2mm; font-size: ${config.fontOpsi}pt;">`;
                html += `<span style="min-width: 15px; font-weight: 600;">${i}.</span>`;
                
                for (let j = 0; j < config.opsiPG; j++) {
                    html += `
                        <div style="
                            width: ${config.ukuranBubble * 2}pt; 
                            height: ${config.ukuranBubble * 2}pt; 
                            border: 1pt solid #333;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: 600;
                            font-size: ${config.fontOpsi}pt;
                            color: #4A90E2;
                        ">${opsiHuruf[j]}</div>
                    `;
                }
                
                html += `</div>`;
            }

            html += `
                    </div>
                </div>
            `;
        }

        // Soal Benar/Salah (HURUF DI DALAM KOTAK)
        if (config.jumlahBS > 0) {
            html += `
                <div style="border: 1pt solid #ccc; padding: 3mm; margin-bottom: 4mm; page-break-inside: avoid;">
                    <div style="background: linear-gradient(135deg, #27AE60, #2ECC71); color: white; padding: 2mm; margin: -3mm -3mm 3mm -3mm; font-weight: bold; font-size: 11pt;">
                        BENAR / SALAH (${config.jumlahBS} soal)
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(${config.kolomBS}, 1fr); gap: 2mm;">
            `;

            for (let i = 1; i <= config.jumlahBS; i++) {
                html += `<div style="display: flex; align-items: center; gap: 2mm; font-size: ${config.fontOpsi}pt;">`;
                html += `<span style="min-width: 15px; font-weight: 600;">${i}.</span>`;
                
                html += `
                    <div style="
                        width: ${config.ukuranBubble * 2}pt; 
                        height: ${config.ukuranBubble * 2}pt; 
                        border: 1pt solid #333;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: ${config.fontOpsi}pt;
                        color: #27AE60;
                    ">B</div>
                `;
                
                html += `
                    <div style="
                        width: ${config.ukuranBubble * 2}pt; 
                        height: ${config.ukuranBubble * 2}pt; 
                        border: 1pt solid #333;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 600;
                        font-size: ${config.fontOpsi}pt;
                        color: #E74C3C;
                    ">S</div>
                `;
                
                html += `</div>`;
            }

            html += `
                    </div>
                </div>
            `;
        }

        // Soal Isian Singkat
        if (config.jumlahIsian > 0) {
            html += `
                <div style="border: 1pt solid #ccc; padding: 3mm; margin-bottom: 4mm; page-break-inside: avoid;">
                    <div style="background: linear-gradient(135deg, #F39C12, #F1C40F); color: white; padding: 2mm; margin: -3mm -3mm 3mm -3mm; font-weight: bold; font-size: 11pt;">
                        ISIAN SINGKAT (${config.jumlahIsian} soal)
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(${config.kolomIsian}, 1fr); gap: 3mm;">
            `;

            for (let i = 1; i <= config.jumlahIsian; i++) {
                html += `
                    <div style="display: flex; align-items: center; font-size: 9pt;">
                        <span style="min-width: 20px; font-weight: 600;">${i}.</span>
                        <span style="flex: 1; border-bottom: 1pt dotted #333; height: 15pt;"></span>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        // Soal Esai
        if (config.jumlahEsai > 0) {
            html += `
                <div style="border: 1pt solid #ccc; padding: 3mm; page-break-inside: avoid;">
                    <div style="background: linear-gradient(135deg, #9B59B6, #8E44AD); color: white; padding: 2mm; margin: -3mm -3mm 3mm -3mm; font-weight: bold; font-size: 11pt;">
                        ESAI (${config.jumlahEsai} soal)
                    </div>
            `;

            for (let i = 1; i <= config.jumlahEsai; i++) {
                html += `
                    <div style="margin-bottom: 3mm; page-break-inside: avoid;">
                        <div style="font-weight: 600; margin-bottom: 1mm;">Nomor ${i}:</div>
                `;
                
                for (let j = 0; j < config.barisEsai; j++) {
                    html += `<div style="border-bottom: 1pt solid #ccc; height: 15pt; margin-bottom: 2pt;"></div>`;
                }
                
                html += `</div>`;
            }

            html += `</div>`;
        }

        html += `</div>`;

        return html;
    },

    /**
     * Simpan konfigurasi LJK
     */
    async simpanKonfigurasi() {
        if (!this.currentConfig) {
            Utils.showNotification('Buat preview terlebih dahulu', 'warning');
            return;
        }

        try {
            Utils.showLoading(true);

            const existing = await Database.query('ljk', l => 
                l.kelasId === this.currentConfig.kelasId && 
                l.mapelId === this.currentConfig.mapelId &&
                l.rencanaId === this.currentConfig.rencanaId
            );

            if (existing.length > 0) {
                if (!confirm('LJK dengan konfigurasi yang sama sudah ada. Timpa?')) {
                    Utils.showLoading(false);
                    return;
                }
                this.currentConfig.id = existing[0].id;
                await Database.update('ljk', this.currentConfig);
            } else {
                await Database.add('ljk', this.currentConfig);
            }

            Utils.showLoading(false);
            Utils.showNotification('Konfigurasi LJK berhasil disimpan', 'success');
        } catch (error) {
            Utils.showLoading(false);
            console.error('Error simpan LJK:', error);
            Utils.showNotification('Gagal menyimpan: ' + error.message, 'danger');
        }
    },

       /**
     * Download PDF untuk semua siswa (FIXED)
     */
    async downloadPDF() {
        if (!this.currentConfig) {
            Utils.showNotification('Buat preview terlebih dahulu', 'warning');
            return;
        }

        Utils.showLoading(true);

        try {
            const siswaList = await Database.query('siswa', s => s.kelasId === this.currentConfig.kelasId);

            if (siswaList.length === 0) {
                Utils.showLoading(false);
                Utils.showNotification('Tidak ada siswa. Menggunakan LJK kosong...', 'info');
                await this.downloadSinglePDF(null);
                return;
            }

            // ✅ Check jsPDF availability
            if (typeof window.jspdf === 'undefined') {
                throw new Error('Library jsPDF tidak tersedia. Pastikan script sudah dimuat.');
            }

            const { jsPDF } = window.jspdf;
            
            // Determine paper size
            let format = 'a4';
            if (this.currentConfig.ukuranKertas === 'F4') {
                format = [210, 330];
            } else if (this.currentConfig.ukuranKertas === 'Letter') {
                format = 'letter';
            }

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: format
            });

            let successCount = 0;
            let failCount = 0;

            // ✅ Process each student
            for (let i = 0; i < siswaList.length; i++) {
                const siswa = siswaList[i];
                
                try {
                    console.log(`📄 Generating LJK ${i+1}/${siswaList.length}: ${siswa.namaLengkap}`);

                    // ✅ Generate LJK HTML
                    const ljkHtml = await this.generateLJKHTML(this.currentConfig, siswa);
                    
                    // ✅ Create temporary container with better isolation
                    const tempDiv = document.createElement('div');
                    tempDiv.style.cssText = `
                        position: absolute;
                        left: -99999px;
                        top: 0;
                        width: 210mm;
                        background: white;
                        z-index: -1;
                    `;
                    tempDiv.innerHTML = ljkHtml;
                    document.body.appendChild(tempDiv);

                    // ✅ Wait for rendering
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // ✅ Convert to canvas with safer options
                    const canvas = await html2canvas(tempDiv.firstElementChild, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        width: 210 * 3.7795275591, // 210mm in pixels
                        windowWidth: 210 * 3.7795275591,
                        onclone: (clonedDoc) => {
                            // Ensure styles are applied in cloned document
                            const clonedDiv = clonedDoc.querySelector('div');
                            if (clonedDiv) {
                                clonedDiv.style.background = 'white';
                                clonedDiv.style.color = 'black';
                            }
                        }
                    });

                    // ✅ Convert canvas to image
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const imgWidth = pdf.internal.pageSize.getWidth();
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    // ✅ Add page if not first
                    if (i > 0) {
                        pdf.addPage(format);
                    }

                    // ✅ Add image to PDF
                    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

                    successCount++;
                    
                    // ✅ Clean up
                    document.body.removeChild(tempDiv);

                } catch (error) {
                    console.error(`❌ Error processing ${siswa.namaLengkap}:`, error);
                    failCount++;
                    
                    // Try to clean up if div still exists
                    const leftoverDiv = document.querySelector('[style*="-99999px"]');
                    if (leftoverDiv) {
                        document.body.removeChild(leftoverDiv);
                    }
                }

                // ✅ Update progress
                if ((i + 1) % 5 === 0) {
                    console.log(`📊 Progress: ${i + 1}/${siswaList.length}`);
                }
            }

            // ✅ Save PDF
            const filename = `LJK_${this.currentConfig.namaKelas}_${this.currentConfig.singkatan}_${new Date().getTime()}.pdf`;
            pdf.save(filename);

            Utils.showLoading(false);
            
            if (failCount > 0) {
                Utils.showNotification(
                    `PDF diunduh dengan ${successCount} berhasil, ${failCount} gagal`,
                    'warning',
                    5000
                );
            } else {
                Utils.showNotification(
                    `PDF berhasil diunduh (${successCount} lembar)`,
                    'success'
                );
            }

        } catch (error) {
            Utils.showLoading(false);
            console.error('❌ Error download PDF:', error);
            Utils.showNotification('Gagal membuat PDF: ' + error.message, 'danger');
        }
    },

    /**
     * Download single PDF (untuk LJK kosong atau preview)
     */
    async downloadSinglePDF(siswa = null) {
        try {
            Utils.showLoading(true);

            const ljkHtml = await this.generateLJKHTML(this.currentConfig, siswa);
            
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `
                position: absolute;
                left: -99999px;
                top: 0;
                width: 210mm;
                background: white;
                z-index: -1;
            `;
            tempDiv.innerHTML = ljkHtml;
            document.body.appendChild(tempDiv);

            await new Promise(resolve => setTimeout(resolve, 200));

            const canvas = await html2canvas(tempDiv.firstElementChild, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 210 * 3.7795275591,
                windowWidth: 210 * 3.7795275591
            });

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

            const filename = siswa ? 
                `LJK_${siswa.namaLengkap}_${this.currentConfig.singkatan}.pdf` :
                `LJK_Kosong_${this.currentConfig.singkatan}.pdf`;
            
            pdf.save(filename);

            document.body.removeChild(tempDiv);

            Utils.showLoading(false);
            Utils.showNotification('PDF berhasil diunduh', 'success');

        } catch (error) {
            Utils.showLoading(false);
            console.error('Error download single PDF:', error);
            Utils.showNotification('Gagal membuat PDF: ' + error.message, 'danger');
        }
    },

    /**
     * ALTERNATIVE: Download menggunakan window.print()
     */
    async printLJK() {
        if (!this.currentConfig) {
            Utils.showNotification('Buat preview terlebih dahulu', 'warning');
            return;
        }

        try {
            const siswaList = await Database.query('siswa', s => s.kelasId === this.currentConfig.kelasId);
            
            // Create print window
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            printWindow.document.write('<html><head><title>Print LJK</title>');
            printWindow.document.write('<style>');
            printWindow.document.write(`
                @page {
                    size: A4;
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                }
                .ljk-container {
                    page-break-after: always;
                }
                @media print {
                    .ljk-container:last-child {
                        page-break-after: auto;
                    }
                }
            `);
            printWindow.document.write('</style></head><body>');

            // Generate LJK for each student
            for (const siswa of siswaList) {
                const ljkHtml = await this.generateLJKHTML(this.currentConfig, siswa);
                printWindow.document.write(ljkHtml);
            }

            printWindow.document.write('</body></html>');
            printWindow.document.close();

            // Wait for content to load
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);

            Utils.showNotification('Jendela print dibuka', 'info');

        } catch (error) {
            console.error('Error print LJK:', error);
            Utils.showNotification('Gagal membuka print: ' + error.message, 'danger');
        }
    }
};