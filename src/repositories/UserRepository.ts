// import { AppDataSource } from '../db/data-source';
// import { User } from '../entities/User';

// export class UserRepository {
//     private userRepository = AppDataSource.getRepository(User);

//     async findAll(): Promise<User[]> {
//         return this.userRepository.find();
//     }

//     async findById(id: number): Promise<User | null> {
//         return this.userRepository.findOneBy({ id });
//     }

//     async create(userData: Partial<User>): Promise<User> {
//         const user = this.userRepository.create(userData);
//         return this.userRepository.save(user);
//     }

//     // Add other CRUD operations as needed
// }