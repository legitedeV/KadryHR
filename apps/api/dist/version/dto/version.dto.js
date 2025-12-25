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
exports.VersionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class VersionDto {
}
exports.VersionDto = VersionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2.0.0',
        description: 'Application version',
    }),
    __metadata("design:type", String)
], VersionDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'v2',
        description: 'API version prefix',
    }),
    __metadata("design:type", String)
], VersionDto.prototype, "apiVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'KadryHR API',
        description: 'Application name',
    }),
    __metadata("design:type", String)
], VersionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Modern HR Management System API',
        description: 'Application description',
    }),
    __metadata("design:type", String)
], VersionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'development',
        description: 'Current environment',
    }),
    __metadata("design:type", String)
], VersionDto.prototype, "environment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'v22.0.0',
        description: 'Node.js version',
    }),
    __metadata("design:type", String)
], VersionDto.prototype, "nodeVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2025-12-25T00:00:00.000Z',
        description: 'Build date',
    }),
    __metadata("design:type", Date)
], VersionDto.prototype, "buildDate", void 0);
//# sourceMappingURL=version.dto.js.map