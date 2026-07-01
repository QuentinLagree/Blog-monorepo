import { makeMessage } from 'src/commons/logger/logger.helper';

describe('makeMessage', () => {
  it('should return message with data and undefined meta by default', () => {
    const data = {
      id: 1,
      email: 'test@test.com',
    };

    const response = makeMessage(
      'User found',
      'Utilisateur trouvé',
      data,
    );

    expect(response).toEqual({
      message: 'Utilisateur trouvé',
      data,
      meta: undefined,
    });
  });

  it('should return message with meta', () => {
    const data = [
      {
        id: 1,
        title: 'Post 1',
      },
    ];

    const meta = {
      currentPage: 1,
      limit: 10,
      totalArticle: 1,
    };

    const response = makeMessage(
      'List of posts',
      'Liste des publications',
      data,
      meta,
    );

    expect(response).toEqual({
      message: 'Liste des publications',
      data,
      meta,
    });
  });

  it('should return message with null data', () => {
    const response = makeMessage(
      'No data',
      'Aucune donnée',
      null,
    );

    expect(response).toEqual({
      message: 'Aucune donnée',
      data: null,
      meta: undefined,
    });
  });

  it('should not throw when log option is false', () => {
    expect(() =>
      makeMessage(
        'Log message',
        'Message utilisateur',
        null,
        undefined,
        { log: false },
      ),
    ).not.toThrow();
  });

  it('should not throw when level option is provided', () => {
    const response = makeMessage(
      'Success log',
      'Succès',
      null,
      undefined,
      {
        log: true,
        level: 'Success',
      },
    );

    expect(response).toEqual({
      message: 'Succès',
      data: null,
      meta: undefined,
    });
  });
});