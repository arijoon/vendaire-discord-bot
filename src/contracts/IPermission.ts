/**
 * Permission system interface
 */
interface IPermission {
  /**
   * Determines if username is admin
   * @param username username
   */
  isAdmin(username: string): boolean

  /**
   * Verifies if admin username is not being abused
   */
  verifyAdmin(username: string, userId: string): void

  /**
   * Checks if userid has the perm key
   * @param perm Permission key
   * @param userId userId
   */
  hasPerm(perm: string, userId: string): Promise<boolean>

  /**
   * Adds the permission to the user
   * @param perm Permission key
   * @param userId userId
   */
  addPerm(perm: string, userId: string): Promise<void>;

  /**
   * removes the permission to the user
   * @param perm Permission key
   * @param userId userId
   */
  removePerm(perm: string, userId: string): Promise<void>
}