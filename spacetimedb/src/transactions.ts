import { t, SenderError } from 'spacetimedb/server';
import spacetimedb, { TransactionCategory, TransactionSubCategory, Transaction, TransactionType } from './schema';

// --- Transaction Categories ---

export const create_tx_category = spacetimedb.reducer({
    name: t.string(),
    type: TransactionType,
    icon: t.string(),
    color: t.string()
}, (ctx, args) => {
    if (!args.name) throw new SenderError("Category name cannot be empty");
    
    ctx.db.TransactionCategory.insert({
        id: 0n,
        ownerId: ctx.sender,
        name: args.name,
        type: args.type,
        icon: args.icon,
        color: args.color
    });
});

export const update_tx_category = spacetimedb.reducer({
    id: t.u64(),
    name: t.string(),
    type: TransactionType,
    icon: t.string(),
    color: t.string()
}, (ctx, args) => {
    const existing = ctx.db.TransactionCategory.id.find(args.id);
    if (!existing) throw new SenderError("Category not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    ctx.db.TransactionCategory.id.update({
        ...existing,
        name: args.name,
        type: args.type,
        icon: args.icon,
        color: args.color
    });
});

export const delete_tx_category = spacetimedb.reducer({
    id: t.u64()
}, (ctx, { id }) => {
    const existing = ctx.db.TransactionCategory.id.find(id);
    if (!existing) throw new SenderError("Category not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    // Unlink from transactions
    for (const tx of ctx.db.Transaction.iter()) {
        if (tx.ownerId.toHexString() === ctx.sender.toHexString() && tx.categoryId === id) {
            ctx.db.Transaction.id.update({ ...tx, categoryId: undefined });
        }
    }

    // Delete child subcategories
    for (const sub of ctx.db.TransactionSubCategory.iter()) {
        if (sub.ownerId.toHexString() === ctx.sender.toHexString() && sub.categoryId === id) {
            ctx.db.TransactionSubCategory.id.delete(sub.id);
        }
    }

    ctx.db.TransactionCategory.id.delete(id);
});

// --- Transaction Sub-Categories ---

export const create_tx_subcategory = spacetimedb.reducer({
    categoryId: t.u64(),
    name: t.string(),
    icon: t.string().optional()
}, (ctx, args) => {
    if (!args.name) throw new SenderError("Subcategory name cannot be empty");
    
    // Validate parent
    const parent = ctx.db.TransactionCategory.id.find(args.categoryId);
    if (!parent || parent.ownerId.toHexString() !== ctx.sender.toHexString()) {
        throw new SenderError("Invalid parent category");
    }

    ctx.db.TransactionSubCategory.insert({
        id: 0n,
        ownerId: ctx.sender,
        categoryId: args.categoryId,
        name: args.name,
        icon: args.icon
    });
});

export const update_tx_subcategory = spacetimedb.reducer({
    id: t.u64(),
    categoryId: t.u64(),
    name: t.string(),
    icon: t.string().optional()
}, (ctx, args) => {
    const existing = ctx.db.TransactionSubCategory.id.find(args.id);
    if (!existing) throw new SenderError("Subcategory not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    if (args.categoryId !== existing.categoryId) {
        const parent = ctx.db.TransactionCategory.id.find(args.categoryId);
        if (!parent || parent.ownerId.toHexString() !== ctx.sender.toHexString()) {
            throw new SenderError("Invalid parent category");
        }
    }

    ctx.db.TransactionSubCategory.id.update({
        ...existing,
        categoryId: args.categoryId,
        name: args.name,
        icon: args.icon
    });
});

export const delete_tx_subcategory = spacetimedb.reducer({
    id: t.u64()
}, (ctx, { id }) => {
    const existing = ctx.db.TransactionSubCategory.id.find(id);
    if (!existing) throw new SenderError("Subcategory not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    // Unlink
    for (const tx of ctx.db.Transaction.iter()) {
        if (tx.ownerId.toHexString() === ctx.sender.toHexString() && tx.subCategoryId === id) {
            ctx.db.Transaction.id.update({ ...tx, subCategoryId: undefined });
        }
    }

    ctx.db.TransactionSubCategory.id.delete(id);
});

// --- Transactions ---

export const create_transaction = spacetimedb.reducer({
    title: t.string(),
    type: TransactionType, // income, expense, transfer, correction
    amount: t.u64(),
    timestamp: t.timestamp(),
    walletId: t.u64(),
    categoryId: t.u64().optional(),
    subCategoryId: t.u64().optional(),
    toWalletId: t.u64().optional(), // Virtual param for Transfers
    notes: t.string().optional(),
    tags: t.array(t.string())
}, (ctx, args) => {
    if (!args.title) throw new SenderError("Transaction title cannot be empty");
    if (args.amount <= 0n) throw new SenderError("Amount must be greater than 0");

    const wallet = ctx.db.Wallet.id.find(args.walletId);
    if (!wallet || wallet.ownerId.toHexString() !== ctx.sender.toHexString()) {
        throw new SenderError("Invalid source wallet");
    }

    // Adjust Balance
    if (args.type.tag === 'expense') {
        ctx.db.Wallet.id.update({ ...wallet, balance: wallet.balance - BigInt(args.amount) });
    } else if (args.type.tag === 'income') {
        ctx.db.Wallet.id.update({ ...wallet, balance: wallet.balance + BigInt(args.amount) });
    }

    let linkedId: bigint | undefined = undefined;

    // Handle Transfer Logic
    if (args.type.tag === 'transfer') {
        if (!args.toWalletId) throw new SenderError("Transfer must have a destination wallet");
        
        const toWallet = ctx.db.Wallet.id.find(args.toWalletId);
        if (!toWallet || toWallet.ownerId.toHexString() !== ctx.sender.toHexString()) {
            throw new SenderError("Invalid destination wallet");
        }

        // 1. Deduct from source wallet
        ctx.db.Wallet.id.update({ ...wallet, balance: wallet.balance - BigInt(args.amount) });
        // 2. Add to destination wallet
        ctx.db.Wallet.id.update({ ...toWallet, balance: toWallet.balance + BigInt(args.amount) });

        // Generate ID for linked transaction safely (simulate autoInc retrieval)
        // SpacetimeDB doesn't return inserted IDs yet. We generate random bigints for linkage.
        const transferCode = BigInt(Math.floor(Math.random() * 1000000000));

        ctx.db.Transaction.insert({
            id: 0n,
            ownerId: ctx.sender,
            title: `Transfer to ${toWallet.name}`,
            type: { tag: 'expense' }, // From perspective of source
            amount: args.amount,
            timestamp: args.timestamp,
            walletId: wallet.id,
            categoryId: undefined,
            subCategoryId: undefined,
            linkedTransactionId: transferCode, 
            notes: args.notes,
            tags: ['transfer']
        });

        ctx.db.Transaction.insert({
            id: 0n,
            ownerId: ctx.sender,
            title: `Transfer from ${wallet.name}`,
            type: { tag: 'income' }, // From perspective of destination
            amount: args.amount,
            timestamp: args.timestamp,
            walletId: toWallet.id,
            categoryId: undefined,
            subCategoryId: undefined,
            linkedTransactionId: transferCode, 
            notes: args.notes,
            tags: ['transfer']
        });

        return; // Early return for transfers
    }

    // Insert Standard Transaction
    ctx.db.Transaction.insert({
        id: 0n,
        ownerId: ctx.sender,
        title: args.title,
        type: args.type,
        amount: args.amount,
        timestamp: args.timestamp,
        walletId: wallet.id,
        categoryId: args.categoryId,
        subCategoryId: args.subCategoryId,
        linkedTransactionId: undefined,
        notes: args.notes,
        tags: args.tags || []
    });
});

export const delete_transaction = spacetimedb.reducer({
    id: t.u64()
}, (ctx, { id }) => {
    const existing = ctx.db.Transaction.id.find(id);
    if (!existing) throw new SenderError("Transaction not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    // Reverse balance
    const wallet = ctx.db.Wallet.id.find(existing.walletId);
    if (wallet) {
        if (existing.type.tag === 'expense' || existing.type.tag === 'correction' && existing.notes?.includes("Ke bawah")) {
            ctx.db.Wallet.id.update({ ...wallet, balance: wallet.balance + existing.amount });
        } else if (existing.type.tag === 'income' || existing.type.tag === 'correction' && existing.notes?.includes("Ke atas")) {
            ctx.db.Wallet.id.update({ ...wallet, balance: wallet.balance - existing.amount });
        }
    }

    // Delete Linked Transaction if it was a transfer
    if (existing.linkedTransactionId) {
        let linked: any = undefined;
        for (const tx of ctx.db.Transaction.iter()) {
            if (tx.ownerId.toHexString() === ctx.sender.toHexString() && 
                tx.linkedTransactionId === existing.linkedTransactionId && tx.id !== existing.id) {
                linked = tx;
                break;
            }
        }
        
        if (linked) {
             const linkedWallet = ctx.db.Wallet.id.find(linked.walletId);
             if (linkedWallet) {
                 if (linked.type.tag === 'expense') {
                     ctx.db.Wallet.id.update({ ...linkedWallet, balance: linkedWallet.balance + linked.amount });
                 } else if (linked.type.tag === 'income') {
                     ctx.db.Wallet.id.update({ ...linkedWallet, balance: linkedWallet.balance - linked.amount });
                 }
             }
             ctx.db.Transaction.id.delete(linked.id);
        }
    }

    ctx.db.Transaction.id.delete(id);
});

export const update_transaction = spacetimedb.reducer({
    id: t.u64(),
    title: t.string(),
    type: TransactionType, 
    amount: t.u64(),
    timestamp: t.timestamp(),
    walletId: t.u64(),
    categoryId: t.u64().optional(),
    subCategoryId: t.u64().optional(),
    toWalletId: t.u64().optional(), // For Transfers
    notes: t.string().optional(),
    tags: t.array(t.string())
}, (ctx, args) => {
    const existing = ctx.db.Transaction.id.find(args.id);
    if (!existing) throw new SenderError("Transaction not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");
    if (!args.title) throw new SenderError("Transaction title cannot be empty");
    if (args.amount <= 0n) throw new SenderError("Amount must be greater than 0");

    const wallet = ctx.db.Wallet.id.find(args.walletId);
    if (!wallet || wallet.ownerId.toHexString() !== ctx.sender.toHexString()) {
        throw new SenderError("Invalid source wallet");
    }

    // Since updating amounts or types is extremely complex regarding balances and linked transfers,
    // the safest Backend pattern for Personal Finance is: Delete the old one, process as new.
    
    // 1. Reverse existing balance
    const existingWallet = ctx.db.Wallet.id.find(existing.walletId);
    if (existingWallet) {
        if (existing.type.tag === 'expense' || existing.type.tag === 'correction' && existing.notes?.includes("Ke bawah")) {
            ctx.db.Wallet.id.update({ ...existingWallet, balance: existingWallet.balance + existing.amount });
        } else if (existing.type.tag === 'income' || existing.type.tag === 'correction' && existing.notes?.includes("Ke atas")) {
            ctx.db.Wallet.id.update({ ...existingWallet, balance: existingWallet.balance - existing.amount });
        }
    }

    // 2. Delete linked transfer part if exists
    if (existing.linkedTransactionId) {
         let linked: any = undefined;
         for (const tx of ctx.db.Transaction.iter()) {
             if (tx.ownerId.toHexString() === ctx.sender.toHexString() &&
                 tx.linkedTransactionId === existing.linkedTransactionId && tx.id !== existing.id) {
                 linked = tx;
                 break;
             }
         }
        if (linked) {
             const linkedWallet = ctx.db.Wallet.id.find(linked.walletId);
             if (linkedWallet) {
                 if (linked.type.tag === 'expense') {
                     ctx.db.Wallet.id.update({ ...linkedWallet, balance: linkedWallet.balance + linked.amount });
                 } else if (linked.type.tag === 'income') {
                     ctx.db.Wallet.id.update({ ...linkedWallet, balance: linkedWallet.balance - linked.amount });
                 }
             }
             ctx.db.Transaction.id.delete(linked.id);
        }
    }

    // 3. Delete existing
    ctx.db.Transaction.id.delete(existing.id);

    // 4. Re-insert with new data 
    // Wait to grab the potentially refreshed wallet balance
    const currentWallet = ctx.db.Wallet.id.find(args.walletId)!;

    if (args.type.tag === 'expense') {
        ctx.db.Wallet.id.update({ ...currentWallet, balance: currentWallet.balance - BigInt(args.amount) });
    } else if (args.type.tag === 'income') {
        ctx.db.Wallet.id.update({ ...currentWallet, balance: currentWallet.balance + BigInt(args.amount) });
    }

    if (args.type.tag === 'transfer') {
        if (!args.toWalletId) throw new SenderError("Transfer must have a destination wallet");
        
        const toWallet = ctx.db.Wallet.id.find(args.toWalletId);
        if (!toWallet || toWallet.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Invalid destination wallet");

        ctx.db.Wallet.id.update({ ...currentWallet, balance: currentWallet.balance - BigInt(args.amount) });
        ctx.db.Wallet.id.update({ ...toWallet, balance: toWallet.balance + BigInt(args.amount) });

        const transferCode = BigInt(Math.floor(Math.random() * 1000000000));

        ctx.db.Transaction.insert({ id: 0n, ownerId: ctx.sender, title: `Transfer to ${toWallet.name}`, type: { tag: 'expense' }, amount: args.amount, timestamp: args.timestamp, walletId: currentWallet.id, categoryId: undefined, subCategoryId: undefined, linkedTransactionId: transferCode, notes: args.notes, tags: ['transfer'] });
        ctx.db.Transaction.insert({ id: 0n, ownerId: ctx.sender, title: `Transfer from ${currentWallet.name}`, type: { tag: 'income' }, amount: args.amount, timestamp: args.timestamp, walletId: toWallet.id, categoryId: undefined, subCategoryId: undefined, linkedTransactionId: transferCode, notes: args.notes, tags: ['transfer'] });
    } else {
        ctx.db.Transaction.insert({ id: 0n, ownerId: ctx.sender, title: args.title, type: args.type, amount: args.amount, timestamp: args.timestamp, walletId: currentWallet.id, categoryId: args.categoryId, subCategoryId: args.subCategoryId, linkedTransactionId: undefined, notes: args.notes, tags: args.tags || [] });
    }
});
