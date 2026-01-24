import { Module } from "@nestjs/common";
import { RcpController } from "./rcp.controller";
import { RcpService } from "./rcp.service";

@Module({
  controllers: [RcpController],
  providers: [RcpService],
})
export class RcpModule {}
