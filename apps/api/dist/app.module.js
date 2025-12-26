"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./auth/auth.module");
const health_module_1 = require("./health/health.module");
const prisma_module_1 = require("./prisma/prisma.module");
const version_module_1 = require("./version/version.module");
const schedule_module_1 = require("./schedule/schedule.module");
const notifications_module_1 = require("./notifications/notifications.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const employees_module_1 = require("./employees/employees.module");
const invites_module_1 = require("./invites/invites.module");
const permissions_module_1 = require("./permissions/permissions.module");
const leaves_module_1 = require("./leaves/leaves.module");
const time_tracking_module_1 = require("./time-tracking/time-tracking.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            notifications_module_1.NotificationsModule,
            auth_module_1.AuthModule,
            health_module_1.HealthModule,
            version_module_1.VersionModule,
            schedule_module_1.ScheduleModule,
            dashboard_module_1.DashboardModule,
            employees_module_1.EmployeesModule,
            invites_module_1.InvitesModule,
            permissions_module_1.PermissionsModule,
            leaves_module_1.LeavesModule,
            time_tracking_module_1.TimeTrackingModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map