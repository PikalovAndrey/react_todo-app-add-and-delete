import { Todo } from '../types/Todo';
import { client } from '../utils/fetchClient';
import { USER_ID } from '../utils/USER_ID';

export const getTodos = () => {
  return client.get<Todo[]>(`/todos?userId=${USER_ID}`);
};

export const deleteTodos = (todoId: number) => {
  return client.delete(`/todos/${todoId}`);
};

export const addTodo = ({
  title,
  userId,
  completed,
}: {
  title: string;
  userId: number;
  completed: boolean;
}): Promise<Todo> => {
  return client.post('/todos', { title, userId, completed });
};

export const changeTodo = (todoId: number, updatedFields: Partial<Todo>) => {
  return client.patch(`/todos/${todoId}`, updatedFields);
};
