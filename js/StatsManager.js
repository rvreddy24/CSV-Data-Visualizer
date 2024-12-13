class StatsManager {
    constructor(container) {
        this.container = container;
    }

    render(data) {
        const stats = this.calculateStats(data);
        this.container.innerHTML = `
            <div class="stats-grid">
                <div class="stats-card">
                    <h3>Dataset Overview</h3>
                    <p><span>Total Rows</span> <span>${stats.rowCount.toLocaleString()}</span></p>
                    <p><span>Total Columns</span> <span>${stats.columnCount}</span></p>
                    <p><span>Data Points</span> <span>${stats.totalDataPoints.toLocaleString()}</span></p>
                    <p><span>File Size</span> <span>${stats.dataSize}</span></p>
                </div>
                
                <div class="stats-card">
                    <h3>Data Quality</h3>
                    <p><span>Complete Rows</span> <span>${stats.completeRows.toLocaleString()}</span></p>
                    <p><span>Missing Values</span> <span>${stats.missingValues.toLocaleString()}</span></p>
                    <p><span>Data Completeness</span> <span>${stats.completeness}%</span></p>
                    <p><span>Quality Score</span> <span>${stats.qualityScore}%</span></p>
                </div>

                <div class="stats-card">
                    <h3>Data Uniqueness</h3>
                    <p><span>Unique Values</span> <span>${stats.uniqueValues.toLocaleString()}</span></p>
                    <p><span>Duplicate Rows</span> <span>${stats.duplicateRows.toLocaleString()}</span></p>
                    <p><span>Duplication Rate</span> <span>${stats.duplicationRate}%</span></p>
                    <p><span>Uniqueness Score</span> <span>${stats.uniquenessScore}%</span></p>
                </div>

                <div class="stats-card">
                    <h3>Data Distribution</h3>
                    <p><span>Numeric Columns</span> <span>${stats.numericColumns}</span></p>
                    <p><span>Text Columns</span> <span>${stats.textColumns}</span></p>
                    <p><span>Date Columns</span> <span>${stats.dateColumns}</span></p>
                    <p><span>Empty Columns</span> <span>${stats.emptyColumns}</span></p>
                </div>

                <div class="stats-card">
                    <h3>Numeric Analysis</h3>
                    ${this.renderNumericStats(stats.numericAnalysis)}
                </div>

                <div class="stats-card">
                    <h3>Statistical Measures</h3>
                    ${this.renderStatisticalMeasures(stats.statisticalMeasures)}
                </div>

                <div class="stats-card">
                    <h3>Processing Info</h3>
                    <p><span>Processing Time</span> <span>${stats.processingTime}ms</span></p>
                    <p><span>Memory Usage</span> <span>${stats.memoryUsage}</span></p>
                    <p><span>Last Updated</span> <span>${stats.lastUpdated}</span></p>
                    <p><span>Analysis Version</span> <span>1.0</span></p>
                </div>
            </div>
        `;
    }

    renderNumericStats(analysis) {
        if (!analysis || Object.keys(analysis).length === 0) {
            return '<p>No numeric columns found</p>';
        }

        return Object.entries(analysis)
            .map(([column, stats]) => `
                <div class="numeric-stats">
                    <h4>${column}</h4>
                    <p><span>Min</span> <span>${stats.min.toLocaleString()}</span></p>
                    <p><span>Max</span> <span>${stats.max.toLocaleString()}</span></p>
                    <p><span>Average</span> <span>${stats.mean.toLocaleString()}</span></p>
                    <p><span>Sum</span> <span>${stats.sum.toLocaleString()}</span></p>
                </div>
            `).join('');
    }

    renderStatisticalMeasures(measures) {
        if (!measures || Object.keys(measures).length === 0) {
            return '<p>No statistical measures available</p>';
        }

        return Object.entries(measures)
            .map(([column, stats]) => `
                <div class="statistical-measures">
                    <h4>${column}</h4>
                    <p><span>Median</span> <span>${stats.median.toLocaleString()}</span></p>
                    <p><span>Mode</span> <span>${stats.mode.toLocaleString()}</span></p>
                    <p><span>Std Dev</span> <span>${stats.stdDev.toLocaleString()}</span></p>
                    <p><span>Variance</span> <span>${stats.variance.toLocaleString()}</span></p>
                </div>
            `).join('');
    }

    calculateStats(data) {
        const startTime = performance.now();
        const rowCount = data.length;
        const columnCount = Object.keys(data[0] || {}).length;
        const totalDataPoints = rowCount * columnCount;

        let missingValues = 0;
        let completeRows = 0;
        let uniqueValues = new Set();
        let duplicateRows = 0;
        let numericColumns = 0;
        let textColumns = 0;
        let dateColumns = 0;
        let emptyColumns = 0;

        // Initialize analysis objects
        const numericAnalysis = {};
        const statisticalMeasures = {};

        // Analyze numeric columns
        if (data.length > 0) {
            Object.keys(data[0]).forEach(column => {
                const values = data.map(row => row[column])
                    .filter(v => v && !isNaN(parseFloat(v)))
                    .map(v => parseFloat(v));

                if (values.length > 0) {
                    // Basic numeric analysis
                    const sum = values.reduce((a, b) => a + b, 0);
                    const mean = sum / values.length;
                    numericAnalysis[column] = {
                        min: Math.min(...values),
                        max: Math.max(...values),
                        mean: Number(mean.toFixed(2)),
                        sum: Number(sum.toFixed(2))
                    };

                    // Advanced statistical measures
                    const sortedValues = [...values].sort((a, b) => a - b);
                    const median = this.calculateMedian(sortedValues);
                    const mode = this.calculateMode(values);
                    const variance = this.calculateVariance(values, mean);
                    const stdDev = Math.sqrt(variance);

                    statisticalMeasures[column] = {
                        median: Number(median.toFixed(2)),
                        mode: Number(mode.toFixed(2)),
                        stdDev: Number(stdDev.toFixed(2)),
                        variance: Number(variance.toFixed(2))
                    };
                }
            });
        }

        // Calculate row-based stats
        const stringifiedRows = new Set();
        data.forEach(row => {
            const rowString = JSON.stringify(row);
            if (stringifiedRows.has(rowString)) {
                duplicateRows++;
            }
            stringifiedRows.add(rowString);
            
            let rowComplete = true;
            Object.values(row).forEach(value => {
                if (!value) {
                    missingValues++;
                    rowComplete = false;
                }
                uniqueValues.add(JSON.stringify(value));
            });
            if (rowComplete) completeRows++;
        });

        // Calculate derived metrics
        const completeness = ((totalDataPoints - missingValues) / totalDataPoints * 100).toFixed(1);
        const duplicationRate = ((duplicateRows / rowCount) * 100).toFixed(1);
        const qualityScore = (
            (completeRows / rowCount) * 50 + 
            ((totalDataPoints - missingValues) / totalDataPoints) * 50
        ).toFixed(1);
        const uniquenessScore = (100 - (duplicateRows / rowCount) * 100).toFixed(1);

        // Calculate data size
        const dataSize = this.formatBytes(JSON.stringify(data).length);
        const memoryUsage = this.formatBytes(window.performance?.memory?.usedJSHeapSize || 0);
        
        const processingTime = (performance.now() - startTime).toFixed(2);

        return {
            rowCount,
            columnCount,
            totalDataPoints,
            dataSize,
            missingValues,
            completeRows,
            completeness,
            qualityScore,
            uniqueValues: uniqueValues.size,
            duplicateRows,
            duplicationRate,
            uniquenessScore,
            numericColumns,
            textColumns,
            dateColumns,
            emptyColumns,
            processingTime,
            memoryUsage,
            lastUpdated: new Date().toLocaleString(),
            numericAnalysis,
            statisticalMeasures
        };
    }

    calculateMedian(sortedValues) {
        const mid = Math.floor(sortedValues.length / 2);
        return sortedValues.length % 2 === 0
            ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
            : sortedValues[mid];
    }

    calculateMode(values) {
        const frequency = {};
        values.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
        });
        
        let mode = values[0];
        let maxFreq = 1;
        
        for (const value in frequency) {
            if (frequency[value] > maxFreq) {
                maxFreq = frequency[value];
                mode = parseFloat(value);
            }
        }
        
        return mode;
    }

    calculateVariance(values, mean) {
        const squareDiffs = values.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        
        return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}