let activeFilters = {
    categories: [],
    subCategories: [],
    partTypes: []
};

// Toggle the filters on and off
function toggleFilters() {
    const filterDiv = document.getElementById('filter-objects');
    
    if (filterDiv.style.display === 'none') {
        filterDiv.style.display = 'block';
    } else {
        filterDiv.style.display = 'none';
    }
}

// Build filter options from parts data
function buildFilters(parts) {
    const categories = new Set();
    const subCategories = new Set();
    const partTypes = new Set();

    parts.forEach(part => {
        const piesItem = part.piesItem;
        if (piesItem.categoryName) categories.add(piesItem.categoryName);
        if (piesItem.subCategoryName) subCategories.add(piesItem.subCategoryName);
        if (piesItem.partTypeName) partTypes.add(piesItem.partTypeName);
    });

    // Create filter checkboxes
    createFilterCheckboxes('category-filters', Array.from(categories), 'categories');
    createFilterCheckboxes('subcategory-filters', Array.from(subCategories), 'subCategories');
    createFilterCheckboxes('parttype-filters', Array.from(partTypes), 'partTypes');
}

// Create filter checkboxes
function createFilterCheckboxes(containerId, items, filterType) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    items.sort().forEach(item => {
        const label = document.createElement('label');
        label.className = 'filter-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = item;
        checkbox.addEventListener('change', () => toggleFilter(filterType, item));

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(item));
        container.appendChild(label);
    });
}

// Toggle filter
function toggleFilter(filterType, value) {
    const filterArray = activeFilters[filterType];
    const index = filterArray.indexOf(value);

    if (index > -1) {
        filterArray.splice(index, 1);
    } else {
        filterArray.push(value);
    }

    applyFilters();
}

// Apply filters to parts
function applyFilters() {
    filteredParts = allParts.filter(part => {
        const piesItem = part.piesItem;

        // Check category filter
        if (activeFilters.categories.length > 0 &&
            !activeFilters.categories.includes(piesItem.categoryName)) {
            return false;
        }

        // Check sub-category filter
        if (activeFilters.subCategories.length > 0 &&
            !activeFilters.subCategories.includes(piesItem.subCategoryName)) {
            return false;
        }

        // Check part type filter
        if (activeFilters.partTypes.length > 0 &&
            !activeFilters.partTypes.includes(piesItem.partTypeName)) {
            return false;
        }

        return true;
    });

    displayResults();
}

// Clear all filters
function clearAllFilters() {
    activeFilters = { categories: [], subCategories: [], partTypes: [] };

    // Uncheck all checkboxes
    document.querySelectorAll('.filter-checkbox input').forEach(checkbox => {
        checkbox.checked = false;
    });

    applyFilters();
}