import { t, SenderError } from 'spacetimedb/server';
import spacetimedb, { TaskCategory, Task, Wallet, TransactionCategory, TransactionSubCategory, Transaction, TaskPriority, Currency, WalletType, TransactionType } from './schema';

export default spacetimedb;

// ==========================================
// 2. Data Access Views (Subscriptions)
// ==========================================

// Allows clients to subscribe only to their own categories
spacetimedb.view(
    { name: 'my_task_categories', public: true },
    t.array(TaskCategory.rowType),
    (ctx) => [...(ctx.db.TaskCategory as any).task_category_owner_id.filter(ctx.sender)]
);

// Allows clients to subscribe only to their own tasks
spacetimedb.view(
    { name: 'my_tasks', public: true },
    t.array(Task.rowType),
    (ctx) => [...(ctx.db.Task as any).task_owner_id.filter(ctx.sender)]
);

// Allows clients to subscribe only to their own wallets
spacetimedb.view(
    { name: 'my_wallets', public: true },
    t.array(Wallet.rowType),
    (ctx) => [...(ctx.db.Wallet as any).wallet_owner_id.filter(ctx.sender)]
);

// Allows clients to subscribe only to their own transaction categories
spacetimedb.view(
    { name: 'my_tx_categories', public: true },
    t.array(TransactionCategory.rowType),
    (ctx) => [...(ctx.db.TransactionCategory as any).tx_category_owner_id.filter(ctx.sender)]
);

// Allows clients to subscribe only to their own transaction sub-categories
spacetimedb.view(
    { name: 'my_tx_subcategories', public: true },
    t.array(TransactionSubCategory.rowType),
    (ctx) => [...(ctx.db.TransactionSubCategory as any).tx_subcategory_owner_id.filter(ctx.sender)]
);

// Allows clients to subscribe only to their own transactions
spacetimedb.view(
    { name: 'my_transactions', public: true },
    t.array(Transaction.rowType),
    (ctx) => [...(ctx.db.Transaction as any).transaction_owner_id.filter(ctx.sender)]
);

// ==========================================
// 3. Reducers (Mutations)
// ==========================================

export const init = spacetimedb.init(_ctx => {});
export const onConnect = spacetimedb.clientConnected(_ctx => {});
export const onDisconnect = spacetimedb.clientDisconnected(_ctx => {});

// --- Categories ---

export const create_task_category = spacetimedb.reducer({
    name: t.string(),
    icon: t.string(),
    color: t.string()
}, (ctx, { name, icon, color }) => {
    if (!name) throw new SenderError("Category name cannot be empty");
    
    ctx.db.TaskCategory.insert({
        id: 0n,
        ownerId: ctx.sender,
        name,
        icon,
        color
    });
});

export const update_task_category = spacetimedb.reducer({
    id: t.u64(),
    name: t.string(),
    icon: t.string(),
    color: t.string()
}, (ctx, { id, name, icon, color }) => {
    const existing = ctx.db.TaskCategory.id.find(id);
    if (!existing) throw new SenderError("Category not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");
    if (!name) throw new SenderError("Category name cannot be empty");

    ctx.db.TaskCategory.id.update({
        ...existing,
        name,
        icon,
        color
    });
});

export const delete_task_category = spacetimedb.reducer({
    id: t.u64()
}, (ctx, { id }) => {
    const existing = ctx.db.TaskCategory.id.find(id);
    if (!existing) throw new SenderError("Category not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    // Clear categoryId from tasks that were using it
    const userTasks = [...(ctx.db.Task as any).task_owner_id.filter(ctx.sender)];
    for (const task of userTasks as any[]) {
        if (task.categoryId === id) {
            ctx.db.Task.id.update({ ...task, categoryId: undefined } as any);
        }
    }

    ctx.db.TaskCategory.id.delete(id);
});

export * from './tasks';
export * from './wallets';
export * from './transactions';
