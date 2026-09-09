import { container } from '../../container';
import type {
  ConnectVanityController,
  ConnectVanityResult,
} from '../../controllers/connect-vanity-controller';
import { TYPES } from '../../types/symbols';

interface ConnectEndpoint {
  Address: string;
  Type: string;
}

export interface ConnectEvent {
  Name: string;
  Details: {
    ContactData: {
      ContactId: string;
      Channel: string;
      InstanceARN: string;
      CustomerEndpoint: ConnectEndpoint;
      SystemEndpoint: ConnectEndpoint;
      Attributes: Record<string, string>;
    };
    Parameters: Record<string, string>;
  };
}

export function makeConnectHandler(controller: ConnectVanityController) {
  return async (event: ConnectEvent): Promise<ConnectVanityResult> => {
    const phone = event.Details?.ContactData?.CustomerEndpoint?.Address;

    if (!phone) {
      return {
        status: 'no_caller_id',
        message:
          'We could not determine your phone number. Thank you for calling.',
        vanityNumbers: [],
      };
    }

    return controller.process(phone);
  };
}

export const handler = makeConnectHandler(
  container.get<ConnectVanityController>(TYPES.ConnectVanityController),
);
