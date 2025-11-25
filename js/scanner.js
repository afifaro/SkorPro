/**
 * SKORPRO - Scanner LJK
 * Scan jawaban siswa (otomatis dengan QR / manual)
 */

const Scanner = {
    currentMode: 'auto',
    videoStream: null,
    currentLJK: null,

    /**
     * Inisialisasi module
     */
    async init() {
        await this.loadScannerPage();
    },

    /**
     * Load halaman scanner
     */
    async loadScannerPage() {
        const content = document.getElementById('scannerContent');
        if (!content) return;

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Scanner LJK</h3>
                    <div class="btn-group">
                        <button class="btn btn-primary active" id="btnModeAuto">📷 Mode Otomatis</button>
                        <button class="btn btn-secondary" id="btnModeManual">📁 Mode Manual</button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="scannerModeAuto">
                        <div class="alert alert-info">
                            <strong>Mode Otomatis:</strong> Gunakan kamera untuk scan QR Code pada LJK
                        </div>
                        
                        <div style="text-align: center; margin: 2rem 0;">
                            <video id="scannerVideo" style="max-width: 100%; border: 2px solid var(--border-color); border-radius: 8px; display: none;"></video>
                            <canvas id="scannerCanvas" style="display: none;"></canvas>
                            
                            <div id="scannerPlaceholder" style="padding: 3rem; background: var(--bg-secondary); border-radius: 8px;">
                                <h3>📷</h3>
                                <p>Klik tombol di bawah untuk memulai scan</p>
                            </div>
                        </div>

                        <div class="btn-group" style="justify-content: center;">
                            <button class="btn btn-success" id="btnStartCamera">🎥 Mulai Kamera</button>
                            <button class="btn btn-danger" id="btnStopCamera" style="display: none;">⏹️ Hentikan</button>
                        </div>
                    </div>

                    <div id="scannerModeManual" style="display: none;">
                        <div class="alert alert-info">
                            <strong>Mode Manual:</strong> Upload foto LJK dan pilih siswa secara manual
                        </div>

                        <form id="formScanManual">
                            <div class="form-group">
                                <label class="required">Upload Foto LJK</label>
                                <input type="file" class="form-control" id="fotoLJK" accept="image/*" required>
                            </div>

                            <div id="previewFoto" style="text-align: center; margin: 1rem 0;"></div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="required">Sekolah</label>
                                    <select class="form-select" id="scanSekolah" required>
                                        <option value="">Pilih Sekolah</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="required">Kelas</label>
                                    <select class="form-select" id="scanKelas" required>
                                        <option value="">Pilih Kelas</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="required">Mata Pelajaran</label>
                                    <select class="form-select" id="scanMapel" required>
                                        <option value="">Pilih Mapel</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="required">LJK</label>
                                    <select class="form-select" id="scanLJK" required>
                                        <option value="">Pilih LJK</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="required">Cari Siswa</label>
                                <input type="text" class="form-control" id="searchSiswa" 
                                    placeholder="Ketik nama, no urut, atau NIS/NISN">
                                <div id="siswaResults" style="margin-top: 0.5rem;"></div>
                            </div>

                            <input type="hidden" id="selectedSiswaId">

                            <div class="btn-group mt-3">
                                <button type="button" class="btn btn-primary" id="btnProsesScan">
                                    ✅ Proses Scan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div id="inputJawabanContainer" style="display: none;">
                <div class="card mt-3">
                    <div class="card-header">
                        <h3>Input Jawaban</h3>
                        <p id="infoSiswa" style="margin: 0.5rem 0 0 0; color: var(--text-secondary);"></p>
                    </div>
                    <div class="card-body" id="inputJawabanContent"></div>
                </div>
            </div>
        `;

        this.setupScannerPage();
    },

    /**
     * Setup scanner page
     */
    setupScannerPage() {
        // Mode switcher
        document.getElementById('btnModeAuto')?.addEventListener('click', () => this.switchMode('auto'));
        document.getElementById('btnModeManual')?.addEventListener('click', () => this.switchMode('manual'));

        // Camera controls
        document.getElementById('btnStartCamera')?.addEventListener('click', () => this.startCamera());
        document.getElementById('btnStopCamera')?.addEventListener('click', () => this.stopCamera());

        // Manual mode setup
        this.setupManualMode();
    },

    /**
     * Switch scanning mode
     */
    switchMode(mode) {
        this.currentMode = mode;

        const btnAuto = document.getElementById('btnModeAuto');
        const btnManual = document.getElementById('btnModeManual');
        const modeAuto = document.getElementById('scannerModeAuto');
        const modeManual = document.getElementById('scannerModeManual');

        if (mode === 'auto') {
            btnAuto.classList.add('active', 'btn-primary');
            btnAuto.classList.remove('btn-secondary');
            btnManual.classList.remove('active', 'btn-primary');
            btnManual.classList.add('btn-secondary');
            modeAuto.style.display = 'block';
            modeManual.style.display = 'none';
            this.stopCamera();
        } else {
            btnManual.classList.add('active', 'btn-primary');
            btnManual.classList.remove('btn-secondary');
            btnAuto.classList.remove('active', 'btn-primary');
            btnAuto.classList.add('btn-secondary');
            modeManual.style.display = 'block';
            modeAuto.style.display = 'none';
        }
    },

    /**
     * Start camera for QR scanning
     */
    async startCamera() {
        try {
            const video = document.getElementById('scannerVideo');
            const placeholder = document.getElementById('scannerPlaceholder');
            const btnStart = document.getElementById('btnStartCamera');
            const btnStop = document.getElementById('btnStopCamera');

            this.videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });

            video.srcObject = this.videoStream;
            video.play();

            placeholder.style.display = 'none';
            video.style.display = 'block';
            btnStart.style.display = 'none';
            btnStop.style.display = 'inline-flex';

            // Start QR detection
            this.scanQRCode();

            Utils.showNotification('Kamera berhasil diaktifkan', 'success');
        } catch (error) {
            Utils.showNotification('Gagal mengakses kamera: ' + error.message, 'danger');
        }
    },

    /**
     * Stop camera
     */
    stopCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;

            const video = document.getElementById('scannerVideo');
            const placeholder = document.getElementById('scannerPlaceholder');
            const btnStart = document.getElementById('btnStartCamera');
            const btnStop = document.getElementById('btnStopCamera');

            if (video) video.style.display = 'none';
            if (placeholder) placeholder.style.display = 'block';
            if (btnStart) btnStart.style.display = 'inline-flex';
            if (btnStop) btnStop.style.display = 'none';
        }
    },

    /**
     * Scan QR Code from video
     */
    async scanQRCode() {
        // Note: Implementasi QR scanning memerlukan library tambahan seperti jsQR
        // Untuk demo, kita akan simulate dengan interval
        
        Utils.showNotification('Fitur scan QR memerlukan library jsQR. Gunakan mode manual untuk saat ini.', 'info');
        this.stopCamera();
        this.switchMode('manual');
    },

    /**
     * Setup manual mode
     */
    async setupManualMode() {
        // Load data for dropdowns
        const sekolahList = await Database.getAll('sekolah');
        const mapelList = await Database.getAll('mapel');

        const sekolahSelect = document.getElementById('scanSekolah');
        const kelasSelect = document.getElementById('scanKelas');
        const mapelSelect = document.getElementById('scanMapel');
        const ljkSelect = document.getElementById('scanLJK');

        if (sekolahSelect) {
            sekolahSelect.innerHTML = '<option value="">Pilih Sekolah</option>' +
                sekolahList.map(s => `<option value="${s.id}">${s.namaSekolah}</option>`).join('');

            sekolahSelect.addEventListener('change', async () => {
                const sekolahId = sekolahSelect.value;
                const kelasList = sekolahId ?
                    await Database.query('kelas', k => k.sekolahId === sekolahId) : [];
                
                kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>' +
                    kelasList.map(k => `<option value="${k.id}">${k.namaKelas}</option>`).join('');
            });
        }

        if (mapelSelect) {
            mapelSelect.innerHTML = '<option value="">Pilih Mapel</option>' +
                mapelList.map(m => `<option value="${m.id}">${m.namaMapel}</option>`).join('');

            mapelSelect.addEventListener('change', async () => {
                const mapelId = mapelSelect.value;
                const kelasId = kelasSelect.value;
                
                if (mapelId && kelasId) {
                    const ljkList = await Database.query('ljk', l => 
                        l.mapelId === mapelId && l.kelasId === kelasId
                    );
                    
                    ljkSelect.innerHTML = '<option value="">Pilih LJK</option>' +
                        ljkList.map(l => `<option value="${l.id}">${l.jenisUlangan} - ${l.singkatan}</option>`).join('');
                }
            });
        }

        // Search siswa
        const searchSiswa = document.getElementById('searchSiswa');
        if (searchSiswa) {
            searchSiswa.addEventListener('input', Utils.debounce(async (e) => {
                const query = e.target.value.toLowerCase();
                const kelasId = kelasSelect.value;

                if (!kelasId || query.length < 2) {
                    document.getElementById('siswaResults').innerHTML = '';
                    return;
                }

                const siswaList = await Database.query('siswa', s => 
                    s.kelasId === kelasId && (
                        s.namaLengkap.toLowerCase().includes(query) ||
                        s.nisn.includes(query) ||
                        String(s.noUrut).includes(query)
                    )
                );

                this.displaySiswaResults(siswaList);
            }, 300));
        }

        // Upload foto
        document.getElementById('fotoLJK')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    document.getElementById('previewFoto').innerHTML = `
                        <img src="${ev.target.result}" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: var(--shadow-md);">
                    `;
                };
                reader.readAsDataURL(file);
            }
        });

        // Proses scan button
        document.getElementById('btnProsesScan')?.addEventListener('click', () => this.prosesScanManual());
    },

    /**
     * Display siswa search results
     */
    displaySiswaResults(siswaList) {
        const container = document.getElementById('siswaResults');
        if (!container) return;

        if (siswaList.length === 0) {
            container.innerHTML = '<p class="text-muted" style="font-size: 0.9rem;">Tidak ada hasil</p>';
            return;
        }

        container.innerHTML = `
            <div style="border: 1px solid var(--border-color); border-radius: 8px; max-height: 200px; overflow-y: auto;">
                ${siswaList.map(s => `
                    <div class="siswa-item" data-id="${s.id}" style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s;">
                        <div style="font-weight: 600;">${s.namaLengkap}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            No. Urut: ${s.noUrut} | NIS/NISN: ${s.nisn}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Click handler
        container.querySelectorAll('.siswa-item').forEach(item => {
            item.addEventListener('click', () => {
                container.querySelectorAll('.siswa-item').forEach(i => i.style.background = '');
                item.style.background = 'var(--bg-tertiary)';
                document.getElementById('selectedSiswaId').value = item.getAttribute('data-id');
            });

            item.addEventListener('mouseenter', () => {
                if (item.style.background !== 'var(--bg-tertiary)') {
                    item.style.background = 'var(--bg-secondary)';
                }
            });

            item.addEventListener('mouseleave', () => {
                if (item.style.background !== 'var(--bg-tertiary)') {
                    item.style.background = '';
                }
            });
        });
    },

    /**
     * Proses scan manual
     */
    async prosesScanManual() {
        const ljkId = document.getElementById('scanLJK').value;
        const siswaId = document.getElementById('selectedSiswaId').value;

        if (!ljkId || !siswaId) {
            Utils.showNotification('Lengkapi semua data terlebih dahulu', 'warning');
            return;
        }

        Utils.showLoading(true);

        try {
            this.currentLJK = await Database.get('ljk', ljkId);
            const siswa = await Database.get('siswa', siswaId);

            await this.showInputJawaban(siswa);

            Utils.showLoading(false);
        } catch (error) {
            Utils.showLoading(false);
            Utils.showNotification('Gagal memproses: ' + error.message, 'danger');
        }
    },

    /**
     * Show input jawaban form
     */
    async showInputJawaban(siswa) {
        const container = document.getElementById('inputJawabanContainer');
        const content = document.getElementById('inputJawabanContent');
        const infoSiswa = document.getElementById('infoSiswa');

        infoSiswa.innerHTML = `
            <strong>${siswa.namaLengkap}</strong> (${siswa.nisn}) - 
            ${this.currentLJK.namaKelas} - ${this.currentLJK.namaMapel}
        `;

        let html = '<form id="formInputJawaban">';

        // Input PG
        if (this.currentLJK.jumlahPG > 0) {
            html += `
                <div class="card mb-3">
                    <div class="card-header" style="background: linear-gradient(135deg, #4A90E2, #5AB9EA); color: white;">
                        <h4>Pilihan Ganda (${this.currentLJK.jumlahPG} soal)</h4>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
            `;

            const opsiHuruf = ['A', 'B', 'C', 'D', 'E', 'F'];
            for (let i = 1; i <= this.currentLJK.jumlahPG; i++) {
                html += `
                    <div class="form-group">
                        <label>Nomor ${i}</label>
                        <select class="form-select" name="pg_${i}">
                            <option value="">-</option>
                            ${opsiHuruf.slice(0, this.currentLJK.opsiPG).map(o => 
                                `<option value="${o}">${o}</option>`
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

        // Input Benar/Salah
        if (this.currentLJK.jumlahBS > 0) {
            html += `
                <div class="card mb-3">
                    <div class="card-header" style="background: linear-gradient(135deg, #27AE60, #2ECC71); color: white;">
                        <h4>Benar / Salah (${this.currentLJK.jumlahBS} soal)</h4>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
            `;

            for (let i = 1; i <= this.currentLJK.jumlahBS; i++) {
                html += `
                    <div class="form-group">
                        <label>Nomor ${i}</label>
                        <select class="form-select" name="bs_${i}">
                            <option value="">-</option>
                            <option value="B">Benar</option>
                            <option value="S">Salah</option>
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

        // Input Isian
        if (this.currentLJK.jumlahIsian > 0) {
            html += `
                <div class="card mb-3">
                    <div class="card-header" style="background: linear-gradient(135deg, #F39C12, #F1C40F); color: white;">
                        <h4>Isian Singkat (${this.currentLJK.jumlahIsian} soal)</h4>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
            `;

            for (let i = 1; i <= this.currentLJK.jumlahIsian; i++) {
                html += `
                    <div class="form-group">
                        <label>Nomor ${i} (Skor)</label>
                        <input type="number" class="form-control" name="isian_${i}" min="0" step="0.1" placeholder="0">
                    </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        // Input Esai
        if (this.currentLJK.jumlahEsai > 0) {
            html += `
                <div class="card mb-3">
                    <div class="card-header" style="background: linear-gradient(135deg, #9B59B6, #8E44AD); color: white;">
                        <h4>Esai (${this.currentLJK.jumlahEsai} soal)</h4>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
            `;

            for (let i = 1; i <= this.currentLJK.jumlahEsai; i++) {
                html += `
                    <div class="form-group">
                        <label>Nomor ${i} (Skor)</label>
                        <input type="number" class="form-control" name="esai_${i}" min="0" step="0.1" placeholder="0">
                    </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        html += `
            <div class="btn-group">
                <button type="button" class="btn btn-success btn-lg" id="btnSimpanJawaban">
                    💾 Simpan Jawaban
                </button>
                <button type="button" class="btn btn-secondary" id="btnBatalInput">
                    ❌ Batal
                </button>
            </div>
        </form>
        `;

        content.innerHTML = html;
        container.style.display = 'block';

        // Scroll to form
        container.scrollIntoView({ behavior: 'smooth' });

        // Setup buttons
        document.getElementById('btnSimpanJawaban')?.addEventListener('click', () => this.simpanJawaban(siswa));
        document.getElementById('btnBatalInput')?.addEventListener('click', () => {
            container.style.display = 'none';
        });
    },

    /**
     * Simpan jawaban siswa
     */
    async simpanJawaban(siswa) {
        const form = document.getElementById('formInputJawaban');
        const formData = new FormData(form);

        const jawaban = {
            id: Utils.generateID('jawaban_'),
            ljkId: this.currentLJK.id,
            siswaId: siswa.id,
            jawabanPG: [],
            jawabanBS: [],
            skorIsian: [],
            skorEsai: [],
            totalSkor: 0,
            createdAt: new Date().toISOString()
        };

        // Collect PG answers
        for (let i = 1; i <= this.currentLJK.jumlahPG; i++) {
            jawaban.jawabanPG.push(formData.get(`pg_${i}`) || '');
        }

        // Collect BS answers
        for (let i = 1; i <= this.currentLJK.jumlahBS; i++) {
            jawaban.jawabanBS.push(formData.get(`bs_${i}`) || '');
        }

        // Collect Isian scores
        for (let i = 1; i <= this.currentLJK.jumlahIsian; i++) {
            const skor = parseFloat(formData.get(`isian_${i}`)) || 0;
            jawaban.skorIsian.push(skor);
            jawaban.totalSkor += skor;
        }

        // Collect Esai scores
        for (let i = 1; i <= this.currentLJK.jumlahEsai; i++) {
            const skor = parseFloat(formData.get(`esai_${i}`)) || 0;
            jawaban.skorEsai.push(skor);
            jawaban.totalSkor += skor;
        }

        try {
            Utils.showLoading(true);

            // Check if already exists
            const existing = await Database.query('jawaban', j => 
                j.ljkId === jawaban.ljkId && j.siswaId === jawaban.siswaId
            );

            if (existing.length > 0) {
                jawaban.id = existing[0].id;
                await Database.update('jawaban', jawaban);
                Utils.showNotification('Jawaban berhasil diupdate', 'success');
            } else {
                await Database.add('jawaban', jawaban);
                Utils.showNotification('Jawaban berhasil disimpan', 'success');
            }

            Utils.showLoading(false);
            
            // Reset form
            document.getElementById('inputJawabanContainer').style.display = 'none';
            form.reset();
            
        } catch (error) {
            Utils.showLoading(false);
            Utils.showNotification('Gagal menyimpan jawaban: ' + error.message, 'danger');
        }
    }
};