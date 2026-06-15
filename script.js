const salaryInput = document.getElementById('salary');
const extraInput = document.getElementById('extraIncome');
const fixedNameInput = document.getElementById('fixedName');
const fixedValueInput = document.getElementById('fixedValue');
const variableNameInput = document.getElementById('variableName');
const variableValueInput = document.getElementById('variableValue');
const addFixedBtn = document.getElementById('addFixedBtn');
const addVariableBtn = document.getElementById('addVariableBtn');
const resetBtn = document.getElementById('resetBtn');
const fixedTable = document.querySelector('#fixedTable tbody');
const variableTable = document.querySelector('#variableTable tbody');
const totalIncomeEl = document.getElementById('totalIncome');
const totalFixedEl = document.getElementById('totalFixed');
const totalVariableEl = document.getElementById('totalVariable');
const netSavingsEl = document.getElementById('netSavings');
const savingsPercentEl = document.getElementById('savingsPercent');
const monthSelect = document.getElementById('monthSelect');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

const STORAGE_KEY = 'porquinho_inteligente_state_v2';

const now = new Date();
const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const state = {
  windowStart: { year: now.getFullYear(), month: now.getMonth() - 5 },
  selectedMonthIndex: 5,
  monthHistory: [],
};

function getWindowStartDate() {
  return new Date(state.windowStart.year, state.windowStart.month, 1);
}

function getMonthByIndex(index) {
  const start = getWindowStartDate();
  return new Date(start.getFullYear(), start.getMonth() + index, 1);
}

function getMonthLabel(index) {
  const date = getMonthByIndex(index);
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function createEmptyMonth() {
  return {
    salary: 0,
    extraIncome: 0,
    fixedExpenses: [],
    variableExpenses: [],
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const isValidHistory = Array.isArray(parsed.monthHistory) && parsed.monthHistory.length === 12;
      const isValidWindow = parsed.windowStart && typeof parsed.windowStart.year === 'number' && typeof parsed.windowStart.month === 'number';
      const isValidIndex = typeof parsed.selectedMonthIndex === 'number' && parsed.selectedMonthIndex >= 0 && parsed.selectedMonthIndex < 12;
      if (isValidHistory && isValidWindow && isValidIndex) {
        state.windowStart = parsed.windowStart;
        state.selectedMonthIndex = parsed.selectedMonthIndex;
        state.monthHistory = parsed.monthHistory.map((month) => ({
          salary: Number(month.salary) || 0,
          extraIncome: Number(month.extraIncome) || 0,
          fixedExpenses: Array.isArray(month.fixedExpenses) ? month.fixedExpenses : [],
          variableExpenses: Array.isArray(month.variableExpenses) ? month.variableExpenses : [],
        }));
        return;
      }
    }
  } catch (error) {
    console.warn('Falha ao carregar dados:', error);
  }

  state.windowStart = { year: now.getFullYear(), month: now.getMonth() - 5 };
  state.selectedMonthIndex = 5;
  state.monthHistory = Array.from({ length: 12 }, () => createEmptyMonth());
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentMonth() {
  return state.monthHistory[state.selectedMonthIndex];
}

function getTotals() {
  const month = getCurrentMonth();
  const totalFixed = month.fixedExpenses.reduce((sum, item) => sum + item.value, 0);
  const totalVariable = month.variableExpenses.reduce((sum, item) => sum + item.value, 0);
  const totalIncome = month.salary + month.extraIncome;
  const netSavings = Math.max(totalIncome - totalFixed - totalVariable, 0);
  const savingsPercent = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  return { totalFixed, totalVariable, totalIncome, netSavings, savingsPercent };
}

function renderSummary() {
  const { totalFixed, totalVariable, totalIncome, netSavings, savingsPercent } = getTotals();
  totalIncomeEl.textContent = formatCurrency(totalIncome);
  totalFixedEl.textContent = formatCurrency(totalFixed);
  totalVariableEl.textContent = formatCurrency(totalVariable);
  netSavingsEl.textContent = formatCurrency(netSavings);
  savingsPercentEl.textContent = `${savingsPercent.toFixed(1)}%`;
}

function renderTables() {
  fixedTable.innerHTML = '';
  variableTable.innerHTML = '';

  getCurrentMonth().fixedExpenses.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${formatCurrency(item.value)}</td>
      <td><button type="button" class="small-button" data-type="fixed" data-index="${index}">Remover</button></td>
    `;
    fixedTable.appendChild(row);
  });

  getCurrentMonth().variableExpenses.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${formatCurrency(item.value)}</td>
      <td><button type="button" class="small-button" data-type="variable" data-index="${index}">Remover</button></td>
    `;
    variableTable.appendChild(row);
  });
}

function updateInputs() {
  const month = getCurrentMonth();
  salaryInput.value = month.salary || '';
  extraInput.value = month.extraIncome || '';
}

function renderMonthOptions() {
  monthSelect.innerHTML = '';
  state.monthHistory.forEach((_, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = getMonthLabel(index);
    monthSelect.appendChild(option);
  });
  monthSelect.value = state.selectedMonthIndex;
  updateNavigationButtons();
}

function updateNavigationButtons() {
  prevMonthBtn.disabled = state.selectedMonthIndex === 0;
  nextMonthBtn.disabled = state.selectedMonthIndex === state.monthHistory.length - 1;
}

function updateState() {
  const month = getCurrentMonth();
  month.salary = Number(salaryInput.value) || 0;
  month.extraIncome = Number(extraInput.value) || 0;
  saveState();
  renderSummary();
}

function addExpense(type) {
  const nameInput = type === 'fixed' ? fixedNameInput : variableNameInput;
  const valueInput = type === 'fixed' ? fixedValueInput : variableValueInput;
  const name = nameInput.value.trim();
  const value = Number(valueInput.value) || 0;
  if (!name || value <= 0) return;

  const item = { name, value };
  if (type === 'fixed') {
    getCurrentMonth().fixedExpenses.push(item);
  } else {
    getCurrentMonth().variableExpenses.push(item);
  }

  nameInput.value = '';
  valueInput.value = '';
  renderTables();
  renderSummary();
  saveState();
}

function removeExpense(type, index) {
  if (type === 'fixed') {
    getCurrentMonth().fixedExpenses.splice(index, 1);
  } else {
    getCurrentMonth().variableExpenses.splice(index, 1);
  }
  renderTables();
  renderSummary();
  saveState();
}

function clearState() {
  const month = getCurrentMonth();
  month.salary = 0;
  month.extraIncome = 0;
  month.fixedExpenses = [];
  month.variableExpenses = [];
  updateInputs();
  renderTables();
  renderSummary();
  saveState();
}

function selectMonth(index) {
  if (index < 0 || index >= state.monthHistory.length) return;
  state.selectedMonthIndex = index;
  monthSelect.value = index;
  updateInputs();
  renderTables();
  renderSummary();
  updateNavigationButtons();
  saveState();
}

function handleTableClick(event) {
  const button = event.target.closest('button');
  if (!button || !button.dataset.type) return;
  const type = button.dataset.type;
  const index = Number(button.dataset.index);
  removeExpense(type, index);
}

salaryInput.addEventListener('input', updateState);
extraInput.addEventListener('input', updateState);
addFixedBtn.addEventListener('click', () => addExpense('fixed'));
addVariableBtn.addEventListener('click', () => addExpense('variable'));
resetBtn.addEventListener('click', clearState);
fixedTable.addEventListener('click', handleTableClick);
variableTable.addEventListener('click', handleTableClick);
monthSelect.addEventListener('change', () => selectMonth(Number(monthSelect.value)));
prevMonthBtn.addEventListener('click', () => selectMonth(state.selectedMonthIndex - 1));
nextMonthBtn.addEventListener('click', () => selectMonth(state.selectedMonthIndex + 1));

loadState();
renderMonthOptions();
updateInputs();
renderTables();
renderSummary();

