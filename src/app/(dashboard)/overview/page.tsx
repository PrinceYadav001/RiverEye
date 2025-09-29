"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wind,
  Waves,
  CloudRain,
  ShieldAlert,
  Wifi,
  Activity,
  Siren,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { Chart } from "react-chartjs-2";
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
  ChartOptions,
} from "chart.js";
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

// ---- Types ----
type Metrics = {
  hb100Speed: string;
  waterFlowRate: string;
  waterLevel: string;
};

type RainPoint = {
  time: string;
  rain: number;
};

type Esp32Payload = {
  time: string;
  water_level_cm?: number;
  water_level_m?: number;
  flow_rate_cm_per_min?: number;
  flow_rate_m_per_s?: number;
  hb100_analog?: number;
  warning_level_m?: number;
  critical_level_m?: number;
  tamper?: boolean;
  warning?: boolean;
  critical?: boolean;
  system?: {
    wifi?: boolean;
    rtc_ok?: boolean;
    sd_ok?: boolean;
    mpu_ok?: boolean;
  };
};

// ---- Constants ----
const MAX_HISTORY = 48;
const ESP32_URL = process.env.NEXT_PUBLIC_ESP32_URL || "/api/esp32";
const OWM_CITY = "Pune";
const OWM_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_KEY || "";
const DEAD_BAND_FLOW = 0.00005;
const ALERT_PHONE = process.env.NEXT_PUBLIC_ALERT_PHONE || "9905308845";

// ---- Helpers ----
function formatFlow(raw?: number) {
  if (!raw || Number.isNaN(raw)) return "0.0000 m/s (stable)";
  const n = Math.abs(raw) < DEAD_BAND_FLOW ? 0 : raw;
  const dir = n > 0 ? "Inflow" : n < 0 ? "Outflow" : "Stable";
  return `${Math.abs(n).toFixed(4)} m/s (${dir})`;
}

function roundTo3Hours(ts: string) {
  const d = new Date(ts.replace(" ", "T"));
  if (isNaN(d.getTime())) return ts;
  d.setMinutes(0, 0, 0);
  const h = d.getHours();
  d.setHours(h - (h % 3));
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ---- Dashboard ----
const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    hb100Speed: "0.00 m/s",
    waterFlowRate: "0.0000 m/s (stable)",
    waterLevel: "0.000 m",
  });

  // Log data
  const [logs, setLogs] = useState<Esp32Payload[]>([]);

  // Fetch latest 10 logs every second
  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/log", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch logs");
        const json = await res.json();
        setLogs(json);
      } catch (e) {
        console.error("Log fetch error:", e);
      }
    }

    fetchLogs(); // run once immediately
    const id = setInterval(fetchLogs, 1000); // poll every 1s
    return () => clearInterval(id);
  }, []);

  const [waterHistory, setWaterHistory] = useState<
    Array<{ time: string; value: number }>
  >([]);
  const [rainHistory, setRainHistory] = useState<RainPoint[]>([]);
  const [rainMetric, setRainMetric] = useState<string>("Loading...");
  const [systemStatus, setSystemStatus] = useState<any>({});
  const [alerts, setAlerts] = useState({
    tamper: false,
    warning: false,
    critical: false,
  });
  const [waterTrend, setWaterTrend] = useState<"rising" | "falling" | "stable">(
    "stable"
  );

  const [warningLevel, setWarningLevel] = useState<number>(0.04);
  const [dangerLevel, setDangerLevel] = useState<number>(0.05);

  const [smsSent, setSmsSent] = useState(false);

  // ---- Fetch ESP32 ----
  useEffect(() => {
    let mounted = true;

    async function fetchEsp32() {
      try {
        const res = await fetch(ESP32_URL, { cache: "no-store" });
        if (!res.ok) throw new Error("ESP32 fetch failed");
        const data: Esp32Payload = await res.json();

        const water_m =
          data.water_level_m ??
          (data.water_level_cm !== undefined ? data.water_level_cm / 100 : 0);

        const flow_m_s =
          data.flow_rate_m_per_s ??
          (data.flow_rate_cm_per_min
            ? data.flow_rate_cm_per_min * 0.00016667
            : 0);

        const hb100Speed_m_s = data.hb100_analog
          ? (data.hb100_analog / 4095) * 10
          : 0;

        if (!mounted) return;

        if (data.warning_level_m) setWarningLevel(data.warning_level_m);
        if (data.critical_level_m) setDangerLevel(data.critical_level_m);

        setMetrics({
          hb100Speed: `${hb100Speed_m_s.toFixed(2)} m/s`,
          waterFlowRate: formatFlow(flow_m_s),
          waterLevel: `${water_m.toFixed(3)} m`,
        });

        setSystemStatus(data.system || {});
        setAlerts({
          tamper: !!data.tamper,
          warning: !!data.warning,
          critical: !!data.critical,
        });

        // 🚨 Log raw payload
        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        // 🚨 SMS trigger
        if (water_m >= warningLevel && !smsSent) {
          setSmsSent(true);
          await fetch("/api/send-sms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: ALERT_PHONE,
              message: `Flood Alert: Water level ${water_m.toFixed(3)} m at ${
                data.time
              }`,
            }),
          });
          console.log("SMS Alert Sent", ALERT_PHONE);
        }

        if (water_m < warningLevel && smsSent) {
          setSmsSent(false);
        }

        // Update water history
        setWaterHistory((prev) => {
          const next = [
            ...prev,
            {
              time: roundTo3Hours(data.time || new Date().toISOString()),
              value: water_m,
            },
          ];
          if (next.length > MAX_HISTORY)
            next.splice(0, next.length - MAX_HISTORY);

          if (next.length >= 2) {
            const [a, b] = [
              next[next.length - 2].value,
              next[next.length - 1].value,
            ];
            setWaterTrend(b > a ? "rising" : b < a ? "falling" : "stable");
          }
          return next;
        });
      } catch (e) {
        console.error("ESP32 fetch error:", e);
      }
    }

    fetchEsp32();
    const id = setInterval(fetchEsp32, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [warningLevel, smsSent]);

  // ---- Fetch Weather ----
  useEffect(() => {
    let mounted = true;
    async function fetchWeather() {
      if (!OWM_KEY) {
        if (mounted) setRainMetric("No API key");
        return;
      }
      try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          OWM_CITY
        )}&appid=${OWM_KEY}&units=metric`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("OpenWeather fetch failed");
        const json = await res.json();
        if (!mounted) return;

        const parsed: RainPoint[] = (json.list || []).map((item: any) => ({
          time: roundTo3Hours(item.dt_txt),
          rain: item.rain?.["3h"] || 0,
        }));

        setRainHistory(parsed);
        const last = parsed.at(-1)?.rain || 0;
        setRainMetric(last > 0 ? `${last} mm (last 3h)` : "No rain");
      } catch (e) {
        console.error("Weather fetch error:", e);
        if (mounted) setRainMetric("Weather fetch failed");
      }
    }

    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // ---- Chart Data ----
  const chartData = useMemo(() => {
    const labels = waterHistory.map((w) => w.time);
    const waterValues = waterHistory.map((w) => w.value);
    const rainLookup = new Map(rainHistory.map((r) => [r.time, r.rain]));
    const rainValues = labels.map((t) => rainLookup.get(t) ?? 0);

    return {
      labels,
      datasets: [
        {
          type: "line" as const,
          label: "Water Level (m)",
          data: waterValues,
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          yAxisID: "y",
          tension: 0.3,
        },
        {
          type: "bar" as const,
          label: "Rainfall (mm/3h)",
          data: rainValues,
          backgroundColor: "rgba(0, 123, 255, 0.3)",
          yAxisID: "y1",
        },
      ],
    };
  }, [waterHistory, rainHistory]);

  // ---- Chart Options ----
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      x: { title: { display: true, text: "Time (3h buckets)" } },
      y: {
        type: "linear",
        position: "left",
        title: { display: true, text: "Water Level (m)" },
        suggestedMin: 0,
        suggestedMax: Math.max(
          0.1,
          Math.max(...waterHistory.map((w) => w.value), dangerLevel) * 1.4
        ),
      },
      y1: {
        type: "linear",
        position: "right",
        title: { display: true, text: "Rainfall (mm)" },
        grid: { drawOnChartArea: false },
        suggestedMin: 0,
        suggestedMax: Math.max(
          10,
          Math.max(...rainHistory.map((r) => r.rain)) * 2
        ),
      },
    },
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Flood Monitoring Dashboard" },
      annotation: {
        annotations: {
          warningLine: {
            type: "line",
            yMin: warningLevel,
            yMax: warningLevel,
            borderColor: "rgb(255, 193, 7)",
            borderWidth: 2,
            borderDash: [10, 5],
            label: {
              content: `Warning ${warningLevel.toFixed(2)} m`,
              backgroundColor: "rgba(255,193,7,0.8)",
              color: "black",
            },
          },
          dangerLine: {
            type: "line",
            yMin: dangerLevel,
            yMax: dangerLevel,
            borderColor: "rgb(220, 53, 69)",
            borderWidth: 2,
            borderDash: [10, 5],
            label: {
              content: `Danger ${dangerLevel.toFixed(2)} m`,
              backgroundColor: "rgba(220,53,69,0.8)",
            },
          },
        },
      },
    },
  };

  const flowDirectionIcon = (() => {
    if (metrics.waterFlowRate.includes("Inflow"))
      return <ArrowUp className="text-green-600" />;
    if (metrics.waterFlowRate.includes("Outflow"))
      return <ArrowDown className="text-red-600" />;
    return <Minus className="text-gray-500" />;
  })();

  return (
    <section className="w-full px-3 mt-4 flex flex-col gap-4">
      {alerts.critical && (
        <div className="bg-red-600 text-white text-center py-3 font-bold text-lg animate-pulse rounded-lg">
          <Siren className="inline mr-2" /> CRITICAL ALERT: Flood Level Reached!
        </div>
      )}

      <div className="grid w-full gap-4 md:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between text-base font-medium">
              <span>Water Speed (HB100)</span>
              <Wind className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.hb100Speed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between text-base font-medium">
              <span>Water Flow Rate</span>
              <Waves className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <div className="text-2xl font-bold">{metrics.waterFlowRate}</div>
            {flowDirectionIcon}
          </CardContent>
        </Card>

        <Card
          className={
            alerts.critical
              ? "bg-red-100"
              : alerts.warning
              ? "bg-yellow-100"
              : ""
          }
        >
          <CardHeader>
            <CardTitle className="flex justify-between text-base font-medium">
              <span>Current Water Level</span>
              {waterTrend === "rising" ? (
                <ArrowUp className="text-red-600" />
              ) : waterTrend === "falling" ? (
                <ArrowDown className="text-green-600" />
              ) : (
                <Minus className="text-gray-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.waterLevel}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between text-base font-medium">
              <span>Rain</span>
              <CloudRain className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rainMetric}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between text-base font-medium">
              <span>System Health</span>
              <Activity className="text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div
              className={systemStatus.wifi ? "text-green-600" : "text-red-600"}
            >
              <Wifi className="inline mr-1" size={14} /> WiFi:{" "}
              {systemStatus.wifi ? "OK" : "FAIL"}
            </div>
            <div
              className={
                systemStatus.mpu_ok ? "text-green-600" : "text-red-600"
              }
            >
              <ShieldAlert className="inline mr-1" size={14} /> MPU6050:{" "}
              {systemStatus.mpu_ok ? "OK" : "FAIL"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div style={{ height: "450px" }}>
            {chartData.datasets.length > 0 ? (
              <Chart type="line" options={chartOptions} data={chartData} />
            ) : (
              <p>Loading chart...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log card */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Logs (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 border">Time</th>
                  <th className="px-2 py-1 border">Water (m)</th>
                  <th className="px-2 py-1 border">Flow (m/s)</th>
                  <th className="px-2 py-1 border">HB100 Speed</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .slice(-20)
                  .reverse()
                  .map((row, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1 border">{row.time}</td>
                      <td className="px-2 py-1 border">
                        {row.water_level_m?.toFixed(3) ??
                          (row.water_level_cm
                            ? (row.water_level_cm / 100).toFixed(3)
                            : "-")}
                      </td>
                      <td className="px-2 py-1 border">
                        {row.flow_rate_m_per_s?.toFixed(4) ??
                          (row.flow_rate_cm_per_min
                            ? (row.flow_rate_cm_per_min * 0.00016667).toFixed(4)
                            : "-")}
                      </td>
                      <td className="px-2 py-1 border">
                        {row.hb100_analog
                          ? ((row.hb100_analog / 4095) * 10).toFixed(2)
                          : "0.00"}{" "}
                        m/s
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default Dashboard;
