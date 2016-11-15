
export class DeferredPromise<T> {
  public promise: Promise<T>;
  public resolve: (val: T) => void;
  public reject: (reason: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}