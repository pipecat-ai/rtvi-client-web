import { Client, BotNotReadyError } from ".";

export function transportReady<T extends Client>(
  _target: T,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
): PropertyDescriptor | void {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: T, ...args: any[]) {
    if (this.state === "ready") {
      return originalMethod.apply(this, args);
    } else {
      throw new BotNotReadyError(
        `Attempt to call ${propertyKey.toString()} when transport not in ready state. Await start() first.`
      );
    }
  };

  return descriptor;
}
export function transportInState<T extends Client>(states: string[]) {
  return function (
    _target: T,
    propertyKey: string | Symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor | void {
    const originalMethod = descriptor.value;

    descriptor.get = function (this: T, ...args: any[]) {
      if (states.includes(this.state)) {
        return originalMethod.apply(this, args);
      } else {
        throw new BotNotReadyError(
          `Attempt to call ${propertyKey.toString()} when transport not in ${states}.`
        );
      }
    };

    return descriptor;
  };
}

export function getIfTransportInState<T extends Client>(...states: string[]) {
  states = ["ready", ...states];

  return function (
    _target: T,
    propertyKey: string | Symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor | void {
    const originalGetter = descriptor.get;

    descriptor.get = function (this: T) {
      if (states.includes(this.state)) {
        return originalGetter?.apply(this);
      } else {
        throw new BotNotReadyError(
          `Attempt to call ${propertyKey.toString()} when transport not in ${states}. Await start() first.`
        );
      }
    };

    return descriptor;
  };
}
