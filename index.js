import * as React from "react";

function isShallowEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
}

function isTouchEvent({ nativeEvent }) {
  return window.TouchEvent
    ? nativeEvent instanceof TouchEvent
    : "touches" in nativeEvent;
}

function isMouseEvent(event) {
  return event.nativeEvent instanceof MouseEvent;
}

function throttle(cb, ms) {
  let lastTime = 0;
  return () => {
    const now = Date.now();
    if (now - lastTime >= ms) {
      cb();
      lastTime = now;
    }
  };
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function dispatchStorageEvent(key, newValue) {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
}

export function useBattery() {
  const [state, setState] = React.useState({
    supported: true,
    loading: true,
    level: undefined,
    charging: undefined,
    chargingTime: undefined,
    dischargingTime: undefined,
    error: undefined,
  });

  React.useEffect(() => {
    if (typeof window === 'undefined' || !navigator.getBattery) {
      setState((s) => ({
        ...s,
        supported: false,
        loading: false,
        error: new Error('Battery API is not supported in this browser'),
      }));
      return;
    }

    let battery = undefined;

    const handleChange = () => {
      try {
        setState({
          supported: true,
          loading: false,
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          error: undefined,
        });
      } catch (error) {
        setState((s) => ({
          ...s,
          loading: false,
          error: new Error('Failed to access battery information'),
        }));
      }
    };

    const handleError = (error) => {
      setState((s) => ({
        ...s,
        loading: false,
        error: new Error('Battery API error: ' + error.message),
      }));
    };

    try {
      navigator.getBattery().then((b) => {
        battery = b;
        handleChange();

        b.addEventListener("levelchange", handleChange);
        b.addEventListener("chargingchange", handleChange);
        b.addEventListener("chargingtimechange", handleChange);
        b.addEventListener("dischargingtimechange", handleChange);
      }).catch((error) => {
        setState((s) => ({
          ...s,
          supported: false,
          loading: false,
          error: new Error('Battery API access denied or unavailable'),
        }));
      });
    } catch (error) {
      setState((s) => ({
        ...s,
        supported: false,
        loading: false,
        error: new Error('Battery API is not available'),
      }));
    }

    return () => {
      if (battery) {
        try {
          battery.removeEventListener("levelchange", handleChange);
          battery.removeEventListener("chargingchange", handleChange);
          battery.removeEventListener("chargingtimechange", handleChange);
          battery.removeEventListener("dischargingtimechange", handleChange);
        } catch (error) {
          console.warn('Error cleaning up battery event listeners:', error);
        }
      }
    };
  }, []);

  return state;
}

export function useClickAway(cb) {
  const ref = React.useRef(undefined);
  const refCb = React.useRef(cb);

  React.useLayoutEffect(() => {
    refCb.current = cb;
  });

  React.useEffect(() => {
    const handler = (e) => {
      const element = ref.current;
      if (element && !element.contains(e.target)) {
        refCb.current(e);
      }
    };

    document.addEventListener("click", handler, { passive: true });

    return () => {
      document.removeEventListener("click", handler);
    };
  }, []);

  return ref;
}

function oldSchoolCopy(text) {
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = text;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  document.execCommand("copy");
  document.body.removeChild(tempTextArea);
}

export function useCopyToClipboard() {
  const [state, setState] = React.useState(undefined);

  const copyToClipboard = React.useCallback((value) => {
    const handleCopy = async () => {
      try {
        if (!navigator?.clipboard) {
          return oldSchoolCopy(value);
        }

        await navigator.clipboard.writeText(value);
        setState(value);
      } catch (error) {
        setState(undefined);
        throw error;
      }
    };

    handleCopy();
  }, []);

  return [state, copyToClipboard];
}

export function useCounter(startingValue = 0, options = {}) {
  const { min, max } = options;

  if (typeof min === "number" && startingValue < min) {
    throw new Error(
      `Your starting value of ${startingValue} is less than your min of ${min}.`
    );
  }

  if (typeof max === "number" && startingValue > max) {
    throw new Error(
      `Your starting value of ${startingValue} is greater than your max of ${max}.`
    );
  }

  const [count, setCount] = React.useState(startingValue);

  const increment = React.useCallback(() => {
    setCount((c) => {
      const nextCount = c + 1;

      if (typeof max === "number" && nextCount > max) {
        return c;
      }

      return nextCount;
    });
  }, [max]);

  const decrement = React.useCallback(() => {
    setCount((c) => {
      const nextCount = c - 1;

      if (typeof min === "number" && nextCount < min) {
        return c;
      }

      return nextCount;
    });
  }, [min]);

  const set = React.useCallback(
    (nextCount) => {
      setCount((c) => {
        if (typeof max === "number" && nextCount > max) {
          return c;
        }

        if (typeof min === "number" && nextCount < min) {
          return c;
        }

        return nextCount;
      });
    },
    [max, min]
  );

  const reset = React.useCallback(() => {
    setCount(startingValue);
  }, [startingValue]);

  return [
    count,
    {
      increment,
      decrement,
      set,
      reset,
    },
  ];
}

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDefault(initialValue, defaultValue) {
  const [state, setState] = React.useState(initialValue);

  if (typeof state === "undefined" || state === null) {
    return [defaultValue, setState];
  }

  return [state, setState];
}

export function useDocumentTitle(title) {
  React.useEffect(() => {
    document.title = title;
  }, [title]);
}

export function useFavicon(url) {
  React.useEffect(() => {
    let link = document.querySelector(`link[rel~="icon"]`);

    if (!link) {
      link = document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "icon";
      link.href = url;
      document.head.appendChild(link);
    } else {
      link.href = url;
    }
  }, [url]);
}

export function useGeolocation(options = {}) {
  const [state, setState] = React.useState({
    loading: true,
    accuracy: undefined,
    altitude: undefined,
    altitudeAccuracy: undefined,
    heading: undefined,
    latitude: undefined,
    longitude: undefined,
    speed: undefined,
    timestamp: undefined,
    error: undefined,
    permissionDenied: false,
  });

  const optionsRef = React.useRef(options);

  React.useEffect(() => {
    const onEvent = ({ coords, timestamp }) => {
      setState({
        loading: false,
        timestamp,
        latitude: coords.latitude,
        longitude: coords.longitude,
        altitude: coords.altitude,
        accuracy: coords.accuracy,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        error: undefined,
        permissionDenied: false,
      });
    };

    const onEventError = (error) => {
      setState((s) => ({
        ...s,
        loading: false,
        error,
        permissionDenied: error.code === error.PERMISSION_DENIED,
      }));
    };

    const checkPermission = () => {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'denied') {
            setState((s) => ({
              ...s,
              loading: false,
              permissionDenied: true,
              error: new Error('Geolocation permission denied'),
            }));
          }
        });
      }
    };

    checkPermission();

    navigator.geolocation.getCurrentPosition(
      onEvent,
      onEventError,
      optionsRef.current
    );

    const watchId = navigator.geolocation.watchPosition(
      onEvent,
      onEventError,
      optionsRef.current
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}

const initialUseHistoryStateState = {
  past: [],
  present: undefined,
  future: [],
};

const useHistoryStateReducer = (state, action) => {
  const { past, present, future } = state;

  if (action.type === "UNDO") {
    return {
      past: past.slice(0, past.length - 1),
      present: past[past.length - 1],
      future: [present, ...future],
    };
  } else if (action.type === "REDO") {
    return {
      past: [...past, present],
      present: future[0],
      future: future.slice(1),
    };
  } else if (action.type === "SET") {
    const { newPresent } = action;

    if (action.newPresent === present) {
      return state;
    }

    return {
      past: [...past, present],
      present: newPresent,
      future: [],
    };
  } else if (action.type === "CLEAR") {
    return {
      ...initialUseHistoryStateState,
      present: action.initialPresent,
    };
  } else {
    throw new Error("Unsupported action type");
  }
};

export function useHistoryState(initialPresent = {}) {
  const initialPresentRef = React.useRef(initialPresent);

  const [state, dispatch] = React.useReducer(useHistoryStateReducer, {
    ...initialUseHistoryStateState,
    present: initialPresentRef.current,
  });

  const canUndo = state.past.length !== 0;
  const canRedo = state.future.length !== 0;

  const undo = React.useCallback(() => {
    if (canUndo) {
      dispatch({ type: "UNDO" });
    }
  }, [canUndo]);

  const redo = React.useCallback(() => {
    if (canRedo) {
      dispatch({ type: "REDO" });
    }
  }, [canRedo]);

  const set = React.useCallback(
    (newPresent) => dispatch({ type: "SET", newPresent }),
    []
  );

  const clear = React.useCallback(
    () =>
      dispatch({ type: "CLEAR", initialPresent: initialPresentRef.current }),
    []
  );

  return { state: state.present, set, undo, redo, clear, canUndo, canRedo };
}

export function useHover() {
  const [hovering, setHovering] = React.useState(false);
  const previousNode = React.useRef(undefined);

  const handleMouseEnter = React.useCallback(() => {
    setHovering(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setHovering(false);
  }, []);

  const customRef = React.useCallback(
    (node) => {
      if (previousNode.current && previousNode.current !== node) {
        previousNode.current.removeEventListener("mouseenter", handleMouseEnter, { passive: true });
        previousNode.current.removeEventListener("mouseleave", handleMouseLeave, { passive: true });
      }

      if (node?.nodeType === Node.ELEMENT_NODE) {
        node.addEventListener("mouseenter", handleMouseEnter, { passive: true });
        node.addEventListener("mouseleave", handleMouseLeave, { passive: true });
      }

      previousNode.current = node;
    },
    [handleMouseEnter, handleMouseLeave]
  );

  return [customRef, hovering];
}

export function useIdle(ms = 1000 * 60) {
  const [idle, setIdle] = React.useState(false);

  React.useEffect(() => {
    let timeoutId;

    const handleTimeout = () => {
      setIdle(true);
    };

    const handleEvent = throttle((e) => {
      setIdle(false);

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(handleTimeout, ms);
    }, 500);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleEvent();
      }
    };

    timeoutId = window.setTimeout(handleTimeout, ms);

    window.addEventListener("mousemove", handleEvent);
    window.addEventListener("mousedown", handleEvent);
    window.addEventListener("resize", handleEvent);
    window.addEventListener("keydown", handleEvent);
    window.addEventListener("touchstart", handleEvent);
    window.addEventListener("wheel", handleEvent);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("mousemove", handleEvent);
      window.removeEventListener("mousedown", handleEvent);
      window.removeEventListener("resize", handleEvent);
      window.removeEventListener("keydown", handleEvent);
      window.removeEventListener("touchstart", handleEvent);
      window.removeEventListener("wheel", handleEvent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearTimeout(timeoutId);
    };
  }, [ms]);

  return idle;
}

export function useIntersectionObserver(options = {}) {
  const { threshold = 1, root = undefined, rootMargin = "0px" } = options;
  const [entry, setEntry] = React.useState(undefined);

  const previousObserver = React.useRef(undefined);

  const customRef = React.useCallback(
    (node) => {
      try {
        if (previousObserver.current) {
          previousObserver.current.disconnect();
          previousObserver.current = undefined;
        }

        if (node?.nodeType === Node.ELEMENT_NODE) {
          const observer = new IntersectionObserver(
            ([entry]) => setEntry(entry),
            { threshold, root, rootMargin }
          );

          observer.observe(node);
          previousObserver.current = observer;
        }
      } catch (error) {
        console.error('Error in useIntersectionObserver:', error);
        setEntry(undefined);
      }
    },
    [threshold, root, rootMargin]
  );

  return [customRef, entry];
}

export function useIsClient() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

export function useIsFirstRender() {
  const renderRef = React.useRef(true);

  if (renderRef.current === true) {
    renderRef.current = false;
    return true;
  }

  return renderRef.current;
}

export function useList(defaultList = []) {
  const [list, setList] = React.useState(defaultList);

  const set = React.useCallback((l) => {
    setList(l);
  }, []);

  const push = React.useCallback((element) => {
    setList((l) => [...l, element]);
  }, []);

  const removeAt = React.useCallback((index) => {
    setList((l) => [...l.slice(0, index), ...l.slice(index + 1)]);
  }, []);

  const insertAt = React.useCallback((index, element) => {
    setList((l) => [...l.slice(0, index), element, ...l.slice(index)]);
  }, []);

  const updateAt = React.useCallback((index, element) => {
    setList((l) => l.map((e, i) => (i === index ? element : e)));
  }, []);

  const clear = React.useCallback(() => setList([]), []);

  return [list, { set, push, removeAt, insertAt, updateAt, clear }];
}

const setLocalStorageItem = (key, value) => {
  const stringifiedValue = JSON.stringify(value);
  window.localStorage.setItem(key, stringifiedValue);
  dispatchStorageEvent(key, stringifiedValue);
};

const removeLocalStorageItem = (key) => {
  window.localStorage.removeItem(key);
  dispatchStorageEvent(key, undefined);
};

const getLocalStorageItem = (key) => {
  return window.localStorage.getItem(key);
};

const useLocalStorageSubscribe = (callback) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getLocalStorageServerSnapshot = () => {
  throw Error("useLocalStorage is a client-only hook");
};

export function useLocalStorage(key, initialValue) {
  const getSnapshot = () => getLocalStorageItem(key);

  const store = React.useSyncExternalStore(
    useLocalStorageSubscribe,
    getSnapshot,
    getLocalStorageServerSnapshot
  );

  const setState = React.useCallback(
    (v) => {
      try {
        const parsedStore = store ? (() => {
          try {
            return JSON.parse(store);
          } catch (e) {
            console.warn(`Failed to parse localStorage value for key "${key}":`, e);
            return initialValue;
          }
        })() : initialValue;

        const nextState = typeof v === "function" ? v(parsedStore) : v;

        if (nextState === undefined || nextState === null) {
          removeLocalStorageItem(key);
        } else {
          setLocalStorageItem(key, nextState);
        }
      } catch (e) {
        console.warn(`Error updating localStorage for key "${key}":`, e);
      }
    },
    [key, store, initialValue]
  );

  React.useEffect(() => {
    if (
      getLocalStorageItem(key) === undefined &&
      typeof initialValue !== "undefined"
    ) {
      try {
        setLocalStorageItem(key, initialValue);
      } catch (e) {
        console.warn(`Error setting initial localStorage value for key "${key}":`, e);
      }
    }
  }, [key, initialValue]);

  const parsedValue = store ? (() => {
    try {
      return JSON.parse(store);
    } catch (e) {
      console.warn(`Failed to parse localStorage value for key "${key}":`, e);
      return initialValue;
    }
  })() : initialValue;

  return [parsedValue, setState];
}

export function useLockBodyScroll() {
  React.useLayoutEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
}

export function useLongPress(callback, options = {}) {
  const { threshold = 400, onStart, onFinish, onCancel } = options;
  const isLongPressActive = React.useRef(false);
  const isPressed = React.useRef(false);
  const timerId = React.useRef();

  return React.useMemo(() => {
    if (typeof callback !== "function") {
      return {};
    }

    const start = (event) => {
      if (!isMouseEvent(event) && !isTouchEvent(event)) return;

      if (onStart) {
        onStart(event);
      }

      isPressed.current = true;
      timerId.current = setTimeout(() => {
        callback(event);
        isLongPressActive.current = true;
      }, threshold);
    };

    const cancel = (event) => {
      if (!isMouseEvent(event) && !isTouchEvent(event)) return;

      if (isLongPressActive.current) {
        if (onFinish) {
          onFinish(event);
        }
      } else if (isPressed.current) {
        if (onCancel) {
          onCancel(event);
        }
      }

      isLongPressActive.current = false;
      isPressed.current = false;

      if (timerId.current) {
        window.clearTimeout(timerId.current);
      }
    };

    const mouseHandlers = {
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
    };

    const touchHandlers = {
      onTouchStart: start,
      onTouchEnd: cancel,
    };

    return {
      ...mouseHandlers,
      ...touchHandlers,
    };
  }, [callback, threshold, onCancel, onFinish, onStart]);
}

export function useMap(initialState) {
  const mapRef = React.useRef(new Map(initialState));
  const [, reRender] = React.useReducer((x) => x + 1, 0);

  mapRef.current.set = (...args) => {
    Map.prototype.set.apply(mapRef.current, args);
    reRender();
    return mapRef.current;
  };

  mapRef.current.clear = (...args) => {
    Map.prototype.clear.apply(mapRef.current, args);
    reRender();
  };

  mapRef.current.delete = (...args) => {
    const res = Map.prototype.delete.apply(mapRef.current, args);
    reRender();

    return res;
  };

  return mapRef.current;
}

export function useMeasure() {
  const [dimensions, setDimensions] = React.useState({
    width: undefined,
    height: undefined,
  });

  const previousObserver = React.useRef(undefined);

  const customRef = React.useCallback((node) => {
    try {
      if (previousObserver.current) {
        previousObserver.current.disconnect();
        previousObserver.current = undefined;
      }

      if (node?.nodeType === Node.ELEMENT_NODE) {
        const observer = new ResizeObserver(([entry]) => {
          try {
            setDimensions({
              width: entry.contentRect.width,
              height: entry.contentRect.height,
            });
          } catch (error) {
            console.error('Error in ResizeObserver callback:', error);
          }
        });

        observer.observe(node);
        previousObserver.current = observer;
      }
    } catch (error) {
      console.error('Error in useMeasure:', error);
      setDimensions({ width: undefined, height: undefined });
    }
  }, []);

  return [customRef, dimensions];
}

export function useMediaQuery(query) {
  const subscribe = React.useCallback(
    (callback) => {
      const matchMedia = window.matchMedia(query);

      matchMedia.addEventListener("change", callback);
      return () => {
        matchMedia.removeEventListener("change", callback);
      };
    },
    [query]
  );

  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => {
    throw Error("useMediaQuery is a client-only hook");
  };

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useMouse() {
  const [state, setState] = React.useState({
    x: 0,
    y: 0,
    elementPositionX: 0,
    elementPositionY: 0,
  });

  const ref = React.useRef(undefined);

  React.useLayoutEffect(() => {
    const handleMouseMove = (event) => {
      setState({
        x: event.clientX,
        y: event.clientY,
        elementPositionX: event.nativeEvent.offsetX,
        elementPositionY: event.nativeEvent.offsetY,
      });
    };

    const element = ref.current;
    if (element) {
      element.addEventListener("mousemove", handleMouseMove, { passive: true });
    } else {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    return () => {
      if (element) {
        element.removeEventListener("mousemove", handleMouseMove);
      } else {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  return [state, ref];
}

const getConnection = () => {
  return (
    navigator?.connection ||
    navigator?.mozConnection ||
    navigator?.webkitConnection
  );
};

const useNetworkStateSubscribe = (callback) => {
  window.addEventListener("online", callback, { passive: true });
  window.addEventListener("offline", callback, { passive: true });

  const connection = getConnection();

  if (connection) {
    connection.addEventListener("change", callback, { passive: true });
  }

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);

    if (connection) {
      connection.removeEventListener("change", callback);
    }
  };
};

const getNetworkStateServerSnapshot = () => {
  throw Error("useNetworkState is a client-only hook");
};

export function useNetworkState() {
  const cache = React.useRef({});

  const getSnapshot = () => {
    const online = navigator.onLine;
    const connection = getConnection();

    const nextState = {
      online,
      downlink: connection?.downlink,
      downlinkMax: connection?.downlinkMax,
      effectiveType: connection?.effectiveType,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      type: connection?.type,
    };

    if (isShallowEqual(cache.current, nextState)) {
      return cache.current;
    } else {
      cache.current = nextState;
      return nextState;
    }
  };

  return React.useSyncExternalStore(
    useNetworkStateSubscribe,
    getSnapshot,
    getNetworkStateServerSnapshot
  );
}

export function useObjectState(initialValue) {
  const [state, setState] = React.useState(initialValue);

  const handleUpdate = React.useCallback((arg) => {
    if (typeof arg === "function") {
      setState((s) => {
        const newState = arg(s);

        if (isPlainObject(newState)) {
          return {
            ...s,
            ...newState,
          };
        }
      });
    }

    if (isPlainObject(arg)) {
      setState((s) => ({
        ...s,
        ...arg,
      }));
    }
  }, []);

  return [state, handleUpdate];
}

export function useOrientation() {
  const [orientation, setOrientation] = React.useState({
    angle: 0,
    type: "landscape-primary",
  });

  React.useLayoutEffect(() => {
    const handleChange = () => {
      const { angle, type } = window.screen.orientation;
      setOrientation({
        angle,
        type,
      });
    };

    const handle_orientationchange = () => {
      setOrientation({
        type: "UNKNOWN",
        angle: window.orientation,
      });
    };

    if (window.screen?.orientation) {
      handleChange();
      window.screen.orientation.addEventListener("change", handleChange);
    } else {
      handle_orientationchange();
      window.addEventListener("orientationchange", handle_orientationchange);
    }

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener("change", handleChange);
      } else {
        window.removeEventListener(
          "orientationchange",
          handle_orientationchange
        );
      }
    };
  }, []);

  return orientation;
}

const usePreferredLanguageSubscribe = (cb) => {
  window.addEventListener("languagechange", cb);
  return () => window.removeEventListener("languagechange", cb);
};

const getPreferredLanguageSnapshot = () => {
  return navigator.language;
};

const getPreferredLanguageServerSnapshot = () => {
  throw Error("usePreferredLanguage is a client-only hook");
};

export function usePreferredLanguage() {
  return React.useSyncExternalStore(
    usePreferredLanguageSubscribe,
    getPreferredLanguageSnapshot,
    getPreferredLanguageServerSnapshot
  );
}

export function usePrevious(value) {
  const ref = React.useRef(value);

  React.useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

export function useQueue(initialValue = []) {
  const [queue, setQueue] = React.useState(initialValue);

  const add = React.useCallback((element) => {
    setQueue((q) => [...q, element]);
  }, []);

  const remove = React.useCallback(() => {
    let removedElement;

    setQueue(([first, ...q]) => {
      removedElement = first;
      return q;
    });

    return removedElement;
  }, []);

  const clear = React.useCallback(() => {
    setQueue([]);
  }, []);

  return {
    add,
    remove,
    clear,
    first: queue[0],
    last: queue[queue.length - 1],
    size: queue.length,
    queue,
  };
}

export function useRenderCount() {
  const count = React.useRef(0);

  count.current++;

  return count.current;
}

export function useRenderInfo(name = "Unknown") {
  const count = React.useRef(0);
  const lastRender = React.useRef(undefined);
  const now = Date.now();

  count.current++;

  React.useEffect(() => {
    lastRender.current = Date.now();
    
    return () => {
      lastRender.current = undefined;
    };
  });

  const sinceLastRender = lastRender.current ? now - lastRender.current : 0;

  if (process.env.NODE_ENV !== "production") {
    const info = {
      name,
      renders: count.current,
      sinceLastRender,
      timestamp: now,
    };

    console.log(info);

    return info;
  }
}

export function useScript(src, options = {}) {
  const [status, setStatus] = React.useState("loading");
  const optionsRef = React.useRef(options);

  React.useEffect(() => {
    let script = document.querySelector(`script[src="${src}"]`);

    const domStatus = script?.getAttribute("data-status");
    if (domStatus) {
      setStatus(domStatus);
      return;
    }

    if (script === null) {
      script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.setAttribute("data-status", "loading");
      document.body.appendChild(script);

      const handleScriptLoad = () => {
        script.setAttribute("data-status", "ready");
        setStatus("ready");
        removeEventListeners();
      };

      const handleScriptError = () => {
        script.setAttribute("data-status", "error");
        setStatus("error");
        removeEventListeners();
      };

      const removeEventListeners = () => {
        script.removeEventListener("load", handleScriptLoad);
        script.removeEventListener("error", handleScriptError);
      };

      script.addEventListener("load", handleScriptLoad);
      script.addEventListener("error", handleScriptError);

      const removeOnUnmount = optionsRef.current.removeOnUnmount;

      return () => {
        if (removeOnUnmount === true) {
          script.remove();
          removeEventListeners();
        }
      };
    } else {
      setStatus("unknown");
    }
  }, [src]);

  return status;
}

const setSessionStorageItem = (key, value) => {
  const stringifiedValue = JSON.stringify(value);
  window.sessionStorage.setItem(key, stringifiedValue);
  dispatchStorageEvent(key, stringifiedValue);
};

const removeSessionStorageItem = (key) => {
  window.sessionStorage.removeItem(key);
  dispatchStorageEvent(key, undefined);
};

const getSessionStorageItem = (key) => {
  return window.sessionStorage.getItem(key);
};

const useSessionStorageSubscribe = (callback) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getSessionStorageServerSnapshot = () => {
  throw Error("useSessionStorage is a client-only hook");
};

export function useSessionStorage(key, initialValue) {
  const getSnapshot = () => getSessionStorageItem(key);

  const store = React.useSyncExternalStore(
    useSessionStorageSubscribe,
    getSnapshot,
    getSessionStorageServerSnapshot
  );

  const setState = React.useCallback(
    (v) => {
      try {
        const parsedStore = store ? (() => {
          try {
            return JSON.parse(store);
          } catch (e) {
            console.warn(`Failed to parse sessionStorage value for key "${key}":`, e);
            return initialValue;
          }
        })() : initialValue;

        const nextState = typeof v === "function" ? v(parsedStore) : v;

        if (nextState === undefined || nextState === null) {
          removeSessionStorageItem(key);
        } else {
          setSessionStorageItem(key, nextState);
        }
      } catch (e) {
        console.warn(`Error updating sessionStorage for key "${key}":`, e);
      }
    },
    [key, store, initialValue]
  );

  React.useEffect(() => {
    if (
      getSessionStorageItem(key) === undefined &&
      typeof initialValue !== "undefined"
    ) {
      try {
        setSessionStorageItem(key, initialValue);
      } catch (e) {
        console.warn(`Error setting initial sessionStorage value for key "${key}":`, e);
      }
    }
  }, [key, initialValue]);

  const parsedValue = store ? (() => {
    try {
      return JSON.parse(store);
    } catch (e) {
      console.warn(`Failed to parse sessionStorage value for key "${key}":`, e);
      return initialValue;
    }
  })() : initialValue;

  return [parsedValue, setState];
}

export function useSet(values) {
  const setRef = React.useRef(new Set(values));
  const [, reRender] = React.useReducer((x) => x + 1, 0);

  setRef.current.add = (...args) => {
    const res = Set.prototype.add.apply(setRef.current, args);
    reRender();

    return res;
  };

  setRef.current.clear = (...args) => {
    Set.prototype.clear.apply(setRef.current, args);
    reRender();
  };

  setRef.current.delete = (...args) => {
    const res = Set.prototype.delete.apply(setRef.current, args);
    reRender();

    return res;
  };

  return setRef.current;
}

export function useSpeech(text, options = {}) {
  const [state, setState] = React.useState({
    isPlaying: false,
    status: "init",
    lang: "en-US",
    voiceInfo: {
      lang: "en-US",
      name: "",
    },
    rate: 1,
    pitch: 1,
    volume: 1,
  });

  const utteranceRef = React.useRef(undefined);
  const optionsRef = React.useRef(options);

  React.useEffect(() => {
    if (!window.speechSynthesis) {
      setState((s) => ({
        ...s,
        status: "error",
      }));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const updateUtteranceOptions = () => {
      const opts = optionsRef.current;
      utterance.lang = opts.lang || "en-US";
      utterance.rate = opts.rate || 1;
      utterance.pitch = opts.pitch || 1;
      utterance.volume = opts.volume || 1;

      if (opts.voice) {
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(
          (v) => v.name === opts.voice.name && v.lang === opts.voice.lang
        );
        if (voice) {
          utterance.voice = voice;
        }
      }
    };

    updateUtteranceOptions();

    const handleStart = () => {
      setState({
        isPlaying: true,
        status: "play",
        lang: utterance.lang,
        voiceInfo: {
          lang: utterance.voice?.lang || utterance.lang,
          name: utterance.voice?.name || "",
        },
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume,
      });
    };

    const handleEnd = () => {
      setState((s) => ({
        ...s,
        isPlaying: false,
        status: "stop",
      }));
    };

    const handleError = () => {
      setState((s) => ({
        ...s,
        isPlaying: false,
        status: "error",
      }));
    };

    utterance.addEventListener("start", handleStart);
    utterance.addEventListener("end", handleEnd);
    utterance.addEventListener("error", handleError);

    speechSynthesis.getVoices();

    return () => {
      utterance.removeEventListener("start", handleStart);
      utterance.removeEventListener("end", handleEnd);
      utterance.removeEventListener("error", handleError);
    };
  }, [text]);

  const speak = React.useCallback(() => {
    if (utteranceRef.current && window.speechSynthesis) {
      window.speechSynthesis.speak(utteranceRef.current);
    }
  }, []);

  const pause = React.useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      setState((s) => ({
        ...s,
        isPlaying: false,
        status: "pause",
      }));
    }
  }, []);

  const resume = React.useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      setState((s) => ({
        ...s,
        isPlaying: true,
        status: "play",
      }));
    }
  }, []);

  const cancel = React.useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setState((s) => ({
        ...s,
        isPlaying: false,
        status: "stop",
      }));
    }
  }, []);

  return {
    ...state,
    speak,
    pause,
    resume,
    cancel,
  };
}

export function useContinuousRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    onRetry,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = React.useState({
    attempts: 0,
    loading: false,
    error: undefined,
    data: undefined,
  });

  const retry = React.useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: undefined }));

    let currentDelay = delay;
    let lastError = undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        setState({
          attempts: attempt,
          loading: false,
          error: undefined,
          data: result,
        });
        onSuccess?.(result, attempt);
        return result;
      } catch (error) {
        lastError = error;
        setState((s) => ({
          ...s,
          attempts: attempt,
          error,
        }));

        if (attempt < maxAttempts) {
          onRetry?.(error, attempt, currentDelay);
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentDelay *= backoff;
        }
      }
    }

    setState((s) => ({
      ...s,
      loading: false,
      error: lastError,
    }));
    onError?.(lastError, maxAttempts);
    throw lastError;
  }, [fn, maxAttempts, delay, backoff, onRetry, onSuccess, onError]);

  const reset = React.useCallback(() => {
    setState({
      attempts: 0,
      loading: false,
      error: undefined,
      data: undefined,
    });
  }, []);

  return {
    ...state,
    retry,
    reset,
  };
}

export function useCountdown(initialSeconds, options = {}) {
  const { onComplete, onTick } = options;
  const [countdown, setCountdown] = React.useState(initialSeconds);
  const [isRunning, setIsRunning] = React.useState(false);
  const intervalRef = React.useRef(undefined);

  const start = React.useCallback(() => {
    if (countdown > 0 && !isRunning) {
      setIsRunning(true);
    }
  }, [countdown, isRunning]);

  const pause = React.useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = React.useCallback((seconds = initialSeconds) => {
    setCountdown(seconds);
    setIsRunning(false);
  }, [initialSeconds]);

  React.useEffect(() => {
    if (isRunning && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          const next = prev - 1;
          onTick?.(next);
          if (next <= 0) {
            setIsRunning(false);
            onComplete?.();
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, countdown, onTick, onComplete]);

  return {
    countdown,
    isRunning,
    start,
    pause,
    reset,
  };
}

export function useEventListener(eventName, handler, element = window) {
  const savedHandler = React.useRef(handler);

  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  React.useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) {
      console.warn(`useEventListener: Element does not support addEventListener for event "${eventName}"`);
      return;
    }

    const eventListener = (event) => {
      try {
        savedHandler.current(event);
      } catch (error) {
        console.error(`Error in event handler for "${eventName}":`, error);
      }
    };
    
    const options = eventName.startsWith('touch') || eventName === 'scroll' ? { passive: true } : {};
    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

export function useFetch(url, options = {}) {
  const [state, setState] = React.useState({
    data: undefined,
    loading: false,
    error: undefined,
  });

  const optionsRef = React.useRef(options);

  const execute = React.useCallback(
    async (overrideUrl = url, overrideOptions = {}) => {
      setState((s) => ({ ...s, loading: true, error: undefined }));

      try {
        const response = await fetch(overrideUrl, {
          ...optionsRef.current,
          ...overrideOptions,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setState({ data, loading: false, error: undefined });
        return data;
      } catch (error) {
        setState((s) => ({ ...s, loading: false, error }));
        throw error;
      }
    },
    [url]
  );

  React.useEffect(() => {
    if (url) {
      execute();
    }
  }, [execute, url]);

  return {
    ...state,
    execute,
  };
}

export function useInterval(callback, delay) {
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export function useIntervalWhen(callback, delay, when) {
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (when && delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [when, delay]);
}

export function useKeyPress(targetKey, options = {}) {
  const { target = window } = options;
  const [keyPressed, setKeyPressed] = React.useState(false);

  React.useEffect(() => {
    const downHandler = (event) => {
      if (event.key === targetKey) {
        event.preventDefault();
        setKeyPressed(true);
      }
    };

    const upHandler = (event) => {
      if (event.key === targetKey) {
        event.preventDefault();
        setKeyPressed(false);
      }
    };

    target.addEventListener("keydown", downHandler, { passive: false });
    target.addEventListener("keyup", upHandler, { passive: false });

    return () => {
      target.removeEventListener("keydown", downHandler);
      target.removeEventListener("keyup", upHandler);
    };
  }, [targetKey, target]);

  return [keyPressed, setKeyPressed];
}

export function useLogger(name, options = {}) {
  const { enabled = process.env.NODE_ENV === "development" } = options;

  React.useEffect(() => {
    if (!enabled) return;

    console.log(`[${name}] Component mounted`);

    return () => {
      console.log(`[${name}] Component unmounted`);
    };
  }, [name, enabled]);

  const log = React.useCallback(
    (...args) => {
      if (enabled) {
        console.log(`[${name}]`, ...args);
      }
    },
    [name, enabled]
  );

  const warn = React.useCallback(
    (...args) => {
      if (enabled) {
        console.warn(`[${name}]`, ...args);
      }
    },
    [name, enabled]
  );

  const error = React.useCallback(
    (...args) => {
      if (enabled) {
        console.error(`[${name}]`, ...args);
      }
    },
    [name, enabled]
  );

  return { log, warn, error };
}

export function usePageLeave(onPageLeave, options = {}) {
  const { threshold = 0 } = options;

  React.useEffect(() => {
    const handleMouseLeave = (event) => {
      if (event.clientY <= threshold) {
        onPageLeave?.(event);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [onPageLeave, threshold]);
}

export function useRandomInterval(callback, minDelay, maxDelay) {
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (minDelay !== null && maxDelay !== null) {
      const tick = () => {
        const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        timeoutId.current = setTimeout(tick, delay);
        savedCallback.current();
      };

      let timeoutId = setTimeout(tick, minDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [minDelay, maxDelay]);
}

export function useTimeout(callback, delay) {
  const savedCallback = React.useRef(callback);

  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  React.useEffect(() => {
    if (delay !== null) {
      const id = setTimeout(() => savedCallback.current(), delay);
      return () => clearTimeout(id);
    }
  }, [delay]);
}

export function useThrottle(value, interval = 500) {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastExecuted = React.useRef(Date.now());
  const timeoutRef = React.useRef(null);

  React.useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    const executeThrottle = () => {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    };

    if (timeSinceLastExecution >= interval) {
      executeThrottle();
    } else {
      timeoutRef.current = setTimeout(executeThrottle, interval - timeSinceLastExecution);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, interval]);

  return [throttledValue, setThrottledValue];
}

export function useToggle(initialValue) {
  const [on, setOn] = React.useState(() => {
    if (typeof initialValue === "boolean") {
      return initialValue;
    }

    return Boolean(initialValue);
  });

  const handleToggle = React.useCallback((value) => {
    if (typeof value === "boolean") {
      return setOn(value);
    }

    return setOn((v) => !v);
  }, []);

  return [on, handleToggle];
}

const useVisibilityChangeSubscribe = (callback) => {
  document.addEventListener("visibilitychange", callback);

  return () => {
    document.removeEventListener("visibilitychange", callback);
  };
};

const getVisibilityChangeSnapshot = () => {
  return document.visibilityState;
};

const getVisibilityChangeServerSnapshot = () => {
  throw Error("useVisibilityChange is a client-only hook");
};

export function useVisibilityChange() {
  const visibilityState = React.useSyncExternalStore(
    useVisibilityChangeSubscribe,
    getVisibilityChangeSnapshot,
    getVisibilityChangeServerSnapshot
  );

  return [visibilityState === "visible"];
}

export function useWindowScroll() {
  const [state, setState] = React.useState({
    x: undefined,
    y: undefined,
  });

  const scrollTo = React.useCallback((...args) => {
    if (typeof args[0] === "object") {
      window.scrollTo(args[0]);
    } else if (typeof args[0] === "number" && typeof args[1] === "number") {
      window.scrollTo(args[0], args[1]);
    } else {
      throw new Error(
        `Invalid arguments passed to scrollTo. See here for more info. https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo`
      );
    }
  }, []);

  React.useLayoutEffect(() => {
    const handleScroll = () => {
      setState({ x: window.scrollX, y: window.scrollY });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return [state, scrollTo];
}

export function useWindowSize() {
  const [size, setSize] = React.useState({
    width: undefined,
    height: undefined,
  });

  React.useLayoutEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return [size, setSize];
}
