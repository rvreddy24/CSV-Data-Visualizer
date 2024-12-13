class ChartRenderer {
    constructor(container) {
        this.container = container;
        this.charts = new Map();
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        Chart.defaults.color = '#262626';
    }

    render(data) {
        this.container.innerHTML = '';
        const columns = Object.keys(data[0]);
        
        columns.forEach(column => {
            const values = data.map(row => row[column]);
            const chartCard = this.createChartCard(column);
            this.container.appendChild(chartCard);
            
            // Get frequency of each value
            const frequencies = values.reduce((acc, val) => {
                acc[val] = (acc[val] || 0) + 1;
                return acc;
            }, {});

            // Sort by frequency and get top 10
            const sortedData = Object.entries(frequencies)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            const labels = sortedData.map(([label]) => label);
            const counts = sortedData.map(([, count]) => count);
            const colors = [
                '#405de6', '#5851db', '#833ab4', 
                '#c13584', '#e1306c', '#fd1d1d',
                '#f56040', '#f77737', '#fcaf45', '#ffdc80'
            ];

            // Create chart instance
            const ctx = chartCard.querySelector('canvas').getContext('2d');
            const chartInstance = new Chart(ctx, this.getChartConfig('bar', labels, counts, colors, column));
            this.charts.set(column, chartInstance);

            // Handle chart type changes
            const selectElement = chartCard.querySelector('.chart-type-select');
            selectElement.addEventListener('change', (e) => {
                const newType = e.target.value;
                const oldChart = this.charts.get(column);
                if (oldChart) {
                    oldChart.destroy();
                }
                const newChart = new Chart(ctx, this.getChartConfig(newType, labels, counts, colors, column));
                this.charts.set(column, newChart);
            });

            // Add event listeners for other controls
            this.setupChartControls(chartCard, column);
        });
    }

    getChartConfig(type, labels, counts, colors, column) {
        // Convert 'horizontalBar' to 'bar' with horizontal indexAxis
        const isHorizontal = type === 'horizontalBar';
        const chartType = isHorizontal ? 'bar' : type;

        const baseConfig = {
            type: chartType,
            data: {
                labels: labels,
                datasets: this.getDatasets(chartType, counts, colors)
            },
            options: {
                ...this.getChartOptions(chartType, column),
                indexAxis: isHorizontal ? 'y' : 'x'  // This makes the bar chart horizontal
            }
        };

        return baseConfig;
    }

    getDatasets(type, counts, colors) {
        switch(type) {
            case 'radar':
                return [{
                    data: counts,
                    backgroundColor: `${colors[0]}40`,
                    borderColor: colors[0],
                    borderWidth: 2,
                    pointBackgroundColor: colors[0],
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colors[0]
                }];
            case 'bubble':
                return [{
                    data: counts.map((count, index) => ({
                        x: index,
                        y: count,
                        r: Math.sqrt(count) * 5
                    })),
                    backgroundColor: colors.map(color => `${color}80`),
                    borderColor: colors,
                    borderWidth: 1
                }];
            default:
                return [{
                    data: counts,
                    backgroundColor: this.getBackgroundColors(type, colors),
                    borderColor: this.getBorderColors(type, colors),
                    borderWidth: this.getBorderWidth(type),
                    borderRadius: type === 'bar' ? 4 : 0,
                    maxBarThickness: 35,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: type === 'line' ? colors[0] : undefined,
                    pointBorderColor: type === 'line' ? colors[0] : undefined,
                    pointRadius: ['line', 'scatter'].includes(type) ? 4 : undefined,
                    pointHoverRadius: ['line', 'scatter'].includes(type) ? 6 : undefined
                }];
        }
    }

    getChartOptions(type, column) {
        const baseOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Top 10 Values in ${column}`,
                    font: { size: 16, weight: 600 },
                    padding: 20
                },
                legend: {
                    display: ['pie', 'doughnut', 'polarArea', 'radar'].includes(type)
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    }
                }
            },
            scales: this.getScales(type)
        };

        if (type === 'radar') {
            baseOptions.scales.r = {
                beginAtZero: true,
                ticks: {
                    backdropColor: 'transparent'
                }
            };
        }

        if (type === 'bubble') {
            baseOptions.scales.x.title = {
                display: true,
                text: 'Index'
            };
        }

        return baseOptions;
    }

    getScales(type) {
        if (['pie', 'doughnut', 'polarArea', 'radar'].includes(type)) {
            return {};
        }

        return {
            y: {
                display: true,
                beginAtZero: true,
                title: { display: true, text: 'Count' }
            },
            x: {
                display: true,
                ticks: { 
                    maxRotation: type === 'horizontalBar' ? 0 : 45,
                    minRotation: type === 'horizontalBar' ? 0 : 45
                }
            }
        };
    }

    getBackgroundColors(type, colors) {
        switch(type) {
            case 'line':
            case 'scatter':
                return colors[0];
            default:
                return colors;
        }
    }

    getBorderColors(type, colors) {
        switch(type) {
            case 'line':
            case 'scatter':
                return colors[0];
            default:
                return colors;
        }
    }

    getBorderWidth(type) {
        switch(type) {
            case 'line':
            case 'scatter':
                return 2;
            default:
                return 0;
        }
    }

    createGradient(color) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        return gradient;
    }

    createChartCard(title) {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.innerHTML = `
            <div class="chart-container">
                <canvas></canvas>
            </div>
            <div class="chart-actions">
                <select class="chart-type-select">
                    <option value="bar">Bar Chart</option>
                    <option value="horizontalBar">Horizontal Bar</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="doughnut">Doughnut Chart</option>
                    <option value="polarArea">Polar Area</option>
                    <option value="radar">Radar Chart</option>
                    <option value="bubble">Bubble Chart</option>
                    <option value="scatter">Scatter Plot</option>
                </select>
                <button class="download-btn">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;
        return card;
    }

    setupChartControls(chartCard, column) {
        // Handle download only
        const downloadBtn = chartCard.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            const currentChart = this.charts.get(column);
            if (currentChart) {
                const link = document.createElement('a');
                link.download = `${column}_chart.png`;
                link.href = currentChart.toBase64Image();
                link.click();
            }
        });
    }
}