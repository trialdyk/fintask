import { t, SenderError } from 'spacetimedb/server';
import spacetimedb, { TaskCategory, Task, TaskPriority } from './schema';

// --- Task Categories ---

export const create_task_category = spacetimedb.reducer({
    name: t.string(),
    icon: t.string(),
    color: t.string(),
}, (ctx, args) => {
    if (!args.name) throw new SenderError("Category name cannot be empty");

    ctx.db.TaskCategory.insert({
        id: 0n,
        ownerId: ctx.sender,
        name: args.name,
        icon: args.icon,
        color: args.color,
    });
});

export const update_task_category = spacetimedb.reducer({
    id: t.u64(),
    name: t.string(),
    icon: t.string(),
    color: t.string(),
}, (ctx, args) => {
    const existing = ctx.db.TaskCategory.id.find(args.id);
    if (!existing) throw new SenderError("Category not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    ctx.db.TaskCategory.id.update({
        ...existing,
        name: args.name,
        icon: args.icon,
        color: args.color,
    });
});

export const delete_task_category = spacetimedb.reducer({
    id: t.u64(),
}, (ctx, { id }) => {
    const existing = ctx.db.TaskCategory.id.find(id);
    if (!existing) throw new SenderError("Category not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    // Clear categoryId from tasks that were using it
    for (const task of ctx.db.Task.iter()) {
        if (task.ownerId.toHexString() === ctx.sender.toHexString() && task.categoryId === id) {
            ctx.db.Task.id.update({ ...task, categoryId: undefined });
        }
    }

    ctx.db.TaskCategory.id.delete(id);
});

// --- Tasks ---

export const create_task = spacetimedb.reducer({
    name: t.string(),
    deadline: t.timestamp().optional(),
    priority: TaskPriority,
    effort: t.u32().optional(),
    difficulty: t.u8().optional(),
    categoryId: t.u64().optional(),
    description: t.string().optional(),
    tags: t.array(t.string()),
}, (ctx, args) => {
    if (!args.name) throw new SenderError("Task name cannot be empty");

    if (args.categoryId !== undefined) {
        const cat = ctx.db.TaskCategory.id.find(args.categoryId);
        if (!cat || cat.ownerId.toHexString() !== ctx.sender.toHexString()) {
            throw new SenderError("Invalid category");
        }
    }

    ctx.db.Task.insert({
        id: 0n,
        ownerId: ctx.sender,
        name: args.name,
        deadline: args.deadline,
        priority: args.priority || { tag: 'medium' },
        effort: args.effort,
        difficulty: args.difficulty,
        categoryId: args.categoryId,
        description: args.description,
        tags: args.tags || [],
        isCompleted: false
    });
});

export const update_task = spacetimedb.reducer({
    id: t.u64(),
    name: t.string(),
    deadline: t.timestamp().optional(),
    priority: TaskPriority,
    effort: t.u32().optional(),
    difficulty: t.u8().optional(),
    categoryId: t.u64().optional(),
    description: t.string().optional(),
    tags: t.array(t.string()),
    isCompleted: t.bool()
}, (ctx, args) => {
    const existing = ctx.db.Task.id.find(args.id);
    if (!existing) throw new SenderError("Task not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");
    if (!args.name) throw new SenderError("Task name cannot be empty");

    if (args.categoryId !== undefined && args.categoryId !== existing.categoryId) {
        const cat = ctx.db.TaskCategory.id.find(args.categoryId);
        if (!cat || cat.ownerId.toHexString() !== ctx.sender.toHexString()) {
            throw new SenderError("Invalid category");
        }
    }

    ctx.db.Task.id.update({
        ...existing,
        name: args.name,
        deadline: args.deadline,
        priority: args.priority,
        effort: args.effort,
        difficulty: args.difficulty,
        categoryId: args.categoryId,
        description: args.description,
        tags: args.tags,
        isCompleted: args.isCompleted
    });
});

export const toggle_task_completion = spacetimedb.reducer({
    id: t.u64()
}, (ctx, { id }) => {
    const existing = ctx.db.Task.id.find(id);
    if (!existing) throw new SenderError("Task not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    ctx.db.Task.id.update({
        ...existing,
        isCompleted: !existing.isCompleted
    });
});

export const delete_task = spacetimedb.reducer({
    id: t.u64()
}, (ctx, { id }) => {
    const existing = ctx.db.Task.id.find(id);
    if (!existing) throw new SenderError("Task not found");
    if (existing.ownerId.toHexString() !== ctx.sender.toHexString()) throw new SenderError("Unauthorized");

    ctx.db.Task.id.delete(id);
});
