export const nutrients = [
    ['energy', 'Energy', 'kcal'],
    ['protein', 'Protein', 'g'],
    ['carbs', 'Carbohydrate', 'g'],
    ['fat', 'Fat', 'g'],
    ['fibre', 'Fibre', 'g'],
    ['sodium', 'Sodium', 'mg']
];
export const goals = {
    fibre: 'Fibre · at least 3 g',
    protein: 'Protein · at least 10 g',
    sodium: 'Sodium · at most 120 mg'
};
export function matches(food, goal) {
    const value = food.values[goal];
    if (!Number.isFinite(value)) return false;
    switch (goal) {
        case 'fibre':
            return value >= 3;
        case 'protein':
            return value >= 10;
        case 'sodium':
            return value <= 120;
        default:
            return false;
    }
}
export function suggestion(food, goal) {
    if (!matches(food, goal)) return 'Does not meet the selected target or the value is unavailable.';
    return 'Meets the target with ' + food.values[goal] + (goal === 'sodium' ? ' mg' : ' g') + ' per 100 g.';
}
export function checkGrams(raw) {
    const grams = Number(raw);
    if (!Number.isFinite(grams) || grams < 0.1 || grams > 5000 || !Number.isInteger(grams * 10))
        throw new Error('Enter a portion from 0.1 to 5,000 g in steps of 0.1 g.');
    return grams;
}
export function portion(value, grams) {
    return value === null ? null : value * checkGrams(grams) / 100;
}
export function today() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
export function checkDate(date) {
    const parsed = new Date(date + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date || date > today())
        throw new Error('Choose a real intake date on or before today.');
    return date;
}
export const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function validFood(food) {
    return Number.isInteger(food?.id) && typeof food.name === 'string' && food.name.trim() &&
        nutrients.every(([key]) => food.values?.[key] === null ||
            (Number.isFinite(food.values?.[key]) && food.values[key] >= 0));
}
// The record keeps the USDA snapshot and the suggestion shown when it was saved.
export class IntakeRecord {
    constructor({
        id,
        food,
        grams,
        date,
        meal,
        goal
    }) {
        if (!validFood(food) || !Object.hasOwn(goals, goal) || !meals.includes(meal) || typeof id !== 'string' || !id)
            throw new Error('Select a valid food, target and meal.');
        Object.assign(this, {
            id,
            food,
            grams: checkGrams(grams),
            date: checkDate(date),
            meal,
            goal,
            recommendation: suggestion(food, goal)
        });
    }
}
export class Diary {
    constructor(storage) {
        this.storage = storage;
        this.key = 'nutritionplan.diary.v1';
    }
    all() {
        try {
            const raw = this.storage.getItem(this.key);
            if (raw === null) return [];
            return JSON.parse(raw).map(row => new IntakeRecord(row));
        } catch {
            throw new Error('The saved diary could not be read. Your existing data has been preserved.');
        }
    }
    write(rows) {
        try {
            this.storage.setItem(this.key, JSON.stringify(rows));
        } catch {
            throw new Error('Could not save the diary. Check available storage and try again.');
        }
    }
    add(data) {
        const record = new IntakeRecord({
            ...data,
            id: crypto.randomUUID()
        });
        this.write([...this.all(), record]);
        return record;
    }
    update(id, changes) {
        const rows = this.all();
        const index = rows.findIndex(row => row.id === id);
        if (index < 0) throw new Error('This record no longer exists.');
        rows[index] = new IntakeRecord({
            ...rows[index],
            ...changes,
            id
        });
        this.write(rows);
    }
    remove(id) {
        const rows = this.all();
        if (!rows.some(row => row.id === id)) throw new Error('This record no longer exists.');
        this.write(rows.filter(row => row.id !== id));
    }
}