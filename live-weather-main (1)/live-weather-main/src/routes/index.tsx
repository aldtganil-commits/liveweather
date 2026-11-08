import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Weather — Chanakya University" },
      {
        name: "description",
        content:
          "Live weather report for Chanakya University Global Campus, Devanahalli, Bengaluru.",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='sun' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ffd15c'/%3E%3Cstop offset='100%25' stop-color='%23ff6b35'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='44' cy='42' r='24' fill='url(%23sun)'/%3E%3Cpath d='M28 72h46a16 16 0 0 0 0-32 15 15 0 0 0-14-10 22 22 0 0 0-22 18A14 14 0 0 0 28 72z' fill='%23ffffff' opacity='0.96'/%3E%3C/svg%3E",
      },
    ],
  }),
  component: WeatherIndex,
});


// Chanakya University Global Campus, Devanahalli, Bengaluru
const CAMPUS = {
  lat: 13.2458,
  lon: 77.7126,
  name: "Chanakya University Global Campus",
  area: "Devanahalli, Bengaluru 562165",
};

interface WeatherState {
  temp: number;
  feels: number;
  code: number;
  isDay: boolean;
  wind: number;
  humidity: number;
  pressure: number;
  uv: number;
  visibility: number;
  precipProb: number;
  desc: string;
  theme: "sun" | "rain" | "storm" | "snow" | "fog" | "wind" | "night" | "cloud";
}

function WeatherIndex() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState<string>("");

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live weather
  useEffect(() => {
    async function loadWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${CAMPUS.lat}&longitude=${CAMPUS.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m&hourly=uv_index,visibility,precipitation_probability&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather service unreachable");
        const data = await res.json();
        const cur = data.current;
        const code = cur.weather_code;
        const isDay = cur.is_day === 1;

        let theme: WeatherState["theme"] = "sun";
        let desc = "Clear Sky";

        if (code >= 95) {
          theme = "storm";
          desc = "Thunderstorm";
        } else if (code >= 71) {
          theme = "snow";
          desc = "Snowing";
        } else if (code >= 51 || cur.precipitation > 0) {
          theme = "rain";
          desc = "Rain Showers";
        } else if (code === 45 || code === 48) {
          theme = "fog";
          desc = "Foggy";
        } else if (cur.wind_speed_10m > 25) {
          theme = "wind";
          desc = "Windy";
        } else if (!isDay) {
          theme = "night";
          desc = "Clear Night";
        } else if (code >= 1 && code <= 3) {
          theme = "cloud";
          desc = code === 3 ? "Overcast" : "Partly Cloudy";
        }

        setWeather({
          temp: Math.round(cur.temperature_2m),
          feels: Math.round(cur.apparent_temperature),
          code,
          isDay,
          wind: Math.round(cur.wind_speed_10m),
          humidity: Math.round(cur.relative_humidity_2m),
          pressure: Math.round(cur.surface_pressure),
          uv: Math.round(data.hourly?.uv_index?.[0] ?? 5),
          visibility: Math.round((data.hourly?.visibility?.[0] ?? 10000) / 1000),
          precipProb: Math.round(data.hourly?.precipitation_probability?.[0] ?? 0),
          desc,
          theme,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load weather");
      }
    }

    loadWeather();
    const refresh = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(refresh);
  }, []);

  // Background gradient per theme/temperature
  const getGradient = () => {
    if (!weather) return "from-slate-900 via-indigo-950 to-slate-900";
    if (weather.theme === "night") return "from-[#080d1a] via-[#101a33] to-[#1c2c52]";
    if (weather.theme === "rain" || weather.theme === "storm")
      return "from-[#1a2332] via-[#2a384c] to-[#3f526b]";
    if (weather.theme === "snow" || weather.theme === "fog")
      return "from-[#4c5c70] via-[#75889e] to-[#a3b3c4]";
    if (weather.temp >= 32) return "from-[#d45226] via-[#f28e2b] to-[#fcd05b]";
    if (weather.temp >= 26) return "from-[#2b6cb0] via-[#4299e1] to-[#f6ad55]";
    return "from-[#2b5876] via-[#4e4376] to-[#6d5b97]";
  };

  return (
    <div
      className={`fixed inset-0 overflow-hidden text-white bg-gradient-to-br ${getGradient()} transition-colors duration-1000 flex flex-col justify-between p-6 md:p-10 select-none`}
    >
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-semibold tracking-wider text-sm md:text-base">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE WEATHER
        </div>

        <div className="text-right">
          <div className="text-xl md:text-2xl font-light tracking-wide">{timeStr}</div>
          <div className="text-xs text-white/70">Local Time (IST)</div>
        </div>
      </header>

      {/* Main Report */}
      <main className="relative z-10 my-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto w-full">
        <div>
          <div className="text-xs font-mono tracking-widest text-white/80 uppercase">
            {CAMPUS.area}
          </div>
          <h1 className="text-6xl md:text-8xl font-light tracking-tight my-2">
            {weather ? `${weather.temp}°` : "--°"}
          </h1>
          <h2 className="text-2xl md:text-3xl font-light text-white/90">
            {weather?.desc || (error ? "Report Unavailable" : "Reading the sky…")}
          </h2>
          <p className="text-sm md:text-base text-white/75 mt-3 max-w-md">
            {CAMPUS.name}. Feels like {weather ? `${weather.feels}°C` : "--"} with{" "}
            {weather ? `${weather.humidity}%` : "--"} humidity.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
            <span className="text-xs text-white/70 uppercase">Wind</span>
            <div className="text-xl md:text-2xl font-light mt-1">
              {weather ? `${weather.wind} km/h` : "--"}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
            <span className="text-xs text-white/70 uppercase">Humidity</span>
            <div className="text-xl md:text-2xl font-light mt-1">
              {weather ? `${weather.humidity}%` : "--"}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
            <span className="text-xs text-white/70 uppercase">Rain Chance</span>
            <div className="text-xl md:text-2xl font-light mt-1">
              {weather ? `${weather.precipProb}%` : "--"}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
            <span className="text-xs text-white/70 uppercase">UV Index</span>
            <div className="text-xl md:text-2xl font-light mt-1">
              {weather ? `${weather.uv} of 11` : "--"}
            </div>
          </div>
        </div>
      </main>

      {/* Footer status */}
      <footer className="relative z-10 flex items-center justify-between text-xs text-white/60">
        <span>Chanakya University • Devanahalli Campus</span>
        <span>Auto-updates every 10 min</span>
      </footer>
    </div>
  );
}
