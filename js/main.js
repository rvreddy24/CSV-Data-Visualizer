document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const dataContainer = document.getElementById('dataContainer');
    
    // Initialize managers
    const tableManager = new TableManager(dataContainer);
    const chartRenderer = new ChartRenderer(document.getElementById('chartsView'));
    const statsManager = new StatsManager(document.getElementById('statisticsView'));

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            processFile(file);
        } else {
            alert('Please upload a CSV file');
        }
    });

    // Handle file input
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.csv')) {
            processFile(file);
        } else {
            alert('Please upload a CSV file');
        }
    });

    // Add IndexedDB setup
    const DB_NAME = 'CsvAnalyzerDB';
    const STORE_NAME = 'csvData';
    const DB_VERSION = 1;

    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    // Add this function before processFile
    function parseCSV(text) {
        try {
            // Split into lines and filter out empty lines
            const lines = text.split(/\r?\n/).filter(line => line.trim());
            
            if (lines.length === 0) {
                throw new Error('CSV file is empty');
            }

            // Parse headers
            const headers = parseCSVLine(lines[0]);
            if (headers.length === 0) {
                throw new Error('No headers found');
            }

            // Parse data rows
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                try {
                    const values = parseCSVLine(lines[i]);
                    if (values.length === headers.length) {
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index] || '';
                        });
                        data.push(row);
                    }
                } catch (err) {
                    console.warn(`Skipping invalid row ${i + 1}`);
                }
            }

            if (data.length === 0) {
                throw new Error('No valid data found');
            }

            return data;
        } catch (error) {
            console.error('CSV Parsing Error:', error);
            throw new Error('Error parsing CSV file. Please check the file format.');
        }
    }

    // Update processFile function to the simpler version
    function processFile(file) {
        const reader = new FileReader();
        const dropZone = document.getElementById('dropZone');
        
        // Show loading state
        dropZone.style.opacity = '0.5';
        dropZone.style.pointerEvents = 'none';
        
        // Show progress overlay
        const progressOverlay = document.querySelector('.progress-overlay');
        const progressBar = progressOverlay.querySelector('.progress-bar');
        const progressText = progressOverlay.querySelector('.progress-text');
        progressOverlay.style.display = 'flex';

        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const data = parseCSV(text);
                
                if (data && data.length > 0) {
                    // Store data in localStorage
                    localStorage.setItem('csvData', JSON.stringify(data));
                    localStorage.setItem('fileName', file.name);
                    
                    // Update UI
                    dropZone.style.display = 'none';
                    document.getElementById('fileName').textContent = file.name;
                    document.querySelector('.view-controls').classList.add('show');

                    // Set default view to charts and navigate
                    localStorage.setItem('currentView', 'charts');
                    navigateToView('charts');
                } else {
                    throw new Error('No valid data found');
                }

                // Hide progress overlay
                progressOverlay.style.display = 'none';

            } catch (error) {
                console.error('Processing Error:', error);
                alert('Error processing CSV file: ' + error.message);
                resetDropZone(dropZone);
                progressOverlay.style.display = 'none';
            }
        };

        reader.onerror = () => {
            alert('Error reading file');
            resetDropZone(dropZone);
            progressOverlay.style.display = 'none';
        };

        reader.readAsText(file);
    }

    function splitIntoChunks(text, size) {
        const chunks = [];
        for (let i = 0; i < text.length; i += size) {
            chunks.push(text.slice(i, i + size));
        }
        return chunks;
    }

    function parseCSVLine(line) {
        if (!line) return [];
        
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (insideQuotes && line[i + 1] === '"') {
                    currentValue += '"';
                    i++; // Skip next quote
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        values.push(currentValue.trim());
        
        return values.map(value => {
            value = value.trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            return value.replace(/""/g, '"');
        });
    }

    function resetDropZone(dropZone) {
        dropZone.style.opacity = '1';
        dropZone.style.pointerEvents = 'auto';
    }

    function updateProgress(current, total) {
        const progress = Math.round((current / total) * 100);
        // Update progress UI if needed
        console.log(`Processing: ${progress}%`);
    }

    // Add progress UI elements
    const progressHTML = `
        <div class="progress-overlay" style="display: none;">
            <div class="progress-container">
                <div class="progress-bar"></div>
                <div class="progress-text">Processing: 0%</div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', progressHTML);

    // Home link handler
    document.querySelector('.home-link').addEventListener('click', () => {
        localStorage.removeItem('csvData');
        localStorage.removeItem('fileName');
        dropZone.style.display = 'block';
        document.querySelector('.view-controls').classList.remove('show');
        document.getElementById('fileName').textContent = 'No file selected';
        document.getElementById('dataContainer').innerHTML = '';
        document.getElementById('chartsView').innerHTML = '';
        document.getElementById('statisticsView').innerHTML = '';
        fileInput.value = '';
    });

    // Check for stored view on page load
    const currentView = localStorage.getItem('currentView') || 'charts';
    if (currentView && currentView !== 'column-analysis') {
        navigateToView(currentView);
    }

    // Initialize view if there's stored data
    const storedData = localStorage.getItem('csvData');
    if (storedData) {
        const data = JSON.parse(storedData);
        const fileName = localStorage.getItem('fileName');
        if (fileName) {
            dropZone.style.display = 'none';
            document.getElementById('fileName').textContent = fileName;
            document.querySelector('.view-controls').classList.add('show');
            
            // Initialize with charts view
            const view = localStorage.getItem('currentView') || 'charts';
            navigateToView(view);
        }
    }

    // Add this to your DOMContentLoaded event listener
    window.addEventListener('hashchange', () => {
        const view = window.location.hash.slice(1) || 'charts';
        if (view) {
            navigateToView(view);
        }
    });

    // Add this function after processFile
    async function finishProcessing(processedData) {
        try {
            if (processedData.length === 0) {
                throw new Error('No valid data found');
            }

            const dropZone = document.getElementById('dropZone');
            const progressOverlay = document.querySelector('.progress-overlay');

            // Store data in IndexedDB
            const db = await initDB();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Clear existing data
            await store.clear();

            // Store data in chunks
            const chunkSize = 10000;
            for (let i = 0; i < processedData.length; i += chunkSize) {
                const chunk = processedData.slice(i, i + chunkSize);
                await store.add({
                    id: Math.floor(i / chunkSize),
                    data: chunk
                });
            }

            // Store metadata in localStorage
            localStorage.setItem('fileName', file.name);
            localStorage.setItem('totalRows', processedData.length.toString());
            
            // Store first chunk in localStorage for immediate use
            const firstChunk = processedData.slice(0, 1000);
            localStorage.setItem('csvData', JSON.stringify(firstChunk));

            // Update UI
            dropZone.style.display = 'none';
            document.getElementById('fileName').textContent = file.name;
            document.querySelector('.view-controls').classList.add('show');

            // Set default view and navigate
            localStorage.setItem('currentView', 'charts');
            navigateToView('charts');

            // Hide progress overlay
            progressOverlay.style.display = 'none';

        } catch (error) {
            console.error('Processing Error:', error);
            alert('Error processing CSV file: ' + error.message);
            resetDropZone(dropZone);
            if (progressOverlay) {
                progressOverlay.style.display = 'none';
            }
        }
    }

    // Add this utility function for loading data chunks
    async function loadDataChunk(startIndex, endIndex) {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const startChunk = Math.floor(startIndex / 10000);
        const endChunk = Math.floor(endIndex / 10000);
        
        let data = [];
        for (let i = startChunk; i <= endChunk; i++) {
            const chunk = await store.get(i);
            if (chunk) {
                data = data.concat(chunk.data);
            }
        }

        return data.slice(startIndex % 10000, endIndex - startIndex);
    }
});

// Navigation function
function navigateToView(view) {
    if (view === 'column-analysis') {
        const data = localStorage.getItem('csvData');
        if (!data) {
            alert('Please load a CSV file first');
            return;
        }
        sessionStorage.setItem('analysisData', data);
        window.location.href = 'column-analysis.html';
        return;
    }

    localStorage.setItem('currentView', view);

    // First clear all views
    document.querySelectorAll('.view').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
        // Clear the content
        el.innerHTML = '';
    });
    
    // Show selected view
    const viewElement = document.getElementById(`${view}View`);
    if (viewElement) {
        // Prepare container for the view
        if (view === 'charts') {
            viewElement.innerHTML = '<div class="charts-grid"></div>';
        } else if (view === 'statistics') {
            viewElement.innerHTML = '<div class="stats-grid"></div>';
        }

        viewElement.style.display = 'block';
        setTimeout(() => {
            viewElement.classList.add('active');
        }, 10);
        
        // Initialize view content
        const data = JSON.parse(localStorage.getItem('csvData') || '[]');
        if (data.length > 0) {
            if (view === 'charts') {
                const chartRenderer = new ChartRenderer(viewElement.querySelector('.charts-grid'));
                chartRenderer.render(data);
            } else if (view === 'statistics') {
                const statsManager = new StatsManager(viewElement.querySelector('.stats-grid'));
                statsManager.render(data);
            }
        }
    }
    
    // Update active button
    document.querySelectorAll('.view-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeButton = document.querySelector(`[data-view="${view}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
} 