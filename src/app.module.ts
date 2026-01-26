import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [ConfigModule, TransactionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
