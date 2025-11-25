/**
 * SKORPRO - Nilai Rapor
 * Mengelola nilai rapor siswa dengan auto-import dari analisis
 */

const Rapor = {
    currentKelas: null,
    currentMapel: null,
    rencanaList: [],
    nilaiData: {},

    /**
     * Inisialisasi module
     */
    async init() {
        await this.loadRaporPage();
    },

    /**
     * Load halaman rapor
     */
    async loadRaporPage() {
        const content = document.getElementById('raporContent');
        if (!content) return;

        const sekolahList = await Database.getAll('sekolah');
        const mapelList = await Database.getAll('mapel');

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Nilai Rapor</h3>
                </div>
                <div class="card-body">
                    <form id="formPilihRapor">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="required">Sekolah</label>
                                <select class="form-select" id="raporSekolah" required>
                                    <option value="">Pilih Sekolah</option>
                                    ${sekolahList.map(s => `<option value="${s.id}">${s.namaSekolah}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="required">Kelas</label>
                                <select class="form-select" id="raporKelas" required>
                                    <option value="">Pilih Kelas</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="required">Mata Pelajaran</label>
                            <select class="form-select" id="raporMapel" required>
                                <option value="">Pilih Mata Pelajaran</option>
                                ${mapelList.map(m => `<option value="${m.id}">${m.namaMapel}</option>`).join('')}
                            </select>
                        </div>

                        <button type="button" class="btn btn-primary" id="btnMuatRapor">
                            📊 Muat Data Rapor
                        </button>
                    </form>
                </div>
            </div>

            <div id="tabelRaporContainer" style="display: none;">
                <div class="card mt-3">
                    <div class="card-header">
                        <h3>Tabel Nilai Rapor</h3>
                        <div class="btn-group">
                            <button class="btn btn-success" id="btnExportExcelRapor">📥 Export Excel</button>
                            <button class="btn btn-danger" id="btnExportPDFRapor">📄 Export PDF</button>
                        </div>
                    </div>
                    <div class="card-body" id="tabelRaporContent"></div>
                </div>
            </div>
        `;

        this.setupRaporForm();
    },

    /**
     * Setup form rapor
     */
    setupRaporForm() {
        const sekolahSelect = document.getElementById('raporSekolah');
        const kelasSelect = document.getElementById('raporKelas');

        // Cascade sekolah -> kelas
        sekolahSelect?.addEventListener('change', async () => {
            const sekolahId = sekolahSelect.value;
            const kelasList = sekolahId ?
                await Database.query('kelas', k => k.sekolahId === sekolahId) : [];
            
            kelasSelect.innerHTML = '<option value="">Pilih Kelas</option>' +
                kelasList.map(k => `<option value="${k.id}">${k.namaKelas}</option>`).join('');
        });

        // Button muat rapor
        document.getElementById('btnMuatRapor')?.addEventListener('click', () => this.muatDataRapor());
    },

    /**
     * Muat data rapor
     */
    async muatDataRapor() {
        const kelasId = document.getElementById('raporKelas').value;
        const mapelId = document.getElementById('raporMapel').value;

        if (!kelasId || !mapelId) {
            Utils.showNotification('Lengkapi semua pilihan', 'warning');
            return;
        }

        Utils.showLoading(true);

        try {
            this.currentKelas = await Database.get('kelas', kelasId);
            this.currentMapel = await Database.get('mapel', mapelId);

            // Ambil semua rencana penilaian untuk mapel ini
            this.rencanaList = await Database.query('rencana', r => r.mapelId === mapelId);

            if (this.rencanaList.length === 0) {
                Utils.showLoading(false);
                Utils.showNotification('Belum ada rencana penilaian untuk mata pelajaran ini', 'warning');
                return;
            }

            // Ambil semua siswa di kelas ini
            const siswaList = await Database.query('siswa', s => s.kelasId === kelasId);

            if (siswaList.length === 0) {
                Utils.showLoading(false);
                Utils.showNotification('Belum ada siswa di kelas ini', 'warning');
                return;
            }

            // Inisialisasi nilai data
            this.nilaiData = {};
            for (const siswa of siswaList) {
                this.nilaiData[siswa.id] = {
                    siswa: siswa,
                    nilai: {}
                };

                // Ambil nilai dari analisis
                for (const rencana of this.rencanaList) {
                    const ljk = await Database.query('ljk', l => 
                        l.kelasId === kelasId && l.rencanaId === rencana.id
                    );

                    if (ljk.length > 0) {
                        const analisis = await Database.query('analisis', a => a.ljkId === ljk[0].id);
                        
                        if (analisis.length > 0) {
                            const hasilSiswa = analisis[0].hasilSiswa.find(h => h.siswaId === siswa.id);
                            
                            if (hasilSiswa) {
                                this.nilaiData[siswa.id].nilai[rencana.id] = {
                                    nilai: hasilSiswa.nilaiAkhir,
                                    source: 'analisis'
                                };
                            }
                        }
                    }
                }

                // Load nilai manual yang sudah tersimpan
                const raporSiswa = await Database.query('rapor', r => 
                    r.siswaId === siswa.id && r.mapelId === mapelId
                );

                if (raporSiswa.length > 0) {
                    Object.assign(this.nilaiData[siswa.id].nilai, raporSiswa[0].nilai);
                }
            }

            await this.tampilkanTabelRapor();

            Utils.showLoading(false);
        } catch (error) {
            Utils.showLoading(false);
            Utils.showNotification('Gagal memuat data: ' + error.message, 'danger');
        }
    },

    /**
     * Tampilkan tabel rapor
     */
    async tampilkanTabelRapor() {
        const container = document.getElementById('tabelRaporContainer');
        const content = document.getElementById('tabelRaporContent');

        const siswaList = Object.values(this.nilaiData).map(d => d.siswa);

        let html = `
            <div class="alert alert-info">
                <strong>Kelas:</strong> ${this.currentKelas.namaKelas} | 
                <strong>Mata Pelajaran:</strong> ${this.currentMapel.namaMapel}
            </div>

            <div class="table-container">
                <table class="table" id="tabelNilaiRapor">
                    <thead>
                        <tr>
                            <th rowspan="2" style="vertical-align: middle;">No</th>
                            <th rowspan="2" style="vertical-align: middle;">No. Urut</th>
                            <th rowspan="2" style="vertical-align: middle;">Nama Siswa</th>
                            ${this.rencanaList.map(r => `
                                <th style="text-align: center;">${r.singkatan}</th>
                            `).join('')}
                            <th rowspan="2" style="vertical-align: middle;">Rata-rata</th>
                        </tr>
                        <tr>
                            ${this.rencanaList.map(r => `
                                <th style="text-align: center; font-size: 0.8rem; color: var(--text-muted);">
                                    ${r.kategori}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        siswaList.forEach((siswa, index) => {
            const nilaiSiswa = this.nilaiData[siswa.id].nilai;
            const nilaiArray = this.rencanaList.map(r => nilaiSiswa[r.id]?.nilai || 0);
            const rataRata = nilaiArray.length > 0 ? 
                nilaiArray.reduce((a, b) => a + b, 0) / nilaiArray.length : 0;

            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${siswa.noUrut}</td>
                    <td>${siswa.namaLengkap}</td>
                    ${this.rencanaList.map(r => {
                        const nilai = nilaiSiswa[r.id];
                        const isFromAnalisis = nilai?.source === 'analisis';
                        
                        return `
                            <td style="text-align: center;">
                                <input type="number" 
                                    class="form-control" 
                                    style="width: 80px; margin: 0 auto; text-align: center; ${isFromAnalisis ? 'background: #e8f5e9;' : ''}"
                                    data-siswa="${siswa.id}" 
                                    data-rencana="${r.id}"
                                    value="${nilai?.nilai || ''}"
                                    min="0" 
                                    max="100" 
                                    step="0.1"
                                    ${isFromAnalisis ? 'readonly' : ''}
                                    placeholder="-">
                                ${isFromAnalisis ? '<div style="font-size: 0.7rem; color: green;">Auto</div>' : ''}
                            </td>
                        `;
                    }).join('')}
                    <td style="text-align: center; font-weight: bold; background: var(--bg-tertiary);">
                        ${rataRata.toFixed(2)}
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>

            <div class="btn-group mt-3">
                <button class="btn btn-success btn-lg" id="btnSimpanRapor">
                    💾 Simpan Semua Nilai
                </button>
            </div>
        `;

        content.innerHTML = html;
        container.style.display = 'block';

        // Setup save button
        document.getElementById('btnSimpanRapor')?.addEventListener('click', () => this.simpanSemuaNilai());

        // Setup export buttons
        document.getElementById('btnExportExcelRapor')?.addEventListener('click', () => this.exportExcel());
        document.getElementById('btnExportPDFRapor')?.addEventListener('click', () => this.exportPDF());

        // Auto-save on input change
        document.querySelectorAll('input[type="number"][data-siswa]').forEach(input => {
            input.addEventListener('change', (e) => {
                const siswaId = e.target.getAttribute('data-siswa');
                const rencanaId = e.target.getAttribute('data-rencana');
                const nilai = parseFloat(e.target.value) || 0;

                if (!this.nilaiData[siswaId].nilai[rencanaId]) {
                    this.nilaiData[siswaId].nilai[rencanaId] = {};
                }
                this.nilaiData[siswaId].nilai[rencanaId].nilai = nilai;
                this.nilaiData[siswaId].nilai[rencanaId].source = 'manual';

                // Update rata-rata
                this.updateRataRata();
            });
        });

        container.scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * Update rata-rata otomatis
     */
    updateRataRata() {
        const rows = document.querySelectorAll('#tabelNilaiRapor tbody tr');
        
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input[type="number"]');
            const nilai = Array.from(inputs).map(input => parseFloat(input.value) || 0);
            const rataRata = nilai.length > 0 ? nilai.reduce((a, b) => a + b, 0) / nilai.length : 0;
            
            const rataCell = row.querySelector('td:last-child');
            if (rataCell) {
                rataCell.textContent = rataRata.toFixed(2);
            }
        });
    },

    /**
     * Simpan semua nilai rapor
     */
    async simpanSemuaNilai() {
        Utils.showLoading(true);

        try {
            for (const siswaId in this.nilaiData) {
                const data = this.nilaiData[siswaId];
                
                const raporData = {
                    id: Utils.generateID('rapor_'),
                    siswaId: siswaId,
                    kelasId: this.currentKelas.id,
                    mapelId: this.currentMapel.id,
                    nilai: data.nilai,
                    updatedAt: new Date().toISOString()
                };

                // Check if exists
                const existing = await Database.query('rapor', r => 
                    r.siswaId === siswaId && r.mapelId === this.currentMapel.id
                );

                if (existing.length > 0) {
                    raporData.id = existing[0].id;
                    raporData.createdAt = existing[0].createdAt;
                    await Database.update('rapor', raporData);
                } else {
                    raporData.createdAt = new Date().toISOString();
                    await Database.add('rapor', raporData);
                }
            }

            Utils.showLoading(false);
            Utils.showNotification('Semua nilai berhasil disimpan', 'success');
        } catch (error) {
            Utils.showLoading(false);
            Utils.showNotification('Gagal menyimpan: ' + error.message, 'danger');
        }
    },

    /**
     * Export ke Excel
     */
    async exportExcel() {
        const guru = await Database.getAll('guru');
        const guruData = guru.length > 0 ? guru[0] : null;

        // Prepare data
        const exportData = [];
        const siswaList = Object.values(this.nilaiData).map(d => d.siswa);

        siswaList.forEach((siswa, index) => {
            const nilaiSiswa = this.nilaiData[siswa.id].nilai;
            const row = {
                'No': index + 1,
                'No. Urut': siswa.noUrut,
                'Nama Siswa': siswa.namaLengkap,
                'NISN': siswa.nisn
            };

            // Add nilai columns
            this.rencanaList.forEach(r => {
                row[r.singkatan] = nilaiSiswa[r.id]?.nilai || '';
            });

            // Add rata-rata
            const nilaiArray = this.rencanaList.map(r => nilaiSiswa[r.id]?.nilai || 0);
            row['Rata-rata'] = nilaiArray.length > 0 ? 
                (nilaiArray.reduce((a, b) => a + b, 0) / nilaiArray.length).toFixed(2) : '';

            exportData.push(row);
        });

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Jika Guru Mapel -> Sheet per kelas
        // Jika Guru Kelas -> Sheet per mapel
        const sheetName = guruData?.jenisGuru === 'Guru Mapel' ? 
            this.currentKelas.namaKelas : this.currentMapel.namaMapel;

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

        // Save file
        const filename = `Nilai_Rapor_${this.currentKelas.namaKelas}_${this.currentMapel.namaMapel}_${new Date().getTime()}.xlsx`;
        XLSX.writeFile(workbook, filename);

        Utils.showNotification('File Excel berhasil diunduh', 'success');
    },

    /**
     * Export ke PDF
     */
    async exportPDF() {
        Utils.showLoading(true);

        try {
            const guru = await Database.getAll('guru');
            const guruData = guru.length > 0 ? guru[0] : null;
            const sekolah = await Database.get('sekolah', this.currentKelas.sekolahId);
            const semester = await Database.query('semester', s => s.active);
            const semesterAktif = semester.length > 0 ? semester[0] : null;

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [210, 330] // F4 Landscape
            });

            // Header
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'bold');
            pdf.text('DAFTAR NILAI RAPOR', 165, 15, { align: 'center' });

            pdf.setFontSize(12);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Sekolah: ${sekolah.namaSekolah}`, 15, 25);
            pdf.text(`Kelas: ${this.currentKelas.namaKelas}`, 15, 31);
            pdf.text(`Mata Pelajaran: ${this.currentMapel.namaMapel}`, 15, 37);
            pdf.text(`Semester: ${semesterAktif?.jenisSemester || '-'} ${semesterAktif?.tahunAjar || ''}`, 15, 43);

            // Table
            const siswaList = Object.values(this.nilaiData).map(d => d.siswa);
            const tableData = siswaList.map((siswa, index) => {
                const nilaiSiswa = this.nilaiData[siswa.id].nilai;
                const nilaiArray = this.rencanaList.map(r => {
                    const nilai = nilaiSiswa[r.id]?.nilai || 0;
                    return nilai > 0 ? nilai.toFixed(1) : '-';
                });
                
                const rataRata = this.rencanaList.map(r => nilaiSiswa[r.id]?.nilai || 0);
                const rata = rataRata.reduce((a, b) => a + b, 0) / rataRata.length;

                return [
                    index + 1,
                    siswa.noUrut,
                    siswa.namaLengkap,
                    ...nilaiArray,
                    rata > 0 ? rata.toFixed(2) : '-'
                ];
            });

            const headers = [
                'No',
                'No. Urut',
                'Nama Siswa',
                ...this.rencanaList.map(r => r.singkatan),
                'Rata-rata'
            ];

            // Using autoTable plugin (jika tersedia)
            if (typeof pdf.autoTable === 'function') {
                pdf.autoTable({
                    head: [headers],
                    body: tableData,
                    startY: 50,
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [74, 144, 226], halign: 'center' },
                    columnStyles: {
                        0: { cellWidth: 10, halign: 'center' },
                        1: { cellWidth: 15, halign: 'center' },
                        2: { cellWidth: 50 }
                    }
                });

                // Footer signature
                const finalY = pdf.lastAutoTable.finalY + 10;
                
                pdf.setFontSize(10);
                pdf.text('Mengetahui,', 40, finalY);
                pdf.text(`${sekolah.namaSekolah.split(' ')[0]}, ${Utils.formatDateSimple()}`, 220, finalY);
                
                pdf.text('Kepala Sekolah', 40, finalY + 6);
                pdf.text('Guru Mata Pelajaran', 220, finalY + 6);
                
                pdf.text(`(${sekolah.namaKepala})`, 40, finalY + 26);
                pdf.text(`(${guruData?.namaLengkap || '........................'})`, 220, finalY + 26);
                
                pdf.setFontSize(8);
                pdf.text(`NIP: ${sekolah.nipKepala}`, 40, finalY + 31);
                pdf.text(`NIP: ${guruData?.nomorIdentitas || '........................'}`, 220, finalY + 31);
            }

            // Save PDF
            const filename = `Nilai_Rapor_${this.currentKelas.namaKelas}_${this.currentMapel.namaMapel}.pdf`;
            pdf.save(filename);

            Utils.showLoading(false);
            Utils.showNotification('File PDF berhasil diunduh', 'success');
        } catch (error) {
            Utils.showLoading(false);
            Utils.showNotification('Gagal export PDF: ' + error.message, 'danger');
        }
    }
};