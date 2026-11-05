import {
    Diary,
    goals,
    meals,
    today
} from './model.mjs';
export const $ = id => document.getElementById(id);
export const diary = new Diary(window.localStorage);
export const number = value => new Intl.NumberFormat('en', {
    maximumFractionDigits: 2
}).format(value);
export const display = (value, unit) => value === null ? 'Unavailable' : number(value) + ' ' + unit;
export function setupFields() {
    for (const [key, label] of Object.entries(goals)) $('goal').add(new Option(label, key));
    for (const meal of meals) $('meal').add(new Option(meal, meal));
    $('date').max = $('date').value = today();
}
export function fields() {
    return {
        grams: $('grams').value,
        meal: $('meal').value,
        date: $('date').value,
        goal: $('goal').value
    };
}
export function message(id, text, error = false) {
    $(id).textContent = text;
    $(id).classList.toggle('error', error);
}
export function element(tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
}