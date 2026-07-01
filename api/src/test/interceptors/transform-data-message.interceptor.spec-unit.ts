import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { Exclude, Expose } from 'class-transformer';
import { TransformDataMessageIntoObjectSerialization } from 'src/commons/interceptors/transform_data_message_into_object_serialization.interceptor';

class TestUserEntity {
  id: number;
  email: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<TestUserEntity>) {
    Object.assign(this, partial);
  }
}

class TestPostEntity {
  id: number;
  title: string;
  content: string;

  constructor(partial: Partial<TestPostEntity>) {
    Object.assign(this, partial);
  }
}

describe('TransformDataMessageIntoObjectSerialization', () => {
  const contextMock = {} as ExecutionContext;

  const createCallHandlerMock = (response: any): CallHandler => {
    return {
      handle: jest.fn().mockReturnValue(of(response)),
    };
  };

  it('should transform object data into target class instance', async () => {
    const interceptor = new TransformDataMessageIntoObjectSerialization([
      TestUserEntity,
    ]);

    const response = {
      message: 'Utilisateur trouvé',
      data: {
        id: 1,
        email: 'test@test.com',
        password: 'secret',
      },
      meta: undefined,
    };

    const next = createCallHandlerMock(response);

    const result = await lastValueFrom(
      interceptor.intercept(contextMock, next),
    );

    expect(result.data).toBeInstanceOf(TestUserEntity);
    expect(result.data).toMatchObject({
      id: 1,
      email: 'test@test.com',
    });
  });

  it('should transform array data into target class instances', async () => {
    const interceptor = new TransformDataMessageIntoObjectSerialization([
      TestUserEntity,
    ]);

    const response = {
      message: 'Liste des utilisateurs',
      data: [
        {
          id: 1,
          email: 'test1@test.com',
          password: 'secret1',
        },
        {
          id: 2,
          email: 'test2@test.com',
          password: 'secret2',
        },
      ],
      meta: undefined,
    };

    const next = createCallHandlerMock(response);

    const result = await lastValueFrom(
      interceptor.intercept(contextMock, next),
    );

    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toBeInstanceOf(TestUserEntity);
    expect(result.data[1]).toBeInstanceOf(TestUserEntity);
  });

  it('should keep null data unchanged', async () => {
    const interceptor = new TransformDataMessageIntoObjectSerialization([
      TestUserEntity,
    ]);

    const response = {
      message: 'Aucune donnée',
      data: null,
      meta: undefined,
    };

    const next = createCallHandlerMock(response);

    const result = await lastValueFrom(
      interceptor.intercept(contextMock, next),
    );

    expect(result).toEqual(response);
    expect(result.data).toBeNull();
  });

  it('should keep empty array unchanged', async () => {
    const interceptor = new TransformDataMessageIntoObjectSerialization([
      TestUserEntity,
    ]);

    const response = {
      message: 'Liste vide',
      data: [],
      meta: undefined,
    };

    const next = createCallHandlerMock(response);

    const result = await lastValueFrom(
      interceptor.intercept(contextMock, next),
    );

    expect(result.data).toEqual([]);
  });

  it('should keep response unchanged if response has no data property', async () => {
    const interceptor = new TransformDataMessageIntoObjectSerialization([
      TestUserEntity,
    ]);

    const response = {
      message: 'Simple response',
    };

    const next = createCallHandlerMock(response);

    const result = await lastValueFrom(
      interceptor.intercept(contextMock, next),
    );

    expect(result).toEqual(response);
  });

  it('should pick the first target class as fallback', async () => {
    const interceptor = new TransformDataMessageIntoObjectSerialization([
      TestUserEntity,
      TestPostEntity,
    ]);

    const response = {
      message: 'Unknown data',
      data: {
        unknown: true,
      },
      meta: undefined,
    };

    const next = createCallHandlerMock(response);

    const result = await lastValueFrom(
      interceptor.intercept(contextMock, next),
    );

    expect(result.data).toBeInstanceOf(TestUserEntity);
  });
});