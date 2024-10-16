import classNames from 'classnames';
import { ErrorMessages } from '../enums/ErrorMessages';

interface ErrorsProps {
  errorMessage: ErrorMessages;
  setErrorMessage: React.Dispatch<React.SetStateAction<ErrorMessages>>;
}

export const Errors: React.FC<ErrorsProps> = ({
  errorMessage,
  setErrorMessage,
}) => {
  return (
    <div
      data-cy="ErrorNotification"
      className={classNames(
        'notification is-danger is-light has-text-weight-normal',
        { hidden: !errorMessage },
      )}
    >
      <button
        data-cy="HideErrorButton"
        type="button"
        className="delete"
        onClick={() => setErrorMessage(ErrorMessages.NO_ERRORS)}
      />
      {errorMessage}
    </div>
  );
};
