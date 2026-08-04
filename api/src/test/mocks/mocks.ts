export const postServiceMock = {
        countAll: jest.fn(),
        countByPublishedStatus: jest.fn(),
        create: jest.fn(),
        index: jest.fn(),
        indexWhere: jest.fn(),
        indexOneWhere: jest.fn(),
        show: jest.fn(),
        store: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        isPublished: jest.fn(),
        getLikeStatus: jest.fn(),
        getReadingStatus: jest.fn(),
        updateReadingProgress: jest.fn()
    };

export const userServiceMock = {
        index: jest.fn(),
        show: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        addLike: jest.fn(),
        unlikePost: jest.fn(),
        checkIfUserLikedPost: jest.fn()
    };

export const slugServiceMock = {
        isValidateSlug: jest.fn(),
        generateSlugFromArticleTitle: jest.fn(),
        getPostWithSlug: jest.fn(),
    };