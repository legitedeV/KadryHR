# Run log — employees status + document lifecycle

- Added `Employee.status` lifecycle enum: `ACTIVE | SUSPENDED | ARCHIVED`.
- Default employee list behavior now excludes archived employees.
- Org employee ordering source now excludes archived employees.
- Employee deactivation/activation/removal now sync status lifecycle.
- Document metadata lifecycle updated to `DRAFT | ACTIVE | EXPIRED`.
- Added e2e coverage in `backend-v2/src/test/employee-status.e2e-spec.ts` for:
  - archive employee hidden from default list and grafik source
  - document metadata status transitions visible via API
