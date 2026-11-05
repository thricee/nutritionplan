import test from 'node:test';
import assert from 'node:assert/strict';
import api from '../usda.js';
import {
    Diary,
    matches,
    portion,
    checkGrams,
    checkDate,
    today
} from '../ui/model.mjs';
const food = {
    id: 173944,
    name: 'Bananas, raw',
    values: {
        energy: 89,
        protein: 1.09,
        carbs: 22.8,
        fat: 0.33,
        fibre: 2.6,
        sodium: 1
    }
};

test('USDA fields use ID and unit; missing values stay unknown', () => {
    const row = api.readFood({
        fdcId: 1,
        description: 'Test',
        foodNutrients: [{
            nutrientId: 1008,
            unitName: 'KJ',
            value: 400
        }, {
            nutrientId: 1003,
            unitName: 'G',
            value: 0
        }]
    });
    assert.equal(row.values.energy, null);
    assert.equal(row.values.protein, 0);
});
test('API failure, quota, invalid data and empty results', async () => {
    await assert.rejects(api.searchFoods('x'), /2 to 80/);
    await assert.rejects(api.searchFoods('aa', async () => {
        throw Error();
    }), /connection/);
    await assert.rejects(api.searchFoods('aa', async () => ({
        status: 429
    })), /limit/);
    await assert.rejects(api.searchFoods('aa', async () => ({
        status: 503
    })), /503/);
    await assert.rejects(api.searchFoods('aa', async () => ({
        ok: true,
        json: async () => ({})
    })), /unreadable/);
    assert.deepEqual(await api.searchFoods('aa', async () => ({
        ok: true,
        json: async () => ({
            foods: []
        })
    })), []);
});
test('all three target boundaries and missing data', () => {
    for (const [goal, limit, misses] of [
            ['protein', 10, 9.99],
            ['fibre', 3, 2.99],
            ['sodium', 120, 120.01]
        ]) {
        assert.equal(matches({
            values: {
                [goal]: limit
            }
        }, goal), true);
        assert.equal(matches({
            values: {
                [goal]: misses
            }
        }, goal), false);
        assert.equal(matches({
            values: {
                [goal]: null
            }
        }, goal), false);
    }
});
test('portions, unit conversion and input bounds', () => {
    assert.equal(portion(89, 150), 133.5);
    assert.equal(portion(null, 100), null);
    for (const n of [0.1, 4999.9, 5000]) assert.equal(checkGrams(n), n);
    for (const n of ['', 0, -1, NaN, Infinity, 5000.1, 1.25]) assert.throws(() => checkGrams(n));
    for (const d of ['', '2025-02-29', '2999-01-01']) assert.throws(() => checkDate(d));
});
test('read, edit and delete through a reopened diary; malformed storage preserved', () => {
    const storage = {
        raw: null,
        getItem() {
            return this.raw;
        },
        setItem(k, v) {
            this.raw = v;
        }
    };
    const row = new Diary(storage).add({
        food,
        goal: 'sodium',
        grams: 150,
        date: today(),
        meal: 'Breakfast'
    });
    const reopened = new Diary(storage);
    assert.equal(reopened.all()[0].recommendation, 'Meets the target with 1 mg per 100 g.');
    reopened.update(row.id, {
        grams: 200,
        meal: 'Snack'
    });
    assert.equal(new Diary(storage).all()[0].grams, 200);
    assert.throws(() => reopened.update(row.id, {
        grams: 0
    }));
    reopened.remove(row.id);
    assert.deepEqual(new Diary(storage).all(), []);
    storage.raw = 'broken';
    assert.throws(() => reopened.add(row), /preserved/);
    assert.equal(storage.raw, 'broken');
});