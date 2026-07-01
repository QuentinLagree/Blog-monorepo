import 'reflect-metadata';
import { ROLES_KEY, Roles } from 'src/commons/decorators/role.decorator';
import { Role } from 'src/commons/roles/role.enum';

describe('Roles decorator', () => {
  it('should define roles metadata on method', () => {
    class TestController {
      @Roles(Role.Admin)
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype.testMethod,
    );

    expect(metadata).toEqual([Role.Admin]);
  });

  it('should define multiple roles metadata on method', () => {
    class TestController {
      @Roles(Role.Admin, Role.User)
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype.testMethod,
    );

    expect(metadata).toEqual([Role.Admin, Role.User]);
  });
});