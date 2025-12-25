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
exports.VersionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const version_dto_1 = require("./dto/version.dto");
let VersionController = class VersionController {
    getVersion() {
        return {
            version: '2.0.0',
            apiVersion: 'v2',
            name: 'KadryHR API',
            description: 'Modern HR Management System API',
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            buildDate: new Date('2025-12-25'),
        };
    }
};
exports.VersionController = VersionController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get API version information' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Version information',
        type: version_dto_1.VersionDto,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", version_dto_1.VersionDto)
], VersionController.prototype, "getVersion", null);
exports.VersionController = VersionController = __decorate([
    (0, swagger_1.ApiTags)('version'),
    (0, common_1.Controller)('version')
], VersionController);
//# sourceMappingURL=version.controller.js.map