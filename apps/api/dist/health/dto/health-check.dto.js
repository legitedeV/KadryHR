"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheckDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class HealthCheckDto {
}
exports.HealthCheckDto = HealthCheckDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'ok',
        description: 'Health status of the API',
    }),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2025-12-25T10:00:00.000Z',
        description: 'Current timestamp',
    }),
    __metadata("design:type", Date)
], HealthCheckDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'kadryhr-api-v2',
        description: 'Service name',
    }),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2.0.0',
        description: 'API version',
    }),
    __metadata("design:type", String)
], HealthCheckDto.prototype, "version", void 0);
//# sourceMappingURL=health-check.dto.js.map