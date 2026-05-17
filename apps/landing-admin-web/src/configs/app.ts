export default {
  unprotectedRoutes: ['login', 'root'],
  services: {
    defaults: {
      successHandler: (response: any) => response,
      errorHandler: (err: any) => {
        throw err.response?.data.error_message || err
      },
    },
  },
}
