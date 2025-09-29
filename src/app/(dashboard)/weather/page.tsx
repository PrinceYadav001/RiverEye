"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Droplets, Thermometer } from "lucide-react";

// --- Chart.js Imports ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

interface WeatherData {
  temperature: number;
  humidity: number;
  wind_speed: number;
  description: string;
}

const WeatherPage = () => {
  const [city, setCity] = useState("Patna");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecastTemps, setForecastTemps] = useState<number[]>([]);
  const [forecastRain, setForecastRain] = useState<number[]>([]);
  const [forecastHumidity, setForecastHumidity] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;

  useEffect(() => {
    if (!city || !apiKey) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Step 1: Get coordinates via Geocoding ---
        const geoResp = await fetch(
          `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
            city
          )},IN&limit=1&appid=${apiKey}`
        );
        const geoData = await geoResp.json();
        if (!geoData || geoData.length === 0) {
          throw new Error(`City "${city}" not found in OpenWeather database`);
        }
        const { lat, lon } = geoData[0];

        // --- Step 2: Current Weather ---
        const resp = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        if (!resp.ok) throw new Error(`Error ${resp.status}`);
        const data = await resp.json();
        setWeather({
          temperature: data.main.temp,
          humidity: data.main.humidity,
          wind_speed: data.wind.speed,
          description: data.weather[0].description,
        });

        // --- Step 3: Forecast (next 24h, 3h interval) ---
        const forecastResp = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );
        if (!forecastResp.ok) {
          throw new Error(`Forecast error: ${forecastResp.status}`);
        }
        const forecastData = await forecastResp.json();

        const temps: number[] = [];
        const rain: number[] = [];
        const humidity: number[] = [];
        const times: string[] = [];

        forecastData.list.slice(0, 8).forEach((entry: any) => {
          temps.push(entry.main.temp);
          humidity.push(entry.main.humidity);
          rain.push(entry.rain ? entry.rain["3h"] || 0 : 0);

          const date = new Date(entry.dt_txt);
          const hour = date.getHours();
          const label =
            hour === 0
              ? "12 AM"
              : hour < 12
              ? `${hour} AM`
              : hour === 12
              ? "12 PM"
              : `${hour - 12} PM`;
          times.push(label);
        });

        setForecastTemps(temps);
        setForecastRain(rain);
        setForecastHumidity(humidity);
        setLabels(times);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city, apiKey]);

  // --- Chart Config ---
  const chartData = {
    labels,
    datasets: [
      {
        type: "line",
        label: "Temperature (°C)",
        data: forecastTemps,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        yAxisID: "y",
        tension: 0.3,
      },
      {
        type: "bar",
        label: "Rainfall (mm/3h)",
        data: forecastRain,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        yAxisID: "y1",
      },
      {
        type: "line",
        label: "Humidity (%)",
        data: forecastHumidity,
        borderColor: "rgb(255, 193, 7)",
        backgroundColor: "rgba(255, 193, 7, 0.5)",
        yAxisID: "y1",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      y: {
        type: "linear" as const,
        position: "left",
        title: { display: true, text: "Temperature (°C)" },
        suggestedMin: 0,
        suggestedMax: 45,
      },
      y1: {
        type: "linear" as const,
        position: "right",
        title: { display: true, text: "Rainfall (mm) / Humidity (%)" },
        grid: { drawOnChartArea: false },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: { position: "top" as const },
      title: {
        display: true,
        text: `Flood Monitoring Weather Forecast for ${city}`,
        font: { size: 18 },
      },
      annotation: {
        annotations: {
          heatLine: {
            type: "line",
            yMin: 40,
            yMax: 40,
            borderColor: "rgb(220,53,69)",
            borderWidth: 2,
            borderDash: [10, 5],
            label: {
              content: "Heat Alert (40°C)",
              enabled: true,
              backgroundColor: "rgba(220,53,69,0.8)",
            },
          },
          rainLine: {
            type: "line",
            yScaleID: "y1",
            yMin: 30,
            yMax: 30,
            borderColor: "rgb(0,123,255)",
            borderWidth: 2,
            borderDash: [10, 5],
            label: {
              content: "Heavy Rain (30mm/3h)",
              enabled: true,
              backgroundColor: "rgba(0,123,255,0.8)",
            },
          },
        },
      },
    },
  };

  return (
    <section className="w-full px-3 mt-4 flex flex-col gap-4">
      {/* --- City Input --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Enter City (India)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            className="border px-2 py-1 rounded w-full"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Patna"
          />
        </CardContent>
      </Card>

      {/* --- Metric Cards --- */}
      <div className="grid w-full gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-medium">
              <span>Temperature</span>
              <Thermometer className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weather ? `${weather.temperature} °C` : "--"}
            </div>
            <p className="text-sm text-muted-foreground">
              {weather?.description || "Loading..."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-medium">
              <span>Humidity</span>
              <Droplets className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weather ? `${weather.humidity} %` : "--"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-medium">
              <span>Wind Speed</span>
              <Wind className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weather ? `${weather.wind_speed} m/s` : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Forecast Chart --- */}
      <Card>
        <CardContent className="pt-6">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!loading && !error && forecastTemps.length > 0 && (
            <div style={{ height: "450px" }}>
              <Line options={chartOptions} data={chartData} />
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};

export default WeatherPage;
