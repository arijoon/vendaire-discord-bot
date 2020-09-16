interface IDependency {
  poll(): Promise<any>;
  getName(): string;
}