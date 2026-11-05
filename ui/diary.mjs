import {
    portion,
    goals,
    nutrients,
    checkDate,
    today
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
$('filter').max = today();
$('filter').value = sessionStorage.getItem('diaryDate') || today();
let activeId;

function action(text, fn) {
    const button = element('button', text, 'secondary');
    button.type = 'button';
    button.addEventListener('click', fn);
    return button;
}

function render() {
    $('records').replaceChildren();
    $('total').textContent = '—';
    $('count').textContent = '';
    const date = checkDate($('filter').value);
    const rows = diary.all().filter(row => row.date === date);
    // Skip missing energy and explicitly identify partial totals.
    const known = rows.filter(row => row.food.values.energy !== null);
    const kcal = known.reduce((sum, row) => sum + portion(row.food.values.energy, row.grams), 0);
    $('total').textContent = rows.length && !known.length ? 'Unavailable' : display(kcal, 'kcal');
    $('count').textContent = rows.length + (rows.length === 1 ? ' record' : ' records') +
        (known.length < rows.length ? ' · energy available for ' + known.length : '');
    if (!rows.length) $('records').append(element('p', 'No intake recorded for this date. Use Add a food to start.', 'record'));
    for (const row of rows) {
        const card = element('article', '', 'record');
        const summary = nutrients.map(([key, label, unit]) =>
            label + ' ' + display(portion(row.food.values[key], row.grams), unit)).join(' · ');
        card.append(element('h3', row.food.name), element('p', row.meal + ' · ' + row.grams + ' g · ' + row.date),
            element('p', summary, 'muted'), element('p', goals[row.goal] + ' per 100 g. ' + row.recommendation, 'muted'));
        const actions = element('div', '', 'actions');
        actions.append(action('Edit', () => edit(row)), action('Delete', () => confirmDelete(row)));
        card.append(actions);
        $('records').append(card);
    }
}

function reload(notice = '') {
    try {
        render();
        message('status', notice);
    } catch (error) {
        message('status', error.message, true);
    }
}

function edit(row) {
    activeId = row.id;
    for (const key of ['date', 'meal', 'grams', 'goal']) $(key).value = row[key];
    $('editName').textContent = row.food.name;
    message('editStatus', '');
    $('editor').showModal();
}

function confirmDelete(row) {
    activeId = row.id;
    $('deleteName').textContent = 'Remove ' + row.grams + ' g of ' + row.food.name + ' from ' + row.date + '?';
    message('deleteStatus', '');
    $('confirm').showModal();
    $('deleteNo').focus();
}
$('editForm').addEventListener('input', () => message('editStatus', ''));
$('editForm').addEventListener('submit', event => {
    event.preventDefault();
    try {
        diary.update(activeId, fields());
        $('filter').value = $('date').value;
        sessionStorage.setItem('diaryDate', $('date').value);
        $('editor').close();
        reload('Changes saved.');
    } catch (error) {
        message('editStatus', error.message, true);
    }
});
$('deleteYes').addEventListener('click', () => {
    try {
        diary.remove(activeId);
        $('confirm').close();
        reload('Record deleted.');
    } catch (error) {
        message('deleteStatus', error.message, true);
    }
});
$('cancelEdit').addEventListener('click', () => $('editor').close());
$('deleteNo').addEventListener('click', () => $('confirm').close());
$('filter').addEventListener('change', () => {
    if ($('filter').value) sessionStorage.setItem('diaryDate', $('filter').value);
    reload();
});
reload();