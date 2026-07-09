import { User } from "../entities/user";

export type UserCreateData = {
  name: string;
  cpf: string;
  email: string;
  password: string;
};

export interface IUsersRepository {
  create(data: UserCreateData): Promise<User>;
  findByCpf(cpf: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findMany(): Promise<User[]>;
}
