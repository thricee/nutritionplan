// SR Legacy search values describe 100 g of edible food. Match IDs AND units.
const fields = {
    energy: [1008, 'KCAL'],
    protein: [1003, 'G'],
    carbs: [1005, 'G'],
    fat: [1004, 'G'],
    fibre: [1079, 'G'],
    sodium: [1093, 'MG']
};

function readFood(row) {
    const values = {};
    for (const [key, [id, unit]] of Object.entries(fields)) {
        const nutrient = row.foodNutrients?.find(item =>
            item.nutrientId === id && item.unitName?.toUpperCase() === unit);
        const value = nutrient?.value;
        values[key] = Number.isFinite(value) && value >= 0 ? value : null;
    }
    return {
        id: row.fdcId,
        name: row.description.trim(),
        values
    };
}

async function searchFoods(query, fetcher = fetch) {
    if (typeof query !== 'string' || query.trim().length < 2 || query.trim().length > 80)
        throw new Error('Enter a food name with 2 to 80 characters.');
    const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
    url.search = new URLSearchParams({
        api_key: process.env.FDC_API_KEY || 'DEMO_KEY',
        query: query.trim(),
        dataType: 'SR Legacy',
        pageSize: '15'
    });
    let response;
    try {
        response = await fetcher(url, {
            signal: AbortSignal.timeout(15000)
        });
    } catch {
        throw new Error('USDA could not be reached. Check your connection and search again.');
    }
    if (response.status === 429) throw new Error('USDA search limit reached. Try later or use your own USDA key.');
    if (!response.ok) throw new Error('USDA could not complete the search (HTTP ' + response.status + '). Try again later.');
    try {
        const data = await response.json();
        if (!Array.isArray(data.foods)) throw new Error();
        return data.foods.filter(row => Number.isInteger(row?.fdcId) && row.description?.trim() &&
            Array.isArray(row.foodNutrients)).map(readFood);
    } catch {
        throw new Error('USDA returned unreadable food data. Please try again.');
    }
}
module.exports = {
    searchFoods,
    readFood
};