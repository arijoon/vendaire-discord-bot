export function unauthorized() {
  throw new Error("401");
}

export function getSession(req): ISession {
  return req.session;
}