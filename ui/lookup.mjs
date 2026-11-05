import {
    nutrients,
    portion,
    matches,
    suggestion,
    checkGrams
} from './model.mjs';
import {
    $,
    diary,
    display,
    setupFields,
    fields,
    message,
    element
} from './common.mjs';
setupFields();
let foods = [];
let request = 0;
const selected = () => foods[$('foods').selectedIndex];

async function search(event) {
    event.preventDefault();
    const current = ++request;
    const query = $('query').value.trim();
    foods = [];
    $('results').hidden = true;
    message('saveStatus', '');
    if (query.length < 2 || query.length > 80) {
        message('searchStatus', 'Enter a food name with 2 to 80 characters.', true);
        return;
    }
    message('searchStatus', 'Searching USDA for “' + query + '”…');
    try {
        const reply = await window.nutrition.search(query);
        if (current !== request) return; // A newer search owns the screen.
        if (reply.error) throw new Error(reply.error);
        foods = reply.foods;
        if (!foods.length) {
            message('searchStatus', 'No foods found for “' + query + '”. Try another name.');
            return;
        }
        $('foods').replaceChildren(...foods.map(food => new Option(food.name, food.id)));
        $('results').hidden = false;
        message('searchStatus', foods.length + ' search results for “' + query + '”. Choose a food below.');
        refresh();
    } catch (error) {
        if (current === request) message('searchStatus', error.message, true);
    }
}

function renderPortion() {
    let grams;
    try {
        grams = checkGrams($('grams').value);
    } catch {
        grams = null;
    }
    const rows = nutrients.map(([key, label, unit]) => {
        const value = selected().values[key];
        const row = document.createElement('tr');
        row.append(element('td', label), element('td', display(value, unit)),
            element('td', grams === null ? 'Check portion' : display(portion(value, grams), unit)));
        return row;
    });
    $('nutrients').replaceChildren(...rows);
}

function refresh() {
    const food = selected();
    const goal = $('goal').value;
    const first = foods.find(candidate => matches(candidate, goal));
    const match = matches(food, goal);
    $('foodName').textContent = food.name;
    $('source').textContent = 'USDA FoodData Central · SR Legacy · FDC ' + food.id;
    $('suggestion').textContent = match ? suggestion(food, goal) : first ?
        'This food misses the target. A matching search result is available.' :
        'No suitable food in these results for this target. Try a different search or target.';
    $('useMatch').hidden = !first || match;
    $('useMatch').textContent = first ? 'Choose ' + first.name : '';
    message('saveStatus', '');
    renderPortion();
}
$('useMatch').addEventListener('click', () => {
    $('foods').selectedIndex = foods.findIndex(food => matches(food, $('goal').value));
    refresh();
});
$('searchForm').addEventListener('submit', search);
document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => {
    $('query').value = button.dataset.query;
    $('searchForm').requestSubmit();
}));
$('foods').addEventListener('change', refresh);
$('goal').addEventListener('change', refresh);
$('entry').addEventListener('input', () => message('saveStatus', ''));
$('grams').addEventListener('input', renderPortion);
$('entry').addEventListener('submit', event => {
    event.preventDefault();
    try {
        diary.add({
            food: selected(),
            ...fields()
        });
        message('saveStatus', 'Saved to your food diary for ' + $('date').value + '.');
        sessionStorage.setItem('diaryDate', $('date').value);
    } catch (error) {
        message('saveStatus', error.message, true);
    }
});