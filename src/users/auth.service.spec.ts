import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
describe('AuthService', () => {
  let service;
  let fakeUsersService: Partial<UsersService>;
  beforeEach(async () => {
    //   Defining module and it's dependencies
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(users);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 9999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    //   fetching all the dependencies for service and creating an instance.
    service = module.get(AuthService);
  });

  it('can create an instance of auth service.', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asd@gmail.com', 'asdf');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use.', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ id: 1, email: 'a', password: '1' } as User]);

    try {
      await service.signup('asd@gmail.com', 'asdf');
    } catch (error) {}
  });

  it('throws an error if signin is called with an unused email.', async () => {
    try {
      await service.signin('asd@gmail.com', 'asdf');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('throws if an invalid password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ email: 'asdf@asdf.com', password: 'asdf' } as User]);
    try {
      await service.signin('asdfhasd@gmail.com', 'password');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('returns user if correct password is provided', async () => {
    await service.signup('asdf@asdf.com', 'laskdjf');

    const user = await service.signin('asdf@asdf.com', 'laskdjf');
    expect(user).toBeDefined();
  });
});
