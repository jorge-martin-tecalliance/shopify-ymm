// Debug: Listen for all cart-related events to see what the theme actually uses
if (typeof window.cartEventDebugger === 'undefined') {
    window.cartEventDebugger = true;
    
    // Listen for all possible cart events
    const cartEventNames = [
        'cart:add', 'cart:updated', 'cart:change', 'cart:refresh',
        'theme:cart:add', 'theme:cart:update', 'theme:cart:change',
        'cartAdd', 'cartUpdate', 'cartChange', 'cartUpdated'
    ];
    
    cartEventNames.forEach(eventName => {
        document.addEventListener(eventName, (event) => {
            console.log(`🛒 Cart Event Detected: ${eventName}`, event.detail);
        });
    });
    
    console.log('🔍 Cart event debugger activated - watching for cart events...');
}

console.log("Search results script loaded");

// Vehicle Parts Search JavaScript
const API_URL = window.OPTICAT_CONFIG?.apiUrl;
const API_KEY = window.OPTICAT_CONFIG?.apiKey;

let allParts = [];
let filteredParts = [];

// Fetch Shopify products with criterion data
async function fetchShopifyProducts() {
    try {
        console.log('Fetching Shopify products...');
        
        const response = await fetch('/products.json?limit=250');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('Shopify products data:', data);
        
        const criterionProducts = [];
        
        data.products.forEach(product => {

            // Look for tags in the format: brandCode-partNumber
            if (product.tags && product.tags.length > 0) {
                product.tags.forEach(tag => {
                    // Check if tag contains a hyphen (potential brandCode-partNumber format)
                    if (tag.includes('_')) {
                        const parts = tag.split('_');
                        // Assuming format is exactly: brandCode-partNumber
                        if (parts.length >= 2) {
                            const brandCode = parts[0];
                            const partNumber = parts.slice(1).join('_'); // In case part number has hyphens
                            
                            criterionProducts.push({
                                brandCode: brandCode,
                                partNumber: partNumber,
                                productId: product.id,
                                productTitle: product.title,
                                productHandle: product.handle,
                                productPrice: product.variants[0].price,
                                variantId: product.variants[0].id
                            });
                        }
                    }
                });
            }

        });

        console.log('Extracted criterion products:', criterionProducts);
        return criterionProducts;

    } catch (error) {
        console.error('Error fetching Shopify products:', error);
        return [];
    }
}

// Get search data from sessionStorage or event
function getSearchData() {
    // First try to get from sessionStorage
    const storedData = sessionStorage.getItem('ymmSearchData');
    if (storedData) {
        return JSON.parse(storedData);
    }

    // Fallback to URL parameters (if redirected from another page)
    const params = new URLSearchParams(window.location.search);
    if (params.get('baseVehicleId')) {
        return {
            year: params.get('year'),
            make: params.get('make'),
            model: params.get('model'),
            makeId: params.get('makeId'),
            modelId: params.get('modelId'),
            baseVehicleId: params.get('baseVehicleId'),
            regionId: params.get('regionId')
        };
    }

    return null;
}

// Display vehicle information
function displayVehicleInfo(vehicleData) {
    const vehicleInfo = document.getElementById('vehicle-info');
    if (vehicleInfo) {
        vehicleInfo.innerHTML = `
      <p><strong>Vehicle:</strong> ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}</p>
    `;
    }
}

// Fetch parts from OptiCat API
async function fetchParts(vehicleData) {
    const apiData = {
        "getAutoCareSearchResults": {
            "baseVehicleId": parseInt(vehicleData.baseVehicleId),
            "baseVehicleRegionId": parseInt(vehicleData.regionId),
            "includeParts": true,
            "includePartFitments": true,
            "perPage": 100,
            "page": 1
        }
    };

    try {
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
        console.log('OptiCat parts:', result.parts);

        // Fetch Shopify products with criterion data
        const shopifyProducts = await fetchShopifyProducts();

        // Filter and enhance API parts with Shopify data
        const filteredParts = result.parts.map(part => {
            const apiBrandCode = part.piesItem.brandCode;
            const apiPartNumber = part.piesItem.partNumber;
            
            // Find matching Shopify product
            const matchingShopifyProduct = shopifyProducts.find(shopifyProduct => 
                shopifyProduct.brandCode === apiBrandCode && 
                shopifyProduct.partNumber === apiPartNumber
            );
            
            if (matchingShopifyProduct) {
                console.log(`Match found: ${apiBrandCode} - ${apiPartNumber}`);
                // Add Shopify data to the part
                return {
                    ...part,
                    shopifyProduct: matchingShopifyProduct
                };
            }
            
            return null; // No match found
        }).filter(part => part !== null); // Remove parts without matches

        console.log('API parts after filtering:', filteredParts.length);
        return { ...result, parts: filteredParts };

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Clear search results function
function clearSearchResults() {
    // Clear the results data
    allParts = [];
    filteredParts = [];
    
    // Clear active filters
    activeFilters = {
        categories: [],
        subCategories: [],
        partTypes: []
    };
    
    // Hide the search results section
    const searchResultsDiv = document.getElementById('search-results');
    if (searchResultsDiv) {
        searchResultsDiv.classList.add('hidden');
    }
    
    // Clear results container
    const resultsContainer = document.getElementById('parts-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    // Clear summary
    const summaryContainer = document.getElementById('results-summary');
    if (summaryContainer) {
        summaryContainer.innerHTML = '';
    }
    
    // Clear vehicle info
    const vehicleInfo = document.getElementById('vehicle-info');
    if (vehicleInfo) {
        vehicleInfo.innerHTML = '';
    }
    
    // Clear filter containers
    const filterContainers = ['category-filters', 'subcategory-filters', 'parttype-filters'];
    filterContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    });
    
    // Clear sessionStorage data
    sessionStorage.removeItem('ymmSearchData');
    
    // Hide loading and error messages
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
        errorElement.innerHTML = '';
    }

    // Reset YMM dropdowns to default
    const yearSelect = document.getElementById('year-select');
    const makeSelect = document.getElementById('make-select');
    const modelSelect = document.getElementById('model-select');

    if (yearSelect) yearSelect.value = '';
    if (makeSelect) {
        makeSelect.innerHTML = '<option value="">Select Make *</option>';
        makeSelect.disabled = true;
    }
    if (modelSelect) {
        modelSelect.innerHTML = '<option value="">Select Model *</option>';
        modelSelect.disabled = true;
    }
}

// Display results
function displayResults() {
    const resultsContainer = document.getElementById('parts-results');
    const summaryContainer = document.getElementById('results-summary');
    const searchResultsDiv = document.getElementById('search-results');

    if (!resultsContainer || !summaryContainer) return;

    if (searchResultsDiv) {
        searchResultsDiv.classList.remove('hidden');
    }

    summaryContainer.innerHTML = `
        
        <div>Showing ${filteredParts.length} of ${allParts.length} parts</div>
        <div>
            <div class="button-clear-search" onclick="clearSearchResults()">Clear Results</div>
        </div>
        
    `;

    if (filteredParts.length === 0) {
        resultsContainer.innerHTML = '<p>No parts found matching your filters.</p>';
        return;
    }

    resultsContainer.innerHTML = filteredParts.map(part => {
        const shopifyItem = part.shopifyProduct;
        
        const piesItem = part.piesItem;
        const fitments = part.fitments;
        
        const primaryImage = piesItem.digitalAssets?.find(asset => asset.assetTypeCode === 'P04');
        const description = piesItem.descriptions?.find(desc => desc.descriptionTypeCode === 'SHO')?.value || piesItem.descriptions?.[0]?.value || 'N/A';
        
        const mfrLabel = fitments[0].acesApp.mfrLabel;
        const position = fitments[0].acesApp.attributes[0].attributeValueName;
        const application = null;
        const notes = fitments[0].acesApp.notes[0].value;

        // Generate brand logo
        let brandLogo = '';
        if (piesItem.brandAdditionalInfo?.logoImageURL100x40) {
            brandLogo = `<img src="${piesItem.brandAdditionalInfo.logoImageURL100x40}" alt="${piesItem.brandName}">`;
        } else {
            brandLogo = `<img src="https://placehold.co/100x40?text=No+Image" alt="${piesItem.brandName}">`;
        }

        // Generate Primary part image
        let partThumbnail = '';
        if (primaryImage?.imageURL200) {
            partThumbnail = `<img class="part-image" src="${primaryImage.imageURL200}" alt="${piesItem.brandName}">`;
        } else {
            partThumbnail = `<img class="part-image" src="https://placehold.co/200x200?text=No+Image" alt="${piesItem.brandName}">`;
        }

        // <div class="part-item-card" style="cursor: pointer" onclick="window.location.href='/products/${shopifyItem.productHandle}'">
        return `
            <div class="part-item-card">
                <div class="part-content-wrapper">
                    <div class="part-image-wrapper" style="cursor: pointer" onclick="window.location.href='/products/${shopifyItem.productHandle}'">
                        ${partThumbnail}
                    </div>

                    <div class="part-info">
                        <div class="part-header-wrapper" style="cursor: pointer" onclick="window.location.href='/products/${shopifyItem.productHandle}'">
                            <div>${brandLogo}</div>
                            <div class="part-header-title">${shopifyItem.productTitle}</div>
                        </div>

                        <div class="part-details">
                            <div class="part-details-column">
                                <div>
                                    <strong>Part Number:</strong>
                                    <span>${piesItem.partNumber}</span> 
                                </div>
                                <div>
                                    <strong>Part Type:</strong>
                                    <span>${piesItem.partTypeName}</span>
                                </div>
                                <div>
                                    <strong>MFR Label:</strong>
                                    <span>${mfrLabel}</span>
                                </div>
                                <div>
                                    <strong>Position:</strong>
                                    <span>${position}</span>
                                </div>
                            </div>
                            <div class="part-details-column">
                                <div>
                                    <strong>Application:</strong>
                                    <span class="text-limit" id="app-${piesItem.partNumber}">
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut neque libero, sagittis et sodales quis, dignissim eget nunc. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Quisque nec placerat enim, eget lacinia justo. Praesent non nisi cursus, vestibulum urna sed, suscipit velit. Nulla rutrum mollis tellus, sed placerat lacus. Suspendisse elementum imperdiet leo eget tincidunt. Nullam et massa lorem.
                                    </span>
                                    <span class="read-more-btn" onclick="toggleText('app-${piesItem.partNumber}', this)" style="display: none;">
                                        Read more
                                    </span>
                                </div>
                            </div>
                            <div class="part-details-column">
                                <div>
                                    <strong>Notes:</strong>
                                    <span class="text-limit" id="app-${piesItem.partNumber}">
                                        ${notes}
                                    </span>
                                    <span class="read-more-btn" onclick="toggleText('app-${piesItem.partNumber}', this)" style="display: none;">
                                        Read more
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="part-price-column">
                        <div class="part-price-value">$${shopifyItem.productPrice}</div>
                        <div class="button-add-to-cart" onclick="addToCart(${shopifyItem.variantId}, 1, this)">Add to Cart</div>
                    </div>

                </div>
            </div>
        `;
    }).join('');

    setTimeout(checkTextHeight, 100);
}

// Function to refresh cart sections (drawer, notification, etc.)
async function refreshCartSections() {
    try {
        // Try to refresh cart drawer content
        const cartDrawer = document.querySelector('cart-drawer-component');
        if (cartDrawer) {
            // Try to fetch updated cart drawer HTML
            const response = await fetch('/cart?section_id=cart-drawer');
            if (response.ok) {
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newDrawerContent = doc.querySelector('.cart-drawer__content');
                const currentDrawerContent = cartDrawer.querySelector('.cart-drawer__content');
                
                if (newDrawerContent && currentDrawerContent) {
                    currentDrawerContent.innerHTML = newDrawerContent.innerHTML;
                    console.log('Cart drawer content refreshed');
                }
            }
        }
        
        // Try to refresh other cart sections
        const cartSections = ['cart-notification', 'cart-items'];
        for (const sectionId of cartSections) {
            try {
                const response = await fetch(`/cart?section_id=${sectionId}`);
                if (response.ok) {
                    const html = await response.text();
                    const element = document.querySelector(`[data-section-id="${sectionId}"]`);
                    if (element) {
                        element.innerHTML = html;
                        console.log(`Refreshed section: ${sectionId}`);
                    }
                }
            } catch (sectionError) {
                console.log(`Failed to refresh section ${sectionId}:`, sectionError);
            }
        }
        
    } catch (error) {
        console.log('Failed to refresh cart sections:', error);
    }
}

// Function for the add to cart button
async function addToCart(variantId, quantity = 1, buttonElement) {
    // Debug: Log what we're sending
    console.log('Attempting to add to cart:', { variantId, quantity });
    
    buttonElement.disabled = true;
    buttonElement.textContent = 'Adding...';
    
    try {
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [{
                    id: variantId,
                    quantity: quantity
                }]
            })
        });

        // Debug: Log the response
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            // Get the error details
            const errorText = await response.text();
            console.log('Error response:', errorText);
            throw new Error(`Failed to add to cart: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Added to cart successfully:', result);

        // Dispatch the correct CartAddEvent that the theme expects
        try {
            // Try multiple event approaches to match the theme
            
            // Approach 1: Dispatch on document with theme event structure
            const cartAddEventDoc = new CustomEvent('cart:add', {
                detail: {
                    resource: result,
                    sourceId: variantId.toString(),
                    data: {
                        source: 'product-form-component',
                        itemCount: quantity,
                        productId: null,
                        sections: result.sections || {},
                        didError: false
                    }
                },
                bubbles: true
            });
            document.dispatchEvent(cartAddEventDoc);
            
            // Approach 2: Try the exact structure from ProductFormComponent
            const cartAddEventExact = new CustomEvent('cart:add', {
                detail: {
                    resource: {},
                    sourceId: variantId.toString(),
                    data: {
                        source: 'product-form-component',
                        itemCount: quantity,
                        productId: null,
                        sections: result.sections || {}
                    }
                },
                bubbles: true
            });
            document.dispatchEvent(cartAddEventExact);
            
            // Approach 3: Try cart update event
            const cartUpdateEvent = new CustomEvent('cart:update', {
                detail: {
                    data: {
                        itemCount: cartData.item_count,
                        source: 'product-form-component'
                    }
                },
                bubbles: true
            });
            
            // Fetch cart data first for update event
            const cartResponse = await fetch('/cart.js');
            const cartData = await cartResponse.json();
            
            document.dispatchEvent(cartUpdateEvent);
            
            console.log('Multiple CartAddEvents dispatched');
            
        } catch (eventError) {
            console.log('Cart event dispatch failed:', eventError);
        }
        
        // Since cart sections don't exist, try alternative approaches
        try {
            // Wait a moment for the event to be processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Try to find and refresh cart drawer content
            const cartDrawer = document.querySelector('cart-drawer-component');
            if (cartDrawer) {
                // Try to fetch cart drawer content by opening/closing it to trigger refresh
                try {
                    // First, let's try to find if there's a way to refresh the drawer sections
                    const cartItemsComponent = cartDrawer.querySelector('cart-items-component');
                    if (cartItemsComponent && cartItemsComponent.dataset.sectionId) {
                        // Try to fetch the specific section that the drawer uses
                        const sectionId = cartItemsComponent.dataset.sectionId;
                        const sectionResponse = await fetch(`/?section_id=${sectionId}`);
                        
                        if (sectionResponse.ok) {
                            const sectionHtml = await sectionResponse.text();
                            const parser = new DOMParser();
                            const sectionDoc = parser.parseFromString(sectionHtml, 'text/html');
                            
                            // Find the cart-items-component in the section response
                            const newCartItemsComponent = sectionDoc.querySelector('cart-items-component');
                            if (newCartItemsComponent) {
                                // Replace the entire cart-items-component content
                                cartItemsComponent.innerHTML = newCartItemsComponent.innerHTML;
                                console.log('Updated cart drawer from section:', sectionId);
                                
                                // Remove empty cart classes if items exist
                                const dialog = cartDrawer.querySelector('dialog');
                                if (dialog) {
                                    dialog.classList.remove('cart-drawer--empty');
                                    dialog.setAttribute('cart-summary-sticky', 'true');
                                }
                            }
                        }
                    } else {
                        // Fallback: try to simulate what the theme does by closing and reopening
                        console.log('Trying to refresh cart drawer by toggling...');
                        
                        // Close the drawer if it's open
                        if (cartDrawer.querySelector('dialog[open]')) {
                            cartDrawer.close();
                            // Wait a moment then reopen
                            setTimeout(() => {
                                cartDrawer.open();
                            }, 100);
                        }
                    }
                } catch (drawerError) {
                    console.log('Failed to refresh cart drawer:', drawerError);
                }
                
                // Try to trigger a refresh by dispatching events to the drawer
                cartDrawer.dispatchEvent(new CustomEvent('refresh', { bubbles: true }));
                cartDrawer.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
                console.log('Triggered cart drawer refresh events');
            }
            
            // Try to find cart icon and force update
            const cartIcon = document.querySelector('cart-icon');
            if (cartIcon) {
                // Fetch current cart and update manually
                const cartResponse = await fetch('/cart.js');
                const cartData = await cartResponse.json();
                
                // Try to call the cart icon's update method directly
                if (typeof cartIcon.renderCartBubble === 'function') {
                    cartIcon.renderCartBubble(cartData.item_count, false, true);
                    console.log('Manually updated cart icon');
                }
            }
            
        } catch (refreshError) {
            console.log('Manual refresh failed:', refreshError);
        }

        // Reset button state
        buttonElement.disabled = false;
        buttonElement.textContent = 'Add to Cart';

        return result;
    } catch (error) {
        console.error('Add to cart error:', error);
        buttonElement.disabled = false;
        buttonElement.textContent = 'Add to Cart';
        alert(`Failed to add to cart: ${error.message}`);
    }
}

// Initialize the page
async function initializePage() {
    if (!document.getElementById('search-results')) {
        return;
    }

    const vehicleData = getSearchData();
    
    // Only perform search if we have vehicle data
    if (vehicleData) {
        await performSearch(vehicleData);
    } else {
        // Hide loading message if no search data available
        const loadingElement = document.getElementById('loading-message');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
}

// Perform the actual search
async function performSearch(vehicleData) {
    displayVehicleInfo(vehicleData);

    try {
        const result = await fetchParts(vehicleData);

        if (result.parts && result.parts.length > 0) {
            allParts = result.parts;
            filteredParts = [...allParts];
            // buildFilters(allParts); // Removed - categories now loaded from database
            displayResults();
        } else {
            const searchResultsDiv = document.getElementById('search-results');
            if (searchResultsDiv) {
                searchResultsDiv.classList.remove('hidden');
            }

            const summaryContainer = document.getElementById('results-summary');
            if (summaryContainer) {
                summaryContainer.innerHTML = `
                    <div>No parts found for this vehicle</div>
                    <div>
                        <div class="button-clear-search" onclick="clearSearchResults()">Clear Results</div>
                    </div>
                `;
            }
        }
    } catch (error) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.innerHTML = `Error loading parts: ${error.message}`;
            errorElement.style.display = 'block';
        }
    }

    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Toggle text expansion
function toggleText(elementId, button) {
    const element = document.getElementById(elementId);
    if (element.classList.contains('expanded')) {
        element.classList.remove('expanded');
        button.textContent = 'Read more';
    } else {
        element.classList.add('expanded');
        button.textContent = 'Read less';
    }
}

// Check if text needs "Read more" button
function checkTextHeight() {
    document.querySelectorAll('.text-limit').forEach(element => {
        const button = element.nextElementSibling;
        if (element.scrollHeight > element.clientHeight) {
            button.style.display = 'inline-block';
        }
    });
}

// Listen for search events from the YMM widget
window.addEventListener('ymmSearchTriggered', async function (event) {
    console.log('Search triggered:', event.detail);

    // Show loading state
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }

    // Clear previous results
    const resultsContainer = document.getElementById('parts-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }

    // Perform search with new data
    await performSearch(event.detail);
});

// Start when page loads
document.addEventListener('DOMContentLoaded', initializePage);

// Make functions globally available
window.clearAllFilters = clearAllFilters;