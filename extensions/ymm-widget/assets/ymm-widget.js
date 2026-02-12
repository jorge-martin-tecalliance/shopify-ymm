console.log("YMM widget script loaded");

document.getElementById('make-select').disabled = true;
document.getElementById('model-select').disabled = true;
document.getElementById('search-button').disabled = true;

// Endpoint URL and Key
const url = window.OPTICAT_CONFIG?.apiUrl;
const apiKey = window.OPTICAT_CONFIG?.apiKey;
const resultsPageUrl = window.YMM_CONFIG?.resultsPageUrl || window.searchResultsPageUrl;


if (!apiKey) {
  console.error(
    "YMM API key is missing. Please set it in the app Settings page."
  );
}

function getVehicleTypeIds() {
    const raw = document.getElementById('type-select').value;
    if (!raw) return [];
    return raw.split(',').map(v => parseInt(v.trim()));
}

// Load regions
loadRegion();

// Fetches and loads all the regions in OptiCat catalog
function loadRegion() {
    const data = {
        "getAutoCareVehicleResults": {
            "regionFacets": {
                "enabled": true,
                "page": 1,
                "perPage": 1000
            }
        }
    };
    const headers = {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
    };

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);

        // Populate the region dropdown
        const regionFacets = data.regionFacets.counts;
        const regionSelectDropdown = document.getElementById('region-select');

        regionFacets.forEach(facet => {
            const option = document.createElement('option');
            option.value = facet.regionId;
            option.textContent = facet.regionAbbr;
            if (facet.regionId === 1) {
                option.selected = true;
            }
            regionSelectDropdown.appendChild(option);
        });
        loadType();

        return data;
    })
    .catch(error => {
        console.error('Error:', error);
    });
};

// Fetches and loads all the vehicle types in OptiCat catalog
function loadType() {
    let regionIds = document.getElementById('region-select').value;

    const data = {
        "getAutoCareVehicleResults": {
            "regionIds": [parseInt(regionIds)],
            "vehicleTypeFacets": {
                "enabled": true,
                "page": 1,
                "perPage": 1000
            }
        }
    };
    const headers = {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
    };

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);

        // Populate the vehicle type dropdown
        const vehicleTypeFacets = data.vehicleTypeFacets.counts;
        const vehicleTypeSelectDropdown = document.getElementById('type-select');

        // Clear existing options first
        vehicleTypeSelectDropdown.innerHTML = '<option value="">Select Vehicle Type</option>';

        // Variables to accumulate the combined count of Car, Truck, and Van
        let combinedCount = 0;
        let combinedVehicleTypeIds = [];

        // Array to store other vehicle types
        let otherVehicleTypes = [];

        // Loop through each vehicle type
        vehicleTypeFacets.forEach(facet => {
            // Check for Car, Truck, and Van, and accumulate their counts and IDs
            if (facet.vehicleTypeName === "Car" || facet.vehicleTypeName === "Truck" || facet.vehicleTypeName === "Van") {
                combinedCount += facet.count;
                combinedVehicleTypeIds.push(facet.vehicleTypeId); // Collect their IDs to combine
            } else {
                // Store other vehicle types in the array to append later
                otherVehicleTypes.push(facet);
            }
        });

        // Add the combined option for Car/Truck/Van at the top
        if (combinedCount > 0) {
            const option = document.createElement('option');
            option.value = combinedVehicleTypeIds.join(', '); // Set the value as a comma-separated list of IDs
            option.textContent = `Car-Truck-Van`; // Label it as Car/Truck/Van with the combined count
            option.selected = true;
            vehicleTypeSelectDropdown.appendChild(option); // Append this as the first option
        }

        // Add the rest of the vehicle types after the combined option
        otherVehicleTypes.forEach(facet => {
            const option = document.createElement('option');
            option.value = facet.vehicleTypeId; // Set the value to vehicleTypeId
            option.textContent = `${facet.vehicleTypeName}`; // Display vehicleTypeName with the count
            vehicleTypeSelectDropdown.appendChild(option);
        });

        loadYear();

        return data;
    })
    .catch(error => {
        console.error('Error:', error);
    });
};

// Fetches and loads all the vehicle makes in OptiCat catalog based on the type selected
function loadYear() {
    let regionIds = document.getElementById('region-select').value;
    let vehicleTypeIds = document.getElementById('type-select').value;

    const data = {
        "getAutoCareVehicleResults": {
            "regionIds": [parseInt(regionIds)],
            "vehicleTypeIds": [parseInt(vehicleTypeIds)],
            "yearFacets": {
                "enabled": true,
                "page": 1,
                "perPage": 1000
            }
        }
    };
    const headers = {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
    };

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);

        // Populate the year dropdown
        const yearFacets = data.yearFacets.counts
        const yearSelectDropdown = document.getElementById('year-select');

        yearFacets.forEach(facet => {
            const option = document.createElement('option');
            option.value = facet.year;
            option.textContent = facet.year;
            yearSelectDropdown.appendChild(option);
        });

        return data;
    })
    .catch(error => {
        console.error('Error:', error);
    });
};

// Fetches and loads all the vehicle makes in OptiCat catalog based on the year selected
function loadMake() {
    let regionIds = document.getElementById('region-select').value;
    let vehicleTypeIds = document.getElementById('type-select').value;
    let year = document.getElementById('year-select').value;

    const data = {
        "getAutoCareVehicleResults": {
            "regionIds": [parseInt(regionIds)],
            "vehicleTypeIds": [parseInt(vehicleTypeIds)],
            "years": [year],
            "makeFacets": {
                "enabled": true,
                "page": 1,
                "perPage": 1000
            }
        }
    };
    const headers = {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
    };

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Makes under the selected year:', data);

        const makeSelectDropdown = document.getElementById('make-select');

        // Clear the make dropdown
        makeSelectDropdown.innerHTML = '<option value="">Select Make</option>';

        // Populate the make dropdown
        const makeFacets = data.makeFacets.counts

        makeFacets.forEach(facet => {
            const option = document.createElement('option');
            option.value = facet.makeId;
            option.textContent = facet.makeName;
            makeSelectDropdown.appendChild(option);
        });

        return data;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Fetches and loads all the vehicle models in OptiCat catalog based on the make selected
function loadModel() {
    let regionIds = document.getElementById('region-select').value;
    let vehicleTypeIds = document.getElementById('type-select').value.split(',').map(id => parseInt(id.trim()));
    let year = document.getElementById('year-select').value;
    let makeId = document.getElementById('make-select').value;

    console.log(vehicleTypeIds)

    const data = {
        "getAutoCareVehicleResults": {
            "regionIds": regionIds,
            "vehicleTypeIds": vehicleTypeIds,
            "years": [year],
            "makeIds": [makeId],
            "modelFacets": {
                "enabled": true,
                "page": 1,
                "perPage": 1000
            }
        }
    };
    const headers = {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
    };

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Models under the selected make:', data);

        const modelSelectDropdown = document.getElementById('model-select');

        // Clear the model dropdown
        modelSelectDropdown.innerHTML = '<option value="">Select Model</option>';

        // Populate the model dropdown
        const modelFacets = data.modelFacets.counts

        modelFacets.forEach(facet => {
            const option = document.createElement('option');
            option.value = facet.modelId;
            option.textContent = facet.modelName;
            modelSelectDropdown.appendChild(option);
        });

        return data;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Populates the vehicle type dropdown depending on the regions selected
function loadRegionChange() {
    const region = document.getElementById('region-select').value;

    if (region != "") {
        loadType();
    }

    console.log("The id of the region you chose is", region);
}

// Populates the year dropdown depending on the vehicle type selected
function loadTypeChange() {
    const vehicleType = document.getElementById('type-select').value;

    if (vehicleType != "") {
        loadYear();
    }

    console.log("The id of the vehicle type you chose is", vehicleType);
}

// Populates the make dropdown depending on the year selected
function loadYearChange() {
    const year = document.getElementById('year-select').value;

    if (year != "") {
        loadMake();
        document.getElementById('make-select').disabled = false;
    }

    console.log("The year you chose is", year);
}

// Populates the model dropdown depending on the make selected
function loadMakeChange() {
    const makeId = document.getElementById('make-select').value;

    if (makeId != "") {
        loadModel();
        document.getElementById('model-select').disabled = false;
    }

    console.log("The ID for the make you chose is", makeId);
}

// Activates the search button if a model is selected
function loadModelChange() {
    const modelId = document.getElementById('model-select').value;

    if (modelId != "") {
        document.getElementById('search-button').disabled = false;
    } else {
        document.getElementById('search-button').disabled = true;
    }

    console.log("The model ID you chose is", modelId);
}

async function getBaseVehicleId() {
    const year = document.getElementById("year-select").value;
    const makeId = document.getElementById("make-select").value;
    const modelId = document.getElementById("model-select").value;

    const data = {
        "getAutoCareVehicleResults": {
            "years": [parseInt(year)],       // MUST be arrays
            "makeIds": [parseInt(makeId)],
            "modelIds": [parseInt(modelId)],
            "baseVehicleFacets": {
                "enabled": true
            }
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-Api-Key": apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    console.log("BaseVehicle response:", result);

    const baseVehicle = result.baseVehicleFacets?.counts?.[0];

    if (!baseVehicle) {
        console.error("No base vehicle found");
        return null;
    }

    console.log("Resolved BaseVehicleId:", baseVehicle.baseVehicleId);

    return baseVehicle.baseVehicleId;
}

async function searchParts() {
    console.log("Search button clicked");
    
    const baseVehicleId = await getBaseVehicleId();
    if (!baseVehicleId) {
        console.error("Cannot search parts without BaseVehicleId");
        return;
    }
    
    // Get selected values
    const year = document.getElementById("year-select").value;
    const makeName = document.getElementById("make-select").selectedOptions[0].textContent;
    const modelName = document.getElementById("model-select").selectedOptions[0].textContent;
    const makeId = document.getElementById("make-select").value;
    const modelId = document.getElementById("model-select").value;
    const regionId = document.getElementById("region-select").value;
    
    // Store search data in sessionStorage for the results block to pick up
    const searchData = {
        year, make: makeName, model: modelName,
        makeId, modelId, baseVehicleId, regionId,
        timestamp: Date.now()
    };
    
    sessionStorage.setItem('ymmSearchData', JSON.stringify(searchData));
    
    // Trigger a custom event that the results block can listen for
    window.dispatchEvent(new CustomEvent('ymmSearchTriggered', { 
        detail: searchData 
    }));
    
    // Always look for results block on current page first
    // Check if results block exists on current page
    const resultsBlock = document.getElementById('search-results');
    if (resultsBlock) {
        console.log("Found results block on same page, scrolling to it");
        resultsBlock.scrollIntoView({ behavior: 'smooth' });
    } else {
        // Results block not on this page - check if redirect URL is configured
        const resultsPageUrl = window.searchResultsPageUrl;
        if (resultsPageUrl) {
            console.log("Redirecting to results page:", resultsPageUrl);
            window.location.href = resultsPageUrl;
        } else {
            console.log("No results block found and no redirect URL configured");
            alert('Please add the "Parts Search Results" block to this page or configure a results page URL.');
        }
    }
}

function restoreVehicleSelections() {
    // Get saved vehicle data
    const vehicleData = JSON.parse(sessionStorage.getItem('ymmSearchData'));
    
    // Step 1: Restore Year
    const yearSelect = document.getElementById('year-select');
    if (!yearSelect) return;
    
    yearSelect.value = vehicleData.year;
    if (yearSelect.value !== vehicleData.year) {
        // Year dropdown not ready yet, retry
        setTimeout(() => restoreVehicleSelections(), 500);
        return;
    }
    
    // Step 2: Load and restore Make
    if (!vehicleData.makeId) return;
    
    loadYearChange(); // Fetch makes for this year
    setTimeout(() => {
        const makeSelect = document.getElementById('make-select');
        if (!makeSelect || makeSelect.options.length <= 1) {
            console.warn('Makes not loaded yet');
            return;
        }
        
        makeSelect.value = vehicleData.makeId;
        
        // Step 3: Load and restore Model
        if (!vehicleData.modelId) return;
        
        loadMakeChange(); // Fetch models for this make
        setTimeout(() => {
            const modelSelect = document.getElementById('model-select');
            if (!modelSelect || modelSelect.options.length <= 1) {
                console.warn('Models not loaded yet');
                return;
            }
            
            modelSelect.value = vehicleData.modelId;
        }, 1000);
    }, 1000);
}

restoreVehicleSelections();