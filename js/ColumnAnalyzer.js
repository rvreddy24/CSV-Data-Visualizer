class ColumnAnalyzer {
    constructor(container) {
        this.container = container;
        this.init();
        this.setupViewControls();
    }

    setupViewControls() {
        document.querySelectorAll('.view-controls button').forEach(button => {
            button.addEventListener('click', () => {
                const view = button.dataset.view;
                localStorage.setItem('currentView', view);
            });
        });
    }

    init() {
        const data = JSON.parse(localStorage.getItem('csvData'));
        if (data) {
            document.getElementById('fileName').textContent = localStorage.getItem('fileName') || 'Loaded File';
            this.render(data);
        } else {
            this.showNoDataMessage();
        }
    }

    render(data) {
        const stats = this.calculateColumnStats(data);
        this.container.innerHTML = `
            <div class="stats-card">
                <h3>Column Analysis</h3>
                <div class="column-stats">
                    ${Object.entries(stats)
                        .sort((a, b) => a[0].localeCompare(b[0]))
                        .map(([column, stats]) => this.renderColumnCard(column, stats))
                        .join('')}
                </div>
            </div>
        `;
    }

    calculateColumnStats(data) {
        const stats = {};
        if (data.length === 0) return stats;

        Object.keys(data[0]).forEach(column => {
            const values = data.map(row => row[column]).filter(Boolean);
            const numeric = values.every(v => !isNaN(parseFloat(v)));
            
            stats[column] = {
                type: numeric ? 'Numeric' : 'Text',
                unique: new Set(values).size,
                empty: data.length - values.length,
                ...(numeric ? this.getNumericStats(values) : {})
            };
        });

        return stats;
    }

    getNumericStats(values) {
        const numbers = values.map(v => parseFloat(v));
        return {
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            avg: (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(2)
        };
    }

    renderColumnCard(column, stats) {
        return `
            <div class="column-stat-row">
                <div class="column-name">${column}</div>
                <div class="column-details">
                    <div class="stat-item">
                        <span class="stat-label">Type</span>
                        <span class="stat-value">${stats.type}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Unique Values</span>
                        <span class="stat-value">${stats.unique.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Empty Cells</span>
                        <span class="stat-value">${stats.empty.toLocaleString()}</span>
                    </div>
                    ${stats.type === 'Numeric' ? `
                        <div class="stat-item">
                            <span class="stat-label">Min</span>
                            <span class="stat-value">${stats.min.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Max</span>
                            <span class="stat-value">${stats.max.toLocaleString()}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Average</span>
                            <span class="stat-value">${parseFloat(stats.avg).toLocaleString()}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    showNoDataMessage() {
        this.container.innerHTML = `
            <div class="stats-card">
                <div class="no-data-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>No Data Available</h3>
                    <p>Please upload a CSV file from the main page first.</p>
                    <a href="index.html" class="back-button">Go to Main Page</a>
                </div>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('columnStatsContainer');
    new ColumnAnalyzer(container);
}); 