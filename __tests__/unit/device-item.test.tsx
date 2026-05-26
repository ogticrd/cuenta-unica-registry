import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeviceItem } from "@/components/dashboard/device-item";
import React from "react";

// Mock next/dynamic to immediately render a mock map in tests
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    return function MockMap(props: any) {
      return (
        <div data-testid="mock-device-map">
          Mock Map - Lat: {props.lat}, Lng: {props.lng}
        </div>
      );
    };
  },
}));

describe("DeviceItem Component", () => {
  const defaultProps = {
    device: "Windows 10 Chrome",
    ipAddress: "192.168.1.100",
    location: "Santo Domingo, DR",
    lastAccess: "2026-05-26",
    expirationDate: "2026-06-26",
    status: {
      text: "ACTIVO",
      variant: "active" as const,
    },
    rawDeviceName: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    coordinates: { lat: 18.4861, lng: -69.9312 },
  };

  it("renders basic info correctly and does not show map initially", () => {
    render(<DeviceItem {...defaultProps} />);
    
    expect(screen.getByText("Windows 10 Chrome")).toBeInTheDocument();
    expect(screen.getByText("Santo Domingo, DR")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-device-map")).not.toBeInTheDocument();
  });

  it("renders IP address, original device name and map after clicking see more", async () => {
    render(<DeviceItem {...defaultProps} />);
    
    const button = screen.getByRole("button", { name: /see_more/i });
    expect(button).toBeInTheDocument();
    
    // Toggle collapsible
    fireEvent.click(button);
    
    // Wait for the collapsible content to render
    const ipLabel = await screen.findByText("ip_address");
    expect(ipLabel).toBeInTheDocument();
    expect(screen.getByText("192.168.1.100")).toBeInTheDocument();
    expect(screen.getByText("raw_device_name")).toBeInTheDocument();
    expect(screen.getByText(defaultProps.rawDeviceName)).toBeInTheDocument();
    expect(screen.getByTestId("mock-device-map")).toBeInTheDocument();
  });
});
