export function createApiHandler(request: Request) {
  return {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: undefined as unknown,
  };
}

export function createResponseHelper() {
  const headers: Record<string, string | string[]> = {};
  return {
    statusCode: 200,
    headers,
    setHeader(name: string, value: string | string[]) {
      headers[name] = value;
    },
    getHeader(name: string) {
      return headers[name];
    },
    removeHeader(name: string) {
      delete headers[name];
    },
  };
}
