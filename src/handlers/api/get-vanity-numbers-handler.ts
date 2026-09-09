import middy from '@middy/core';
import httpCors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { z } from 'zod';
import { container } from '../../container';
import type { VanityNumberController } from '../../controllers/vanity-number-controller';
import { TYPES } from '../../types/symbols';

const limitSchema = z.coerce.number().int().min(1).max(20).default(5);

function json(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function makeHandler(controller: VanityNumberController) {
  const baseHandler = async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyResultV2> => {
    const parsed = limitSchema.safeParse(event.queryStringParameters?.limit);

    if (!parsed.success) {
      return json(400, { error: 'limit must be an integer between 1 and 20' });
    }

    return json(200, await controller.getRecent(parsed.data));
  };

  return middy(baseHandler).use(httpCors()).use(httpErrorHandler());
}

export const handler = makeHandler(
  container.get<VanityNumberController>(TYPES.VanityNumberController),
);
