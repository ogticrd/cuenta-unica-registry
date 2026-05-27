"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default icon issue in Leaflet by using CDN URLs which are always available
const defaultIcon = typeof window !== "undefined"
  ? new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })
  : undefined;

if (typeof window !== "undefined" && defaultIcon) {
  L.Marker.prototype.options.icon = defaultIcon;
}

interface DeviceMapProps {
  lat: number;
  lng: number;
}

export function DeviceMap({ lat, lng }: DeviceMapProps) {
  return (
    <div className="w-full h-[200px] overflow-hidden rounded-md border border-border relative z-0">
      <MapContainer
        center={[lat, lng]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          // attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
