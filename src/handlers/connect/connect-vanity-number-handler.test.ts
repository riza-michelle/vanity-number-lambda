import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConnectVanityController } from '../../controllers/connect-vanity-controller';
import {
  type ConnectEvent,
  makeConnectHandler,
} from './connect-vanity-number-handler';

const MOCK_RESULT = {
  status: 'success',
  message:
    'Hello! Here are your top vanity numbers. Option 1: 1-800-FLOWERS. Thank you for calling.',
  vanityNumbers: ['1-800-FLOWERS', '1-800-FLOWER-7', '1-800-3-LOWERS'],
};

function makeEvent(address: string | undefined = '+18003569377'): ConnectEvent {
  return {
    Name: 'ContactFlowEvent',
    Details: {
      ContactData: {
        ContactId: 'test-contact',
        Channel: 'VOICE',
        InstanceARN: 'arn:aws:connect:us-east-1:123456789012:instance/test',
        CustomerEndpoint: {
          Address: address as string,
          Type: 'TELEPHONE_NUMBER',
        },
        SystemEndpoint: { Address: '+18005550100', Type: 'TELEPHONE_NUMBER' },
        Attributes: {},
      },
      Parameters: {},
    },
  };
}

describe('connect-vanity-number-handler', () => {
  let mockController: ConnectVanityController;
  let h: ReturnType<typeof makeConnectHandler>;

  beforeEach(() => {
    mockController = {
      process: vi.fn().mockResolvedValue(MOCK_RESULT),
    } as unknown as ConnectVanityController;
    h = makeConnectHandler(mockController);
  });

  it('extracts phone from the event and calls the controller', async () => {
    await h(makeEvent('+18003569377'));
    expect(mockController.process).toHaveBeenCalledWith('+18003569377');
  });

  it('passes the controller result through', async () => {
    const res = await h(makeEvent());
    expect(res).toEqual(MOCK_RESULT);
  });

  it('returns no_caller_id without calling the controller when address is empty', async () => {
    const event = makeEvent(undefined);
    event.Details.ContactData.CustomerEndpoint = {
      Address: '',
      Type: 'TELEPHONE_NUMBER',
    };
    const res = await h(event);
    expect(res.status).toBe('no_caller_id');
    expect(mockController.process).not.toHaveBeenCalled();
  });
});
