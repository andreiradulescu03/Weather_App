const apiKey = 'b832be7f26bc490b84eb600903676e3b';
const weatherApiKey = 'ba9bc5a3851442f389b112705240601 '; // Replace with the key from the chosen weather API
const cityInput = document.getElementById('cityInput');
const forecastButton = document.getElementById('forecastButton');
const forecastContainer = document.getElementById('forecastContainer');
const loadingSpinner = document.getElementById('loadingSpinner');

cityInput.addEventListener('input', debounce(handleInput, 300));

forecastButton.addEventListener('click', async () => {
    const selectedCity = cityInput.value.trim();
    if (selectedCity) {
        try {
            showLoadingSpinner();
            const forecastData = await fetchWeatherForecast(selectedCity);
            renderForecast(forecastData);
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

function clearCityList() {
    cityList.innerHTML = '';
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

function showLoadingSpinner() {
    loadingSpinner.style.display = 'block';
}

function hideLoadingSpinner() {
    loadingSpinner.style.display = 'none';
}
