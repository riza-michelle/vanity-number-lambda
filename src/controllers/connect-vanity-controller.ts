import { inject, injectable } from 'inversify';
import { env } from '../config/env';
import type { IVanityNumberService } from '../services/vanity-number-service';
import type { ILogger } from '../types/logger';
import { TYPES } from '../types/symbols';

export interface ConnectVanityResult {
  status: string;
  message: string;
  vanityNumbers: string[];
}

function buildMessage(displays: string[]): string {
  if (displays.length === 0) {
    return 'We could not find vanity numbers for your phone number. Thank you for calling.';
  }
  const options = displays.map((d, i) => `Option ${i + 1}: ${d}`).join('. ');
  return `Hello! Here are your top vanity numbers. ${options}. Thank you for calling.`;
}

@injectable()
export class ConnectVanityController {
  constructor(
    @inject(TYPES.VanityNumberService)
    private readonly svc: IVanityNumberService,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  async process(phone: string): Promise<ConnectVanityResult> {
    try {
      const results = await this.svc.processAndSave(phone, {
        top: env.VANITY_NUMBERS_TO_SAVE,
      });
      const topN = results
        .slice(0, env.VANITY_NUMBERS_TO_RETURN)
        .map((r) => r.display);
      return {
        status: topN.length > 0 ? 'success' : 'no_results',
        message: buildMessage(topN),
        vanityNumbers: topN,
      };
    } catch (err) {
      this.logger.error('Vanity generation failed', { error: err });
      return {
        status: 'error',
        message:
          'We encountered an error processing your request. Thank you for calling.',
        vanityNumbers: [],
      };
    }
  }
}
