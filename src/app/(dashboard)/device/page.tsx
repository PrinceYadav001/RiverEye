"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, AlertTriangle, ShieldAlert, Activity } from "lucide-react";

type SystemData = {
  wifi: boolean;
  sd_ok: boolean;
  rtc_ok: boolean;
  mpu_ok: boolean;
  time: string;
};

const DeviceHealth: React.FC = () => {
  const [systemData, setSystemData] = useState<SystemData>({
    wifi: false,
    sd_ok: false,
    rtc_ok: false,
    mpu_ok: false,
    time: "--",
  });

  useEffect(() => {
    async function fetchSystem() {
      try {
        const res = await fetch("/api/esp32");
        const data = await res.json();

        setSystemData({
          wifi: data.system?.wifi ?? false,
          sd_ok: data.system?.sd_ok ?? false,
          rtc_ok: data.system?.rtc_ok ?? false,
          mpu_ok: data.system?.mpu_ok ?? false,
          time: data.time,
        });
      } catch (err) {
        console.error("Failed to fetch system health:", err);
      }
    }

    fetchSystem();
    const interval = setInterval(fetchSystem, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full px-3 mt-6 flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Device System Health
          </CardTitle>
          <Activity className="text-muted-foreground" size={28} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div className={systemData.wifi ? "text-green-600" : "text-red-600"}>
            <Wifi className="inline mr-2" size={16} /> WiFi:{" "}
            {systemData.wifi ? "OK" : "FAIL"}
          </div>
          {/* <div className={systemData.sd_ok ? "text-green-600" : "text-red-600"}>
            <SdCard className="inline mr-2" size={16} /> SD Card:{" "}
            {systemData.sd_ok ? "OK" : "FAIL"}
          </div> */}
          <div
            className={systemData.rtc_ok ? "text-green-600" : "text-red-600"}
          >
            <AlertTriangle className="inline mr-2" size={16} /> RTC:{" "}
            {systemData.rtc_ok ? "OK" : "FAIL"}
          </div>
          <div
            className={systemData.mpu_ok ? "text-green-600" : "text-red-600"}
          >
            <ShieldAlert className="inline mr-2" size={16} /> MPU6050:{" "}
            {systemData.mpu_ok ? "OK" : "FAIL"}
          </div>
          <div className="col-span-2 text-gray-600 text-xs">
            Last Updated: {systemData.time}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default DeviceHealth;
