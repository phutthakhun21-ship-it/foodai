// คีย์ใน localStorage
const LS_KEY = 'foodAppSelections';

function getSelections() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || { ingredients: [], budget: 0 };
  } catch {
    return { ingredients: [], budget: 0 };
  }
}

function saveSelections(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

// เรนเดอร์ checkbox วัตถุดิบจาก ingredientCosts
function renderIngredientCheckboxes(containerId) {
  const container = document.getElementById(containerId);
  const entries = Object.keys(ingredientCosts).sort();
  container.innerHTML = entries.map(name => `
    <label class="ingredient-item">
      <input type="checkbox" class="ingredient-checkbox" value="${name}">
      <span>${name}</span>
    </label>
  `).join('');
}

// กู้คืนค่าที่เคยเลือกไว้
function restoreSelections(budgetInputId) {
  const data = getSelections();
  const checkboxes = document.querySelectorAll('.ingredient-checkbox');
  checkboxes.forEach(cb => { cb.checked = data.ingredients.includes(cb.value); });
  const budgetEl = document.getElementById(budgetInputId);
  if (budgetEl) budgetEl.value = data.budget || '';
}

// บันทึกค่าจากหน้า input แล้วไปหน้า results
function handleFindClick(budgetInputId) {
  const selectedIngredients = Array.from(document.querySelectorAll('.ingredient-checkbox:checked')).map(cb => cb.value);
  const budget = parseInt(document.getElementById(budgetInputId).value) || 0;

  if (selectedIngredients.length === 0 && budget === 0) {
    alert('กรุณาเลือกวัตถุดิบหรือใส่งบประมาณอย่างน้อย 1 อย่างนะ!');
    return;
  }

  saveSelections({ ingredients: selectedIngredients, budget });
  window.location.href = './results.html';
}

// สร้างผลลัพธ์จาก selections ที่เก็บไว้
function renderResults(containerId) {
  const { ingredients: selectedIngredients, budget } = getSelections();
  const resultsDiv = document.getElementById(containerId);

  const matchingRecipes = recipes
    .map(recipe => {
      const ownedIngredients = [];
      const needToBuy = [];
      let totalCost = 0;

      recipe.ingredients.forEach(ing => {
        if (selectedIngredients.includes(ing)) {
          ownedIngredients.push(ing);
        } else {
          needToBuy.push(ing);
          totalCost += ingredientCosts[ing] || 0;
        }
      });

      const originalCost = recipe.ingredients.reduce((s, ing) => s + (ingredientCosts[ing] || 0), 0);
      const savings = originalCost - totalCost;

      return { ...recipe, adjustedCost: totalCost, ownedIngredients, needToBuy, originalCost, savings };
    })
    .filter(r => (budget > 0 ? r.adjustedCost <= budget : r.ownedIngredients.length > 0))
    .sort((a, b) => (b.ownedIngredients.length - a.ownedIngredients.length) || (a.adjustedCost - b.adjustedCost));

  if (matchingRecipes.length === 0) {
    resultsDiv.innerHTML = `
      <div class="text-center text-pink-500 py-8">
        <div class="text-4xl mb-4">😔</div>
        <p>ไม่พบเมนูที่เหมาะสม</p>
        <p class="text-sm mt-2">ลองเพิ่มวัตถุดิบหรือเพิ่มงบประมาณดูนะ</p>
      </div>
    `;
    return;
  }

  resultsDiv.innerHTML = `
    <div class="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
      <p class="text-pink-700 font-medium text-center">🎉 พบ ${matchingRecipes.length} เมนูที่เหมาะสม!</p>
    </div>
    ${matchingRecipes.map(recipe => `
      <div class="bg-white rounded-xl p-6 border border-pink-200 hover:shadow-lg transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-4 flex-1">
            <span class="text-3xl">${recipe.emoji}</span>
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-pink-800 mb-2">${recipe.name}</h3>
              ${recipe.ownedIngredients.length > 0 ? `<p class="text-sm text-green-600 mb-1">✅ มีแล้ว: ${recipe.ownedIngredients.join(', ')}</p>` : ''}
              ${recipe.needToBuy.length > 0 ? `
                <p class="text-sm text-orange-600 mb-1">🛒 ต้องซื้อเพิ่ม: ${recipe.needToBuy.map(i => `${i} ${ingredientCosts[i]||0}บาท`).join(', ')}</p>
                <p class="text-xs text-pink-700 font-medium">💰 รวมต้องซื้อเพิ่มอีก ${recipe.adjustedCost} บาท</p>
              ` : `<p class="text-sm text-green-600">🎉 ไม่ต้องซื้อวัตถุดิบเพิ่ม!</p>`}
            </div>
          </div>
          <div class="text-right">
            ${recipe.savings > 0
              ? `<div class="text-xs text-gray-500 line-through">${recipe.originalCost} บาท</div>
                 <span class="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">${recipe.adjustedCost} บาท</span>
                 <div class="text-xs text-pink-600 mt-1">ประหยัด ${recipe.savings} บาท!</div>`
              : `<span class="bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-medium">${recipe.adjustedCost} บาท</span>`}
          </div>
        </div>
      </div>
    `).join('')}
  `;
}
