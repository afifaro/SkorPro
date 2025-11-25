/**
 * SKORPRO - Utility Functions (FIXED)
 */

const Utils = {
    /**
     * Format tanggal ke bahasa Indonesia
     */
    formatDateID(date = new Date()) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${dayName}, ${day} ${month} ${year}`;
    },

    /**
     * Format tanggal ke bahasa Inggris
     */
    formatDateEN(date = new Date()) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${dayName}, ${day} ${month} ${year}`;
    },

    /**
     * Format tanggal sederhana (dd-mm-yyyy)
     */
    formatDateSimple(date = new Date()) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    },

    /**
     * Dapatkan sapaan berdasarkan waktu
     */
    getGreeting(lang = 'id') {
        const hour = new Date().getHours();
        
        if (lang === 'id') {
            if (hour < 11) return 'Selamat Pagi';
            if (hour < 15) return 'Selamat Siang';
            if (hour < 18) return 'Selamat Sore';
            return 'Selamat Malam';
        } else {
            if (hour < 12) return 'Good Morning';
            if (hour < 18) return 'Good Afternoon';
            return 'Good Evening';
        }
    },

    /**
     * Generate ID unik
     */
    generateID(prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}_${random}`;
    },

    /**
     * Validasi NIP/NUPTK/NRG
     */
    validateNIP(value, type) {
        if (type === 'NIP') {
            return /^\d{18}$/.test(value);
        } else if (type === 'NUPTK') {
            return /^\d{16}$/.test(value);
        } else if (type === 'NRG') {
            return /^\d{12}$/.test(value);
        }
        return false;
    },

    /**
     * Validasi NIS/NISN
     */
    validateNISN(value) {
        return /^\d{10}$/.test(value);
    },

    /**
     * Sanitize input text
     */
    sanitize(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Tampilkan notifikasi
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.style.animation = 'slideInRight 0.3s ease';
        
        const icons = {
            success: '✅',
            warning: '⚠️',
            danger: '❌',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <span style="font-size: 1.2rem; margin-right: 0.5rem;">${icons[type]}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    /**
     * Konfirmasi aksi
     */
    confirm(message, callback) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Konfirmasi</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">Batal</button>
                    <button class="btn btn-primary" data-action="confirm">Ya</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            callback();
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    /**
     * Loading overlay
     */
    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    },

    /**
     * Ekspor ke Excel
     */
    exportToExcel(data, filename = 'export.xlsx') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, filename);
    },

    /**
     * Import dari Excel
     */
    async importFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Generate QR Code (FIXED)
     */
    async generateQRCode(text, size = 200) {
        return new Promise((resolve, reject) => {
            try {
                // ✅ CREATE CANVAS ELEMENT
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;

                // ✅ USE QRCode constructor (from qrcode.min.js)
                if (typeof QRCode === 'undefined') {
                    reject(new Error('QRCode library not loaded'));
                    return;
                }

                // Create temporary container
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                document.body.appendChild(tempDiv);

                // Generate QR Code
                const qrcode = new QRCode(tempDiv, {
                    text: text,
                    width: size,
                    height: size,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });

                // Wait a bit for rendering
                setTimeout(() => {
                    try {
                        const img = tempDiv.querySelector('img');
                        if (img && img.src) {
                            resolve(img.src);
                        } else {
                            // Fallback: use canvas
                            const qrCanvas = tempDiv.querySelector('canvas');
                            if (qrCanvas) {
                                resolve(qrCanvas.toDataURL());
                            } else {
                                reject(new Error('QR Code generation failed'));
                            }
                        }
                    } catch (error) {
                        reject(error);
                    } finally {
                        document.body.removeChild(tempDiv);
                    }
                }, 100);

            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Ekspor ke PDF
     */
    async exportToPDF(element, filename = 'document.pdf') {
        const canvas = await html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(filename);
    },

    /**
     * Validasi tahun ajaran
     */
    formatTahunAjar(tahun) {
        const year = parseInt(tahun);
        if (isNaN(year) || year < 2000 || year > 2100) {
            return null;
        }
        return `${year}/${year + 1}`;
    },

    /**
     * Hitung rata-rata
     */
    average(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        const sum = numbers.reduce((a, b) => a + b, 0);
        return sum / numbers.length;
    },

    /**
     * Standar deviasi
     */
    standardDeviation(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        const avg = this.average(numbers);
        const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = this.average(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    },

    /**
     * Sorting array of objects
     */
    sortBy(array, key, order = 'asc') {
        return array.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    },

    /**
     * Debounce function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Truncate text
     */
    truncate(str, length = 50) {
        if (str.length <= length) return str;
        return str.substr(0, length) + '...';
    }
};

// Export untuk digunakan di module lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}