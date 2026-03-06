import { t, SenderError } from 'spacetimedb/server';
import spacetimedb, { Wallet, Transaction, Currency, WalletType } from './schema';

// --- Wallets ---

export const create_wallet = spacetimedb.reducer({
    name: t.string(),
    type: WalletType,
    balance: t.i64(),
    currency: Currency,
    icon: t.string(),
    color: t.string()
}, (ctx, args) => {
    if (!args.name) throw new SenderError("Wallet name cannot be empty");

    ctx.db.Wallet.insert({
        id: 0n,
        ownerId: ctx.sender,
        name: args.name,
        type: args.type,
        balance: args.balance,
        currency: args.currency || { tag: 'IDR' },
        icon: args.icon,
        color: args.color
    });
});

export const update_wallet = spacetimedb.reducer({
    id: t.u64(),
    name: t.string(),
    type: WalletType,
    balance: t.i64(),
    currency: Currency,
    icon: t.string(),
    color: t.string()
}, (ctx, args) => {
    const existing = ctx.db.Wallet.id.find(args.id);
    if (!existing) throw new SenderError("Wallet not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");
    if (!args.name) throw new SenderError("Wallet name cannot be empty");

    // Auto-generate Correction Transaction if balance changed manually
    if (existing.balance !== args.balance) {
        const diff = args.balance - existing.balance;
        
        ctx.db.Transaction.insert({
            id: 0n,
            ownerId: ctx.sender,
            title: 'Koreksi Saldo Manual',
            type: { tag: 'correction' },
            amount: BigInt(Math.abs(Number(diff))),
            timestamp: ctx.timestamp,
            walletId: existing.id,
            categoryId: undefined,
            subCategoryId: undefined,
            linkedTransactionId: undefined,
            notes: diff > 0n ? `Ke atas: Penyesuaian saldo dari ${existing.balance} ke ${args.balance}` : `Ke bawah: Penyesuaian saldo dari ${existing.balance} ke ${args.balance}`,
            tags: ['correction']
        });
    }

    ctx.db.Wallet.id.update({
        ...existing,
        name: args.name,
        type: args.type,
        balance: args.balance,
        currency: args.currency,
        icon: args.icon,
        color: args.color
    });
});

export const delete_wallet = spacetimedb.reducer({
    id: t.u64()
}, (ctx, { id }) => {
    const existing = ctx.db.Wallet.id.find(id);
    if (!existing) throw new SenderError("Wallet not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    // Clear walletId from transactions
    for (const tx of ctx.db.Transaction.iter()) {
        if (tx.ownerId.toHexString() === ctx.sender.toHexString() && tx.walletId === id) {
            ctx.db.Transaction.id.delete(tx.id);
        }
    }

    ctx.db.Wallet.id.delete(id);
});
