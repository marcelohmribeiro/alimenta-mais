const apenasDigitos = (v: string) => v.replace(/\D/g, "");

const validarCPF = (cpf: string): boolean => {
  const d = apenasDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(d[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(d[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(d[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(d[10]);
};

const validarCNPJ = (cnpj: string): boolean => {
  const d = apenasDigitos(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (str: string, len: number) => {
    let soma = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      soma += parseInt(str[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const res = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return res === parseInt(str[len]);
  };
  return calc(d, 12) && calc(d, 13);
};

const formatarCPF = (v: string) => {
  const d = apenasDigitos(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const formatarCNPJ = (v: string) => {
  const d = apenasDigitos(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

export { apenasDigitos, formatarCNPJ, formatarCPF, validarCNPJ, validarCPF };
