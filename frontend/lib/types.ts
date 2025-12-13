export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  categoryId: string;
  type: "income" | "expense";
  amount: number;
  name?: string;
  description?: string;
  date: string;
  status: "pending" | "completed";
  workDate?: string;
  receivedDate?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  wallet?: Wallet;
  category?: Category;
}

export interface Debt {
  id: string;
  userId: string;
  type: "lend" | "borrow";
  personName: string;
  amount: number;
  remainingAmount: number;
  dueDate?: string;
  description?: string;
  status: "pending" | "partial" | "completed";
  createdAt: string;
  updatedAt: string;
  payments?: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  description?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  contributions?: GoalContribution[];
}

export interface GoalContribution {
  id: string;
  goalId: string;
  walletId: string;
  amount: number;
  contributionDate: string;
  note?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
}
