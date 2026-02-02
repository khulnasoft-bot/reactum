import * as React from "react";

export type BatteryManager = {
  supported: boolean;
  loading: boolean;
  level: number | undefined;
  charging: boolean | undefined;
  chargingTime: number | undefined;
  dischargingTime: number | undefined;
  error: Error | undefined;
};

export type GeolocationState = {
  loading: boolean;
  accuracy: number | undefined;
  altitude: number | undefined;
  altitudeAccuracy: number | undefined;
  heading: number | undefined;
  latitude: number | undefined;
  longitude: number | undefined;
  speed: number | undefined;
  timestamp: number | undefined;
  error: GeolocationPositionError | undefined;
  permissionDenied: boolean;
};

export type HistoryState<T> = {
  state: T;
  set: (newPresent: T) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export type LongPressOptions = {
  threshold?: number;
  onStart?: (e: Event) => void;
  onFinish?: (e: Event) => void;
  onCancel?: (e: Event) => void;
};

export type LongPressFns = {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
};

export type MousePosition = {
  x: number;
  y: number;
  elementX: number;
  elementY: number;
  elementPositionX: number;
  elementPositionY: number;
};

export type NetworkState = {
  online: boolean;
  downlink: number | undefined;
  downlinkMax: number | undefined;
  effectiveType: string | undefined;
  rtt: number | undefined;
  saveData: boolean | undefined;
  type: string | undefined;
};

export type CustomList<T> = {
  set: (l: T[]) => void;
  push: (element: T) => void;
  removeAt: (index: number) => void;
  insertAt: (index: number, element: T) => void;
  updateAt: (index: number, element: T) => void;
  clear: () => void;
};

export type CustomQueue<T> = {
  add: (element: T) => void;
  remove: () => T | undefined;
  clear: () => void;
  first: T | undefined;
  last: T | undefined;
  size: number;
  queue: T[];
};

export type RenderInfo = {
  name: string;
  renders: number;
  sinceLastRender: number;
  timestamp: number;
};

export type SpeechOptions = {
  lang?: string;
  voice?: {
    lang?: string;
    name?: string;
  };
  rate?: number;
  pitch?: number;
  volume?: number;
};

export type SpeechState = {
  isPlaying: boolean;
  status: "init" | "play" | "pause" | "stop";
  lang: string;
  voiceInfo: {
    lang: string;
    name: string;
  };
  rate: number;
  pitch: number;
  volume: number;
};

declare module "reactum" {
  export function useBattery(): BatteryManager;

  export function useClickAway<T extends Element>(
    cb: (e: Event) => void
  ): React.MutableRefObject<T>;

  export function useCopyToClipboard(): [
    string | null,
    (value: string) => Promise<void>
  ];

  export function useCounter(
    startingValue?: number,
    options?: {
      min?: number;
      max?: number;
    }
  ): [
    number,
    {
      increment: () => void;
      decrement: () => void;
      set: (nextCount: number) => void;
      reset: () => void;
    }
  ];

  export function useDebounce<T>(value: T, delay: number): T;

  export function useDefault<T>(
    initialValue: T,
    defaultValue: T
  ): [T, React.Dispatch<React.SetStateAction<T>>];

  export function useDocumentTitle(title: string): void;

  export function useFavicon(url: string): void;

  export function useGeolocation(options?: PositionOptions): GeolocationState;

  export function useHistoryState<T>(initialPresent?: T): HistoryState<T>;

  export function useHover<T extends Element>(): [
    React.RefCallback<T>,
    boolean
  ];

  export function useIdle(ms?: number): boolean;

  export function useIntersectionObserver<T extends Element>(
    options?: IntersectionObserverInit
  ): [React.RefCallback<T>, IntersectionObserverEntry | null];

  export function useIsClient(): boolean;

  export function useIsFirstRender(): boolean;

  export function useList<T>(defaultList?: T[]): [T[], CustomList<T>];

  export function useLocalStorage<T>(
    key: string,
    initialValue?: T
  ): [T, React.Dispatch<React.SetStateAction<T>>];

  export function useLockBodyScroll(): void;

  export function useLongPress(
    callback: (e: Event) => void,
    options?: LongPressOptions
  ): LongPressFns;

  export function useMap<K, V>(initialState?: [K, V][]): Map<K, V>;

  export function useMeasure<T extends Element>(): [
    React.RefCallback<T>,
    {
      width: number | undefined;
      height: number | undefined;
    }
  ];

  export function useMediaQuery(query: string): boolean;

  export function useMouse<T extends Element>(): [
    MousePosition,
    React.MutableRefObject<T>
  ];

  export function useNetworkState(): NetworkState;

  export function useObjectState<T>(initialValue: T): [T, (arg: T | ((prev: T) => T)) => void];

  export function useOrientation(): {
    angle: number;
    type: string;
  };

  export function usePreferredLanguage(): string;

  export function usePrevious<T>(newValue: T): T;

  export function useQueue<T>(initialValue?: T[]): CustomQueue<T>;

  export function useRenderCount(): number;

  export function useRenderInfo(name?: string): RenderInfo | undefined;

  export function useScript(
    src: string,
    options?: {
      removeOnUnmount?: boolean;
    }
  ): "unknown" | "loading" | "ready" | "error";

  export function useSessionStorage<T>(
    key: string,
    initialValue?: T
  ): [T, React.Dispatch<React.SetStateAction<T>>];

  export function useSet<T>(values?: T[]): Set<T>;

  export function useContinuousRetry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number, delay: number) => void;
    onSuccess?: (result: T, attempt: number) => void;
    onError?: (error: Error, maxAttempts: number) => void;
  }): {
    attempts: number;
    loading: boolean;
    error: Error | undefined;
    data: T | undefined;
    retry: () => Promise<T>;
    reset: () => void;
  };

  export function useCountdown(initialSeconds: number, options?: {
    onComplete?: () => void;
    onTick?: (seconds: number) => void;
  }): {
    countdown: number;
    isRunning: boolean;
    start: () => void;
    pause: () => void;
    reset: (seconds?: number) => void;
  };

  export function useEventListener<T extends Element>(
    eventName: string,
    handler: (event: Event) => void,
    element?: T | Window
  ): void;

  export function useFetch<T = any>(url: string, options?: RequestInit): {
    data: T | undefined;
    loading: boolean;
    error: Error | undefined;
    execute: (overrideUrl?: string, overrideOptions?: RequestInit) => Promise<T>;
  };

  export function useInterval(callback: () => void, delay: number | null): void;

  export function useIntervalWhen(callback: () => void, delay: number | null, when: boolean): void;

  export function useKeyPress(targetKey: string, options?: {
    target?: Window | Element;
  }): [boolean, React.Dispatch<React.SetStateAction<boolean>>];

  export function useLogger(name: string, options?: {
    enabled?: boolean;
  }): {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };

  export function usePageLeave(onPageLeave: (event: MouseEvent) => void, options?: {
    threshold?: number;
  }): void;

  export function useRandomInterval(callback: () => void, minDelay: number | null, maxDelay: number | null): void;

  export function useTimeout(callback: () => void, delay: number | null): void;

  export function useSpeech(text: string, options?: SpeechOptions): SpeechState;

  export function useThrottle<T>(value: T, delay: number): [T, React.Dispatch<React.SetStateAction<T>>];

  export function useToggle(
    initialValue?: boolean
  ): [boolean, (newValue?: boolean) => void];

  export function useVisibilityChange(): [boolean];

  export function useWindowScroll(): [
    {
      x: number | undefined;
      y: number | undefined;
    },
    (args: unknown) => void
  ];

  export function useWindowSize(): [
    {
      width: number | undefined;
      height: number | undefined;
    },
    React.Dispatch<React.SetStateAction<{
      width: number | undefined;
      height: number | undefined;
    }>>
  ];
}
