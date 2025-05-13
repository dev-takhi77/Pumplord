export interface RegisterUserDto {
    username: string;
    password: string;
    inviteKey: string;
}

export interface LoginUserDto {
    username: string;
    password: string;
}
