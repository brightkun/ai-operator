interface IApiErrors {
  badRequest: (message: string) => Response;
  notFound: (message: string) => Response;
  conflict: (message: string) => Response;
  unauthorized: (message: string) => Response;
  tooManyRequests: (message: string) => Response;
  badGateway: (message: string) => Response;
  unavailable: (message: string) => Response;
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

  // лимит запросов (например, у бесплатного тарифа внешнего AI-сервиса)
  tooManyRequests: (message) => {
    return {
      message,
      status: 429,
    };
  },

  // внешний сервис ответил ошибкой или недоступен
  badGateway: (message) => {
    return {
      message,
      status: 502,
    };
  },

  // функция не настроена на сервере (например, нет ключа в .env)
  unavailable: (message) => {
    return {
      message,
      status: 503,
    };
  },
};
