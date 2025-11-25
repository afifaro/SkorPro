/**
 * SKORPRO - Main Application Controller (FINAL FIX)
 */

const App = {
    currentPage: 'dashboard',
    currentLang: 'id',
    currentTheme: 'light',

    /**
     * Inisialisasi aplikasi
     */
    async init() {
        console.log('🚀 Initializing SkorPro...');

        // Load preferences (don't apply language yet)
        this.loadPreferencesOnly();

        // ✅ INITIALIZE DATABASE FIRST
        try {
            await Database.init();
            console.log('✅ Database ready');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            // Continue with LocalStorage fallback
        }

        // Setup UI
        this.setupNavigation();
        this.setupThemeSwitcher();
        this.setupLanguageSwitcher();

        // Now safe to apply language (needs database)
        await this.applyLanguage(this.currentLang);

        // Load dashboard
        await this.loadPage('dashboard');

        // Update dashboard stats
        await this.updateDashboard();

        console.log('✅ SkorPro initialized successfully');
    },

    /**
     * Load preferences without applying (to avoid database calls)
     */
    loadPreferencesOnly() {
        const savedTheme = localStorage.getItem('skorpro_theme') || 'light';
        const savedLang = localStorage.getItem('skorpro_lang') || 'id';

        this.currentTheme = savedTheme;
        this.currentLang = savedLang;

        document.documentElement.setAttribute('data-theme', savedTheme);
    },

    /**
     * Setup navigation
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const page = link.getAttribute('data-page');
                if (page) {
                    this.loadPage(page);
                }
            });
        });
    },

    /**
     * Load page
     */
    async loadPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Remove active from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected page
        const page = document.getElementById(`page-${pageName}`);
        if (page) {
            page.classList.add('active');
        }

        // Activate nav link
        document.querySelectorAll(`.nav-link[data-page="${pageName}"]`).forEach(link => {
            link.classList.add('active');
        });

        this.currentPage = pageName;

        // Initialize page module
        try {
            switch(pageName) {
                case 'dashboard':
                    await this.updateDashboard();
                    break;
                case 'data-siswa':
                    DataSiswa.init();
                    break;
                case 'generator':
                    await Generator.init();
                    break;
                case 'scanner':
                    await Scanner.init();
                    break;
                case 'analisis':
                    await Analisis.init();
                    break;
                case 'rapor':
                    await Rapor.init();
                    break;
            }
        } catch (error) {
            console.error(`Error loading page ${pageName}:`, error);
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Update dashboard statistics
     */
    async updateDashboard() {
        try {
            const totalSekolah = await Database.count('sekolah');
            const totalKelas = await Database.count('kelas');
            const totalSiswa = await Database.count('siswa');
            const totalUjian = await Database.count('ljk');

            // Update stats
            const elSekolah = document.getElementById('totalSekolah');
            const elKelas = document.getElementById('totalKelas');
            const elSiswa = document.getElementById('totalSiswa');
            const elUjian = document.getElementById('totalUjian');

            if (elSekolah) elSekolah.textContent = totalSekolah;
            if (elKelas) elKelas.textContent = totalKelas;
            if (elSiswa) elSiswa.textContent = totalSiswa;
            if (elUjian) elUjian.textContent = totalUjian;

            // Update greeting
            await this.updateGreeting();

            // Update activity chart
            await this.updateActivityChart();
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    },

    /**
     * Update greeting message
     */
    async updateGreeting() {
        try {
            if (!Database.isInitialized) {
                console.warn('⚠️ Database not ready for greeting update');
                return;
            }

            const guru = await Database.getAll('guru');
            const guruData = guru && guru.length > 0 ? guru[0] : null;

            const greetingText = document.getElementById('greetingText');
            const userGreeting = document.getElementById('userGreeting');

            if (greetingText && userGreeting) {
                const greeting = Utils.getGreeting(this.currentLang);
                greetingText.textContent = greeting;

                if (guruData) {
                    const prefix = guruData.jenisKelamin === 'Laki-laki' ? 'Pak' : 'Bu';
                    userGreeting.textContent = `${prefix} ${guruData.namaPanggilan}`;
                } else {
                    userGreeting.textContent = this.currentLang === 'id' ? 
                        'Selamat datang di SkorPro!' : 'Welcome to SkorPro!';
                }
            }
        } catch (error) {
            console.error('Error updating greeting:', error);
        }
    },

    /**
     * Update activity chart
     */
    async updateActivityChart() {
        try {
            const canvas = document.getElementById('activityChart');
            if (!canvas) return;

            if (!Database.isInitialized) {
                console.warn('⚠️ Database not ready for chart update');
                return;
            }

            // Get recent activity data
            const ljkList = await Database.getAll('ljk');
            const last7Days = [];
            const today = new Date();

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const count = ljkList.filter(ljk => {
                    if (!ljk.createdAt) return false;
                    const ljkDate = new Date(ljk.createdAt).toISOString().split('T')[0];
                    return ljkDate === dateStr;
                }).length;

                last7Days.push({
                    date: dateStr,
                    count: count
                });
            }

            // Create chart
            const ctx = canvas.getContext('2d');
            
            if (window.activityChartInstance) {
                window.activityChartInstance.destroy();
            }

            window.activityChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: last7Days.map(d => {
                        const date = new Date(d.date);
                        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                    }),
                    datasets: [{
                        label: this.currentLang === 'id' ? 'LJK Dibuat' : 'LJK Created',
                        data: last7Days.map(d => d.count),
                        borderColor: 'rgb(74, 144, 226)',
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating activity chart:', error);
        }
    },

    /**
     * Setup theme switcher
     */
    setupThemeSwitcher() {
        const themeSwitcher = document.getElementById('themeSwitcher');
        const themeIcon = themeSwitcher?.querySelector('.theme-icon');

        if (this.currentTheme === 'dark' && themeIcon) {
            themeIcon.textContent = '☀️';
        }

        themeSwitcher?.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', this.currentTheme);
            localStorage.setItem('skorpro_theme', this.currentTheme);

            if (themeIcon) {
                themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
            }

            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification(
                    this.currentLang === 'id' ? 
                        `Tema ${this.currentTheme === 'dark' ? 'Gelap' : 'Terang'} diaktifkan` :
                        `${this.currentTheme === 'dark' ? 'Dark' : 'Light'} theme activated`,
                    'info'
                );
            }
        });
    },

    /**
     * Setup language switcher
     */
    setupLanguageSwitcher() {
        const langSwitcher = document.getElementById('langSwitcher');
        const langText = langSwitcher?.querySelector('.lang-text');

        if (langText) {
            langText.textContent = this.currentLang === 'id' ? 'EN' : 'ID';
        }

        langSwitcher?.addEventListener('click', async () => {
            this.currentLang = this.currentLang === 'id' ? 'en' : 'id';
            localStorage.setItem('skorpro_lang', this.currentLang);

            if (langText) {
                langText.textContent = this.currentLang === 'id' ? 'EN' : 'ID';
            }

            await this.applyLanguage(this.currentLang);

            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification(
                    this.currentLang === 'id' ? 
                        'Bahasa diubah ke Indonesia' :
                        'Language changed to English',
                    'info'
                );
            }
        });
    },

    /**
     * Apply language to all elements
     */
    async applyLanguage(lang) {
        const elements = document.querySelectorAll('[data-lang-id][data-lang-en]');
        
        elements.forEach(el => {
            const text = lang === 'id' ? el.getAttribute('data-lang-id') : el.getAttribute('data-lang-en');
            if (text) {
                el.textContent = text;
            }
        });

        // Update greeting (only if database is ready)
        if (Database.isInitialized) {
            await this.updateGreeting();
        }
    },

    /**
     * Export all data (backup)
     */
    async exportAllData() {
        try {
            const data = await Database.exportData();
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `skorpro_backup_${new Date().getTime()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('Data berhasil diexport', 'success');
            }
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('Gagal export data: ' + error.message, 'danger');
            }
        }
    },

    /**
     * Import all data (restore)
     */
    async importAllData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (typeof Utils !== 'undefined' && Utils.confirm) {
                Utils.confirm(
                    'Import data akan menimpa semua data yang ada. Lanjutkan?',
                    async () => {
                        if (typeof Utils !== 'undefined' && Utils.showLoading) {
                            Utils.showLoading(true);
                        }
                        await Database.importData(data);
                        if (typeof Utils !== 'undefined' && Utils.showLoading) {
                            Utils.showLoading(false);
                        }
                        if (typeof Utils !== 'undefined' && Utils.showNotification) {
                            Utils.showNotification('Data berhasil diimport', 'success');
                        }
                        location.reload();
                    }
                );
            }
        } catch (error) {
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('Gagal import data: ' + error.message, 'danger');
            }
        }
    }
};

// ✅ INITIALIZE APP WHEN DOM IS READY
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init().catch(error => {
            console.error('❌ App initialization error:', error);
        });
    });
} else {
    App.init().catch(error => {
        console.error('❌ App initialization error:', error);
    });
}

// Expose App to window for debugging
window.SkorPro = {
    App,
    Database,
    Utils,
    Statistics,
    DataSiswa,
    Generator,
    Scanner,
    Analisis,
    Rapor
};