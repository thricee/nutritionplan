# NutritionPlan

An Electron desktop application for CSC2923. Food lookup searches USDA FoodData Central SR Legacy records and scales six nutrient values to the portion eaten. Food diary stores dated intake records and their nutrient-target suggestions in Local Storage.

## Run from source

Install Node.js 24 LTS. Open Command Prompt in the folder containing package.json.

```bat
npm ci
npm test
npm start
```

Electron may download its runtime on first launch. Food searches need internet access. The default public USDA demonstration key is rate limited. To use your own key, set the FDC_API_KEY environment variable in the same command window before starting the app. Never commit a personal key.

## Build for Windows x64

Close the app, then run:

```bat
npm run package:win
```

Open dist/NutritionPlan-win32-x64/NutritionPlan.exe. Keep that whole folder together when distributing it. This portable application stores the diary under the current Windows user's Electron application data. Use the same Windows account and app profile to reopen it.

## Example

Search for banana, select Bananas, raw (FDC 173944), choose the sodium target, and enter 150 g. At 89 kcal per 100 g, the portion contains 133.5 kcal. Save it, open Food diary, edit the portion to 200 g, and verify the updated 178 kcal. Delete the record to remove it from the selected date.

## Project files

- main.js opens the Electron window and serves the two pages under one persistent origin.
- preload.js exposes only the food search operation.
- usda.js searches the API, checks the reply and maps six nutrient IDs to the correct units.
- ui/model.mjs contains IntakeRecord, Diary, validation, target rules and portion arithmetic.
- ui/index.html and ui/lookup.mjs implement food lookup. ui/diary.html and ui/diary.mjs implement the diary.
- ui/common.mjs and ui/styles.css provide shared controls and presentation.
- test/nutrition.test.mjs checks calculations, thresholds, errors and persistence.

Nutrient data: U.S. Department of Agriculture, Agricultural Research Service. [FoodData Central](https://fdc.nal.usda.gov/api-guide/).
