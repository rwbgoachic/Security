import { AuditLogger } from '../audit-logger';

describe('AuditLogger', () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();

  beforeAll(() => {
    global.fetch = mockFetch;
    process.env.AUDIT_SERVICE_URL = 'http://audit:3000';
    process.env.AUDIT_SERVICE_TOKEN = 'test-token';
    process.env.AUDIT_ENCRYPTION_KEY = 'test-key';
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it('should send encrypted audit logs to the configured endpoint', async () => {
    const action = 'test-action';
    const userId = 'test-user';
    const details = { test: 'data' };

    await AuditLogger.log(action, userId, details);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://audit:3000/logs',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: expect.any(String)
      })
    );
  });

  it('should handle failed requests gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await AuditLogger.log('test', 'user', {});

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});