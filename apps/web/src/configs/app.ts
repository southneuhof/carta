export default {
  unprotectedRoutes: [
    'login',
    'certificate',
    'register',
    'verify-email',
    'on-verification',
    'appeal-verification',
    'root',
    'public-customer-oppinions',
    'public-customer-satisfaction',
    'public-toll-customer-oppinions',
    'public-customer-complaints',
    'request-forgot-password',
    'forgot-password',
    'public-job-vacancies',
    'meeting-attendance',
  ],
  services: {
    defaults: {
      successHandler: (response: any) => response,
      errorHandler: (err: any) => {
        throw err.response?.data.error_message || err
      },
    },
  },
}
