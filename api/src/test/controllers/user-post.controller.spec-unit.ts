import { UserService } from 'src/modules/user/user.service';
import { ArticleService } from 'src/modules/post/posts.service';
import { makeMessage } from 'src/commons/logger/logger.helper';
import { CreatePostDto } from 'src/modules/post/dto/create.post.dto';
import { PublishedPostDto } from 'src/modules/post/dto/published-post.dto';
import { PostAlreadyPublishException } from 'src/modules/user/exceptions/post-already-publish.exception';
import { postServiceMock, userServiceMock } from '../mocks/mocks';
import { createPostMock } from '../mocks/create_post.mocks';
import { PostRead } from '@prisma/client';
import { UserActivityController } from 'src/modules/user-activities/user-activities.controller';
import { StatusReadingDto } from 'src/modules/user-activities/dto/status-reading.dto';

describe('UserToPostController', () => {
  let userToPostController: UserActivityController;

  const _userServiceMock = userServiceMock;

  const createPostDtoMock = (override = {}) => ({
    title: 'Post test',
    content: 'Contenu test',
    ...override,
  });

  

  beforeEach(() => {
    jest.clearAllMocks();

    userToPostController = new UserActivityController(
      _userServiceMock as unknown as UserService,
      postServiceMock as unknown as ArticleService,
    );
  });

  describe('likePost', () => {
    it('should add a like and return the updated like status', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const status = {
        liked: true,
        likesCount: 1,
      };

      _userServiceMock.addLike.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.likePost(
        postId,
        sessionMock as any,
      );

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(_userServiceMock.addLike).toHaveBeenCalledWith({
        user_id: userId,
        post_id: postId,
      });

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );

      expect(response).toEqual(
        makeMessage(
          `Like post ${postId}`,
          'Le like a été effectué avec succès.',
          status,
        ),
      );
    });

    it('should return the total number of likes after adding a like', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const status = {
        liked: true,
        likesCount: 5,
      };

      _userServiceMock.addLike.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.likePost(
        postId,
        sessionMock as any,
      );

      expect(response.data).toEqual({
        liked: true,
        likesCount: 5,
      });
    });

    it('should not get like status if adding the like fails', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const error = new Error('Like creation failed');

      _userServiceMock.addLike.mockRejectedValue(error);

      await expect(
        userToPostController.likePost(
          postId,
          sessionMock as any,
        ),
      ).rejects.toThrow(error);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(_userServiceMock.addLike).toHaveBeenCalledWith({
        user_id: userId,
        post_id: postId,
      });

      expect(
        postServiceMock.getLikeStatus,
      ).not.toHaveBeenCalled();
    });

    it('should throw an error if like status retrieval fails after adding the like', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const error = new Error(
        'Like status retrieval failed',
      );

      _userServiceMock.addLike.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockRejectedValue(error);

      await expect(
        userToPostController.likePost(
          postId,
          sessionMock as any,
        ),
      ).rejects.toThrow(error);

      expect(_userServiceMock.addLike).toHaveBeenCalledWith({
        user_id: userId,
        post_id: postId,
      });

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );
    });
  });

  describe('unlikePost', () => {
    it('should remove a like and return the updated like status', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const status = {
        liked: false,
        likesCount: 2,
      };

      _userServiceMock.unlikePost.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.unlikePost(
        postId,
        sessionMock as any,
      );

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(_userServiceMock.unlikePost).toHaveBeenCalledWith({
        user_id: userId,
        post_id: postId,
      });

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );

      expect(response).toEqual(
        makeMessage(
          `Unlike post ${postId}`,
          'Le like a été supprimé avec succès.',
          status,
        ),
      );
    });

    it('should return zero likes after removing the last like', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const status = {
        liked: false,
        likesCount: 0,
      };

      _userServiceMock.unlikePost.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.unlikePost(
        postId,
        sessionMock as any,
      );

      expect(response.data).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should not get like status if removing the like fails', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const error = new Error('Unlike failed');

      _userServiceMock.unlikePost.mockRejectedValue(error);

      await expect(
        userToPostController.unlikePost(
          postId,
          sessionMock as any,
        ),
      ).rejects.toThrow(error);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(_userServiceMock.unlikePost).toHaveBeenCalledWith({
        user_id: userId,
        post_id: postId,
      });

      expect(
        postServiceMock.getLikeStatus,
      ).not.toHaveBeenCalled();
    });

    it('should throw an error if like status retrieval fails after removing the like', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const error = new Error(
        'Like status retrieval failed',
      );

      _userServiceMock.unlikePost.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockRejectedValue(error);

      await expect(
        userToPostController.unlikePost(
          postId,
          sessionMock as any,
        ),
      ).rejects.toThrow(error);

      expect(_userServiceMock.unlikePost).toHaveBeenCalledWith({
        user_id: userId,
        post_id: postId,
      });

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );
    });
  });

  describe('getLikeStatus', () => {
    it('should return liked true if connected user liked the post', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const status = {
        liked: true,
        likesCount: 6,
      };

      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response =
        await userToPostController.getLikeStatus(
          postId,
          sessionMock as any,
        );

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );

      expect(response).toEqual(
        makeMessage(
          `Post like status ${postId}`,
          "Statut du like de l'article.",
          status,
        ),
      );
    });

    it('should return liked false if connected user did not like the post', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const status = {
        liked: false,
        likesCount: 3,
      };

      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response =
        await userToPostController.getLikeStatus(
          postId,
          sessionMock as any,
        );

      expect(response.data).toEqual({
        liked: false,
        likesCount: 3,
      });
    });

    it('should return zero when the post has no likes', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const status = {
        liked: false,
        likesCount: 0,
      };

      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response =
        await userToPostController.getLikeStatus(
          postId,
          sessionMock as any,
        );

      expect(response.data).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should use the user id from the session and the post id from the route', async () => {
      const userId = 25;
      const postId = 75;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      postServiceMock.getLikeStatus.mockResolvedValue({
        liked: false,
        likesCount: 0,
      });

      await userToPostController.getLikeStatus(
        postId,
        sessionMock as any,
      );

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );
    });

    it('should throw an error if like status retrieval fails', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const error = new Error(
        'Like status retrieval failed',
      );

      postServiceMock.getLikeStatus.mockRejectedValue(error);

      await expect(
        userToPostController.getLikeStatus(
          postId,
          sessionMock as any,
        ),
      ).rejects.toThrow(error);

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );
    });
  });

  describe('public getLikeCount', () => {
    it('should return liked true if connected user liked the post', async () => {
      const postId = 10;

      const status = {
        liked: true,
        likesCount: 6,
      };

      postServiceMock.getLikeCount.mockResolvedValue(status);

      const response =
        await userToPostController.getProfilLikeCount(
          postId,
        );

      expect(postServiceMock.getLikeCount).toHaveBeenCalledWith(
        postId,
      );

      expect(response).toEqual(
        makeMessage(
          `Public post count status ${postId}`,
          "Nombre de like de l'article.",
          status,
        )
      );
  });

  it('should return liked false if connected user did not like the post', async () => {
    const postId = 10;

    const status = {
      liked: false,
      likesCount: 3,
    };

    postServiceMock.getLikeCount.mockResolvedValue(status);

    const response =
      await userToPostController.getProfilLikeCount(
        postId,
      );

    expect(response.data).toEqual({
      liked: false,
      likesCount: 3,
    });
  });

  it('should return zero when the post has no likes', async () => {
    const postId = 10;

    const status = {
      liked: false,
      likesCount: 0,
    };

    postServiceMock.getLikeCount.mockResolvedValue(status);

    const response =
      await userToPostController.getProfilLikeCount(
        postId,
      );

    expect(response.data).toEqual({
      liked: false,
      likesCount: 0,
    });
  });

  it('should use the post id from the route', async () => {
    const postId = 75;

    postServiceMock.getLikeCount.mockResolvedValue({
      liked: false,
      likesCount: 0,
    });

    await userToPostController.getProfilLikeCount(
      postId,
    );

    expect(postServiceMock.getLikeCount).toHaveBeenCalledWith(
      postId,
    );
  });

  it('should throw an error if like status retrieval fails', async () => {
    const postId = 10;

    const error = new Error(
      'Like status retrieval failed',
    );

    postServiceMock.getLikeCount.mockRejectedValue(error);

    await expect(
      userToPostController.getProfilLikeCount(
        postId,
      ),
    ).rejects.toThrow(error);

    expect(postServiceMock.getLikeCount).toHaveBeenCalledWith(
      postId,
    );
  });
});

describe('getReadingStatus', () => {
  it(
    'doit retourner le statut de lecture de l’article',
    async () => {
      const postId = 42;
      const sessionUser = {
        id: 1,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: 1,
        }),
      };
      const readingStatus: StatusReadingDto = {
        hasStarted: true,
        completed: false,
        progress: 45,
      };

      postServiceMock
        .getReadingStatus
        .mockResolvedValue(
          readingStatus,
        );

      const result =
        await userToPostController.getReadingStatus(
          postId,
          sessionMock as never,
        );

      expect(
        sessionMock.get,
      ).toHaveBeenCalledTimes(1);

      expect(
        sessionMock.get,
      ).toHaveBeenCalledWith(
        'user',
      );

      expect(
        postServiceMock.getReadingStatus,
      ).toHaveBeenCalledTimes(1);

      expect(
        postServiceMock.getReadingStatus,
      ).toHaveBeenCalledWith(
        sessionUser.id,
        postId,
      );

      expect(result).toEqual(
        expect.objectContaining({
          data: readingStatus,
        }),
      );
    },
  );

  it(
    'doit propager une erreur du service',
    async () => {
      const postId = 42;
      const sessionUser = {
        id: 1,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: 1,
        }),
      };

      const serviceError =
        new Error(
          'Impossible de récupérer le statut.',
        );

      postServiceMock
        .getReadingStatus
        .mockRejectedValue(
          serviceError,
        );

      await expect(
        userToPostController.getReadingStatus(
          postId,
          sessionMock as never,
        ),
      ).rejects.toThrow(
        serviceError,
      );

      expect(
        postServiceMock.getReadingStatus,
      ).toHaveBeenCalledWith(
        sessionUser.id,
        postId,
      );
    },
  );
});

describe('updateReadingProgress', () => {
  it(
    'doit mettre à jour la progression de lecture',
    async () => {
      const postId = 42;
      const sessionUser = {
        id: 1,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: 1,
        }),
      };

      const payload = {
        progress: 65,
      };

      const postRead: PostRead = {
        id: 7,
        userId: sessionUser.id,
        postId,
        progress: payload.progress,
        completed: false,
        readAt: new Date(),
      };

      postServiceMock
        .updateReadingProgress
        .mockResolvedValue(
          postRead,
        );

      const result =
        await userToPostController.updateReadingProgress(
          postId,
          payload,
          sessionMock as never,
        );

      expect(
        sessionMock.get,
      ).toHaveBeenCalledWith(
        'user',
      );

      expect(
        postServiceMock.updateReadingProgress,
      ).toHaveBeenCalledTimes(1);

      expect(
        postServiceMock.updateReadingProgress,
      ).toHaveBeenCalledWith(
        sessionUser.id,
        postId,
        payload.progress,
      );

      expect(result).toEqual(
        expect.objectContaining({
          data: postRead,
        }),
      );
    },
  );

  it(
    'doit transmettre une progression de 100',
    async () => {
      const postId = 42;

      const sessionUser = {
        id: 1,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: 1,
        }),
      };

      const payload = {
        progress: 100,
      };

      const postRead: PostRead = {
        id: 7,
        userId: sessionUser.id,
        postId,
        progress: 100,
        completed: true,
        readAt: new Date(),
      };

      postServiceMock
        .updateReadingProgress
        .mockResolvedValue(
          postRead,
        );

      await userToPostController.updateReadingProgress(
        postId,
        payload,
        sessionMock as never,
      );

      expect(
        postServiceMock.updateReadingProgress,
      ).toHaveBeenCalledWith(
        sessionUser.id,
        postId,
        100,
      );
    },
  );

  it(
    'doit propager une erreur du service',
    async () => {
      const postId = 42;
      const sessionUser = {
        id: 1,
      };

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: 1,
        }),
      };

      const payload = {
        progress: 40,
      };

      const serviceError =
        new Error(
          'Impossible de mettre à jour la progression.',
        );

      postServiceMock
        .updateReadingProgress
        .mockRejectedValue(
          serviceError,
        );

      await expect(
        userToPostController.updateReadingProgress(
          postId,
          payload,
          sessionMock as never,
        ),
      ).rejects.toThrow(
        serviceError,
      );
    },
  );
});

});