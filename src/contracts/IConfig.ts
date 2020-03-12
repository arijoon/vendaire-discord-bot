interface IConfig {
  root: string;
  admin: string;
  adminId: string;
  images: Map<string, string>;
  api: Map<string, string>;
  content: any;
  app: any;
  isDev: boolean;
  env: string;

  pathFromRoot(...path: string[]): string;
}