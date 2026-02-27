// Placeholder for client-side utilities
console.log('Sistema de Gestão carregado');

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

// Set today's date in date inputs by default
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type="date"]:not([value])');
  dateInputs.forEach(input => {
    if (!input.value) {
      input.value = today;
    }
  });
});
