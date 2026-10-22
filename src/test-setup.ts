class ResizeObserverStub {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
