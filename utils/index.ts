export const apenasDigitos = (v: string) => v.replace(/\D/g, "");

export const validarCPF = (cpf: string): boolean => {
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

export const validarCNPJ = (cnpj: string): boolean => {
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

export const formatarCPF = (v: string) => {
  const d = apenasDigitos(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

export const formatarCNPJ = (v: string) => {
  const d = apenasDigitos(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};


export const formatarData = (text: string) => {
  const numeros = text.replace(/\D/g, "");

  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;

  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
};

export const formatarHorario = (text: string) => {
  const numeros = text.replace(/\D/g, "").slice(0, 4);

  if (numeros.length <= 2) return numeros;

  return `${numeros.slice(0, 2)}:${numeros.slice(2)}`;
};

export const dataValida = (data: string) => {
  const partes = data.split("/");
  if (partes.length !== 3) return false;

  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  const ano = Number(partes[2]);

  if (!dia || !mes || !ano) return false;
  if (mes < 1 || mes > 12) return false;

  const ultimoDia = new Date(ano, mes, 0).getDate();
  if (dia < 1 || dia > ultimoDia) return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const informada = new Date(ano, mes - 1, dia);
  informada.setHours(0, 0, 0, 0);

  return informada >= hoje;
};

