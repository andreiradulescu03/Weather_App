const apiKey = 'b832be7f26bc490b84eb600903676e3b';
const weatherApiKey = 'ba9bc5a3851442f389b112705240601 '; // Replace with the key from the chosen weather API
const pexelsApiKey = 'q9VhFZ6DMbDB6lVXXte8pECY9nrrCtsRPnfGyH4LrIFGLEErnTLqL1yp';
const cityInput = document.getElementById('cityInput');
const cityList = document.getElementById('cityList');
const weatherCard = document.getElementById('weatherCard');
const loadingSpinner = document.getElementById('loadingSpinner');
const forecastButton = document.getElementById('forecastButton');
const forecastContainer = document.getElementById('forecastContainer');
const backgroundImageContainer = document.getElementById('backgroundImageContainer');
const favoriteCitiesList = document.getElementById('favoriteCitiesList');
const addToFavoritesButton = document.getElementById('addToFavoritesButton');


cityInput.addEventListener('input', debounce(handleInput, 300));

cityList.addEventListener('click', (event) => {
    const selectedCity = event.target.textContent;
    if (selectedCity) {
        showLoadingSpinner();
        cityInput.value = selectedCity;
        clearCityList();
        updateWeatherCard(selectedCity)
            .then(() => hideLoadingSpinner())
            .catch(error => {
                console.error('Error updating weather card:', error);
                hideLoadingSpinner();
            });
        setCityBackground(selectedCity); // Set background image when city is selected
        addToFavorites(selectedCity); // Add city to favorites
    }
});

cityInput.addEventListener('blur', async () => {
    const enteredCity = cityInput.value.trim();
    if (enteredCity) {
        try {
            showLoadingSpinner();
            await updateWeatherCard(enteredCity);
            setCityBackground(enteredCity); // Set background image when input field loses focus
            addToFavorites(enteredCity); // Add city to favorites
        } catch (error) {
            console.error('Error updating weather card:', error);
        } finally {
            hideLoadingSpinner();
        }
    }
});

forecastButton.addEventListener('click', async () => {
    const selectedCity = cityInput.value.trim();
    if (selectedCity) {
        try {
            showLoadingSpinner();
            const forecastData = await fetchWeatherForecast(selectedCity);
            renderForecast(forecastData);
            await setCityBackground(selectedCity, forecastData[0].day.condition.text);
        } catch (error) {
            console.error('Error fetching forecast:', error);
        } finally {
            hideLoadingSpinner();
        }
    }
});

function debounce(func, delay) {
    let timeoutId;
    return function () {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, arguments);
        }, delay);
    };
}

async function handleInput() {
    const inputValue = cityInput.value.trim();

    if (inputValue.length >= 3) {
        const cities = await getCities(inputValue);
        displayCities(cities);
    } else {
        clearCityList();
    }
}

async function getCities(query) {
    const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${apiKey}`);
    const data = await response.json();
    return data.features;
}

function displayCities(cities) {
    clearCityList();

    cities.forEach(city => {
        const cityItem = document.createElement('div');
        cityItem.classList.add('city-item');
        cityItem.textContent = city.properties.formatted;

        cityList.appendChild(cityItem);
    });
}

function clearCityList() {
    cityList.innerHTML = '';
}

function showLoadingSpinner() {
    loadingSpinner.style.display = 'block';
}

function hideLoadingSpinner() {
    loadingSpinner.style.display = 'none';
}

async function updateWeatherCard(cityName) {
    const weatherResponse = await fetch(`https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${cityName}`);
    const weatherData = await weatherResponse.json();
    renderWeatherCard(weatherData);
}

function renderWeatherCard(data) {
    const { temp_c, condition, humidity } = data.current;
    const weatherHTML = `
        <h2>${cityInput.value}</h2>
        <p>Temperature: ${temp_c}°C</p>
        <p>Condition: ${condition.text}</p>
        <p>Humidity: ${humidity}%</p>
    `;
    weatherCard.innerHTML = weatherHTML;
}

async function fetchWeatherForecast(cityName) {
    const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${cityName}&days=5`);
    const data = await response.json();
    return data.forecast.forecastday;
}

function renderForecast(forecastData) {
    const forecastHTML = forecastData.map(day => `
        <div class="forecast-day">
            <h3>${day.date}</h3>
            <p>Max Temp: ${day.day.maxtemp_c}°C</p>
            <p>Min Temp: ${day.day.mintemp_c}°C</p>
            <p>Condition: ${day.day.condition.text}</p>
        </div>
    `).join('');

    forecastContainer.innerHTML = forecastHTML;
}

async function setCityBackground(cityName) {
    try {
        const imageUrl = await fetchCityImage(cityName);
        backgroundImageContainer.style.backgroundImage = `url(${imageUrl})`;
    } catch (error) {
        console.error('Error fetching city image:', error);
    }
}

async function fetchCityImage(cityName) {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${cityName}`, {
        headers: {
            'Authorization': pexelsApiKey,
        },
    });
    const data = await response.json();

    // Choose the first photo as the background image
    const imageUrl = data.photos[0].src.large;

    return imageUrl;
}

function addToFavorites(cityName) {
    const favorites = getFavorites();
    if (!favorites.includes(cityName)) {
        favorites.push(cityName);
        setFavorites(favorites);
        renderFavoriteCities();
    }
}

function getFavorites() {
    const favoritesString = localStorage.getItem('favorites');
    return favoritesString ? JSON.parse(favoritesString) : [];
}

function setFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}



function renderFavoriteCities() {
    const favoriteCitiesList = document.getElementById('favoriteCitiesList');
    const favorites = getFavorites();

    // Clear existing list
    favoriteCitiesList.innerHTML = '';

    // Render the list of favorite cities
    favorites.forEach(city => {
        const listItem = document.createElement('div');
        listItem.classList.add('favorite-city');

        const heartButton = document.createElement('button');
        heartButton.classList.add('heart-button');
        heartButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the event from propagating to the parent div
            removeFromFavorites(city);
            renderFavoriteCities();
        });

        const cityNameSpan = document.createElement('span');
        cityNameSpan.textContent = city;

        listItem.appendChild(heartButton);
        listItem.appendChild(cityNameSpan);

        listItem.addEventListener('click', () => {
            showLoadingSpinner();
            cityInput.value = city;
            clearCityList();
            updateWeatherCard(city)
                .then(() => hideLoadingSpinner())
                .catch(error => {
                    console.error('Error updating weather card:', error);
                    hideLoadingSpinner();
                });
            setCityBackground(city); // Set background image for the selected favorite city
            fetchAndRenderForecast(city);
        });

        favoriteCitiesList.appendChild(listItem);
    });
}

addToFavoritesButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent the event from propagating to the parent div
    const enteredCity = cityInput.value.trim();
    if (enteredCity) {
        addToFavorites(enteredCity);
        renderFavoriteCities();
    }
});

function removeFromFavorites(cityName) {
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(city => city !== cityName);
    setFavorites(updatedFavorites);
}

favoriteCitiesList.addEventListener('click', (event) => {
    const selectedCity = event.target.textContent;
    if (selectedCity) {
        showLoadingSpinner();
        cityInput.value = selectedCity;
        clearCityList();
        updateWeatherCard(selectedCity)
            .then(() => hideLoadingSpinner())
            .catch(error => {
                console.error('Error updating weather card:', error);
                hideLoadingSpinner();
            });
        setCityBackground(selectedCity); // Set background image for the selected favorite city
        fetchAndRenderForecast(selectedCity);
    }
});

async function fetchAndRenderForecast(cityName) {
    try {
        const forecastData = await fetchWeatherForecast(cityName);
        renderForecast(forecastData);
    } catch (error) {
        console.error('Error fetching forecast:', error);
    } finally {
        hideLoadingSpinner();
    }
}