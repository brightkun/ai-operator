interface IApiErrors {
  badRequest: (message: string) => Response;
  notFound: (message: string) => Response;
  conflict: (message: string) => Response;
  unauthorized: (message: string) => Response;
}

interface Response {
  message: string;
  status: number;
}

export const apiErrors: IApiErrors = {
  badRequest: (message) => {
    return {
      message,
      status: 400,
    };
  },

  unauthorized: (message) => {
    return {
      message,
      status: 401,
    };
  },

  conflict: (message) => {
    return {
      message,
      status: 409,
    };
  },

  notFound: (message) => {
    return {
      message,
      status: 404,
    };
  },
};
