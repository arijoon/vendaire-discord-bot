interface ISessionManager {
  /**
   * Generate a session for a user
   * @param userId Unique userId
   */
  genSession(userId: string): Promise<ISession>;

  /**
   * generate a one time use session for a user
   * @param userId Unique userId
   */
  genSingleSession(userId: string): Promise<ISessionSingle>;

  /**
   * Discard a singleSession
   * @param sessionId sessionId for a single session to use and discard
   */
  useSingle(sessionId: string): Promise<void>;

  /**
   * Validates a sessionId, if singleSession it'll be expired
   * @param sessionId 
   */
  isValid(sessionId: string): Promise<{status: boolean, session: ISession}>;
}

interface ISession {
  readonly user: string;
  readonly id: string;
  readonly expiry: number;
  readonly timestamp: number;
}

interface ISessionSingle extends ISession {
  readonly singleUsedAt: number;
}

