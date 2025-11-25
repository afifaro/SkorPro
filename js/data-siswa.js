/**
 * SKORPRO - Data Siswa Module
 * Mengelola semua data: Guru, Sekolah, Kelas, Mapel, Semester, Siswa, Rencana
 */

const DataSiswa = {
    currentTab: 'guru',
    clickCount: 0,
    clickTimer: null,

    /**
     * Inisialisasi module
     */
    init() {
        this.setupTabs();
        this.setupResetSecret();
        this.loadTab('guru');
    },

    /**
     * Setup tab navigation
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tab = btn.getAttribute('data-tab');
                this.loadTab(tab);
            });
        });
    },

    /**
     * Setup tombol reset rahasia (ketuk 5x pada header)
     */
    setupResetSecret() {
        const header = document.getElementById('dataSiswaHeader');
        if (!header) return;

        header.addEventListener('click', () => {
            this.clickCount++;

            if (this.clickTimer) {
                clearTimeout(this.clickTimer);
            }

            if (this.clickCount === 5) {
                this.showResetConfirmation();
                this.clickCount = 0;
            }

            this.clickTimer = setTimeout(() => {
                this.clickCount = 0;
            }, 2000);
        });
    },

    /**
     * Konfirmasi reset
     */
    showResetConfirmation() {
        Utils.confirm(
            'Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!',
            async () => {
                try {
                    Utils.showLoading(true);
                    await Database.resetAll();
                    Utils.showLoading(false);
                    Utils.showNotification('Semua data berhasil dihapus', 'success');
                    this.loadTab(this.currentTab);
                    App.updateDashboard();
                } catch (error) {
                    Utils.showLoading(false);
                    Utils.showNotification('Gagal menghapus data: ' + error.message, 'danger');
                }
            }
        );
    },

    /**
     * Load tab content
     */
    async loadTab(tabName) {
        this.currentTab = tabName;
        const content = document.getElementById('tabContent');
        if (!content) return;

        Utils.showLoading(true);

        try {
            switch(tabName) {
                case 'guru':
                    await this.loadGuruTab(content);
                    break;
                case 'sekolah':
                    await this.loadSekolahTab(content);
                    break;
                case 'kelas':
                    await this.loadKelasTab(content);
                    break;
                case 'mapel':
                    await this.loadMapelTab(content);
                    break;
                case 'semester':
                    await this.loadSemesterTab(content);
                    break;
                case 'siswa':
                    await this.loadSiswaTab(content);
                    break;
                case 'rencana':
                    await this.loadRencanaTab(content);
                    break;
            }
        } catch (error) {
            console.error('Error loading tab:', error);
            content.innerHTML = `<div class="alert alert-danger">Terjadi kesalahan: ${error.message}</div>`;
        }

        Utils.showLoading(false);
    },

    /**
     * TAB GURU
     */
    async loadGuruTab(content) {
        const guru = await Database.getAll('guru');
        const existingGuru = guru.length > 0 ? guru[0] : null;

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Data Guru</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">
                        Hanya dapat menyimpan 1 data guru (akun pengguna)
                    </p>
                </div>
                <div class="card-body">
                    <form id="formGuru">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="required">Nama Lengkap</label>
                                <input type="text" class="form-control" name="namaLengkap" 
                                    value="${existingGuru?.namaLengkap || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="required">Nama Panggilan</label>
                                <input type="text" class="form-control" name="namaPanggilan" 
                                    value="${existingGuru?.namaPanggilan || ''}" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="required">Jenis Kelamin</label>
                                <div class="radio-group">
                                    <label class="radio-label">
                                        <input type="radio" name="jenisKelamin" value="Laki-laki" 
                                            ${existingGuru?.jenisKelamin === 'Laki-laki' ? 'checked' : ''} required>
                                        <span>Laki-laki</span>
                                    </label>
                                    <label class="radio-label">
                                        <input type="radio" name="jenisKelamin" value="Perempuan"
                                            ${existingGuru?.jenisKelamin === 'Perempuan' ? 'checked' : ''} required>
                                        <span>Perempuan</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="required">Jenis Identitas</label>
                                <select class="form-select" name="jenisIdentitas" required>
                                    <option value="">Pilih Jenis</option>
                                    <option value="NIP" ${existingGuru?.jenisIdentitas === 'NIP' ? 'selected' : ''}>NIP (18 digit)</option>
                                    <option value="NUPTK" ${existingGuru?.jenisIdentitas === 'NUPTK' ? 'selected' : ''}>NUPTK (16 digit)</option>
                                    <option value="NRG" ${existingGuru?.jenisIdentitas === 'NRG' ? 'selected' : ''}>NRG (12 digit)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Nomor Identitas</label>
                                <input type="text" class="form-control" name="nomorIdentitas" 
                                    value="${existingGuru?.nomorIdentitas || ''}" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="required">Jenis Guru</label>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="jenisGuru" value="Guru Kelas"
                                        ${existingGuru?.jenisGuru === 'Guru Kelas' ? 'checked' : ''} required>
                                    <span>Guru Kelas</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="jenisGuru" value="Guru Mapel"
                                        ${existingGuru?.jenisGuru === 'Guru Mapel' ? 'checked' : ''} required>
                                    <span>Guru Mapel</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="jenisGuru" value="Guru Rangkap"
                                        ${existingGuru?.jenisGuru === 'Guru Rangkap' ? 'checked' : ''} required>
                                    <span>Guru Rangkap</span>
                                </label>
                            </div>
                        </div>

                        <div class="btn-group">
                            <button type="submit" class="btn btn-primary">
                                ${existingGuru ? '💾 Update Data' : '💾 Simpan Data'}
                            </button>
                            ${existingGuru ? '<button type="button" class="btn btn-danger" id="btnHapusGuru">🗑️ Hapus Data</button>' : ''}
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.setupGuruForm(existingGuru);
    },

    setupGuruForm(existingGuru) {
        const form = document.getElementById('formGuru');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                id: existingGuru?.id || 'guru_001',
                namaLengkap: formData.get('namaLengkap'),
                namaPanggilan: formData.get('namaPanggilan'),
                jenisKelamin: formData.get('jenisKelamin'),
                jenisIdentitas: formData.get('jenisIdentitas'),
                nomorIdentitas: formData.get('nomorIdentitas'),
                jenisGuru: formData.get('jenisGuru'),
                createdAt: existingGuru?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Validasi nomor identitas
            if (!Utils.validateNIP(data.nomorIdentitas, data.jenisIdentitas)) {
                Utils.showNotification(
                    `Nomor ${data.jenisIdentitas} tidak valid. Harus ${data.jenisIdentitas === 'NIP' ? 18 : data.jenisIdentitas === 'NUPTK' ? 16 : 12} digit`,
                    'danger'
                );
                return;
            }

            try {
                Utils.showLoading(true);
                
                if (existingGuru) {
                    await Database.update('guru', data);
                    Utils.showNotification('Data guru berhasil diupdate', 'success');
                } else {
                    await Database.add('guru', data);
                    Utils.showNotification('Data guru berhasil disimpan', 'success');
                }
                
                Utils.showLoading(false);
                this.loadTab('guru');
                App.updateDashboard();
            } catch (error) {
                Utils.showLoading(false);
                Utils.showNotification('Gagal menyimpan data: ' + error.message, 'danger');
            }
        });

        // Tombol hapus
        const btnHapus = document.getElementById('btnHapusGuru');
        if (btnHapus) {
            btnHapus.addEventListener('click', () => {
                Utils.confirm('Yakin ingin menghapus data guru?', async () => {
                    try {
                        Utils.showLoading(true);
                        await Database.delete('guru', existingGuru.id);
                        Utils.showLoading(false);
                        Utils.showNotification('Data guru berhasil dihapus', 'success');
                        this.loadTab('guru');
                        App.updateDashboard();
                    } catch (error) {
                        Utils.showLoading(false);
                        Utils.showNotification('Gagal menghapus data: ' + error.message, 'danger');
                    }
                });
            });
        }
    },

    /**
     * TAB SEKOLAH
     */
    async loadSekolahTab(content) {
        const sekolahList = await Database.getAll('sekolah');

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Data Sekolah</h3>
                    <button class="btn btn-primary" id="btnTambahSekolah">➕ Tambah Sekolah</button>
                </div>
                <div class="card-body">
                    ${sekolahList.length === 0 ? 
                        '<p class="text-center text-muted">Belum ada data sekolah</p>' :
                        `<div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nama Sekolah</th>
                                        <th>Kepala Sekolah</th>
                                        <th>NIP Kepala Sekolah</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sekolahList.map((sekolah, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${sekolah.namaSekolah}</td>
                                            <td>${sekolah.namaKepala}</td>
                                            <td>${sekolah.nipKepala}</td>
                                            <td class="table-actions">
                                                <button class="action-btn edit" data-id="${sekolah.id}">✏️ Edit</button>
                                                <button class="action-btn delete" data-id="${sekolah.id}">🗑️ Hapus</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>`
                    }
                </div>
            </div>
        `;

        this.setupSekolahActions();
    },

    setupSekolahActions() {
        // Tombol tambah
        const btnTambah = document.getElementById('btnTambahSekolah');
        if (btnTambah) {
            btnTambah.addEventListener('click', () => this.showSekolahModal());
        }

        // Tombol edit
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const sekolah = await Database.get('sekolah', id);
                this.showSekolahModal(sekolah);
            });
        });

        // Tombol hapus
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                Utils.confirm('Yakin ingin menghapus data sekolah ini?', async () => {
                    try {
                        Utils.showLoading(true);
                        await Database.delete('sekolah', id);
                        Utils.showLoading(false);
                        Utils.showNotification('Data sekolah berhasil dihapus', 'success');
                        this.loadTab('sekolah');
                    } catch (error) {
                        Utils.showLoading(false);
                        Utils.showNotification('Gagal menghapus: ' + error.message, 'danger');
                    }
                });
            });
        });
    },

    showSekolahModal(data = null) {
        const modal = document.getElementById('modalContainer');
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${data ? 'Edit Sekolah' : 'Tambah Sekolah'}</h3>
                        <button class="modal-close" id="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="formSekolah">
                            <div class="form-group">
                                <label class="required">Nama Sekolah</label>
                                <input type="text" class="form-control" name="namaSekolah" 
                                    value="${data?.namaSekolah || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="required">Nama Kepala Sekolah</label>
                                <input type="text" class="form-control" name="namaKepala" 
                                    value="${data?.namaKepala || ''}" required>
                            </div>
                            <div class="form-group">
                                <label class="required">NIP Kepala Sekolah</label>
                                <input type="text" class="form-control" name="nipKepala" 
                                    value="${data?.nipKepala || ''}" maxlength="18" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="btnBatal">Batal</button>
                        <button class="btn btn-primary" id="btnSimpan">Simpan</button>
                    </div>
                </div>
            </div>
        `;

        // Close modal
        const closeBtn = document.getElementById('closeModal');
        const batalBtn = document.getElementById('btnBatal');
        
        const closeModal = () => modal.innerHTML = '';
        
        closeBtn.addEventListener('click', closeModal);
        batalBtn.addEventListener('click', closeModal);

        // Submit form
        const simpanBtn = document.getElementById('btnSimpan');
        simpanBtn.addEventListener('click', async () => {
            const form = document.getElementById('formSekolah');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const sekolahData = {
                id: data?.id || Utils.generateID('sekolah_'),
                namaSekolah: formData.get('namaSekolah'),
                namaKepala: formData.get('namaKepala'),
                nipKepala: formData.get('nipKepala'),
                createdAt: data?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                Utils.showLoading(true);
                
                if (data) {
                    await Database.update('sekolah', sekolahData);
                    Utils.showNotification('Data sekolah berhasil diupdate', 'success');
                } else {
                    // Cek duplikasi nama
                    const existing = await Database.query('sekolah', s => s.namaSekolah === sekolahData.namaSekolah);
                    if (existing.length > 0) {
                        Utils.showLoading(false);
                        Utils.showNotification('Nama sekolah sudah ada', 'warning');
                        return;
                    }
                    
                    await Database.add('sekolah', sekolahData);
                    Utils.showNotification('Data sekolah berhasil ditambahkan', 'success');
                }
                
                Utils.showLoading(false);
                closeModal();
                this.loadTab('sekolah');
                App.updateDashboard();
            } catch (error) {
                Utils.showLoading(false);
                Utils.showNotification('Gagal menyimpan: ' + error.message, 'danger');
            }
        });
    },

        /**
     * TAB KELAS
     */
    async loadKelasTab(content) {
        const kelasList = await Database.getAll('kelas');
        const sekolahList = await Database.getAll('sekolah');
        const guru = await Database.getAll('guru');
        const guruData = guru.length > 0 ? guru[0] : null;

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Data Kelas</h3>
                    ${guruData ? 
                        `<button class="btn btn-primary" id="btnTambahKelas">➕ Tambah Kelas</button>` :
                        `<p class="text-warning">⚠️ Silakan lengkapi data guru terlebih dahulu</p>`
                    }
                </div>
                <div class="card-body">
                    ${guruData && kelasList.length === 0 ? 
                        '<p class="text-center text-muted">Belum ada data kelas</p>' :
                        !guruData ? '<p class="text-center text-muted">Data guru belum diisi</p>' :
                        `<div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nama Kelas</th>
                                        <th>Sekolah</th>
                                        <th>Jumlah Siswa</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="kelasTableBody"></tbody>
                            </table>
                        </div>`
                    }
                </div>
            </div>
        `;

        if (guruData && kelasList.length > 0) {
            await this.populateKelasTable(kelasList);
        }

        this.setupKelasActions(guruData);
    },

    async populateKelasTable(kelasList) {
        const tbody = document.getElementById('kelasTableBody');
        if (!tbody) return;

        let html = '';
        for (let i = 0; i < kelasList.length; i++) {
            const kelas = kelasList[i];
            const sekolah = await Database.get('sekolah', kelas.sekolahId);
            const siswaCount = await Database.query('siswa', s => s.kelasId === kelas.id);
            
            html += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${kelas.namaKelas}</td>
                    <td>${sekolah?.namaSekolah || '-'}</td>
                    <td>${siswaCount.length} siswa</td>
                    <td class="table-actions">
                        <button class="action-btn edit" data-id="${kelas.id}">✏️ Edit</button>
                        <button class="action-btn delete" data-id="${kelas.id}">🗑️ Hapus</button>
                    </td>
                </tr>
            `;
        }
        tbody.innerHTML = html;

        // Setup action buttons
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const kelas = await Database.get('kelas', id);
                this.showKelasModal(kelas);
            });
        });

        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                Utils.confirm('Yakin ingin menghapus kelas ini?', async () => {
                    try {
                        Utils.showLoading(true);
                        await Database.delete('kelas', id);
                        Utils.showLoading(false);
                        Utils.showNotification('Kelas berhasil dihapus', 'success');
                        this.loadTab('kelas');
                    } catch (error) {
                        Utils.showLoading(false);
                        Utils.showNotification('Gagal menghapus: ' + error.message, 'danger');
                    }
                });
            });
        });
    },

    setupKelasActions(guruData) {
        const btnTambah = document.getElementById('btnTambahKelas');
        if (btnTambah && guruData) {
            btnTambah.addEventListener('click', () => this.showKelasModal(null, guruData));
        }
    },

    async showKelasModal(data = null, guruData = null) {
        if (!guruData) {
            const guru = await Database.getAll('guru');
            guruData = guru.length > 0 ? guru[0] : null;
        }

        const sekolahList = await Database.getAll('sekolah');
        const kelasList = await Database.getAll('kelas');

        // Validasi berdasarkan jenis guru
        if (guruData.jenisGuru === 'Guru Kelas' && !data) {
            const existingKelas = kelasList.filter(k => k.guruId === guruData.id);
            if (existingKelas.length > 0) {
                Utils.showNotification('Guru Kelas hanya boleh memiliki 1 kelas', 'warning');
                return;
            }
        }

        const modal = document.getElementById('modalContainer');
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${data ? 'Edit Kelas' : 'Tambah Kelas'}</h3>
                        <button class="modal-close" id="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="formKelas">
                            <div class="form-group">
                                <label class="required">Sekolah</label>
                                <select class="form-select" name="sekolahId" required>
                                    <option value="">Pilih Sekolah</option>
                                    ${sekolahList.map(s => `
                                        <option value="${s.id}" ${data?.sekolahId === s.id ? 'selected' : ''}>
                                            ${s.namaSekolah}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Nama Kelas</label>
                                <input type="text" class="form-control" name="namaKelas" 
                                    value="${data?.namaKelas || ''}" 
                                    placeholder="Contoh: VII-A, VIII-B, IX-C" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="btnBatal">Batal</button>
                        <button class="btn btn-primary" id="btnSimpan">Simpan</button>
                    </div>
                </div>
            </div>
        `;

        const closeModal = () => modal.innerHTML = '';
        
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('btnBatal').addEventListener('click', closeModal);

        document.getElementById('btnSimpan').addEventListener('click', async () => {
            const form = document.getElementById('formKelas');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const kelasData = {
                id: data?.id || Utils.generateID('kelas_'),
                sekolahId: formData.get('sekolahId'),
                namaKelas: formData.get('namaKelas'),
                guruId: guruData.id,
                createdAt: data?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                Utils.showLoading(true);

                // Validasi duplikasi nama kelas dalam sekolah yang sama
                if (!data) {
                    const existing = await Database.query('kelas', k => 
                        k.sekolahId === kelasData.sekolahId && 
                        k.namaKelas === kelasData.namaKelas
                    );
                    if (existing.length > 0) {
                        Utils.showLoading(false);
                        Utils.showNotification('Nama kelas sudah ada di sekolah ini', 'warning');
                        return;
                    }
                }

                if (data) {
                    await Database.update('kelas', kelasData);
                    Utils.showNotification('Kelas berhasil diupdate', 'success');
                } else {
                    await Database.add('kelas', kelasData);
                    Utils.showNotification('Kelas berhasil ditambahkan', 'success');
                }

                Utils.showLoading(false);
                closeModal();
                this.loadTab('kelas');
                App.updateDashboard();
            } catch (error) {
                Utils.showLoading(false);
                Utils.showNotification('Gagal menyimpan: ' + error.message, 'danger');
            }
        });
    },

    /**
     * TAB MATA PELAJARAN
     */
    async loadMapelTab(content) {
        const mapelList = await Database.getAll('mapel');
        const guru = await Database.getAll('guru');
        const guruData = guru.length > 0 ? guru[0] : null;

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Data Mata Pelajaran</h3>
                    ${guruData ? 
                        `<button class="btn btn-primary" id="btnTambahMapel">➕ Tambah Mata Pelajaran</button>` :
                        `<p class="text-warning">⚠️ Silakan lengkapi data guru terlebih dahulu</p>`
                    }
                </div>
                <div class="card-body">
                    ${guruData && mapelList.length === 0 ? 
                        '<p class="text-center text-muted">Belum ada data mata pelajaran</p>' :
                        !guruData ? '<p class="text-center text-muted">Data guru belum diisi</p>' :
                        `<div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Nama Mata Pelajaran</th>
                                        <th>Kode Mapel</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${mapelList.map((mapel, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${mapel.namaMapel}</td>
                                            <td>${mapel.kodeMapel || '-'}</td>
                                            <td class="table-actions">
                                                <button class="action-btn edit" data-id="${mapel.id}">✏️ Edit</button>
                                                <button class="action-btn delete" data-id="${mapel.id}">🗑️ Hapus</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>`
                    }
                </div>
            </div>
        `;

        this.setupMapelActions(guruData);
    },

    setupMapelActions(guruData) {
        const btnTambah = document.getElementById('btnTambahMapel');
        if (btnTambah && guruData) {
            btnTambah.addEventListener('click', () => this.showMapelModal(null, guruData));
        }

        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const mapel = await Database.get('mapel', id);
                this.showMapelModal(mapel, guruData);
            });
        });

        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                Utils.confirm('Yakin ingin menghapus mata pelajaran ini?', async () => {
                    try {
                        Utils.showLoading(true);
                        await Database.delete('mapel', id);
                        Utils.showLoading(false);
                        Utils.showNotification('Mata pelajaran berhasil dihapus', 'success');
                        this.loadTab('mapel');
                    } catch (error) {
                        Utils.showLoading(false);
                        Utils.showNotification('Gagal menghapus: ' + error.message, 'danger');
                    }
                });
            });
        });
    },

    async showMapelModal(data = null, guruData = null) {
        if (!guruData) {
            const guru = await Database.getAll('guru');
            guruData = guru.length > 0 ? guru[0] : null;
        }

        const mapelList = await Database.getAll('mapel');

        // Validasi Guru Mapel hanya boleh 1 mapel
        if (guruData.jenisGuru === 'Guru Mapel' && !data) {
            if (mapelList.length > 0) {
                Utils.showNotification('Guru Mapel hanya boleh memiliki 1 mata pelajaran', 'warning');
                return;
            }
        }

        const modal = document.getElementById('modalContainer');
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${data ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h3>
                        <button class="modal-close" id="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="formMapel">
                            <div class="form-group">
                                <label class="required">Nama Mata Pelajaran</label>
                                <input type="text" class="form-control" name="namaMapel" 
                                    value="${data?.namaMapel || ''}" 
                                    placeholder="Contoh: Matematika, IPA, Bahasa Indonesia" required>
                            </div>
                            <div class="form-group">
                                <label>Kode Mata Pelajaran (Opsional)</label>
                                <input type="text" class="form-control" name="kodeMapel" 
                                    value="${data?.kodeMapel || ''}" 
                                    placeholder="Contoh: MTK, IPA, BIND">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="btnBatal">Batal</button>
                        <button class="btn btn-primary" id="btnSimpan">Simpan</button>
                    </div>
                </div>
            </div>
        `;

        const closeModal = () => modal.innerHTML = '';
        
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('btnBatal').addEventListener('click', closeModal);

        document.getElementById('btnSimpan').addEventListener('click', async () => {
            const form = document.getElementById('formMapel');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const mapelData = {
                id: data?.id || Utils.generateID('mapel_'),
                namaMapel: formData.get('namaMapel'),
                kodeMapel: formData.get('kodeMapel') || '',
                guruId: guruData.id,
                createdAt: data?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                Utils.showLoading(true);

                if (data) {
                    await Database.update('mapel', mapelData);
                    Utils.showNotification('Mata pelajaran berhasil diupdate', 'success');
                } else {
                    await Database.add('mapel', mapelData);
                    Utils.showNotification('Mata pelajaran berhasil ditambahkan', 'success');
                }

                Utils.showLoading(false);
                closeModal();
                this.loadTab('mapel');
            } catch (error) {
                Utils.showLoading(false);
                Utils.showNotification('Gagal menyimpan: ' + error.message, 'danger');
            }
        });
    },

    /**
     * TAB SEMESTER
     */
    async loadSemesterTab(content) {
        const semesterList = await Database.getAll('semester');
        const activeSemester = semesterList.find(s => s.active) || null;

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Semester & Tahun Ajaran</h3>
                    <button class="btn btn-primary" id="btnTambahSemester">➕ Tambah Semester</button>
                </div>
                <div class="card-body">
                    ${activeSemester ? `
                        <div class="alert alert-info">
                            <strong>Semester Aktif:</strong> ${activeSemester.jenisSemester} - ${activeSemester.tahunAjar}
                        </div>
                    ` : ''}
                    
                    ${semesterList.length === 0 ? 
                        '<p class="text-center text-muted">Belum ada data semester</p>' :
                        `<div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Semester</th>
                                        <th>Tahun Ajaran</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${semesterList.map((sem, index) => `
                                        <tr>
                                            <td>${index + 1}</td>
                                            <td>${sem.jenisSemester}</td>
                                            <td>${sem.tahunAjar}</td>
                                            <td>
                                                ${sem.active ? 
                                                    '<span class="badge badge-success">Aktif</span>' : 
                                                    '<span class="badge badge-secondary">Tidak Aktif</span>'
                                                }
                                            </td>
                                            <td class="table-actions">
                                                ${!sem.active ? 
                                                    `<button class="action-btn edit" data-id="${sem.id}">✓ Aktifkan</button>` : 
                                                    ''
                                                }
                                                <button class="action-btn delete" data-id="${sem.id}">🗑️ Hapus</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>`
                    }
                </div>
            </div>

            <style>
                .badge {
                    padding: 0.3rem 0.8rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .badge-success {
                    background: var(--success-color);
                    color: white;
                }
                .badge-secondary {
                    background: var(--text-muted);
                    color: white;
                }
            </style>
        `;

        this.setupSemesterActions();
    },

    setupSemesterActions() {
        const btnTambah = document.getElementById('btnTambahSemester');
        if (btnTambah) {
            btnTambah.addEventListener('click', () => this.showSemesterModal());
        }

        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                Utils.confirm('Aktifkan semester ini?', async () => {
                    try {
                        Utils.showLoading(true);
                        
                        // Nonaktifkan semua semester
                        const allSemester = await Database.getAll('semester');
                        for (const sem of allSemester) {
                            sem.active = false;
                            await Database.update('semester', sem);
                        }

                        // Aktifkan semester yang dipilih
                        const selectedSem = await Database.get('semester', id);
                        selectedSem.active = true;
                        await Database.update('semester', selectedSem);

                        Utils.showLoading(false);
                        Utils.showNotification('Semester berhasil diaktifkan', 'success');
                        this.loadTab('semester');
                    } catch (error) {
                        Utils.showLoading(false);
                        Utils.showNotification('Gagal mengaktifkan: ' + error.message, 'danger');
                    }
                });
            });
        });

        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                Utils.confirm('Yakin ingin menghapus semester ini?', async () => {
                    try {
                        Utils.showLoading(true);
                        await Database.delete('semester', id);
                        Utils.showLoading(false);
                        Utils.showNotification('Semester berhasil dihapus', 'success');
                        this.loadTab('semester');
                    } catch (error) {
                        Utils.showLoading(false);
                        Utils.showNotification('Gagal menghapus: ' + error.message, 'danger');
                    }
                });
            });
        });
    },

    showSemesterModal() {
        const modal = document.getElementById('modalContainer');
        const currentYear = new Date().getFullYear();

        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Tambah Semester</h3>
                        <button class="modal-close" id="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="formSemester">
                            <div class="form-group">
                                <label class="required">Jenis Semester</label>
                                <select class="form-select" name="jenisSemester" required>
                                    <option value="">Pilih Semester</option>
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Tahun Awal</label>
                                <input type="number" class="form-control" name="tahunAwal" 
                                    value="${currentYear}" min="2000" max="2100" required>
                                <small class="text-muted">Tahun ajaran akan otomatis menjadi: XXXX/XXXX+1</small>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" name="setActive" checked>
                                    Aktifkan semester ini
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="btnBatal">Batal</button>
                        <button class="btn btn-primary" id="btnSimpan">Simpan</button>
                    </div>
                </div>
            </div>
        `;

        const closeModal = () => modal.innerHTML = '';
        
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('btnBatal').addEventListener('click', closeModal);

        document.getElementById('btnSimpan').addEventListener('click', async () => {
            const form = document.getElementById('formSemester');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const tahunAwal = parseInt(formData.get('tahunAwal'));
            const tahunAjar = `${tahunAwal}/${tahunAwal + 1}`;

            const semesterData = {
                id: Utils.generateID('semester_'),
                jenisSemester: formData.get('jenisSemester'),
                tahunAwal: tahunAwal,
                tahunAjar: tahunAjar,
                active: formData.get('setActive') === 'on',
                createdAt: new Date().toISOString()
            };

            try {
                Utils.showLoading(true);

                // Jika set active, nonaktifkan semester lain
                if (semesterData.active) {
                    const allSemester = await Database.getAll('semester');
                    for (const sem of allSemester) {
                        sem.active = false;
                        await Database.update('semester', sem);
                    }
                }

                await Database.add('semester', semesterData);
                
                Utils.showLoading(false);
                Utils.showNotification('Semester berhasil ditambahkan', 'success');
                closeModal();
                this.loadTab('semester');
            } catch (error) {
                Utils.showLoading(false);
                Utils.showNotification('Gagal menyimpan: ' + error.message, 'danger');
            }
        });
    },

    /**
     * TAB SISWA
     */
    async loadSiswaTab(content) {
        const siswaList = await Database.getAll('siswa');
        const kelasList = await Database.getAll('kelas');

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Data Siswa</h3>
                    <div class="btn-group">
                        <button class="btn btn-primary" id="btnTambahSiswa">➕ Tambah Manual</button>
                        <button class="btn btn-success" id="btnImportSiswa">📥 Import Excel</button>
                        <button class="btn btn-secondary" id="btnDownloadTemplate">📄 Download Template</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label>Filter Kelas</label>
                        <select class="form-select" id="filterKelas">
                            <option value="">Semua Kelas</option>
                            ${kelasList.map(k => `<option value="${k.id}">${k.namaKelas}</option>`).join('')}
                        </select>
                    </div>

                    <div id="siswaTableContainer"></div>
                </div>
            </div>
        `;

        this.displaySiswaTable(siswaList);
        this.setupSiswaActions();
    },

    async displaySiswaTable(siswaList) {
        const container = document.getElementById('siswaTableContainer');
        if (!container) return;

        if (siswaList.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Belum ada data siswa</p>';
            return;
        }

        let html = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>No. Urut</th>
                            <th>NIS/NISN</th>
                            <th>Nama Lengkap</th>
                            <th>Kelas</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (let i = 0; i < siswaList.length; i++) {
            const siswa = siswaList[i];
            const kelas = await Database.get('kelas', siswa.kelasId);
            
            html += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${siswa.noUrut}</td>
                    <td>${siswa.nisn}</td>
                    <td>${siswa.namaLengkap}</td>
                    <td>${kelas?.namaKelas || '-'}</td>
                    <td class="table-actions">
                        <button class="action-btn edit" data-id="${siswa.id}">✏️</button>
                        <button class="action-btn delete" data-id="${siswa.id}">🗑️</button>
                    </td>
                </tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;

        // Setup action buttons
        container.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const siswa = await Database.get('siswa', id);
                this.showSiswaModal(siswa);
            });
        });

        container.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                Utils.confirm('Yakin ingin menghapus siswa ini?', async () => {
                    try {
                        Utils.showLoading(true);
                        await Database.delete('siswa', id);
                        Utils.showLoading(false);
                        Utils.showNotification('Siswa berhasil dihapus', 'success');
                        this.loadTab('siswa');
                        App.updateDashboard();
                    } catch (error) {
                        Utils.showLoading(false);
                        Utils.showNotification('Gagal menghapus: ' + error.message, 'danger');
                    }
                });
            });
        });
    },

    setupSiswaActions() {
        // Filter kelas
        const filterKelas = document.getElementById('filterKelas');
        if (filterKelas) {
            filterKelas.addEventListener('change', async () => {
                const kelasId = filterKelas.value;
                const siswaList = kelasId ? 
                    await Database.query('siswa', s => s.kelasId === kelasId) :
                    await Database.getAll('siswa');
                this.displaySiswaTable(siswaList);
            });
        }

        // Tombol tambah manual
        const btnTambah = document.getElementById('btnTambahSiswa');
        if (btnTambah) {
            btnTambah.addEventListener('click', () => this.showSiswaModal());
        }

        // Tombol import
        const btnImport = document.getElementById('btnImportSiswa');
        if (btnImport) {
            btnImport.addEventListener('click', () => this.showImportSiswaModal());
        }

        // Download template
        const btnTemplate = document.getElementById('btnDownloadTemplate');
        if (btnTemplate) {
            btnTemplate.addEventListener('click', () => this.downloadSiswaTemplate());
        }
    },

    async showSiswaModal(data = null) {
        const kelasList = await Database.getAll('kelas');

        const modal = document.getElementById('modalContainer');
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${data ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
                        <button class="modal-close" id="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="formSiswa">
                            <div class="form-group">
                                <label class="required">Kelas</label>
                                <select class="form-select" name="kelasId" required>
                                    <option value="">Pilih Kelas</option>
                                    ${kelasList.map(k => `
                                        <option value="${k.id}" ${data?.kelasId === k.id ? 'selected' : ''}>
                                            ${k.namaKelas}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="required">No. Urut</label>
                                    <input type="number" class="form-control" name="noUrut" 
                                        value="${data?.noUrut || ''}" min="1" required>
                                </div>
                                <div class="form-group">
                                    <label class="required">NIS/NISN</label>
                                    <input type="text" class="form-control" name="nisn" 
                                        value="${data?.nisn || ''}" maxlength="10" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="required">Nama Lengkap</label>
                                <input type="text" class="form-control" name="namaLengkap" 
                                    value="${data?.namaLengkap || ''}" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="btnBatal">Batal</button>
                        <button class="btn btn-primary" id="btnSimpan">Simpan</button>
                    </div>
                </div>
            </div>
        `;

        const closeModal = () => modal.innerHTML = '';
        
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('btnBatal').addEventListener('click', closeModal);

        document.getElementById('btnSimpan').addEventListener('click', async () => {
            const form = document.getElementById('formSiswa');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const siswaData = {
                id: data?.id || Utils.generateID('siswa_'),
                kelasId: formData.get('kelasId'),
                noUrut: parseInt(formData.get('noUrut')),
                nisn: formData.get('nisn'),
                namaLengkap: formData.get('namaLengkap'),
                createdAt: data?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                Utils.showLoading(true);

                // Validasi NISN unik
                if (!data || data.nisn !== siswaData.nisn) {
                    const existingNISN = await Database.query('siswa', s => s.nisn === siswaData.nisn);
                    if (existingNISN.length > 0) {
                        Utils.showLoading(false);
                        Utils.showNotification('NIS/NISN sudah terdaftar', 'warning');
                        return;
                    }
                }

                // Validasi No Urut per kelas
                if (!data || data.kelasId !== siswaData.kelasId || data.noUrut !== siswaData.noUrut) {
                    const existingUrut = await Database.query('siswa', s => 
                        s.kelasId === siswaData.kelasId && s.noUrut === siswaData.noUrut
                    );
                    if (existingUrut.length > 0 && (!data || existingUrut[0].id !== data.id)) {
                        Utils.showLoading(false);
                        Utils.showNotification('No. Urut sudah digunakan di kelas ini', 'warning');
                        return;
                    }
                }

                if (data) {
                    await Database.update('siswa', siswaData);
                    Utils.showNotification('Data siswa berhasil diupdate', 'success');
                } else {
                    await Database.add('siswa', siswaData);
                    Utils.showNotification('Siswa berhasil ditambahkan', 'success');
                }

                Utils.showLoading(false);
                closeModal();
                this.loadTab('siswa');
                App.updateDashboard();
            } catch (error) {
                Utils.showLoading(false);
                Utils.showNotification('Gagal menyimpan: ' + error.message, 'danger');
            }
        });
    },

    showImportSiswaModal() {
        const modal = document.getElementById('modalContainer');
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Import Siswa dari Excel</h3>
                        <button class="modal-close" id="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong>Format Excel:</strong><br>
                            Kolom 1: No. Urut<br>
                            Kolom 2: NIS/NISN<br>
                            Kolom 3: Nama Lengkap
                        </div>
                        <form id="formImport">
                            <div class="form-group">
                                <label class="required">Pilih Kelas Tujuan</label>
                                <select class="form-select" id="importKelasId" required></select>
                            </div>
                            <div class="form-group">
                                <label class="required">File Excel (.xlsx)</label>
                                <input type="file" class="form-control" id="fileExcel" 
                                    accept=".xlsx,.xls" required>
                            </div>
                        </form>
                        <div id="previewImport" class="mt-3"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="btnBatal">Batal</button>
                        <button class="btn btn-primary" id="btnImportData" disabled>Import Data</button>
                    </div>
                </div>
            </div>
        `;

        this.setupImportSiswaModal();
    },

    async setupImportSiswaModal() {
        const closeModal = () => document.getElementById('modalContainer').innerHTML = '';
        
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('btnBatal').addEventListener('click', closeModal);

        // Load kelas
        const kelasList = await Database.getAll('kelas');
        const kelasSelect = document.getElementById('importKelasId');
        kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>' + 
            kelasList.map(k => `<option value="${k.id}">${k.namaKelas}</option>`).join('');

        let importData = [];

        // Handle file upload
        const fileInput = document.getElementById('fileExcel');
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const data = await Utils.importFromExcel(file);
                importData = data.map(row => ({
                    noUrut: row['No. Urut'] || row['No.Urut'] || row['NoUrut'] || 0,
                    nisn: String(row['NIS/NISN'] || row['NISN'] || row['NIS'] || ''),
                    namaLengkap: row['Nama Lengkap'] || row['Nama'] || ''
                }));

                // Preview
                const preview = document.getElementById('previewImport');
                preview.innerHTML = `
                    <div class="alert alert-success">
                        ${importData.length} data siswa siap diimport
                    </div>
                    <div style="max-height: 200px; overflow-y: auto;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>No. Urut</th>
                                    <th>NISN</th>
                                    <th>Nama</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${importData.slice(0, 10).map(s => `
                                    <tr>
                                        <td>${s.noUrut}</td>
                                        <td>${s.nisn}</td>
                                        <td>${s.namaLengkap}</td>
                                    </tr>
                                `).join('')}
                                ${importData.length > 10 ? '<tr><td colspan="3">... dan lainnya</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                `;

                document.getElementById('btnImportData').disabled = false;
            } catch (error) {
                Utils.showNotification('Gagal membaca file: ' + error.message, 'danger');
            }
        });

        // Import button
        document.getElementById('btnImportData').addEventListener('click', async () => {
            const kelasId = document.getElementById('importKelasId').value;
            if (!kelasId) {
                Utils.showNotification('Pilih kelas terlebih dahulu', 'warning');
                return;
            }

            try {
                Utils.showLoading(true);
                let success = 0;
                let failed = 0;

                for (const data of importData) {
                    try {
                        // Validasi
                        if (!data.nisn || !data.namaLengkap) {
                            failed++;
                            continue;
                        }

                        // Cek duplikasi NISN
                        const existing = await Database.query('siswa', s => s.nisn === data.nisn);
                        if (existing.length > 0) {
                            failed++;
                            continue;
                        }

                        const siswaData = {
                            id: Utils.generateID('siswa_'),
                            kelasId: kelasId,
                            noUrut: data.noUrut,
                            nisn: data.nisn,
                            namaLengkap: data.namaLengkap,
                            createdAt: new Date().toISOString()
                        };

                        await Database.add('siswa', siswaData);
                        success++;
                    } catch (error) {
                        failed++;
                    }
                }

                Utils.showLoading(false);
                Utils.showNotification(`Import selesai: ${success} berhasil, ${failed} gagal`, 'success');
                closeModal();
                this.loadTab('siswa');
                App.updateDashboard();
            } catch (error) {
                Utils.showLoading(false);
                Utils.showNotification('Import gagal: ' + error.message, 'danger');
            }
        });
    },

    downloadSiswaTemplate() {
        const template = [
            { 'No. Urut': 1, 'NIS/NISN': '0012345678', 'Nama Lengkap': 'Contoh Nama Siswa 1' },
            { 'No. Urut': 2, 'NIS/NISN': '0012345679', 'Nama Lengkap': 'Contoh Nama Siswa 2' },
            { 'No. Urut': 3, 'NIS/NISN': '0012345680', 'Nama Lengkap': 'Contoh Nama Siswa 3' }
        ];

        Utils.exportToExcel(template, 'Template_Import_Siswa.xlsx');
        Utils.showNotification('Template berhasil diunduh', 'success');
    },

    /**
     * TAB RENCANA PENILAIAN
     */
    async loadRencanaTab(content) {
        const rencanaList = await Database.getAll('rencana');
        const mapelList = await Database.getAll('mapel');

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Rencana Penilaian</h3>
                    <button class="btn btn-primary" id="btnTambahRencana">➕ Tambah Rencana</button>
                </div>
                <div class="card-body">
                    ${rencanaList.length === 0 ?
                        '<p class="text-center text-muted">Belum ada rencana penilaian</p>' :
                        `<div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>No</th>
                                        <th>Mata Pelajaran</th>
                                        <th>Jenis Ulangan</th>
                                        <th>Kategori</th>
                                        <th>Singkatan</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody id="rencanaTableBody"></tbody>
                            </table>
                        </div>`
                    }
                </div>
            </div>
        `;

        if (rencanaList.length > 0) {
            await this.populateRencanaTable(rencanaList);
        }

        this.setupRencanaActions();
    },

    async populateRencanaTable(rencanaList) {
        const tbody = document.getElementById('rencanaTableBody');
        if (!tbody) return;

        let html = '';
        for (let i = 0; i < rencanaList.length; i++) {
            const rencana = rencanaList[i];
            const mapel = await Database.get('mapel', rencana.mapelId);
            
            html += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${mapel?.namaMapel || '-'}</td>
                    <td>${rencana.jenisUlangan}</td>
                    <td><span class="badge badge-${rencana.kategori === 'Formatif' ? 'info' : 'success'}">${rencana.kategori}</span></td>
                    <td><strong>${rencana.singkatan}</strong></td>
                    <td class="table-actions">
                        <button class="action-btn edit" data-id="${rencana.id}">✏️</button>
                        <button class="action-btn delete" data-id="${rencana.id}">🗑️</button>
                    </td>
                </tr>
            `;
        }
        tbody.innerHTML = html;

        tbody.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const rencana = await Database.get('rencana', id);
                this.showRencanaModal(rencana);
            });
        });

        tbody.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                Utils.confirm('Yakin ingin menghapus rencana ini?', async () => {
                    try {
                        Utils.showLoading(true);
                        await Database.delete('rencana', id);
                        Utils.showLoading(false);
                        Utils.showNotification('Rencana berhasil dihapus', 'success');
                        this.loadTab('rencana');
                    } catch (error) {
                        Utils.showLoading(false);
                        Utils.showNotification('Gagal menghapus: ' + error.message, 'danger');
                    }
                });
            });
        });
    },

    setupRencanaActions() {
        const btnTambah = document.getElementById('btnTambahRencana');
        if (btnTambah) {
            btnTambah.addEventListener('click', () => this.showRencanaModal());
        }
    },

    async showRencanaModal(data = null) {
        const mapelList = await Database.getAll('mapel');

        const modal = document.getElementById('modalContainer');
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${data ? 'Edit Rencana Penilaian' : 'Tambah Rencana Penilaian'}</h3>
                        <button class="modal-close" id="closeModal">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="formRencana">
                            <div class="form-group">
                                <label class="required">Mata Pelajaran</label>
                                <select class="form-select" name="mapelId" required>
                                    <option value="">Pilih Mata Pelajaran</option>
                                    ${mapelList.map(m => `
                                        <option value="${m.id}" ${data?.mapelId === m.id ? 'selected' : ''}>
                                            ${m.namaMapel}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Jenis Ulangan</label>
                                <input type="text" class="form-control" name="jenisUlangan" 
                                    value="${data?.jenisUlangan || ''}" 
                                    placeholder="Contoh: Ulangan Harian 1, PTS, PAS" required>
                            </div>
                            <div class="form-group">
                                <label class="required">Kategori</label>
                                <select class="form-select" name="kategori" required>
                                    <option value="">Pilih Kategori</option>
                                    <option value="Formatif" ${data?.kategori === 'Formatif' ? 'selected' : ''}>Formatif</option>
                                    <option value="Sumatif" ${data?.kategori === 'Sumatif' ? 'selected' : ''}>Sumatif</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Singkatan</label>
                                <input type="text" class="form-control" name="singkatan" 
                                    value="${data?.singkatan || ''}" 
                                    placeholder="Contoh: UH-1, PTS, PAS" maxlength="10" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="btnBatal">Batal</button>
                        <button class="btn btn-primary" id="btnSimpan">Simpan</button>
                    </div>
                </div>
            </div>
        `;

        const closeModal = () => modal.innerHTML = '';
        
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('btnBatal').addEventListener('click', closeModal);

        document.getElementById('btnSimpan').addEventListener('click', async () => {
            const form = document.getElementById('formRencana');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const rencanaData = {
                id: data?.id || Utils.generateID('rencana_'),
                mapelId: formData.get('mapelId'),
                jenisUlangan: formData.get('jenisUlangan'),
                kategori: formData.get('kategori'),
                singkatan: formData.get('singkatan'),
                createdAt: data?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                Utils.showLoading(true);

                if (data) {
                    await Database.update('rencana', rencanaData);
                    Utils.showNotification('Rencana berhasil diupdate', 'success');
                } else {
                    await Database.add('rencana', rencanaData);
                    Utils.showNotification('Rencana berhasil ditambahkan', 'success');
                }

                Utils.showLoading(false);
                closeModal();
                this.loadTab('rencana');
            } catch (error) {
                Utils.showLoading(false);
                Utils.showNotification('Gagal menyimpan: ' + error.message, 'danger');
            }
        });
    }
};