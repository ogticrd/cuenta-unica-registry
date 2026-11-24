import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LogoLoop } from "@/components/LogoLoop";

describe("LogoLoop", () => {
  const observers: Array<{
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];

  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor() {
          observers.push(this);
        }
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps resize subscriptions stable across unrelated rerenders and refreshes them when direction changes", () => {
    const logos = [{ node: <span>Institution</span> }];
    const view = render(<LogoLoop logos={logos} ariaLabel="Institutions" />);
    const initialObservers = [...observers];
    expect(initialObservers).toHaveLength(2);

    view.rerender(
      <LogoLoop logos={logos} ariaLabel="Institutions" width={400} />,
    );
    expect(observers).toHaveLength(2);
    expect(initialObservers[0].disconnect).not.toHaveBeenCalled();

    view.rerender(
      <LogoLoop logos={logos} ariaLabel="Institutions" direction="up" />,
    );
    expect(observers).toHaveLength(4);
    for (const observer of initialObservers) {
      expect(observer.disconnect).toHaveBeenCalledOnce();
    }
    expect(screen.getByRole("region", { name: "Institutions" })).toHaveClass(
      "flex-col",
    );
    view.unmount();
    for (const observer of observers) {
      expect(observer.disconnect).toHaveBeenCalledOnce();
    }
  });

  it("remeasures loaded images and removes listeners from replaced logos", () => {
    const measure = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    const view = render(
      <LogoLoop logos={[{ src: "/first.svg", alt: "First institution" }]} />,
    );
    const firstImage = screen.getByRole("img", { name: "First institution" });
    const beforeLoad = measure.mock.calls.length;
    fireEvent.load(firstImage);
    expect(measure.mock.calls.length).toBeGreaterThan(beforeLoad);

    view.rerender(<LogoLoop logos={[]} />);
    view.rerender(
      <LogoLoop logos={[{ src: "/second.svg", alt: "Second institution" }]} />,
    );
    const beforeOldImageLoad = measure.mock.calls.length;
    fireEvent.load(firstImage);
    expect(measure.mock.calls).toHaveLength(beforeOldImageLoad);
    fireEvent.load(screen.getByRole("img", { name: "Second institution" }));
    expect(measure.mock.calls.length).toBeGreaterThan(beforeOldImageLoad);
    view.unmount();
  });

  it("remeasures window resizes when ResizeObserver is unavailable and removes the listener on unmount", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const measure = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    const view = render(
      <LogoLoop logos={[{ node: <span>Institution</span> }]} />,
    );
    const beforeResize = measure.mock.calls.length;
    fireEvent(window, new Event("resize"));
    expect(measure.mock.calls.length).toBeGreaterThan(beforeResize);
    view.unmount();
    const afterUnmount = measure.mock.calls.length;
    fireEvent(window, new Event("resize"));
    expect(measure.mock.calls).toHaveLength(afterUnmount);
  });

  it.each([
    "left",
    "right",
    "up",
    "down",
  ] as const)("animates %s with measured dimensions and cancels pending frames on unmount", (direction) => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      top: 0,
      right: 100,
      bottom: 50,
      left: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((frame: FrameRequestCallback) => {
        frames.push(frame);
        return frames.length;
      }),
    );
    const cancelFrame = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);
    const view = render(
      <LogoLoop
        logos={[
          { node: <span>Institution</span>, href: "https://example.com" },
        ]}
        direction={direction}
        ariaLabel="Institutions"
        pauseOnHover
        fadeOut
        scaleOnHover
      />,
    );
    const track = screen.getByRole("region", { name: "Institutions" });
    const initialTransform = track.style.transform;
    act(() => frames[frames.length - 1](0));
    act(() => frames[frames.length - 1](1000));
    expect(track.style.transform).not.toBe(initialTransform);
    fireEvent.mouseEnter(track);
    act(() => frames[frames.length - 1](2000));
    act(() => frames[frames.length - 1](3000));
    fireEvent.mouseLeave(track);
    view.unmount();
    expect(cancelFrame).toHaveBeenCalled();
  });

  it("respects reduced motion and supports custom logo rendering", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      ...window.matchMedia(""),
      matches: true,
    });
    const requestFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    const view = render(
      <LogoLoop
        logos={[{ src: "/institution.svg", alt: "Institution" }]}
        renderItem={() => <button type="button">Institution details</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Institution details" }),
    ).toBeInTheDocument();
    expect(requestFrame).not.toHaveBeenCalled();
    view.unmount();
  });
});
