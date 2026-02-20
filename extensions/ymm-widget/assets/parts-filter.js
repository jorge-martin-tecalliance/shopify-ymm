let activeFilters = {
    categories: [],
    subCategories: [],
    partTypes: []
};

// Toggle the filters on and off
function toggleFilters() {
    const filterDiv = document.getElementById('filter-objects');
    const toggleButton = event.currentTarget; // Get the button that was clicked
    const icon = toggleButton.querySelector('i');
    
    if (filterDiv.style.display === 'none') {
        filterDiv.style.display = 'block';
        icon.className = 'fa-solid fa-eye-slash'; // Show eye-slash when filters are visible
    } else {
        filterDiv.style.display = 'none';
        icon.className = 'fa-solid fa-eye'; // Show eye when filters are hidden
    }
}

// Fetch categories from database via app proxy
async function fetchCategories() {
    try {
        const shop = window.Shopify?.shop || '';
        
        const response = await fetch(`/apps/part-search/api/categories/public?shop=${encodeURIComponent(shop)}`);
        
        const data = await response.json();
        
        if (data.categories && data.categories.length > 0) {
            buildFiltersFromDatabase(data.categories);
        } else {
            console.warn('No categories found in response');
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function searchBasedOnFilters() {
    // Get the selected vehicle from sessionStorage
    const vehicleData = JSON.parse(sessionStorage.getItem('ymmSearchData'));
    if (!vehicleData || !vehicleData.baseVehicleId) {
        alert('Please select a vehicle first using the Year/Make/Model widget');
        return;
    }

    // Get selected part type IDs from checked checkboxes
    const selectedPartTypeIds = [];
    document.querySelectorAll('.filter-checkbox input[type="checkbox"]:checked').forEach(checkbox => {
        const terminologyId = parseInt(checkbox.dataset.terminologyId);
        if (terminologyId) {
            selectedPartTypeIds.push(terminologyId);
        }
    });

    if (selectedPartTypeIds.length === 0) {
        alert('Please select at least one part type to search');
        return;
    }
    
    let allApiParts = [];
    let currentPage = 1;
    const perPage = 100;
    let hasMorePages = true;

    try {
        // Fetch all pages
        while (hasMorePages) {
            const apiData = {
                "getAutoCareSearchResults": {
                    "partTypeIds": selectedPartTypeIds,
                    "baseVehicleId": parseInt(vehicleData.baseVehicleId),
                    "baseVehicleRegionId": parseInt(vehicleData.regionId),
                    "includeParts": true,
                    "includePartFitments": true,
                    "perPage": perPage,
                    "page": currentPage
                }
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'X-Api-Key': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData)
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.parts && result.parts.length > 0) {
                allApiParts = allApiParts.concat(result.parts);
                
                if (result.parts.length < perPage) {
                    hasMorePages = false;
                } else {
                    currentPage++;
                }
            } else {
                hasMorePages = false;
            }
        }

        // Fetch Shopify products with criterion data
        const shopifyProducts = await fetchShopifyProducts();

        // Match OptiCat parts with Shopify products
        const matchedParts = allApiParts.map(part => {
            const apiBrandCode = part.piesItem.brandCode;
            const apiPartNumber = part.piesItem.partNumber;
            
            const matchingShopifyProduct = shopifyProducts.find(shopifyProduct => 
                shopifyProduct.brandCode === apiBrandCode && 
                shopifyProduct.partNumber === apiPartNumber
            );
            
            if (matchingShopifyProduct) {
                console.log(`Match found: ${apiBrandCode} - ${apiPartNumber}`);
                return {
                    ...part,
                    shopifyProduct: matchingShopifyProduct
                };
            }
            
            return null;
        }).filter(part => part !== null);

        // Update global arrays (these are used by displayResults)
        allParts = matchedParts;
        filteredParts = [...matchedParts];

        // Display the results on the page
        displayResults();

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Build filters from database categories
function buildFiltersFromDatabase(categoriesData) {
    console.log('buildFiltersFromDatabase called with:', categoriesData);
    
    const container = document.getElementById('category-filters');
    
    if (!container) {
        console.error('category-filters container not found!');
        return;
    }
    
    container.innerHTML = '';
    
    categoriesData.forEach(category => {
        // Create category item
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'filter-category';
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'filter-category-header';
        categoryHeader.innerHTML = `<span class="toggle-icon">+</span> ${category.name}`;
        
        const subcategoriesDiv = document.createElement('div');
        subcategoriesDiv.className = 'filter-subcategories hidden';
        
        // Add subcategories
        category.subcategories.forEach(sub => {
            const subDiv = document.createElement('div');
            subDiv.className = 'filter-subcategory';
            
            const subHeader = document.createElement('div');
            subHeader.className = 'filter-subcategory-header';
            subHeader.innerHTML = `<span class="toggle-icon">+</span> ${sub.name}`;
            
            const partTypesDiv = document.createElement('div');
            partTypesDiv.className = 'filter-parttypes hidden';
            
            // Add part types with checkboxes
            sub.partTypes.forEach(pt => {
                const label = document.createElement('label');
                label.className = 'filter-checkbox';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = pt.name;
                checkbox.dataset.terminologyId = pt.terminologyId; // Store the PartTerminologyID
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'part-type-name';
                nameSpan.textContent = pt.name;
                
                label.appendChild(checkbox);
                label.appendChild(nameSpan);
                
                partTypesDiv.appendChild(label);
            });

            // Toggle subcategory
            subHeader.addEventListener('click', () => {
                const icon = subHeader.querySelector('.toggle-icon');
                if (partTypesDiv.classList.contains('hidden')) {
                    partTypesDiv.classList.remove('hidden');
                    icon.textContent = '−';
                } else {
                    partTypesDiv.classList.add('hidden');
                    icon.textContent = '+';
                }
            });
            
            subDiv.appendChild(subHeader);
            subDiv.appendChild(partTypesDiv);
            subcategoriesDiv.appendChild(subDiv);
        });
        
        // Toggle category
        categoryHeader.addEventListener('click', () => {
            const icon = categoryHeader.querySelector('.toggle-icon');
            if (subcategoriesDiv.classList.contains('hidden')) {
                subcategoriesDiv.classList.remove('hidden');
                icon.textContent = '−';
            } else {
                subcategoriesDiv.classList.add('hidden');
                icon.textContent = '+';
            }
        });
        
        categoryDiv.appendChild(categoryHeader);
        categoryDiv.appendChild(subcategoriesDiv);
        container.appendChild(categoryDiv);
    });
    
    // Hide subcategory and parttype containers since we're building hierarchically
    const subcategoryContainer = document.getElementById('subcategory-filters');
    const parttypeContainer = document.getElementById('parttype-filters');
    
    if (subcategoryContainer) {
        subcategoryContainer.style.display = 'none';
    }
    if (parttypeContainer) {
        parttypeContainer.style.display = 'none';
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

    // Show message if no items available
    if (items.length === 0) {
        const noItemsMsg = document.createElement('p');
        noItemsMsg.className = 'no-filters-message';
        noItemsMsg.textContent = 'No options available';
        noItemsMsg.style.color = '#999';
        noItemsMsg.style.fontStyle = 'italic';
        noItemsMsg.style.padding = '10px 0';
        container.appendChild(noItemsMsg);
        return;
    }

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

    // Re-run the original vehicle search from sessionStorage
    const vehicleData = JSON.parse(sessionStorage.getItem('ymmSearchData'));
    if (vehicleData) {
        performSearch(vehicleData);
    } else {
        console.warn('No vehicle data in sessionStorage');
    }
}

// Initialize - fetch categories from database on page load
fetchCategories();