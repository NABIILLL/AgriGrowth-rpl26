/**
 * Open-Meteo Weather API Service
 * Real-time weather data integration for Agrigrowth
 */

export interface WeatherData {
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  condition: string;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  lastUpdated: string;
}

export interface HourlyWeatherData {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  weather_code: number[];
}

export interface DailyForecast {
  day: string;
  high: number;
  low: number;
  condition: string;
  weatherCode: number;
  precipitation: number;
  windSpeed: number;
}

// WMO Weather Codes mapping
const WMO_CODES: Record<number, string> = {
  0: "Cerah",
  1: "Cerah Berawan",
  2: "Sebagian Berawan",
  3: "Berawan",
  45: "Berkabut",
  48: "Berkabut",
  51: "Gerimis Ringan",
  53: "Gerimis Sedang",
  55: "Gerimis Lebat",
  61: "Hujan Ringan",
  63: "Hujan Sedang",
  65: "Hujan Lebat",
  71: "Salju Ringan",
  73: "Salju Sedang",
  75: "Salju Lebat",
  77: "Butir Salju",
  80: "Hujan Ringan Terputus-putus",
  81: "Hujan Sedang Terputus-putus",
  82: "Hujan Lebat Terputus-putus",
  85: "Salju Ringan Terputus-putus",
  86: "Salju Lebat Terputus-putus",
  95: "Badai Petir",
  96: "Badai Petir dengan Hujan Es Ringan",
  99: "Badai Petir dengan Hujan Es Lebat",
};

/**
 * Get weather code description in Indonesian
 */
export const getWeatherDescription = (code: number): string => {
  return WMO_CODES[code] || "Tidak Diketahui";
};

/**
 * Get day of week name in Indonesian
 */
const getDayName = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[date.getDay()];
};

/**
 * Fetch current weather data from Open-Meteo API
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param locationName - Location display name
 * @returns Weather data or null if error
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current:
        "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,uv_index",
      timezone: "Asia/Jakarta",
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { next: { revalidate: 600 } } // Cache for 10 minutes
    );

    if (!response.ok) throw new Error("Failed to fetch weather data");

    const data = await response.json();
    const current = data.current;

    return {
      location: locationName,
      latitude,
      longitude,
      temperature: Math.round(current.temperature_2m),
      condition: getWeatherDescription(current.weather_code),
      weatherCode: current.weather_code,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: current.wind_direction_10m,
      rainfall: 0, // Will be fetched from hourly data
      uvIndex: Math.round(current.uv_index),
      visibility: Math.round(current.visibility / 1000), // Convert to km
      pressure: current.pressure_msl,
      lastUpdated: new Date().toLocaleString("id-ID"),
    };
  } catch (error) {
    console.error("Error fetching current weather:", error);
    return null;
  }
}

/**
 * Fetch weather forecast data from Open-Meteo API
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Array of daily forecasts or empty array if error
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number
): Promise<DailyForecast[]> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max",
      timezone: "Asia/Jakarta",
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { next: { revalidate: 600 } } // Cache for 10 minutes
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn("Open-Meteo forecast request failed", {
        status: response.status,
        body: errorBody,
      });
      return [];
    }

    const data = await response.json();
    const daily = data.daily;

    if (!daily?.time?.length) {
      console.warn("Open-Meteo forecast response missing daily data", data);
      return [];
    }

    return daily.time.slice(0, 7).map((date: string, index: number) => ({
      day: getDayName(date),
      high: Math.round(daily.temperature_2m_max[index]),
      low: Math.round(daily.temperature_2m_min[index]),
      condition: getWeatherDescription(daily.weather_code[index]),
      weatherCode: daily.weather_code[index],
      precipitation: daily.precipitation_sum[index],
      windSpeed: Math.round(daily.wind_speed_10m_max[index]),
    }));
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return [];
  }
}

/**
 * Fetch hourly weather data from Open-Meteo API
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Hourly weather data or null if error
 */
export async function getHourlyWeather(
  latitude: number,
  longitude: number
): Promise<HourlyWeatherData | null> {
  try {
    const buildParams = (hourlyVariables: string) =>
      new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
        hourly: hourlyVariables,
        timezone: "Asia/Jakarta",
        forecast_hours: "24",
        cell_selection: "nearest",
      });

    const fetchHourly = async (hourlyVariables: string) => {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${buildParams(hourlyVariables)}`,
        { next: { revalidate: 600 } } // Cache for 10 minutes
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn("Open-Meteo hourly request failed", {
          status: response.status,
          body: errorBody,
        });
        return null;
      }

      const data = await response.json();
      return data.hourly as HourlyWeatherData | undefined;
    };

    const primaryHourly = await fetchHourly(
      "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m"
    );

    if (primaryHourly) {
      return primaryHourly;
    }

    const fallbackHourly = await fetchHourly("temperature_2m,weather_code,wind_speed_10m");

    if (!fallbackHourly) {
      return null;
    }

    return {
      ...fallbackHourly,
      relative_humidity_2m: fallbackHourly.relative_humidity_2m ?? fallbackHourly.temperature_2m.map(() => 0),
      precipitation: fallbackHourly.precipitation ?? fallbackHourly.temperature_2m.map(() => 0),
    };
  } catch (error) {
    console.error("Error fetching hourly weather:", error);
    return null;
  }
}

/**
 * Get weather emoji based on weather code
 */
export const getWeatherEmoji = (code: number): string => {
  if (code === 0) return "☀️";
  if (code === 1 || code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 86) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95 && code <= 99) return "⛈️";
  return "🌡️";
};
