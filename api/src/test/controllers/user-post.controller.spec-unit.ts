import { UserService } from 'src/modules/user/user.service';
import { ArticleService } from 'src/modules/post/posts.service';
import {
  postServiceMock as sharedPostMock,
  userServiceMock,
} from '../mocks/mocks';
const postServiceMock = { ...sharedPostMock, showForReader: jest.fn() };
import { UserActivityController } from 'src/modules/user-activities/user-activities.controller';
import { StatusReadingDto } from 'src/modules/user-activities/dto/status-reading.dto';

describe('UserActivityController', () => {
  let userToPostController: UserActivityController;

  const _userServiceMock = userServiceMock;

  beforeEach(() => {
    jest.resetAllMocks();

    userToPostController = new UserActivityController(
      _userServiceMock as unknown as UserService,
      postServiceMock as unknown as ArticleService,
    );
  });

  describe('likePost', () => {
    it('should add a like and return the updated like status', async () => {
      const userId = 1;
      const postId = 10;

      const currentUser = { id: userId, email: 'test@test.com', role: 'user' };

      const status = {
        liked: true,
        likesCount: 1,
      };

      _userServiceMock.addLike.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.likePost(postId, currentUser);

      expect(_userServiceMock.addLike).toHaveBeenCalledWith({
        user_id: userId,
        post_id: postId,
      });

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );

      expect(response).toEqual({
        message: 'Le like a été effectué avec succès.',
        data: status,
        meta: undefined,
      });
    });

    it('should return the total number of likes after adding a like', async () => {
      const userId = 1;
      const postId = 10;

      const currentUser = { id: userId, email: 'test@test.com', role: 'user' };

      const status = {
        liked: true,
        likesCount: 5,
      };

      _userServiceMock.addLike.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.likePost(postId, currentUser);

      expect(response.data).toEqual({
        liked: true,
        likesCount: 5,
      });
    });

    it('should not get like status if adding the like fails', async () => {
      const userId = 1;
      const postId = 10;

      const currentUser = { id: userId, email: 'test@test.com', role: 'user' };

      const error = new Error('Like creation failed');

      _userServiceMock.addLike.mockRejectedValue(error);

      await expect(
        userToPostController.likePost(postId, currentUser),
      ).rejects.toThrow(error);

      expect(_userServiceMock.addLike).toHaveBeenCalledWith({
        user_id: userId,
        post_id: postId,
      });

      expect(postServiceMock.getLikeStatus).not.toHaveBeenCalled();
    });

    it('should throw an error if like status retrieval fails after adding the like', async () => {
      const userId = 1;
      const postId = 10;

      const currentUser = { id: userId, email: 'test@test.com', role: 'user' };

      const error = new Error('Like status retrieval failed');

      _userServiceMock.addLike.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockRejectedValue(error);

      await expect(
        userToPostController.likePost(postId, currentUser),
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

      expect(response).toEqual({
        message: 'Le like a été supprimé avec succès.',
        data: status,
        meta: undefined,
      });
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
        userToPostController.unlikePost(postId, sessionMock as any),
      ).rejects.toThrow(error);

      expect(sessionMock.get).toHaveBeenCalledWith('user');

      expect(_userServiceMock.unlikePost).toHaveBeenCalledWith({
        user_id: userId,
        post_id: postId,
      });

      expect(postServiceMock.getLikeStatus).not.toHaveBeenCalled();
    });

    it('should throw an error if like status retrieval fails after removing the like', async () => {
      const userId = 1;
      const postId = 10;

      const sessionMock = {
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      };

      const error = new Error('Like status retrieval failed');

      _userServiceMock.unlikePost.mockResolvedValue(undefined);
      postServiceMock.getLikeStatus.mockRejectedValue(error);

      await expect(
        userToPostController.unlikePost(postId, sessionMock as any),
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
    it('should return the public status after checking article visibility', async () => {
      const status = { liked: false, likesCount: 4 };
      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.getLikeStatus(10, undefined);

      expect(postServiceMock.showForReader).toHaveBeenCalledWith(
        { id: 10 },
        undefined,
      );
      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(undefined, 10);
      expect(response.data).toEqual(status);
    });

    it('should not retrieve likes when the article is inaccessible', async () => {
      const error = new Error('Article inaccessible');
      postServiceMock.showForReader.mockRejectedValue(error);
      await expect(
        userToPostController.getLikeStatus(10, undefined),
      ).rejects.toThrow(error);
      expect(postServiceMock.getLikeStatus).not.toHaveBeenCalled();
    });

    it('should return liked true if connected user liked the post', async () => {
      const userId = 1;
      const postId = 10;

      const currentUser = { id: userId, email: 'test@test.com', role: 'user' };

      const status = {
        liked: true,
        likesCount: 6,
      };

      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.getLikeStatus(
        postId,
        currentUser,
      );

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );

      expect(response).toEqual({
        message: "Statut du like de l'article.",
        data: status,
        meta: undefined,
      });
    });

    it('should return liked false if connected user did not like the post', async () => {
      const userId = 1;
      const postId = 10;

      const currentUser = { id: userId, email: 'test@test.com', role: 'user' };

      const status = {
        liked: false,
        likesCount: 3,
      };

      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.getLikeStatus(
        postId,
        currentUser,
      );

      expect(response.data).toEqual({
        liked: false,
        likesCount: 3,
      });
    });

    it('should return zero when the post has no likes', async () => {
      const userId = 1;
      const postId = 10;

      const currentUser = { id: userId, email: 'test@test.com', role: 'user' };

      const status = {
        liked: false,
        likesCount: 0,
      };

      postServiceMock.getLikeStatus.mockResolvedValue(status);

      const response = await userToPostController.getLikeStatus(
        postId,
        currentUser,
      );

      expect(response.data).toEqual({
        liked: false,
        likesCount: 0,
      });
    });

    it('should use the user id from the session and the post id from the route', async () => {
      const userId = 25;
      const postId = 75;

      const currentUser = { id: userId, email: 'test@test.com', role: 'user' };

      postServiceMock.getLikeStatus.mockResolvedValue({
        liked: false,
        likesCount: 0,
      });

      await userToPostController.getLikeStatus(postId, currentUser);

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );
    });

    it('should throw an error if like status retrieval fails', async () => {
      const userId = 1;
      const postId = 10;

      const currentUser = { id: userId, email: 'test@test.com', role: 'user' };

      const error = new Error('Like status retrieval failed');

      postServiceMock.getLikeStatus.mockRejectedValue(error);

      await expect(
        userToPostController.getLikeStatus(postId, currentUser),
      ).rejects.toThrow(error);

      expect(postServiceMock.getLikeStatus).toHaveBeenCalledWith(
        userId,
        postId,
      );
    });
  });

  describe('getReadingStatus', () => {
    it('doit retourner le statut de lecture de l’article', async () => {
      const postId = 42;
      const sessionUser = {
        id: 1,
      };

      const currentUser = { id: 1, email: 'test@test.com', role: 'user' };
      const readingStatus: StatusReadingDto = {
        hasStarted: true,
        completed: false,
        progress: 45,
      };

      postServiceMock.getReadingStatus.mockResolvedValue(readingStatus);

      const result = await userToPostController.getReadingStatus(
        postId,
        currentUser,
      );

      expect(postServiceMock.getReadingStatus).toHaveBeenCalledTimes(1);

      expect(postServiceMock.getReadingStatus).toHaveBeenCalledWith(
        sessionUser.id,
        postId,
      );

      expect(result).toEqual(
        expect.objectContaining({
          data: readingStatus,
        }),
      );
    });

    it('doit propager une erreur du service', async () => {
      const postId = 42;

      const currentUser = { id: 1, email: 'test@test.com', role: 'user' };

      const serviceError = new Error('Impossible de récupérer le statut.');

      postServiceMock.getReadingStatus.mockRejectedValue(serviceError);

      await expect(
        userToPostController.getReadingStatus(postId, currentUser),
      ).rejects.toThrow(serviceError);

      expect(postServiceMock.getReadingStatus).toHaveBeenCalledWith(
        currentUser.id,
        postId,
      );
    });
  });

  describe('updateReadingProgress', () => {
    it('doit mettre à jour la progression de lecture', async () => {
      const postId = 42;
      const sessionUser = {
        id: 1,
      };

      const currentUser = { id: 1, email: 'test@test.com', role: 'user' };

      const payload = {
        progress: 65,
      };

      const postRead: StatusReadingDto = {
        progress: payload.progress,
        completed: false,
        hasStarted: true,
      };

      postServiceMock.updateReadingProgress.mockResolvedValue(postRead);

      const result = await userToPostController.updateReadingProgress(
        postId,
        payload,
        currentUser,
      );

      expect(postServiceMock.updateReadingProgress).toHaveBeenCalledTimes(1);

      expect(postServiceMock.updateReadingProgress).toHaveBeenCalledWith(
        sessionUser.id,
        postId,
        payload.progress,
      );

      expect(result).toEqual(
        expect.objectContaining({
          data: postRead,
        }),
      );
    });

    it('doit transmettre une progression de 100', async () => {
      const postId = 42;

      const sessionUser = {
        id: 1,
      };

      const currentUser = { id: 1, email: 'test@test.com', role: 'user' };

      const payload = {
        progress: 100,
      };

      const postRead: StatusReadingDto = {
        progress: 100,
        completed: true,
        hasStarted: true,
      };

      postServiceMock.updateReadingProgress.mockResolvedValue(postRead);

      await userToPostController.updateReadingProgress(
        postId,
        payload,
        currentUser,
      );

      expect(postServiceMock.updateReadingProgress).toHaveBeenCalledWith(
        sessionUser.id,
        postId,
        100,
      );
    });

    it('doit propager une erreur du service', async () => {
      const postId = 42;

      const currentUser = { id: 1, email: 'test@test.com', role: 'user' };

      const payload = {
        progress: 40,
      };

      const serviceError = new Error(
        'Impossible de mettre à jour la progression.',
      );

      postServiceMock.updateReadingProgress.mockRejectedValue(serviceError);

      await expect(
        userToPostController.updateReadingProgress(
          postId,
          payload,
          currentUser,
        ),
      ).rejects.toThrow(serviceError);
    });
  });
});
