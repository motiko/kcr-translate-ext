export async function waitUntilNotNull<T>(getter: () => T | null): Promise<T> {
  return await new Promise<T>((resolve) => {
    const interval = setInterval(() => {
      const obj = getter();
      if (obj) {
        clearInterval(interval);
        resolve(obj);
      }
    }, 2000);
  });
}
