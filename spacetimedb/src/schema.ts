import { schema, table, t } from 'spacetimedb/server';

export const TaskPriority = t.enum('TaskPriority', ['low', 'medium', 'high']);

export const TaskCategory = table({ 
    name: 'task_category',
    public: true,
    indexes: [{ name: 'task_category_owner_id', algorithm: 'btree', columns: ['ownerId'] }]
}, {
    id: t.u64().primaryKey().autoInc(),
    ownerId: t.identity(),
    name: t.string(),
    icon: t.string(),
    color: t.string(),
});

export const Task = table({
    name: 'task',
    public: true, // Generate TS types
    indexes: [{ name: 'task_owner_id', algorithm: 'btree', columns: ['ownerId'] }]
}, {
    id: t.u64().primaryKey().autoInc(),
    ownerId: t.identity(),
    name: t.string(),
    deadline: t.timestamp().optional(),
    priority: TaskPriority,
    effort: t.u32().optional(), // Effort in minutes
    difficulty: t.u8().optional(), // 1 to 5
    categoryId: t.u64().optional(), // Links to TaskCategory
    description: t.string().optional(),
    tags: t.array(t.string()),
    isCompleted: t.bool(),
});

// ==========================================
// Financial Tracker (Pencatatan Keuangan)
// ==========================================

export const Currency = t.enum('Currency', ['IDR', 'USD']);
export const WalletType = t.enum('WalletType', ['cash', 'bank', 'ewallet', 'credit_card']);
export const TransactionType = t.enum('TransactionType', ['income', 'expense', 'transfer', 'correction']);

export const Wallet = table({
    name: 'wallet',
    public: true,
    indexes: [{ name: 'wallet_owner_id', algorithm: 'btree', columns: ['ownerId'] }]
}, {
    id: t.u64().primaryKey().autoInc(),
    ownerId: t.identity(),
    name: t.string(),
    type: WalletType,
    balance: t.i64(), 
    currency: Currency,
    icon: t.string(),
    color: t.string(),
});

export const TransactionCategory = table({
    name: 'transaction_category',
    public: true,
    indexes: [{ name: 'tx_category_owner_id', algorithm: 'btree', columns: ['ownerId'] }]
}, {
    id: t.u64().primaryKey().autoInc(),
    ownerId: t.identity(),
    name: t.string(),
    type: TransactionType,
    icon: t.string(),
    color: t.string(),
});

export const TransactionSubCategory = table({
    name: 'transaction_subcategory',
    public: true,
    indexes: [{ name: 'tx_subcategory_owner_id', algorithm: 'btree', columns: ['ownerId'] }]
}, {
    id: t.u64().primaryKey().autoInc(),
    ownerId: t.identity(),
    categoryId: t.u64(), // Links to TransactionCategory
    name: t.string(),
    icon: t.string().optional(),
});

export const Transaction = table({
    name: 'transaction',
    public: true,
    indexes: [{ name: 'transaction_owner_id', algorithm: 'btree', columns: ['ownerId'] }]
}, {
    id: t.u64().primaryKey().autoInc(),
    ownerId: t.identity(),
    title: t.string(),
    type: TransactionType,
    amount: t.u64(),
    timestamp: t.timestamp(),
    walletId: t.u64(), // Links to Wallet
    categoryId: t.u64().optional(), // Links to TransactionCategory
    subCategoryId: t.u64().optional(), // Links to TransactionSubCategory
    linkedTransactionId: t.u64().optional(), // Used for Transfers
    notes: t.string().optional(),
    tags: t.array(t.string()),
});


const spacetimedb = schema({
  Task,
  TaskCategory,
  Wallet,
  TransactionCategory,
  TransactionSubCategory,
  Transaction,
});

export default spacetimedb;
