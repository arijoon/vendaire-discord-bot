export interface IPermission {
    isAdmin(username: string): boolean
}