class TableManager {
    constructor(container) {
        this.container = container;
        this.data = [];
        this.filteredData = [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.headers = [];
    }

    render(data) {
        this.data = data;
        this.filteredData = [...data];
        this.headers = Object.keys(data[0] || {});
        this.container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';

        // Create controls
        const controls = this.createControls();
        wrapper.appendChild(controls);

        // Create table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';

        const table = document.createElement('table');
        table.className = 'data-table';

        // Create headers
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        this.headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = this.formatHeader(header);
            th.addEventListener('click', () => this.sortBy(header));
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create body
        const tbody = document.createElement('tbody');
        this.renderRows(tbody);
        table.appendChild(tbody);

        tableContainer.appendChild(table);
        wrapper.appendChild(tableContainer);
        this.container.appendChild(wrapper);
    }

    formatHeader(header) {
        return header
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    createControls() {
        const controls = document.createElement('div');
        controls.className = 'table-controls';

        const search = document.createElement('div');
        search.className = 'search-control';
        
        const searchIcon = document.createElement('i');
        searchIcon.className = 'fas fa-search';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        searchInput.addEventListener('input', this.debounce((e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterData();
        }, 300));

        search.appendChild(searchIcon);
        search.appendChild(searchInput);
        controls.appendChild(search);

        return controls;
    }

    renderRows(tbody) {
        tbody.innerHTML = '';
        this.filteredData.forEach(row => {
            const tr = document.createElement('tr');
            this.headers.forEach(header => {
                const td = document.createElement('td');
                const value = row[header];
                
                // Check if value is numeric
                if (!isNaN(value) && value !== '') {
                    td.textContent = value;
                    td.style.textAlign = 'right';
                } else {
                    td.textContent = value;
                }
                
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    sortBy(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        const direction = this.sortDirection === 'asc' ? 1 : -1;
        
        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];
            
            // Check if values are numeric
            if (!isNaN(aVal) && !isNaN(bVal)) {
                aVal = parseFloat(aVal) || 0;
                bVal = parseFloat(bVal) || 0;
                return (aVal - bVal) * direction;
            }
            
            // Handle dates
            const aDate = new Date(aVal);
            const bDate = new Date(bVal);
            if (!isNaN(aDate) && !isNaN(bDate)) {
                return (aDate - bDate) * direction;
            }
            
            // Default string comparison
            return String(aVal).localeCompare(String(bVal)) * direction;
        });

        this.renderRows(this.container.querySelector('tbody'));
    }

    filterData() {
        if (!this.searchTerm) {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(row => 
                Object.values(row).some(value => 
                    String(value).toLowerCase().includes(this.searchTerm)
                )
            );
        }
        this.renderRows(this.container.querySelector('tbody'));
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}