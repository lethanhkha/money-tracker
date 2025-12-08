// Express Request extension
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  categoryId: string;
  type: "income" | "expense";
  amount: number;
  description?: string;
  date: Date;
  status: "pending" | "completed";
  workDate?: Date;
  receivedDate?: Date;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Debt {
  id: string;
  userId: string;
  type: "lend" | "borrow";
  personName: string;
  amount: number;
  remainingAmount: number;
  dueDate?: Date;
  description?: string;
  status: "pending" | "partial" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  description?: string;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}
