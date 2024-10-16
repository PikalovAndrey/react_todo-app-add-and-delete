import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { addTodo, changeTodo, deleteTodos, getTodos } from './api/todos';
import { Todo } from './types/Todo';
import { FilterOptions } from './enums/FilterOptions';
import { ErrorMessages } from './enums/ErrorMessages';
import { filteredTodos } from './utils/filteringTodos';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TodoList } from './components/TodoList';
import { USER_ID } from './utils/USER_ID';
import { Errors } from './components/Errors';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterOptions>(FilterOptions.ALL);
  const [errorMessage, setErrorMessage] = useState(ErrorMessages.NO_ERRORS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [shouldFocus, setShouldFocus] = useState(true);
  const [loadingTodosCount, setLoadingTodosCount] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [todos]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (inputValue.trim() === '') {
      setErrorMessage(ErrorMessages.EMPTY_TITLE);

      return;
    }

    const temporaryTodo: Todo = {
      id: 0,
      title: inputValue.trim(),
      userId: USER_ID,
      completed: false,
    };

    setTempTodo(temporaryTodo);
    setIsSubmitting(true);
    setShouldFocus(false);
    setLoadingTodosCount(currentCount => [...currentCount, 0]);

    addTodo({ title: inputValue.trim(), userId: USER_ID, completed: false })
      .then((createdTodo: Todo) => {
        setTodos((currentTodos: Todo[]) => [...currentTodos, createdTodo]);
        setInputValue('');
        setErrorMessage(ErrorMessages.NO_ERRORS);
        setShouldFocus(true);

        if (inputRef.current) {
          inputRef.current.focus();
        }
      })
      .catch(() => {
        setShouldFocus(true);
        setErrorMessage(ErrorMessages.ADDING_ERROR);

        if (inputRef.current) {
          inputRef.current.focus();
        }
      })
      .finally(() => {
        if (inputRef.current) {
          inputRef.current.disabled = false;
          inputRef.current.focus();
        }

        setIsSubmitting(false);
        setTempTodo(null);
        setLoadingTodosCount(currentCount =>
          currentCount.filter(todoId => todoId !== 0),
        );
      });
  };

  const handleTodoDelete = useCallback(
    (todoId: number) => {
      setIsSubmitting(true);
      setLoadingTodosCount(current => [...current, todoId]);
      deleteTodos(todoId)
        .then(() => {
          setTodos(currentTodos =>
            currentTodos.filter(todo => todo.id !== todoId),
          );
        })
        .catch(() => {
          setErrorMessage(ErrorMessages.DELETING_ERROR);
        })
        .finally(() => {
          setIsSubmitting(false);
          setLoadingTodosCount(current =>
            current.filter(deletingTodoId => todoId !== deletingTodoId),
          );
        });
    },
    [todos],
  );
  const handleCompletedTodosDeleted = useCallback(() => {
    setIsSubmitting(true);

    const todosForDeleting = todos
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    setLoadingTodosCount(current => [...current, ...todosForDeleting]);

    Promise.all(
      todosForDeleting.map(id =>
        deleteTodos(id)
          .then(() => {
            setTodos(currentTodos =>
              currentTodos.filter(todo => todo.id !== id),
            );
          })
          .catch(() => {
            setErrorMessage(ErrorMessages.DELETING_ERROR);
          })
          .finally(() => {
            setLoadingTodosCount(current =>
              current.filter(deletingTodoId => deletingTodoId !== id),
            );
          }),
      ),
    ).finally(() => setIsSubmitting(false));
  }, [todos]);

  const handleTodosToggle = useCallback(() => {
    const hasIncompleteTodos = todos.some(todo => !todo.completed);

    setTodos(currentTodos =>
      currentTodos.map(todo => ({
        ...todo,
        completed: hasIncompleteTodos,
      })),
    );
  }, [todos]);

  const handleTodoToggle = useCallback(
    (todoId: number, currentCompletedStatus: boolean) => {
      setIsSubmitting(true);
      changeTodo(todoId, { completed: !currentCompletedStatus })
        .then(() => {
          setTodos(currentTodos =>
            currentTodos.map(todo =>
              todo.id === todoId
                ? { ...todo, completed: !todo.completed }
                : todo,
            ),
          );
        })
        .catch(() => {
          setErrorMessage(ErrorMessages.UPDATING_ERROR);
        })
        .finally(() => setIsSubmitting(false));
    },
    [todos],
  );

  const todosAfterFiltering = useMemo(
    () => filteredTodos(todos, filter),
    [todos, filter],
  );

  const completedTodos = useMemo(
    () => todos.filter(todo => todo.completed),
    [todos],
  );

  useEffect(() => {
    const loadTodos = () => {
      getTodos()
        .then(loadedTodos => {
          setTodos(loadedTodos);
        })
        .catch(error => {
          setErrorMessage(ErrorMessages.LOADING_ERROR);
          throw new Error(error);
        });
    };

    loadTodos();
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(ErrorMessages.NO_ERRORS);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          value={inputValue}
          todos={todos}
          completedTodos={completedTodos}
          isSubmitting={isSubmitting}
          tempTodo={tempTodo}
          shouldFocus={shouldFocus}
          inputRef={inputRef}
          onTodosToggle={handleTodosToggle}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
        />

        <TodoList
          tempTodo={tempTodo}
          todosAfterFiltering={todosAfterFiltering}
          loadingTodos={loadingTodosCount}
          onTodoDelete={handleTodoDelete}
          onTodoToggle={handleTodoToggle}
        />

        {!!todos.length && (
          <Footer
            todos={todos}
            completedTodos={completedTodos}
            filter={filter}
            setFilter={setFilter}
            onCompletedTodosDeleted={handleCompletedTodosDeleted}
          />
        )}
      </div>

      <Errors errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
    </div>
  );
};
