import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { VanityNumberController } from '../../controllers/vanity-number-controller';
import { makeHandler } from './get-vanity-numbers-handler';

const MOCK_RESULT = {
  callers: [
    {
      phoneNumber: '+18003569377',
      topVanityNumbers: [{ display: '1-800-FLOWERS', spelled: ['FLOWERS'], score: 343 }],
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  count: 1,
};

function makeEvent(params?: Record<string, string>): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'GET /callers',
    rawPath: '/callers',
    rawQueryString: '',
    requestContext: {
      http: { method: 'GET', path: '/callers', protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'test' },
    } as APIGatewayProxyEventV2['requestContext'],
    isBase64Encoded: false,
    queryStringParameters: params,
  } as APIGatewayProxyEventV2;
}

const ctx = {} as Context;

describe('get-vanity-numbers-handler', () => {
  let mockGetRecent: Mock;
  let mockController: VanityNumberController;

  beforeEach(() => {
    mockGetRecent = vi.fn().mockResolvedValue(MOCK_RESULT);
    mockController = { getRecent: mockGetRecent } as unknown as VanityNumberController;
  });

  describe('limit defaults', () => {
    it('uses 5 when no limit param is provided', async () => {
      const h = makeHandler(mockController);
      await h(makeEvent(), ctx);
      expect(mockGetRecent).toHaveBeenCalledWith(5);
    });

    it('parses a valid limit', async () => {
      const h = makeHandler(mockController);
      await h(makeEvent({ limit: '10' }), ctx);
      expect(mockGetRecent).toHaveBeenCalledWith(10);
    });

    it('accepts the boundary values 1 and 20', async () => {
      const h = makeHandler(mockController);
      await h(makeEvent({ limit: '1' }), ctx);
      expect(mockGetRecent).toHaveBeenCalledWith(1);

      await h(makeEvent({ limit: '20' }), ctx);
      expect(mockGetRecent).toHaveBeenCalledWith(20);
    });
  });

  describe('invalid limit — returns 400', () => {
    it('returns 400 when limit exceeds 20', async () => {
      const h = makeHandler(mockController);
      const res = await h(makeEvent({ limit: '21' }), ctx);
      expect(res.statusCode).toBe(400);
      expect(mockGetRecent).not.toHaveBeenCalled();
    });

    it('returns 400 when limit is 0', async () => {
      const h = makeHandler(mockController);
      const res = await h(makeEvent({ limit: '0' }), ctx);
      expect(res.statusCode).toBe(400);
      expect(mockGetRecent).not.toHaveBeenCalled();
    });

    it('returns 400 when limit is negative', async () => {
      const h = makeHandler(mockController);
      const res = await h(makeEvent({ limit: '-5' }), ctx);
      expect(res.statusCode).toBe(400);
      expect(mockGetRecent).not.toHaveBeenCalled();
    });

    it('returns 400 when limit is not a number', async () => {
      const h = makeHandler(mockController);
      const res = await h(makeEvent({ limit: 'abc' }), ctx);
      expect(res.statusCode).toBe(400);
      expect(mockGetRecent).not.toHaveBeenCalled();
    });

    it('returns 400 when limit is a float', async () => {
      const h = makeHandler(mockController);
      const res = await h(makeEvent({ limit: '2.5' }), ctx);
      expect(res.statusCode).toBe(400);
      expect(mockGetRecent).not.toHaveBeenCalled();
    });

    it('includes an error message in the 400 body', async () => {
      const h = makeHandler(mockController);
      const res = await h(makeEvent({ limit: '99' }), ctx);
      const body = JSON.parse(res.body as string);
      expect(body.error).toBe('limit must be an integer between 1 and 20');
    });
  });

  describe('response shape', () => {
    it('returns 200 with the controller result as JSON', async () => {
      const h = makeHandler(mockController);
      const res = await h(makeEvent(), ctx);
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body as string)).toEqual(MOCK_RESULT);
    });

    it('sets Content-Type to application/json', async () => {
      const h = makeHandler(mockController);
      const res = await h(makeEvent(), ctx);
      expect((res.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });
  });
});
