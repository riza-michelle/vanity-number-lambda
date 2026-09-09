import 'reflect-metadata';
import { Logger } from '@aws-lambda-powertools/logger';
import { Container } from 'inversify';
import { ConnectVanityController } from './controllers/connect-vanity-controller';
import { VanityNumberController } from './controllers/vanity-number-controller';
import type { ICallerRecordRepository } from './db/callers-repository';
import { CallerRecordDDBRepository } from './db/callers-repository';
import type { IVanityNumberService } from './services/vanity-number-service';
import { VanityNumberService } from './services/vanity-number-service';
import type { ILogger } from './types/logger';
import { TYPES } from './types/symbols';

const container = new Container();

container
  .bind<ILogger>(TYPES.Logger)
  .toConstantValue(new Logger({ serviceName: 'vanity-number-lambda' }));

container
  .bind<ICallerRecordRepository>(TYPES.CallerRecordRepository)
  .to(CallerRecordDDBRepository)
  .inSingletonScope();

container
  .bind<IVanityNumberService>(TYPES.VanityNumberService)
  .to(VanityNumberService)
  .inSingletonScope();

container
  .bind<ConnectVanityController>(TYPES.ConnectVanityController)
  .to(ConnectVanityController)
  .inSingletonScope();

container
  .bind<VanityNumberController>(TYPES.VanityNumberController)
  .to(VanityNumberController)
  .inSingletonScope();

export { container };
