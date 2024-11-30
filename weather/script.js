const WMO_CODES = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm'
};

const WEATHER_ICONS = {
    'Clear sky': '☀️',
    'Mainly clear': '🌤️',
    'Partly cloudy': '⛅',
    'Overcast': '☁️',
    'Foggy': '🌫️',
    'Depositing rime fog': '🌫️',
    'Light drizzle': '🌦️',
    'Moderate drizzle': '🌧️',
    'Dense drizzle': '🌧️',
    'Slight rain': '🌦️',
    'Moderate rain': '🌧️',
    'Heavy rain': '🌧️',
    'Slight snow': '🌨️',
    'Moderate snow': '🌨️',
    'Heavy snow': '🌨️',
    'Snow grains': '🌨️',
    'Slight rain showers': '🌦️',
    'Moderate rain showers': '🌧️',
    'Violent rain showers': '⛈️',
    'Slight snow showers': '🌨️',
    'Heavy snow showers': '🌨️',
    'Thunderstorm': '⛈️'
};

async function getLocationFromZip(zipCode) {
    try {
        const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
        const data = await response.json();
        const place = data.places[0];
        return {
            city: `${place['place name']}, ${place['state abbreviation']}`,
            lat: parseFloat(place.latitude),
            lon: parseFloat(place.longitude)
        };
    } catch (error) {
        console.error('Error getting location from ZIP:', error);
        return null;
    }
}

async function getLocationFromIP() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
            city: data.city,
            lat: data.latitude,
            lon: data.longitude
        };
    } catch (error) {
        console.error('Error getting location from IP:', error);
        return null;
    }
}

async function getWeather(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit&forecast_days=1`
        );
        return await response.json();
    } catch (error) {
        console.error('Error getting weather:', error);
        return null;
    }
}

function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('datetime').textContent = now.toLocaleDateString('en-US', options);
}

function fahrenheitToCelsius(f) {
    return ((f - 32) * 5/9).toFixed(1);
}

function updateWeather(weatherData) {
    const currentHour = new Date().getHours();
    const temps = weatherData.hourly.temperature_2m;
    const codes = weatherData.hourly.weathercode;
    
    const currentTemp = temps[currentHour];
    const currentCode = codes[currentHour];
    const weatherType = WMO_CODES[currentCode];
    
    document.getElementById('weather-type').textContent = weatherType;
    document.getElementById('temp-f').textContent = `${Math.round(currentTemp)}°F`;
    document.getElementById('temp-c').textContent = `(${fahrenheitToCelsius(currentTemp)}°C)`;
    document.getElementById('weather-icon').textContent = WEATHER_ICONS[weatherType];

    const forecastDiv = document.getElementById('forecast');
    forecastDiv.innerHTML = '';

    [0, 3, 6, 9].forEach((offset) => {
        const forecastHour = (currentHour + offset) % 24;
        const temp = temps[forecastHour];
        const code = codes[forecastHour];
        const type = WMO_CODES[code];
        
        const hour = forecastHour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;

        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-time">${hour12}${ampm}</div>
            <div class="forecast-icon">${WEATHER_ICONS[type]}</div>
            <div class="forecast-temp">${Math.round(temp)}°F</div>
        `;
        forecastDiv.appendChild(forecastItem);
    });
}

async function initialize() {
    const urlParams = new URLSearchParams(window.location.search);
    const zipCode = urlParams.get('zip');
    const brandName = urlParams.get('brand') || '';
    
    document.getElementById('brand-name').textContent = brandName;

    let location;
    if (zipCode) {
        location = await getLocationFromZip(zipCode);
    }
    
    if (!location) {
        location = await getLocationFromIP();
    }

    if (location) {
        document.getElementById('location').textContent = location.city;
        const weatherData = await getWeather(location.lat, location.lon);
        if (weatherData) {
            updateWeather(weatherData);
            setInterval(async () => {
                const newWeatherData = await getWeather(location.lat, location.lon);
                if (newWeatherData) updateWeather(newWeatherData);
            }, 30 * 60 * 1000);
        }
    }

    updateDateTime();
    setInterval(updateDateTime, 60 * 1000);
}

initialize();