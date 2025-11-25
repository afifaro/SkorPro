/**
 * SKORPRO - Database Management (FINAL FIX)
 * Mengelola penyimpanan data menggunakan IndexedDB dengan fallback LocalStorage
 */

const Database = {
    dbName: 'SkorProDB',
    version: 11,
    db: null,
    useLocalStorage: false,
    isInitialized: false, // ✅ ADD FLAG

    /**
     * Inisialisasi database
     */
    async init() {
        if (this.isInitialized) {
            console.log('⚠️ Database already initialized');
            return;
        }

        try {
            // ✅ Close any existing connections first
            if (this.db) {
                this.db.close();
                this.db = null;
            }

            this.db = await this.initIndexedDB();
            this.isInitialized = true;
            console.log('✅ Database initialized with IndexedDB');
        } catch (error) {
            console.warn('⚠️ IndexedDB failed, falling back to LocalStorage', error);
            this.useLocalStorage = true;
            this.initLocalStorage();
            this.isInitialized = true;
        }
    },

    /**
     * Inisialisasi IndexedDB
     */
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            // ✅ Try to open first, delete only if version mismatch
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                console.log('✅ Database opened successfully');
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                console.log('🔄 Database upgrade needed');
                const db = event.target.result;

                // Helper function to create or recreate store
                const createStore = (storeName, keyPath, indexes = []) => {
                    if (db.objectStoreNames.contains(storeName)) {
                        db.deleteObjectStore(storeName);
                    }
                    const store = db.createObjectStore(storeName, { keyPath });
                    indexes.forEach(index => {
                        store.createIndex(index.name, index.keyPath, index.options || {});
                    });
                    return store;
                };

                // Create all stores
                try {
                    createStore('guru', 'id');
                    createStore('sekolah', 'id');
                    createStore('kelas', 'id', [
                        { name: 'sekolahId', keyPath: 'sekolahId', options: { unique: false } }
                    ]);
                    createStore('mapel', 'id');
                    createStore('semester', 'id');
                    createStore('siswa', 'id', [
                        { name: 'kelasId', keyPath: 'kelasId', options: { unique: false } },
                        { name: 'nisn', keyPath: 'nisn', options: { unique: false } }
                    ]);
                    createStore('rencana', 'id', [
                        { name: 'mapelId', keyPath: 'mapelId', options: { unique: false } }
                    ]);
                    createStore('ljk', 'id', [
                        { name: 'kelasId', keyPath: 'kelasId', options: { unique: false } }
                    ]);
                    createStore('jawaban', 'id', [
                        { name: 'ljkId', keyPath: 'ljkId', options: { unique: false } },
                        { name: 'siswaId', keyPath: 'siswaId', options: { unique: false } }
                    ]);
                    createStore('kunci', 'id', [
                        { name: 'ljkId', keyPath: 'ljkId', options: { unique: false } }
                    ]);
                    createStore('analisis', 'id', [
                        { name: 'ljkId', keyPath: 'ljkId', options: { unique: false } }
                    ]);
                    createStore('rapor', 'id', [
                        { name: 'siswaId', keyPath: 'siswaId', options: { unique: false } }
                    ]);

                    console.log('✅ All object stores created');
                } catch (error) {
                    console.error('❌ Error creating stores:', error);
                }
            };

            request.onblocked = () => {
                console.warn('⚠️ Database upgrade blocked. Please close other tabs.');
                // Try to proceed anyway
            };
        });
    },

    /**
     * Inisialisasi LocalStorage sebagai fallback
     */
    initLocalStorage() {
        const stores = ['guru', 'sekolah', 'kelas', 'mapel', 'semester', 'siswa', 
                       'rencana', 'ljk', 'jawaban', 'kunci', 'analisis', 'rapor'];
        
        stores.forEach(store => {
            if (!localStorage.getItem(store)) {
                localStorage.setItem(store, JSON.stringify([]));
            }
        });
        console.log('✅ LocalStorage initialized');
    },

    /**
     * Tambah data
     */
    async add(storeName, data) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized. Please wait...');
        }

        if (this.useLocalStorage) {
            return this.addToLocalStorage(storeName, data);
        }

        if (!this.db) {
            throw new Error('Database connection not available');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                console.error('❌ Error adding data:', error);
                reject(error);
            }
        });
    },

    /**
     * Tambah ke LocalStorage
     */
    addToLocalStorage(storeName, data) {
        try {
            const items = JSON.parse(localStorage.getItem(storeName) || '[]');
            items.push(data);
            localStorage.setItem(storeName, JSON.stringify(items));
            return Promise.resolve(data.id);
        } catch (error) {
            return Promise.reject(error);
        }
    },

    /**
     * Update data
     */
    async update(storeName, data) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        if (this.useLocalStorage) {
            return this.updateLocalStorage(storeName, data);
        }

        if (!this.db) {
            throw new Error('Database connection not available');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Update LocalStorage
     */
    updateLocalStorage(storeName, data) {
        try {
            const items = JSON.parse(localStorage.getItem(storeName) || '[]');
            const index = items.findIndex(item => item.id === data.id);
            
            if (index !== -1) {
                items[index] = data;
                localStorage.setItem(storeName, JSON.stringify(items));
            }
            
            return Promise.resolve(data.id);
        } catch (error) {
            return Promise.reject(error);
        }
    },

    /**
     * Hapus data
     */
    async delete(storeName, id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        if (this.useLocalStorage) {
            return this.deleteFromLocalStorage(storeName, id);
        }

        if (!this.db) {
            throw new Error('Database connection not available');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Hapus dari LocalStorage
     */
    deleteFromLocalStorage(storeName, id) {
        try {
            const items = JSON.parse(localStorage.getItem(storeName) || '[]');
            const filtered = items.filter(item => item.id !== id);
            localStorage.setItem(storeName, JSON.stringify(filtered));
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    },

    /**
     * Ambil satu data berdasarkan ID
     */
    async get(storeName, id) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        if (this.useLocalStorage) {
            return this.getFromLocalStorage(storeName, id);
        }

        if (!this.db) {
            throw new Error('Database connection not available');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Ambil dari LocalStorage
     */
    getFromLocalStorage(storeName, id) {
        try {
            const items = JSON.parse(localStorage.getItem(storeName) || '[]');
            const item = items.find(item => item.id === id);
            return Promise.resolve(item);
        } catch (error) {
            return Promise.reject(error);
        }
    },

    /**
     * Ambil semua data
     */
    async getAll(storeName) {
        if (!this.isInitialized) {
            console.warn('⚠️ Database not initialized, returning empty array');
            return [];
        }

        if (this.useLocalStorage) {
            return this.getAllFromLocalStorage(storeName);
        }

        if (!this.db) {
            console.warn('⚠️ Database connection not available, returning empty array');
            return [];
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => {
                    console.warn(`⚠️ Error getting data from ${storeName}:`, request.error);
                    resolve([]);
                };
            } catch (error) {
                console.warn(`⚠️ Exception in getAll ${storeName}:`, error);
                resolve([]);
            }
        });
    },

    /**
     * Ambil semua dari LocalStorage
     */
    getAllFromLocalStorage(storeName) {
        try {
            const items = JSON.parse(localStorage.getItem(storeName) || '[]');
            return Promise.resolve(items);
        } catch (error) {
            return Promise.resolve([]);
        }
    },

    /**
     * Ambil data berdasarkan index
     */
    async getByIndex(storeName, indexName, value) {
        if (!this.isInitialized) {
            return [];
        }

        if (this.useLocalStorage) {
            return this.getByIndexLocalStorage(storeName, indexName, value);
        }

        if (!this.db) {
            return [];
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(value);

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            } catch (error) {
                resolve([]);
            }
        });
    },

    /**
     * Ambil berdasarkan index dari LocalStorage
     */
    getByIndexLocalStorage(storeName, indexName, value) {
        try {
            const items = JSON.parse(localStorage.getItem(storeName) || '[]');
            const filtered = items.filter(item => item[indexName] === value);
            return Promise.resolve(filtered);
        } catch (error) {
            return Promise.resolve([]);
        }
    },

    /**
     * Cari data dengan query
     */
    async query(storeName, predicate) {
        try {
            const allData = await this.getAll(storeName);
            return allData.filter(predicate);
        } catch (error) {
            console.error('Query error:', error);
            return [];
        }
    },

    /**
     * Hitung jumlah data
     */
    async count(storeName) {
        if (!this.isInitialized) {
            return 0;
        }

        if (this.useLocalStorage) {
            const items = JSON.parse(localStorage.getItem(storeName) || '[]');
            return Promise.resolve(items.length);
        }

        if (!this.db) {
            return 0;
        }

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.count();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(0);
            } catch (error) {
                resolve(0);
            }
        });
    },

    /**
     * Reset semua data (untuk tombol rahasia)
     */
    async resetAll() {
        const stores = ['guru', 'sekolah', 'kelas', 'mapel', 'semester', 'siswa', 
                       'rencana', 'ljk', 'jawaban', 'kunci', 'analisis', 'rapor'];

        if (this.useLocalStorage) {
            stores.forEach(store => {
                localStorage.setItem(store, JSON.stringify([]));
            });
            return Promise.resolve();
        }

        if (!this.db) {
            return Promise.resolve();
        }

        const promises = stores.map(storeName => {
            return new Promise((resolve) => {
                try {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();

                    request.onsuccess = () => resolve();
                    request.onerror = () => resolve();
                } catch (error) {
                    resolve();
                }
            });
        });

        return Promise.all(promises);
    },

    /**
     * Export semua data
     */
    async exportData() {
        const stores = ['guru', 'sekolah', 'kelas', 'mapel', 'semester', 'siswa', 
                       'rencana', 'ljk', 'jawaban', 'kunci', 'analisis', 'rapor'];
        
        const exportData = {};
        
        for (const store of stores) {
            try {
                exportData[store] = await this.getAll(store);
            } catch (error) {
                exportData[store] = [];
            }
        }
        
        return exportData;
    },

    /**
     * Import data
     */
    async importData(data) {
        for (const [storeName, items] of Object.entries(data)) {
            for (const item of items) {
                try {
                    await this.add(storeName, item);
                } catch (error) {
                    console.warn(`Failed to import ${storeName}:`, error);
                }
            }
        }
    }
};

// ✅ DON'T AUTO-INIT - Let App.init() handle it