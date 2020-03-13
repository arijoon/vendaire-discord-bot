import { injectable, inject } from 'inversify';
import { TYPES } from '../ioc/types';

@injectable()
export class PermissionService implements IPermission {

  constructor(
    @inject(TYPES.IConfig) private _config: IConfig,
    @inject(TYPES.IBasicCache) private _cache: IBasicCache
  ) { }

  isAdmin(userId: string): boolean {
    return userId === this._config.adminId;
  }

  verifyAdmin(username: string, userId: string): void {
    if (username.toLowerCase().trim() === this._config.admin
      && !this.isAdmin(userId)) {

      throw new Error(`Admin ABUSE ${userId}`)
      }
  }

  async hasPerm(perm: string, userId: string): Promise<boolean> {
    const key = this.makeKey(userId);

    try {
      const perms: any = JSON.parse(await this._cache.get(key));
      if (perms[perm]) {
        return true
      }
    } catch (err) { /* Catch error */ };

    return false;
  }

  async addPerm(perm: string, userId: string): Promise<void> {
    const key = this.makeKey(userId);

    const json = await this._cache.get(key);
    const perms = (json && JSON.parse(json)) || {};

    perms[perm] = true;

    await this._cache.set(key, JSON.stringify(perms));
  }

  async removePerm(perm: string, userId: string): Promise<void> {
    const key = this.makeKey(userId);

    const perms = JSON.parse(await this._cache.get(key));

    delete perms[perm];

    await this._cache.set(key, JSON.stringify(perms));
  }

  private makeKey(userId: string): string {
    return `PERM:${userId}`;
  }
}
