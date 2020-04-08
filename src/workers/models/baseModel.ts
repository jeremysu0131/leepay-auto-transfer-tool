export class BaseModel<T> {
  public constructor(init?: Partial<T>) {
    Object.assign(this, init);
  }
}
