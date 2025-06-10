export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
  createdAt: Date;
  lastLogin?: Date;
  isActive?: boolean;
  __v: number;
}

export interface UserUpdateRequest {
  _id: string;
  username?: string;
  email?: string;
  role?: 'student' | 'admin';
  isActive?: boolean;
}

export interface UserFilter {
  role?: string;
  searchTerm?: string;
  isActive?: boolean;
}