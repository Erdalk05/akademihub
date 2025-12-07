export function validateTCKN(value: string): boolean {
  value = value.toString();
  const isEleven = /^[0-9]{11}$/.test(value);
  const totalX =
    Number(value.substr(0, 1)) +
    Number(value.substr(1, 1)) +
    Number(value.substr(2, 1)) +
    Number(value.substr(3, 1)) +
    Number(value.substr(4, 1)) +
    Number(value.substr(5, 1)) +
    Number(value.substr(6, 1)) +
    Number(value.substr(7, 1)) +
    Number(value.substr(8, 1)) +
    Number(value.substr(9, 1));

  const isTen = Number(value.substr(10, 1)) % 2 === 0;
  const zero = Number(value.substr(0, 1)) !== 0;
  const ruleX = totalX % 10 === Number(value.substr(10, 1));

  if (!isEleven || !isTen || !zero || !ruleX) {
    return false;
  }
  
  // Detaylı algoritma kontrolü
  let odd = 0;
  let even = 0;
  
  for (let i = 0; i < 9; i++) {
    if (i % 2 === 0) {
      odd += Number(value[i]);
    } else {
      even += Number(value[i]);
    }
  }
  
  const rule2 = (odd * 7 - even) % 10 === Number(value[9]);
  const rule3 = (odd + even + Number(value[9])) % 10 === Number(value[10]);

  return rule2 && rule3;
}



