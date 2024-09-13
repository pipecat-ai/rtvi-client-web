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
