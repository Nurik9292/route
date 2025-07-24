import { logger, parseValidationError } from '@/utils';
import { useDialogBox, useMessageToaster } from '@/composables';
import axios from 'axios';

export const useErrorHandler = (driver = 'toast') => {
    const { toastError } = useMessageToaster();
    const { showErrorDialog } = useDialogBox();
  
    const showError = (message) => driver === 'toast' ? toastError(message) : showErrorDialog(message);
  
    const showGenericError = () => showError('An unknown error occurred.')
  
    const handleHttpError = (error, statusMessageMap = {}) => {
      logger.error(error)
  
      if (!axios.isAxiosError(error) || !error.response?.status) {
        return showGenericError();
      }
  
      if (
        !Object.prototype.hasOwnProperty.call(statusMessageMap, error.response.status)
        && error.response.status === 422
      ) {
        return showError(parseValidationError(error.response.data)[0]);
      }
  
      const messageOrClosure = statusMessageMap[error.response.status];
  
      if (messageOrClosure) {
        return typeof messageOrClosure === 'string' ? showError(messageOrClosure) : messageOrClosure();
      }
  
      if (error.response.data.message) {
        return showError(error.response.data.message);
      }
  
      return showGenericError();
    }
  
    return {
      handleHttpError,
      showGenericError
    }
  }