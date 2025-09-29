"use client";
import React, { useEffect, useRef, useState } from "react";

const floodMonitoringSites = [
  { lat: 19.076, lng: 72.8777, name: "Mumbai (Mithi River flood-prone zone)" },
  {
    lat: 13.0827,
    lng: 80.2707,
    name: "Chennai (Cooum & Adyar River flood zones)",
  },
  {
    lat: 22.5726,
    lng: 88.3639,
    name: "Kolkata (Hooghly riverbank flood zone)",
  },
  {
    lat: 26.2006,
    lng: 92.9376,
    name: "Assam (Kaziranga & Brahmaputra flood zone)",
  },
  { lat: 12.9716, lng: 77.5946, name: "Bengaluru (Urban flooding hotspot)" },
  { lat: 25.5941, lng: 85.1376, name: "Patna (Ganga flood-prone zone)" },
  { lat: 27.1767, lng: 78.0081, name: "Agra (Yamuna flood zone)" },
  { lat: 10.8505, lng: 76.2711, name: "Kerala (Monsoon flood-prone area)" },
];

const Maps = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Next.js exposes client env vars as NEXT_PUBLIC_*
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !apiKey) return;

    const initMap = () => {
      if (mapRef.current && !mapInstanceRef.current) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 22.9734, lng: 78.6569 },
          zoom: 5,
        });
        mapInstanceRef.current = map;

        floodMonitoringSites.forEach((site) => {
          const marker = new window.google.maps.Marker({
            position: { lat: site.lat, lng: site.lng },
            map,
            title: site.name,
            icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="font-family: sans-serif; font-size: 14px;">
                        <strong>${site.name}</strong><br/>
                        Flood Monitoring Hardware Installed
                      </div>`,
          });

          marker.addListener("click", () =>
            infoWindow.open({ anchor: marker, map })
          );
        });
      }
    };

    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      (window as any).initMap = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }
  }, [isClient, apiKey]);

  if (!isClient) {
    return <div style={{ width: "100%", height: "100vh" }} />; // blank shell
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
          <p>
            Google Maps API key is missing. Add it to your{" "}
            <code>.env.local</code> as{" "}
            <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
};

export default Maps;
