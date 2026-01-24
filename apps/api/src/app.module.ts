import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { LeadsModule } from "./leads/leads.module";

@Module({
  imports: [LeadsModule],
  controllers: [AppController],
})
export class AppModule {}
