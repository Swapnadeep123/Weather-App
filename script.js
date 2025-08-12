const searchInput = document.querySelector('.search-box input');
const searchButton = document.querySelector('.search-box button');
const weatherInfo = document.querySelector('.weather-info');
const locationButton = document.querySelector('.location-button');
const suggestedCities = document.querySelector('.suggested-cities');

searchButton.addEventListener('click', () => {
    const city = searchInput.value;
    if (city) {
        getCoordinates(city);
    }
});

locationButton.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        getWeatherData(latitude, longitude);
    }, error => {
        displayError('Unable to retrieve your location.');
    });
});

suggestedCities.addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
        const city = e.target.textContent;
        getCoordinates(city);
    }
});

async function getCoordinates(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('City not found');
        }
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude } = data.results[0];
            getWeatherData(latitude, longitude, city);
        } else {
            throw new Error('City not found');
        }
    } catch (error) {
        displayError(error.message);
    }
}

async function getWeatherData(latitude, longitude, city) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode,is_day&hourly=temperature_2m,relativehumidity_2m,weathercode,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&forecast_days=7`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        const data = await response.json();
        displayWeatherData(data, city);
    } catch (error) {
        displayError(error.message);
    }
}

function displayWeatherData(data, city) {
    const { current, hourly, daily } = data;
    const cityName = city || 'Current Location';
    const iconClass = getWeatherIconClass(current.weathercode, current.is_day);
    const iconColor = getWeatherIconColor(current.weathercode);

    weatherInfo.innerHTML = `
        <h2>${cityName}</h2>
        <p>${new Date().toDateString()}</p>
        <div class="weather-details">
            <div class="temp"><i class="wi ${iconClass}" style="color: ${iconColor}"></i> ${Math.round(current.temperature_2m)}°C</div>
            <div class="wind">Wind: ${current.windspeed_10m} km/h</div>
            <div class="humidity">Humidity: ${current.relativehumidity_2m}%</div>
        </div>
        <div class="hourly-forecast">
            <h3>Hourly Forecast</h3>
            <div class="hourly-items"></div>
        </div>
        <div class="daily-forecast"></div>
    `;

    document.querySelector('.suggested-cities').classList.add('hide');

    displayHourlyForecast(hourly);
    displayDailyForecast(daily);
}

function displayHourlyForecast(hourly) {
    const hourlyForecastContainer = document.querySelector('.hourly-items');
    hourlyForecastContainer.innerHTML = '';
    const now = new Date();
    const currentHour = now.getHours();

    for (let i = currentHour; i < currentHour + 24 && i < hourly.time.length; i++) {
        const time = new Date(hourly.time[i]);
        const hour = time.getHours();
        const temp = Math.round(hourly.temperature_2m[i]);
        const humidity = hourly.relativehumidity_2m[i];
        const weatherCode = hourly.weathercode[i];
        const iconClass = getWeatherIconClass(weatherCode);
        const iconColor = getWeatherIconColor(weatherCode);
        const rainPercentage = hourly.precipitation_probability[i];

        hourlyForecastContainer.innerHTML += `
            <div class="hourly-item">
                <div class="hourly-time">${hour}:00</div>
                <div class="hourly-icon"><i class="wi ${iconClass}" style="color: ${iconColor}"></i></div>
                <div class="hourly-temp">${temp}°C</div>
                <div class="hourly-humidity">Humidity: ${humidity}%</div>
                <div class="hourly-rain">Rain: ${rainPercentage}%</div>
            </div>
        `;
    }
}

function displayDailyForecast(daily) {
    const dailyForecastContainer = document.querySelector('.daily-forecast');
    dailyForecastContainer.innerHTML = '<h3>7-Day Forecast</h3>';

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const weatherCode = daily.weathercode[i];
        const iconClass = getWeatherIconClass(weatherCode);
        const iconColor = getWeatherIconColor(weatherCode);
        const precipitation = daily.precipitation_sum[i];
        const windSpeed = daily.windspeed_10m_max[i];

        dailyForecastContainer.innerHTML += `
            <div class="daily-item">
                <div class="daily-day">${day}</div>
                <div class="daily-icon"><i class="wi ${iconClass}" style="color: ${iconColor}"></i></div>
                <div class="daily-temp">${minTemp}°C / ${maxTemp}°C</div>
                <div class="daily-precipitation">Rain: ${precipitation}mm</div>
                <div class="daily-wind">Wind: ${windSpeed} km/h</div>
            </div>
        `;
    }
}

function getWeatherIconClass(weatherCode, isDay = true) {
    switch (weatherCode) {
        case 0: return isDay ? 'wi-day-sunny' : 'wi-night-clear';
        case 1: return isDay ? 'wi-day-cloudy' : 'wi-night-alt-cloudy';
        case 2: return 'wi-cloudy';
        case 3: return 'wi-cloudy-windy';
        case 45: case 48: return 'wi-fog';
        case 51: case 53: case 55: return isDay ? 'wi-day-showers' : 'wi-night-alt-showers';
        case 56: case 57: return isDay ? 'wi-day-sleet' : 'wi-night-alt-sleet';
        case 61: case 63: case 65: return isDay ? 'wi-day-rain' : 'wi-night-alt-rain';
        case 66: case 67: return isDay ? 'wi-day-rain-mix' : 'wi-night-alt-rain-mix';
        case 71: case 73: case 75: return isDay ? 'wi-day-snow' : 'wi-night-alt-snow';
        case 77: return isDay ? 'wi-day-snow-wind' : 'wi-night-alt-snow-wind';
        case 80: case 81: case 82: return isDay ? 'wi-day-showers' : 'wi-night-alt-showers';
        case 85: case 86: return isDay ? 'wi-day-snow' : 'wi-night-alt-snow';
        case 95: return isDay ? 'wi-day-thunderstorm' : 'wi-night-alt-thunderstorm';
        case 96: case 99: return isDay ? 'wi-day-storm-showers' : 'wi-night-alt-storm-showers';
        default: return 'wi-na';
    }
}

function getWeatherIconColor(weatherCode) {
    switch (weatherCode) {
        case 0: return '#FFD700'; // Sunny - Gold
        case 1: case 2: case 3: return '#808080'; // Cloudy - Gray
        case 45: case 48: return '#A9A9A9'; // Fog - DarkGray
        case 51: case 53: case 55: return '#1E90FF'; // Showers - DodgerBlue
        case 56: case 57: return '#ADD8E6'; // Sleet - LightBlue
        case 61: case 63: case 65: return '#4682B4'; // Rain - SteelBlue
        case 66: case 67: return '#B0C4DE'; // Freezing Rain - LightSteelBlue
        case 71: case 73: case 75: return '#FFFFFF'; // Snow - White
        case 77: return '#FFFFFF'; // Snow Grains - White
        case 80: case 81: case 82: return '#1E90FF'; // Showers - DodgerBlue
        case 85: case 86: return '#FFFFFF'; // Snow Showers - White
        case 95: case 96: case 99: return '#FF0000'; // Thunderstorm - Red
        default: return '#FFFFFF'; // Default - White
    }
}

function displayError(message) {
    weatherInfo.innerHTML = `<p class="error">${message}</p>`;
}
